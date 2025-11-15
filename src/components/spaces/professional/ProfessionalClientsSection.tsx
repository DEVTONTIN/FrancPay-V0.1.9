import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockProStats } from './mockData';

export const ProfessionalClientsSection: React.FC = () => (
  <Card className="bg-slate-900/70 border-slate-800">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5 text-emerald-400" />
        Clients FrancPay
      </CardTitle>
      <p className="text-slate-400 text-sm">
        Fidelisez vos meilleurs clients et exportez la base CRM.
      </p>
    </CardHeader>
    <CardContent className="grid gap-4 md:grid-cols-2">
      {mockProStats.topClients.map((client) => (
        <div
          key={client.name}
          className="rounded-xl border border-slate-800 p-4 bg-slate-900/40"
        >
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">{client.name}</p>
              <p className="text-sm text-slate-400">
                {client.sales} transactions
              </p>
            </div>
            <Badge variant="secondary" className="text-emerald-400 border-emerald-400/20">
              {client.revenue} FRE
            </Badge>
          </div>
          <Button
            variant="outline"
            className="w-full mt-3 border-slate-700 text-white"
          >
            Voir le dossier
          </Button>
        </div>
      ))}
    </CardContent>
  </Card>
);
