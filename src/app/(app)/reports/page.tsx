
'use client';

import { useMemo, useState } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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

type UnifiedTransaction = {
  id: string;
  type: 'Receita' | 'Despesa';
  description: string;
  date: string;
  amount: number;
};

export default function ReportsPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const eventsRef = useMemoFirebase(() => user ? query(collection(firestore, 'events'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: events, isLoading: isLoadingEvents } = useCollection<Event>(eventsRef);

  const artistsRef = useMemoFirebase(() => user ? query(collection(firestore, 'artists'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: artists, isLoading: isLoadingArtists } = useCollection<Artist>(artistsRef);
  
  const purchasesRef = useMemoFirebase(() => user ? query(collection(firestore, 'purchases'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: purchases, isLoading: isLoadingPurchases } = useCollection<Purchase>(purchasesRef);

  const { totalIncome, totalExpense, netBalance, recentTransactions } = useMemo(() => {
    const income = events?.filter(e => e.paymentStatus === 'Pago').reduce((sum, e) => sum + e.payment, 0) || 0;
    const expense = purchases?.filter(p => p.status === 'Pago').reduce((sum, p) => sum + p.amount, 0) || 0;

    const unified: UnifiedTransaction[] = [
      ...(events || []).filter(e => e.paymentStatus === 'Pago').map(e => ({
          id: e.id,
          type: 'Receita' as const,
          description: `Evento em ${e.local}`,
          date: e.date,
          amount: e.payment,
      })),
      ...(purchases || []).filter(p => p.status === 'Pago').map(p => ({
          id: p.id,
          type: 'Despesa' as const,
          description: p.description,
          date: p.date,
          amount: p.amount,
      })),
    ];
    
    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense,
      recentTransactions: unified.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).slice(0, 10),
    };
  }, [events, purchases]);

  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      name: format(new Date(0, i), 'LLL', { locale: ptBR }),
      income: 0,
      expenses: 0,
    }));
    events?.forEach(e => { if(e.paymentStatus === 'Pago') data[getMonth(parseISO(e.date))].income += e.payment; });
    purchases?.forEach(p => { if(p.status === 'Pago') data[getMonth(parseISO(p.date))].expenses += p.amount; });
    return data;
  }, [events, purchases]);

  const artistPerformanceData = useMemo(() => {
    if (!events || !artists) return [];
    const counts: Record<string, number> = {};
    events.forEach(e => e.artistIds.forEach(id => counts[id] = (counts[id] || 0) + 1));
    return artists.map(a => ({ name: a.name, events: counts[a.id] || 0 })).filter(a => a.events > 0);
  }, [events, artists]);
  
  const isLoading = isLoadingEvents || isLoadingArtists || isLoadingPurchases;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Relatórios</h1>
      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card><CardHeader><CardTitle>Receita</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">R${totalIncome.toLocaleString('pt-BR')}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Despesa</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-600">R${totalExpense.toLocaleString('pt-BR')}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Saldo</CardTitle></CardHeader><CardContent><p className={cn("text-3xl font-bold", netBalance >= 0 ? "text-foreground" : "text-red-600")}>R${netBalance.toLocaleString('pt-BR')}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Performance Mensal</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                    <YAxis stroke="#888888" fontSize={12} tickFormatter={(v) => `R$${v/1000}k`} />
                    <Tooltip formatter={(value: number) => `R$${value.toLocaleString('pt-BR')}`} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="hsl(var(--primary))" strokeWidth={2} name="Receita" />
                    <Line type="monotone" dataKey="expenses" stroke="hsl(var(--accent))" strokeWidth={2} name="Despesas" />
                  </LineChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <Tabs defaultValue="bar" className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Desempenho por Artista</CardTitle><CardDescription>Eventos realizados.</CardDescription></div>
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
                      <Tooltip />
                      <Bar dataKey="events" radius={[4, 4, 0, 0]} name="Eventos">
                        {artistPerformanceData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="pie">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie data={artistPerformanceData} dataKey="events" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                        {artistPerformanceData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip /><Legend />
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
