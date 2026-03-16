import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, ImageIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import type { GeneratedPost } from '@/types/post';

interface PostResultProps {
  post: GeneratedPost;
  onContentChange?: (postId: string, newContent: string) => void;
}

export default function PostResult({ post, onContentChange }: PostResultProps) {
  const [copied, setCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);

  const fullContent = [
    editedContent,
    post.hashtags?.length ? '\n\n' + post.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ') : '',
  ].join('');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyImage = async () => {
    await navigator.clipboard.writeText(post.imagePrompt);
    setImageCopied(true);
    setTimeout(() => setImageCopied(false), 2000);
  };

  const handleContentChange = (value: string) => {
    setEditedContent(value);
    onContentChange?.(post.id, value);
  };

  return (
    <Card className="border-border bg-card mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="font-display text-lg">Post Gerado</CardTitle>
          <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {post.language}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <><Check className="mr-1 h-4 w-4" /> Copiado</> : <><Copy className="mr-1 h-4 w-4" /> Copiar</>}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={editedContent}
          onChange={(e) => handleContentChange(e.target.value)}
          className="min-h-[120px] resize-y bg-secondary border-none text-sm leading-relaxed text-foreground focus-visible:ring-primary"
          rows={Math.max(5, editedContent.split('\n').length + 1)}
        />

        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.hashtags.map((tag, i) => (
              <span key={i} className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}

        {post.imagePrompt && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-primary">Sugestão de Imagem</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyImage} className="h-7 text-xs">
                {imageCopied ? <><Check className="mr-1 h-3 w-3" /> Copiado</> : <><Copy className="mr-1 h-3 w-3" /> Copiar</>}
              </Button>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">
              {post.imagePrompt}
            </p>
          </div>
        )}

        {post.trends?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">📈 Tendências</p>
            <div className="flex flex-wrap gap-2">
              {post.trends.map((t, i) => (
                <span key={i} className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">{t}</span>
              ))}
            </div>
          </div>
        )}

        {post.sources?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">📚 Fontes</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
              {post.sources.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {post.networks.map(n => (
            <span key={n} className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary capitalize">
              {n}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
