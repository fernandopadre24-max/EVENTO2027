'use client';

import { useMemo, useState, useEffect } from 'react';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  ArrowUp, 
  DollarSign, 
  Calendar as CalendarIcon, 
  ArrowDown, 
  Users, 
  Music, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle 
} from 'lucide-react';
import { format, parseISO, getMonth, startOfDay, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Event, Client, Purchase, EventStatus, Loan, Artist } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusColors: Record<EventStatus, string> = {
  Pendente: 'bg-yellow-400/20 text-yellow-600 border-yellow-400/30',
  Confirmado: 'bg-blue-400/20 text-blue-600 border-blue-400/30',
  Concluído: 'bg-green-400/20 text-green-600 border-green-400/30',
  Cancelado: 'bg-red-400/20 text-red-600 border-red-400/30',
};

const PIE_COLORS = {
  Pendente: '#fbbf24', // yellow-400
  Confirmado: '#60a5fa', // blue-400
  Concluído: '#10b981', // emerald-500
  Cancelado: '#f43f5e', // rose-500
  'Pago': '#10b981',
  'Não Pago': '#f43f5e',
};

const FINANCIAL_COLORS = {
  income: '#10b981', // emerald-500
  outcome: '#f43f5e', // rose-500
};

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedArtistId, setSelectedArtistId] = useState<string>('all');

  useEffect(() => {
    setSelectedYear(new Date().getFullYear());
  }, []);

  const eventsRef = useMemoFirebase(() => user ? query(collection(firestore, 'events'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: events } = useCollection<Event>(eventsRef);

  const clientsRef = useMemoFirebase(() => user ? query(collection(firestore, 'clients'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: clients } = useCollection<Client>(clientsRef);
  
  const purchasesRef = useMemoFirebase(() => user ? query(collection(firestore, 'purchases'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: purchases } = useCollection<Purchase>(purchasesRef);

  const loansRef = useMemoFirebase(() => user ? query(collection(firestore, 'loans'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: loans } = useCollection<Loan>(loansRef);

  const artistsRef = useMemoFirebase(() => user ? query(collection(firestore, 'artists'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: artists } = useCollection<Artist>(artistsRef);

  const calculateTotalWithInterest = (principal: number, rate: number, installments: number, type: 'Simples' | 'Composto') => {
    if (principal <= 0) return 0;
    if (installments <= 0) return principal;
    if (rate <= 0) return principal;
    if (type === 'Simples') {
      return principal + (principal * (rate / 100) * installments);
    } else {
      return principal * Math.pow(1 + (rate / 100), installments);
    }
  };

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter(event => {
      const date = parseISO(event.date);
      const yearMatch = selectedYear ? date.getFullYear() === selectedYear : true;
      const monthMatch = selectedMonth === 'all' ? true : date.getMonth() === MONTHS.indexOf(selectedMonth);
      const clientMatch = selectedClientId === 'all' ? true : event.clientId === selectedClientId;
      const artistMatch = selectedArtistId === 'all' ? true : event.artistIds?.includes(selectedArtistId);
      return yearMatch && monthMatch && clientMatch && artistMatch;
    });
  }, [events, selectedYear, selectedMonth, selectedClientId, selectedArtistId]);

  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    return purchases.filter(purchase => {
      const date = parseISO(purchase.date);
      const yearMatch = selectedYear ? date.getFullYear() === selectedYear : true;
      const monthMatch = selectedMonth === 'all' ? true : date.getMonth() === MONTHS.indexOf(selectedMonth);
      const artistMatch = selectedArtistId === 'all' ? true : purchase.artistId === selectedArtistId;
      return yearMatch && monthMatch && artistMatch;
    });
  }, [purchases, selectedYear, selectedMonth, selectedArtistId]);

  const { totalIncome, totalOutcome, netProfit, eventsCount } = useMemo(() => {
    const income = filteredEvents
    ?.filter((e) => e.paymentStatus === 'Pago')
    .reduce((sum, e) => sum + e.payment, 0) || 0;
    
    const purchaseOutcome = filteredPurchases
    ?.filter(p => p.status === 'Pago')
    .reduce((sum, p) => sum + p.amount, 0) || 0;

    const loanOutcome = (loans || []).reduce((sum, loan) => {
        const totalAmount = calculateTotalWithInterest(loan.amount, loan.interestRate, loan.installments, loan.interestType);
        const installmentValue = totalAmount / loan.installments;
        
        // Filter loan installments by selected year/month if needed
        // For simplicity, we'll keep the full paid installments unless specifically requested
        return sum + (installmentValue * loan.paidInstallments);
    }, 0);

    const outcome = purchaseOutcome + loanOutcome;

    return { 
      totalIncome: income, 
      totalOutcome: outcome, 
      netProfit: income - outcome,
      eventsCount: filteredEvents.length
    };
  }, [filteredEvents, filteredPurchases, loans]);

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
    events?.forEach(event => years.add(parseISO(event.date).getFullYear()));
    purchases?.forEach(purchase => years.add(parseISO(purchase.date).getFullYear()));
    if (years.size === 0) return [new Date().getFullYear()];
    return Array.from(years).sort((a, b) => b - a);
  }, [events, purchases]);

  const monthlyChartData = useMemo(() => {
    if (selectedYear === null) return [];
    
    const data = Array.from({ length: 12 }, (_, i) => ({
      month: format(new Date(selectedYear, i), 'LLL', { locale: ptBR }),
      income: 0,
      outcome: 0,
    }));

    filteredEvents.forEach(event => {
      const eventDate = parseISO(event.date);
      if (event.paymentStatus === 'Pago') {
        const monthIndex = getMonth(eventDate);
        data[monthIndex].income += event.payment;
      }
    });
    
    filteredPurchases.forEach(purchase => {
      const purchaseDate = parseISO(purchase.date);
      if(purchase.status === 'Pago') {
          const monthIndex = getMonth(purchaseDate);
          data[monthIndex].outcome += purchase.amount;
      }
    });

    if (selectedMonth === 'all') {
      loans?.forEach(loan => {
          const startDate = parseISO(loan.startDate);
          const totalAmount = calculateTotalWithInterest(loan.amount, loan.interestRate, loan.installments, loan.interestType);
          const installmentValue = totalAmount / loan.installments;

          for (let i = 0; i < loan.paidInstallments; i++) {
              const paymentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
              if (paymentDate.getFullYear() === selectedYear) {
                  const monthIndex = paymentDate.getMonth();
                  data[monthIndex].outcome += installmentValue;
              }
          }
      });
    }

    return data;
  }, [filteredEvents, filteredPurchases, loans, selectedYear, selectedMonth]);

  const statusChartData = useMemo(() => {
    const counts = filteredEvents.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredEvents]);

  const topClientsData = useMemo(() => {
    const revenueByClient = filteredEvents.reduce((acc, event) => {
      acc[event.clientId] = (acc[event.clientId] || 0) + event.payment;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(revenueByClient)
      .map(([clientId, revenue]) => ({
        name: clients?.find(c => c.id === clientId)?.name || 'Desconhecido',
        revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredEvents, clients]);

  const topArtistsData = useMemo(() => {
    const frequencyByArtist = filteredEvents.reduce((acc, event) => {
      event.artistIds?.forEach(id => {
        acc[id] = (acc[id] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequencyByArtist)
      .map(([artistId, count]) => ({
        name: artists?.find(a => a.id === artistId)?.name || 'Desconhecido',
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredEvents, artists]);

  const paymentStatusData = useMemo(() => {
    const counts = filteredEvents.reduce((acc, event) => {
      acc[event.paymentStatus] = (acc[event.paymentStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredEvents]);

  if (selectedYear === null) return null;

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Painel de Controle
        </h1>
        <div className="flex flex-wrap gap-2">
          <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Meses</SelectItem>
              {MONTHS.map(month => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Clientes</SelectItem>
              {clients?.map(client => (
                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedArtistId} onValueChange={setSelectedArtistId}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Artista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Artistas</SelectItem>
              {artists?.map(artist => (
                <SelectItem key={artist.id} value={artist.id}>{artist.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita</CardTitle>
            <ArrowUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R${totalIncome.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300/80">Filtrado</p>
          </CardContent>
        </Card>
        <Card className="bg-rose-500/10 border-rose-500/20 text-rose-900 dark:text-rose-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesa</CardTitle>
            <ArrowDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R${totalOutcome.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-rose-800 dark:text-rose-300/80">Filtrado</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20 text-blue-900 dark:text-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
            <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsCount}</div>
            <p className="text-xs text-blue-800 dark:text-blue-300/80">Realizados/Agendados</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/10 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Cadastrados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fluxo Financeiro</CardTitle>
            <CardDescription>Receitas vs. Despesas.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => `R$${value.toLocaleString('pt-BR')}`} />
                <Legend iconSize={10} />
                <Bar dataKey="income" fill={FINANCIAL_COLORS.income} name="Receita" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outcome" fill={FINANCIAL_COLORS.outcome} name="Despesa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eventos por Status</CardTitle>
            <CardDescription>Distribuição atual.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as EventStatus] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clientes</CardTitle>
            <CardDescription>Por receita gerada.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topClientsData} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} fontSize={10} />
                <Tooltip formatter={(value: number) => `R$${value.toLocaleString('pt-BR')}`} />
                <Bar dataKey="revenue" fill="#60a5fa" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Artistas Populares</CardTitle>
            <CardDescription>Frequência em eventos.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topArtistsData} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" fill="#fbbf24" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status de Pagamento</CardTitle>
            <CardDescription>Pagos vs. Pendentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as 'Pago' | 'Não Pago'] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <Card>
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
                        <TableCell>{format(parseISO(event.date), 'dd/MM/yyyy')}</TableCell>
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