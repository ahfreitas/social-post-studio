import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é André Freitas — especialista em transformação digital, business agility e mudança cultural com mais de 15 anos de experiência em grandes empresas brasileiras.

Sua voz é direta, provocadora e às vezes irônica — mas sua ironia vem de quem já viveu isso na pele.

REGRA OBRIGATÓRIA DE LINGUAGEM: Evite completamente jargões e expressões típicas de IA como: mergulhar, navegar, robusto, no cenário atual, é fundamental, em um mundo onde, vale ressaltar, cada vez mais. Escreva de forma humana, natural e autêntica.

REGRA DE ABERTURA: NUNCA comece posts com perguntas retóricas genéricas. Comece com: (1) cena específica; (2) afirmação em primeira pessoa; (3) observação direta que quebra expectativa.

Você vai gerar uma SÉRIE de posts conectados. Cada post deve funcionar sozinho mas fazer parte de uma narrativa maior.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, tone, languageStyle, language, networks, size, postCount } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
      conversacional: "Conversacional: como falando com um colega",
      narrativo: "Narrativo: conta uma história com arcos",
      reflexivo: "Reflexivo: convida à introspecção",
      "tecnico-acessivel": "Técnico acessível: conceitos complexos de forma simples",
      espontaneo: "Espontâneo: fluxo natural de pensamento",
    };

    const userPrompt = `Crie uma série de ${postCount} posts conectados sobre o tema: "${topic}"

Regras da série:
- Cada post deve ter valor standalone — funcionar sozinho — mas também fazer parte de uma narrativa maior
- O Post 1 apresenta uma cena ou problema real e termina com um gancho de curiosidade para o próximo
- Os posts intermediários aprofundam o diagnóstico e terminam com gancho para o seguinte
- O último post traz a virada, o aprendizado real ou a solução, fechando o ciclo com uma pergunta que gera comentários
- Os ganchos devem ser naturais e provocadores, nunca artificiais ou clickbait

Configurações:
- Tom de voz: ${tone}
- Estilo de linguagem: ${languageStyleMap[languageStyle] || languageStyle}
- Tamanho de cada post: ${sizeMap[size] || size}
- Redes sociais: ${networks.join(", ")}
- Idioma: ${languageMap[language] || language}

Para cada post, avalie com score de 0 a 10 em: clarity, engagement, authenticity, provocation.

Retorne um array JSON com ${postCount} objetos, cada um com: {"text": "...", "hashtags": ["..."], "imagePrompt": "...", "score": {"clarity": N, "engagement": N, "authenticity": N, "provocation": N, "overallDiagnosis": "..."}}`;

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
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_series",
                description: "Generate a connected series of social media posts",
                parameters: {
                  type: "object",
                  properties: {
                    posts: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          text: { type: "string" },
                          hashtags: { type: "array", items: { type: "string" } },
                          imagePrompt: { type: "string" },
                          score: {
                            type: "object",
                            properties: {
                              clarity: { type: "number" },
                              engagement: { type: "number" },
                              authenticity: { type: "number" },
                              provocation: { type: "number" },
                              overallDiagnosis: { type: "string" },
                            },
                            required: ["clarity", "engagement", "authenticity", "provocation", "overallDiagnosis"],
                          },
                        },
                        required: ["text", "hashtags", "imagePrompt", "score"],
                      },
                    },
                  },
                  required: ["posts"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "generate_series" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
    console.error("generate-series error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao gerar série" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
