
import { ChargingSession } from '../types';
import { MOCK_LOCATIONS } from '../constants';

export const generateMockSessions = (days: number = 30): ChargingSession[] => {
  const sessions: ChargingSession[] = [];
  const now = new Date();
  
  for (let d = 0; d < days; d++) {
    const date = new Date(now.getTime() - (days - d) * 24 * 60 * 60 * 1000);
    
    // Each day has a random number of sessions, but with a slight upward trend
    const sessionsPerDay = Math.floor(20 + Math.random() * 30 + (d * 0.5));
    
    for (let s = 0; s < sessionsPerDay; s++) {
      // Realistic hourly distribution: Peaks in morning (8-10am) and evening (5-8pm)
      const hourRand = Math.random();
      let hour = 0;
      if (hourRand < 0.2) hour = 7 + Math.floor(Math.random() * 4); // 7-11am
      else if (hourRand < 0.5) hour = 17 + Math.floor(Math.random() * 5); // 5-10pm
      else hour = Math.floor(Math.random() * 24);
      
      const sessionDate = new Date(date);
      sessionDate.setHours(hour, Math.floor(Math.random() * 60));
      
      const location = MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)];
      
      // Fast chargers vs standard chargers
      const isFast = Math.random() > 0.7;
      const energy = isFast 
        ? 30 + Math.random() * 40 // 30-70 kWh
        : 10 + Math.random() * 20; // 10-30 kWh
      
      sessions.push({
        id: `sess-${d}-${s}`,
        timestamp: sessionDate.toISOString(),
        location,
        energyConsumed: parseFloat(energy.toFixed(2)),
        durationMinutes: isFast ? 30 + Math.random() * 30 : 120 + Math.random() * 240
      });
    }
  }
  
  return sessions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};
