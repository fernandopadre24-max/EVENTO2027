
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Event, Artist, Purchase } from '@/lib/types';
import { format, parseISO, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

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
    if (!events && !purchases) return { totalIncome: 0, totalExpense: 0, netBalance: 0, recentTransactions: [] };

    const income = events
      ?.filter(e => e.paymentStatus === 'Pago')
      .reduce((sum, e) => sum + e.payment, 0) || 0;
      
    const expenseFromPurchases = purchases?.reduce((sum, p) => sum + p.amount, 0) || 0;
    
    const expense = expenseFromPurchases;

    const unifiedTransactions: UnifiedTransaction[] = [
      ...(events || []).filter(e => e.paymentStatus === 'Pago').map(e => ({
          id: e.id,
          type: 'Receita' as 'Receita',
          description: `Pagamento do evento em ${e.local}`,
          date: e.date,
          amount: e.payment,
      })),
      ...(purchases || []).map(p => ({
          id: p.id,
          type: 'Despesa' as 'Despesa',
          description: p.description,
          date: p.date,
          amount: p.amount,
      })),
    ];
    
    const sortedTransactions = unifiedTransactions.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense,
      recentTransactions: sortedTransactions.slice(0, 10),
    };
  }, [events, purchases]);


  const monthlyData = useMemo(() => {
    if (!events && !purchases) return [];
    const monthlySummary = Array.from({ length: 12 }, (_, i) => ({
      name: format(new Date(0, i), 'LLL', { locale: ptBR }),
      income: 0,
      expenses: 0,
    }));

    events?.forEach(event => {
      const month = getMonth(parseISO(event.date));
      if (event.paymentStatus === 'Pago') {
        monthlySummary[month].income += event.payment;
      }
    });

    purchases?.forEach(purchase => {
        const month = getMonth(parseISO(purchase.date));
        monthlySummary[month].expenses += purchase.amount;
    });

    return monthlySummary;
  }, [events, purchases]);

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
  
  const isLoading = isLoadingEvents || isLoadingArtists || isLoadingPurchases;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Relatórios</h1>
      
       {isLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 mr-2 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Carregando relatórios...</p>
          </div>
        )}

      {!isLoading && (
        <>
           <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Receita Total</CardTitle>
                <CardDescription>Soma de todos os pagamentos de eventos.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">R${totalIncome.toLocaleString('pt-BR')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Despesa Total</CardTitle>
                 <CardDescription>Soma de todas as compras.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">R${totalExpense.toLocaleString('pt-BR')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Saldo Líquido</CardTitle>
                <CardDescription>Receitas menos despesas.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-foreground' : 'text-red-600'}`}>
                  R${netBalance.toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
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

          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                As 10 transações financeiras mais recentes (receitas de eventos e compras).
              </CardDescription>
            </CardHeader>
            <CardContent>
             <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden sm:table-cell">Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Badge variant="outline" className={cn('font-semibold', transaction.type === 'Receita' ? 'text-green-600' : 'text-red-600')}>
                          {transaction.type === 'Receita' ? <ArrowUpCircle className="w-4 h-4 mr-2" /> : <ArrowDownCircle className="w-4 h-4 mr-2" />}
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground sm:hidden">
                            {format(parseISO(transaction.date), 'dd/MM/yy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{format(parseISO(transaction.date), 'dd MMM, yyyy', { locale: ptBR })}</TableCell>
                      <TableCell className={cn('text-right font-semibold', transaction.type === 'Receita' ? 'text-green-600' : 'text-red-600')}>
                        {transaction.type === 'Receita' ? '+' : '-'}R${transaction.amount.toLocaleString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
