import { io, Socket } from 'socket.io-client';
import { useInvoicesStore } from '../Store/invoiceStore';
import { useNavigationStore } from '../Store/navigationStore';

let socket: Socket | null = null;

const origin = import.meta.env.DEV ? window.location.origin : 'https://fhd.aostng.ru';

export function connectLive(token: string) {
  const current = socket?.auth as { token?: string } | undefined;
  if (socket && current?.token === token) return;

  disconnectLive();

  socket = io(origin, {
    path: '/mi/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('workers', (body) => {
    if (body?.success) useNavigationStore.getState().setWorkers(body.data);
  });

  socket.on('invoices', (body) => {
    useInvoicesStore.getState().applyRemoteInvoices(body);
  });
}

export function disconnectLive() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
