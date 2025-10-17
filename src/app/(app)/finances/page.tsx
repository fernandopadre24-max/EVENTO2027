
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
import { ArrowDownCircle, ArrowUpCircle, PlusCircle, MoreHorizontal } from 'lucide-react';
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
  DialogTrigger,
  DialogFooter,
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
import { collection, query, where, doc } from 'firebase/firestore';

const initialTransactionState = {
  type: 'Receita' as 'Receita' | 'Despesa',
  description: '',
  amount: 0,
  date: format(new Date(), 'yyyy-MM-dd'),
  artistId: '',
};

export default function FinancesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const transactionsRef = useMemoFirebase(() => user ? query(collection(firestore, 'finances'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<FinancialTransaction>(transactionsRef);

  const artistsRef = useMemoFirebase(() => user ? query(collection(firestore, 'artists'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: artists, isLoading: isLoadingArtists } = useCollection<Artist>(artistsRef);

  const [isAddOpen, setAddOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);

  const [newTransaction, setNewTransaction] = useState(initialTransactionState);
  
  const isLoading = isLoadingTransactions || isLoadingArtists;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const targetState = isEditOpen ? setSelectedTransaction : setNewTransaction;
    targetState(prev => ({ ...prev!, [id]: id === 'amount' ? Number(value) : value }));
  };

  const handleSelectChange = (id: string) => (value: string) => {
    const targetState = isEditOpen ? setSelectedTransaction : setNewTransaction;
    targetState(prev => ({ ...prev!, [id]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const targetState = isEditOpen ? setSelectedTransaction : setNewTransaction;
    targetState(prev => ({ ...prev!, [id]: value }));
  };


  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(!firestore || !user) return;
    const transactionsCollectionRef = collection(firestore, 'finances');
    const dataToAdd: Partial<FinancialTransaction> = { ...newTransaction, userId: user.uid };
    if (dataToAdd.type !== 'Despesa' || !dataToAdd.artistId) {
      delete dataToAdd.artistId;
    }
    addDocumentNonBlocking(transactionsCollectionRef, dataToAdd);
    setAddOpen(false);
    setNewTransaction(initialTransactionState);
  };
  
  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !selectedTransaction) return;
    const transactionDocRef = doc(firestore, 'finances', selectedTransaction.id);
    const { id, ...transactionData } = selectedTransaction;
     if (transactionData.type !== 'Despesa' || !transactionData.artistId) {
      transactionData.artistId = undefined;
    }
    updateDocumentNonBlocking(transactionDocRef, transactionData);
    setEditOpen(false);
    setSelectedTransaction(null);
  }
  
  const handleDeleteTransaction = () => {
    if (!firestore || !selectedTransaction) return;
    const transactionDocRef = doc(firestore, 'finances', selectedTransaction.id);
    deleteDocumentNonBlocking(transactionDocRef);
    setDeleteAlertOpen(false);
    setSelectedTransaction(null);
  }

  const openEditDialog = (transaction: FinancialTransaction) => {
    setSelectedTransaction(transaction);
    setEditOpen(true);
  }

  const openDeleteAlert = (transaction: FinancialTransaction) => {
    setSelectedTransaction(transaction);
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

  const renderForm = (isEditing: boolean) => {
      const currentData = isEditing ? selectedTransaction : newTransaction;
      const handleSubmit = isEditing ? handleEditSubmit : handleAddSubmit;

      if (!currentData) return null;

      return (
        <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Tipo
                  </Label>
                  <Select value={currentData.type} onValueChange={handleSelectChange('type') as (value: 'Receita' | 'Despesa') => void}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Receita">Receita</SelectItem>
                      <SelectItem value="Despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {currentData.type === 'Despesa' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="artistId" className="text-right">
                      Artista
                    </Label>
                    <Select value={currentData.artistId || ''} onValueChange={handleSelectChange('artistId')}>
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
                  <Input id="description" value={currentData.description} onChange={handleInputChange} placeholder="Ex: Aluguel de equipamento" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Valor (R$)
                  </Label>
                  <Input id="amount" type="number" value={currentData.amount || ''} onChange={handleInputChange} placeholder="300" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Data
                  </Label>
                  <Input id="date" type="date" value={currentData.date} onChange={handleDateChange} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar Transação</Button>
              </DialogFooter>
            </form>
      )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Finanças
        </h1>
        <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Adicionar Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Transação</DialogTitle>
              <DialogDescription>
                Preencha os detalhes da nova transação.
              </DialogDescription>
            </DialogHeader>
            {renderForm(false)}
          </DialogContent>
        </Dialog>
      </div>

       <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Transação</DialogTitle>
              <DialogDescription>
                Atualize os detalhes da transação.
              </DialogDescription>
            </DialogHeader>
            {renderForm(true)}
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
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
          {isLoading && <p>Carregando transações...</p>}
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
                        <Badge variant="outline" className={cn('font-semibold', transaction.type === 'Receita' ? 'text-green-600' : 'text-red-600')}>
                          {transaction.type === 'Receita' ? <ArrowUpCircle className="w-4 h-4 mr-2" /> : <ArrowDownCircle className="w-4 h-4 mr-2" />}
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                          <div className="font-medium">{description}</div>
                          <div className="text-sm text-muted-foreground sm:hidden">
                              {format(parseISO(transaction.date), 'dd/MM/yy', { locale: ptBR })}
                          </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{format(parseISO(transaction.date), 'dd MMM, yyyy', { locale: ptBR })}</TableCell>
                      <TableCell className={cn('text-right font-semibold', transaction.type === 'Receita' ? 'text-green-600' : 'text-red-600')}>
                        {transaction.type === 'Receita' ? '+' : '-'}R${transaction.amount.toLocaleString('pt-BR')}
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
        </CardContent>
      </Card>
    </div>
  );
}

    