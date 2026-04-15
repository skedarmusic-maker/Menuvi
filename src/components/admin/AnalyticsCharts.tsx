'use client';

import React from 'react';

// Biblioteca Recharts temporariamente desativada por incompatibilidade com servidor de produção (Hostinger)
export default function AnalyticsCharts({ hourlyData, weeklyData, themeColor = '#f97316' }: any) {
  return (
    <div className="p-12 text-center bg-gray-900 border border-gray-800 rounded-[32px]">
      <p className="text-gray-400 font-medium italic">Gráficos indisponíveis no servidor de produção.</p>
    </div>
  );
}
