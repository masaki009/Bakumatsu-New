export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export type Element = '木' | '火' | '土' | '金' | '水';

export const STEM_ELEMENTS: Record<string, Element> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

export const BRANCH_ELEMENTS: Record<string, Element> = {
  '子': '水',
  '丑': '土',
  '寅': '木', '卯': '木',
  '辰': '土',
  '巳': '火', '午': '火',
  '未': '土',
  '申': '金', '酉': '金',
  '戌': '土',
  '亥': '水'
};

export const MONTH_STEMS_BASE = [
  ['丙', '戊', '庚', '壬', '甲'],
  ['丁', '己', '辛', '癸', '乙'],
  ['戊', '庚', '壬', '甲', '丙'],
  ['己', '辛', '癸', '乙', '丁'],
  ['庚', '壬', '甲', '丙', '戊'],
  ['辛', '癸', '乙', '丁', '己'],
  ['壬', '甲', '丙', '戊', '庚'],
  ['癸', '乙', '丁', '己', '辛'],
  ['甲', '丙', '戊', '庚', '壬'],
  ['乙', '丁', '己', '辛', '癸'],
  ['丙', '戊', '庚', '壬', '甲'],
  ['丁', '己', '辛', '癸', '乙']
];

export const MONTH_BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];

export interface Pillar {
  stem: string;
  branch: string;
  label: string;
}

export interface FourPillarsChart {
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  todayPillar: Pillar;
}

export interface ElementBalance {
  木: number;
  火: number;
  土: number;
  金: number;
  水: number;
}

function daysSince2000(date: Date): number {
  const base = new Date(2000, 0, 1);
  const diff = date.getTime() - base.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function calculatePillar(days: number): { stem: string; branch: string } {
  const baseStemIndex = 0;
  const baseBranchIndex = 8;

  const stemIndex = (baseStemIndex + days) % 10;
  const branchIndex = (baseBranchIndex + days) % 12;

  return {
    stem: HEAVENLY_STEMS[stemIndex < 0 ? stemIndex + 10 : stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex < 0 ? branchIndex + 12 : branchIndex]
  };
}

export function calculateYearPillar(year: number): Pillar {
  const stemIndex = (year - 4) % 10;
  const branchIndex = (year - 4) % 12;

  return {
    stem: HEAVENLY_STEMS[stemIndex < 0 ? stemIndex + 10 : stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex < 0 ? branchIndex + 12 : branchIndex],
    label: '年柱'
  };
}

export function calculateMonthPillar(year: number, month: number): Pillar {
  const yearStemIndex = (year - 4) % 10;
  const monthIndex = month - 1;

  const stem = MONTH_STEMS_BASE[monthIndex][yearStemIndex % 5];
  const branch = MONTH_BRANCHES[monthIndex];

  return {
    stem,
    branch,
    label: '月柱'
  };
}

export function calculateDayPillar(date: Date): Pillar {
  const days = daysSince2000(date);
  const pillar = calculatePillar(days);

  return {
    ...pillar,
    label: '日柱'
  };
}

export function calculateTodayPillar(date: Date): Pillar {
  const days = daysSince2000(date);
  const pillar = calculatePillar(days);

  return {
    ...pillar,
    label: '今日'
  };
}

export function calculateFourPillars(
  birthDate: Date,
  birthTime: string,
  today: Date
): {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  todayPillar: string;
  elementBalance: ElementBalance;
} {
  const chart: FourPillarsChart = {
    yearPillar: calculateYearPillar(birthDate.getFullYear()),
    monthPillar: calculateMonthPillar(birthDate.getFullYear(), birthDate.getMonth() + 1),
    dayPillar: calculateDayPillar(birthDate),
    todayPillar: calculateTodayPillar(today)
  };

  const elementBalance = calculateElementBalance(chart);

  return {
    yearPillar: `${chart.yearPillar.stem}${chart.yearPillar.branch}`,
    monthPillar: `${chart.monthPillar.stem}${chart.monthPillar.branch}`,
    dayPillar: `${chart.dayPillar.stem}${chart.dayPillar.branch}`,
    todayPillar: `${chart.todayPillar.stem}${chart.todayPillar.branch}`,
    elementBalance
  };
}

export function calculateElementBalance(chart: FourPillarsChart): ElementBalance {
  const balance: ElementBalance = {
    木: 0,
    火: 0,
    土: 0,
    金: 0,
    水: 0
  };

  const pillars = [chart.yearPillar, chart.monthPillar, chart.dayPillar, chart.todayPillar];

  pillars.forEach(pillar => {
    const stemElement = STEM_ELEMENTS[pillar.stem];
    const branchElement = BRANCH_ELEMENTS[pillar.branch];

    balance[stemElement] += 1;
    balance[branchElement] += 1;
  });

  return balance;
}

export function getElementColor(element: Element): string {
  const colors: Record<Element, string> = {
    '木': '#10b981',
    '火': '#ef4444',
    '土': '#f59e0b',
    '金': '#6b7280',
    '水': '#3b82f6'
  };
  return colors[element];
}

export function getElementLabel(element: Element, balance: ElementBalance): string {
  const value = balance[element];
  const max = Math.max(...Object.values(balance));
  const min = Math.min(...Object.values(balance));

  if (value === max && value > 2) return '過多';
  if (value === max) return '強め';
  if (value === min && value === 0) return '不足';
  if (value === min) return '弱め';
  return '普通';
}
