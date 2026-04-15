'use client';

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface AnalyticsChartsProps {
  hourlyData: { hour: string; count: number }[];
  weeklyData: { day: string; count: number }[];
  themeColor?: string;
}

export default function AnalyticsCharts({ hourlyData, weeklyData, themeColor = '#f97316' }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Gráfico de Picos de Horário */}
      <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-6 space-y-6">
        <div>
          <h3 className="text-white font-bold text-lg">Picos de Horário</h3>
          <p className="text-gray-500 text-xs mt-1">Volume de pedidos por hora do dia</p>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={themeColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={themeColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
              <XAxis 
                dataKey="hour" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 10 }} 
                interval={2}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '16px', fontSize: '12px', color: '#fff' }}
                itemStyle={{ color: themeColor, fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke={themeColor} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCount)" 
                name="Pedidos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Dias da Semana */}
      <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-6 space-y-6">
        <div>
          <h3 className="text-white font-bold text-lg">Desempenho Semanal</h3>
          <p className="text-gray-500 text-xs mt-1">Distribuição de pedidos por dia</p>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 10 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 10 }}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '16px', fontSize: '12px', color: '#fff' }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Pedidos">
                {weeklyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.count === Math.max(...weeklyData.map(d => d.count)) && entry.count > 0 ? themeColor : '#374151'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
