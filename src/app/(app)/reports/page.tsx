
'use client';

import { useMemo } from 'react';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { FinancialTransaction, Event, Artist } from '@/lib/types';
import { format, parseISO, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function ReportsPage() {
  const firestore = useFirestore();

  const financesRef = useMemoFirebase(() => collection(firestore, 'finances'), [firestore]);
  const { data: transactions, isLoading: isLoadingFinances } = useCollection<FinancialTransaction>(financesRef);
  
  const eventsRef = useMemoFirebase(() => collection(firestore, 'events'), [firestore]);
  const { data: events, isLoading: isLoadingEvents } = useCollection<Event>(eventsRef);

  const artistsRef = useMemoFirebase(() => collection(firestore, 'artists'), [firestore]);
  const { data: artists, isLoading: isLoadingArtists } = useCollection<Artist>(artistsRef);

  const monthlyData = useMemo(() => {
    if (!transactions) return [];
    const monthlySummary = Array.from({ length: 12 }, (_, i) => ({
      name: format(new Date(0, i), 'LLL', { locale: ptBR }),
      income: 0,
      expenses: 0,
    }));

    transactions.forEach(transaction => {
      const month = getMonth(parseISO(transaction.date));
      if (transaction.type === 'Receita') {
        monthlySummary[month].income += transaction.amount;
      } else {
        monthlySummary[month].expenses += transaction.amount;
      }
    });

    return monthlySummary;
  }, [transactions]);

  const revenueByArtistData = useMemo(() => {
    if (!events || !artists) return [];
    
    const artistRevenue: Record<string, number> = {};
    
    events.forEach(event => {
      if (event.paymentStatus === 'Pago') {
        event.artistIds.forEach(artistId => {
          if (!artistRevenue[artistId]) {
            artistRevenue[artistId] = 0;
          }
          artistRevenue[artistId] += event.payment / event.artistIds.length; // Evenly split payment
        });
      }
    });

    return artists.map(artist => ({
      name: artist.name,
      value: artistRevenue[artist.id] || 0
    })).filter(d => d.value > 0);

  }, [events, artists]);

  const artistPerformanceData = useMemo(() => {
    if (!events || !artists) return [];
    
    const artistEventCount: Record<string, number> = {};

    events.forEach(event => {
        event.artistIds.forEach(artistId => {
            if (!artistEventCount[artistId]) {
                artistEventCount[artistId] = 0;
            }
            artistEventCount[artistId]++;
        });
    });

    return artists.map(artist => ({
        name: artist.name,
        events: artistEventCount[artist.id] || 0,
    }));

  }, [events, artists]);
  
  const isLoading = isLoadingFinances || isLoadingEvents || isLoadingArtists;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Relatórios</h1>
      
       {isLoading && (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando relatórios...</p>
          </div>
        )}

      {!isLoading && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Desempenho Mensal</CardTitle>
                <CardDescription>Receitas vs. Despesas este ano.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v/1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} formatter={(value: number) => `R$${value.toLocaleString('pt-BR')}`} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="hsl(var(--primary))" strokeWidth={2} name="Receita" />
                    <Line type="monotone" dataKey="expenses" stroke="hsl(var(--accent))" strokeWidth={2} name="Despesas" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Receita por Artista</CardTitle>
                <CardDescription>Detalhamento da receita por artista em eventos pagos.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={revenueByArtistData} cx="50%" cy="50%" labelLine={false} outerRadius={100} dataKey="value" nameKey="name">
                      {revenueByArtistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} formatter={(value: number) => `R$${value.toLocaleString('pt-BR')}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
                <CardTitle>Desempenho do Artista</CardTitle>
                <CardDescription>Número de eventos por artista.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={artistPerformanceData}>
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} angle={-15} textAnchor="end" height={50} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} cursor={{fill: 'hsl(var(--muted))'}} />
                        <Bar dataKey="events" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Eventos" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

