
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, PlusCircle, Instagram, Phone, Mail } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Artist } from '@/lib/types';
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
import { Textarea } from '@/components/ui/textarea';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';


export default function ArtistsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const artistsRef = useMemoFirebase(() => user ? query(collection(firestore, 'artists'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: artists, isLoading } = useCollection<Artist>(artistsRef);
  
  const [isAddOpen, setAddOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  const [newArtist, setNewArtist] = useState({ name: '', genre: '', performanceDetails: '', instagram: '', phone: '', email: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewArtist(prev => ({ ...prev, [id]: value }));
  };
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSelectedArtist(prev => prev ? ({ ...prev, [id]: value }) : null);
  };


  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !user) return;
    const artistsCollectionRef = collection(firestore, 'artists');
    addDocumentNonBlocking(artistsCollectionRef, { ...newArtist, userId: user.uid });
    setAddOpen(false);
    setNewArtist({ name: '', genre: '', performanceDetails: '', instagram: '', phone: '', email: '' });
  };
  
  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !selectedArtist) return;
    const artistDocRef = doc(firestore, 'artists', selectedArtist.id);
    const { id, ...artistData } = selectedArtist;
    updateDocumentNonBlocking(artistDocRef, artistData);
    setEditOpen(false);
    setSelectedArtist(null);
  }
  
  const openEditDialog = (artist: Artist) => {
    setSelectedArtist(artist);
    setEditOpen(true);
  }
  
  const openDeleteAlert = (artist: Artist) => {
    setSelectedArtist(artist);
    setDeleteAlertOpen(true);
  }

  const handleDeleteArtist = () => {
    if (!firestore || !selectedArtist) return;
    const artistDocRef = doc(firestore, 'artists', selectedArtist.id);
    deleteDocumentNonBlocking(artistDocRef);
    setDeleteAlertOpen(false);
    setSelectedArtist(null);
  }


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Artistas
        </h1>
        <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Adicionar Artista
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Artista</DialogTitle>
              <DialogDescription>
                Preencha os detalhes do novo artista aqui. Clique em salvar quando terminar.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input id="name" value={newArtist.name} onChange={handleInputChange} placeholder="Nome do Artista" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="genre" className="text-right">
                    Gênero
                  </Label>
                  <Input id="genre" value={newArtist.genre} onChange={handleInputChange} placeholder="Rock" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="performanceDetails" className="text-right">
                    Detalhes
                  </Label>
                  <Textarea id="performanceDetails" value={newArtist.performanceDetails} onChange={handleInputChange} placeholder="Detalhes da performance" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Telefone
                  </Label>
                  <Input id="phone" value={newArtist.phone} onChange={handleInputChange} placeholder="(99) 99999-9999" className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input id="email" type="email" value={newArtist.email} onChange={handleInputChange} placeholder="artista@email.com" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="instagram" className="text-right">
                    Instagram
                  </Label>
                  <Input id="instagram" value={newArtist.instagram} onChange={handleInputChange} placeholder="@artista" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

       <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Artista</DialogTitle>
              <DialogDescription>
                Atualize os detalhes do artista. Clique em salvar para confirmar.
              </DialogDescription>
            </DialogHeader>
            {selectedArtist && (
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input id="name" value={selectedArtist.name} onChange={handleEditInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="genre" className="text-right">
                    Gênero
                  </Label>
                  <Input id="genre" value={selectedArtist.genre} onChange={handleEditInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="performanceDetails" className="text-right">
                    Detalhes
                  </Label>
                  <Textarea id="performanceDetails" value={selectedArtist.performanceDetails} onChange={handleEditInputChange} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Telefone
                  </Label>
                  <Input id="phone" value={selectedArtist.phone || ''} onChange={handleEditInputChange} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input id="email" type="email" value={selectedArtist.email || ''} onChange={handleEditInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="instagram" className="text-right">
                    Instagram
                  </Label>
                  <Input id="instagram" value={selectedArtist.instagram || ''} onChange={handleEditInputChange} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
            )}
        </DialogContent>
       </Dialog>
       
       <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o artista
                e removerá seus dados de nossos servidores.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteArtist}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

       {isLoading && <p>Carregando artistas...</p>}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {artists?.map((artist) => (
          <Card key={artist.id} className="flex flex-col">
            <CardHeader className="flex-grow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{artist.name}</CardTitle>
                  <CardDescription>{artist.performanceDetails}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => openEditDialog(artist)}>Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => openDeleteAlert(artist)}>Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{artist.genre}</Badge>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                {artist.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{artist.phone}</span>
                  </div>
                )}
                {artist.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{artist.email}</span>
                  </div>
                )}
                {artist.instagram && (
                    <a
                      href={`https://instagram.com/${artist.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-primary"
                    >
                      <Instagram className="w-4 h-4" />
                      {artist.instagram}
                    </a>
                  )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
