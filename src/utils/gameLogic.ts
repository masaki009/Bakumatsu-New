import type { Vital } from '../types/game';
import { getJSTDate } from './dateUtils';

export function calculateDaysElapsed(lastUpdatedDate: string): number {
  const lastDateParts = lastUpdatedDate.split('-');
  const lastDate = new Date(Date.UTC(
    parseInt(lastDateParts[0]),
    parseInt(lastDateParts[1]) - 1,
    parseInt(lastDateParts[2])
  ));

  const todayStr = getJSTDate();
  const todayParts = todayStr.split('-');
  const today = new Date(Date.UTC(
    parseInt(todayParts[0]),
    parseInt(todayParts[1]) - 1,
    parseInt(todayParts[2])
  ));

  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export interface UpdatedVitalStats {
  energy: number;
  toilet: number;
  sick: number;
}

export function calculateUpdatedStats(vital: Vital): UpdatedVitalStats {
  const daysElapsed = calculateDaysElapsed(vital.last_updated_date);

  if (daysElapsed <= 0) {
    return {
      energy: vital.energy,
      toilet: vital.toilet,
      sick: vital.sick
    };
  }

  const energyLoss = daysElapsed * 5;
  let newEnergy = vital.energy - energyLoss;
  newEnergy = Math.max(0, newEnergy);

  let newToilet = vital.toilet + daysElapsed;
  let newSick = vital.sick;

  while (newToilet >= 4) {
    newSick += 1;
    newToilet = 0;
  }

  newSick = Math.min(4, newSick);

  return {
    energy: newEnergy,
    toilet: newToilet,
    sick: newSick
  };
}

export type GameStatus = 'playing' | 'game_over' | 'warning_toilet' | 'warning_sick';

export interface GameState {
  status: GameStatus;
  message: string;
  isGameOver: boolean;
}

export function checkGameState(energy: number, toilet: number, sick: number): GameState {
  if (sick >= 4) {
    return {
      status: 'game_over',
      message: 'ゲームオーバー！ペットの病気が悪化しました。管理者に連絡してください。',
      isGameOver: true
    };
  }

  if (energy <= 0) {
    return {
      status: 'game_over',
      message: 'ゲームオーバー！ペットのエネルギーがなくなりました。管理者に連絡してください。',
      isGameOver: true
    };
  }

  if (sick >= 3) {
    return {
      status: 'warning_sick',
      message: '緊急！ペットが病気です。治療が必要です！',
      isGameOver: false
    };
  }

  if (toilet >= 3) {
    return {
      status: 'warning_toilet',
      message: '注意！トイレが必要です！',
      isGameOver: false
    };
  }

  if (energy <= 5) {
    return {
      status: 'playing',
      message: '警告：エネルギーが少なくなっています。',
      isGameOver: false
    };
  }

  return {
    status: 'playing',
    message: '',
    isGameOver: false
  };
}

export function getPetStage(energy: number): string {
  if (energy <= 100) return 'stage-1';
  if (energy <= 150) return 'stage-2';
  if (energy <= 200) return 'stage-3';
  if (energy <= 300) return 'stage-4';
  if (energy <= 400) return 'stage-5';
  return 'stage-6';
}

export function getTodayDate(): string {
  return getJSTDate();
}
