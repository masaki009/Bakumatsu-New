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
    const status = url.searchParams.get("status") || "⚠️ 覚え中";
    const debug = url.searchParams.get("debug") === "1";

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: notionSettings, error: settingsError } = await adminClient
      .from("user_notion")
      .select("notion_api_key, db_id_vocab")
      .eq("email", user.email)
      .maybeSingle();

    if (settingsError) {
      console.error("user_notion fetch error:", settingsError);
      return new Response(
        JSON.stringify({ error: "設定の取得中にエラーが発生しました。" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!notionSettings?.notion_api_key || !notionSettings?.db_id_vocab) {
      return new Response(
        JSON.stringify({ error: "Notion設定が未完了です。アップグレードが必要です。" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notionResponse = await fetch(
      `https://api.notion.com/v1/databases/${notionSettings.db_id_vocab}/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${notionSettings.notion_api_key}`,
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
        JSON.stringify({ error: `Notion APIエラーが発生しました (${notionResponse.status})。設定内容をご確認ください。` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await notionResponse.json();

    const getStatus = (prop: NotionProperty): string => {
      if (!prop) return "";
      if (prop.type === "status") return (prop.status as { name: string })?.name || "";
      if (prop.type === "select") return (prop.select as { name: string })?.name || "";
      return "";
    };

    const getRichText = (prop: NotionProperty): string => {
      if (!prop || prop.type !== "rich_text") return "";
      return (prop.rich_text as Array<{ plain_text: string }>)?.[0]?.plain_text || "";
    };

    const getTitle = (prop: NotionProperty): string => {
      if (!prop || prop.type !== "title") return "";
      return (prop.title as Array<{ plain_text: string }>)?.[0]?.plain_text || "";
    };

    const allItems = (data.results as NotionPage[]).map((page) => {
      const properties = page.properties;
      const keys = Object.keys(properties);

      const statusKey = keys.find(k => k.toLowerCase() === "status");
      const pageStatus = statusKey ? getStatus(properties[statusKey]) : "";

      const titleKey = keys.find(k => properties[k].type === "title");
      const engRichKey = keys.find(k => ["eng", "en", "english", "word"].includes(k.toLowerCase()));
      let en = "";
      if (titleKey) en = getTitle(properties[titleKey]);
      else if (engRichKey) en = getRichText(properties[engRichKey]);

      const jaKey = keys.find(k => ["ja", "jp", "jpn", "japanese", "日本語", "意味", "和訳"].includes(k.toLowerCase()));
      const ja = jaKey ? getRichText(properties[jaKey]) : "";

      const exKey = keys.find(k => ["example", "e.g.eng", "例文", "sentence", "例"].includes(k.toLowerCase()));
      const example = exKey ? getRichText(properties[exKey]) : "";

      return { en, ja, example, pageStatus };
    });

    if (debug) {
      const firstPageKeys = data.results.length > 0
        ? Object.entries((data.results[0] as NotionPage).properties).map(([k, v]) => ({
            key: k,
            type: (v as NotionProperty).type,
          }))
        : [];

      const statusCounts: Record<string, number> = {};
      allItems.forEach(item => {
        const s = item.pageStatus || "(empty)";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });

      return new Response(
        JSON.stringify({
          totalPages: data.results.length,
          propertyKeys: firstPageKeys,
          statusDistribution: statusCounts,
          sampleItem: allItems[0] || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const filtered = allItems.filter(item => item.pageStatus?.includes(status) && item.en !== "");
    const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 10);
    const items = shuffled.map(({ en, ja, example }) => ({ en, ja, example }));

    return new Response(
      JSON.stringify({ items }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "予期しないエラーが発生しました。事務局にお問い合わせください。" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
