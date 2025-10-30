
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
import { MoreHorizontal, PlusCircle, MessageSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Purchase, PaymentMethod, Artist, PurchaseStatus } from '@/lib/types';
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
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


const purchaseStatusColors: Record<PurchaseStatus, string> = {
  Pago: 'bg-green-400/20 text-green-600 border-green-400/30',
  'Não Pago': 'bg-gray-400/20 text-gray-600 border-gray-400/30',
};

const initialNewPurchaseState: Omit<Purchase, 'id' | 'userId'> = {
    description: '',
    recipient: '',
    artistId: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'Dinheiro',
    installments: 1,
    details: '',
    status: 'Não Pago',
};


export default function PurchasesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const purchasesRef = useMemoFirebase(() => user ? query(collection(firestore, 'purchases'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: purchases, isLoading: isLoadingPurchases } = useCollection<Purchase>(purchasesRef);

  const artistsRef = useMemoFirebase(() => user ? query(collection(firestore, 'artists'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: artists, isLoading: isLoadingArtists } = useCollection<Artist>(artistsRef);


  const [isAddOpen, setAddOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);

  const [newPurchase, setNewPurchase] = useState<Omit<Purchase, 'id' | 'userId'>>(initialNewPurchaseState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    const targetState = isEditOpen ? setSelectedPurchase : setNewPurchase;
    targetState(prev => prev ? ({ ...prev, [id]: id === 'amount' || id === 'installments' ? Number(value) : value }) : null);
  };
  
  const handleSelectChange = (id: string) => (value: string) => {
    const targetState = isEditOpen ? setSelectedPurchase : setNewPurchase;
    const finalValue = value === 'none' ? '' : value;
    targetState(prev => prev ? ({ ...prev, [id]: finalValue }) : null);
  };
  
  const handleStatusToggle = (checked: boolean) => {
    const targetState = isEditOpen ? setSelectedPurchase : setNewPurchase;
    targetState(prev => prev ? ({ ...prev, status: checked ? 'Pago' : 'Não Pago' }) : null);
  }

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !user) return;
    const purchasesCollectionRef = collection(firestore, 'purchases');
    
    let dataToAdd: any = { ...newPurchase, userId: user.uid };
    if (!dataToAdd.installments || dataToAdd.installments < 1) {
        dataToAdd.installments = 1;
    }

    addDocumentNonBlocking(purchasesCollectionRef, dataToAdd);
    setAddOpen(false);
    setNewPurchase(initialNewPurchaseState);
  };
  
  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !selectedPurchase) return;
    const purchaseDocRef = doc(firestore, 'purchases', selectedPurchase.id);
    const { id, ...purchaseData } = selectedPurchase;

     if (!purchaseData.installments || purchaseData.installments < 1) {
        purchaseData.installments = 1;
    }

    updateDocumentNonBlocking(purchaseDocRef, purchaseData);
    setEditOpen(false);
    setSelectedPurchase(null);
  }

  const handleDeletePurchase = async () => {
    if (!firestore || !purchaseToDelete) return;
    const purchaseDocRef = doc(firestore, 'purchases', purchaseToDelete.id);
    await deleteDocumentNonBlocking(purchaseDocRef);
    setDeleteAlertOpen(false);
    setPurchaseToDelete(null);
}

  const openEditDialog = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setEditOpen(true);
  }
  
  const openDeleteAlert = (purchase: Purchase) => {
    setPurchaseToDelete(purchase);
    setDeleteAlertOpen(true);
  }
  
  const togglePurchaseStatus = (purchase: Purchase) => {
    if (!firestore) return;
    const purchaseDocRef = doc(firestore, 'purchases', purchase.id);
    const newStatus = purchase.status === 'Pago' ? 'Não Pago' : 'Pago';
    updateDocumentNonBlocking(purchaseDocRef, { status: newStatus });
  };
  
    const { totalSpent, numberOfPurchases } = useMemo(() => {
        if (!purchases) return { totalSpent: 0, numberOfPurchases: 0 };
        const total = purchases.reduce((sum, p) => sum + p.amount, 0);
        return { totalSpent: total, numberOfPurchases: purchases.length };
    }, [purchases]);

    const isLoading = isLoadingPurchases || isLoadingArtists;

  const renderForm = (isEditing: boolean) => {
    const currentData = isEditing ? selectedPurchase : newPurchase;
    const handleSubmit = isEditing ? handleEditSubmit : handleAddSubmit;

    if (!currentData) return null;
    
    return (
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descrição
            </Label>
            <Input id="description" value={currentData.description} onChange={handleInputChange} placeholder="Ex: Pagamento de cachê" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="artistId" className="text-right">
                Artista
              </Label>
               <Select value={currentData.artistId || 'none'} onValueChange={handleSelectChange('artistId')}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um artista (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {artists?.map(artist => (
                    <SelectItem key={artist.id} value={artist.id}>{artist.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="recipient" className="text-right">
              Pagar para
            </Label>
            <Input id="recipient" value={currentData.recipient || ''} onChange={handleInputChange} placeholder="Ex: Loja de Música (se não for artista)" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Valor (R$)
            </Label>
            <Input id="amount" type="number" value={currentData.amount || ''} onChange={handleInputChange} placeholder="500" className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Data
            </Label>
            <Input id="date" type="date" value={currentData.date} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentMethod" className="text-right">
              Pagamento
            </Label>
             <Select value={currentData.paymentMethod} onValueChange={handleSelectChange('paymentMethod') as (value: PaymentMethod) => void}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="installments" className="text-right">
              Parcelas
            </Label>
            <Input id="installments" type="number" value={currentData.installments || 1} onChange={handleInputChange} placeholder="1" className="col-span-3" min="1" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Pago
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Switch
                id="status"
                checked={currentData.status === 'Pago'}
                onCheckedChange={handleStatusToggle}
              />
              <span className="text-sm text-muted-foreground">{currentData.status}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="details" className="text-right pt-2">
              Detalhes
            </Label>
            <Textarea id="details" value={currentData.details || ''} onChange={handleInputChange} placeholder="Notas adicionais sobre a compra" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Salvar Pagamento</Button>
        </DialogFooter>
      </form>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Pagar
        </h1>
        <Dialog open={isAddOpen} onOpenChange={(isOpen) => { setAddOpen(isOpen); if (!isOpen) setNewPurchase(initialNewPurchaseState); }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Adicionar Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Pagamento</DialogTitle>
              <DialogDescription>
                Preencha os detalhes do novo pagamento aqui.
              </DialogDescription>
            </DialogHeader>
            {renderForm(false)}
          </DialogContent>
        </Dialog>
      </div>

       <Dialog open={isEditOpen} onOpenChange={(isOpen) => { setEditOpen(isOpen); if (!isOpen) setSelectedPurchase(null); }}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Pagamento</DialogTitle>
              <DialogDescription>
                Atualize os detalhes do pagamento. Clique em salvar para confirmar.
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
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro deste pagamento.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPurchaseToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePurchase}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Total Gasto</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold text-red-600">R${totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Número de Pagamentos</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{numberOfPurchases}</p>
                </CardContent>
            </Card>
        </div>


      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>
            Gerencie todas as suas compras e despesas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Carregando pagamentos...</p>}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead className="hidden md:table-cell">Detalhes</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases?.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map((purchase) => {
                  const hasInstallments = purchase.installments && purchase.installments > 1;
                  const installmentValue = hasInstallments ? purchase.amount / purchase.installments : 0;
                  const artistPaid = artists?.find(a => a.id === purchase.artistId);

                  return (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        <div className="font-medium">{purchase.description}</div>
                         <div className="text-sm text-muted-foreground">{artistPaid?.name || purchase.recipient}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{format(parseISO(purchase.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>
                         <Switch
                              checked={purchase.status === 'Pago'}
                              onCheckedChange={() => togglePurchaseStatus(purchase)}
                              aria-label="Status do pagamento"
                          />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {purchase.details && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <MessageSquare className="w-5 h-5 text-muted-foreground cursor-pointer" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{purchase.details}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>R${purchase.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        {hasInstallments && (
                            <div className="text-xs text-muted-foreground">
                                {purchase.installments}x de R${installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        )}
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
                            <DropdownMenuItem onClick={() => openEditDialog(purchase)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => togglePurchaseStatus(purchase)}>
                              {purchase.status === 'Pago' ? 'Marcar como Não Pago' : 'Marcar como Pago'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => openDeleteAlert(purchase)}>
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
