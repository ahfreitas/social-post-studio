import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Check, X, ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import { getHooks, addHook, updateHook, deleteHook, type Hook } from '@/lib/hooks-store';
import { useNavigate } from 'react-router-dom';

export default function HookLibrary() {
  const [hooks, setHooks] = useState<Hook[]>(getHooks);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const navigate = useNavigate();

  const handleAdd = () => {
    if (!newText.trim()) return;
    setHooks(addHook(newText.trim()));
    setNewText('');
  };

  const handleEdit = (hook: Hook) => {
    setEditingId(hook.id);
    setEditText(hook.text);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editText.trim()) return;
    setHooks(updateHook(editingId, editText.trim()));
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = (id: string) => {
    setHooks(deleteHook(id));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 lg:px-6">
        <button onClick={() => navigate('/')} className="rounded-md p-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <BookOpen className="h-5 w-5 text-primary" />
        <h1 className="font-display text-lg font-semibold">Biblioteca de Hooks</h1>
      </header>

      <main className="mx-auto max-w-2xl p-4 lg:p-8 space-y-6">
        <p className="text-sm text-muted-foreground">
          Hooks são frases de abertura poderosas para seus posts. Selecione um hook no formulário de geração para usá-lo como início do post.
        </p>

        {/* Add new hook */}
        <div className="flex gap-2">
          <Input
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="Escreva um novo hook..."
            className="bg-secondary border-border flex-1"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={!newText.trim()}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        </div>

        {/* Hooks list */}
        <div className="space-y-2">
          {hooks.map(hook => (
            <Card key={hook.id} className="border-border bg-card">
              <CardContent className="flex items-start gap-3 p-4">
                {editingId === hook.id ? (
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      className="bg-secondary border-border flex-1"
                      onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="text-green-500 hover:text-green-400">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="text-muted-foreground">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <p className="flex-1 text-sm text-foreground leading-relaxed">"{hook.text}"</p>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(hook)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(hook.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
