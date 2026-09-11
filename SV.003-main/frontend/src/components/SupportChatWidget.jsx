import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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

const PLUMITAS_FLYING_SRC = "/brand/doctor-plumitas-flying-cutout.png";

const LANDING_VIEWS = new Set(["landing"]);
const AUTH_VIEWS = new Set(["login", "register", "cedula-verification"]);

function formatTicketDate(iso, locale) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(locale?.startsWith("es") ? "es-MX" : "en-US", {
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
  const { t, i18n } = useTranslation("clinic");
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
  const [messages, setMessages] = useState([]);
  const [ticketSummary, setTicketSummary] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [ticketDetailLoading, setTicketDetailLoading] = useState(false);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketReplySending, setTicketReplySending] = useState(false);
  const listRef = useRef(null);
  const ticketThreadRef = useRef(null);

  const statusLabel = useCallback(
    (status) => t(`supportWidget.status.${status}`, { defaultValue: status }),
    [t],
  );

  useEffect(() => {
    setMessages([{ role: "assistant", content: t("supportWidget.greeting") }]);
  }, [t, i18n.language]);

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
        setTicketDone(err.message || t("supportWidget.errors.ticketLoadFailed"));
      } finally {
        setTicketDetailLoading(false);
      }
    },
    [veterinarian?.id, refreshSummary, t],
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
        const detail = data?.detail || t("supportWidget.errors.noAnswer");
        throw new Error(typeof detail === "string" ? detail : t("supportWidget.errors.generic"));
      }

      const answer =
        (data?.answer || "").toString().trim() ||
        t("supportWidget.errors.emptyAnswer");
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err?.message || t("supportWidget.errors.connection"),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!veterinarian?.id) {
      setTicketDone(t("supportWidget.errors.loginRequired"));
      return;
    }
    const subject = ticketSubject.trim();
    const message = ticketMessage.trim();
    if (subject.length < 3 || message.length < 5) {
      setTicketDone(t("supportWidget.errors.ticketFields"));
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
      setTicketDone(t("supportWidget.errors.ticketCreated"));
      setTicketSubject("");
      setTicketMessage("");
      setShowTicketForm(false);
      setActiveTab("tickets");
      const newId = data?.ticket?.id;
      if (newId) setSelectedTicketId(newId);
      await refreshSummary();
    } catch (err) {
      setTicketDone(err.message || t("supportWidget.errors.ticketCreateFailed"));
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
      setTicketDone(err.message || t("supportWidget.errors.messageFailed"));
    } finally {
      setTicketReplySending(false);
    }
  };

  const ticketClosed =
    (ticketDetail?.status || "").toLowerCase() === "closed";

  const rootClass = [
    "support-chat-root",
    LANDING_VIEWS.has(currentView) ? "support-chat-root--landing" : "",
    AUTH_VIEWS.has(currentView) ? "support-chat-root--auth" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      {isOpen && (
        <div className="support-chat-panel">
          <div className="support-chat-header">
            <strong>{t("supportWidget.header")}</strong>
            <button type="button" onClick={() => setIsOpen(false)} aria-label={t("supportWidget.closeChat")}>
              ✕
            </button>
          </div>

          <div className="support-chat-tabs">
            <button
              type="button"
              className={activeTab === "chat" ? "active" : ""}
              onClick={() => setActiveTab("chat")}
            >
              {t("supportWidget.tabChat")}
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
              {t("supportWidget.tabTickets")}
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
                {isSending && <div className="support-chat-typing">{t("supportWidget.typing")}</div>}
              </div>
              <div className="support-chat-input-row">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  placeholder={t("supportWidget.inputPlaceholder")}
                  maxLength={500}
                />
                <button type="button" onClick={handleSend} disabled={isSending || !input.trim()}>
                  {t("supportWidget.send")}
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
                    {t("supportWidget.createTicket")}
                  </button>
                ) : (
                  <form onSubmit={handleCreateTicket} className="support-chat-ticket-form">
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder={t("supportWidget.ticketSubject")}
                      maxLength={200}
                    />
                    <textarea
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder={t("supportWidget.ticketMessage")}
                      rows={3}
                      maxLength={2000}
                    />
                    <div className="support-chat-ticket-actions">
                      <button type="submit" disabled={ticketSending}>
                        {ticketSending ? t("supportWidget.ticketSending") : t("supportWidget.ticketSend")}
                      </button>
                      <button
                        type="button"
                        className="support-chat-ticket-cancel"
                        onClick={() => setShowTicketForm(false)}
                      >
                        {t("supportWidget.cancel")}
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
                      {t("supportWidget.loginForTickets")}
                    </p>
                  ) : ticketSummary.length === 0 ? (
                    <p className="support-chat-tickets-empty">
                      {t("supportWidget.noTickets")}
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
                                {statusLabel(ticket.status)}
                                {ticket.updated_at
                                  ? ` · ${formatTicketDate(ticket.updated_at, i18n.language)}`
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
                    {t("supportWidget.back")}
                  </button>
                  {ticketDetailLoading ? (
                    <p className="support-chat-tickets-empty">{t("supportWidget.loading")}</p>
                  ) : ticketDetail ? (
                    <>
                      <div className="support-chat-ticket-detail-head">
                        <h4>{ticketDetail.subject}</h4>
                        <span className={`support-chat-status support-chat-status-${ticketDetail.status}`}>
                          {statusLabel(ticketDetail.status)}
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
                                ? t("supportWidget.supportLabel")
                                : msg.author_role === "user"
                                  ? t("supportWidget.you")
                                  : t("supportWidget.assistant")}
                            </span>
                            <p>{msg.body}</p>
                            <time>{formatTicketDate(msg.created_at, i18n.language)}</time>
                          </div>
                        ))}
                      </div>
                      {!ticketClosed && (
                        <form onSubmit={handleTicketReply} className="support-chat-ticket-reply">
                          <textarea
                            value={ticketReply}
                            onChange={(e) => setTicketReply(e.target.value)}
                            placeholder={t("supportWidget.replyPlaceholder")}
                            rows={2}
                            maxLength={2000}
                          />
                          <button
                            type="submit"
                            disabled={ticketReplySending || ticketReply.trim().length < 2}
                          >
                            {ticketReplySending ? t("supportWidget.ticketSending") : t("supportWidget.send")}
                          </button>
                        </form>
                      )}
                    </>
                  ) : (
                    <p className="support-chat-tickets-empty">{t("supportWidget.ticketNotFound")}</p>
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
        className={`support-chat-toggle${isOpen ? " is-open" : ""}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? t("supportWidget.closeSupport") : t("supportWidget.openSupport")}
      >
        {isOpen ? (
          <span className="support-chat-toggle-close" aria-hidden>
            ✕
          </span>
        ) : (
          <>
            <img
              src={PLUMITAS_FLYING_SRC}
              alt=""
              className="support-chat-plumitas"
              width={80}
              height={80}
              decoding="async"
            />
            <span className="support-chat-plumitas-hint">{t("supportWidget.helpHint")}</span>
            {unreadCount > 0 && (
              <span className="support-chat-toggle-badge">{unreadCount}</span>
            )}
          </>
        )}
      </button>
    </div>
  );
}
