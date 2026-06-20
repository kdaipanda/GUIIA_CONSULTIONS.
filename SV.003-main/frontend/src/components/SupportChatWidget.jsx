import React, { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useVet } from "../context/VetContext";
import { BACKEND_URL } from "../lib/backendUrl";
import {
  createSupportTicket,
  fetchMySupportTicket,
  fetchMySupportTicketsSummary,
  addUserSupportMessage,
} from "../lib/clinicApi";
import {
  countUnreadFromTickets,
  markTicketMessagesRead,
  SUPPORT_OPEN_EVENT,
} from "../lib/supportReadState";

const STATUS_LABELS = {
  open: "Abierto",
  in_progress: "En progreso",
  resolved: "Resuelto",
  closed: "Cerrado",
};

const INITIAL_CHAT = [
  {
    role: "assistant",
    content:
      "Hola, soy tu asistente de soporte GUIAA. Te ayudo con dudas de login, pagos, membresía, cédula y uso de la plataforma.",
  },
];

function formatTicketDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function SupportChatWidget({ currentView }) {
  const { veterinarian } = useVet();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSending, setTicketSending] = useState(false);
  const [ticketDone, setTicketDone] = useState("");
  const [messages, setMessages] = useState(INITIAL_CHAT);
  const [ticketSummary, setTicketSummary] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [ticketDetailLoading, setTicketDetailLoading] = useState(false);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketReplySending, setTicketReplySending] = useState(false);
  const listRef = useRef(null);
  const ticketThreadRef = useRef(null);

  const refreshSummary = useCallback(async () => {
    if (!veterinarian?.id) {
      setTicketSummary([]);
      setUnreadCount(0);
      return;
    }
    try {
      const data = await fetchMySupportTicketsSummary(veterinarian.id);
      const tickets = data.tickets || [];
      setTicketSummary(tickets);
      setUnreadCount(countUnreadFromTickets(tickets, veterinarian.id));
    } catch {
      /* ignore polling errors */
    }
  }, [veterinarian?.id]);

  useEffect(() => {
    refreshSummary();
    const interval = setInterval(refreshSummary, 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshSummary]);

  useEffect(() => {
    const handler = (event) => {
      setIsOpen(true);
      setActiveTab("tickets");
      const ticketId = event.detail?.ticketId;
      if (ticketId) setSelectedTicketId(ticketId);
    };
    window.addEventListener(SUPPORT_OPEN_EVENT, handler);
    return () => window.removeEventListener(SUPPORT_OPEN_EVENT, handler);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen, activeTab]);

  useEffect(() => {
    if (ticketThreadRef.current) {
      ticketThreadRef.current.scrollTop = ticketThreadRef.current.scrollHeight;
    }
  }, [ticketDetail, isOpen]);

  const loadTicketDetail = useCallback(
    async (ticketId) => {
      if (!veterinarian?.id || !ticketId) return;
      setTicketDetailLoading(true);
      try {
        const data = await fetchMySupportTicket(veterinarian.id, ticketId);
        const ticket = data.ticket || null;
        setTicketDetail(ticket);
        if (ticket?.messages?.length) {
          markTicketMessagesRead(veterinarian.id, ticket.messages);
          await refreshSummary();
        }
      } catch (err) {
        setTicketDetail(null);
        setTicketDone(err.message || "No se pudo cargar el ticket.");
      } finally {
        setTicketDetailLoading(false);
      }
    },
    [veterinarian?.id, refreshSummary],
  );

  useEffect(() => {
    if (selectedTicketId && activeTab === "tickets") {
      loadTicketDetail(selectedTicketId);
    }
  }, [selectedTicketId, activeTab, loadTicketDetail]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/support/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context_view: currentView,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const raw = await response.text().catch(() => "");
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (e) {
        /* ignore */
      }

      if (!response.ok) {
        const detail = data?.detail || "No pude responder en este momento.";
        throw new Error(typeof detail === "string" ? detail : "Error de soporte");
      }

      const answer =
        (data?.answer || "").toString().trim() ||
        "No pude generar una respuesta por ahora.";
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err?.message ||
            "No pude conectar con soporte. Inténtalo de nuevo en unos segundos.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!veterinarian?.id) {
      setTicketDone("Inicia sesión para enviar un ticket a soporte.");
      return;
    }
    const subject = ticketSubject.trim();
    const message = ticketMessage.trim();
    if (subject.length < 3 || message.length < 5) {
      setTicketDone("Completa asunto (mín. 3) y mensaje (mín. 5 caracteres).");
      return;
    }
    setTicketSending(true);
    setTicketDone("");
    try {
      const data = await createSupportTicket(veterinarian.id, {
        subject,
        message,
        context_view: currentView,
        chat_history: messages.map((m) => ({ role: m.role, content: m.content })),
      });
      setTicketDone("Ticket enviado. El equipo de soporte te responderá pronto.");
      setTicketSubject("");
      setTicketMessage("");
      setShowTicketForm(false);
      setActiveTab("tickets");
      const newId = data?.ticket?.id;
      if (newId) setSelectedTicketId(newId);
      await refreshSummary();
    } catch (err) {
      setTicketDone(err.message || "No se pudo crear el ticket.");
    } finally {
      setTicketSending(false);
    }
  };

  const handleTicketReply = async (e) => {
    e.preventDefault();
    const text = ticketReply.trim();
    if (!text || !selectedTicketId || !veterinarian?.id || ticketReplySending) return;
    setTicketReplySending(true);
    try {
      await addUserSupportMessage(veterinarian.id, selectedTicketId, text);
      setTicketReply("");
      await loadTicketDetail(selectedTicketId);
      await refreshSummary();
    } catch (err) {
      setTicketDone(err.message || "No se pudo enviar el mensaje.");
    } finally {
      setTicketReplySending(false);
    }
  };

  const ticketClosed =
    (ticketDetail?.status || "").toLowerCase() === "closed";

  return (
    <div className="support-chat-root">
      {isOpen && (
        <div className="support-chat-panel">
          <div className="support-chat-header">
            <strong>Soporte GUIAA</strong>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar chat">
              ✕
            </button>
          </div>

          <div className="support-chat-tabs">
            <button
              type="button"
              className={activeTab === "chat" ? "active" : ""}
              onClick={() => setActiveTab("chat")}
            >
              Chat
            </button>
            <button
              type="button"
              className={activeTab === "tickets" ? "active" : ""}
              onClick={() => {
                setActiveTab("tickets");
                setSelectedTicketId(null);
                setTicketDetail(null);
              }}
            >
              Mis tickets
              {unreadCount > 0 && (
                <span className="support-chat-tab-badge">{unreadCount}</span>
              )}
            </button>
          </div>

          {activeTab === "chat" ? (
            <>
              <div className="support-chat-messages" ref={listRef}>
                {messages.map((msg, idx) => (
                  <div
                    key={`${msg.role}-${idx}`}
                    className={`support-chat-bubble ${msg.role === "user" ? "user" : "assistant"}`}
                  >
                    {msg.content}
                  </div>
                ))}
                {isSending && <div className="support-chat-typing">Escribiendo...</div>}
              </div>
              <div className="support-chat-input-row">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  placeholder="Escribe tu duda..."
                  maxLength={500}
                />
                <button type="button" onClick={handleSend} disabled={isSending || !input.trim()}>
                  Enviar
                </button>
              </div>
              <div className="support-chat-human">
                {!showTicketForm ? (
                  <button
                    type="button"
                    className="support-chat-human-toggle"
                    onClick={() => {
                      setShowTicketForm(true);
                      setTicketDone("");
                    }}
                  >
                    ¿No resolviste tu duda? Crear ticket
                  </button>
                ) : (
                  <form onSubmit={handleCreateTicket} className="support-chat-ticket-form">
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Asunto del ticket"
                      maxLength={200}
                    />
                    <textarea
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Describe tu duda o problema..."
                      rows={3}
                      maxLength={2000}
                    />
                    <div className="support-chat-ticket-actions">
                      <button type="submit" disabled={ticketSending}>
                        {ticketSending ? "Enviando..." : "Enviar ticket"}
                      </button>
                      <button
                        type="button"
                        className="support-chat-ticket-cancel"
                        onClick={() => setShowTicketForm(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
                {ticketDone && activeTab === "chat" && (
                  <p className="support-chat-ticket-msg">{ticketDone}</p>
                )}
              </div>
            </>
          ) : (
            <div className="support-chat-tickets">
              {!selectedTicketId ? (
                <>
                  {!veterinarian?.id ? (
                    <p className="support-chat-tickets-empty">
                      Inicia sesión para ver tus tickets de soporte.
                    </p>
                  ) : ticketSummary.length === 0 ? (
                    <p className="support-chat-tickets-empty">
                      Aún no tienes tickets. Usa el chat o crea uno desde la pestaña Chat.
                    </p>
                  ) : (
                    <ul className="support-chat-ticket-list">
                      {ticketSummary.map((ticket) => {
                        const unread =
                          ticket.last_admin_message_id &&
                          countUnreadFromTickets([ticket], veterinarian.id) > 0;
                        return (
                          <li key={ticket.id}>
                            <button
                              type="button"
                              className={`support-chat-ticket-item${unread ? " unread" : ""}`}
                              onClick={() => setSelectedTicketId(ticket.id)}
                            >
                              <span className="support-chat-ticket-item-top">
                                <strong>{ticket.subject}</strong>
                                {unread && <span className="support-chat-item-dot" />}
                              </span>
                              <span className="support-chat-ticket-item-meta">
                                {STATUS_LABELS[ticket.status] || ticket.status}
                                {ticket.updated_at
                                  ? ` · ${formatTicketDate(ticket.updated_at)}`
                                  : ""}
                              </span>
                              {ticket.last_admin_preview && (
                                <span className="support-chat-ticket-item-preview">
                                  {ticket.last_admin_preview}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              ) : (
                <div className="support-chat-ticket-detail">
                  <button
                    type="button"
                    className="support-chat-back"
                    onClick={() => {
                      setSelectedTicketId(null);
                      setTicketDetail(null);
                      setTicketDone("");
                    }}
                  >
                    ← Volver
                  </button>
                  {ticketDetailLoading ? (
                    <p className="support-chat-tickets-empty">Cargando...</p>
                  ) : ticketDetail ? (
                    <>
                      <div className="support-chat-ticket-detail-head">
                        <h4>{ticketDetail.subject}</h4>
                        <span className={`support-chat-status support-chat-status-${ticketDetail.status}`}>
                          {STATUS_LABELS[ticketDetail.status] || ticketDetail.status}
                        </span>
                      </div>
                      <div className="support-chat-ticket-thread" ref={ticketThreadRef}>
                        {(ticketDetail.messages || []).map((msg) => (
                          <div
                            key={msg.id}
                            className={`support-chat-thread-msg support-chat-thread-${msg.author_role}`}
                          >
                            <span className="support-chat-thread-label">
                              {msg.author_role === "admin"
                                ? "Soporte GUIAA"
                                : msg.author_role === "user"
                                  ? "Tú"
                                  : "Asistente"}
                            </span>
                            <p>{msg.body}</p>
                            <time>{formatTicketDate(msg.created_at)}</time>
                          </div>
                        ))}
                      </div>
                      {!ticketClosed && (
                        <form onSubmit={handleTicketReply} className="support-chat-ticket-reply">
                          <textarea
                            value={ticketReply}
                            onChange={(e) => setTicketReply(e.target.value)}
                            placeholder="Escribe tu respuesta..."
                            rows={2}
                            maxLength={2000}
                          />
                          <button
                            type="submit"
                            disabled={ticketReplySending || ticketReply.trim().length < 2}
                          >
                            {ticketReplySending ? "Enviando..." : "Enviar"}
                          </button>
                        </form>
                      )}
                    </>
                  ) : (
                    <p className="support-chat-tickets-empty">Ticket no encontrado.</p>
                  )}
                  {ticketDone && activeTab === "tickets" && (
                    <p className="support-chat-ticket-msg">{ticketDone}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        className="support-chat-toggle"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Cerrar soporte" : "Abrir soporte"}
      >
        {isOpen ? (
          "–"
        ) : (
          <>
            <MessageCircle size={22} aria-hidden />
            {unreadCount > 0 && (
              <span className="support-chat-toggle-badge">{unreadCount}</span>
            )}
          </>
        )}
      </button>
    </div>
  );
}
