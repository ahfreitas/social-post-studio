import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getActiveProfile, buildProfileForEdgeFunction } from '@/lib/profiles-store';
import PostResult from '@/components/PostResult';
import PostScore from '@/components/PostScore';
import { NavLink } from '@/components/NavLink';
import type { GeneratedPost, PostScore as PostScoreType } from '@/types/post';

const TONES = [
  { value: 'inspirador', label: 'Inspirador' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'provocativo', label: 'Provocativo' },
  { value: 'leve', label: 'Leve' },
  { value: 'institucional', label: 'Institucional' },
  { value: 'autentico', label: 'Autêntico' },
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

const LANGUAGE_STYLES = [
  { value: 'direto', label: 'Direto' },
  { value: 'conversacional', label: 'Conversacional' },
  { value: 'narrativo', label: 'Narrativo' },
  { value: 'reflexivo', label: 'Reflexivo' },
  { value: 'tecnico-acessivel', label: 'Técnico acessível' },
  { value: 'espontaneo', label: 'Espontâneo' },
];

export default function Repurpose() {
  const [originalText, setOriginalText] = useState('');
  const [tone, setTone] = useState('');
  const [languageStyle, setLanguageStyle] = useState('');
  const [language, setLanguage] = useState('');
  const [size, setSize] = useState('');
  const [networks, setNetworks] = useState<string[]>([]);
  const [audience, setAudience] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedPost | null>(null);

  const toggleNetwork = (id: string) => {
    setNetworks(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  };

  const handleRepurpose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalText || !tone || !languageStyle || !language || !size || networks.length === 0) return;

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('repurpose-post', {
        body: { originalText, tone, languageStyle, language, networks, size, audience },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      let textContent = data.text || '';
      if (typeof textContent === 'string' && textContent.trimStart().startsWith('{')) {
        try { textContent = JSON.parse(textContent).text || textContent; } catch {}
      }

      const langLabel = LANGUAGES.find(l => l.value === language)?.label || language;

      const post: GeneratedPost = {
        id: crypto.randomUUID(),
        topic: 'Repurpose',
        tone,
        audience: audience || 'Público geral',
        size,
        networks,
        language: langLabel,
        content: textContent,
        hashtags: data.hashtags || [],
        sources: data.sources || [],
        trends: data.trends || [],
        imagePrompt: data.imagePrompt || '',
        score: data.score || undefined,
        createdAt: new Date().toISOString(),
      };

      setResult(post);

      // Save to database
      const scoreOverall = post.score
        ? (post.score.clarity + post.score.engagement + post.score.authenticity + post.score.provocation) / 4
        : 0;
      await supabase.from('saved_posts').insert({
        content: post.content,
        hashtags: post.hashtags,
        tone: post.tone,
        language: post.language,
        networks: post.networks,
        topic: post.topic,
        audience: post.audience,
        size: post.size,
        image_prompt: post.imagePrompt,
        sources: post.sources,
        trends: post.trends,
        score_clarity: post.score?.clarity || 0,
        score_engagement: post.score?.engagement || 0,
        score_authenticity: post.score?.authenticity || 0,
        score_provocation: post.score?.provocation || 0,
        score_overall: scoreOverall,
        score_diagnosis: post.score?.overallDiagnosis || '',
      } as never);
    } catch (err) {
      console.error('Erro ao repurposar:', err);
      alert(err instanceof Error ? err.message : 'Erro ao repurposar post');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-3 lg:px-6">
        <div className="mx-auto max-w-2xl flex items-center gap-4">
          <NavLink to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </NavLink>
          <h1 className="font-display text-lg font-semibold">Modo Repurpose</h1>
        </div>
      </header>

      <main className="p-4 lg:p-8">
        <div className="mx-auto max-w-2xl">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="font-display text-base">Cole o post original e configure a transformação</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRepurpose} className="space-y-5">
                <div className="space-y-2">
                  <Label>Post original</Label>
                  <Textarea
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    placeholder="Cole aqui o post que deseja transformar..."
                    className="bg-secondary border-border min-h-[160px] resize-y"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Novo tom de voz</Label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Novo estilo de linguagem</Label>
                    <Select value={languageStyle} onValueChange={setLanguageStyle} required>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Selecione o estilo" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_STYLES.map(ls => (
                          <SelectItem key={ls.value} value={ls.value}>{ls.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Idioma de destino</Label>
                    <Select value={language} onValueChange={setLanguage} required>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Selecione o idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(l => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Público-alvo (opcional)</Label>
                  <Input
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="Ex: Empreendedores, 25-40 anos"
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Rede social de destino</Label>
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
                  disabled={generating || !originalText || !tone || !languageStyle || !language || !size || networks.length === 0}
                >
                  {generating ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Transformando...</>
                  ) : (
                    <><RefreshCw className="mr-2 h-5 w-5" /> Repurpose</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {result && (
            <>
              <PostResult post={result} />
              {result.score && <PostScore score={result.score} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
