// Single shared socket instance for the entire app
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
  autoConnect: true,
  reconnection: true,
});

export default socket;
