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
import { ArrowUp, DollarSign, Calendar as CalendarIcon, ArrowDown, Users, Music, CheckCircle2, Clock } from 'lucide-react';
import { format, parseISO, getMonth, startOfDay } from 'date-fns';
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

// Cores vibrantes sugeridas
const FINANCIAL_COLORS = {
  income: '#10b981', // emerald-500
  outcome: '#f43f5e', // rose-500
};

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'
];

const STATUS_COLORS_CHART: Record<string, string> = {
  Pendente: '#f59e0b', // amber-500
  Confirmado: '#3b82f6', // blue-500
  Concluído: '#10b981', // emerald-500
  Cancelado: '#ef4444', // red-500
};

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedArtistId, setSelectedArtistId] = useState<string>('all');

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

  // Filtragem Global
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter(event => {
      const date = parseISO(event.date);
      const yearMatch = selectedYear === 'all' || date.getFullYear() === selectedYear;
      const monthMatch = selectedMonth === 'all' || getMonth(date) === Number(selectedMonth);
      const clientMatch = selectedClientId === 'all' || event.clientId === selectedClientId;
      const artistMatch = selectedArtistId === 'all' || event.artistIds?.includes(selectedArtistId);
      return yearMatch && monthMatch && clientMatch && artistMatch;
    });
  }, [events, selectedYear, selectedMonth, selectedClientId, selectedArtistId]);

  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    return purchases.filter(purchase => {
      const date = parseISO(purchase.date);
      const yearMatch = selectedYear === 'all' || date.getFullYear() === selectedYear;
      const monthMatch = selectedMonth === 'all' || getMonth(date) === Number(selectedMonth);
      return yearMatch && monthMatch;
    });
  }, [purchases, selectedYear, selectedMonth]);

  const { totalIncome, totalOutcome, netProfit, totalEventsCount, activeClientsCount } = useMemo(() => {
    const income = filteredEvents
      ?.filter((e) => e.paymentStatus === 'Pago')
      .reduce((sum, e) => sum + e.payment, 0) || 0;
    
    const purchaseOutcome = filteredPurchases
      ?.filter(p => p.status === 'Pago')
      .reduce((sum, p) => sum + p.amount, 0) || 0;

    const loanOutcome = loans?.reduce((sum, loan) => {
        const startDate = parseISO(loan.startDate);
        const totalAmount = calculateTotalWithInterest(loan.amount, loan.interestRate, loan.installments, loan.interestType);
        const installmentValue = totalAmount / loan.installments;
        
        let localOutcome = 0;
        for (let i = 0; i < loan.paidInstallments; i++) {
          const paymentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
          const yearMatch = selectedYear === 'all' || paymentDate.getFullYear() === selectedYear;
          const monthMatch = selectedMonth === 'all' || paymentDate.getMonth() === Number(selectedMonth);
          if (yearMatch && monthMatch) {
            localOutcome += installmentValue;
          }
        }
        return sum + localOutcome;
    }, 0) || 0;

    const outcome = purchaseOutcome + loanOutcome;

    return { 
      totalIncome: income, 
      totalOutcome: outcome, 
      netProfit: income - outcome,
      totalEventsCount: filteredEvents.length,
      activeClientsCount: new Set(filteredEvents.map(e => e.clientId)).size
    };
  }, [filteredEvents, filteredPurchases, loans, selectedYear, selectedMonth]);

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

  const chartData = useMemo(() => {
    // Casos Base: Se filtrado por um ano específico, mostra meses. Se filtrado por "Todos", mostra anos.
    if (selectedYear !== 'all') {
      const data = Array.from({ length: 12 }, (_, i) => ({
        label: format(new Date(selectedYear, i), 'LLL', { locale: ptBR }),
        income: 0,
        outcome: 0,
      }));

      const baseEvents = events?.filter(e => {
          const d = parseISO(e.date);
          return d.getFullYear() === selectedYear && 
                 (selectedClientId === 'all' || e.clientId === selectedClientId) &&
                 (selectedArtistId === 'all' || e.artistIds?.includes(selectedArtistId));
      });

      baseEvents?.forEach(event => {
        if (event.paymentStatus === 'Pago') {
          const monthIndex = getMonth(parseISO(event.date));
          data[monthIndex].income += event.payment;
        }
      });
      
      purchases?.forEach(purchase => {
          const d = parseISO(purchase.date);
          if(d.getFullYear() === selectedYear && purchase.status === 'Pago') {
              data[getMonth(d)].outcome += purchase.amount;
          }
      });

      loans?.forEach(loan => {
          const startDate = parseISO(loan.startDate);
          const totalAmount = calculateTotalWithInterest(loan.amount, loan.interestRate, loan.installments, loan.interestType);
          const installmentValue = totalAmount / loan.installments;
          for (let i = 0; i < loan.paidInstallments; i++) {
              const paymentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
              if (paymentDate.getFullYear() === selectedYear) {
                  data[paymentDate.getMonth()].outcome += installmentValue;
              }
          }
      });
      return data;
    } else {
      // Agrupamento por Ano
      const yearMap: Record<number, { label: string, income: number, outcome: number }> = {};
      
      const years = availableYears.sort((a, b) => a - b);
      years.forEach(y => {
        yearMap[y] = { label: String(y), income: 0, outcome: 0 };
      });

      const baseEvents = events?.filter(e => 
        (selectedClientId === 'all' || e.clientId === selectedClientId) &&
        (selectedArtistId === 'all' || e.artistIds?.includes(selectedArtistId))
      );

      baseEvents?.forEach(event => {
        if (event.paymentStatus === 'Pago') {
          const y = parseISO(event.date).getFullYear();
          if (yearMap[y]) yearMap[y].income += event.payment;
        }
      });

      purchases?.forEach(purchase => {
        if (purchase.status === 'Pago') {
          const y = parseISO(purchase.date).getFullYear();
          if (yearMap[y]) yearMap[y].outcome += purchase.amount;
        }
      });

      loans?.forEach(loan => {
          const startDate = parseISO(loan.startDate);
          const totalAmount = calculateTotalWithInterest(loan.amount, loan.interestRate, loan.installments, loan.interestType);
          const installmentValue = totalAmount / loan.installments;
          for (let i = 0; i < loan.paidInstallments; i++) {
              const paymentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
              const y = paymentDate.getFullYear();
              if (yearMap[y]) yearMap[y].outcome += installmentValue;
          }
      });

      return Object.values(yearMap);
    }
  }, [events, purchases, loans, selectedYear, selectedClientId, selectedArtistId, availableYears]);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEvents.forEach(e => {
      counts[e.status] = (counts[e.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredEvents]);

  const topClientsData = useMemo(() => {
    const clientRevenue: Record<string, number> = {};
    filteredEvents.forEach(e => {
      if (e.paymentStatus === 'Pago') {
        clientRevenue[e.clientId] = (clientRevenue[e.clientId] || 0) + e.payment;
      }
    });
    return Object.entries(clientRevenue)
      .map(([id, revenue]) => ({
        name: clients?.find(c => c.id === id)?.name || 'Desconhecido',
        revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredEvents, clients]);

  const topArtistsData = useMemo(() => {
    const artistBookings: Record<string, number> = {};
    filteredEvents.forEach(e => {
      e.artistIds?.forEach(aid => {
        artistBookings[aid] = (artistBookings[aid] || 0) + 1;
      });
    });
    return Object.entries(artistBookings)
      .map(([id, bookings]) => ({
        name: artists?.find(a => a.id === id)?.name || 'Desconhecido',
        bookings
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);
  }, [filteredEvents, artists]);

  const paymentStatusData = useMemo(() => {
    const paid = filteredEvents.filter(e => e.paymentStatus === 'Pago').length;
    const unpaid = filteredEvents.filter(e => e.paymentStatus === 'Não Pago').length;
    return [
      { name: 'Pago', value: paid },
      { name: 'Pendente', value: unpaid }
    ];
  }, [filteredEvents]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Painel de Controle
        </h1>
        
        <div className="flex flex-wrap gap-2">
          {/* Filtro Global de Ano */}
          <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(value === 'all' ? 'all' : Number(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Anos</SelectItem>
              {availableYears.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro de Mês (Desativado se "Todos os Anos" selecionado) */}
          <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === 'all'}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Meses</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={String(i)}>
                  {format(new Date(2024, i, 1), 'MMMM', { locale: ptBR })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita</CardTitle>
            <ArrowUp className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              R${totalIncome.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">{selectedYear === 'all' ? 'Acumulado Total' : 'No período selecionado'}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-rose-500/10 border-rose-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesa</CardTitle>
            <ArrowDown className="w-4 h-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
              R${totalOutcome.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">{selectedYear === 'all' ? 'Acumulado Total' : 'No período selecionado'}</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-rose-600'}`}>
              R${netProfit.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">Receita - Despesa</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
            <CalendarIcon className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {totalEventsCount}
            </div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {activeClientsCount}
            </div>
            <p className="text-xs text-muted-foreground">Com eventos no período</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-6 lg:grid-flow-row-dense">
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle>Fluxo de Caixa Financeiro</CardTitle>
              <CardDescription>
                {selectedYear === 'all' 
                  ? 'Comparação anual de receitas e despesas.' 
                  : `Receitas e despesas mensais de ${selectedYear}.`
                }
              </CardDescription>
            </div>
            {/* Seletor Local de Ano */}
            <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(value === 'all' ? 'all' : Number(value))}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Ver Todos os Anos</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => `R$${value.toLocaleString('pt-BR')}`} />
                <Legend iconSize={10} />
                <Bar dataKey="income" fill={FINANCIAL_COLORS.income} name="Receita" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outcome" fill={FINANCIAL_COLORS.outcome} name="Despesa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Eventos por Status</CardTitle>
            <CardDescription>Distribuição no período.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%" cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS_CHART[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Top 5 Clientes (Receita)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topClientsData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={10} hide />
                <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} axisLine={false} width={100} />
                <Tooltip formatter={(value: number) => `R$${value.toLocaleString('pt-BR')}`} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-500" />
              Artistas Mais Escalados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topArtistsData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={10} hide />
                <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} axisLine={false} width={100} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#a855f7" radius={[0, 4, 4, 0]} name="Eventos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Próximos Eventos
            </CardTitle>
            <CardDescription>Próximos 5 eventos agendados.</CardDescription>
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
                        <TableCell>{format(parseISO(event.date), 'dd/MM/yy')}</TableCell>
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Status de Pagamento
            </CardTitle>
            <CardDescription>Eventos Pagos vs Pendentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%" cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}