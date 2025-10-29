
'use client';

import { useState, useMemo } from 'react';
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
import { ArrowDownCircle, ArrowUpCircle, PlusCircle, MoreHorizontal, CalendarIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { FinancialTransaction, Artist } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, query, where, doc, orderBy } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const initialTransactionState: Omit<FinancialTransaction, 'id' | 'userId'> = {
  type: 'Receita',
  description: '',
  amount: 0,
  date: format(new Date(), 'yyyy-MM-dd'),
};

export default function FinancesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const transactionsRef = useMemoFirebase(() => user ? query(collection(firestore, 'finances'), where('userId', '==', user.uid), orderBy('date', 'desc')) : null, [firestore, user]);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<FinancialTransaction>(transactionsRef);

  const artistsRef = useMemoFirebase(() => user ? query(collection(firestore, 'artists'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: artists, isLoading: isLoadingArtists } = useCollection<Artist>(artistsRef);

  const [isFormOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  
  const [currentTransaction, setCurrentTransaction] = useState<Partial<FinancialTransaction>>(initialTransactionState);
  const [transactionToDelete, setTransactionToDelete] = useState<FinancialTransaction | null>(null);

  const isLoading = isLoadingTransactions || isLoadingArtists;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCurrentTransaction(prev => ({ ...prev, [id]: id === 'amount' ? Number(value) : value }));
  };

  const handleSelectChange = (id: string) => (value: string) => {
    setCurrentTransaction(prev => ({ ...prev, [id]: value }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentTransaction(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
    }
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(!firestore || !user || !currentTransaction) return;

    if (isEditing) {
        if (!currentTransaction.id) return;
        const transactionDocRef = doc(firestore, 'finances', currentTransaction.id);
        
        // Create a copy to avoid mutating state, and remove id
        const { id, ...dataToUpdate } = currentTransaction;

        if (dataToUpdate.type !== 'Despesa') {
            dataToUpdate.artistId = undefined; // Use undefined to remove field
        }
        updateDocumentNonBlocking(transactionDocRef, dataToUpdate);
    } else {
        const transactionsCollectionRef = collection(firestore, 'finances');
        
        const dataToAdd: any = { ...currentTransaction, userId: user.uid };
        if (dataToAdd.type !== 'Despesa') {
            delete dataToAdd.artistId;
        }
        addDocumentNonBlocking(transactionsCollectionRef, dataToAdd);
    }
    
    setFormOpen(false);
  };
  
  const handleDeleteTransaction = async () => {
    if (!firestore || !transactionToDelete) return;
    
    const transactionDocRef = doc(firestore, 'finances', transactionToDelete.id);
    await deleteDocumentNonBlocking(transactionDocRef);

    setDeleteAlertOpen(false);
    setTransactionToDelete(null);
  }

  const openAddDialog = () => {
    setCurrentTransaction(initialTransactionState);
    setIsEditing(false);
    setFormOpen(true);
  }

  const openEditDialog = (transaction: FinancialTransaction) => {
    setCurrentTransaction(transaction);
    setIsEditing(true);
    setFormOpen(true);
  }

  const openDeleteAlert = (transaction: FinancialTransaction) => {
    setTransactionToDelete(transaction);
    setDeleteAlertOpen(true);
  }

  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    const totalIncome = transactions
      ?.filter((t) => t.type === 'Receita')
      .reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalExpense = transactions
      ?.filter((t) => t.type === 'Despesa')
      .reduce((sum, t) => sum + t.amount, 0) || 0;
    const netBalance = totalIncome - totalExpense;
    return { totalIncome, totalExpense, netBalance };
  }, [transactions]);

  const renderForm = () => {
      if (!currentTransaction) return null;

      const selectedDate = currentTransaction.date ? parseISO(currentTransaction.date) : undefined;

      return (
        <form onSubmit={handleSubmit} className="p-4">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Tipo
                  </Label>
                  <Select value={currentTransaction.type} onValueChange={handleSelectChange('type') as (value: 'Receita' | 'Despesa') => void}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Receita">Receita</SelectItem>
                      <SelectItem value="Despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {currentTransaction.type === 'Despesa' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="artistId" className="text-right">
                      Artista
                    </Label>
                    <Select value={currentTransaction.artistId || ''} onValueChange={handleSelectChange('artistId')}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione um artista (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {artists?.map(artist => (
                          <SelectItem key={artist.id} value={artist.id}>{artist.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descrição
                  </Label>
                  <Input id="description" value={currentTransaction.description || ''} onChange={handleInputChange} placeholder="Ex: Aluguel de equipamento" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Valor (R$)
                  </Label>
                  <Input id="amount" type="number" value={currentTransaction.amount || ''} onChange={handleInputChange} placeholder="300" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Data
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "col-span-3 justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Salvar Transação</Button>
              </div>
            </form>
      )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Finanças
        </h1>
        <Button onClick={openAddDialog}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Adicionar Transação
        </Button>
      </div>

       <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{isEditing ? 'Editar Transação' : 'Adicionar Nova Transação'}</DialogTitle>
              <DialogDescription>
                {isEditing ? 'Atualize os detalhes da transação.' : 'Preencha os detalhes da nova transação.'}
              </DialogDescription>
            </DialogHeader>
            {renderForm()}
        </DialogContent>
       </Dialog>
      
       <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente a transação.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTransaction}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">R${totalIncome.toLocaleString('pt-BR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Despesa Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">R${totalExpense.toLocaleString('pt-BR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saldo Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-foreground' : 'text-red-600'}`}>
              R${netBalance.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>
            Uma lista detalhada de todas as receitas e despesas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p className='text-center text-muted-foreground'>Carregando transações...</p>}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((transaction) => {
                  const artist = artists?.find(a => a.id === transaction.artistId);
                  const description = artist 
                    ? `Pagamento: ${artist.name}`
                    : transaction.description;

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Badge variant="outline" className={cn('font-semibold', transaction.type === 'Receita' ? 'text-green-600 border-green-600/30 bg-green-500/10' : 'text-red-600 border-red-600/30 bg-red-500/10')}>
                          {transaction.type === 'Receita' ? <ArrowUpCircle className="w-4 h-4 mr-2" /> : <ArrowDownCircle className="w-4 h-4 mr-2" />}
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                          <div className="font-medium">{description}</div>
                          <div className="text-sm text-muted-foreground sm:hidden">
                              {transaction.date ? format(parseISO(transaction.date), 'dd/MM/yy', { locale: ptBR }) : ''}
                          </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{transaction.date ? format(parseISO(transaction.date), 'dd MMM, yyyy', { locale: ptBR }) : ''}</TableCell>
                      <TableCell className={cn('text-right font-semibold', transaction.type === 'Receita' ? 'text-green-600' : 'text-red-600')}>
                        {transaction.type === 'Receita' ? '+' : '-'}{transaction.amount ? `R$${transaction.amount.toLocaleString('pt-BR')}` : 'R$0'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="w-4 h-4" />
                              <span className="sr-only">Alternar menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditDialog(transaction)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => openDeleteAlert(transaction)}>Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
           {!isLoading && transactions?.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              Nenhuma transação encontrada.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    