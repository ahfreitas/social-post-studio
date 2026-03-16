import { useState } from 'react';
import PostForm from '@/components/PostForm';
import PostResult from '@/components/PostResult';
import PostScore from '@/components/PostScore';
import HistorySidebar from '@/components/HistorySidebar';
import { Menu, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { GeneratedPost } from '@/types/post';

export default function Dashboard() {
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<GeneratedPost[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [generatingVariation, setGeneratingVariation] = useState<string | null>(null);

  const handleGenerate = (newPosts: GeneratedPost[]) => {
    setPosts(prev => [...newPosts, ...prev]);
    setSelectedPosts(newPosts);
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

      const variation: GeneratedPost = {
        id: crypto.randomUUID(),
        topic: post.topic,
        tone: post.tone,
        audience: post.audience,
        size: post.size,
        networks: post.networks,
        language: post.language,
        content: result.text,
        hashtags: result.hashtags || [],
        sources: result.sources || [],
        trends: result.trends || [],
        imagePrompt: result.imagePrompt || '',
        score: result.score || undefined,
        createdAt: new Date().toISOString(),
      };

      setPosts(prev => [variation, ...prev]);
      setSelectedPosts(prev => [...prev, variation]);
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
                <PostResult post={post} />
                {post.score && (
                  <PostScore
                    score={post.score}
                    onGenerateVariation={() => handleGenerateVariation(post)}
                    isGenerating={generatingVariation === post.id}
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
