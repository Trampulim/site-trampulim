export type Lang = 'pt' | 'es' | 'en';

export const defaultLang: Lang = 'pt';

export function getLangFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split('/');
  if (first === 'es' || first === 'en') return first;
  return 'pt';
}

export function getLocalePath(lang: Lang, path: string): string {
  if (lang === 'pt') return path || '/';
  return `/${lang}${path || ''}`;
}

export function getAlternateUrl(currentPath: string, targetLang: Lang): string {
  // strip existing lang prefix if present
  let basePath = currentPath;
  if (basePath.startsWith('/es') || basePath.startsWith('/en')) {
    basePath = basePath.slice(3) || '/';
  }
  if (targetLang === 'pt') return basePath;
  return `/${targetLang}${basePath}`;
}

export const nav = {
  pt: {
    grupo: 'Grupo Trampulim',
    historico: 'Histórico',
    ficha: 'Ficha Técnica',
    premios: 'Prêmios',
    cronologia: 'Cronologia',
    repertorio: 'Repertório',
    espetaculos: 'Espetáculos',
    intervencoes: 'Intervenções e Números',
    empresas: 'Nas Empresas',
    oficinas: 'Oficinas',
    extra: 'Extra, Extra',
    deposito: 'Depósito de Bobagens',
    contato: 'Contato',
  },
  es: {
    grupo: 'Grupo Trampulim',
    historico: 'Historia',
    ficha: 'Ficha Técnica',
    premios: 'Premios',
    cronologia: 'Cronología',
    repertorio: 'Repertorio',
    espetaculos: 'Espectáculos',
    intervencoes: 'Intervenciones y Números',
    empresas: 'En las Empresas',
    oficinas: 'Talleres',
    extra: 'Extra, Extra',
    deposito: 'Depósito de Bobadas',
    contato: 'Contacto',
  },
  en: {
    grupo: 'Grupo Trampulim',
    historico: 'History',
    ficha: 'Technical Sheet',
    premios: 'Awards',
    cronologia: 'Timeline',
    repertorio: 'Repertoire',
    espetaculos: 'Shows',
    intervencoes: 'Interventions & Acts',
    empresas: 'For Companies',
    oficinas: 'Workshops',
    extra: 'Extra, Extra',
    deposito: 'Oddities Cabinet',
    contato: 'Contact',
  },
} as const;
