import { useState } from 'react';
import PostForm from '@/components/PostForm';
import PostResult from '@/components/PostResult';
import PostScore from '@/components/PostScore';
import HistorySidebar from '@/components/HistorySidebar';
import { Menu, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { GeneratedPost, PostScore as PostScoreType } from '@/types/post';

export default function Dashboard() {
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<GeneratedPost[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [generatingVariation, setGeneratingVariation] = useState<string | null>(null);
  const [reevaluating, setReevaluating] = useState<string | null>(null);
  const [editedContents, setEditedContents] = useState<Record<string, string>>({});
  const [previousScores, setPreviousScores] = useState<Record<string, PostScoreType>>({});
  const [showCongrats, setShowCongrats] = useState<Record<string, boolean>>({});

  const handleGenerate = (newPosts: GeneratedPost[]) => {
    setPosts(prev => [...newPosts, ...prev]);
    setSelectedPosts(newPosts);
    // Auto-save to database
    newPosts.forEach(post => savePost(post));
  };

  const savePost = async (post: GeneratedPost) => {
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
  };

  const handleContentChange = (postId: string, newContent: string) => {
    setEditedContents(prev => ({ ...prev, [postId]: newContent }));
  };

  const handleReevaluate = async (post: GeneratedPost) => {
    setReevaluating(post.id);
    try {
      const currentContent = editedContents[post.id] ?? post.content;

      const { data: result, error } = await supabase.functions.invoke('reevaluate-post', {
        body: { text: currentContent },
      });

      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);

      const newScore: PostScoreType = result;
      const oldScore = post.score;

      if (oldScore) {
        setPreviousScores(prev => ({ ...prev, [post.id]: oldScore }));
        const oldOverall = (oldScore.clarity + oldScore.engagement + oldScore.authenticity + oldScore.provocation) / 4;
        const newOverall = (newScore.clarity + newScore.engagement + newScore.authenticity + newScore.provocation) / 4;
        setShowCongrats(prev => ({ ...prev, [post.id]: newOverall > oldOverall }));
      }

      const updatePost = (p: GeneratedPost) =>
        p.id === post.id ? { ...p, score: newScore, content: currentContent } : p;

      setPosts(prev => prev.map(updatePost));
      setSelectedPosts(prev => prev.map(updatePost));
    } catch (err) {
      console.error('Erro ao reavaliar:', err);
      alert(err instanceof Error ? err.message : 'Erro ao reavaliar post');
    } finally {
      setReevaluating(null);
    }
  };

  const handleGenerateVariation = async (post: GeneratedPost) => {
    setGeneratingVariation(post.id);
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-post', {
        body: {
          topic: post.topic,
          tone: post.tone,
          audience: post.audience,
          size: post.size,
          networks: post.networks,
          language: post.language === 'Português' ? 'portugues' : post.language === 'Inglês' ? 'ingles' : post.language === 'Espanhol' ? 'espanhol' : 'alemao',
          imageTone: 'corporativo',
          languageStyle: 'direto',
        },
      });

      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);

      // Handle nested JSON in text field
      let textContent = result.text || '';
      if (typeof textContent === 'string' && textContent.trimStart().startsWith('{')) {
        try {
          const parsed = JSON.parse(textContent);
          textContent = parsed.text || textContent;
        } catch {
          // Not valid JSON, use as-is
        }
      }

      const variation: GeneratedPost = {
        id: crypto.randomUUID(),
        topic: post.topic,
        tone: post.tone,
        audience: post.audience,
        size: post.size,
        networks: post.networks,
        language: post.language,
        content: textContent,
        hashtags: result.hashtags || [],
        sources: result.sources || [],
        trends: result.trends || [],
        imagePrompt: result.imagePrompt || '',
        score: result.score || undefined,
        createdAt: new Date().toISOString(),
      };

      setPosts(prev => [variation, ...prev]);
      setSelectedPosts(prev => [...prev, variation]);
      savePost(variation);
    } catch (err) {
      console.error('Erro ao gerar variação:', err);
      alert(err instanceof Error ? err.message : 'Erro ao gerar variação');
    } finally {
      setGeneratingVariation(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform lg:relative lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <HistorySidebar
          posts={posts}
          selectedId={selectedPosts[0]?.id ?? null}
          onSelect={(post) => { setSelectedPosts([post]); setSidebarOpen(false); }}
        />
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="font-display text-lg font-semibold">Gerador de Posts</h1>
          <div />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto max-w-2xl">
            <PostForm onGenerate={handleGenerate} />
            {selectedPosts.map(post => (
              <div key={post.id}>
                <PostResult
                  post={post}
                  onContentChange={handleContentChange}
                />
                {post.score && (
                  <PostScore
                    score={post.score}
                    previousScore={previousScores[post.id]}
                    onGenerateVariation={() => handleGenerateVariation(post)}
                    onReevaluate={() => handleReevaluate(post)}
                    isGenerating={generatingVariation === post.id}
                    isReevaluating={reevaluating === post.id}
                    showCongrats={showCongrats[post.id]}
                  />
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
