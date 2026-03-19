import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Zap, BookOpen, FileText, RefreshCw, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { GeneratedPost } from '@/types/post';

interface HistorySidebarProps {
  posts: GeneratedPost[];
  selectedId: string | null;
  onSelect: (post: GeneratedPost) => void;
}

export default function HistorySidebar({ posts, selectedId, onSelect }: HistorySidebarProps) {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
        <Zap className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold text-sidebar-accent-foreground">PostGen</h2>
      </div>

      <div className="px-2 py-3 space-y-1">
        <button
          onClick={() => navigate('/meus-posts')}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <FileText className="h-4 w-4 text-primary" />
          Meus Posts
        </button>
        <button
          onClick={() => navigate('/hooks')}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <BookOpen className="h-4 w-4 text-primary" />
          Biblioteca de Hooks
        </button>
        <button
          onClick={() => navigate('/repurpose')}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <RefreshCw className="h-4 w-4 text-primary" />
          Repurpose
        </button>
      </div>

      <div className="px-4 py-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Histórico</p>
      </div>

      <ScrollArea className="flex-1 px-2">
        {posts.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">Nenhum post gerado ainda</p>
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {posts.map(post => (
              <button
                key={post.id}
                onClick={() => onSelect(post)}
                className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                  selectedId === post.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <p className="truncate text-sm font-medium">{post.topic}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(post.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}