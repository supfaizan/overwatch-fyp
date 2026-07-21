/* Socket.IO singleton. One shared connection for the whole app.
   The auth callback re-reads the token on every (re)connect so it stays fresh.
   Feature-specific listeners live in features/<x>/sockets/, never here.

   WebSocket events (guide.md §11):
     graph:update | contract:warning | ticket:mapped | tgnn:scores */

import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth-store";

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket) return socket;

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "", {
    autoConnect: true,
    transports: ["websocket"],
    auth: (cb) => cb({ token: useAuthStore.getState().token ?? "" }),
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
