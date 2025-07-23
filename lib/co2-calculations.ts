// CO2 emission factors (grams CO2 per km)
// Based on UK government conversion factors and transport data
export const EMISSION_FACTORS = {
  car: 171, // Average car emissions g CO2/km
  bus: 89,  // Bus emissions per passenger g CO2/km
  train: 41, // Train emissions per passenger g CO2/km
  motorcycle: 113, // Motorcycle emissions g CO2/km
  taxi: 200, // Taxi emissions g CO2/km (higher due to empty return trips)
} as const;

export type TransportMode = keyof typeof EMISSION_FACTORS;
export type ActiveTravelMode = 'walking' | 'cycling' | 'wheelchair' | 'scooter' | 'skateboard';

export interface Journey {
  id: string;
  date: string;
  distance: number; // in km
  activeTravelMode: ActiveTravelMode;
  replacedTransportMode: TransportMode;
  co2Saved: number; // in grams
  duration?: number; // in minutes
  route?: string;
  notes?: string;
}

export interface UserStats {
  totalCO2Saved: number; // in grams
  totalDistance: number; // in km
  totalJourneys: number;
  streakDays: number;
  level: number;
  points: number;
}

// Calculate CO2 saved for a journey
export function calculateCO2Saved(
  distance: number,
  replacedTransportMode: TransportMode
): number {
  return distance * EMISSION_FACTORS[replacedTransportMode];
}

// Convert grams to more readable units
export function formatCO2(grams: number): string {
  if (grams < 1000) {
    return `${Math.round(grams)}g`;
  } else if (grams < 1000000) {
    return `${(grams / 1000).toFixed(1)}kg`;
  } else {
    return `${(grams / 1000000).toFixed(2)}t`;
  }
}

// Calculate user level based on total CO2 saved
export function calculateLevel(totalCO2Saved: number): number {
  // Level up every 10kg of CO2 saved
  return Math.floor(totalCO2Saved / 10000) + 1;
}

// Calculate points (gamification element)
export function calculatePoints(co2Saved: number, distance: number): number {
  // Base points: 1 point per 100g CO2 saved + bonus for distance
  const basePoints = Math.floor(co2Saved / 100);
  const distanceBonus = Math.floor(distance * 10); // 10 points per km
  return basePoints + distanceBonus;
}

// Get achievement badges
export function getAchievements(stats: UserStats): string[] {
  const achievements: string[] = [];
  
  if (stats.totalJourneys >= 1) achievements.push("First Steps");
  if (stats.totalJourneys >= 10) achievements.push("Getting Started");
  if (stats.totalJourneys >= 50) achievements.push("Regular Traveler");
  if (stats.totalJourneys >= 100) achievements.push("Active Champion");
  
  if (stats.totalCO2Saved >= 1000) achievements.push("Eco Warrior");
  if (stats.totalCO2Saved >= 10000) achievements.push("Carbon Crusher");
  if (stats.totalCO2Saved >= 50000) achievements.push("Planet Protector");
  
  if (stats.streakDays >= 7) achievements.push("Week Warrior");
  if (stats.streakDays >= 30) achievements.push("Monthly Master");
  
  if (stats.totalDistance >= 10) achievements.push("10km Club");
  if (stats.totalDistance >= 100) achievements.push("Century Rider");
  
  return achievements;
}

// Calculate streak days
export function calculateStreak(journeys: Journey[]): number {
  if (journeys.length === 0) return 0;
  
  const sortedJourneys = journeys
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  const currentDate = new Date(today);
  
  for (const journey of sortedJourneys) {
    const journeyDate = new Date(journey.date);
    journeyDate.setHours(0, 0, 0, 0);
    
    if (journeyDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (journeyDate.getTime() < currentDate.getTime()) {
      break;
    }
  }
  
  return streak;
}