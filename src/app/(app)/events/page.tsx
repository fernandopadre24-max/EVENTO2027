
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';


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

const initialNewEventState = {
  clientId: '',
  date: new Date(),
  time: '',
  local: '',
  artistIds: [] as string[],
  payment: 0,
  hasSound: false,
};

export default function EventsPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const eventsRef = useMemoFirebase(() => user ? query(collection(firestore, 'events'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: events, isLoading: isLoadingEvents } = useCollection<Event>(eventsRef);

  const clientsRef = useMemoFirebase(() => user ? query(collection(firestore, 'clients'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsRef);

  const artistsRef = useMemoFirebase(() => user ? query(collection(firestore, 'artists'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: artists, isLoading: isLoadingArtists } = useCollection<Artist>(artistsRef);

  const [isAddOpen, setAddOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [newEvent, setNewEvent] = useState(initialNewEventState);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>();
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>();
  
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);


  const filteredEvents = useMemo(() => {
    return events
      ?.filter(event => {
        const client = clients?.find(c => c.id === event.clientId);
        const searchLower = searchTerm.toLowerCase();

        const clientMatch = client?.name.toLowerCase().includes(searchLower);
        const localMatch = event.local.toLowerCase().includes(searchLower);
        
        const statusMatch = statusFilter === 'all' || event.status === statusFilter;
        const paymentStatusMatch = paymentStatusFilter === 'all' || event.paymentStatus === paymentStatusFilter;

        const eventDate = parseISO(event.date);
        const dateMatch =
          (!startDateFilter || eventDate >= startOfDay(startDateFilter)) &&
          (!endDateFilter || eventDate <= endOfDay(endDateFilter));

        return (clientMatch || localMatch) && statusMatch && paymentStatusMatch && dateMatch;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateB.getTime() - dateA.getTime();
      }) || [];
  }, [events, clients, searchTerm, statusFilter, paymentStatusFilter, startDateFilter, endDateFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const targetState = isEditOpen ? setEditingEvent : setNewEvent;
    targetState(prev => ({ ...prev!, [id]: id === 'payment' ? Number(value) : value }));
  };
  
  const handleSelectChange = (id: string) => (value: string) => {
    const targetState = isEditOpen ? setEditingEvent : setNewEvent;
    targetState(prev => ({ ...prev!, [id]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if(date) {
      const targetState = isEditOpen ? setEditingEvent : setNewEvent;
      targetState(prev => ({ ...prev!, date: isEditOpen ? format(date, 'yyyy-MM-dd') : date }));
    }
  };

  const handleArtistSelection = (artistId: string) => {
    const targetState = isEditOpen ? setEditingEvent : setNewEvent;
    targetState(prev => {
      const currentArtistIds = prev!.artistIds || [];
      const newArtistIds = currentArtistIds.includes(artistId)
        ? currentArtistIds.filter(id => id !== artistId)
        : [...currentArtistIds, artistId];
      return { ...prev!, artistIds: newArtistIds };
    });
  };

  const handleSoundToggle = (checked: boolean) => {
    const targetState = isEditOpen ? setEditingEvent : setNewEvent;
    targetState(prev => ({ ...prev!, hasSound: checked }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setStartDateFilter(undefined);
    setEndDateFilter(undefined);
  };

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !user || !newEvent.clientId || newEvent.artistIds.length === 0) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    const eventsCollectionRef = collection(firestore, 'events');
    const newEventData = {
      ...newEvent,
      date: format(newEvent.date, 'yyyy-MM-dd'),
      status: 'Pendente' as EventStatus,
      paymentStatus: 'Não Pago' as PaymentStatus,
      userId: user.uid,
    };
    addDocumentNonBlocking(eventsCollectionRef, newEventData);
    setAddOpen(false);
    setNewEvent(prev => ({
      ...initialNewEventState,
      time: prev.time,
      artistIds: prev.artistIds,
      payment: prev.payment,
      hasSound: prev.hasSound,
    }));
  };
  
  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !editingEvent) return;

    const eventDocRef = doc(firestore, 'events', editingEvent.id);
    const { id, ...eventData } = editingEvent;
    
    const dataToUpdate = {
        ...eventData,
        date: typeof editingEvent.date === 'string' ? editingEvent.date : format(editingEvent.date, 'yyyy-MM-dd'),
    };

    updateDocumentNonBlocking(eventDocRef, dataToUpdate);
    setEditOpen(false);
    setEditingEvent(null);
  };


  const openEditDialog = (event: Event) => {
    const eventDate = typeof event.date === 'string' ? parseISO(event.date) : event.date;
    setEditingEvent({ ...event, date: format(eventDate, 'yyyy-MM-dd') });
    setEditOpen(true);
  };

  const updateEventStatus = (eventId: string, status: EventStatus) => {
    if (!firestore) return;
    const eventDocRef = doc(firestore, 'events', eventId);
    updateDocumentNonBlocking(eventDocRef, { status });
  };

  const updatePaymentStatus = (event: Event, paymentStatus: PaymentStatus) => {
    if (!firestore || !user) return;
    const eventDocRef = doc(firestore, 'events', event.id);
    updateDocumentNonBlocking(eventDocRef, { paymentStatus });
  };
  
  const toggleSoundStatus = (event: Event) => {
    if (!firestore) return;
    const eventDocRef = doc(firestore, 'events', event.id);
    updateDocumentNonBlocking(eventDocRef, { hasSound: !event.hasSound });
  };

  const openDeleteAlert = (event: Event) => {
    setEventToDelete(event);
    setDeleteAlertOpen(true);
  };

  const handleDeleteEvent = () => {
    if (!firestore || !eventToDelete) return;
    const eventDocRef = doc(firestore, 'events', eventToDelete.id);
    deleteDocumentNonBlocking(eventDocRef);
    setDeleteAlertOpen(false);
    setEventToDelete(null);
  };

  const newEventDate = useMemo(() => {
    if (!newEvent.date) return undefined;
    return newEvent.date;
  }, [newEvent.date]);
  
  const editingEventDate = useMemo(() => {
      if (!editingEvent?.date) return undefined;
      return typeof editingEvent.date === 'string' ? parseISO(editingEvent.date) : editingEvent.date;
  }, [editingEvent?.date]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Lista de Eventos', 14, 16);

    const tableColumn = ["Cliente", "Data", "Hora", "Local", "Artistas", "Valor (R$)"];
    const tableRows: (string | number)[][] = [];

    filteredEvents.forEach(event => {
        const client = clients?.find(c => c.id === event.clientId);
        const eventArtists = artists?.filter(a => event.artistIds.includes(a.id));
        const eventData = [
            client?.name || '',
            format(parseISO(event.date), 'dd/MM/yyyy', { locale: ptBR }),
            event.time,
            event.local,
            eventArtists?.map(a => a.name).join(', ') || '',
            event.payment.toLocaleString('pt-BR')
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


  const renderForm = (isEditing: boolean) => {
    const currentData = isEditing ? editingEvent : newEvent;
    const handleSubmit = isEditing ? handleEditSubmit : handleAddSubmit;
    const currentDate = isEditing ? editingEventDate : newEventDate;

    if (!currentData) return null;

    return (
        <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="clientId" className="text-right">
                    Cliente
                  </Label>
                   <Select value={currentData.clientId} onValueChange={handleSelectChange('clientId')}>
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
                          !currentDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {currentDate ? format(currentDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={currentDate}
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
                  <Input id="time" type="time" value={currentData.time || ''} onChange={handleInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="local" className="text-right">
                    Local
                  </Label>
                  <Input id="local" value={currentData.local || ''} onChange={handleInputChange} placeholder="Local do evento" className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-start gap-4 pt-2">
                  <Label htmlFor="artistIds" className="text-right pt-2">
                    Artistas
                  </Label>
                  <Collapsible className="col-span-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full flex justify-between">
                        <span>
                          {currentData.artistIds.length > 0 ? `${currentData.artistIds.length} selecionado(s)`: "Selecione artistas"}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-2 mt-2 border rounded-md">
                      <div className="flex flex-col gap-2">
                        {artists?.map(artist => (
                          <div key={artist.id} className="flex items-center gap-2">
                            <Checkbox 
                              id={`artist-${artist.id}-${isEditing ? 'edit' : 'add'}`}
                              checked={currentData.artistIds.includes(artist.id)}
                              onCheckedChange={() => handleArtistSelection(artist.id)}
                            />
                            <Label htmlFor={`artist-${artist.id}-${isEditing ? 'edit' : 'add'}`}>{artist.name}</Label>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="hasSound" className="text-right">
                        Com Som
                    </Label>
                    <Switch
                        id="hasSound"
                        checked={currentData.hasSound}
                        onCheckedChange={handleSoundToggle}
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="payment" className="text-right">
                    Valor (R$)
                  </Label>
                  <Input id="payment" type="number" value={currentData.payment || ''} onChange={handleInputChange} placeholder="2000" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
        </form>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Eventos
        </h1>
        <div className='flex gap-2'>
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
                <DialogDescription>
                  Preencha os detalhes do novo evento.
                </DialogDescription>
              </DialogHeader>
              {renderForm(false)}
            </DialogContent>
          </Dialog>
        </div>
      </div>

       <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Editar Evento</DialogTitle>
                <DialogDescription>
                    Atualize os detalhes do evento.
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
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o evento.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteEvent}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Buscar por cliente ou local..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as EventStatus | 'all')}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Confirmado">Confirmado</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={paymentStatusFilter} onValueChange={(value) => setPaymentStatusFilter(value as PaymentStatus | 'all')}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Pagamentos</SelectItem>
                        <SelectItem value="Pago">Pago</SelectItem>
                        <SelectItem value="Não Pago">Não Pago</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
          <CardDescription>
            Lista de eventos agendados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(isLoadingEvents || isLoadingClients || isLoadingArtists) && <p>Carregando...</p>}
           <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead className="hidden md:table-cell">Local</TableHead>
                  <TableHead className="hidden lg:table-cell">Artistas</TableHead>
                  <TableHead>Som</TableHead>
                  <TableHead className="hidden sm:table-cell">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const client = clients?.find(c => c.id === event.clientId);
                  const eventArtists = artists?.filter(a => event.artistIds.includes(a.id));
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="font-medium">{client?.name}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {format(parseISO(event.date), 'dd/MM/yy')} às {event.time}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{event.local}</TableCell>
                      <TableCell className="hidden lg:table-cell">{eventArtists?.map(a => a.name).join(', ')}</TableCell>
                      <TableCell>
                          <Switch
                              checked={event.hasSound}
                              onCheckedChange={() => toggleSoundStatus(event)}
                          />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">R${event.payment.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('font-semibold', statusColors[event.status])}>
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(event)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateEventStatus(event.id, 'Confirmado')}>Confirmar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateEventStatus(event.id, 'Concluído')}>Concluir</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updatePaymentStatus(event, 'Pago')}>Marcar Pago</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => openDeleteAlert(event)}>Excluir</DropdownMenuItem>
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
    </div>
  );
}
