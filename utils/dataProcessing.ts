
import { ChargingSession, ProcessedData, PredictionResult } from '../types';

export const processChargingData = (sessions: ChargingSession[]): ProcessedData => {
  const hourlyMap = new Map<number, { energy: number; count: number }>();
  const dailyMap = new Map<string, { energy: number; count: number }>();
  const locationMap = new Map<string, { energy: number; count: number }>();
  const heatmapMap = new Map<string, number>();

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  sessions.forEach(s => {
    const d = new Date(s.timestamp);
    const hour = d.getHours();
    const dateStr = d.toISOString().split('T')[0];
    const dayName = daysOfWeek[d.getDay()];

    // Hourly
    const hData = hourlyMap.get(hour) || { energy: 0, count: 0 };
    hourlyMap.set(hour, { energy: hData.energy + s.energyConsumed, count: hData.count + 1 });

    // Daily
    const dData = dailyMap.get(dateStr) || { energy: 0, count: 0 };
    dailyMap.set(dateStr, { energy: dData.energy + s.energyConsumed, count: dData.count + 1 });

    // Location
    const lData = locationMap.get(s.location) || { energy: 0, count: 0 };
    locationMap.set(s.location, { energy: lData.energy + s.energyConsumed, count: lData.count + 1 });

    // Heatmap
    const heatKey = `${dayName}-${hour}`;
    heatmapMap.set(heatKey, (heatmapMap.get(heatKey) || 0) + s.energyConsumed);
  });

  const hourlyDemand = Array.from(hourlyMap.entries())
    .map(([hour, data]) => ({ hour, totalEnergy: data.energy, count: data.count }))
    .sort((a, b) => a.hour - b.hour);

  const dailyDemand = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, totalEnergy: data.energy, count: data.count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const locationStats = Array.from(locationMap.entries())
    .map(([location, data]) => ({ location, totalEnergy: data.energy, sessionCount: data.count }))
    .sort((a, b) => b.totalEnergy - a.totalEnergy);

  const heatmapData: { hour: number; day: string; value: number }[] = [];
  daysOfWeek.forEach(day => {
    for (let h = 0; h < 24; h++) {
      heatmapData.push({ hour: h, day, value: heatmapMap.get(`${day}-${h}`) || 0 });
    }
  });

  return {
    sessions,
    hourlyDemand,
    dailyDemand,
    locationStats,
    heatmapData
  };
};

/**
 * Perform simple linear regression to predict future demand
 */
export const predictFutureDemand = (dailyDemand: { date: string; totalEnergy: number }[]): PredictionResult => {
  if (dailyDemand.length < 5) {
    return {
      nextPeriodForecast: 0,
      confidence: 0,
      trend: 'stable',
      explanation: "Not enough data for meaningful prediction.",
      futureData: []
    };
  }

  const n = dailyDemand.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = dailyDemand.map(d => d.totalEnergy);

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generate 7 days of future data
  const futureData = [];
  const lastDate = new Date(dailyDemand[n - 1].date);
  
  for (let i = 1; i <= 7; i++) {
    const futureX = n + i - 1;
    const predicted = Math.max(0, slope * futureX + intercept);
    const fDate = new Date(lastDate);
    fDate.setDate(fDate.getDate() + i);
    futureData.push({
      date: fDate.toISOString().split('T')[0],
      predictedEnergy: parseFloat(predicted.toFixed(2))
    });
  }

  const trend = slope > 1 ? 'up' : slope < -1 ? 'down' : 'stable';
  const nextPeriodForecast = futureData[0].predictedEnergy;
  
  return {
    nextPeriodForecast,
    confidence: 0.85 - (Math.random() * 0.1), // Mock confidence score
    trend,
    explanation: `Based on a linear regression of the last ${n} days, we observe a ${trend} trend with an average daily growth of ${slope.toFixed(2)} kWh.`,
    futureData
  };
};
