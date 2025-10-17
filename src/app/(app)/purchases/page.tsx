
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
import { MoreHorizontal, PlusCircle, ShoppingCart, Upload, Loader2, Paperclip, MessageSquare } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useUser, useFirebaseApp } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const initialNewPurchaseState: Omit<Purchase, 'id' | 'userId'> = {
    description: '',
    recipient: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'Dinheiro',
    installments: 1,
    photoUrl: '',
    observations: '',
};


export default function PurchasesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const firebaseApp = useFirebaseApp();
  const storage = getStorage(firebaseApp);
  const { toast } = useToast();
  
  const purchasesRef = useMemoFirebase(() => user ? query(collection(firestore, 'purchases'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: purchases, isLoading } = useCollection<Purchase>(purchasesRef);

  const [isAddOpen, setAddOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
    targetState(prev => prev ? ({ ...prev, [id]: value }) : null);
  };

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

    const purchaseToDeleteId = purchaseToDelete.id;
    const photoUrlToDelete = purchaseToDelete.photoUrl;

    try {
        // First, delete the photo from storage if it exists
        if (photoUrlToDelete) {
            const photoRef = ref(storage, photoUrlToDelete);
            await deleteObject(photoRef);
        }

        // Then, delete the Firestore document
        const purchaseDocRef = doc(firestore, 'purchases', purchaseToDeleteId);
        await deleteDocumentNonBlocking(purchaseDocRef);

        toast({
            title: "Sucesso!",
            description: "A compra foi excluída permanentemente.",
        });

    } catch (error: any) {
        // Ignore "object not found" errors for the photo, but log others
        if (error.code !== 'storage/object-not-found') {
            console.error("Error during purchase deletion:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Excluir",
                description: "Não foi possível remover a compra. Tente novamente.",
            });
        } else {
            // If the photo was not found, the document might still have been deleted.
            // Or maybe the doc was deleted but not the photo. We proceed assuming the doc is gone.
             const purchaseDocRef = doc(firestore, 'purchases', purchaseToDeleteId);
             await deleteDocumentNonBlocking(purchaseDocRef);
        }
    } finally {
        setDeleteAlertOpen(false);
        setPurchaseToDelete(null);
    }
}

  const openEditDialog = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setEditOpen(true);
  }
  
  const openDeleteAlert = (purchase: Purchase) => {
    setPurchaseToDelete(purchase);
    setDeleteAlertOpen(true);
  }

  const deletePreviousPhoto = async (photoUrl: string) => {
      if (!photoUrl) return;
      try {
        const photoRef = ref(storage, photoUrl);
        await deleteObject(photoRef);
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
          console.error("Could not delete previous photo:", error);
        }
      }
  }


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
           const storageRef = ref(storage, `purchase-photos/${user.uid}/${Date.now()}_${file.name}`);
           try {
              // If editing, delete previous photo first
              if (isEditOpen && selectedPurchase?.photoUrl) {
                await deletePreviousPhoto(selectedPurchase.photoUrl);
              } else if (isAddOpen && newPurchase.photoUrl) {
                 await deletePreviousPhoto(newPurchase.photoUrl);
              }

              await uploadString(storageRef, dataUrl, 'data_url');
              const downloadURL = await getDownloadURL(storageRef);
              
              const targetState = isEditOpen ? setSelectedPurchase : setNewPurchase;
              targetState(prev => prev ? ({ ...prev, photoUrl: downloadURL }) : null);

              toast({
                  title: 'Sucesso!',
                  description: 'Sua foto foi enviada.',
              });
           } catch(error) {
              console.error("Upload failed", error);
              toast({
                  variant: "destructive",
                  title: "Erro no Upload",
                  description: "Não foi possível salvar a foto da compra.",
              });
           } finally {
              setIsUploading(false);
              setUploadOpen(false);
           }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openImageViewer = (url: string) => {
    setSelectedImage(url);
    setImageViewerOpen(true);
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
            <Label htmlFor="recipient" className="text-right">
              Pagar para
            </Label>
            <Input id="recipient" value={currentData.recipient || ''} onChange={handleInputChange} placeholder="Ex: Loja de Música" className="col-span-3" />
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
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="observations" className="text-right pt-2">
              Observações
            </Label>
            <Textarea id="observations" value={currentData.observations || ''} onChange={handleInputChange} placeholder="Notas adicionais sobre a compra" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Foto
            </Label>
            <div className="col-span-3 flex items-center gap-4">
              {currentData.photoUrl ? (
                <div className="relative h-16 w-16">
                  <Image src={currentData.photoUrl} alt="Prévia da compra" layout="fill" objectFit="cover" className="rounded-md" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-muted text-muted-foreground">
                  <ShoppingCart className="h-8 w-8" />
                </div>
              )}
               <Button type="button" variant="outline" onClick={() => setUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  {currentData.photoUrl ? 'Alterar Foto' : 'Adicionar Foto'}
                </Button>
            </div>
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
        <Dialog open={isAddOpen} onOpenChange={(isOpen) => { setAddOpen(isOpen); if (!isOpen) setNewPurchase(initialNewPurchaseState); }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Adicionar Compra
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
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

       <Dialog open={isEditOpen} onOpenChange={(isOpen) => { setEditOpen(isOpen); if (!isOpen) setSelectedPurchase(null); }}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Compra</DialogTitle>
              <DialogDescription>
                Atualize os detalhes da compra. Clique em salvar para confirmar.
              </DialogDescription>
            </DialogHeader>
            {renderForm(true)}
        </DialogContent>
       </Dialog>

        <Dialog open={isUploadOpen} onOpenChange={setUploadOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Fazer Upload da Imagem</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg">
                     <Upload className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground text-center">Arraste e solte um arquivo ou clique abaixo</p>
                    <Button asChild variant="outline">
                        <label htmlFor="file-upload">
                            Selecionar Arquivo
                            <input id="file-upload" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} disabled={isUploading} />
                        </label>
                    </Button>
                    {isUploading && (
                        <div className='flex items-center gap-2 mt-4'>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <p className='text-sm text-muted-foreground'>Enviando...</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={isImageViewerOpen} onOpenChange={setImageViewerOpen}>
          <DialogContent className="max-w-3xl">
            {selectedImage && <Image src={selectedImage} alt="Visualização da Compra" width={1024} height={768} className="rounded-md object-contain" />}
          </DialogContent>
        </Dialog>
       
       <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro desta compra e sua foto associada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPurchaseToDelete(null)}>Cancelar</AlertDialogCancel>
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
                  <TableHead>Foto</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead className="hidden md:table-cell">Pagamento</TableHead>
                  <TableHead className="hidden lg:table-cell">Observações</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases?.map((purchase) => {
                  const hasInstallments = purchase.installments && purchase.installments > 1;
                  const installmentValue = hasInstallments ? purchase.amount / purchase.installments : 0;

                  return (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        {purchase.photoUrl ? (
                          <div className="w-12 h-12 relative cursor-pointer" onClick={() => openImageViewer(purchase.photoUrl)}>
                             <Image src={purchase.photoUrl} alt={purchase.description} layout="fill" objectFit="cover" className="rounded-md" />
                          </div>
                        ) : (
                           <div className="w-12 h-12 flex items-center justify-center rounded-md bg-muted text-muted-foreground">
                             <Paperclip className="w-6 h-6" />
                           </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{purchase.description}</div>
                         <div className="text-sm text-muted-foreground">{purchase.recipient}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{format(parseISO(purchase.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell className="hidden md:table-cell">{purchase.paymentMethod}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {purchase.observations && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <MessageSquare className="w-5 h-5 text-muted-foreground cursor-pointer" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{purchase.observations}</p>
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

    