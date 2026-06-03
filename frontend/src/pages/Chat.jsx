import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setToken } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  function handleProtectedError(e, fallback) {
    const status = e.response?.status;
    if (status === 401) {
      setToken(null);
      navigate("/login");
      return null;
    }
    if (status === 403) return "Accès interdit (403).";
    if (status === 404) return "Conversation introuvable (404).";
    return e.response?.data?.error || fallback;
  }

  function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  }

  async function openConversation(id) {
    if (!id) return;
    setErr("");
    setActiveId(id);
    setLoadingMessages(true);
    try {
      const res = await api.get(`/conversations/${id}`);
      const msgs = Array.isArray(res.data) ? res.data : (res.data.messages || []);
      setMessages(msgs);
    } catch (e) {
      const message = handleProtectedError(e, "Erreur chargement conversation");
      if (message) setErr(message);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function loadConversations(preferredId = null) {
    setErr("");
    setLoadingConversations(true);
    try {
      const res = await api.get("/conversations");
      const list = Array.isArray(res.data) ? res.data : [];
      setConversations(list);

      if (list.length === 0) {
        setActiveId(null);
        setMessages([]);
        return;
      }

      const hasActive = list.some((c) => c.id === activeId);
      const nextId = preferredId || (hasActive ? activeId : list[0].id);
      await openConversation(nextId);
    } catch (e) {
      const message = handleProtectedError(e, "Erreur chargement inbox");
      if (message) setErr(message);
      setConversations([]);
      setActiveId(null);
      setMessages([]);
    } finally {
      setLoadingConversations(false);
    }
  }

  async function send() {
    if (!text.trim() || !activeId) return;

    setErr("");
    try {
      await api.post(`/conversations/${activeId}/messages`, {
        content: text.trim(),
      });
      setText("");
      await loadConversations(activeId);
    } catch (e) {
      const message = handleProtectedError(e, "Erreur envoi message");
      if (message) setErr(message);
    }
  }

  useEffect(() => {
    loadConversations(location.state?.conversationId || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cid = location.state?.conversationId;
    if (cid) openConversation(cid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.conversationId]);

  return (
    <Layout>
      <h2 style={{ marginTop: 0 }}>Messagerie</h2>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
        <div style={{ background: "white", border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
          {loadingConversations ? (
            <div style={{ padding: 12, color: "#666" }}>Chargement des conversations…</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 12, color: "#666" }}>Aucune conversation.</div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => openConversation(c.id)}
                style={{
                  padding: 12,
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                  background: activeId === c.id ? "#f6f6f6" : "white",
                  fontWeight: activeId === c.id ? 900 : 700,
                }}
              >
                <div style={{ marginBottom: 4 }}>{c.ad?.title || `Conversation #${c.id}`}</div>
                <div style={{ color: "#666", fontSize: 13, fontWeight: 500 }}>
                  {c.lastMessage
                    ? `${c.lastMessage.sender?.pseudo || "Utilisateur"}: ${c.lastMessage.content}`
                    : "Aucun message"}
                </div>
                <div style={{ color: "#999", fontSize: 12, marginTop: 4 }}>
                  {formatDate(c.lastMessage?.createdAt || c.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ background: "white", border: "1px solid #eee", borderRadius: 14, padding: 12 }}>
          {!activeId ? (
            <p style={{ color: "#666" }}>Sélectionne une conversation.</p>
          ) : (
            <>
              <div style={{ minHeight: 240 }}>
                {loadingMessages ? (
                  <p style={{ color: "#666" }}>Chargement des messages…</p>
                ) : messages.length === 0 ? (
                  <p style={{ color: "#666" }}>Aucun message.</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} style={{ marginBottom: 10 }}>
                      <b>{m.sender?.pseudo || "User"}:</b> {m.content}
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Écrire un message…"
                  style={{ flex: 1, padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                />
                <button
                  onClick={send}
                  disabled={!text.trim() || !activeId}
                  style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #111", background: "#111", color: "white", fontWeight: 800 }}
                >
                  Envoyer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
