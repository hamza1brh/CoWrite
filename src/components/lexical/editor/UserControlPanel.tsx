import { Fragment, useState, useEffect, useRef } from "react";


interface CollaboratorUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  clerkUserId: string;
}

interface ActiveCollaborator {
  user: CollaboratorUser;
  role: string;
  isOnline: boolean;
  lastSeen?: Date;
  connectionId?: string;
  cursorColor?: string;
}

interface ConnectionEvent {
  timestamp: Date;
  type: "connect" | "disconnect" | "reconnect" | "error";
  message: string;
  userCount?: number;
}

interface UserControlPanelProps {
  currentUser: CollaboratorUser;
  connected: boolean;
  collaborators: ActiveCollaborator[]; 
  onlineUsers: Set<string>; 
  provider?: any;
  yjsDoc?: any;
  websocketUrl?: string;
}

export default function UserControlPanel({
  currentUser,
  connected,
  collaborators,
  onlineUsers,
  provider,
  yjsDoc,
  websocketUrl,
}: UserControlPanelProps) {
  const [connectionHistory, setConnectionHistory] = useState<ConnectionEvent[]>(
    []
  );
  const [wsReadyState, setWsReadyState] = useState<number>(-1);
  const [awarenessUsers, setAwarenessUsers] = useState<any[]>([]);
  const [yjsClients, setYjsClients] = useState<Set<number>>(new Set());
  const [reconnectCount, setReconnectCount] = useState(0);
  const [showDebugDetails, setShowDebugDetails] = useState(false);
  const prevConnected = useRef(connected);
  const startTime = useRef(Date.now());
  const prevProviderId = useRef<string>("");

  const onlineUserIds = new Set<string>();
  for (const [, state] of awarenessUsers) {
    const userId = state.user?.id || state.userId || state.id;
    if (userId && typeof userId === "string") {
      onlineUserIds.add(userId);
    }
  }
  // console.log("🔍 UserControlPanel awarenessUsers:", awarenessUsers);

  // Debug logging to compare with EditorHeader
  // console.log("🔍 UserControlPanel awareness debug:", {
  //   awarenessUsersCount: awarenessUsers.length,
  //   onlineUserIds: Array.from(onlineUserIds),
  //   collaborators: collaborators.map(c => ({
  //     name: c.user.name,
  //     userId: c.user.id,
  //     isOnline: onlineUserIds.has(c.user.id),
  //   })),
  //   rawAwarenessUsers: awarenessUsers.map(([clientId, state]) => ({
  //     clientId,
  //     fullState: state,
  //     hasUser: !!state.user,
  //     userId: state.user?.id,
  //     userIdType: typeof state.user?.id,
  //     userName: state.user?.name,
  //   })),
  // });


  const onlineCollaborators = collaborators.filter(collab =>
    onlineUserIds.has(collab.user.id)
  );

  // Reset state when provider changes 
  useEffect(() => {
    const providerId = provider?.doc?.guid || "";
    if (providerId && providerId !== prevProviderId.current) {
      // console.log(`🔄 UserControlPanel: Provider changed from ${prevProviderId.current} to ${providerId}`);


      // Reset state for new document
      setConnectionHistory([]);
      setAwarenessUsers([]);
      setYjsClients(new Set());
      setReconnectCount(0);
      startTime.current = Date.now();

      prevProviderId.current = providerId;
    }
  }, [provider]);


  useEffect(() => {
    if (prevConnected.current !== connected) {
      const event: ConnectionEvent = {
        timestamp: new Date(),
        type: connected ? "connect" : "disconnect",
        message: connected ? "WebSocket connected" : "WebSocket disconnected",
        userCount: onlineUserIds.size,
      };

      setConnectionHistory(prev => [...prev.slice(-9), event]);
      prevConnected.current = connected;

      if (connected) {
        setReconnectCount(prev => prev + 1);
      }
    }
  }, [connected, onlineUserIds.size]);


  useEffect(() => {
    if (!provider) {
      console.log("👥 UserControlPanel: No provider available");
      return;
    }

    // console.log("👥 UserControlPanel: Setting up provider monitoring");

    const updateProviderInfo = () => {
      try {

        if (provider.ws) {
          setWsReadyState(provider.ws.readyState);
        }


        if (provider.awareness) {
          const awarenessStates = Array.from(
            provider.awareness.getStates().entries()
          );
          setAwarenessUsers(awarenessStates);

          // console.log(
          //   `👥 Awareness updated: ${awarenessStates.length} users`,
          //   awarenessStates.map((entry: any) => ({
          //     id: entry[0],
          //     user: entry[1].user,
          //   }))
          // );
        }


        if (yjsDoc) {
          const clients = yjsDoc.getMap("clients");
          setYjsClients(new Set(clients.keys()));
        }
      } catch (error) {
        console.error("👥 Error updating provider info:", error);
      }
    };


    updateProviderInfo();


    const intervalId = setInterval(updateProviderInfo, 5000);

    const onStatus = (event: any) => {
      console.log("👥 Provider status event:", event);
      const connectionEvent: ConnectionEvent = {
        timestamp: new Date(),
        type: event.status === "connected" ? "connect" : "disconnect",
        message: `Provider status: ${event.status}`,
        userCount: onlineUserIds.size,
      };
      setConnectionHistory(prev => [...prev.slice(-9), connectionEvent]);
    };

    const onConnectionError = (event: any) => {
      console.error("👥 Provider connection error:", event);
      const connectionEvent: ConnectionEvent = {
        timestamp: new Date(),
        type: "error",
        message: `Connection error: ${event.message || "Unknown error"}`,
        userCount: onlineUserIds.size,
      };
      setConnectionHistory(prev => [...prev.slice(-9), connectionEvent]);
    };

    const onAwarenessChange = () => {
      // console.log("👥 Awareness changed, updating...");
      updateProviderInfo();
    };

    provider.on("status", onStatus);
    provider.on("connection-error", onConnectionError);


    if (provider.awareness) {
      provider.awareness.on("change", onAwarenessChange);
    }

    return () => {
      console.log("👥 Cleaning up provider listeners");
      clearInterval(intervalId);
      provider.off("status", onStatus);
      provider.off("connection-error", onConnectionError);

      if (provider.awareness) {
        provider.awareness.off("change", onAwarenessChange);
      }
    };
  }, [provider, yjsDoc, onlineUserIds.size]);

  const getWebSocketStateText = (state: number) => {
    switch (state) {
      case 0:
        return "CONNECTING";
      case 1:
        return "OPEN";
      case 2:
        return "CLOSING";
      case 3:
        return "CLOSED";
      default:
        return "UNKNOWN";
    }
  };

  const getUptime = () => {
    const uptime = Date.now() - startTime.current;
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };


  const documentId = provider?.doc?.guid || "unknown";

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
      {/* Header with toggle */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
          👥 Collaborators ({onlineUserIds.size} online)
        </h3>
        <button
          onClick={() => setShowDebugDetails(!showDebugDetails)}
          className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
        >
          {showDebugDetails ? "Hide Debug" : "Show Debug"}
        </button>
      </div>

      {/* Quick Status Overview */}
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="text-center">
          <div
            className={`text-lg font-bold ${connected ? "text-green-600" : "text-red-600"}`}
          >
            {connected ? "🟢" : "🔴"}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {connected ? "Connected" : "Disconnected"}
          </div>
        </div>

        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">
            {awarenessUsers.length}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Online Now
          </div>
        </div>

        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">
            {collaborators.length}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Total Collaborators
          </div>
        </div>

        <div className="text-center">
          <div className="text-lg font-bold text-orange-600">
            {reconnectCount}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Reconnects
          </div>
        </div>
      </div>

      {/* Current User */}
      <div className="mb-4 rounded border bg-white p-3 dark:bg-slate-700">
        <div className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          You:
        </div>
        <div className="flex items-center gap-3">
          {currentUser.avatarUrl ? (
            <div className="h-8 w-8 rounded-full border-2 border-green-500" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-500 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="font-medium text-slate-800 dark:text-slate-200">
              {currentUser.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {currentUser.email}
            </div>
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            {connected ? "🟢 Online" : "🔴 Offline"}
          </div>
        </div>
      </div>

      {/* Live Awareness Users (from Yjs) */}
      {awarenessUsers.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Live Users ({awarenessUsers.length}):
          </div>
          <div className="space-y-2">
            {awarenessUsers.map(([clientId, state]) => {
              const user = state.user || {};
              const isCurrentUser = user.id === currentUser.id;

              return (
                <div
                  key={clientId}
                  className={`flex items-center gap-3 rounded p-2 ${
                    isCurrentUser
                      ? "border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                      : "bg-white dark:bg-slate-700"
                  }`}
                >
                  {user.avatarUrl ? (
                    <div className="h-6 w-6 rounded-full border border-slate-300" />
                  ) : (
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs text-white"
                      style={{
                        backgroundColor: state.cursorColor || "#3b82f6",
                      }}
                    >
                      {user.name ? user.name.charAt(0).toUpperCase() : clientId}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {user.name || `Anonymous ${clientId}`}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {user.role || "Unknown"} • {user.email || "No email"} •
                      Client {clientId}
                    </div>
                  </div>

                  <div className="text-xs text-green-600 dark:text-green-400">
                    🟢 Active
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Document Collaborators (when no awareness users or as fallback) */}
      {collaborators.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Document Access ({collaborators.length}):
          </div>
          <div className="space-y-1">
            {collaborators.map(collab => {
              const isOnline = onlineUserIds.has(collab.user.id);
              return (
                <div
                  key={collab.user.id}
                  className={`flex items-center gap-3 rounded bg-white p-2 dark:bg-slate-700 ${
                    !isOnline ? "opacity-60" : ""
                  }`}
                >
                  {collab.user.avatarUrl ? (
                    <div
                      className={`h-5 w-5 rounded-full border border-slate-300 ${
                        !isOnline ? "grayscale" : ""
                      }`}
                    />
                  ) : (
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-full text-xs text-white"
                      style={{
                        backgroundColor: isOnline
                          ? collab.cursorColor || "#3b82f6"
                          : "#64748b",
                      }}
                    >
                      {collab.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1">
                    <div
                      className={`text-sm ${
                        isOnline
                          ? "font-medium text-slate-800 dark:text-slate-200"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {collab.user.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {collab.role} • {isOnline ? "Online" : "Offline"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Debug Details (collapsed by default) */}
      {showDebugDetails && (
        <div className="space-y-4 border-t pt-4">
          <div>
            <div className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              Technical Details:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                WebSocket:{" "}
                <span className="font-mono">
                  {getWebSocketStateText(wsReadyState)}
                </span>
              </div>
              <div>
                Uptime: <span className="font-mono">{getUptime()}</span>
              </div>
              <div>
                Document ID:{" "}
                <span className="break-all font-mono">
                  {documentId.slice(0, 8)}...
                </span>
              </div>
              <div>
                Y.js Clients:{" "}
                <span className="font-mono">{yjsClients.size}</span>
              </div>
              <div>
                Awareness:{" "}
                <span className="font-mono">{awarenessUsers.length}</span>
              </div>
              <div>
                WS URL:{" "}
                <span className="break-all font-mono">
                  {websocketUrl || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Connection History */}
          {connectionHistory.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                Connection History ({connectionHistory.length}):
              </div>
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {connectionHistory.slice(-5).map((event, index) => (
                  <div
                    key={index}
                    className="rounded bg-slate-100 p-1 text-xs dark:bg-slate-600"
                  >
                    <span className="font-mono">
                      {event.timestamp.toLocaleTimeString()}
                    </span>{" "}
                    <span
                      className={`font-medium ${
                        event.type === "connect"
                          ? "text-green-600"
                          : event.type === "error"
                            ? "text-red-600"
                            : "text-orange-600"
                      }`}
                    >
                      {event.type.toUpperCase()}
                    </span>
                    : {event.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Awareness Data */}
          {awarenessUsers.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                Raw Y.js Awareness ({awarenessUsers.length}):
              </div>
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {awarenessUsers.map(([clientId, state]) => (
                  <div
                    key={clientId}
                    className="rounded bg-slate-100 p-1 font-mono text-xs dark:bg-slate-600"
                  >
                    <div className="font-semibold">Client {clientId}:</div>
                    <div className="ml-2 text-xs text-slate-600 dark:text-slate-400">
                      {JSON.stringify(state, null, 2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
