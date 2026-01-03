
import React from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, ScatterChart, Scatter, ZAxis, Legend 
} from 'recharts';
import { COLORS } from '../constants';

export const UsageLineChart: React.FC<{ data: any[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1}/>
          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
      <XAxis 
        dataKey="date" 
        tick={{ fontSize: 12, fill: '#64748b' }} 
        axisLine={false} 
        tickLine={false} 
        tickFormatter={(val) => val.split('-').slice(1).join('/')}
      />
      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
      <Tooltip 
        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
      />
      <Area 
        type="monotone" 
        dataKey="totalEnergy" 
        stroke={COLORS.primary} 
        strokeWidth={3} 
        fillOpacity={1} 
        fill="url(#colorEnergy)" 
      />
    </AreaChart>
  </ResponsiveContainer>
);

export const LocationBarChart: React.FC<{ data: any[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} layout="vertical">
      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
      <XAxis type="number" hide />
      <YAxis 
        dataKey="location" 
        type="category" 
        width={100} 
        tick={{ fontSize: 11, fill: '#64748b' }} 
        axisLine={false} 
        tickLine={false} 
      />
      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
      <Bar dataKey="totalEnergy" radius={[0, 4, 4, 0]}>
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export const HourlyDemandChart: React.FC<{ data: any[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
      <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
      <Bar dataKey="totalEnergy" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export const PredictionChart: React.FC<{ historical: any[], predicted: any[] }> = ({ historical, predicted }) => {
  const combined = [
    ...historical.slice(-14).map(d => ({ ...d, type: 'Historical' })),
    ...predicted.map(d => ({ date: d.date, predictedEnergy: d.predictedEnergy, type: 'Forecast' }))
  ];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={combined}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(val) => val.split('-').slice(1).join('/')}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
        <Legend verticalAlign="top" height={36}/>
        <Line 
          type="monotone" 
          dataKey="totalEnergy" 
          name="Historical Data" 
          stroke={COLORS.primary} 
          strokeWidth={2} 
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="predictedEnergy" 
          name="AI Forecast" 
          stroke={COLORS.accent} 
          strokeDasharray="5 5" 
          strokeWidth={2} 
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
