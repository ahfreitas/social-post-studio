import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { GeneratedPost } from '@/types/post';

// System prompt moved to edge function

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

const LANGUAGES = [
  { value: 'portugues', label: 'Português' },
  { value: 'ingles', label: 'Inglês' },
  { value: 'espanhol', label: 'Espanhol' },
  { value: 'alemao', label: 'Alemão' },
];

const IMAGE_TONES = [
  { value: 'corporativo', label: 'Corporativo/Profissional' },
  { value: 'minimalista', label: 'Minimalista' },
  { value: 'provocador', label: 'Provocador/Irreverente' },
  { value: 'inspirador', label: 'Inspirador' },
  { value: 'engracado', label: 'Engraçado' },
  { value: 'leve', label: 'Leve e Descontraído' },
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
  const [language, setLanguage] = useState('');
  const [imageTone, setImageTone] = useState('');
  const [generating, setGenerating] = useState(false);

  const toggleNetwork = (id: string) => {
    setNetworks(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !tone || !size || !language || !imageTone || networks.length === 0) return;

    setGenerating(true);

    const finalTone = tone === 'outro' ? customTone : tone;


    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('generate-post', {
        body: { topic, tone: finalTone, audience: audience || 'público geral', size, networks, language, imageTone },
      });

      if (fnError) throw new Error(fnError.message || 'Erro ao gerar post');
      if (result?.error) throw new Error(result.error);

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
        disabled={generating || !topic || !tone || !size || !language || !imageTone || networks.length === 0}
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
