'use client';

import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Event, EventStatus, PaymentStatus, Client, Artist } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
} from "@/components/ui/alert-dialog";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { ChevronDown, CalendarIcon } from 'lucide-react';

/* ── Win2000 token palette ─────────────────────────────────────────────────
   Silver (#d4d0c8), Luna blue (#0a246a / #a6b5d7), white, near-black (#000)
   Accent: classic teal-green for active/selected state.
──────────────────────────────────────────────────────────────────────────── */

// ---------- tiny primitives so we don't repeat ourselves ----------

function W2kButton({
  children,
  onClick,
  type = 'button',
  className = '',
  small = false,
  primary = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  small?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        'select-none font-w2k text-[#000000] cursor-default active:translate-y-px',
        'border border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080]',
        'outline-1 outline outline-[#404040]',
        small ? 'px-2 py-0.5 text-xs' : 'px-4 py-1 text-sm',
        primary
          ? 'bg-[#d4d0c8] border-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080]'
          : 'bg-[#d4d0c8]',
        className
      )}
    >
      {children}
    </button>
  );
}

function W2kInput({
  id,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  className = '',
}: {
  id?: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn(
        'font-w2k text-sm text-[#000000] bg-[#ffffff]',
        'border border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff]',
        'outline-1 outline outline-[#404040]',
        'px-2 py-0.5 h-7',
        className
      )}
    />
  );
}

function W2kLabel({ children, htmlFor, className = '' }: { children: React.ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn('font-w2k text-sm text-[#000000] select-none whitespace-nowrap', className)}>
      {children}
    </label>
  );
}

function W2kPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'bg-[#d4d0c8]',
        'border border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080]',
        'outline-1 outline outline-[#404040]',
        className
      )}
    >
      {children}
    </div>
  );
}

function W2kInsetPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'bg-[#ffffff]',
        'border border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff]',
        'outline-1 outline outline-[#404040]',
        className
      )}
    >
      {children}
    </div>
  );
}

