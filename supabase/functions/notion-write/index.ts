import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotionWriteRequest {
  name: string;
  sound?: string;
  status?: string;
  url?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const NOTION_API_KEY = Deno.env.get('NOTION_API_KEY');
    const NOTION_DATABASE_ID = Deno.env.get('NOTION_DATABASE_ID');

    if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
      throw new Error('Notion credentials not configured');
    }

    const body: NotionWriteRequest = await req.json();

    if (!body.name) {
      throw new Error('Name is required');
    }

    const notionPayload = {
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        name: {
          title: [
            {
              text: {
                content: body.name
              }
            }
          ]
        },
        ...(body.sound && {
          sound: {
            rich_text: [
              {
                text: {
                  content: body.sound
                }
              }
            ]
          }
        }),
        ...(body.status && {
          status: {
            name: body.status
          }
        }),
        ...(body.url && {
          url: {
            url: body.url
          }
        })
      }
    };

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(notionPayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Notion API error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        pageId: result.id
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
