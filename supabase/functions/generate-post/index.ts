import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(profile: any): string {
  const parts: string[] = [];

  parts.push(`Você é ${profile.name} — ${profile.bio}`);

  if (profile.worldview) {
    parts.push(`\nCOMO ${profile.name.toUpperCase()} ENXERGA O MUNDO:\n${profile.worldview}`);
  }

  if (profile.recurringTopics) {
    parts.push(`\nTemas recorrentes:\n${profile.recurringTopics}`);
  }

  if (profile.communicationStyle) {
    parts.push(`\nEstilo de comunicação:\n${profile.communicationStyle}`);
  }

  if (profile.toneCalibration) {
    parts.push(`\nCalibração por tom:\n${profile.toneCalibration}`);
  }

  if (profile.languageRules) {
    parts.push(`\nREGRA OBRIGATÓRIA DE LINGUAGEM: ${profile.languageRules}`);
  }

  if (profile.openingRules) {
    parts.push(`\nREGRA DE ABERTURA: ${profile.openingRules}`);
  }

  if (profile.referenceExamples) {
    parts.push(`\nExemplos de posts de referência:\n${profile.referenceExamples}`);
  }

  parts.push(`\nIMPORTANTE: Retorne SEMPRE um JSON válido com esta estrutura exata:
{"text": "conteúdo do post", "hashtags": ["hashtag1", "hashtag2"], "sources": ["fonte1"], "trends": ["tendência1"], "imagePrompt": "descrição para gerar imagem"}`);

  return parts.join('\n');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, tone, audience, size, networks, language, imageTone, languageStyle, hook, profile } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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

    const imageToneMap: Record<string, string> = {
      corporativo: "Corporativo e profissional: tons sóbrios, layout limpo, tipografia elegante, elementos de negócios",
      minimalista: "Minimalista: poucos elementos, muito espaço em branco, cores neutras, simplicidade visual",
      provocador: "Provocador e irreverente: cores vibrantes, contrastes fortes, composição ousada e disruptiva",
      inspirador: "Inspirador: tons quentes, luz natural, paisagens ou cenas motivacionais, composição harmoniosa",
      engracado: "Engraçado: cores vivas, elementos lúdicos, ilustrações divertidas, tom descontraído",
      leve: "Leve e descontraído: paleta suave, elementos orgânicos, atmosfera relaxada e acolhedora",
    };

    const languageStyleMap: Record<string, string> = {
      direto: "Direto: frases curtas e objetivas, sem rodeios, vai direto ao ponto",
      conversacional: "Conversacional: como se estivesse falando com um colega, tom informal e próximo",
      narrativo: "Narrativo: conta uma história, usa arcos narrativos, cria tensão e resolução",
      reflexivo: "Reflexivo: convida à introspecção, faz perguntas, provoca pensamento profundo",
      "tecnico-acessivel": "Técnico acessível: explica conceitos complexos de forma simples, sem simplificar demais",
      espontaneo: "Espontâneo: fluxo natural de pensamento, como se estivesse digitando em tempo real",
    };

    const hookInstruction = hook
      ? `\n\nABERTURA OBRIGATÓRIA: O post DEVE começar exatamente com esta frase: "${hook}". Continue o post a partir dela de forma natural e coerente.`
      : '';

    const userPrompt = `Crie um post para redes sociais com as seguintes características:
- Tema: ${topic}
- Tom de voz: ${tone}
- Estilo de linguagem: ${languageStyleMap[languageStyle] || languageStyle}
- Público-alvo: ${audience || "público geral"}
- Tamanho: ${sizeMap[size] || size}
- Redes sociais: ${networks.join(", ")}
- Idioma: o post DEVE ser escrito inteiramente em ${languageMap[language] || language}${hookInstruction}

Para o campo "imagePrompt", gere uma descrição DETALHADA de imagem seguindo o tom visual: ${imageToneMap[imageTone] || imageTone}. A descrição deve incluir: estilo visual, paleta de cores, elementos visuais principais, composição e atmosfera da imagem. A descrição do imagePrompt deve ser em inglês para uso em geradores de imagem.

AVALIAÇÃO DO POST (campo "score"): Avalie o post que você acabou de gerar em 4 critérios, cada um de 0 a 10. Seja consistente e objetivo — use critérios fixos e mensuráveis. Baseie cada nota em elementos CONCRETOS do texto, não em impressão geral.

1. clarity (0-10): 9-10 = uma ideia central na primeira frase, sem ambiguidade; 7-8 = clara mas precisa de 2-3 frases; 5-6 = misturada com informações secundárias; 3-4 = múltiplas ideias competindo; 1-2 = confuso.
2. engagement (0-10): 9-10 = pergunta direta, história pessoal, dado surpreendente ou CTA; 7-8 = conexão emocional sem gatilho direto; 5-6 = informativo mas passivo; 3-4 = tom distante; 1-2 = genérico.
3. authenticity (0-10): 9-10 = voz única com opinião pessoal; 7-8 = conversacional sem marca forte; 5-6 = correto mas genérico; 3-4 = jargões corporativos/IA; 1-2 = artificial.
4. provocation (0-10): 9-10 = perspectiva contraintuitiva com argumento; 7-8 = questiona padrão sem alternativa; 5-6 = levemente diferente do senso comum; 3-4 = sabedoria convencional; 1-2 = lugar-comum.

Para cada critério, inclua uma sugestão concreta de melhoria citando um trecho específico do texto.
Inclua também um overallDiagnosis: uma frase curta de diagnóstico geral. Não dê notas altas por padrão.

Retorne APENAS o JSON válido no formato: {"text": "...", "hashtags": ["..."], "sources": ["..."], "trends": ["..."], "imagePrompt": "...", "score": {"clarity": N, "engagement": N, "authenticity": N, "provocation": N, "claritySuggestion": "...", "engagementSuggestion": "...", "authenticitySuggestion": "...", "provocationSuggestion": "...", "overallDiagnosis": "..."}}`;

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
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_post",
                description: "Generate a social media post with hashtags, sources, trends, image prompt and quality score",
                parameters: {
                  type: "object",
                  properties: {
                    text: { type: "string", description: "The post content" },
                    hashtags: { type: "array", items: { type: "string" } },
                    sources: { type: "array", items: { type: "string" } },
                    trends: { type: "array", items: { type: "string" } },
                    imagePrompt: { type: "string", description: "Detailed image generation prompt in English" },
                    score: {
                      type: "object",
                      description: "Quality score for the generated post",
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
                      additionalProperties: false,
                    },
                  },
                  required: ["text", "hashtags", "sources", "trends", "imagePrompt", "score"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "generate_post" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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
    console.error("generate-post error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao gerar post" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
