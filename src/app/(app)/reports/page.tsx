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
  { name: 'Feb', income: 3000, expenses: 1398 },
  { name: 'Mar', income: 2000, expenses: 9800 },
  { name: 'Apr', income: 2780, expenses: 3908 },
  { name: 'May', income: 1890, expenses: 4800 },
  { name: 'Jun', income: 2390, expenses: 3800 },
  { name: 'Jul', income: 3490, expenses: 4300 },
];

const categoryData = [
  { name: 'Weddings', value: 400 },
  { name: 'Corporate', value: 300 },
  { name: 'Private Parties', value: 300 },
  { name: 'Festivals', value: 200 },
];

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Reports</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <CardDescription>Income vs. Expenses over the last 7 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="hsl(var(--primary))" strokeWidth={2} name="Income" />
                <Line type="monotone" dataKey="expenses" stroke="hsl(var(--accent))" strokeWidth={2} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Income by Event Category</CardTitle>
            <CardDescription>Breakdown of revenue sources.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} outerRadius={100} dataKey="value" nameKey="name">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Artist Performance</CardTitle>
            <CardDescription>Number of events per artist.</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                    { name: 'The Rockers', events: 12 },
                    { name: 'Acoustic Soul', events: 25 },
                    { name: 'Beat Droppers', events: 8 },
                    { name: 'Jazz Masters', events: 18 },
                ]}>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} cursor={{fill: 'hsl(var(--muted))'}} />
                    <Bar dataKey="events" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
