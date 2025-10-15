'use client';

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

const monthlyData = [
  { name: 'Jan', income: 4000, expenses: 2400 },
  { name: 'Fev', income: 3000, expenses: 1398 },
  { name: 'Mar', income: 2000, expenses: 9800 },
  { name: 'Abr', income: 2780, expenses: 3908 },
  { name: 'Mai', income: 1890, expenses: 4800 },
  { name: 'Jun', income: 2390, expenses: 3800 },
  { name: 'Jul', income: 3490, expenses: 4300 },
];

const categoryData = [
  { name: 'Casamentos', value: 400 },
  { name: 'Corporativos', value: 300 },
  { name: 'Festas Privadas', value: 300 },
  { name: 'Festivais', value: 200 },
];

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Relatórios</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Desempenho Mensal</CardTitle>
            <CardDescription>Receitas vs. Despesas nos últimos 7 meses.</CardDescription>
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
            <CardTitle>Receita por Categoria de Evento</CardTitle>
            <CardDescription>Detalhamento das fontes de receita.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} outerRadius={100} dataKey="value" nameKey="name">
                  {categoryData.map((entry, index) => (
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
                <BarChart data={[
                    { name: 'Os Rockeiros', events: 12 },
                    { name: 'Alma Acústica', events: 25 },
                    { name: 'Beat Droppers', events: 8 },
                    { name: 'Mestres do Jazz', events: 18 },
                ]}>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} cursor={{fill: 'hsl(var(--muted))'}} />
                    <Bar dataKey="events" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Eventos" />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
