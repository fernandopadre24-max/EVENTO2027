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
import { 
  MoreHorizontal, 
  PlusCircle, 
  Search, 
  Banknote, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  X,
  ChevronRight,
  ArrowLeft,
  Calendar as CalendarIcon,
  PieChart,
  Info
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Loan, LoanStatus } from '@/lib/types';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking, 
  useUser 
} from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { format, parseISO, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const initialNewLoanState: Omit<Loan, 'id' | 'userId'> = {
    description: '',
    lender: '',
    amount: 0,
    interestRate: 0,
    interestType: 'Simples',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    installments: 1,
    paidInstallments: 0,
    status: 'Ativo',
    details: '',
};

export default function LoansPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const loansRef = useMemoFirebase(() => user ? query(collection(firestore, 'loans'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: loans, isLoading } = useCollection<Loan>(loansRef);

  const [activeTab, setActiveTab] = useState('lista');
  const [isAddOpen, setAddOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [viewingLoan, setViewingLoan] = useState<Loan | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);

  const [newLoan, setNewLoan] = useState<Omit<Loan, 'id' | 'userId'>>(initialNewLoanState);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'all'>('all');

  const calculateTotalWithInterest = (principal: number, rate: number, installments: number, type: 'Simples' | 'Composto') => {
    if (principal <= 0) return 0;
    if (rate <= 0) return principal;
    
    if (type === 'Simples') {
      return principal + (principal * (rate / 100) * installments);
    } else {
      return principal * Math.pow(1 + (rate / 100), installments);
    }
  };

  const filteredLoans = useMemo(() => {
    return loans
      ?.filter(loan => {
        const searchLower = searchTerm.toLowerCase();
        const descriptionMatch = loan.description.toLowerCase().includes(searchLower);
        const lenderMatch = loan.lender.toLowerCase().includes(searchLower);
        const statusMatch = statusFilter === 'all' || loan.status === statusFilter;
        return (descriptionMatch || lenderMatch) && statusMatch;
      })
      .sort((a, b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()) || [];
  }, [loans, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    if (!loans) return { totalBorrowed: 0, totalRemaining: 0, activeLoans: 0 };
    
    let totalBorrowed = 0;
    let totalRemaining = 0;
    let activeLoans = 0;

    loans.forEach(loan => {
      const totalAmount = calculateTotalWithInterest(loan.amount, loan.interestRate, loan.installments, loan.interestType);
      const installmentValue = totalAmount / loan.installments;
      const remaining = totalAmount - (installmentValue * loan.paidInstallments);
      
      totalBorrowed += totalAmount;
      totalRemaining += remaining;
      if (loan.status === 'Ativo') activeLoans++;
    });

    return { totalBorrowed, totalRemaining, activeLoans };
  }, [loans]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    const numericFields = ['amount', 'interestRate', 'installments', 'paidInstallments'];
    const finalValue = numericFields.includes(id) ? Number(value) : value;

    if (isEditOpen) {
      setSelectedLoan(prev => prev ? ({ ...prev, [id]: finalValue }) : null);
    } else {
      setNewLoan(prev => ({ ...prev, [id]: finalValue }));
    }
  };

  const handleSelectChange = (id: string) => (value: string) => {
    if (isEditOpen) {
      setSelectedLoan(prev => prev ? ({ ...prev, [id]: value }) : null);
    } else {
      setNewLoan(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !user) return;
    const loansCollectionRef = collection(firestore, 'loans');
    
    addDocumentNonBlocking(loansCollectionRef, { ...newLoan, userId: user.uid });
    setAddOpen(false);
    setNewLoan(initialNewLoanState);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !selectedLoan) return;
    const loanDocRef = doc(firestore, 'loans', selectedLoan.id);
    const { id, ...loanData } = selectedLoan;

    updateDocumentNonBlocking(loanDocRef, loanData);
    setEditOpen(false);
    setSelectedLoan(null);
  };

  const handleDeleteLoan = async () => {
    if (!firestore || !loanToDelete) return;
    const loanDocRef = doc(firestore, 'loans', loanToDelete.id);
    await deleteDocumentNonBlocking(loanDocRef);
    setDeleteAlertOpen(false);
    setLoanToDelete(null);
  };

  const updatePaidInstallments = (loan: Loan, increment: number) => {
    if (!firestore) return;
    const loanDocRef = doc(firestore, 'loans', loan.id);
    const newVal = Math.min(Math.max(0, loan.paidInstallments + increment), loan.installments);
    const newStatus: LoanStatus = newVal === loan.installments ? 'Quitado' : 'Ativo';
    updateDocumentNonBlocking(loanDocRef, { paidInstallments: newVal, status: newStatus });
    
    // Also update viewingLoan if it's the same one
    if (viewingLoan?.id === loan.id) {
        setViewingLoan({ ...loan, paidInstallments: newVal, status: newStatus });
    }
  };

  const openEditDialog = (loan: Loan) => {
    setSelectedLoan(loan);
    setEditOpen(true);
  };

  const openDeleteAlert = (loan: Loan) => {
    setLoanToDelete(loan);
    setDeleteAlertOpen(true);
  };

  const handleViewDetails = (loan: Loan) => {
      setViewingLoan(loan);
      setActiveTab('detalhes');
  };

  const renderStatusBadge = (status: LoanStatus) => {
    switch (status) {
      case 'Quitado': return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Quitado</Badge>;
      case 'Em Atraso': return <Badge variant="destructive">Atrasado</Badge>;
      default: return <Badge variant="secondary">Ativo</Badge>;
    }
  };

  const renderForm = (isEditing: boolean) => {
    const currentData = isEditing ? selectedLoan : newLoan;
    if (!currentData) return null;

    const totalCalculated = calculateTotalWithInterest(
      currentData.amount, 
      currentData.interestRate, 
      currentData.installments, 
      currentData.interestType
    );
    const monthlyValue = currentData.installments > 0 ? totalCalculated / currentData.installments : 0;

    return (
      <form onSubmit={isEditing ? handleEditSubmit : handleAddSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descrição</Label>
            <Input id="description" value={currentData.description} onChange={handleInputChange} placeholder="Ex: Empréstimo Instrumento" className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lender" className="text-right">Credor</Label>
            <Input id="lender" value={currentData.lender} onChange={handleInputChange} placeholder="Ex: Banco Itaú / João Silva" className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">Valor Inicial (R$)</Label>
            <Input id="amount" type="number" step="0.01" value={currentData.amount || ''} onChange={handleInputChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="interestRate" className="text-right">Juros (%)</Label>
            <Input id="interestRate" type="number" step="0.1" value={currentData.interestRate || ''} onChange={handleInputChange} className="col-span-1" />
            <Select value={currentData.interestType} onValueChange={handleSelectChange('interestType')}>
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Tipo de Juros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Simples">Juros Simples (am)</SelectItem>
                <SelectItem value="Composto">Juros Compostos (am)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="installments" className="text-right">Parcelas</Label>
            <Input id="installments" type="number" min="1" value={currentData.installments || ''} onChange={handleInputChange} className="col-span-1" required />
            <Label htmlFor="startDate" className="text-right">Início</Label>
            <Input id="startDate" type="date" value={currentData.startDate} onChange={handleInputChange} className="col-span-1" required />
          </div>
          
          <div className="bg-muted p-3 rounded-lg space-y-1">
             <div className="flex justify-between text-sm">
                <span>Total com Juros:</span>
                <span className="font-bold text-primary">R$ {totalCalculated.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span>Valor por Parcela:</span>
                <span className="font-semibold italic">R$ {monthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
             </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="details" className="text-right pt-2">Detalhes</Label>
            <Textarea id="details" value={currentData.details || ''} onChange={handleInputChange} placeholder="Notas extras..." className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Salvar Empréstimo</Button>
        </DialogFooter>
      </form>
    );
  };

  const renderDetailsTab = () => {
      if (!viewingLoan) return (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Info className="h-10 w-10 mb-2 opacity-20" />
              <p>Selecione um empréstimo na lista para ver os detalhes.</p>
              <Button variant="link" onClick={() => setActiveTab('lista')}>Voltar para a lista</Button>
          </div>
      );

      const totalWithJuros = calculateTotalWithInterest(viewingLoan.amount, viewingLoan.interestRate, viewingLoan.installments, viewingLoan.interestType);
      const installmentValue = totalWithJuros / viewingLoan.installments;
      const interestAmount = totalWithJuros - viewingLoan.amount;
      const remainingValue = totalWithJuros - (installmentValue * viewingLoan.paidInstallments);
      const progress = (viewingLoan.paidInstallments / viewingLoan.installments) * 100;

      // Generate simulation list
      const installmentsList = Array.from({ length: viewingLoan.installments }, (_, i) => {
          const dueDate = addMonths(parseISO(viewingLoan.startDate), i);
          const isPaid = i < viewingLoan.paidInstallments;
          return { number: i + 1, dueDate, isPaid };
      });

      return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => setActiveTab('lista')}>
                      <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                      <h2 className="text-2xl font-bold">{viewingLoan.description}</h2>
                      <p className="text-muted-foreground">{viewingLoan.lender}</p>
                  </div>
                  <div className="ml-auto flex gap-2">
                     <Button variant="outline" size="sm" onClick={() => openEditDialog(viewingLoan)}>
                        Editar
                     </Button>
                  </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                  <Card className="bg-primary/5 border-primary/20">
                      <CardHeader className="pb-2">
                          <CardTitle className="text-xs uppercase text-muted-foreground tracking-wider">Total a Pagar</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <div className="text-xl font-bold">R$ {totalWithJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="pb-2">
                          <CardTitle className="text-xs uppercase text-muted-foreground tracking-wider">Principal</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <div className="text-xl font-semibold">R$ {viewingLoan.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="pb-2">
                          <CardTitle className="text-xs uppercase text-muted-foreground tracking-wider">Total Juros</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <div className="text-xl font-semibold text-red-500">R$ {interestAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      </CardContent>
                  </Card>
                   <Card className="bg-green-50/50 border-green-100">
                      <CardHeader className="pb-2">
                          <CardTitle className="text-xs uppercase text-muted-foreground tracking-wider">Valor Pago</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <div className="text-xl font-bold text-green-600">R$ {(totalWithJuros - remainingValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      </CardContent>
                  </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-6">
                      <Card>
                          <CardHeader>
                              <CardTitle>Cronograma de Pagamentos</CardTitle>
                              <CardDescription>Simulação baseada na data de início e parcelas.</CardDescription>
                          </CardHeader>
                          <CardContent>
                               <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead className="w-16">Parcela</TableHead>
                                          <TableHead>Vencimento Est.</TableHead>
                                          <TableHead>Valor</TableHead>
                                          <TableHead className="text-right">Status</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {installmentsList.map((item) => (
                                          <TableRow key={item.number} className={cn(item.isPaid && "bg-muted/50")}>
                                              <TableCell className="font-medium">#{item.number}</TableCell>
                                              <TableCell className="flex items-center gap-2">
                                                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                  {format(item.dueDate, 'dd/MM/yyyy')}
                                              </TableCell>
                                              <TableCell>R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                              <TableCell className="text-right">
                                                  {item.isPaid ? (
                                                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Pago</Badge>
                                                  ) : (
                                                      <Badge variant="outline" className="text-muted-foreground">Pendente</Badge>
                                                  )}
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </CardContent>
                      </Card>
                  </div>

                  <div className="space-y-6">
                       <Card>
                          <CardHeader>
                              <CardTitle>Resumo Geral</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                               <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Progresso</span>
                                      <span className="font-medium">{viewingLoan.paidInstallments} de {viewingLoan.installments}</span>
                                  </div>
                                  <Progress value={progress} className="h-3" />
                               </div>
                               
                               <div className="pt-4 space-y-3 border-t">
                                   <div className="flex justify-between text-sm">
                                       <span className="text-muted-foreground">Taxa de Juros</span>
                                       <span className="font-semibold">{viewingLoan.interestRate}% am</span>
                                   </div>
                                    <div className="flex justify-between text-sm">
                                       <span className="text-muted-foreground">Tipo</span>
                                       <span className="font-semibold">{viewingLoan.interestType}</span>
                                   </div>
                                   <div className="flex justify-between text-sm">
                                       <span className="text-muted-foreground">Data Inicial</span>
                                       <span className="font-semibold">{format(parseISO(viewingLoan.startDate), 'dd/MM/yyyy')}</span>
                                   </div>
                               </div>

                               <div className="pt-4 border-t space-y-2">
                                  <Label className="text-xs uppercase text-muted-foreground">Ações Rápidas</Label>
                                  <div className="grid grid-cols-2 gap-2">
                                       <Button 
                                            variant="outline" 
                                            disabled={viewingLoan.paidInstallments === viewingLoan.installments}
                                            onClick={() => updatePaidInstallments(viewingLoan, 1)}
                                            className="w-full"
                                        >
                                            +1 Parcela
                                        </Button>
                                         <Button 
                                            variant="secondary" 
                                            disabled={viewingLoan.status === 'Quitado'}
                                            onClick={() => {
                                                if (!firestore) return;
                                                const loanDocRef = doc(firestore, 'loans', viewingLoan.id);
                                                updateDocumentNonBlocking(loanDocRef, { paidInstallments: viewingLoan.installments, status: 'Quitado' });
                                                setViewingLoan({...viewingLoan, paidInstallments: viewingLoan.installments, status: 'Quitado'});
                                            }}
                                            className="w-full"
                                        >
                                            Quitar Tudo
                                        </Button>
                                  </div>
                               </div>
                          </CardContent>
                       </Card>

                       {viewingLoan.details && (
                           <Card>
                               <CardHeader className="pb-2">
                                   <CardTitle className="text-sm font-semibold">Observações</CardTitle>
                               </CardHeader>
                               <CardContent>
                                   <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingLoan.details}</p>
                               </CardContent>
                           </Card>
                       )}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight font-headline">Empréstimos</h1>
           <p className="text-muted-foreground">Gerencie seus empréstimos, parcelas e juros.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => { setAddOpen(open); if(!open) setNewLoan(initialNewLoanState); }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Empréstimo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
             <DialogHeader>
                <DialogTitle>Adicionar Empréstimo</DialogTitle>
                <DialogDescription>Preencha os dados do empréstimo. O cálculo de juros é automático.</DialogDescription>
             </DialogHeader>
             {renderForm(false)}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card onClick={() => setActiveTab('lista')} className="cursor-pointer hover:bg-muted/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empréstimos</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold italic">R$ {stats.totalBorrowed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Valor total com juros</p>
          </CardContent>
        </Card>
        <Card onClick={() => setActiveTab('lista')} className="cursor-pointer hover:bg-muted/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restante a Pagar</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 italic">R$ {stats.totalRemaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Incluindo amortização</p>
          </CardContent>
        </Card>
        <Card onClick={() => setActiveTab('lista')} className="cursor-pointer hover:bg-muted/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empréstimos Ativos</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLoans}</div>
            <p className="text-xs text-muted-foreground">Contratos não quitados</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="lista">Todos os Empréstimos</TabsTrigger>
              <TabsTrigger value="detalhes" disabled={!viewingLoan}>Detalhes do Contrato</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="animate-in fade-in slide-in-from-left-4 duration-300">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div>
                        <CardTitle>Lista de Contratos</CardTitle>
                        <CardDescription>Clique em um empréstimo para ver o cronograma detalhado.</CardDescription>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="relative">
                           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                           <Input 
                              placeholder="Buscar..." 
                              className="pl-8 w-[200px]" 
                              value={searchTerm} 
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LoanStatus | 'all')}>
                           <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Status" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="Ativo">Ativos</SelectItem>
                              <SelectItem value="Quitado">Quitados</SelectItem>
                              <SelectItem value="Em Atraso">Atrasados</SelectItem>
                           </SelectContent>
                        </Select>
                        { (searchTerm || statusFilter !== 'all') && (
                            <Button variant="ghost" size="icon" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                     </div>
                  </div>
                </CardHeader>
                <CardContent>
                   {isLoading ? (
                       <div className="py-10 text-center text-muted-foreground animate-pulse">Carregando seus empréstimos...</div>
                   ) : filteredLoans.length === 0 ? (
                       <div className="py-10 text-center text-muted-foreground flex flex-col items-center gap-2">
                          <AlertCircle className="h-10 w-10 opacity-20" />
                          <p>Nenhum empréstimo encontrado.</p>
                       </div>
                   ) : (
                     <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Descrição / Credor</TableHead>
                              <TableHead>Parcelas / Progresso</TableHead>
                              <TableHead className="text-right">Total c/ Juros</TableHead>
                              <TableHead className="text-right">Restante</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredLoans.map(loan => {
                              const totalWithJuros = calculateTotalWithInterest(loan.amount, loan.interestRate, loan.installments, loan.interestType);
                              const installmentValue = totalWithJuros / loan.installments;
                              const paidValue = installmentValue * loan.paidInstallments;
                              const remaining = totalWithJuros - paidValue;
                              const progress = (loan.paidInstallments / loan.installments) * 100;

                              return (
                                <TableRow 
                                    key={loan.id} 
                                    className={cn(
                                        "cursor-pointer group transition-colors",
                                        loan.status === 'Quitado' && "opacity-60 grayscale-[0.5]"
                                    )}
                                    onClick={() => handleViewDetails(loan)}
                                >
                                  <TableCell>
                                    <div className="font-semibold group-hover:text-primary transition-colors">{loan.description}</div>
                                    <div className="text-xs text-muted-foreground">{loan.lender}</div>
                                    <div className="mt-1">{renderStatusBadge(loan.status)}</div>
                                  </TableCell>
                                  <TableCell className="min-w-[150px]">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                       <span>{loan.paidInstallments} de {loan.installments} pagas</span>
                                       <span>{Math.round(progress)}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                     R$ {totalWithJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-red-600">
                                     R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleViewDetails(loan)}>
                                            <ChevronRight className="mr-2 h-4 w-4" /> Ver Detalhes
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openEditDialog(loan)}>Editar</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive" onClick={() => openDeleteAlert(loan)}>
                                          Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                     </div>
                   )}
                </CardContent>
              </Card>
          </TabsContent>

          <TabsContent value="detalhes">
              <Card>
                  <CardContent className="pt-6">
                      {renderDetailsTab()}
                  </CardContent>
              </Card>
          </TabsContent>
      </Tabs>

      <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Empréstimo</DialogTitle>
            <DialogDescription>Altere as condições do contrato.</DialogDescription>
          </DialogHeader>
          {renderForm(true)}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O histórico deste empréstimo será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLoan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
