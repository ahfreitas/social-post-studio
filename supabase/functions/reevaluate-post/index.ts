import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Você é um avaliador crítico de posts para redes sociais. Avalie o post fornecido em 4 critérios de 0 a 10. Seja honesto e crítico — não dê notas altas por padrão.`,
            },
            {
              role: "user",
              content: `Avalie este post:\n\n${text}\n\nCritérios:\n1. clarity — o leitor entende a mensagem principal em menos de 10 segundos?\n2. engagement — provoca comentários, compartilhamentos ou identificação?\n3. authenticity — soa como uma pessoa real falando, não como IA ou artigo corporativo?\n4. provocation — desafia uma crença ou padrão estabelecido sem atacar o leitor?\n\nPara cada critério, inclua uma sugestão concreta de melhoria.\nInclua também um overallDiagnosis: uma frase curta de diagnóstico geral.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "evaluate_post",
                description: "Evaluate a social media post quality",
                parameters: {
                  type: "object",
                  properties: {
                    clarity: { type: "number" },
                    engagement: { type: "number" },
                    authenticity: { type: "number" },
                    provocation: { type: "number" },
                    claritySuggestion: { type: "string" },
                    engagementSuggestion: { type: "string" },
                    authenticitySuggestion: { type: "string" },
                    provocationSuggestion: { type: "string" },
                    overallDiagnosis: { type: "string" },
                  },
                  required: [
                    "clarity", "engagement", "authenticity", "provocation",
                    "claritySuggestion", "engagementSuggestion",
                    "authenticitySuggestion", "provocationSuggestion",
                    "overallDiagnosis",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "evaluate_post" } },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    let result;
    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      const content = data.choices?.[0]?.message?.content || "";
      const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(clean);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("reevaluate-post error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao reavaliar post" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
