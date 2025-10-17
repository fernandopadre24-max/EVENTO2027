
'use client';

import { useState } from 'react';
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
import { MoreHorizontal, PlusCircle, ShoppingCart } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Purchase, PaymentMethod } from '@/lib/types';
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
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';


const initialNewPurchaseState: Omit<Purchase, 'id' | 'userId'> = {
    description: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'Dinheiro',
    installments: 1
};


export default function PurchasesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const purchasesRef = useMemoFirebase(() => user ? query(collection(firestore, 'purchases'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: purchases, isLoading } = useCollection<Purchase>(purchasesRef);

  const [isAddOpen, setAddOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const [newPurchase, setNewPurchase] = useState<Omit<Purchase, 'id' | 'userId'>>(initialNewPurchaseState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const targetState = isEditOpen ? setSelectedPurchase : setNewPurchase;
    targetState(prev => prev ? ({ ...prev, [id]: id === 'amount' || id === 'installments' ? Number(value) : value }) : null);
  };
  
  const handleSelectChange = (id: string) => (value: string) => {
    const targetState = isEditOpen ? setSelectedPurchase : setNewPurchase;
    targetState(prev => prev ? ({ ...prev, [id]: value }) : null);
  };

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !user) return;
    const purchasesCollectionRef = collection(firestore, 'purchases');
    
    let dataToAdd: any = { ...newPurchase, userId: user.uid };

    addDocumentNonBlocking(purchasesCollectionRef, dataToAdd);
    setAddOpen(false);
    setNewPurchase(initialNewPurchaseState);
  };
  
  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !selectedPurchase) return;
    const purchaseDocRef = doc(firestore, 'purchases', selectedPurchase.id);
    const { id, ...purchaseData } = selectedPurchase;

    updateDocumentNonBlocking(purchaseDocRef, purchaseData);
    setEditOpen(false);
    setSelectedPurchase(null);
  }

  const handleDeletePurchase = () => {
    if (!firestore || !selectedPurchase) return;
    const purchaseDocRef = doc(firestore, 'purchases', selectedPurchase.id);
    deleteDocumentNonBlocking(purchaseDocRef);
    setDeleteAlertOpen(false);
    setSelectedPurchase(null);
  }

  const openEditDialog = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setEditOpen(true);
  }
  
  const openDeleteAlert = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setDeleteAlertOpen(true);
  }
  
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
            <Input id="description" value={currentData.description} onChange={handleInputChange} placeholder="Ex: Equipamento de som" className="col-span-3" />
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
        </div>
        <DialogFooter>
          <Button type="submit">Salvar Compra</Button>
        </DialogFooter>
      </form>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Compras
        </h1>
        <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Adicionar Compra
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Compra</DialogTitle>
              <DialogDescription>
                Preencha os detalhes da nova compra aqui.
              </DialogDescription>
            </DialogHeader>
            {renderForm(false)}
          </DialogContent>
        </Dialog>
      </div>

       <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Editar Compra</DialogTitle>
              <DialogDescription>
                Atualize os detalhes da compra. Clique em salvar para confirmar.
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
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro desta compra.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePurchase}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Compras</CardTitle>
          <CardDescription>
            Gerencie todas as suas compras e despesas de equipamentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Carregando compras...</p>}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead className="hidden md:table-cell">Pagamento</TableHead>
                  <TableHead className="hidden lg:table-cell">Parcelas</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases?.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <div className="font-medium">{purchase.description}</div>
                       <div className="text-sm text-muted-foreground md:hidden">{purchase.paymentMethod}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{format(parseISO(purchase.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell className="hidden md:table-cell">{purchase.paymentMethod}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {purchase.installments && purchase.installments > 1 ? `${purchase.installments}x` : '1x'}
                    </TableCell>
                    <TableCell className="text-right">R${purchase.amount.toLocaleString('pt-BR')}</TableCell>
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
                          <DropdownMenuItem className="text-destructive" onClick={() => openDeleteAlert(purchase)}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

    
}

    