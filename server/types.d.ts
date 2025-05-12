import { WebSocketServer, WebSocket } from "ws";

declare global {
  var wss: WebSocketServer;
  var broadcastEvent: (event: string, data: any, recipients?: string[]) => void;
  
  namespace NodeJS {
    interface Global {
      wss: WebSocketServer;
      broadcastEvent: (event: string, data: any, recipients?: string[]) => void;
    }
  }
}