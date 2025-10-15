
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
import { MoreHorizontal, PlusCircle, CalendarIcon, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Event, EventStatus, PaymentStatus, Client, Artist } from '@/lib/types';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';


const statusColors: Record<EventStatus, string> = {
  Pendente: 'bg-yellow-400/20 text-yellow-600 border-yellow-400/30',
  Confirmado: 'bg-blue-400/20 text-blue-600 border-blue-400/30',
  Concluído: 'bg-green-400/20 text-green-600 border-green-400/30',
  Cancelado: 'bg-red-400/20 text-red-600 border-red-400/30',
};

const paymentStatusColors: Record<PaymentStatus, string> = {
  Pago: 'bg-green-400/20 text-green-600 border-green-400/30',
  'Não Pago': 'bg-gray-400/20 text-gray-600 border-gray-400/30',
};

export default function EventsPage() {
  const firestore = useFirestore();
  const eventsRef = useMemoFirebase(() => collection(firestore, 'events'), [firestore]);
  const { data: events, isLoading: isLoadingEvents } = useCollection<Event>(eventsRef);

  const clientsRef = useMemoFirebase(() => collection(firestore, 'clients'), [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsRef);

  const artistsRef = useMemoFirebase(() => collection(firestore, 'artists'), [firestore]);
  const { data: artists, isLoading: isLoadingArtists } = useCollection<Artist>(artistsRef);

  const [open, setOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    clientId: '',
    date: new Date(),
    time: '',
    artistIds: [] as string[],
    payment: 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewEvent(prev => ({ ...prev, [id]: id === 'payment' ? Number(value) : value }));
  };
  
  const handleSelectChange = (id: string) => (value: string) => {
    setNewEvent(prev => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if(date) {
      setNewEvent(prev => ({ ...prev, date }));
    }
  };

  const handleArtistSelection = (artistId: string) => {
    setNewEvent(prev => {
      const newArtistIds = prev.artistIds.includes(artistId)
        ? prev.artistIds.filter(id => id !== artistId)
        : [...prev.artistIds, artistId];
      return { ...prev, artistIds: newArtistIds };
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventsRef) return;
    const newEventData = {
      ...newEvent,
      date: format(newEvent.date, 'yyyy-MM-dd'),
      status: 'Pendente' as EventStatus,
      paymentStatus: 'Não Pago' as PaymentStatus,
    };
    addDocumentNonBlocking(eventsRef, newEventData);
    setOpen(false);
    setNewEvent({
      title: '',
      clientId: '',
      date: new Date(),
      time: '',
      artistIds: [],
      payment: 0,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Eventos
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Adicionar Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Evento</DialogTitle>
              <DialogDescription>
                Preencha os detalhes do novo evento.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Título
                  </Label>
                  <Input id="title" value={newEvent.title} onChange={handleInputChange} placeholder="Título do Evento" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="clientId" className="text-right">
                    Cliente
                  </Label>
                   <Select value={newEvent.clientId} onValueChange={handleSelectChange('clientId')}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                          !newEvent.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newEvent.date ? format(newEvent.date, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newEvent.date}
                        onSelect={handleDateChange}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">
                    Hora
                  </Label>
                  <Input id="time" type="time" value={newEvent.time} onChange={handleInputChange} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-start gap-4 pt-2">
                  <Label htmlFor="artistIds" className="text-right pt-2">
                    Artistas
                  </Label>
                  <Collapsible className="col-span-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full flex justify-between">
                        <span>
                          {newEvent.artistIds.length > 0 ? `${newEvent.artistIds.length} selecionado(s)`: "Selecione artistas"}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-2 mt-2 border rounded-md">
                      <div className="flex flex-col gap-2">
                        {artists?.map(artist => (
                          <div key={artist.id} className="flex items-center gap-2">
                            <Checkbox 
                              id={`artist-${artist.id}`} 
                              checked={newEvent.artistIds.includes(artist.id)}
                              onCheckedChange={() => handleArtistSelection(artist.id)}
                            />
                            <Label htmlFor={`artist-${artist.id}`}>{artist.name}</Label>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="payment" className="text-right">
                    Pagamento (R$)
                  </Label>
                  <Input id="payment" type="number" value={newEvent.payment || ''} onChange={handleInputChange} placeholder="2000" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar Evento</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Agenda de Eventos</CardTitle>
          <CardDescription>
            Uma lista de todos os seus eventos agendados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(isLoadingEvents || isLoadingClients || isLoadingArtists) && <p>Carregando eventos...</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data e Hora</TableHead>
                <TableHead>Artistas</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Status do Pagamento</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events?.map((event) => {
                const client = clients?.find(c => c.id === event.clientId);
                const eventArtists = artists?.filter(a => event.artistIds.includes(a.id));
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{client?.name}</TableCell>
                    <TableCell>
                      {format(parseISO(event.date), 'dd MMM, yyyy', { locale: ptBR })} às {event.time}
                    </TableCell>
                    <TableCell>{eventArtists?.map(a => a.name).join(', ')}</TableCell>
                    <TableCell>R${event.payment.toLocaleString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('font-semibold', statusColors[event.status])}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('font-semibold', paymentStatusColors[event.paymentStatus])}>
                        {event.paymentStatus}
                      </Badge>
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
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Marcar como Concluído</DropdownMenuItem>
                          <DropdownMenuItem>Marcar como Pago</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Cancelar Evento
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
