
'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Event, Client } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';


export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const firestore = useFirestore();

  const eventsRef = useMemoFirebase(() => collection(firestore, 'events'), [firestore]);
  const { data: events } = useCollection<Event>(eventsRef);
  
  const clientsRef = useMemoFirebase(() => collection(firestore, 'clients'), [firestore]);
  const { data: clients } = useCollection<Client>(clientsRef);

  const eventsByDate = useMemo(() => events?.reduce((acc, event) => {
    const eventDate = format(parseISO(event.date), 'yyyy-MM-dd');
    if (!acc[eventDate]) {
      acc[eventDate] = [];
    }
    acc[eventDate].push(event);
    return acc;
  }, {} as Record<string, Event[]>) || {}, [events]);

  const selectedDayEvents = date ? eventsByDate[format(date, 'yyyy-MM-dd')] || [] : [];
  
  const eventDays = Object.keys(eventsByDate).map(d => parseISO(d));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Calendário de Eventos
      </h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-1 md:p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="p-0 [&_td]:p-0"
              classNames={{
                day: "h-14 w-full text-base",
                head_cell: "text-muted-foreground rounded-md w-full",
              }}
              modifiers={{
                event: eventDays
              }}
              modifiersClassNames={{
                event: 'rdp-day_event'
              }}
              locale={ptBR}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Eventos para {date ? format(date, 'dd MMMM', { locale: ptBR }) : 'dia selecionado'}</CardTitle>
            <CardDescription>Clique em um dia no calendário para ver os eventos.</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDayEvents.length > 0 ? (
              <ul className="space-y-4">
                {selectedDayEvents.map(event => {
                  const client = clients?.find(c => c.id === event.clientId);
                  return (
                    <li key={event.id} className="p-4 rounded-lg bg-muted">
                      <p className="font-bold text-sm text-muted-foreground">Cliente: {client?.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary">{event.time}</Badge>
                        <span className="text-sm font-semibold">R${event.payment.toLocaleString('pt-BR')}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">Nenhum evento para este dia.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
