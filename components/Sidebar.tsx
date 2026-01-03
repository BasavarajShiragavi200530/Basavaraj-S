
import React from 'react';
import { DashboardTab } from '../types';
import { ICONS } from '../constants';

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: DashboardTab.OVERVIEW, icon: ICONS.Dashboard },
    { id: DashboardTab.ANALYTICS, icon: ICONS.Trend },
    { id: DashboardTab.PEAK_HOURS, icon: ICONS.Clock },
    { id: DashboardTab.PREDICTIONS, icon: ICONS.Zap },
    { id: DashboardTab.AI_INSIGHTS, icon: ICONS.Brain },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">EV</div>
        <h1 className="font-bold text-slate-800 text-lg tracking-tight">Predictor Pro</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-emerald-50 text-emerald-600 font-semibold' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <item.icon />
            <span>{item.id}</span>
            {activeTab === item.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-900 rounded-2xl p-4 text-white">
          <p className="text-xs font-medium text-slate-400 mb-1">Infrastructure Plan</p>
          <p className="text-sm font-semibold mb-3">Urban Expansion 2025</p>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 w-[65%] h-full"></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">65% Progress</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
