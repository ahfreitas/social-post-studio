import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Loader2 } from 'lucide-react';
import type { GeneratedPost } from '@/types/post';

const GEMINI_API_KEY = 'AIzaSyACI-18qX1vOgiS5jrmKzdluBYR-9pcEbU';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

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

Retorne SEMPRE em JSON válido: {"text": "...", "hashtags": ["..."], "sources": ["..."], "trends": ["..."], "imagePrompt": "..."}`;

const TONES = [
  { value: 'inspirador', label: 'Inspirador' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'provocativo', label: 'Provocativo' },
  { value: 'leve', label: 'Leve' },
  { value: 'institucional', label: 'Institucional' },
  { value: 'autentico', label: 'Autêntico' },
  { value: 'outro', label: 'Outro' },
];

const SIZES = [
  { value: 'curto', label: 'Curto (até 150 palavras)' },
  { value: 'medio', label: 'Médio (150-300 palavras)' },
  { value: 'longo', label: 'Longo (300-500 palavras)' },
];

const NETWORKS = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'twitter', label: 'Twitter/X' },
];

interface PostFormProps {
  onGenerate: (post: GeneratedPost) => void;
}

export default function PostForm({ onGenerate }: PostFormProps) {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('');
  const [customTone, setCustomTone] = useState('');
  const [audience, setAudience] = useState('');
  const [size, setSize] = useState('');
  const [networks, setNetworks] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const toggleNetwork = (id: string) => {
    setNetworks(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !tone || !size || networks.length === 0) return;

    setGenerating(true);

    const finalTone = tone === 'outro' ? customTone : tone;
    const sizeMap: Record<string, string> = { curto: '150', medio: '300', longo: '500' };

    const sizeMap: Record<string, string> = {
      curto: 'até 150 palavras',
      medio: 'entre 150 e 300 palavras',
      longo: 'entre 300 e 500 palavras',
    };

    const userPrompt = `Crie um post para redes sociais com as seguintes características:
- Tema: ${topic}
- Tom de voz: ${finalTone}
- Público-alvo: ${audience || 'público geral'}
- Tamanho: ${sizeMap[size] || size}
- Redes sociais: ${networks.join(', ')}

Retorne APENAS o JSON válido no formato: {"text": "...", "hashtags": ["..."], "sources": ["..."], "trends": ["..."], "imagePrompt": "..."}`;

    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Erro na API Gemini (${response.status})`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) throw new Error('Resposta vazia da IA');

      const result = JSON.parse(content);

      const post: GeneratedPost = {
        id: crypto.randomUUID(),
        topic,
        tone: finalTone,
        audience: audience || 'Público geral',
        size,
        networks,
        content: result.text,
        hashtags: result.hashtags || [],
        sources: result.sources || [],
        trends: result.trends || [],
        imagePrompt: result.imagePrompt || '',
        createdAt: new Date().toISOString(),
      };

      onGenerate(post);
    } catch (err) {
      console.error('Erro ao gerar post:', err);
      alert(err instanceof Error ? err.message : 'Erro ao gerar post');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <form onSubmit={handleGenerate} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="topic">Tema ou assunto do post</Label>
        <Textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Ex: Produtividade no trabalho remoto"
          className="bg-secondary border-border min-h-[80px] resize-none"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tom de voz</Label>
          <Select value={tone} onValueChange={setTone} required>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Selecione o tom" />
            </SelectTrigger>
            <SelectContent>
              {TONES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tone === 'outro' && (
            <Input
              value={customTone}
              onChange={(e) => setCustomTone(e.target.value)}
              placeholder="Descreva o tom desejado"
              className="bg-secondary border-border mt-2"
              required
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>Tamanho</Label>
          <Select value={size} onValueChange={setSize} required>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Selecione o tamanho" />
            </SelectTrigger>
            <SelectContent>
              {SIZES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="audience">Público-alvo (opcional)</Label>
        <Input
          id="audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="Ex: Empreendedores, 25-40 anos"
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-3">
        <Label>Redes sociais</Label>
        <div className="flex flex-wrap gap-3">
          {NETWORKS.map(net => (
            <label
              key={net.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-all ${
                networks.includes(net.id)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-secondary text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              <Checkbox
                checked={networks.includes(net.id)}
                onCheckedChange={() => toggleNetwork(net.id)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-sm font-medium">{net.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full font-display text-base"
        disabled={generating || !topic || !tone || !size || networks.length === 0}
      >
        {generating ? (
          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando...</>
        ) : (
          <><Sparkles className="mr-2 h-5 w-5" /> Gerar Post</>
        )}
      </Button>
    </form>
  );
}
