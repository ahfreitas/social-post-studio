export interface Profile {
  id: string;
  name: string;
  area: string;
  bio: string;
  recurringTopics: string;
  worldview: string;
  communicationStyle: string;
  toneCalibration: string;
  languageRules: string;
  openingRules: string;
  referenceExamples: string;
  defaultTone: string;
  defaultLanguageStyle: string;
  isDefault: boolean;
}

const STORAGE_KEY = 'postgen-profiles';

const DEFAULT_PROFILE: Profile = {
  id: 'default-andre',
  name: 'André Freitas',
  area: 'Transformação digital, business agility e mudança cultural',
  bio: 'Especialista em transformação digital, business agility e mudança cultural com mais de 15 anos de experiência em grandes empresas brasileiras como CVC Corp, Hospital Albert Einstein, Livelo, C&A e Alelo.',
  recurringTopics: `- Transformação digital que vai além da TI
- Business Agility e Flight Levels na prática
- OKRs que funcionam de verdade (não os de PowerPoint)
- Mudança cultural como pré-requisito de qualquer transformação
- Governança ágil em escala
- Fit for Purpose: entregar o que o cliente valoriza, não o que é mais fácil de medir`,
  worldview: `- No nível operacional: times altamente ocupados, fazendo mais com menos, seguindo planos rígidos, preenchendo status reports — mas sem saber ao certo qual problema estão resolvendo
- No nível tático: altamente pressionado entre o executivo que quer certeza e o time que está perdido, sendo o para-raios de duas forças opostas
- No nível executivo: decisões tomadas no achômetro, sem métricas, sem entender o que o cliente realmente valoriza, sem experimentos — mas exigindo tiros exatos e detestando demonstrar insegurança
- O padrão que se repete: empresas que preferem controle a aprendizado, que confundem governança rígida com resultado
- A ironia central: quanto mais processo, menos clareza. Quanto mais ocupados, menos entrega de valor real.`,
  communicationStyle: `- Começa com uma cena ou situação concreta que o leitor reconhece imediatamente
- O alvo da ironia é sempre o sistema ou o padrão, nunca a pessoa
- Usa exemplos do mundo real, nunca genéricos
- O leitor sai pensando ou questionando, nunca se defendendo
- Termina com uma reflexão genuína ou pergunta que convida ao diálogo
- Emojis com moderação — só quando reforçam, nunca para enfeitar`,
  toneCalibration: `- Provocativo: expõe um padrão que todos vivem mas ninguém nomeia
- Inspirador: história real ou dado surpreendente que muda perspectiva
- Técnico: aprofunda um conceito com exemplos práticos e sem jargão vazio
- Autêntico: bastidor real de uma transformação, com o que deu certo E o que não deu
- Leve: analogia inteligente que revela algo maior sobre o mundo corporativo
- Institucional: posicionamento claro, dados sólidos, tom de referência no assunto`,
  languageRules: `Evitar completamente: mergulhar, navegar, robusto, no cenário atual, é fundamental, em um mundo onde, vale ressaltar, cada vez mais. Escrever de forma humana, natural e autêntica. Alternar primeira pessoa com vivência real: "penso que", "em minha experiência", "tenho visto isso acontecer", "aprendi da forma mais difícil que".`,
  openingRules: `NUNCA começar com perguntas retóricas genéricas como "Você já parou para pensar...", "Você sabia que...", "E se eu te dissesse que...". Começar sempre com: (1) cena específica e concreta — "Sexta-feira, 18h. Sala lotada."; (2) afirmação em primeira pessoa surpreendente — "Aprendi da pior forma que..."; (3) observação direta que quebra uma expectativa — "A maioria das empresas investe em IA para fazer mais do mesmo, só que mais rápido."`,
  referenceExamples: '',
  defaultTone: 'provocativo',
  defaultLanguageStyle: 'direto',
  isDefault: true,
};

export function getProfiles(): Profile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const profiles = JSON.parse(stored);
      if (profiles.length > 0) return profiles;
    }
  } catch {}
  const initial = [DEFAULT_PROFILE];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function getActiveProfile(): Profile {
  const profiles = getProfiles();
  const activeId = localStorage.getItem('postgen-active-profile');
  if (activeId) {
    const found = profiles.find(p => p.id === activeId);
    if (found) return found;
  }
  return profiles[0];
}

export function setActiveProfileId(id: string) {
  localStorage.setItem('postgen-active-profile', id);
}

export function saveProfiles(profiles: Profile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function addProfile(profile: Omit<Profile, 'id' | 'isDefault'>): Profile[] {
  const profiles = getProfiles();
  const newProfile: Profile = { ...profile, id: crypto.randomUUID(), isDefault: false };
  const updated = [...profiles, newProfile];
  saveProfiles(updated);
  return updated;
}

export function updateProfile(id: string, data: Partial<Profile>): Profile[] {
  const profiles = getProfiles();
  const updated = profiles.map(p => p.id === id ? { ...p, ...data } : p);
  saveProfiles(updated);
  return updated;
}

export function deleteProfile(id: string): Profile[] {
  const profiles = getProfiles().filter(p => p.id !== id);
  saveProfiles(profiles);
  return profiles;
}

export function buildProfileForEdgeFunction(profile: Profile) {
  return {
    name: profile.name,
    area: profile.area,
    bio: profile.bio,
    recurringTopics: profile.recurringTopics,
    worldview: profile.worldview,
    communicationStyle: profile.communicationStyle,
    toneCalibration: profile.toneCalibration,
    languageRules: profile.languageRules,
    openingRules: profile.openingRules,
    referenceExamples: profile.referenceExamples,
    defaultTone: profile.defaultTone,
    defaultLanguageStyle: profile.defaultLanguageStyle,
  };
}
