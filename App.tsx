
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import { DashboardTab, ChargingSession, ProcessedData, PredictionResult } from './types';
import { generateMockSessions } from './utils/dataGenerator';
import { processChargingData, predictFutureDemand } from './utils/dataProcessing';
import { ICONS, COLORS } from './constants';
import { UsageLineChart, LocationBarChart, HourlyDemandChart, PredictionChart } from './components/Charts';
import { getAIInsights } from './services/geminiService';
import SessionModal from './components/SessionModal';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.OVERVIEW);
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsightText, setAiInsightText] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Session management state
  const [editingSession, setEditingSession] = useState<ChargingSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize Data
  useEffect(() => {
    const timer = setTimeout(() => {
      const mockData = generateMockSessions(60);
      setSessions(mockData);
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const processed = useMemo(() => processChargingData(sessions), [sessions]);
  const prediction = useMemo(() => predictFutureDemand(processed.dailyDemand), [processed.dailyDemand]);

  const handleDeleteSession = (id: string) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      setSessions(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleEditSession = (session: ChargingSession) => {
    setEditingSession(session);
    setIsModalOpen(true);
  };

  const handleSaveSession = (updated: ChargingSession) => {
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
    setIsModalOpen(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      const newSessions: ChargingSession[] = [];
      
      lines.slice(1).forEach((line, i) => {
        const parts = line.split(',');
        if (parts.length >= 4) {
          newSessions.push({
            id: `upload-${Date.now()}-${i}`,
            timestamp: parts[0].trim(),
            location: parts[1].trim(),
            energyConsumed: parseFloat(parts[2].trim()),
            durationMinutes: parseFloat(parts[3].trim())
          });
        }
      });

      if (newSessions.length > 0) {
        setSessions(newSessions);
      } else {
        alert("Invalid CSV format. Please use: Timestamp, Location, Energy, Duration");
      }
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const fetchInsights = useCallback(async () => {
    if (isAiLoading || !processed.sessions.length) return;
    setIsAiLoading(true);
    const text = await getAIInsights(processed, prediction);
    setAiInsightText(text);
    setIsAiLoading(false);
  }, [processed, prediction, isAiLoading]);

  useEffect(() => {
    if (activeTab === DashboardTab.AI_INSIGHTS && !aiInsightText && !isAiLoading) {
      fetchInsights();
    }
  }, [activeTab, aiInsightText, isAiLoading, fetchInsights]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Aggregating EV Infrastructure Data...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case DashboardTab.OVERVIEW:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Energy" value={`${processed.dailyDemand.reduce((a, b) => a + b.totalEnergy, 0).toLocaleString()} kWh`} icon={ICONS.Zap} color="text-emerald-500" bg="bg-emerald-50" />
              <StatCard title="Sessions" value={processed.sessions.length.toLocaleString()} icon={ICONS.Dashboard} color="text-blue-500" bg="bg-blue-50" />
              <StatCard title="Avg Session" value={`${(processed.dailyDemand.reduce((a, b) => a + b.totalEnergy, 0) / processed.sessions.length).toFixed(1)} kWh`} icon={ICONS.Trend} color="text-amber-500" bg="bg-amber-50" />
              <StatCard title="Peak Period" value={`${processed.hourlyDemand.reduce((a, b) => a.totalEnergy > b.totalEnergy ? a : b).hour}:00`} icon={ICONS.Clock} color="text-purple-500" bg="bg-purple-50" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-800">Demand Growth Trend</h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold">
                    <ICONS.Trend /> +12% this month
                  </div>
                </div>
                <UsageLineChart data={processed.dailyDemand} />
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 text-center">Top Charging Locations</h3>
                <LocationBarChart data={processed.locationStats.slice(0, 5)} />
              </div>
            </div>
          </div>
        );

      case DashboardTab.ANALYTICS:
        return (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6">Metropolitan Location Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-50">
                      <th className="py-4 font-medium">Location</th>
                      <th className="py-4 font-medium">Total Sessions</th>
                      <th className="py-4 font-medium">Energy Delivered</th>
                      <th className="py-4 font-medium">Avg Charge</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {processed.locationStats.map((loc) => (
                      <tr key={loc.location} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 font-semibold text-slate-700">{loc.location}</td>
                        <td className="py-4 text-slate-500">{loc.sessionCount}</td>
                        <td className="py-4 text-slate-500">{loc.totalEnergy.toFixed(1)} kWh</td>
                        <td className="py-4">
                          <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                            {(loc.totalEnergy / loc.sessionCount).toFixed(1)} kWh
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6">Recent Individual Sessions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-50">
                      <th className="py-4 font-medium">Time</th>
                      <th className="py-4 font-medium">Location</th>
                      <th className="py-4 font-medium">Energy</th>
                      <th className="py-4 font-medium">Duration</th>
                      <th className="py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {sessions.slice(-15).reverse().map((s) => (
                      <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                        <td className="py-4 text-slate-500">{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</td>
                        <td className="py-4 font-medium text-slate-700">{s.location}</td>
                        <td className="py-4 text-slate-500 font-mono">{s.energyConsumed.toFixed(1)} kWh</td>
                        <td className="py-4 text-slate-500">{s.durationMinutes.toFixed(0)} min</td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEditSession(s)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                              title="Edit Session"
                            >
                              <ICONS.Edit />
                            </button>
                            <button 
                              onClick={() => handleDeleteSession(s.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                              title="Delete Session"
                            >
                              <ICONS.Trash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sessions.length > 15 && (
                <p className="mt-4 text-center text-xs text-slate-400 italic">Showing last 15 sessions. Import CSV to update data set.</p>
              )}
            </div>
          </div>
        );

      case DashboardTab.PEAK_HOURS:
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-2">Hourly Demand Distribution</h3>
              <p className="text-sm text-slate-500 mb-8">Aggregated energy consumption per hour across all stations.</p>
              <HourlyDemandChart data={processed.hourlyDemand} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['Morning', 'Afternoon', 'Evening'].map((period, i) => {
                const hours = i === 0 ? [6, 11] : i === 1 ? [12, 16] : [17, 22];
                const total = processed.hourlyDemand
                  .filter(h => h.hour >= hours[0] && h.hour <= hours[1])
                  .reduce((acc, curr) => acc + curr.totalEnergy, 0);
                return (
                  <div key={period} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">{period} Peak</p>
                      <h4 className="text-2xl font-bold text-slate-800">{total.toFixed(0)} <span className="text-sm font-normal text-slate-400">kWh</span></h4>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                      <ICONS.Clock />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case DashboardTab.PREDICTIONS:
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-bold text-slate-800">Demand Forecasting (Linear Regression)</h3>
                  <p className="text-sm text-slate-500">Projected consumption for the next 7 days based on current trends.</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase font-bold mb-1">Confidence Score</div>
                  <div className="text-xl font-bold text-emerald-500">{(prediction.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>
              <PredictionChart historical={processed.dailyDemand} predicted={prediction.futureData} />
            </div>

            <div className="bg-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h4 className="text-2xl font-bold mb-3">Prediction Summary</h4>
                  <p className="text-emerald-100 leading-relaxed mb-6">
                    {prediction.explanation} Our model suggests that infrastructure capacity in metropolitan regions should be increased at a rate of {prediction.trend === 'up' ? 'positive' : 'monitored'} growth to avoid bottlenecking.
                  </p>
                  <div className="flex gap-4">
                    <button className="bg-white text-emerald-600 px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20">Download Forecast PDF</button>
                    <button className="bg-emerald-500/30 border border-emerald-400/30 px-6 py-2 rounded-xl font-bold text-sm">Review Assumptions</button>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="w-32 h-32 bg-emerald-400/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-emerald-400/40">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                      <div className="text-4xl">⚡</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
            </div>
          </div>
        );

      case DashboardTab.AI_INSIGHTS:
        return (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[500px]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <ICONS.Brain />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-800">Explainable AI Insights</h3>
                  <p className="text-sm text-slate-500">Gemini-powered analysis of your charging network</p>
                </div>
                <button 
                  onClick={fetchInsights}
                  disabled={isAiLoading}
                  className="ml-auto flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  Regenerate
                </button>
              </div>

              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 italic">Thinking like an Urban Planner...</p>
                </div>
              ) : (
                <article className="prose prose-slate max-w-none">
                  <div className="text-slate-600 leading-relaxed space-y-4">
                    {aiInsightText.split('\n').map((line, i) => (
                      <p key={i} className={line.startsWith('#') ? 'text-slate-900 font-bold text-xl mt-6' : ''}>
                        {line.replace(/^#+ /, '')}
                      </p>
                    ))}
                  </div>
                </article>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto max-h-screen">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{activeTab}</h2>
            <p className="text-slate-500 text-sm mt-1">Real-time EV infrastructure analysis & predictions</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-medium text-slate-600 cursor-pointer hover:border-emerald-300 transition-colors">
              <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              Import CSV
              <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
            </label>
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
              <img src="https://picsum.photos/100/100" alt="User" />
            </div>
          </div>
        </header>

        {renderTabContent()}
        
        <footer className="mt-12 py-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400 font-medium">EV Demand Predictor Pro • Indian Metropolitan Edition • Academic Project v1.3 • Powered by Gemini AI</p>
        </footer>
      </main>

      <SessionModal 
        isOpen={isModalOpen} 
        session={editingSession} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveSession} 
      />
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.FC;
  color: string;
  bg: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center`}>
        <Icon />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      </div>
    </div>
  </div>
);

export default App;
