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
import { artists } from '@/lib/data';

export default function ArtistsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Artistas
        </h1>
        <Button>
          <PlusCircle className="w-4 h-4 mr-2" />
          Adicionar Novo Artista
        </Button>
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
