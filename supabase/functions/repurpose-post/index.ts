import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(profile: any): string {
  const parts: string[] = [];

  parts.push(`Você é ${profile.name} — ${profile.bio}`);
  parts.push(`\nVocê receberá um post original. Reescreva-o completamente com a voz de ${profile.name}, mantendo a essência e a mensagem central, mas adaptando para o novo tom, estilo, idioma e rede social especificados. Não traduza literalmente — reescreva como se ${profile.name} estivesse contando a mesma história do zero para aquela plataforma e audiência específica.`);

  if (profile.communicationStyle) {
    parts.push(`\nEstilo de comunicação:\n${profile.communicationStyle}`);
  }
  if (profile.languageRules) {
    parts.push(`\nREGRA OBRIGATÓRIA DE LINGUAGEM: ${profile.languageRules}`);
  }
  if (profile.openingRules) {
    parts.push(`\nREGRA DE ABERTURA: ${profile.openingRules}`);
  }

  parts.push(`\nIMPORTANTE: Retorne SEMPRE um JSON válido.`);
  return parts.join('\n');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originalText, tone, languageStyle, language, networks, size, audience, profile } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = profile ? buildSystemPrompt(profile) : "Você é um especialista em criação de conteúdo para redes sociais. Retorne SEMPRE um JSON válido.";

    const sizeMap: Record<string, string> = {
      curto: "até 150 palavras",
      medio: "entre 150 e 300 palavras",
      longo: "entre 300 e 500 palavras",
    };

    const languageMap: Record<string, string> = {
      portugues: "Português brasileiro",
      ingles: "Inglês",
      espanhol: "Espanhol",
      alemao: "Alemão",
    };

    const languageStyleMap: Record<string, string> = {
      direto: "Direto: frases curtas e objetivas",
      conversacional: "Conversacional: tom informal e próximo",
      narrativo: "Narrativo: conta uma história com arcos narrativos",
      reflexivo: "Reflexivo: convida à introspecção",
      "tecnico-acessivel": "Técnico acessível: conceitos complexos de forma simples",
      espontaneo: "Espontâneo: fluxo natural de pensamento",
    };

    const profileName = profile?.name || "o autor";

    const userPrompt = `POST ORIGINAL para reescrever:
"""
${originalText}
"""

Reescreva este post completamente com as seguintes configurações:
- Tom de voz: ${tone}
- Estilo de linguagem: ${languageStyleMap[languageStyle] || languageStyle}
- Idioma de destino: o post DEVE ser escrito inteiramente em ${languageMap[language] || language}
- Rede social de destino: ${networks.join(", ")}
- Tamanho: ${sizeMap[size] || size}
- Público-alvo: ${audience || "público geral"}

NÃO traduza literalmente. Reescreva como se ${profileName} estivesse contando a mesma história do zero para essa plataforma e audiência.

AVALIAÇÃO DO POST (campo "score"): Avalie o post reescrito em 4 critérios (0-10). Seja consistente e objetivo.
1. clarity: 9-10 = ideia central na primeira frase; 7-8 = clara em 2-3 frases; 5-6 = misturada; 3-4 = múltiplas ideias; 1-2 = confuso.
2. engagement: 9-10 = gatilho direto (pergunta, história, dado); 7-8 = conexão emocional; 5-6 = informativo passivo; 3-4 = distante; 1-2 = genérico.
3. authenticity: 9-10 = voz única com opinião; 7-8 = conversacional; 5-6 = genérico; 3-4 = jargões IA; 1-2 = artificial.
4. provocation: 9-10 = perspectiva contraintuitiva; 7-8 = questiona padrão; 5-6 = levemente diferente; 3-4 = convencional; 1-2 = lugar-comum.

Para cada critério, inclua sugestão concreta citando trecho do texto. Inclua overallDiagnosis.

Retorne APENAS JSON válido no formato: {"text": "...", "hashtags": ["..."], "sources": ["..."], "trends": ["..."], "imagePrompt": "...", "score": {"clarity": N, "engagement": N, "authenticity": N, "provocation": N, "claritySuggestion": "...", "engagementSuggestion": "...", "authenticitySuggestion": "...", "provocationSuggestion": "...", "overallDiagnosis": "..."}}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_repurposed_post",
              description: "Generate a repurposed social media post",
              parameters: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  hashtags: { type: "array", items: { type: "string" } },
                  sources: { type: "array", items: { type: "string" } },
                  trends: { type: "array", items: { type: "string" } },
                  imagePrompt: { type: "string" },
                  score: {
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
                    required: ["clarity", "engagement", "authenticity", "provocation", "claritySuggestion", "engagementSuggestion", "authenticitySuggestion", "provocationSuggestion", "overallDiagnosis"],
                  },
                },
                required: ["text", "hashtags", "sources", "trends", "imagePrompt", "score"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_repurposed_post" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
    console.error("repurpose-post error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao repurposar post" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
