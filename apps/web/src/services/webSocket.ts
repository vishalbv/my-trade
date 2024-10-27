import notify, { notifyServerSide } from "./notification";

let socket: WebSocket | null = null;

export function initializeWebSocket() {
  if (!socket) {
    socket = new WebSocket("ws://localhost:2300");

    socket.onopen = () => {
      console.log("WebSocket Connected");
      notify.success("WebSocket Connected");
      setTimeout(() => {
        notify.speak("WebSocket Connected", "error");
      }, 3000);
    };

    socket.onclose = () => {
      console.log("WebSocket Disconnected");
      socket = null;
    };

    socket.onmessage = (response: MessageEvent<any>) => {
      console.log("Received:", response.data);

      const { event, data } = JSON.parse(response.data);

      if (event === "notification") {
        notifyServerSide(data);
      }
    };
  }
  return socket;
}

export function getSocket(): WebSocket | null {
  return socket;
}

export function sendMessage(message: string) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(message);
  } else {
    console.error("WebSocket is not connected");
  }
}
