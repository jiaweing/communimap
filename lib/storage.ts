import { Journey, UserStats } from './co2-calculations';

const JOURNEYS_KEY = 'co2-tracker-journeys';
const STATS_KEY = 'co2-tracker-stats';

// Local storage helpers
export function saveJourneys(journeys: Journey[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(JOURNEYS_KEY, JSON.stringify(journeys));
  }
}

export function loadJourneys(): Journey[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(JOURNEYS_KEY);
    return stored ? JSON.parse(stored) : [];
  }
  return [];
}

export function saveStats(stats: UserStats): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }
}

export function loadStats(): UserStats {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  
  // Default stats
  return {
    totalCO2Saved: 0,
    totalDistance: 0,
    totalJourneys: 0,
    streakDays: 0,
    level: 1,
    points: 0,
  };
}

// Export data for backup/sharing
export function exportData(): string {
  const journeys = loadJourneys();
  const stats = loadStats();
  return JSON.stringify({ journeys, stats }, null, 2);
}

// Import data from backup
export function importData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    if (data.journeys && data.stats) {
      saveJourneys(data.journeys);
      saveStats(data.stats);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}