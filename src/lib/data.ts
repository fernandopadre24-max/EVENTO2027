import type { Client, Artist, Event, FinancialTransaction } from './types';
import { subDays, format } from 'date-fns';

export const clients: Client[] = [
  { id: 'cli-1', name: 'Alice Johnson', email: 'alice.j@example.com', phone: '555-0101', eventHistory: ['evt-1', 'evt-3'] },
  { id: 'cli-2', name: 'Bob Williams', email: 'bob.w@example.com', phone: '555-0102', eventHistory: ['evt-2'] },
  { id: 'cli-3', name: 'Charlie Brown', email: 'charlie.b@example.com', phone: '555-0103', eventHistory: ['evt-4'] },
  { id: 'cli-4', name: 'Diana Prince', email: 'diana.p@example.com', phone: '555-0104', eventHistory: [] },
];

export const artists: Artist[] = [
  { id: 'art-1', name: 'The Rockers', genre: 'Rock', profilePictureUrl: 'https://picsum.photos/seed/artist1/400/400', profilePictureHint: 'male singer', performanceDetails: 'High-energy 4-piece rock band.' },
  { id: 'art-2', name: 'Acoustic Soul', genre: 'Acoustic', profilePictureUrl: 'https://picsum.photos/seed/artist2/400/400', profilePictureHint: 'female guitarist', performanceDetails: 'Solo female guitarist with soulful vocals.' },
  { id: 'art-3', name: 'Beat Droppers', genre: 'EDM', profilePictureUrl: 'https://picsum.photos/seed/artist4/400/400', profilePictureHint: 'DJ turntable', performanceDetails: 'DJ duo spinning the latest EDM tracks.' },
  { id: 'art-4', name: 'Jazz Masters', genre: 'Jazz', profilePictureUrl: 'https://picsum.photos/seed/artist5/400/400', profilePictureHint: 'bassist stage', performanceDetails: 'Classic jazz trio (piano, bass, drums).' },
];

export const events: Event[] = [
  { id: 'evt-1', title: 'Corporate Gala', date: format(subDays(new Date(), 15), 'yyyy-MM-dd'), time: '19:00', clientId: 'cli-1', artistIds: ['art-4'], payment: 1500, status: 'Completed', paymentStatus: 'Paid' },
  { id: 'evt-2', title: 'Wedding Reception', date: format(subDays(new Date(), 5), 'yyyy-MM-dd'), time: '18:30', clientId: 'cli-2', artistIds: ['art-2'], payment: 1200, status: 'Completed', paymentStatus: 'Paid' },
  { id: 'evt-3', title: 'Birthday Party', date: format(new Date(), 'yyyy-MM-dd'), time: '20:00', clientId: 'cli-1', artistIds: ['art-3'], payment: 800, status: 'Confirmed', paymentStatus: 'Unpaid' },
  { id: 'evt-4', title: 'Summer Festival', date: format(new Date().setDate(new Date().getDate() + 10), 'yyyy-MM-dd'), time: '15:00', clientId: 'cli-3', artistIds: ['art-1', 'art-3'], payment: 3500, status: 'Confirmed', paymentStatus: 'Unpaid' },
  { id: 'evt-5', title: 'Charity Ball', date: format(new Date().setDate(new Date().getDate() + 25), 'yyyy-MM-dd'), time: '19:30', clientId: 'cli-4', artistIds: ['art-4'], payment: 2000, status: 'Pending', paymentStatus: 'Unpaid' },
];

export const financialTransactions: FinancialTransaction[] = [
  { id: 'trn-1', type: 'Income', description: 'Payment for Corporate Gala', amount: 1500, date: format(subDays(new Date(), 14), 'yyyy-MM-dd'), eventId: 'evt-1' },
  { id: 'trn-2', type: 'Income', description: 'Payment for Wedding Reception', amount: 1200, date: format(subDays(new Date(), 4), 'yyyy-MM-dd'), eventId: 'evt-2' },
  { id: 'trn-3', type: 'Expense', description: 'New Guitar Strings', amount: 50, date: format(subDays(new Date(), 20), 'yyyy-MM-dd') },
  { id: 'trn-4', type: 'Expense', description: 'Van Rental', amount: 300, date: format(subDays(new Date(), 16), 'yyyy-MM-dd') },
  { id: 'trn-5', type: 'Expense', description: 'Sound System Repair', amount: 250, date: format(subDays(new Date(), 10), 'yyyy-MM-dd') },
];
