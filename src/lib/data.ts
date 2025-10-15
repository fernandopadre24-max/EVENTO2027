import type { Client, Artist, Event, FinancialTransaction } from './types';
import { subDays, format } from 'date-fns';

export const clients: Client[] = [
  { id: 'cli-1', name: 'Alice Johnson', email: 'alice.j@example.com', phone: '555-0101', eventHistory: ['evt-1', 'evt-3'] },
  { id: 'cli-2', name: 'Roberto Williams', email: 'roberto.w@example.com', phone: '555-0102', eventHistory: ['evt-2'] },
  { id: 'cli-3', name: 'Carlos Brown', email: 'carlos.b@example.com', phone: '555-0103', eventHistory: ['evt-4'] },
  { id: 'cli-4', name: 'Diana Prince', email: 'diana.p@example.com', phone: '555-0104', eventHistory: [] },
];

export const artists: Artist[] = [
  { id: 'art-1', name: 'Os Rockeiros', genre: 'Rock', profilePictureUrl: 'https://picsum.photos/seed/artist1/400/400', profilePictureHint: 'cantor masculino', performanceDetails: 'Banda de rock enérgica de 4 membros.' },
  { id: 'art-2', name: 'Alma Acústica', genre: 'Acústico', profilePictureUrl: 'https://picsum.photos/seed/artist2/400/400', profilePictureHint: 'guitarrista feminina', performanceDetails: 'Guitarrista solo feminina com vocais emocionantes.' },
  { id: 'art-3', name: 'Beat Droppers', genre: 'EDM', profilePictureUrl: 'https://picsum.photos/seed/artist4/400/400', profilePictureHint: 'DJ toca-discos', performanceDetails: 'Duo de DJs tocando as últimas faixas de EDM.' },
  { id: 'art-4', name: 'Mestres do Jazz', genre: 'Jazz', profilePictureUrl: 'https://picsum.photos/seed/artist5/400/400', profilePictureHint: 'baixista palco', performanceDetails: 'Trio de jazz clássico (piano, baixo, bateria).' },
];

export const events: Event[] = [
  { id: 'evt-1', title: 'Gala Corporativa', date: format(subDays(new Date(), 15), 'yyyy-MM-dd'), time: '19:00', clientId: 'cli-1', artistIds: ['art-4'], payment: 1500, status: 'Concluído', paymentStatus: 'Pago' },
  { id: 'evt-2', title: 'Recepção de Casamento', date: format(subDays(new Date(), 5), 'yyyy-MM-dd'), time: '18:30', clientId: 'cli-2', artistIds: ['art-2'], payment: 1200, status: 'Concluído', paymentStatus: 'Pago' },
  { id: 'evt-3', title: 'Festa de Aniversário', date: format(new Date(), 'yyyy-MM-dd'), time: '20:00', clientId: 'cli-1', artistIds: ['art-3'], payment: 800, status: 'Confirmado', paymentStatus: 'Não Pago' },
  { id: 'evt-4', title: 'Festival de Verão', date: format(new Date().setDate(new Date().getDate() + 10), 'yyyy-MM-dd'), time: '15:00', clientId: 'cli-3', artistIds: ['art-1', 'art-3'], payment: 3500, status: 'Confirmado', paymentStatus: 'Não Pago' },
  { id: 'evt-5', title: 'Baile de Caridade', date: format(new Date().setDate(new Date().getDate() + 25), 'yyyy-MM-dd'), time: '19:30', clientId: 'cli-4', artistIds: ['art-4'], payment: 2000, status: 'Pendente', paymentStatus: 'Não Pago' },
];

export const financialTransactions: FinancialTransaction[] = [
  { id: 'trn-1', type: 'Receita', description: 'Pagamento para Gala Corporativa', amount: 1500, date: format(subDays(new Date(), 14), 'yyyy-MM-dd'), eventId: 'evt-1' },
  { id: 'trn-2', type: 'Receita', description: 'Pagamento para Recepção de Casamento', amount: 1200, date: format(subDays(new Date(), 4), 'yyyy-MM-dd'), eventId: 'evt-2' },
  { id: 'trn-3', type: 'Despesa', description: 'Novas Cordas de Guitarra', amount: 50, date: format(subDays(new Date(), 20), 'yyyy-MM-dd') },
  { id: 'trn-4', type: 'Despesa', description: 'Aluguel de Van', amount: 300, date: format(subDays(new Date(), 16), 'yyyy-MM-dd') },
  { id: 'trn-5', type: 'Despesa', description: 'Reparo do Sistema de Som', amount: 250, date: format(subDays(new Date(), 10), 'yyyy-MM-dd') },
];
