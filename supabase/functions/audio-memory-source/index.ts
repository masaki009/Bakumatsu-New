import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotionProperty {
  id: string;
  type: string;
  [key: string]: unknown;
}

interface NotionPage {
  id: string;
  properties: Record<string, NotionProperty>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "認証が必要です" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user || !user.email) {
      return new Response(
        JSON.stringify({ error: "認証に失敗しました" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "完璧";
    const debug = url.searchParams.get("debug") === "1";

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: notionSettings, error: settingsError } = await adminClient
      .from("user_notion")
      .select("notion_api_key, db_id_chunk")
      .eq("email", user.email)
      .maybeSingle();

    if (settingsError) {
      console.error("user_notion fetch error:", settingsError);
      return new Response(
        JSON.stringify({ items: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!notionSettings?.notion_api_key || !notionSettings?.db_id_chunk) {
      return new Response(
        JSON.stringify({ items: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const queryBody = debug
      ? { page_size: 100 }
      : {
          page_size: 100,
          filter: {
            property: "Status",
            status: { equals: status },
          },
        };

    const notionResponse = await fetch(
      `https://api.notion.com/v1/databases/${notionSettings.db_id_chunk}/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${notionSettings.notion_api_key}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queryBody),
      }
    );

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error("Notion API error:", notionResponse.status, errorText);
      return new Response(
        JSON.stringify({ items: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await notionResponse.json();

    const mapPage = (page: NotionPage) => {
      const properties = page.properties;

      const filesKey = Object.keys(properties).find(
        k => k.toLowerCase().replace(/[\s&]/g, "") === "filesmedia"
      );
      let audioUrl = "";
      if (filesKey && properties[filesKey]?.type === "files") {
        const files = (properties[filesKey].files as Array<{
          name: string;
          file?: { url: string };
          external?: { url: string };
        }>) || [];
        const mp3File = files.find(f => f.name.toLowerCase().endsWith(".mp3"));
        if (mp3File) {
          audioUrl = mp3File.file?.url || mp3File.external?.url || "";
        }
      }

      const engKey = Object.keys(properties).find(
        k => k.toUpperCase() === "ENG"
      );
      let engText = "";
      if (engKey && properties[engKey]?.type === "rich_text") {
        engText = (properties[engKey].rich_text as Array<{ plain_text: string }>)?.[0]?.plain_text || "";
      }

      return { audioUrl, engText };
    };

    if (debug) {
      const getStatus = (prop: NotionProperty): string => {
        if (!prop) return "";
        if (prop.type === "status") return (prop.status as { name: string })?.name || "";
        if (prop.type === "select") return (prop.select as { name: string })?.name || "";
        return "";
      };

      const firstPageKeys = data.results.length > 0
        ? Object.entries((data.results[0] as NotionPage).properties).map(([k, v]) => ({
            key: k,
            type: (v as NotionProperty).type,
          }))
        : [];

      const statusCounts: Record<string, number> = {};
      (data.results as NotionPage[]).forEach(page => {
        const statusKey = Object.keys(page.properties).find(k => k.toLowerCase() === "status");
        const statusProp = statusKey ? page.properties[statusKey] : undefined;
        const s = statusProp ? getStatus(statusProp) : "(empty)";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });

      return new Response(
        JSON.stringify({
          totalPages: data.results.length,
          propertyKeys: firstPageKeys,
          statusDistribution: statusCounts,
          requestedStatus: status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const items = (data.results as NotionPage[])
      .map(mapPage)
      .filter(item => item.audioUrl !== "")
      .slice(0, 8);

    return new Response(
      JSON.stringify({ items }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ items: [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
