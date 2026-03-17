import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Check, ChevronLeft, MessageSquare, Heart, X } from 'lucide-react';
import { toast } from 'sonner';

interface SavedPost {
  id: string;
  content: string;
  hashtags: string[];
  tone: string;
  language_style: string;
  language: string;
  networks: string[];
  topic: string;
  audience: string;
  size: string;
  image_prompt: string;
  sources: string[];
  trends: string[];
  score_clarity: number;
  score_engagement: number;
  score_authenticity: number;
  score_provocation: number;
  score_overall: number;
  score_diagnosis: string;
  likes: number;
  comments: number;
  created_at: string;
}

export default function MyPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<SavedPost | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingEngagement, setEditingEngagement] = useState<string | null>(null);
  const [tempLikes, setTempLikes] = useState('');
  const [tempComments, setTempComments] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('saved_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setPosts(data as unknown as SavedPost[]);
    setLoading(false);
  };

  const handleCopy = async (content: string, hashtags: string[]) => {
    const full = [content, hashtags?.length ? '\n\n' + hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ') : ''].join('');
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEngagement = async (post: SavedPost) => {
    const likes = parseInt(tempLikes) || 0;
    const comments = parseInt(tempComments) || 0;

    const { error } = await supabase
      .from('saved_posts')
      .update({ likes, comments } as never)
      .eq('id', post.id);

    if (!error) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes, comments } : p));
      if (selectedPost?.id === post.id) setSelectedPost({ ...post, likes, comments });
      toast.success('Engajamento salvo!');
    }
    setEditingEngagement(null);
  };

  const startEditEngagement = (post: SavedPost) => {
    setEditingEngagement(post.id);
    setTempLikes(String(post.likes || 0));
    setTempComments(String(post.comments || 0));
  };

  const scoreAvg = (p: SavedPost) =>
    ((p.score_clarity + p.score_engagement + p.score_authenticity + p.score_provocation) / 4).toFixed(1);

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8">
        <div className="mx-auto max-w-2xl">
          <Button variant="ghost" onClick={() => setSelectedPost(null)} className="mb-4">
            <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>

          <Card className="border-border bg-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold">{selectedPost.topic}</h2>
                <Button variant="outline" size="sm" onClick={() => handleCopy(selectedPost.content, selectedPost.hashtags)}>
                  {copied ? <><Check className="mr-1 h-4 w-4" /> Copiado</> : <><Copy className="mr-1 h-4 w-4" /> Copiar</>}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-md bg-primary/10 px-2 py-1 text-primary">{selectedPost.language}</span>
                <span className="rounded-md bg-secondary px-2 py-1 text-secondary-foreground">{selectedPost.tone}</span>
                {selectedPost.networks.map(n => (
                  <span key={n} className="rounded-md bg-secondary px-2 py-1 text-secondary-foreground capitalize">{n}</span>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                {new Date(selectedPost.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>

              <div className="rounded-lg bg-secondary p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedPost.content}
              </div>

              {selectedPost.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedPost.hashtags.map((tag, i) => (
                    <span key={i} className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              )}

              {selectedPost.image_prompt && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-primary mb-1">Sugestão de Imagem</p>
                  <p className="text-sm text-foreground/80">{selectedPost.image_prompt}</p>
                </div>
              )}

              {selectedPost.score_overall > 0 && (
                <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-2">
                  <p className="text-sm font-semibold">Score: {scoreAvg(selectedPost)}/10</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>Clareza: {selectedPost.score_clarity}</span>
                    <span>Engajamento: {selectedPost.score_engagement}</span>
                    <span>Autenticidade: {selectedPost.score_authenticity}</span>
                    <span>Provocação: {selectedPost.score_provocation}</span>
                  </div>
                  {selectedPost.score_diagnosis && (
                    <p className="text-xs text-muted-foreground italic">{selectedPost.score_diagnosis}</p>
                  )}
                </div>
              )}

              {selectedPost.sources?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">📚 Fontes</p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground">
                    {selectedPost.sources.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {/* Engagement section */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Engajamento</p>
                  {editingEngagement !== selectedPost.id && (
                    <Button variant="outline" size="sm" onClick={() => startEditEngagement(selectedPost)}>
                      Editar
                    </Button>
                  )}
                </div>
                {editingEngagement === selectedPost.id ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Heart className="h-4 w-4 text-red-400" />
                      <Input value={tempLikes} onChange={e => setTempLikes(e.target.value)} className="w-20 h-8 bg-secondary border-border text-sm" type="number" min="0" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-blue-400" />
                      <Input value={tempComments} onChange={e => setTempComments(e.target.value)} className="w-20 h-8 bg-secondary border-border text-sm" type="number" min="0" />
                    </div>
                    <Button size="sm" onClick={() => handleSaveEngagement(selectedPost)}>Salvar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingEngagement(null)}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="h-4 w-4 text-red-400" /> {selectedPost.likes || 0} curtidas</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4 text-blue-400" /> {selectedPost.comments || 0} comentários</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold">Meus Posts</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Voltar ao Gerador
          </Button>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando...</p>
        ) : posts.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum post salvo ainda. Gere um post para começar!</p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="space-y-3">
              {posts.map(post => (
                <Card
                  key={post.id}
                  className="border-border bg-card cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => setSelectedPost(post)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold truncate">{post.topic}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {post.content.slice(0, 120)}...
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                          {post.networks.map(n => (
                            <span key={n} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground capitalize">{n}</span>
                          ))}
                          {post.score_overall > 0 && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                              Score: {scoreAvg(post)}
                            </span>
                          )}
                          {(post.likes > 0 || post.comments > 0) && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Heart className="h-3 w-3" />{post.likes} <MessageSquare className="h-3 w-3 ml-1" />{post.comments}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleCopy(post.content, post.hashtags); }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
