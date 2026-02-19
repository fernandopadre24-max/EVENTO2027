
'use client';

import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
import { MoreHorizontal, PlusCircle, CalendarIcon, ChevronDown, Search, X, FileDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Event, EventStatus, PaymentStatus, Client, Artist } from '@/lib/types';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';

const statusColors: Record<EventStatus, string> = {
  Pendente: 'bg-yellow-400/20 text-yellow-600 border-yellow-400/30',
  Confirmado: 'bg-blue-400/20 text-blue-600 border-blue-400/30',
  Concluído: 'bg-green-400/20 text-green-600 border-green-400/30',
  Cancelado: 'bg-red-400/20 text-red-600 border-red-400/30',
};

const initialNewEventState = {
  clientId: '',
  date: new Date(),
  time: '',
  local: '',
  artistIds: [] as string[],
  payment: 0,
};

export default function EventsPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const eventsRef = useMemoFirebase(() => user ? query(collection(firestore, 'events'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: events, isLoading: isLoadingEvents } = useCollection<Event>(eventsRef);

  const clientsRef = useMemoFirebase(() => user ? query(collection(firestore, 'clients'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsRef);

  const artistsRef = useMemoFirebase(() => user ? query(collection(firestore, 'artists'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: artists } = useCollection<Artist>(artistsRef);

  const [isAddOpen, setAddOpen] = useState(false);
  const [newEvent, setNewEvent] = useState(initialNewEventState);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const filteredEvents = useMemo(() => {
    return events
      ?.filter(event => {
        const client = clients?.find(c => c.id === event.clientId);
        const searchLower = searchTerm.toLowerCase();
        const clientMatch = client?.name.toLowerCase().includes(searchLower);
        const localMatch = event.local.toLowerCase().includes(searchLower);
        return clientMatch || localMatch;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateB.getTime() - dateA.getTime();
      }) || [];
  }, [events, clients, searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewEvent(prev => ({ ...prev, [id]: id === 'payment' ? Number(value) : value }));
  };
  
  const handleSelectChange = (id: string) => (value: string) => {
    setNewEvent(prev => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if(date) setNewEvent(prev => ({ ...prev, date }));
  };

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !user || !newEvent.clientId) return;
    const eventsCollectionRef = collection(firestore, 'events');
    const newEventData = {
      ...newEvent,
      date: format(newEvent.date, 'yyyy-MM-dd'),
      status: 'Pendente' as EventStatus,
      paymentStatus: 'Não Pago' as PaymentStatus,
      userId: user.uid,
      artistIds: [], // Placeholder
    };
    addDocumentNonBlocking(eventsCollectionRef, newEventData);
    setAddOpen(false);
    setNewEvent(initialNewEventState);
  };

  const updateEventStatus = (eventId: string, status: EventStatus) => {
    if (!firestore) return;
    const eventDocRef = doc(firestore, 'events', eventId);
    updateDocumentNonBlocking(eventDocRef, { status });
  };

  const handleDeleteEvent = () => {
    if (!firestore || !eventToDelete) return;
    const eventDocRef = doc(firestore, 'events', eventToDelete.id);
    deleteDocumentNonBlocking(eventDocRef);
    setDeleteAlertOpen(false);
    setEventToDelete(null);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Lista de Eventos', 14, 16);
    const tableColumn = ["Cliente", "Data", "Hora", "Local", "Artistas", "Valor"];
    const tableRows: any[] = [];
    filteredEvents.forEach(event => {
        const client = clients?.find(c => c.id === event.clientId);
        const eventArtists = artists?.filter(a => event.artistIds.includes(a.id));
        const eventData = [
            client?.name || 'N/A',
            format(parseISO(event.date), 'dd/MM/yyyy'),
            event.time,
            event.local,
            eventArtists?.map(a => a.name).join(', ') || 'N/A',
            `R$ ${event.payment.toLocaleString('pt-BR')}`
        ];
        tableRows.push(eventData);
    });
    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    });
    doc.save('eventos.pdf');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Eventos</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <FileDown className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Evento</DialogTitle>
                <DialogDescription>Preencha os detalhes do novo evento.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="clientId" className="text-right">Cliente</Label>
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
                    <Label htmlFor="date" className="text-right">Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("col-span-3 justify-start text-left font-normal", !newEvent.date && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newEvent.date ? format(newEvent.date, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={newEvent.date} onSelect={handleDateChange} locale={ptBR} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="time" className="text-right">Hora</Label>
                    <Input id="time" type="time" value={newEvent.time} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="local" className="text-right">Local</Label>
                    <Input id="local" value={newEvent.local} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="payment" className="text-right">Valor</Label>
                    <Input id="payment" type="number" value={newEvent.payment || ''} onChange={handleInputChange} className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
          <CardDescription>Lista de eventos agendados.</CardDescription>
        </CardHeader>
        <CardContent>
          {(isLoadingEvents || isLoadingClients) && <p>Carregando...</p>}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="sr-only">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const client = clients?.find(c => c.id === event.clientId);
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{client?.name}</TableCell>
                      <TableCell>{format(parseISO(event.date), 'dd/MM/yy')} às {event.time}</TableCell>
                      <TableCell>{event.local}</TableCell>
                      <TableCell>R${event.payment.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('font-semibold', statusColors[event.status])}>
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateEventStatus(event.id, 'Confirmado')}>Confirmar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateEventStatus(event.id, 'Concluído')}>Concluir</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => { setEventToDelete(event); setDeleteAlertOpen(true); }}>Excluir</DropdownMenuItem>
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
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
