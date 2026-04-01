
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
import { MoreHorizontal, PlusCircle, CalendarIcon, ChevronDown, Search, X, FileDown, Clock } from 'lucide-react';
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
  Pendente: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  Confirmado: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Concluído: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  Cancelado: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const paymentStatusColors: Record<PaymentStatus, string> = {
  'Pago': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Não Pago': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
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
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
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
    
    if (editingEventId) {
      const eventDocRef = doc(firestore, 'events', editingEventId);
      updateDocumentNonBlocking(eventDocRef, newEventData);
    } else {
      addDocumentNonBlocking(eventsCollectionRef, { ...newEventData, status: 'Pendente' as EventStatus, paymentStatus: 'Não Pago' as PaymentStatus });
    }
    
    setAddOpen(false);
    setEditingEventId(null);
    setNewEvent(initialNewEventState);
  };

  const handleEditOpen = (event: Event) => {
    setEditingEventId(event.id);
    setNewEvent({
      clientId: event.clientId,
      date: parseISO(event.date),
      time: event.time,
      local: event.local,
      artistIds: event.artistIds,
      payment: event.payment,
      withSound: !!event.hasSound,
    });
    setAddOpen(true);
  };

  const updateEventStatus = (eventId: string, status: EventStatus) => {
    if (!firestore) return;
    const eventDocRef = doc(firestore, 'events', eventId);
    updateDocumentNonBlocking(eventDocRef, { status });
  };

  const updatePaymentStatus = (eventId: string, paymentStatus: PaymentStatus) => {
    if (!firestore) return;
    const eventDocRef = doc(firestore, 'events', eventId);
    updateDocumentNonBlocking(eventDocRef, { paymentStatus });
  };

  const toggleSoundStatus = (event: Event) => {
    if (!firestore) return;
    const eventDocRef = doc(firestore, 'events', event.id);
    updateDocumentNonBlocking(eventDocRef, { hasSound: !event.hasSound });
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
    const tableColumn = ["Cliente", "Data", "Hora", "Local", "Artistas", "Som", "Valor"];
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
            event.hasSound ? 'Com Som' : 'Sem Som',
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
              <Button className="bg-[#00e5ff] hover:bg-[#00b8cc] text-black font-semibold">
                <PlusCircle className="w-4 h-4 mr-2" />
                Adicionar Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-[#0f172a] text-slate-200 border-slate-800 p-8 shadow-2xl">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  {editingEventId ? 'Editar Evento' : 'Adicionar Novo Evento'}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-sm">
                  {editingEventId ? 'Altere os detalhes do evento selecionado.' : 'Preencha os detalhes do novo evento.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-6 pt-6">
                <div className="flex items-center">
                  <Label htmlFor="clientId" className="w-32 text-right pr-6 text-slate-300 text-sm">Cliente</Label>
                  <Select value={newEvent.clientId} onValueChange={handleSelectChange('clientId')}>
                    <SelectTrigger className="flex-1 bg-transparent border-slate-700 text-slate-200 h-10 ring-offset-transparent focus:ring-1 focus:ring-[#00e5ff] rounded-md transition-all">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f172a] border-slate-700 text-slate-200">
                      {clients?.map(client => (
                        <SelectItem key={client.id} value={client.id} className="hover:bg-slate-800 cursor-pointer">{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center">
                  <Label className="w-32 text-right pr-6 text-slate-300 text-sm">Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal bg-transparent border-slate-700 text-slate-200 hover:bg-[#1e293b] hover:text-white transition-all", !newEvent.date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4 text-[#00e5ff]" />
                        {newEvent.date ? format(newEvent.date, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : <span>Escolha uma data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#0f172a] border-slate-800 shadow-2xl shadow-black">
                      <Calendar mode="single" selected={newEvent.date} onSelect={handleDateChange} locale={ptBR} initialFocus className="bg-transparent text-slate-200" />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center">
                  <Label htmlFor="time" className="w-32 text-right pr-6 text-slate-300 text-sm">Hora</Label>
                  <div className="relative flex-1">
                    <Input id="time" type="time" value={newEvent.time} onChange={handleInputChange} className="w-full bg-transparent border-slate-700 text-slate-200 pr-10 focus-visible:ring-1 focus-visible:ring-[#00e5ff]" />
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center">
                  <Label htmlFor="local" className="w-32 text-right pr-6 text-slate-300 text-sm">Local</Label>
                  <Input id="local" placeholder="Local do evento" value={newEvent.local} onChange={handleInputChange} className="flex-1 bg-transparent border-slate-700 text-slate-200 focus-visible:ring-1 focus-visible:ring-[#00e5ff]" />
                </div>

                <div className="flex items-center">
                  <Label className="w-32 text-right pr-6 text-slate-300 text-sm">Artistas</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-between bg-transparent border-slate-700 text-slate-200 hover:bg-[#1e293b] hover:text-white font-normal transition-all">
                        {newEvent.artistIds.length > 0 
                          ? `${newEvent.artistIds.length} selecionado(s)` 
                          : "Selecione artistas"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-[#0f172a] border-slate-700 text-slate-200">
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

                <div className="flex items-center">
                  <div className="w-32 text-right pr-6">
                    <Label className="text-slate-300 text-sm">Com ou Sem Som</Label>
                  </div>
                  <div className="flex items-center gap-3 flex-1 h-10">
                    <span className="text-sm text-slate-300">Som</span>
                    <Switch 
                      checked={newEvent.withSound} 
                      onCheckedChange={(checked) => setNewEvent(prev => ({ ...prev, withSound: checked }))} 
                      className="data-[state=checked]:bg-[#00e5ff]"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <Label htmlFor="payment" className="w-32 text-right pr-6 text-slate-300 text-sm">Pagamento (R$)</Label>
                  <Input id="payment" type="number" value={newEvent.payment || ''} onChange={handleInputChange} className="flex-1 bg-transparent border-slate-700 text-slate-200 focus-visible:ring-1 focus-visible:ring-[#00e5ff]" />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" className="bg-[#b2ebf2] hover:bg-[#80deea] text-[#006064] font-bold px-8 transition-colors">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" onClick={() => { setEditingEventId(null); setNewEvent(initialNewEventState); setAddOpen(false); }} className={cn("hidden", isAddOpen && "block")}><X className="w-4 h-4" /></Button>
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
                <TableRow className="hover:bg-slate-800/10 border-slate-800 px-4">
                  <TableHead className="text-slate-400 font-medium">Cliente</TableHead>
                  <TableHead className="text-slate-400 font-medium whitespace-nowrap">Data e Hora</TableHead>
                  <TableHead className="text-slate-400 font-medium">Local</TableHead>
                  <TableHead className="text-slate-400 font-medium">Artistas</TableHead>
                  <TableHead className="text-slate-400 font-medium whitespace-nowrap">Com/Sem Som</TableHead>
                  <TableHead className="text-slate-400 font-medium">Pagamento</TableHead>
                  <TableHead className="text-slate-400 font-medium">Status</TableHead>
                  <TableHead className="text-slate-400 font-medium">Pagamento</TableHead>
                  <TableHead className="sr-only">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const client = clients?.find(c => c.id === event.clientId);
                  return (
                    <TableRow key={event.id} className="hover:bg-slate-800/20 border-slate-800 group px-4">
                      <TableCell className="font-medium text-slate-200 whitespace-nowrap">{client?.name || 'Evento Privado'}</TableCell>
                      <TableCell className="text-slate-400 whitespace-nowrap">
                        {format(parseISO(event.date), "d MMM, yyyy", { locale: ptBR })} às {event.time || '00:00'}
                      </TableCell>
                      <TableCell className="text-slate-400">{event.local}</TableCell>
                      <TableCell className="text-slate-400">
                        {artists?.filter(a => event.artistIds.includes(a.id)).map(a => a.name).join(', ') || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={event.hasSound} 
                            disabled 
                            className="scale-75 data-[state=checked]:bg-[#00e5ff] opacity-70"
                          />
                          <span className="text-xs text-slate-400">{event.hasSound ? 'Com Som' : 'Sem Som'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-200 font-medium whitespace-nowrap">R$ {event.payment.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('font-semibold rounded-full px-3 py-0.5 text-xs whitespace-nowrap', statusColors[event.status])}>
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('font-semibold rounded-full px-3 py-0.5 text-xs whitespace-nowrap', paymentStatusColors[event.paymentStatus])}>
                          {event.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="hover:bg-slate-800 transition-colors">
                              <MoreHorizontal className="w-4 h-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 bg-[#0f172a] border-slate-800 text-slate-200 shadow-2xl py-2">
                            <DropdownMenuLabel className="text-slate-400 px-4 py-2 text-xs font-bold uppercase tracking-wider">Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditOpen(event)} className="px-4 py-2 hover:bg-slate-800 cursor-pointer transition-colors">
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleSoundStatus(event)} className="px-4 py-2 hover:bg-slate-800 cursor-pointer transition-colors">
                              Marcar {event.hasSound ? 'Sem' : 'Com'} Som
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-800 my-1 mx-2" />
                            <DropdownMenuItem onClick={() => updateEventStatus(event.id, 'Confirmado')} className="px-4 py-2 hover:bg-slate-800 cursor-pointer transition-colors">
                              Marcar como Confirmado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateEventStatus(event.id, 'Concluído')} className="px-4 py-2 hover:bg-slate-800 cursor-pointer transition-colors">
                              Marcar como Concluído
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updatePaymentStatus(event.id, 'Pago')} className="px-4 py-2 hover:bg-slate-800 cursor-pointer transition-colors">
                              Marcar como Pago
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateEventStatus(event.id, 'Cancelado')} className="px-4 py-2 hover:bg-slate-800 cursor-pointer transition-colors">
                              Cancelar Evento
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-800 my-1 mx-2" />
                            <DropdownMenuItem className="text-red-500 px-4 py-2 hover:bg-red-500/10 cursor-pointer transition-colors font-medium" onClick={() => { setEventToDelete(event); setDeleteAlertOpen(true); }}>
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
