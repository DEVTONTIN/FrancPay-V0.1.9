import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { mockProStats } from './mockData';

const kpiCards = [
  { label: 'Chiffre du jour', value: '2 847 FRE', trend: '+12% / 24h' },
  { label: 'Transactions', value: '18', trend: '3 en attente' },
  { label: 'Conversion', value: '87.5%', trend: 'Pic 14h-15h' },
];

export const ProfessionalDashboardSection: React.FC = () => (
  <div className="space-y-6">
    <div className="grid md:grid-cols-3 gap-4">
      {kpiCards.map((stat) => (
        <Card key={stat.label} className="bg-slate-900/70 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {stat.label}
            </p>
            <p className="text-2xl font-semibold">{stat.value}</p>
            <p className="text-xs text-emerald-400">{stat.trend}</p>
          </CardContent>
        </Card>
      ))}
    </div>
    <Card className="bg-slate-900/70 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          Activite recente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockProStats.recentActivity.map((activity, index) => (
          <div
            key={`${activity.type}-${index}`}
            className="flex justify-between border-b border-slate-800 pb-2 text-sm last:border-b-0"
          >
            <div>
              <p className="font-semibold">{activity.type}</p>
              <p className="text-slate-400">{activity.customer}</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-400">{activity.amount} FRE</p>
              <p className="text-xs text-slate-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);