function W2kTitleBar({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between px-2 py-0.5 bg-gradient-to-r from-[#0a246a] via-[#3a6ea5] to-[#a6b5d7] select-none">
      <span className="font-w2k text-sm font-bold text-[#ffffff] drop-shadow">{title}</span>
      <div className="flex gap-1">
        {['_', '□', '✕'].map((c, i) => (
          <button
            key={i}
            className="w-5 h-5 bg-[#d4d0c8] border border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080] outline-1 outline outline-[#404040] text-[#000000] text-xs flex items-center justify-center font-w2k"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function W2kSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="h-px flex-1 bg-[#808080]" />
      <span className="font-w2k text-xs text-[#444444] px-1 select-none uppercase tracking-wide">{children}</span>
      <div className="h-px flex-1 bg-[#808080]" />
    </div>
  );
}

// ---------- status pill (classic flat badge) ----------

const statusBg: Record<EventStatus, string> = {
  Pendente: 'bg-[#ffff00] text-[#000000]',
  Confirmado: 'bg-[#0000ff] text-[#ffffff]',
  'Concluído': 'bg-[#008000] text-[#ffffff]',
  Cancelado: 'bg-[#ff0000] text-[#ffffff]',
};
const payBg: Record<PaymentStatus, string> = {
  Pago: 'bg-[#008000] text-[#ffffff]',
  'Não Pago': 'bg-[#808080] text-[#ffffff]',
};

function StatusPill({ label, map }: { label: string; map: Record<string, string> }) {
  const cls = map[label] ?? 'bg-[#d4d0c8] text-[#000000]';
  return (
    <span className={cn('font-w2k text-xs px-2 py-0.5 border border-[#808080]', cls)}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────
// Win2000 Select (uses a native <select> styled classically)
// ─────────────────────────────────────────────────
function W2kSelect({
  value,
  onChange,
  children,
  className = '',
}: {
  value: string;
  onChange: (val: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        'font-w2k text-sm text-[#000000] bg-[#ffffff] h-7',
        'border border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff]',
        'outline-1 outline outline-[#404040]',
        'px-1',
        className
      )}
    >
      {children}
    </select>
  );
}

// ─────────────────────────────────────────────────
// Stat Card (Win2000 group-box style)
// ─────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon,
  accent = false,
  danger = false,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <W2kPanel className="p-3 flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <span className="font-w2k text-xs text-[#444444] uppercase tracking-wide">{title}</span>
        <span className={cn('text-base', accent ? 'text-[#008000]' : danger ? 'text-[#cc0000]' : 'text-[#0a246a]')}>{icon}</span>
      </div>
      <W2kInsetPanel className="px-3 py-2">
        <span className={cn('font-w2k text-lg font-bold', accent ? 'text-[#006400]' : danger ? 'text-[#cc0000]' : 'text-[#000000]')}>
          {value}
        </span>
      </W2kInsetPanel>
    </W2kPanel>
  );
}

// ─────────────────────────────────────────────────
const initialNewEventState = {
  clientId: '',
  date: new Date(),
  time: '',
  local: '',
  artistIds: [] as string[],
  payment: 0,
  withSound: false,
};

// ─────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────
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
        return (
          client?.name.toLowerCase().includes(searchLower) ||
          event.local.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateB.getTime() - dateA.getTime();
      }) || [];
  }, [events, clients, searchTerm]);

  const totals = useMemo(() => {
    const total = filteredEvents.reduce((sum, e) => sum + e.payment, 0);
    const paid = filteredEvents.filter(e => e.paymentStatus === 'Pago').reduce((sum, e) => sum + e.payment, 0);
    return { count: filteredEvents.length, total, paid, pending: total - paid };
  }, [filteredEvents]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewEvent(prev => ({ ...prev, [id]: id === 'payment' ? Number(value) : value }));
  };

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !user || !newEvent.clientId) return;
    const col = collection(firestore, 'events');
    const data = {
      ...newEvent,
      date: format(newEvent.date, 'yyyy-MM-dd'),
      status: 'Pendente' as EventStatus,
      paymentStatus: 'Não Pago' as PaymentStatus,
      userId: user.uid,
      hasSound: newEvent.withSound,
    };
    if (editingEventId) {
      updateDocumentNonBlocking(doc(firestore, 'events', editingEventId), data);
    } else {
      addDocumentNonBlocking(col, data);
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
    updateDocumentNonBlocking(doc(firestore, 'events', eventId), { status });
  };

  const updatePaymentStatus = (eventId: string, paymentStatus: PaymentStatus) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'events', eventId), { paymentStatus });
  };

  const toggleSoundStatus = (event: Event) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'events', event.id), { hasSound: !event.hasSound });
  };

  const handleDeleteEvent = () => {
    if (!firestore || !eventToDelete) return;
    deleteDocumentNonBlocking(doc(firestore, 'events', eventToDelete.id));
    setDeleteAlertOpen(false);
    setEventToDelete(null);
  };

  const handleExportPDF = () => {
    const d = new jsPDF();
    d.text('Lista de Eventos', 14, 16);
    const cols = ["Cliente", "Data", "Hora", "Local", "Artistas", "Som", "Valor"];
    const rows: any[] = [];
    filteredEvents.forEach(ev => {
      const client = clients?.find(c => c.id === ev.clientId);
      const evArtists = artists?.filter(a => ev.artistIds.includes(a.id));
      rows.push([
        client?.name || 'N/A',
        format(parseISO(ev.date), 'dd/MM/yyyy'),
        ev.time,
        ev.local,
        evArtists?.map(a => a.name).join(', ') || 'N/A',
        ev.hasSound ? 'Com Som' : 'Sem Som',
        `R$ ${ev.payment.toLocaleString('pt-BR')}`,
      ]);
    });
    (d as any).autoTable({ head: [cols], body: rows, startY: 32 });
    d.save('eventos.pdf');
  };

  return (
    // Page bg: classic Win2k silver
    <div className="min-h-screen bg-[#d4d0c8] font-w2k p-4 space-y-3">

      {/* ── Window chrome ───────────────────────────────────────── */}
      <W2kPanel className="overflow-hidden">
        <W2kTitleBar title="Eventos — BandMate" />

        {/* Menu bar */}
        <div className="flex items-center gap-0 bg-[#d4d0c8] border-b border-[#808080] px-1 py-0.5 select-none">
          {['Arquivo', 'Editar', 'Exibir', 'Ferramentas', 'Ajuda'].map(m => (
            <button
              key={m}
              className="px-3 py-0.5 text-xs text-[#000000] font-w2k hover:bg-[#0a246a] hover:text-[#ffffff] focus:bg-[#0a246a] focus:text-[#ffffff]"
            >
              {m}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 bg-[#d4d0c8] border-b border-[#808080] px-2 py-1">
          {/* Search */}
          <div className="flex items-center gap-1">
            <W2kLabel>🔍</W2kLabel>
            <W2kInput
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar cliente ou local..."
              className="w-56"
            />
          </div>

          <div className="w-px h-5 bg-[#808080]" />

          <W2kButton onClick={handleExportPDF} small>
            💾 Exportar PDF
          </W2kButton>

          <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <W2kButton small primary>
                ➕ Adicionar Evento
              </W2kButton>
            </DialogTrigger>

            {/* ── Win2k Dialog ────────────────────────────── */}
            <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-lg w-full">
              <W2kPanel className="overflow-hidden w-full">
                <W2kTitleBar title={editingEventId ? 'Editar Evento' : 'Novo Evento'} />
                <div className="p-4 space-y-3">
                  <DialogHeader className="hidden">
                    <DialogTitle>{editingEventId ? 'Editar Evento' : 'Adicionar Novo Evento'}</DialogTitle>
                    <DialogDescription>Preencha os campos abaixo.</DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleAddSubmit} className="space-y-2">

                    <div className="flex items-center gap-2">
                      <W2kLabel htmlFor="clientId" className="w-32 text-right">Cliente:</W2kLabel>
                      <W2kSelect
                        value={newEvent.clientId}
                        onChange={val => setNewEvent(prev => ({ ...prev, clientId: val }))}
                        className="flex-1"
                      >
                        <option value="">-- Selecione --</option>
                        {clients?.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </W2kSelect>
                    </div>

                    <div className="flex items-center gap-2">
                      <W2kLabel className="w-32 text-right">Data:</W2kLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              'flex-1 font-w2k text-sm text-[#000000] bg-[#ffffff] h-7 px-2 text-left',
                              'border border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff]',
                              'outline-1 outline outline-[#404040]',
                              'flex items-center gap-2'
                            )}
                          >
                            <CalendarIcon className="w-3 h-3" />
                            {newEvent.date
                              ? format(newEvent.date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                              : 'Escolha uma data'}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-[#d4d0c8] border border-[#808080]">
                          <Calendar
                            mode="single"
                            selected={newEvent.date}
                            onSelect={d => { if (d) setNewEvent(prev => ({ ...prev, date: d })); }}
                            locale={ptBR}
                            initialFocus
                            className="bg-[#d4d0c8] text-[#000000]"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex items-center gap-2">
                      <W2kLabel htmlFor="time" className="w-32 text-right">Hora:</W2kLabel>
                      <W2kInput id="time" type="time" value={newEvent.time} onChange={handleInputChange} className="flex-1" />
                    </div>

                    <div className="flex items-center gap-2">
                      <W2kLabel htmlFor="local" className="w-32 text-right">Local:</W2kLabel>
                      <W2kInput id="local" value={newEvent.local} onChange={handleInputChange} placeholder="Local do evento" className="flex-1" />
                    </div>

                    <div className="flex items-center gap-2">
                      <W2kLabel className="w-32 text-right">Artistas:</W2kLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              'flex-1 font-w2k text-sm text-[#000000] bg-[#ffffff] h-7 px-2',
                              'border border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff]',
                              'outline-1 outline outline-[#404040]',
                              'flex items-center justify-between'
                            )}
                          >
                            <span>
                              {newEvent.artistIds.length > 0
                                ? `${newEvent.artistIds.length} selecionado(s)`
                                : 'Selecione artistas'}
                            </span>
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#d4d0c8] border border-[#808080] text-[#000000] font-w2k text-sm">
                          {artists?.map(a => (
                            <DropdownMenuCheckboxItem
                              key={a.id}
                              checked={newEvent.artistIds.includes(a.id)}
                              onCheckedChange={checked => {
                                setNewEvent(prev => ({
                                  ...prev,
                                  artistIds: checked
                                    ? [...prev.artistIds, a.id]
                                    : prev.artistIds.filter(id => id !== a.id),
                                }));
                              }}
                              className="hover:bg-[#0a246a] hover:text-[#ffffff] focus:bg-[#0a246a] focus:text-[#ffffff]"
                            >
                              {a.name}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2">
                      <W2kLabel className="w-32 text-right">Com Som:</W2kLabel>
                      <div className="flex items-center gap-2 h-7">
                        <input
                          type="checkbox"
                          checked={newEvent.withSound}
                          onChange={e => setNewEvent(prev => ({ ...prev, withSound: e.target.checked }))}
                          className="w-4 h-4 cursor-default"
                        />
                        <span className="font-w2k text-sm text-[#000000]">
                          {newEvent.withSound ? 'Sim' : 'Não'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <W2kLabel htmlFor="payment" className="w-32 text-right">Pagamento (R$):</W2kLabel>
                      <W2kInput id="payment" type="number" value={newEvent.payment || ''} onChange={handleInputChange} className="flex-1" />
                    </div>

                    {/* Footer buttons */}
                    <div className="flex justify-end gap-2 pt-3 border-t border-[#808080]">
                      <W2kButton type="submit" primary>OK</W2kButton>
                      <W2kButton type="button" onClick={() => { setAddOpen(false); setEditingEventId(null); setNewEvent(initialNewEventState); }}>Cancelar</W2kButton>
                    </div>
                  </form>
                </div>
              </W2kPanel>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Status bar + Stat Cards ───────────────────────────────── */}
        <div className="p-3">
          <W2kSectionTitle>Resumo dos Eventos</W2kSectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <StatCard title="Total de Eventos" value={totals.count} icon="📅" />
            <StatCard title="Valor Total" value={`R$ ${totals.total.toLocaleString('pt-BR')}`} icon="💵" />
            <StatCard title="Valor Pago" value={`R$ ${totals.paid.toLocaleString('pt-BR')}`} icon="✅" accent />
            <StatCard title="Valor Pendente" value={`R$ ${totals.pending.toLocaleString('pt-BR')}`} icon="⚠️" danger />
          </div>

          {/* ── Table ───────────────────────────────────────────────── */}
          <W2kSectionTitle>Agenda Completa</W2kSectionTitle>
          <W2kInsetPanel className="overflow-x-auto">
            {(isLoadingEvents || isLoadingClients) && (
              <p className="font-w2k text-sm text-[#444444] p-4 animate-pulse">Carregando eventos...</p>
            )}
            <table className="w-full text-xs font-w2k border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#0a246a] text-[#ffffff]">
                  {['Cliente', 'Data e Hora', 'Local', 'Artistas', 'Som', 'Valor', 'Status', 'Pagam.', 'Ações'].map(h => (
                    <th
                      key={h}
                      className="px-2 py-1 text-left font-bold border-r border-[#3a6ea5] last:border-r-0 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event, i) => {
                  const client = clients?.find(c => c.id === event.clientId);
                  const eventArtists = artists?.filter(a => event.artistIds.includes(a.id));
                  return (
                    <tr
                      key={event.id}
                      className={cn(
                        'border-b border-[#d4d0c8] hover:bg-[#316ac5] hover:text-[#ffffff] transition-colors group',
                        i % 2 === 0 ? 'bg-[#ffffff]' : 'bg-[#f0f0f0]'
                      )}
                    >
                      <td className="px-2 py-1 whitespace-nowrap font-semibold border-r border-[#d4d0c8]">
                        {client?.name || 'Evento Privado'}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap border-r border-[#d4d0c8]">
                        {format(parseISO(event.date), "dd/MM/yyyy", { locale: ptBR })} {event.time || '00:00'}
                      </td>
                      <td className="px-2 py-1 max-w-[120px] truncate border-r border-[#d4d0c8]">{event.local}</td>
                      <td className="px-2 py-1 max-w-[120px] truncate border-r border-[#d4d0c8]">
                        {eventArtists?.map(a => a.name).join(', ') || '-'}
                      </td>
                      <td className="px-2 py-1 text-center border-r border-[#d4d0c8]">
                        {event.hasSound ? '🔊' : '🔇'}
                      </td>
                      <td className="px-2 py-1 text-right whitespace-nowrap border-r border-[#d4d0c8] font-semibold">
                        R$ {event.payment.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-2 py-1 text-center border-r border-[#d4d0c8]">
                        <StatusPill label={event.status} map={statusBg} />
                      </td>
                      <td className="px-2 py-1 text-center border-r border-[#d4d0c8]">
                        <StatusPill label={event.paymentStatus} map={payBg} />
                      </td>
                      <td className="px-2 py-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="font-w2k text-xs bg-[#d4d0c8] text-[#000000] px-2 py-0.5 border border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080] outline-1 outline outline-[#404040] group-hover:bg-[#c0c0c0]">
                              Ações ▼
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#d4d0c8] border border-[#808080] text-[#000000] font-w2k text-xs shadow-md min-w-[180px]">
                            <DropdownMenuLabel className="text-[#000080] px-2 py-0.5 font-bold text-xs uppercase">Ações Rápidas</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-[#808080] my-0.5" />
                            <DropdownMenuItem onClick={() => handleEditOpen(event)} className="px-2 py-1 hover:bg-[#0a246a] hover:text-[#ffffff] focus:bg-[#0a246a] focus:text-[#ffffff] cursor-default">
                              ✏️ Editar Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleSoundStatus(event)} className="px-2 py-1 hover:bg-[#0a246a] hover:text-[#ffffff] focus:bg-[#0a246a] focus:text-[#ffffff] cursor-default">
                              🔊 Alterar Status do Som
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#808080] my-0.5" />
                            <DropdownMenuItem onClick={() => updateEventStatus(event.id, 'Confirmado')} className="px-2 py-1 hover:bg-[#0a246a] hover:text-[#ffffff] focus:bg-[#0a246a] focus:text-[#ffffff] cursor-default">
                              📌 Confirmar Agenda
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateEventStatus(event.id, 'Concluído')} className="px-2 py-1 hover:bg-[#0a246a] hover:text-[#ffffff] focus:bg-[#0a246a] focus:text-[#ffffff] cursor-default">
                              ✅ Finalizar Evento
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updatePaymentStatus(event.id, 'Pago')} className="px-2 py-1 hover:bg-[#006400] hover:text-[#ffffff] focus:bg-[#006400] focus:text-[#ffffff] cursor-default">
                              💰 Marcar como Pago
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateEventStatus(event.id, 'Cancelado')} className="px-2 py-1 hover:bg-[#aa0000] hover:text-[#ffffff] focus:bg-[#aa0000] focus:text-[#ffffff] cursor-default">
                              ❌ Cancelar Evento
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#808080] my-0.5" />
                            <DropdownMenuItem
                              className="text-[#cc0000] px-2 py-1 hover:bg-[#cc0000] hover:text-[#ffffff] focus:bg-[#cc0000] focus:text-[#ffffff] cursor-default font-bold"
                              onClick={() => { setEventToDelete(event); setDeleteAlertOpen(true); }}
                            >
                              🗑️ Excluir Permanentemente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}

                {!isLoadingEvents && filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center font-w2k text-sm text-[#808080]">
                      Nenhum evento encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </W2kInsetPanel>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-4 px-2 py-0.5 bg-[#d4d0c8] border-t border-[#808080]">
          <W2kInsetPanel className="px-2 py-0.5 flex-1">
            <span className="font-w2k text-xs text-[#000000]">
              {totals.count} evento(s) encontrado(s)
            </span>
          </W2kInsetPanel>
          <W2kInsetPanel className="px-2 py-0.5">
            <span className="font-w2k text-xs text-[#000000]">BandMate v1.0</span>
          </W2kInsetPanel>
        </div>
      </W2kPanel>

      {/* ── Delete Confirm Dialog ───────────────────────────────── */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent className="p-0 border-0 bg-transparent shadow-none max-w-sm w-full">
          <W2kPanel className="overflow-hidden">
            <W2kTitleBar title="Confirmar Exclusão" />
            <div className="p-4 space-y-4">
              <AlertDialogHeader>
                <div className="flex items-start gap-3">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <AlertDialogTitle className="font-w2k text-sm font-bold text-[#000000]">
                      Você tem absoluta certeza?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-w2k text-xs text-[#444444] mt-1">
                      Esta ação excluirá permanentemente o evento selecionado. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </div>
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex justify-end gap-2 pt-2 border-t border-[#808080]">
                <AlertDialogAction asChild>
                  <W2kButton onClick={handleDeleteEvent} primary>Sim, Excluir</W2kButton>
                </AlertDialogAction>
                <AlertDialogCancel asChild>
                  <W2kButton>Cancelar</W2kButton>
                </AlertDialogCancel>
              </AlertDialogFooter>
            </div>
          </W2kPanel>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
