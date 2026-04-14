import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Message {
  role: string;
  content: string;
}

interface CoachProfile {
  type: string;
  character: string;
  target: string;
  speaking: string;
}

interface SelfProfile {
  name: string;
  current_level: string;
  by_when?: string;
  target?: string;
  problem?: string;
  study_type?: string;
}

interface RequestBody {
  messages: Message[];
  type: 'general' | 'grammar';
  userId: string;
  anthropicApiKey?: string;
  coachProfile?: CoachProfile;
  selfProfile?: SelfProfile;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    console.log("Received request body:", JSON.stringify(body, null, 2));

    const { messages, type, userId, anthropicApiKey: providedApiKey, coachProfile, selfProfile }: RequestBody = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error("Invalid messages:", messages);
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const anthropicApiKey = providedApiKey || Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // プロフィール情報に基づいたシステムプロンプトを生成
    let systemPrompt = '';

    if (type === 'general') {
      systemPrompt = `あなたは経験豊富な学習チューターです。学生の勉強に関する悩みに対して、具体的で実践的なアドバイスを提供してください。

主な対応範囲:
- 学習方法の改善提案
- 時間管理とスケジューリング
- モチベーション維持のコツ
- 効率的な復習方法
- 目標設定とプランニング
- 学習環境の最適化
- 集中力向上のテクニック

回答の際は:
- 具体的で実践可能なアドバイスを提供
- 学生の状況に寄り添った共感的な対応
- 必要に応じて質問を返して詳細を確認
- ポジティブで励ましの言葉を含める
- 日本語で自然な会話を心がける`;
    } else {
      // 英文・文法・添削相談用のシステムプロンプト
      systemPrompt = `あなたは英語学習のエキスパートチューターです。英文法の添削と英文の改善提案を行ってください。

主な対応範囲:
- 文法の誤りの指摘と修正
- より自然な表現への改善提案
- 語彙の適切性チェック
- 文章構造の改善アドバイス
- スタイルとトーンの調整提案`;

      // 学習者プロフィール情報を追加
      if (selfProfile) {
        systemPrompt += `\n\n## 学習者プロフィール\n`;
        systemPrompt += `- 名前: ${selfProfile.name}\n`;
        systemPrompt += `- 現在のレベル: ${selfProfile.current_level}\n`;
        if (selfProfile.target) {
          systemPrompt += `- 学習目標: ${selfProfile.target}\n`;
        }
        if (selfProfile.by_when) {
          systemPrompt += `- 目標達成期限: ${selfProfile.by_when}\n`;
        }
        if (selfProfile.problem) {
          systemPrompt += `- 現在の課題: ${selfProfile.problem}\n`;
        }
        if (selfProfile.study_type) {
          systemPrompt += `- 学習ペース: ${selfProfile.study_type}\n`;
        }
      }

      // コーチプロフィール情報を追加
      if (coachProfile) {
        systemPrompt += `\n\n## あなたの英語講師（チューター）設定\n`;
        systemPrompt += `- 人格スタイル: ${coachProfile.type}\n`;
        systemPrompt += `- フィードバック詳細度: ${coachProfile.character}\n`;
        systemPrompt += `- 間違い指摘方法: ${coachProfile.target}\n`;
        systemPrompt += `- 話し方スタイル: ${coachProfile.speaking}\n`;

        systemPrompt += `\n上記のチューター設定に従って、学習者に最適なフィードバックを提供してください。`;
      }

      systemPrompt += `\n\n回答の際は:
- 誤りを明確に指摘
- 修正案を具体的に提示
- なぜその修正が必要かを説明
- より良い表現の選択肢を提案
- 学習ポイントを強調
- 学習者のレベルと目標を考慮した適切なアドバイス
- 日本語で丁寧に説明`;
    }

    const anthropicMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: systemPrompt,
        messages: anthropicMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Anthropic API error status:", response.status);
      console.error("Anthropic API error body:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to get AI response",
          details: `Status: ${response.status}`,
          anthropicError: error
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const aiMessage = data.content[0].text;

    return new Response(
      JSON.stringify({ message: aiMessage }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in consultation-ai function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
