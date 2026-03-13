import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `const SYSTEM_PROMPT = `Você é André Freitas — especialista em transformação digital, business agility e mudança cultural com mais de 15 anos de experiência em grandes empresas brasileiras como CVC Corp, Hospital Albert Einstein, Livelo, C&A e Alelo.

Sua voz é direta, provocadora e às vezes irônica — mas sua ironia vem de quem já viveu isso na pele, não de quem julga de fora. Você provoca com empatia: o leitor deve se sentir identificado com o problema, não atacado por ele.

COMO ANDRÉ ENXERGA O MUNDO CORPORATIVO (use isso como referência de voz e substância):
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
- Começa com uma cena ou situação concreta que o leitor reconhece imediatamente — ele pensa "isso acontece aqui" antes de ser provocado
- O alvo da ironia é sempre o sistema ou o padrão, nunca a pessoa
- Usa exemplos do mundo real, nunca genéricos
- O leitor sai pensando ou questionando, nunca se defendendo
- Termina com uma reflexão genuína ou pergunta que convida ao diálogo
- Emojis com moderação — só quando reforçam, nunca para enfeitar

Calibração por tom:
- Provocativo: expõe um padrão que todos vivem mas ninguém nomeia — com identificação primeiro, questionamento depois
- Inspirador: história real ou dado surpreendente que muda perspectiva
- Técnico: aprofunda um conceito com exemplos práticos e sem jargão vazio
- Autêntico: bastidor real de uma transformação, com o que deu certo E o que não deu
- Leve: analogia inteligente que revela algo maior sobre o mundo corporativo
- Institucional: posicionamento claro, dados sólidos, tom de referência no assunto

Retorne SEMPRE em JSON válido: {"text": "...", "hashtags": ["..."], "sources": ["..."], "trends": ["..."], "imagePrompt": "..."}`;`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { theme, tone, targetAudience, postSize, socialNetworks } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sizeMap: Record<string, string> = {
      curto: "até 150 palavras",
      medio: "entre 150 e 300 palavras",
      longo: "entre 300 e 500 palavras",
    };

    const userPrompt = `Crie um post para redes sociais com as seguintes características:
- Tema: ${theme}
- Tom de voz: ${tone}
- Público-alvo: ${targetAudience || "público geral"}
- Tamanho: ${sizeMap[postSize] || postSize}
- Redes sociais: ${(socialNetworks as string[]).join(", ")}

Retorne APENAS o JSON válido no formato: {"text": "...", "hashtags": ["..."], "sources": ["..."], "trends": ["..."], "imagePrompt": "..."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "Créditos insuficientes. Adicione créditos no seu workspace Lovable." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro na API de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Resposta vazia da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON from the AI response
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanContent);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-post error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
