
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
  DropdownMenuCheckboxItem,
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
import { Switch } from '@/components/ui/switch';
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
  withSound: false,
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
      artistIds: newEvent.artistIds,
      hasSound: newEvent.withSound,
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
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                <PlusCircle className="w-4 h-4 mr-2" />
                Adicionar Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-[#1a1f2e] text-slate-200 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Adicionar Novo Evento</DialogTitle>
                <DialogDescription className="text-slate-400">Preencha os detalhes do novo evento.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="clientId" className="text-right text-slate-300">Cliente</Label>
                  <Select value={newEvent.clientId} onValueChange={handleSelectChange('clientId')}>
                    <SelectTrigger className="col-span-2 bg-[#2d3748] border-slate-700 text-slate-200">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1f2e] border-slate-700 text-slate-200">
                      {clients?.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <Label className="text-right text-slate-300">Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("col-span-2 justify-start text-left font-normal bg-[#2d3748] border-slate-700 text-slate-200 hover:bg-[#323d4f] hover:text-white", !newEvent.date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newEvent.date ? format(newEvent.date, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : <span>Escolha uma data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#1a1f2e] border-slate-700">
                      <Calendar mode="single" selected={newEvent.date} onSelect={handleDateChange} locale={ptBR} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="time" className="text-right text-slate-300">Hora</Label>
                  <Input id="time" type="time" value={newEvent.time} onChange={handleInputChange} className="col-span-2 bg-[#2d3748] border-slate-700 text-slate-200" />
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="local" className="text-right text-slate-300">Local</Label>
                  <Input id="local" placeholder="Local do evento" value={newEvent.local} onChange={handleInputChange} className="col-span-2 bg-[#2d3748] border-slate-700 text-slate-200" />
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <Label className="text-right text-slate-300">Artistas</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="col-span-2 justify-between bg-[#2d3748] border-slate-700 text-slate-200 hover:bg-[#323d4f] hover:text-white font-normal">
                        {newEvent.artistIds.length > 0 
                          ? `${newEvent.artistIds.length} selecionado(s)` 
                          : "Selecione artistas"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-[#1a1f2e] border-slate-700 text-slate-200">
                      {artists?.map(artist => (
                        <DropdownMenuCheckboxItem
                          key={artist.id}
                          checked={newEvent.artistIds.includes(artist.id)}
                          onCheckedChange={(checked) => {
                            setNewEvent(prev => ({
                              ...prev,
                              artistIds: checked 
                                ? [...prev.artistIds, artist.id]
                                : prev.artistIds.filter(id => id !== artist.id)
                            }))
                          }}
                          className="hover:bg-slate-800 focus:bg-slate-800"
                        >
                          {artist.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <Label className="text-right text-slate-300">Com ou Sem Som</Label>
                  <div className="flex items-center gap-2 col-span-2">
                    <span className="text-xs text-slate-500">Sem Som</span>
                    <Switch 
                      checked={newEvent.withSound} 
                      onCheckedChange={(checked) => setNewEvent(prev => ({ ...prev, withSound: checked }))} 
                    />
                    <span className="text-xs text-slate-500">Com Som</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="payment" className="text-right text-slate-300">Pagamento (R$)</Label>
                  <Input id="payment" type="number" value={newEvent.payment || ''} onChange={handleInputChange} className="col-span-2 bg-[#2d3748] border-slate-700 text-slate-200" />
                </div>

                <DialogFooter className="pt-4">
                  <Button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white w-24">Salvar</Button>
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
