
'use client';

import { useMemo } from 'react';
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
import { ArrowDown, ArrowUp, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Event, FinancialTransaction, Client } from '@/lib/types';


const chartData = [
  { month: 'Jan', income: 4000, outcome: 2400 },
  { month: 'Fev', income: 3000, outcome: 1398 },
  { month: 'Mar', income: 5000, outcome: 7800 },
  { month: 'Abr', income: 2780, outcome: 3908 },
  { month: 'Mai', income: 1890, outcome: 4800 },
  { month: 'Jun', income: 2390, outcome: 3800 },
];

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const eventsRef = useMemoFirebase(() => user ? query(collection(firestore, 'events'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: events } = useCollection<Event>(eventsRef);

  const financesRef = useMemoFirebase(() => user ? query(collection(firestore, 'finances'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: financialTransactions } = useCollection<FinancialTransaction>(financesRef);
  
  const clientsRef = useMemoFirebase(() => user ? query(collection(firestore, 'clients'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: clients } = useCollection<Client>(clientsRef);


  const { totalIncome, totalOutcome, netProfit } = useMemo(() => {
    const income = financialTransactions
    ?.filter((t) => t.type === 'Receita')
    .reduce((sum, t) => sum + t.amount, 0) || 0;
    const outcome = financialTransactions
    ?.filter((t) => t.type === 'Despesa')
    .reduce((sum, t) => sum + t.amount, 0) || 0;
    return { totalIncome: income, totalOutcome: outcome, netProfit: income - outcome };
  }, [financialTransactions]);

  const upcomingEvents = useMemo(() => events?.filter(
    (e) => new Date(e.date) >= new Date() && e.status !== 'Cancelado'
  ).slice(0, 5) || [], [events]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Painel
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <ArrowUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R${totalIncome.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">+20.1% do último mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
            <ArrowDown className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R${totalOutcome.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">+10.5% do último mês</p>
          </CardContent>
        </Card>
        <Card>
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
            <CardTitle>Visão Geral Financeira</CardTitle>
            <CardDescription>Receitas vs. Despesas este ano.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
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
                  tickFormatter={(value) => `R$${value}`}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingEvents.map((event) => {
                    const client = clients?.find(c => c.id === event.clientId);
                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{client?.name || 'N/A'}</TableCell>
                        <TableCell>{format(parseISO(event.date), 'dd/MM')}</TableCell>
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
