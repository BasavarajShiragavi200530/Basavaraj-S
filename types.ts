
export interface ChargingSession {
  id: string;
  timestamp: string; // ISO format
  location: string;
  energyConsumed: number; // kWh
  durationMinutes: number;
}

export interface ProcessedData {
  sessions: ChargingSession[];
  hourlyDemand: { hour: number; totalEnergy: number; count: number }[];
  dailyDemand: { date: string; totalEnergy: number; count: number }[];
  locationStats: { location: string; totalEnergy: number; sessionCount: number }[];
  heatmapData: { hour: number; day: string; value: number }[];
}

export interface PredictionResult {
  nextPeriodForecast: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  explanation: string;
  futureData: { date: string; predictedEnergy: number }[];
}

export enum DashboardTab {
  OVERVIEW = 'Overview',
  ANALYTICS = 'Analytics',
  PEAK_HOURS = 'Peak Hours',
  PREDICTIONS = 'Predictions',
  AI_INSIGHTS = 'AI Insights'
}
