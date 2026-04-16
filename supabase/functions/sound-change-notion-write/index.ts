import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Chunk {
  original: string;
  phonetic: string;
  rule: string;
}

interface RequestBody {
  chunks: Chunk[];
  type: string;
  sentence: string;
  translation: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "認証が必要です" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user?.email) {
      return new Response(
        JSON.stringify({ error: "認証に失敗しました" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    const { chunks, type, sentence, translation } = body;

    if (!chunks || chunks.length === 0 || !type) {
      return new Response(
        JSON.stringify({ error: "chunks and type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: notionSettings, error: settingsError } = await adminClient
      .from("user_notion")
      .select("notion_api_key, db_id_chunk")
      .eq("email", user.email)
      .maybeSingle();

    if (settingsError || !notionSettings?.notion_api_key || !notionSettings?.db_id_chunk) {
      return new Response(
        JSON.stringify({ error: "Notion設定が未完了です。アップグレードが必要です。" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { notion_api_key, db_id_chunk } = notionSettings;

    const results: Array<{ success: boolean; original: string; error?: string }> = [];

    for (const chunk of chunks) {
      const payload = {
        parent: { database_id: db_id_chunk },
        properties: {
          Name: {
            title: [{ text: { content: type } }],
          },
          Status: {
            status: { name: "覚え中" },
          },
          genru: {
            select: { name: "ai" },
          },
          ENG: {
            rich_text: [{ text: { content: chunk.original } }],
          },
          "e.g.ENG": {
            rich_text: [{ text: { content: sentence || "" } }],
          },
          "e.g.JPN": {
            rich_text: [{ text: { content: translation || "" } }],
          },
        },
      };

      const notionRes = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notion_api_key}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify(payload),
      });

      if (notionRes.ok) {
        results.push({ success: true, original: chunk.original });
      } else {
        let errDetail = `HTTP ${notionRes.status}`;
        try {
          const errData = await notionRes.json();
          errDetail = errData.message
            ? `${errData.code ? errData.code + ': ' : ''}${errData.message}`
            : JSON.stringify(errData);
        } catch (_) {
          errDetail = `HTTP ${notionRes.status} (レスポンス解析失敗)`;
        }
        results.push({ success: false, original: chunk.original, error: errDetail });
      }
    }

    const allSuccess = results.every((r) => r.success);
    const anySuccess = results.some((r) => r.success);

    return new Response(
      JSON.stringify({ success: allSuccess, anySuccess, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
