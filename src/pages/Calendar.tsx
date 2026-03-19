import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HistorySidebar from '@/components/HistorySidebar';
import { Menu, X, ChevronLeft, ChevronRight, Plus, Copy, Check, Eye, CalendarDays, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Reuse config from PostForm
const TONES = [
  { value: 'inspirador', label: 'Inspirador' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'provocativo', label: 'Provocativo' },
  { value: 'leve', label: 'Leve' },
  { value: 'institucional', label: 'Institucional' },
  { value: 'autentico', label: 'Autêntico' },
];

const SIZES = [
  { value: 'curto', label: 'Curto' },
  { value: 'medio', label: 'Médio' },
  { value: 'longo', label: 'Longo' },
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

const WEEKDAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

interface CalendarPost {
  id: string;
  scheduled_date: string;
  status: string;
  series_id: string | null;
  series_order: number | null;
  topic: string;
  tone: string;
  language: string;
  networks: string[];
  content: string | null;
  hashtags: string[];
  score_overall: number;
  score_clarity: number;
  score_engagement: number;
  score_authenticity: number;
  score_provocation: number;
  score_diagnosis: string;
  image_prompt: string;
  language_style: string;
  size: string;
}

interface PostSeries {
  id: string;
  topic: string;
}

// Series color palette
const SERIES_COLORS = [
  'hsl(24 95% 53%)',   // primary orange
  'hsl(200 80% 50%)',  // blue
  'hsl(150 60% 45%)',  // green
  'hsl(280 70% 55%)',  // purple
  'hsl(340 75% 55%)',  // pink
  'hsl(45 90% 50%)',   // yellow
];

function getSeriesColor(seriesId: string, allSeriesIds: string[]): string {
  const idx = allSeriesIds.indexOf(seriesId);
  return SERIES_COLORS[idx % SERIES_COLORS.length];
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  planned: { label: 'Planejado', className: 'bg-muted text-muted-foreground' },
  generated: { label: 'Gerado', className: 'bg-primary/20 text-primary' },
  published: { label: 'Publicado', className: 'bg-green-500/20 text-green-400' },
};

export default function Calendar() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [series, setSeries] = useState<PostSeries[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayDialog, setShowDayDialog] = useState(false);
  const [showSeriesDialog, setShowSeriesDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [copied, setCopied] = useState(false);

  // Series form
  const [seriesTopic, setSeriesTopic] = useState('');
  const [seriesPostCount, setSeriesPostCount] = useState('3');
  const [seriesTone, setSeriesTone] = useState('');
  const [seriesLanguageStyle, setSeriesLanguageStyle] = useState('');
  const [seriesLanguage, setSeriesLanguage] = useState('');
  const [seriesNetworks, setSeriesNetworks] = useState<string[]>([]);
  const [seriesSize, setSeriesSize] = useState('');
  const [seriesWeekdays, setSeriesWeekdays] = useState<number[]>([]);
  const [generatingSeries, setGeneratingSeries] = useState(false);

  // Individual post form
  const [individualTopic, setIndividualTopic] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [startOffset, daysInMonth]);

  const seriesIds = useMemo(() => {
    const ids = new Set<string>();
    posts.forEach(p => { if (p.series_id) ids.add(p.series_id); });
    return Array.from(ids);
  }, [posts]);

  useEffect(() => {
    fetchPosts();
  }, [month, year]);

  const fetchPosts = async () => {
    setLoading(true);
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const { data: postsData } = await supabase
      .from('calendar_posts')
      .select('*')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date');

    const { data: seriesData } = await supabase.from('post_series').select('id, topic');

    setPosts((postsData as CalendarPost[]) || []);
    setSeries((seriesData as PostSeries[]) || []);
    setLoading(false);
  };

  const getPostsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return posts.filter(p => p.scheduled_date === dateStr);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setShowDayDialog(true);
  };

  const handleCreateIndividual = async () => {
    if (!selectedDate || !individualTopic) return;
    await supabase.from('calendar_posts').insert({
      scheduled_date: selectedDate,
      status: 'planned',
      topic: individualTopic,
      tone: 'provocativo',
      language: 'Português',
      networks: ['linkedin'],
    } as never);
    setIndividualTopic('');
    setShowDayDialog(false);
    fetchPosts();
    toast.success('Post planejado criado!');
  };

  const handleOpenSeriesDialog = () => {
    setShowDayDialog(false);
    setShowSeriesDialog(true);
  };

  const toggleSeriesWeekday = (day: number) => {
    setSeriesWeekdays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
  };

  const toggleSeriesNetwork = (id: string) => {
    setSeriesNetworks(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  };

  const getNextDatesForWeekdays = (startDate: string, weekdays: number[], count: number): string[] => {
    const dates: string[] = [];
    const start = new Date(startDate + 'T12:00:00');
    const current = new Date(start);

    while (dates.length < count) {
      if (weekdays.includes(current.getDay())) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const handleCreateSeries = async () => {
    if (!seriesTopic || !seriesTone || !seriesLanguageStyle || !seriesLanguage || seriesNetworks.length === 0 || !seriesSize || seriesWeekdays.length === 0 || !selectedDate) return;

    setGeneratingSeries(true);
    try {
      const count = parseInt(seriesPostCount);

      // Create series record
      const { data: seriesRecord, error: seriesError } = await supabase
        .from('post_series')
        .insert({
          topic: seriesTopic,
          tone: seriesTone,
          language_style: seriesLanguageStyle,
          language: seriesLanguage,
          networks: seriesNetworks,
          size: seriesSize,
          post_count: count,
          weekdays: seriesWeekdays,
        } as never)
        .select()
        .single();

      if (seriesError) throw seriesError;

      // Generate posts via edge function
      const { data: result, error: fnError } = await supabase.functions.invoke('generate-series', {
        body: {
          topic: seriesTopic,
          tone: seriesTone,
          languageStyle: seriesLanguageStyle,
          language: seriesLanguage,
          networks: seriesNetworks,
          size: seriesSize,
          postCount: count,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (result?.error) throw new Error(result.error);

      const generatedPosts = result.posts || [];
      const scheduleDates = getNextDatesForWeekdays(selectedDate, seriesWeekdays, count);

      // Insert calendar posts
      const inserts = generatedPosts.map((p: any, i: number) => ({
        scheduled_date: scheduleDates[i] || selectedDate,
        status: 'generated',
        series_id: seriesRecord.id,
        series_order: i + 1,
        topic: seriesTopic,
        tone: seriesTone,
        language_style: seriesLanguageStyle,
        language: LANGUAGES.find(l => l.value === seriesLanguage)?.label || seriesLanguage,
        networks: seriesNetworks,
        size: seriesSize,
        content: p.text,
        hashtags: p.hashtags || [],
        image_prompt: p.imagePrompt || '',
        score_clarity: p.score?.clarity || 0,
        score_engagement: p.score?.engagement || 0,
        score_authenticity: p.score?.authenticity || 0,
        score_provocation: p.score?.provocation || 0,
        score_overall: p.score ? (p.score.clarity + p.score.engagement + p.score.authenticity + p.score.provocation) / 4 : 0,
        score_diagnosis: p.score?.overallDiagnosis || '',
      }));

      await supabase.from('calendar_posts').insert(inserts as never[]);

      setShowSeriesDialog(false);
      setSeriesTopic('');
      setSeriesTone('');
      setSeriesLanguageStyle('');
      setSeriesLanguage('');
      setSeriesNetworks([]);
      setSeriesSize('');
      setSeriesWeekdays([]);
      fetchPosts();
      toast.success(`Série de ${count} posts criada!`);
    } catch (err) {
      console.error('Erro ao criar série:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao criar série');
    } finally {
      setGeneratingSeries(false);
    }
  };

  const handlePostClick = (post: CalendarPost) => {
    setSelectedPost(post);
    setShowPostDialog(true);
  };

  const handleCopy = async () => {
    if (!selectedPost?.content) return;
    await navigator.clipboard.writeText(selectedPost.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkPublished = async () => {
    if (!selectedPost) return;
    await supabase.from('calendar_posts').update({ status: 'published' } as never).eq('id', selectedPost.id);
    setSelectedPost({ ...selectedPost, status: 'published' });
    fetchPosts();
    toast.success('Post marcado como publicado!');
  };

  const getSeriesPosts = (seriesId: string) => {
    return posts.filter(p => p.series_id === seriesId).sort((a, b) => (a.series_order || 0) - (b.series_order || 0));
  };

  // Weekly summary
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const weekPosts = posts.filter(p => {
    const d = new Date(p.scheduled_date + 'T12:00:00');
    return d >= startOfWeek && d <= endOfWeek;
  });

  const weekPlanned = weekPosts.filter(p => p.status === 'planned').length;
  const weekGenerated = weekPosts.filter(p => p.status === 'generated').length;
  const weekPublished = weekPosts.filter(p => p.status === 'published').length;

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <HistorySidebar posts={[]} selectedId={null} onSelect={() => {}} />
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:px-6">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-md p-2 text-muted-foreground hover:text-foreground lg:hidden">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="font-display text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Calendário Editorial
          </h1>
          <div />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendar Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="font-display text-xl font-semibold capitalize">{monthName}</h2>
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map(wd => (
                  <div key={wd.value} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {wd.label}
                  </div>
                ))}

                {calendarDays.map((day, idx) => {
                  if (day === null) return <div key={`empty-${idx}`} className="min-h-[80px]" />;

                  const dayPosts = getPostsForDay(day);
                  const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

                  return (
                    <div
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={`min-h-[80px] rounded-lg border p-1.5 cursor-pointer transition-colors hover:border-primary/50 ${
                        isToday ? 'border-primary bg-primary/5' : 'border-border bg-card'
                      }`}
                    >
                      <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayPosts.slice(0, 3).map(post => (
                          <div
                            key={post.id}
                            onClick={(e) => { e.stopPropagation(); handlePostClick(post); }}
                            className="text-[10px] truncate rounded px-1 py-0.5 cursor-pointer hover:opacity-80"
                            style={{
                              backgroundColor: post.series_id ? getSeriesColor(post.series_id, seriesIds) + '22' : 'hsl(var(--muted))',
                              borderLeft: post.series_id ? `3px solid ${getSeriesColor(post.series_id, seriesIds)}` : '3px solid hsl(var(--muted-foreground))',
                              color: 'hsl(var(--foreground))',
                            }}
                          >
                            {post.topic.slice(0, 20)}
                          </div>
                        ))}
                        {dayPosts.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{dayPosts.length - 3}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly Summary Sidebar */}
            <div className="lg:w-64 space-y-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-display text-sm font-semibold mb-3">Resumo da Semana</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Planejados</span>
                    <Badge variant="secondary">{weekPlanned}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Gerados</span>
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30">{weekGenerated}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Publicados</span>
                    <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">{weekPublished}</Badge>
                  </div>
                </div>
              </div>

              {/* Series Legend */}
              {seriesIds.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="font-display text-sm font-semibold mb-3">Séries Ativas</h3>
                  <div className="space-y-2">
                    {seriesIds.map(sid => {
                      const s = series.find(s => s.id === sid);
                      return (
                        <div key={sid} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: getSeriesColor(sid, seriesIds) }} />
                          <span className="text-xs text-muted-foreground truncate">{s?.topic || 'Série'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Day Click Dialog */}
      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Post individual</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Tema do post"
                  value={individualTopic}
                  onChange={e => setIndividualTopic(e.target.value)}
                  className="bg-secondary border-border"
                />
                <Button onClick={handleCreateIndividual} disabled={!individualTopic} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Criar
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">ou</span></div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleOpenSeriesDialog}>
              <CalendarDays className="h-4 w-4 mr-2" /> Criar Série de Posts
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Series Creation Dialog */}
      <Dialog open={showSeriesDialog} onOpenChange={setShowSeriesDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Criar Série de Posts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tema central da série</Label>
              <Input value={seriesTopic} onChange={e => setSeriesTopic(e.target.value)} placeholder="Ex: Os 3 erros que matam a transformação digital" className="bg-secondary border-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Número de posts</Label>
                <Select value={seriesPostCount} onValueChange={setSeriesPostCount}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 posts</SelectItem>
                    <SelectItem value="3">3 posts</SelectItem>
                    <SelectItem value="4">4 posts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tamanho</Label>
                <Select value={seriesSize} onValueChange={setSeriesSize}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Tamanho" /></SelectTrigger>
                  <SelectContent>
                    {SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tom de voz</Label>
                <Select value={seriesTone} onValueChange={setSeriesTone}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Tom" /></SelectTrigger>
                  <SelectContent>
                    {TONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estilo de linguagem</Label>
                <Select value={seriesLanguageStyle} onValueChange={setSeriesLanguageStyle}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Estilo" /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_STYLES.map(ls => <SelectItem key={ls.value} value={ls.value}>{ls.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Idioma</Label>
              <Select value={seriesLanguage} onValueChange={setSeriesLanguage}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Idioma" /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dias da semana para publicar</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(wd => (
                  <label key={wd.value} className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 cursor-pointer text-sm transition-all ${
                    seriesWeekdays.includes(wd.value) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground'
                  }`}>
                    <Checkbox checked={seriesWeekdays.includes(wd.value)} onCheckedChange={() => toggleSeriesWeekday(wd.value)} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-3.5 w-3.5" />
                    {wd.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Redes sociais</Label>
              <div className="flex flex-wrap gap-2">
                {NETWORKS.map(net => (
                  <label key={net.id} className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 cursor-pointer text-sm transition-all ${
                    seriesNetworks.includes(net.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground'
                  }`}>
                    <Checkbox checked={seriesNetworks.includes(net.id)} onCheckedChange={() => toggleSeriesNetwork(net.id)} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-3.5 w-3.5" />
                    {net.label}
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleCreateSeries} className="w-full" disabled={generatingSeries || !seriesTopic || !seriesTone || !seriesLanguageStyle || !seriesLanguage || !seriesSize || seriesNetworks.length === 0 || seriesWeekdays.length === 0}>
              {generatingSeries ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando série...</>
              ) : (
                <><CalendarDays className="h-4 w-4 mr-2" /> Criar Série</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Detail Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              {selectedPost?.topic}
              {selectedPost && (
                <Badge className={STATUS_LABELS[selectedPost.status]?.className || ''}>
                  {STATUS_LABELS[selectedPost.status]?.label || selectedPost.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              {/* Series navigation */}
              {selectedPost.series_id && (
                <div className="rounded-lg border border-border bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Post {selectedPost.series_order} da série
                  </p>
                  <div className="flex gap-1">
                    {getSeriesPosts(selectedPost.series_id).map(sp => (
                      <button
                        key={sp.id}
                        onClick={() => setSelectedPost(sp)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          sp.id === selectedPost.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        Post {sp.series_order}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                <span>{new Date(selectedPost.scheduled_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                <span>{selectedPost.language}</span>
                <span>{selectedPost.networks?.join(', ')}</span>
              </div>

              {selectedPost.content ? (
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <p className="text-sm whitespace-pre-wrap">{selectedPost.content}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Post ainda não gerado.</p>
              )}

              {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedPost.hashtags.map((h, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">#{h}</Badge>
                  ))}
                </div>
              )}

              {selectedPost.score_overall > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Clareza', value: selectedPost.score_clarity },
                    { label: 'Engajamento', value: selectedPost.score_engagement },
                    { label: 'Autenticidade', value: selectedPost.score_authenticity },
                    { label: 'Provocação', value: selectedPost.score_provocation },
                  ].map(s => (
                    <div key={s.label} className="text-center rounded-lg bg-muted p-2">
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      <p className="text-lg font-bold text-primary">{Number(s.value).toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                {selectedPost.content && (
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </Button>
                )}
                {selectedPost.status !== 'published' && (
                  <Button size="sm" onClick={handleMarkPublished}>
                    <Eye className="h-4 w-4 mr-1" /> Marcar como Publicado
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
