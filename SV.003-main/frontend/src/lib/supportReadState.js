export function supportReadStorageKey(vetId) {
  return `guiaa_support_read_${vetId}`;
}

export function loadReadAdminMessageIds(vetId) {
  if (!vetId) return new Set();
  try {
    const raw = localStorage.getItem(supportReadStorageKey(vetId));
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function markAdminMessageRead(vetId, messageId) {
  if (!vetId || !messageId) return;
  const ids = loadReadAdminMessageIds(vetId);
  ids.add(messageId);
  try {
    localStorage.setItem(supportReadStorageKey(vetId), JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function markTicketMessagesRead(vetId, messages) {
  if (!vetId || !messages?.length) return;
  const ids = loadReadAdminMessageIds(vetId);
  let changed = false;
  for (const msg of messages) {
    if (msg.author_role === "admin" && msg.id) {
      ids.add(msg.id);
      changed = true;
    }
  }
  if (changed) {
    try {
      localStorage.setItem(supportReadStorageKey(vetId), JSON.stringify([...ids]));
    } catch {
      /* ignore */
    }
  }
}

export function countUnreadFromTickets(tickets, vetId) {
  if (!vetId || !tickets?.length) return 0;
  const read = loadReadAdminMessageIds(vetId);
  return tickets.reduce((acc, ticket) => {
    const msgId = ticket.last_admin_message_id;
    return acc + (msgId && !read.has(msgId) ? 1 : 0);
  }, 0);
}

export const SUPPORT_OPEN_EVENT = "guiaa:open-support";

export function dispatchOpenSupport(ticketId) {
  window.dispatchEvent(
    new CustomEvent(SUPPORT_OPEN_EVENT, { detail: { ticketId: ticketId || null } }),
  );
}
