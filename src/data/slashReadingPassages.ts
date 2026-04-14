export interface Chunk {
  en: string;
  ja: string;
}

export interface Passage {
  id: string;
  theme: 'daily' | 'travel' | 'work' | 'food';
  chunks: Chunk[];
}

export type Theme = 'daily' | 'travel' | 'work' | 'food';

export interface ThemeConfig {
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export const THEME_CONFIG: Record<Theme, ThemeConfig> = {
  daily: {
    label: '日常',
    colorClass: 'blue',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-400',
    textClass: 'text-blue-700',
  },
  travel: {
    label: '旅行',
    colorClass: 'teal',
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-400',
    textClass: 'text-teal-700',
  },
  work: {
    label: '仕事',
    colorClass: 'amber',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-400',
    textClass: 'text-amber-700',
  },
  food: {
    label: '食べ物',
    colorClass: 'rose',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-400',
    textClass: 'text-rose-700',
  },
};

export function getPlainText(passage: Passage): string {
  return passage.chunks.map((c) => c.en).join(' ');
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
