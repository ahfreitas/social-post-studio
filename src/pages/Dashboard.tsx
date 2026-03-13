import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import PostForm from '@/components/PostForm';
import PostResult from '@/components/PostResult';
import HistorySidebar from '@/components/HistorySidebar';
import { LogOut, Menu, X } from 'lucide-react';
import type { GeneratedPost } from '@/types/post';

export default function Dashboard() {
  const { signOut, user } = useAuth();
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<GeneratedPost | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleGenerate = (post: GeneratedPost) => {
    setPosts(prev => [post, ...prev]);
    setSelectedPost(post);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform lg:relative lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <HistorySidebar
          posts={posts}
          selectedId={selectedPost?.id ?? null}
          onSelect={(post) => { setSelectedPost(post); setSidebarOpen(false); }}
        />
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="font-display text-lg font-semibold hidden lg:block">Gerador de Posts</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Sair
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto max-w-2xl">
            <PostForm onGenerate={handleGenerate} />
            {selectedPost && <PostResult post={selectedPost} />}
          </div>
        </main>
      </div>
    </div>
  );
}
