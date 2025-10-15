
'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { artists as initialArtists } from '@/lib/data';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [open, setOpen] = useState(false);
  const [newArtist, setNewArtist] = useState({ name: '', genre: '', performanceDetails: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewArtist(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newArtistData: Artist = {
      id: `art-${Date.now()}`,
      name: newArtist.name,
      genre: newArtist.genre,
      performanceDetails: newArtist.performanceDetails,
      profilePictureUrl: 'https://picsum.photos/seed/newartist/400/400',
      profilePictureHint: 'new artist',
    };
    setArtists(prev => [newArtistData, ...prev]);
    setOpen(false);
    setNewArtist({ name: '', genre: '', performanceDetails: '' });
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Artistas
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Adicionar Novo Artista
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Artista</DialogTitle>
              <DialogDescription>
                Preencha os detalhes do novo artista aqui. Clique em salvar quando terminar.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
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
              </div>
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {artists.map((artist) => (
          <Card key={artist.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{artist.name}</CardTitle>
                <CardDescription>{artist.performanceDetails}</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuItem>Editar</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="relative aspect-square">
                <Image
                  src={artist.profilePictureUrl}
                  alt={artist.name}
                  fill
                  className="object-cover rounded-md"
                  data-ai-hint={artist.profilePictureHint}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Badge variant="secondary">{artist.genre}</Badge>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
