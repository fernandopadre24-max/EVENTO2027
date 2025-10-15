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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { events, clients, artists } from '@/lib/data';
import type { EventStatus, PaymentStatus } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const statusColors: Record<EventStatus, string> = {
  Pending: 'bg-yellow-400/20 text-yellow-600 border-yellow-400/30',
  Confirmed: 'bg-blue-400/20 text-blue-600 border-blue-400/30',
  Completed: 'bg-green-400/20 text-green-600 border-green-400/30',
  Cancelled: 'bg-red-400/20 text-red-600 border-red-400/30',
};

const paymentStatusColors: Record<PaymentStatus, string> = {
  Paid: 'bg-green-400/20 text-green-600 border-green-400/30',
  Unpaid: 'bg-gray-400/20 text-gray-600 border-gray-400/30',
};

export default function EventsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Events
        </h1>
        <Button>
          <PlusCircle className="w-4 h-4 mr-2" />
          Add New Event
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Event Schedule</CardTitle>
          <CardDescription>
            A list of all your scheduled events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Artists</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const client = clients.find(c => c.id === event.clientId);
                const eventArtists = artists.filter(a => event.artistIds.includes(a.id));
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{client?.name}</TableCell>
                    <TableCell>
                      {format(parseISO(event.date), 'MMM dd, yyyy')} at {event.time}
                    </TableCell>
                    <TableCell>{eventArtists.map(a => a.name).join(', ')}</TableCell>
                    <TableCell>${event.payment.toLocaleString()}</TableCell>
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
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Mark as Completed</DropdownMenuItem>
                          <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Cancel Event
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
