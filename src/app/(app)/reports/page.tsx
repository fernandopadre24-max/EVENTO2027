
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Legend,
} from 'recharts';
import { Loader2, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Event, Artist, Purchase } from '@/lib/types';
import { format, parseISO, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#ef4444',
  '#8b5cf6',
];

export default function ReportsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const eventsRef = useMemoFirebase(() => user ? query(collection(firestore, 'events'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: events, isLoading: isLoadingEvents } = useCollection<Event>(eventsRef);

  const artistsRef = useMemoFirebase(() => user ? query(collection(firestore, 'artists'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: artists, isLoading: isLoadingArtists } = useCollection<Artist>(artistsRef);
  
  const purchasesRef = useMemoFirebase(() => user ? query(collection(firestore, 'purchases'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: purchases, isLoading: isLoadingPurchases } = useCollection<Purchase>(purchasesRef);

  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    const income = events?.filter(e => e.paymentStatus === 'Pago').reduce((sum, e) => sum + e.payment, 0) || 0;
    const expense = purchases?.filter(p => p.status === 'Pago').reduce((sum, p) => sum + p.amount, 0) || 0;
    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense,
    };
  }, [events, purchases]);

  const monthlyData = useMemo(() => {
    if (!mounted) return [];
    const data = Array.from({ length: 12 }, (_, i) => ({
      name: format(new Date(2024, i, 1), 'LLL', { locale: ptBR }),
      income: 0,
      expenses: 0,
    }));
    events?.forEach(e => { 
      if(e.paymentStatus === 'Pago') {
        const month = getMonth(parseISO(e.date));
        if (data[month]) data[month].income += e.payment;
      }
    });
    purchases?.forEach(p => { 
      if(p.status === 'Pago') {
        const month = getMonth(parseISO(p.date));
        if (data[month]) data[month].expenses += p.amount;
      }
    });
    return data;
  }, [events, purchases, mounted]);

  const artistPerformanceData = useMemo(() => {
    if (!events || !artists) return [];
    const counts: Record<string, number> = {};
    events.forEach(e => {
      if (e.status === 'Concluído' || e.status === 'Confirmado') {
        e.artistIds.forEach(id => {
          counts[id] = (counts[id] || 0) + 1;
        });
      }
    });
    return artists.map(a => ({ name: a.name, events: counts[a.id] || 0 })).filter(a => a.events > 0);
  }, [events, artists]);
  
  const isLoading = isLoadingEvents || isLoadingArtists || isLoadingPurchases;

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Relatórios</h1>
      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-green-500/5"><CardHeader><CardTitle className="text-sm">Receita Total</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">R${totalIncome.toLocaleString('pt-BR')}</p></CardContent></Card>
            <Card className="bg-red-500/5"><CardHeader><CardTitle className="text-sm">Despesa Total</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-600">R${totalExpense.toLocaleString('pt-BR')}</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Saldo Atual</CardTitle></CardHeader><CardContent><p className={cn("text-3xl font-bold", netBalance >= 0 ? "text-primary" : "text-red-600")}>R${netBalance.toLocaleString('pt-BR')}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Performance Mensal</CardTitle><CardDescription>Fluxo de caixa ao longo do ano.</CardDescription></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                    <YAxis stroke="#888888" fontSize={12} tickFormatter={(v) => `R$${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => `R$${value.toLocaleString('pt-BR')}`} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="hsl(var(--primary))" strokeWidth={3} name="Receita" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="expenses" stroke="hsl(var(--accent))" strokeWidth={3} name="Despesas" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <Tabs defaultValue="bar" className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Desempenho por Artista</CardTitle>
                  <CardDescription>Quantidade de eventos realizados.</CardDescription>
                </div>
                <TabsList>
                  <TabsTrigger value="bar"><BarChart2 className="w-4 h-4" /></TabsTrigger>
                  <TabsTrigger value="pie"><PieChartIcon className="w-4 h-4" /></TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="bar">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={artistPerformanceData}>
                      <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} />
                      <Tooltip 
                         contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="events" radius={[4, 4, 0, 0]} name="Eventos">
                        {artistPerformanceData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="pie">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie 
                        data={artistPerformanceData} 
                        dataKey="events" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={120} 
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {artistPerformanceData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </>
      )}
    </div>
  );
}
