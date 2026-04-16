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
  url: string;
  created_time: string;
  last_edited_time: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
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

    const url = new URL(req.url);
    const dbType = url.searchParams.get("db_type") || "chunk";

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: notionSettings, error: settingsError } = await adminClient
      .from("user_notion")
      .select("notion_api_key, db_id_chunk")
      .eq("email", user.email)
      .maybeSingle();

    if (settingsError) {
      console.error("user_notion fetch error:", settingsError);
      return new Response(
        JSON.stringify({ error: "設定の取得中にエラーが発生しました。事務局にお問い合わせください。" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!notionSettings || !notionSettings.notion_api_key || !notionSettings.db_id_chunk) {
      return new Response(
        JSON.stringify({ error: "Notion設定が未完了です。アップグレードが必要です。" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notionApiKey = notionSettings.notion_api_key;
    let dbId: string;

    if (dbType === "chunk") {
      dbId = notionSettings.db_id_chunk;
    } else {
      return new Response(
        JSON.stringify({ error: `未対応のdb_typeです: ${dbType}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notionResponse = await fetch(
      `https://api.notion.com/v1/databases/${dbId}/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${notionApiKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page_size: 100 }),
      }
    );

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error("Notion API error:", notionResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: `Notion APIエラーが発生しました (${notionResponse.status})。設定内容をご確認の上、事務局にお問い合わせください。`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await notionResponse.json();

    const formattedResults = data.results.map((page: NotionPage) => {
      const properties = page.properties;

      const getName = (prop: NotionProperty) => {
        if (!prop) return "";
        if (prop.type === "title") {
          return (prop.title as Array<{ plain_text: string }>)?.[0]?.plain_text || "";
        }
        return "";
      };

      const getUrl = (prop: NotionProperty) => {
        if (!prop) return "";
        if (prop.type === "url") return (prop.url as string) || "";
        return "";
      };

      const getStatus = (prop: NotionProperty) => {
        if (!prop) return "";
        if (prop.type === "status") return (prop.status as { name: string })?.name || "";
        return "";
      };

      const getFiles = (prop: NotionProperty) => {
        if (!prop) return [];
        if (prop.type === "files") {
          return ((prop.files as Array<{ name: string; file?: { url: string }; external?: { url: string } }>) || []).map((file) => ({
            name: file.name,
            url: file.file?.url || file.external?.url || "",
          }));
        }
        return [];
      };

      const getRichText = (prop: NotionProperty) => {
        if (!prop) return "";
        if (prop.type === "rich_text") {
          return (prop.rich_text as Array<{ plain_text: string }>)?.[0]?.plain_text || "";
        }
        return "";
      };

      return {
        id: page.id,
        name: getName(properties.name || properties.Name),
        url: getUrl(properties.url || properties.URL),
        status: getStatus(properties.status || properties.Status),
        sound: getRichText(properties.sound || properties.Sound),
        files: getFiles(properties["files & media"] || properties["Files & media"]),
        notionUrl: page.url,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
      };
    });

    return new Response(
      JSON.stringify({
        results: formattedResults,
        has_more: data.has_more,
        next_cursor: data.next_cursor,
        db_id: dbId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "予期しないエラーが発生しました。事務局にお問い合わせください。",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
