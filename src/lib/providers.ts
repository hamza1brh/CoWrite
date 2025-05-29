import { Provider } from "@lexical/yjs";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

function getWebSocketURL(): string {
  if (typeof window === "undefined") {
    return "ws://localhost:1234";
  }

  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return process.env.NEXT_PUBLIC_WS_URL || "ws://192.168.1.123:10000";
  } else {
    return (
      process.env.NEXT_PUBLIC_WS_URL ||
      "wss://your-deployed-server.onrender.com"
    );
  }
}

export function createWebsocketProvider(
  id: string,
  yjsDocMap: Map<string, Y.Doc>
): Provider {
  const doc = getDocFromMap(id, yjsDocMap);
  const wsUrl = getWebSocketURL();

  console.log(`🔌 Connecting to WebSocket: ${wsUrl} for room: ${id}`);

  // @ts-expect-error TODO: FIXME
  return new WebsocketProvider(wsUrl, id, doc, {
    connect: true, // Changed from false to true - this is crucial for cursors
  });
}

function getDocFromMap(id: string, yjsDocMap: Map<string, Y.Doc>): Y.Doc {
  let doc = yjsDocMap.get(id);

  if (doc === undefined) {
    doc = new Y.Doc();
    yjsDocMap.set(id, doc);
  } else {
    doc.load();
  }

  return doc;
}
