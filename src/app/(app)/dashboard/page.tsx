'use client';

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
import { Badge } from '@/components/ui/badge';
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
import { events, financialTransactions, clients } from '@/lib/data';
import { format, parseISO } from 'date-fns';

const chartData = [
  { month: 'Jan', income: 4000, outcome: 2400 },
  { month: 'Feb', income: 3000, outcome: 1398 },
  { month: 'Mar', income: 5000, outcome: 7800 },
  { month: 'Apr', income: 2780, outcome: 3908 },
  { month: 'May', income: 1890, outcome: 4800 },
  { month: 'Jun', income: 2390, outcome: 3800 },
];

export default function DashboardPage() {
  const totalIncome = financialTransactions
    .filter((t) => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalOutcome = financialTransactions
    .filter((t) => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalOutcome;

  const upcomingEvents = events.filter(
    (e) => new Date(e.date) >= new Date() && e.status !== 'Cancelled'
  ).slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Dashboard
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Outcome</CardTitle>
            <ArrowDown className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalOutcome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+10.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Analysis of overall profit</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Income vs. Outcome this year.</CardDescription>
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
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend iconSize={10} />
                <Bar dataKey="income" fill="hsl(var(--primary))" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outcome" fill="hsl(var(--accent))" name="Outcome" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Upcoming Events
            </CardTitle>
            <CardDescription>Your next 5 scheduled events.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingEvents.map((event) => {
                  const client = clients.find(c => c.id === event.clientId);
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{client?.name || 'N/A'}</TableCell>
                      <TableCell>{format(parseISO(event.date), 'MMM dd')}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
