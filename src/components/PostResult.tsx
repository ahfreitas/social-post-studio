import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import type { GeneratedPost } from '@/types/post';

export default function PostResult({ post }: { post: GeneratedPost }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(post.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border bg-card mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="font-display text-lg">Post Gerado</CardTitle>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <><Check className="mr-1 h-4 w-4" /> Copiado</> : <><Copy className="mr-1 h-4 w-4" /> Copiar</>}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-secondary p-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {post.content}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
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
