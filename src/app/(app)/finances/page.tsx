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
import { Button } from '@/components/ui/button';
import { ArrowDownCircle, ArrowUpCircle, PlusCircle, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { financialTransactions } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function FinancesPage() {
  const totalIncome = financialTransactions
    .filter((t) => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = financialTransactions
    .filter((t) => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Finances
        </h1>
        <Button>
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">${totalExpense.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-foreground' : 'text-red-600'}`}>
              ${netBalance.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            A detailed list of all income and expenses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financialTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Badge variant="outline" className={cn('font-semibold', transaction.type === 'Income' ? 'text-green-600' : 'text-red-600')}>
                      {transaction.type === 'Income' ? <ArrowUpCircle className="w-4 h-4 mr-2" /> : <ArrowDownCircle className="w-4 h-4 mr-2" />}
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell>{format(parseISO(transaction.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className={cn('text-right font-semibold', transaction.type === 'Income' ? 'text-green-600' : 'text-red-600')}>
                    {transaction.type === 'Income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="w-4 h-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
