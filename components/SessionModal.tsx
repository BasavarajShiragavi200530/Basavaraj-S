
import React, { useState, useEffect } from 'react';
import { ChargingSession } from '../types';
import { MOCK_LOCATIONS } from '../constants';

interface SessionModalProps {
  session: ChargingSession | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: ChargingSession) => void;
}

const SessionModal: React.FC<SessionModalProps> = ({ session, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<ChargingSession>>({});

  useEffect(() => {
    if (session) {
      setFormData({ ...session });
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as ChargingSession);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Edit Charging Session</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</label>
            <select 
              value={formData.location} 
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {MOCK_LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Energy Consumed (kWh)</label>
            <input 
              type="number" 
              step="0.1"
              value={formData.energyConsumed} 
              onChange={(e) => setFormData({ ...formData, energyConsumed: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duration (Minutes)</label>
            <input 
              type="number" 
              value={formData.durationMinutes} 
              onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-3 mt-8">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-200"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionModal;
