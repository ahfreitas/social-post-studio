import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Plus, Trash2, Check, PenLine } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { getProfiles, saveProfiles, addProfile, updateProfile, deleteProfile, getActiveProfile, setActiveProfileId, type Profile } from '@/lib/profiles-store';

const TONES = [
  { value: 'inspirador', label: 'Inspirador' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'provocativo', label: 'Provocativo' },
  { value: 'leve', label: 'Leve' },
  { value: 'institucional', label: 'Institucional' },
  { value: 'autentico', label: 'Autêntico' },
];

const LANGUAGE_STYLES = [
  { value: 'direto', label: 'Direto' },
  { value: 'conversacional', label: 'Conversacional' },
  { value: 'narrativo', label: 'Narrativo' },
  { value: 'reflexivo', label: 'Reflexivo' },
  { value: 'tecnico-acessivel', label: 'Técnico acessível' },
  { value: 'espontaneo', label: 'Espontâneo' },
];

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState('');
  const [editing, setEditing] = useState<Profile | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setProfiles(getProfiles());
    setActiveId(getActiveProfile().id);
  }, []);

  const handleActivate = (id: string) => {
    setActiveProfileId(id);
    setActiveId(id);
  };

  const handleEdit = (profile: Profile) => {
    setEditing({ ...profile });
    setCreating(false);
  };

  const handleCreate = () => {
    setEditing({
      id: '',
      name: '',
      area: '',
      bio: '',
      recurringTopics: '',
      worldview: '',
      communicationStyle: '',
      toneCalibration: '',
      languageRules: '',
      openingRules: '',
      referenceExamples: '',
      defaultTone: 'provocativo',
      defaultLanguageStyle: 'direto',
      isDefault: false,
    });
    setCreating(true);
  };

  const handleSave = () => {
    if (!editing || !editing.name) return;
    if (creating) {
      const { id, isDefault, ...rest } = editing;
      const updated = addProfile(rest);
      setProfiles(updated);
    } else {
      const updated = updateProfile(editing.id, editing);
      setProfiles(updated);
    }
    setEditing(null);
    setCreating(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Excluir este perfil?')) return;
    const updated = deleteProfile(id);
    setProfiles(updated);
    if (activeId === id && updated.length > 0) {
      handleActivate(updated[0].id);
    }
  };

  const field = (label: string, key: keyof Profile, multiline = false) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {multiline ? (
        <Textarea
          value={(editing?.[key] as string) || ''}
          onChange={(e) => setEditing(prev => prev ? { ...prev, [key]: e.target.value } : null)}
          className="bg-secondary border-border min-h-[100px] resize-y text-sm"
        />
      ) : (
        <Input
          value={(editing?.[key] as string) || ''}
          onChange={(e) => setEditing(prev => prev ? { ...prev, [key]: e.target.value } : null)}
          className="bg-secondary border-border"
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-3 lg:px-6">
        <div className="mx-auto max-w-3xl flex items-center gap-4">
          <NavLink to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </NavLink>
          <h1 className="font-display text-lg font-semibold">Perfis</h1>
        </div>
      </header>

      <main className="p-4 lg:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              O perfil ativo define a voz e o estilo de todos os posts gerados.
            </p>
            <Button size="sm" onClick={handleCreate} variant="outline">
              <Plus className="mr-1.5 h-4 w-4" /> Novo Perfil
            </Button>
          </div>

          {/* Profile list */}
          {!editing && (
            <div className="space-y-3">
              {profiles.map(p => (
                <Card key={p.id} className={`border transition-colors ${activeId === p.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <CardContent className="flex items-center justify-between py-4 px-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.area}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {activeId === p.id ? (
                        <span className="text-xs font-medium text-primary flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Ativo
                        </span>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleActivate(p.id)} className="text-xs">
                          Ativar
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(p)}>
                        <PenLine className="h-4 w-4" />
                      </Button>
                      {!p.isDefault && (
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit/Create form */}
          {editing && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-display text-base">
                  {creating ? 'Novo Perfil' : `Editar: ${editing.name}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {field('Nome', 'name')}
                {field('Área de atuação', 'area')}
                {field('Bio e contexto profissional', 'bio', true)}
                {field('Temas recorrentes', 'recurringTopics', true)}
                {field('Como essa pessoa enxerga o mundo', 'worldview', true)}
                {field('Estilo de comunicação', 'communicationStyle', true)}
                {field('Calibração por tom', 'toneCalibration', true)}
                {field('Regras de linguagem', 'languageRules', true)}
                {field('Regras de abertura', 'openingRules', true)}
                {field('Exemplos de posts de referência', 'referenceExamples', true)}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Tom de voz padrão</Label>
                    <Select value={editing.defaultTone} onValueChange={(v) => setEditing(prev => prev ? { ...prev, defaultTone: v } : null)}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Estilo de linguagem padrão</Label>
                    <Select value={editing.defaultLanguageStyle} onValueChange={(v) => setEditing(prev => prev ? { ...prev, defaultLanguageStyle: v } : null)}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_STYLES.map(ls => <SelectItem key={ls.value} value={ls.value}>{ls.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSave} disabled={!editing.name}>
                    <Check className="mr-1.5 h-4 w-4" /> Salvar
                  </Button>
                  <Button variant="outline" onClick={() => { setEditing(null); setCreating(false); }}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
