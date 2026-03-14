import { useState } from 'react';
import PostForm from '@/components/PostForm';
import PostResult from '@/components/PostResult';
import HistorySidebar from '@/components/HistorySidebar';
import { Menu, X } from 'lucide-react';
import type { GeneratedPost } from '@/types/post';

export default function Dashboard() {
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<GeneratedPost[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleGenerate = (newPosts: GeneratedPost[]) => {
    setPosts(prev => [...newPosts, ...prev]);
    setSelectedPosts(newPosts);
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
              <PostResult key={post.id} post={post} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
