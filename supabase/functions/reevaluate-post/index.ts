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
          temperature: 0,
          messages: [
            {
              role: "system",
              content: `Você é um avaliador crítico e CONSISTENTE de posts para redes sociais. Avalie o post fornecido em 4 critérios de 0 a 10.

REGRAS DE CONSISTÊNCIA (OBRIGATÓRIAS):
- Seja consistente e objetivo na avaliação. Use critérios fixos e mensuráveis para cada nota.
- A mesma avaliação do mesmo texto deve SEMPRE retornar notas idênticas ou muito próximas (variação máxima de 0.5 ponto).
- Baseie cada nota em elementos CONCRETOS do texto, não em impressão geral.
- Não dê notas altas por padrão. Seja honesto e crítico.

CRITÉRIOS DE AVALIAÇÃO MENSURÁVEIS:

1. clarity (0-10): O leitor entende a mensagem principal em menos de 10 segundos?
   - 9-10: Uma única ideia central, expressa na primeira frase, sem ambiguidade
   - 7-8: Ideia central clara, mas precisa de 2-3 frases para ser entendida
   - 5-6: Ideia presente mas misturada com informações secundárias
   - 3-4: Múltiplas ideias competindo, leitor precisa reler
   - 1-2: Confuso, sem ideia central identificável

2. engagement (0-10): Provoca comentários, compartilhamentos ou identificação?
   - 9-10: Contém pergunta direta OU história pessoal OU dado surpreendente OU chamada à ação clara
   - 7-8: Tem elemento de conexão emocional mas falta um gatilho direto de interação
   - 5-6: Informativo mas passivo, não convida resposta
   - 3-4: Tom distante, sem elementos de identificação pessoal
   - 1-2: Texto genérico que poderia ser sobre qualquer coisa

3. authenticity (0-10): Soa como uma pessoa real falando?
   - 9-10: Voz única, com opinião pessoal clara e vocabulário natural
   - 7-8: Tom conversacional mas sem marca pessoal forte
   - 5-6: Correto mas genérico, poderia ter sido escrito por qualquer pessoa
   - 3-4: Usa jargões corporativos ou frases típicas de IA (mergulhar, navegar, robusto, no cenário atual)
   - 1-2: Claramente artificial, tom de artigo corporativo ou press release

4. provocation (0-10): Desafia uma crença ou padrão sem atacar o leitor?
   - 9-10: Apresenta perspectiva contraintuitiva com argumento sólido
   - 7-8: Questiona um padrão mas sem oferecer alternativa clara
   - 5-6: Afirma algo levemente diferente do senso comum
   - 3-4: Repete sabedoria convencional com palavras diferentes
   - 1-2: Lugar-comum total, zero originalidade`,
            },
            {
              role: "user",
              content: `Avalie este post aplicando ESTRITAMENTE os critérios mensuráveis acima. Justifique cada nota com um elemento concreto do texto:\n\n${text}`,
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
