import { WebSocket } from 'ws';

class WebSocketManager {
  private socket: WebSocket | null = null;

  constructor(private url: string) {}

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    this.socket.onmessage = event => {
      if (typeof event.data === 'string') {
        this.handleMessage(event.data);
      } else if (event.data instanceof Buffer) {
        this.handleMessage(event.data.toString());
      } else {
        console.error('Unsupported WebSocket message type:', typeof event.data);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    this.socket.onerror = error => {
      console.error('WebSocket error:', error);
    };
  }

  private handleMessage(data: string) {
    // Handle incoming messages
    console.log('Received message:', data);
  }

  sendMessage(message: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      console.error('WebSocket is not open. Unable to send message:', message);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

export default WebSocketManager;
