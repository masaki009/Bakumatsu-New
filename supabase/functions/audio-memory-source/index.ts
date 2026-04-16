import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as jose from "npm:jose@5";

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

function getFilesFromProp(prop: NotionProperty): Array<{ name: string; url: string }> {
  if (!prop || prop.type !== "files") return [];
  const files = (prop.files as Array<{
    name: string;
    file?: { url: string };
    external?: { url: string };
  }>) || [];
  return files.map(f => ({ name: f.name, url: f.file?.url || f.external?.url || "" }));
}

function getRichText(prop: NotionProperty): string {
  if (!prop || prop.type !== "rich_text") return "";
  return (prop.rich_text as Array<{ plain_text: string }>)?.[0]?.plain_text || "";
}

function getTitle(prop: NotionProperty): string {
  if (!prop || prop.type !== "title") return "";
  return (prop.title as Array<{ plain_text: string }>)?.[0]?.plain_text || "";
}

function findPropByKey(
  properties: Record<string, NotionProperty>,
  candidates: string[]
): NotionProperty | undefined {
  for (const candidate of candidates) {
    if (properties[candidate]) return properties[candidate];
  }
  const lower = candidates.map(c => c.toLowerCase());
  for (const [k, v] of Object.entries(properties)) {
    if (lower.includes(k.toLowerCase())) return v;
  }
  return undefined;
}

function findAudioUrl(properties: Record<string, NotionProperty>): string {
  const filesCandidates = ["files & media", "Files & media", "Files & Media", "files&media"];
  const filesProp = findPropByKey(properties, filesCandidates);
  if (filesProp) {
    const files = getFilesFromProp(filesProp);
    const mp3 = files.find(f => f.name.toLowerCase().endsWith(".mp3"));
    if (mp3 && mp3.url) return mp3.url;
    const anyAudio = files.find(f => f.url !== "");
    if (anyAudio) return anyAudio.url;
  }

  for (const [, prop] of Object.entries(properties)) {
    if (prop.type === "files") {
      const files = getFilesFromProp(prop);
      const mp3 = files.find(f => f.name.toLowerCase().endsWith(".mp3"));
      if (mp3 && mp3.url) return mp3.url;
      const anyAudio = files.find(f => f.url !== "");
      if (anyAudio) return anyAudio.url;
    }
  }
  return "";
}

function findEngText(properties: Record<string, NotionProperty>): string {
  const engCandidates = ["ENG", "eng", "Eng", "English", "english"];
  const engProp = findPropByKey(properties, engCandidates);
  if (engProp) {
    const rt = getRichText(engProp);
    if (rt) return rt;
    const t = getTitle(engProp);
    if (t) return t;
  }
  return "";
}

async function verifyES256JWT(token: string, supabaseUrl: string): Promise<{ email: string; sub: string } | null> {
  try {
    const JWKS = jose.createRemoteJWKSet(
      new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
    );
    const { payload } = await jose.jwtVerify(token, JWKS, {
      algorithms: ["ES256"],
    });
    const email = payload.email as string;
    const sub = payload.sub as string;
    if (!email || !sub) return null;
    return { email, sub };
  } catch {
    return null;
  }
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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const jwt = authHeader.replace("Bearer ", "");
    const userInfo = await verifyES256JWT(jwt, supabaseUrl);
    if (!userInfo) {
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
      .select("notion_api_key, db_id_chunk")
      .eq("email", userInfo.email)
      .maybeSingle();

    if (settingsError) {
      console.error("user_notion fetch error:", settingsError);
      return new Response(
        JSON.stringify({ items: [], debug_error: "user_notion fetch failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!notionSettings?.notion_api_key || !notionSettings?.db_id_chunk) {
      return new Response(
        JSON.stringify({ items: [], debug_error: "notion settings not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const queryBody = { page_size: 100 };

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
        JSON.stringify({ items: [], debug_error: `Notion API ${notionResponse.status}: ${errorText}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await notionResponse.json();
    const results: NotionPage[] = data.results || [];

    if (debug) {
      const firstPageProps = results.length > 0
        ? Object.entries(results[0].properties).map(([k, v]) => {
            const prop = v as NotionProperty;
            let sample = "";
            if (prop.type === "status") sample = (prop.status as { name: string })?.name || "";
            if (prop.type === "select") sample = (prop.select as { name: string })?.name || "";
            if (prop.type === "rich_text") sample = (prop.rich_text as Array<{ plain_text: string }>)?.[0]?.plain_text || "";
            if (prop.type === "title") sample = (prop.title as Array<{ plain_text: string }>)?.[0]?.plain_text || "";
            if (prop.type === "files") {
              const files = getFilesFromProp(prop);
              sample = files.map(f => f.name).join(", ");
            }
            return { key: k, type: prop.type, sample };
          })
        : [];

      const statusCounts: Record<string, number> = {};
      results.forEach(page => {
        const statusKey = Object.keys(page.properties).find(k => k.toLowerCase() === "status");
        const statusProp = statusKey ? page.properties[statusKey] : undefined;
        let s = "(none)";
        if (statusProp) {
          if (statusProp.type === "status") s = (statusProp.status as { name: string })?.name || "(empty)";
          else if (statusProp.type === "select") s = (statusProp.select as { name: string })?.name || "(empty)";
        }
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });

      const firstFewAudioCheck = results.slice(0, 3).map(page => ({
        audioUrl: findAudioUrl(page.properties),
        engText: findEngText(page.properties),
      }));

      return new Response(
        JSON.stringify({
          totalPages: results.length,
          propertyKeys: firstPageProps,
          statusDistribution: statusCounts,
          requestedStatus: status,
          sampleItems: firstFewAudioCheck,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const items = results
      .map(page => {
        const statusKey = Object.keys(page.properties).find(k => k.toLowerCase() === "status");
        const statusProp = statusKey ? page.properties[statusKey] : undefined;
        let pageStatus = "";
        if (statusProp) {
          if (statusProp.type === "status") pageStatus = (statusProp.status as { name: string })?.name || "";
          else if (statusProp.type === "select") pageStatus = (statusProp.select as { name: string })?.name || "";
        }
        return {
          audioUrl: findAudioUrl(page.properties),
          engText: findEngText(page.properties),
          pageStatus,
        };
      })
      .filter(item => item.audioUrl !== "" && item.pageStatus?.includes(status))
      .map(({ audioUrl, engText }) => ({ audioUrl, engText }))
      .slice(0, 8);

    return new Response(
      JSON.stringify({ items, total_matched: results.length }),
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
