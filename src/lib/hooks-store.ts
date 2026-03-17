export interface Hook {
  id: string;
  text: string;
  isDefault: boolean;
}

const STORAGE_KEY = 'postgen-hooks';

const DEFAULT_HOOKS: Hook[] = [
  { id: 'default-1', text: 'Sexta-feira, 18h. Sala lotada. Ninguém sabe ao certo o que foi decidido.', isDefault: true },
  { id: 'default-2', text: 'Um executivo me disse essa semana, com toda a naturalidade...', isDefault: true },
  { id: 'default-3', text: 'Aprendi da pior forma que...', isDefault: true },
  { id: 'default-4', text: 'Tenho visto esse padrão se repetir em empresas grandes e pequenas:', isDefault: true },
  { id: 'default-5', text: 'A maioria das empresas investe em X para fazer mais do mesmo, só que mais rápido.', isDefault: true },
  { id: 'default-6', text: 'Em minha experiência, o problema raramente é a ferramenta. É o que a gente espera dela.', isDefault: true },
  { id: 'default-7', text: 'Sabe aquela reunião onde todo mundo concorda mas ninguém sabe o próximo passo?', isDefault: true },
  { id: 'default-8', text: 'Outro dia eu estava numa conversa com um líder e ele me disse algo que me fez parar.', isDefault: true },
  { id: 'default-9', text: 'Não é falta de metodologia. É falta de coragem para mudar o que realmente precisa mudar.', isDefault: true },
  { id: 'default-10', text: 'Confesso que já errei muito nisso. E foi errando que aprendi:', isDefault: true },
];

export function getHooks(): Hook[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  const initial = [...DEFAULT_HOOKS];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function saveHooks(hooks: Hook[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hooks));
}

export function addHook(text: string): Hook[] {
  const hooks = getHooks();
  const newHook: Hook = { id: crypto.randomUUID(), text, isDefault: false };
  const updated = [...hooks, newHook];
  saveHooks(updated);
  return updated;
}

export function updateHook(id: string, text: string): Hook[] {
  const hooks = getHooks();
  const updated = hooks.map(h => h.id === id ? { ...h, text } : h);
  saveHooks(updated);
  return updated;
}

export function deleteHook(id: string): Hook[] {
  const hooks = getHooks().filter(h => h.id !== id);
  saveHooks(hooks);
  return hooks;
}
