
'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  ResponsiveContainer,
} from 'recharts';
import { ArrowUp, DollarSign, Calendar as CalendarIcon, ArrowDown } from 'lucide-react';
import { format, parseISO, getMonth, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Event, Client, Purchase, EventStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusColors: Record<EventStatus, string> = {
  Pendente: 'bg-yellow-400/20 text-yellow-600 border-yellow-400/30',
  Confirmado: 'bg-blue-400/20 text-blue-600 border-blue-400/30',
  Concluído: 'bg-green-400/20 text-green-600 border-green-400/30',
  Cancelado: 'bg-red-400/20 text-red-600 border-red-400/30',
};

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const eventsRef = useMemoFirebase(() => user ? query(collection(firestore, 'events'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: events } = useCollection<Event>(eventsRef);

  const clientsRef = useMemoFirebase(() => user ? query(collection(firestore, 'clients'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: clients } = useCollection<Client>(clientsRef);
  
  const purchasesRef = useMemoFirebase(() => user ? query(collection(firestore, 'purchases'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: purchases } = useCollection<Purchase>(purchasesRef);

  const { totalIncome, totalOutcome, netProfit } = useMemo(() => {
    const income = events
    ?.filter((e) => e.paymentStatus === 'Pago')
    .reduce((sum, e) => sum + e.payment, 0) || 0;
    
    const purchaseOutcome = purchases
    ?.filter(p => p.status === 'Pago')
    .reduce((sum, p) => sum + p.amount, 0) || 0;

    const outcome = purchaseOutcome;

    return { totalIncome: income, totalOutcome: outcome, netProfit: income - outcome };
  }, [events, purchases]);

  const upcomingEvents = useMemo(() => {
    if (!events) return [];
    const today = startOfDay(new Date());
    return events
      .filter(e => parseISO(e.date) >= today && e.status !== 'Cancelado')
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5);
  }, [events]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    events?.forEach(event => {
      years.add(parseISO(event.date).getFullYear());
    });
    purchases?.forEach(purchase => {
      years.add(parseISO(purchase.date).getFullYear());
    });
    if (years.size === 0) {
      return [new Date().getFullYear()];
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [events, purchases]);

  const monthlyChartData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      month: format(new Date(selectedYear, i), 'LLL', { locale: ptBR }),
      income: 0,
      outcome: 0,
    }));

    events?.forEach(event => {
      const eventDate = parseISO(event.date);
      if (eventDate.getFullYear() === selectedYear && event.paymentStatus === 'Pago') {
        const monthIndex = getMonth(eventDate);
        data[monthIndex].income += event.payment;
      }
    });
    
    purchases?.forEach(purchase => {
        const purchaseDate = parseISO(purchase.date);
        if(purchaseDate.getFullYear() === selectedYear && purchase.status === 'Pago') {
            const monthIndex = getMonth(purchaseDate);
            data[monthIndex].outcome += purchase.amount;
        }
    });

    return data;
  }, [events, purchases, selectedYear]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Painel
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-green-500/10 border-green-500/20 text-green-900 dark:text-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <ArrowUp className="w-4 h-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R${totalIncome.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-green-800 dark:text-green-300/80">Acumulado geral</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20 text-red-900 dark:text-red-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
            <ArrowDown className="w-4 h-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R${totalOutcome.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-red-800 dark:text-red-300/80">Acumulado geral</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/10 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R${netProfit.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">Análise do lucro geral</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-5 lg:grid-flow-row-dense">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Visão Geral Financeira</CardTitle>
                <CardDescription>Receitas vs. Despesas por ano.</CardDescription>
              </div>
              <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                <SelectTrigger className="w-full sm:w-[120px] mt-2 sm:mt-0">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value/1000}k`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number) => `R$${value.toLocaleString('pt-BR')}`}
                />
                <Legend iconSize={10} />
                <Bar dataKey="income" fill="hsl(var(--primary))" name="Receita" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outcome" fill="hsl(var(--accent))" name="Despesa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Próximos Eventos
            </CardTitle>
            <CardDescription>Seus próximos 5 eventos agendados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingEvents.map((event) => {
                    const client = clients?.find(c => c.id === event.clientId);
                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">
                            <div>{client?.name || 'N/A'}</div>
                        </TableCell>
                        <TableCell>{format(parseISO(event.date), 'dd/MM')}</TableCell>
                        <TableCell>{event.time}</TableCell>
                        <TableCell>R${event.payment.toLocaleString('pt-BR')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('font-semibold text-xs', statusColors[event.status])}>
                            {event.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
