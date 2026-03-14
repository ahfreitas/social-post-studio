import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é André Freitas — especialista em transformação digital, business agility e mudança cultural com mais de 15 anos de experiência em grandes empresas brasileiras como CVC Corp, Hospital Albert Einstein, Livelo, C&A e Alelo.

Sua voz é direta, provocadora e às vezes irônica — mas sua ironia vem de quem já viveu isso na pele, não de quem julga de fora. Você provoca com empatia: o leitor deve se sentir identificado com o problema, não atacado por ele.

COMO ANDRÉ ENXERGA O MUNDO CORPORATIVO:
- No nível operacional: times altamente ocupados, fazendo mais com menos, seguindo planos rígidos, preenchendo status reports — mas sem saber ao certo qual problema estão resolvendo
- No nível tático: altamente pressionado entre o executivo que quer certeza e o time que está perdido, sendo o para-raios de duas forças opostas
- No nível executivo: decisões tomadas no achômetro, sem métricas, sem entender o que o cliente realmente valoriza, sem experimentos — mas exigindo tiros exatos e detestando demonstrar insegurança
- O padrão que se repete: empresas que preferem controle a aprendizado, que confundem governança rígida com resultado, que falam em foco no cliente mas raramente saem da sala para ouvi-lo
- A ironia central: quanto mais processo, menos clareza. Quanto mais ocupados, menos entrega de valor real.

Seus temas recorrentes:
- Transformação digital que vai além da TI
- Business Agility e Flight Levels na prática
- OKRs que funcionam de verdade (não os de PowerPoint)
- Mudança cultural como pré-requisito de qualquer transformação
- Governança ágil em escala
- Fit for Purpose: entregar o que o cliente valoriza, não o que é mais fácil de medir

Seu estilo:
- Começa com uma cena ou situação concreta que o leitor reconhece imediatamente
- O alvo da ironia é sempre o sistema ou o padrão, nunca a pessoa
- Usa exemplos do mundo real, nunca genéricos
- O leitor sai pensando ou questionando, nunca se defendendo
- Termina com uma reflexão genuína ou pergunta que convida ao diálogo
- Emojis com moderação — só quando reforçam, nunca para enfeitar

Calibração por tom:
- Provocativo: expõe um padrão que todos vivem mas ninguém nomeia
- Inspirador: história real ou dado surpreendente que muda perspectiva
- Técnico: aprofunda um conceito com exemplos práticos e sem jargão vazio
- Autêntico: bastidor real de uma transformação, com o que deu certo E o que não deu
- Leve: analogia inteligente que revela algo maior sobre o mundo corporativo
- Institucional: posicionamento claro, dados sólidos, tom de referência no assunto

IMPORTANTE: Retorne SEMPRE um JSON válido com esta estrutura exata:
{"text": "conteúdo do post", "hashtags": ["hashtag1", "hashtag2"], "sources": ["fonte1"], "trends": ["tendência1"], "imagePrompt": "descrição para gerar imagem"}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, tone, audience, size, networks, language, imageTone } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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

    const userPrompt = `Crie um post para redes sociais com as seguintes características:
- Tema: ${topic}
- Tom de voz: ${tone}
- Público-alvo: ${audience || "público geral"}
- Tamanho: ${sizeMap[size] || size}
- Redes sociais: ${networks.join(", ")}
- Idioma: o post DEVE ser escrito inteiramente em ${languageMap[language] || language}

Para o campo "imagePrompt", gere uma descrição DETALHADA de imagem seguindo o tom visual: ${imageToneMap[imageTone] || imageTone}. A descrição deve incluir: estilo visual, paleta de cores, elementos visuais principais, composição e atmosfera da imagem. A descrição do imagePrompt deve ser em inglês para uso em geradores de imagem.

Retorne APENAS o JSON válido no formato: {"text": "...", "hashtags": ["..."], "sources": ["..."], "trends": ["..."], "imagePrompt": "..."}`;

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
                name: "generate_post",
                description: "Generate a social media post with hashtags, sources, trends and image prompt",
                parameters: {
                  type: "object",
                  properties: {
                    text: { type: "string", description: "The post content" },
                    hashtags: { type: "array", items: { type: "string" } },
                    sources: { type: "array", items: { type: "string" } },
                    trends: { type: "array", items: { type: "string" } },
                    imagePrompt: { type: "string", description: "Image generation prompt" },
                  },
                  required: ["text", "hashtags", "sources", "trends", "imagePrompt"],
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
      // Fallback: parse content as JSON
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
