import { io, Socket } from "socket.io-client";
import { getAuthToken } from "./api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

let _socket: Socket | null = null;

export function getSocket() {
  const token = getAuthToken();
  if (_socket && _socket.connected) return _socket;
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
  _socket = io(API_URL, {
    transports: ["websocket"],
    auth: { token },
  });
  return _socket;
}

export function disconnectSocket() {
  if (_socket) _socket.disconnect();
  _socket = null;
}

