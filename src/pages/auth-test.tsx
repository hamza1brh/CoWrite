import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function AuthTest() {
  const { data: session, status } = useSession();
  const [debugData, setDebugData] = useState<any>(null);

  useEffect(() => {
    // Fetch debug data
    fetch("/api/debug-session")
      .then(res => res.json())
      .then(data => setDebugData(data))
      .catch(err => console.error("Debug fetch error:", err));
  }, [session]);

  if (status === "loading") return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Authentication Test Page</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>Session Status: {status}</h2>
        {session ? (
          <div>
            <p>✅ Logged in as: {session.user?.email}</p>
            <p>User ID: {session.user?.id}</p>
            <p>Name: {session.user?.name}</p>
            <button onClick={() => signOut()}>Sign out</button>
          </div>
        ) : (
          <div>
            <p>❌ Not logged in</p>
            <button onClick={() => signIn("google")}>
              Sign in with Google
            </button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h2>Debug Data:</h2>
        <pre
          style={{ background: "#f5f5f5", padding: "10px", overflow: "auto" }}
        >
          {JSON.stringify(debugData, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h2>Environment Check:</h2>
        <p>NEXTAUTH_URL: {process.env.NEXTAUTH_URL || "Not set"}</p>
        <p>
          Google Client ID:{" "}
          {process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Not set"}
        </p>
        <p>
          Google Secret:{" "}
          {process.env.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Not set"}
        </p>
      </div>
    </div>
  );
}
