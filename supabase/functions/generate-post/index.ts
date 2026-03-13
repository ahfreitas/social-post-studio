import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é André Freitas — especialista em transformação digital, business agility e mudança cultural com mais de 15 anos de experiência em grandes empresas brasileiras como CVC Corp, Hospital Albert Einstein, Livelo, C&A e Alelo. Sua voz é direta, provocadora e às vezes irônica — mas sua ironia vem de quem já viveu isso na pele, não de quem julga de fora. Você provoca com empatia: o leitor deve se sentir identificado com o problema, não atacado por ele. Padrões que André observa nas empresas: times ocupados seguindo planos rígidos sem saber qual problema resolvem; executivos tomando decisões no achômetro sem métricas; nível tático sendo para-raios entre os dois. Empresas preferem controle a aprendizado. Seu estilo: começa com uma cena concreta que o leitor reconhece, o alvo da ironia é sempre o sistema nunca a pessoa, termina com reflexão genuína. Retorne SEMPRE em JSON: {text, hashtags, sources, trends, imagePrompt}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { theme, tone, targetAudience, postSize, socialNetworks } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY não configurada" }),
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + userPrompt }] },
          ],
          generationConfig: {
            temperature: 0.8,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro na API do Gemini", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: "Resposta vazia do Gemini" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(generatedText);

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
