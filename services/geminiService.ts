
import { GoogleGenAI } from "@google/genai";
import { ProcessedData, PredictionResult } from "../types";

export const getAIInsights = async (data: ProcessedData, prediction: PredictionResult): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Format summary data for Gemini
  const summary = {
    totalSessions: data.sessions.length,
    topLocation: data.locationStats[0]?.location,
    peakHour: data.hourlyDemand.reduce((prev, curr) => (prev.totalEnergy > curr.totalEnergy ? prev : curr)).hour,
    predictedTrend: prediction.trend,
    averageDailyEnergy: (data.dailyDemand.reduce((acc, curr) => acc + curr.totalEnergy, 0) / data.dailyDemand.length).toFixed(1)
  };

  const prompt = `
    You are an expert Urban Planning AI specializing in EV (Electric Vehicle) Infrastructure.
    Analyze the following charging station usage data and provide 3-4 professional recommendations for city planners.
    
    Current Data Overview:
    - Total Charging Sessions: ${summary.totalSessions}
    - Highest Demand Location: ${summary.topLocation}
    - System-wide Peak Hour: ${summary.peakHour}:00
    - Historical Average Daily Demand: ${summary.averageDailyEnergy} kWh
    - Forecasted Trend: ${summary.predictedTrend}
    
    Please structure your response with:
    1. A concise summary of the current charging behavior.
    2. Explanation of why the peak hour at ${summary.peakHour}:00 is significant.
    3. Strategic infrastructure recommendations (e.g., adding fast chargers, dynamic pricing, grid upgrades).
    4. Future outlook based on the ${summary.predictedTrend} trend.
    
    Keep the tone educational, professional, and explainable. Use markdown for formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95
      }
    });
    return response.text || "Could not generate insights at this time.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Error connecting to AI service. Please check your network or API key configuration.";
  }
};
