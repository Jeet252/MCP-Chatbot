import React, { useState } from "react";
import { Send, Terminal, Bot, User } from "lucide-react";

interface Message {
  sender: "user" | "bot";
  text: string;
  toolsUsed?: Array<{ tool: string; args: any; result: any }>;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.text,
          toolsUsed: data.executedTools,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Failed to communicate with backend." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>MCP Interactive Studio</h2>
      </header>

      <div style={styles.chatArea}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.messageWrapper,
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                ...styles.bubble,
                backgroundColor: msg.sender === "user" ? "#2563eb" : "#1e293b",
              }}
            >
              <div style={styles.senderHeader}>
                {msg.sender === "user" ? <User size={16} /> : <Bot size={16} />}
                <strong>{msg.sender === "user" ? "You" : "Gemini + MCP"}</strong>
              </div>

              {/* Tool Execution Logs */}
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div style={styles.toolBadgeBox}>
                  {msg.toolsUsed.map((t, idx) => (
                    <div key={idx} style={styles.toolBadge}>
                      <Terminal size={14} />
                      <span>
                        Executed <code>{t.tool}</code>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <p style={{ margin: "8px 0 0 0", whiteSpace: "pre-wrap" }}>{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && <div style={{ color: "#94a3b8" }}>Executing MCP tools...</div>}
      </div>

      <form onSubmit={sendMessage} style={styles.inputForm}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or invoke a tool..."
          style={styles.input}
        />
        <button type="submit" style={styles.button} disabled={loading}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    padding: "1rem 2rem",
    borderBottom: "1px solid #334155",
    backgroundColor: "#1e293b",
  },
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  messageWrapper: { display: "flex", width: "100%" },
  bubble: {
    maxWidth: "70%",
    padding: "1rem",
    borderRadius: "8px",
    lineHeight: "1.5",
  },
  senderHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.85rem",
    color: "#94a3b8",
  },
  toolBadgeBox: { display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "8px" },
  toolBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "#0f172a",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "0.8rem",
    color: "#38bdf8",
  },
  inputForm: {
    display: "flex",
    padding: "1rem",
    borderTop: "1px solid #334155",
    backgroundColor: "#1e293b",
    gap: "0.5rem",
  },
  input: {
    flex: 1,
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #475569",
    backgroundColor: "#0f172a",
    color: "#fff",
    outline: "none",
  },
  button: {
    padding: "0.75rem 1.25rem",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer",
  },
};