import { markAdminMessageRead } from "./supportReadState";

const MAX_READ_IDS = 500;

export function notifReadStorageKey(vetId) {
  return `guiaa_notif_read_${vetId}`;
}

function loadReadIdSet(vetId) {
  if (!vetId) return new Set();
  try {
    const raw = localStorage.getItem(notifReadStorageKey(vetId));
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set((Array.isArray(parsed) ? parsed : []).map(String));
  } catch {
    return new Set();
  }
}

function saveReadIdSet(vetId, ids) {
  if (!vetId) return;
  try {
    const list = [...ids].slice(-MAX_READ_IDS);
    localStorage.setItem(notifReadStorageKey(vetId), JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/** Claves estables para que "leído" sobreviva a cambios de título/urgencia en el backend. */
export function notificationReadKeys(notif) {
  const keys = new Set();
  if (!notif) return keys;

  const id = notif.id != null ? String(notif.id) : "";
  if (id) keys.add(id);

  const relatedId = notif.related_id != null ? String(notif.related_id) : "";
  if (!relatedId) return keys;

  if (notif.action === "agenda" && relatedId) {
    keys.add(`appt-${relatedId}`);
    keys.add(`appt-today-${relatedId}`);
    keys.add(`appt-urgent-${relatedId}`);
    keys.add(`appt-tomorrow-${relatedId}`);
  }
  if (notif.action === "inventory" && id.startsWith("stock-")) {
    keys.add(`stock-${relatedId}`);
  }
  if (id.startsWith("req-")) {
    keys.add(`req-${relatedId}`);
  }
  if (notif.action === "admin-support" && relatedId) {
    keys.add(`admin-support-${relatedId}`);
    keys.add(`admin-support-open-${relatedId}`);
    keys.add(`admin-support-user-${relatedId}`);
  }
  if (id.startsWith("support-resolved-")) {
    keys.add(`support-resolved-${relatedId}`);
  }

  return keys;
}

export function isNotificationRead(vetId, notif) {
  const read = loadReadIdSet(vetId);
  for (const key of notificationReadKeys(notif)) {
    if (read.has(key)) return true;
  }
  return false;
}

export function markNotificationRead(vetId, notif) {
  if (!vetId || !notif) return;

  const read = loadReadIdSet(vetId);
  for (const key of notificationReadKeys(notif)) {
    read.add(key);
  }

  const id = notif.id != null ? String(notif.id) : "";
  if (id.startsWith("support-msg-")) {
    markAdminMessageRead(vetId, id.slice("support-msg-".length));
  }

  saveReadIdSet(vetId, read);
}

export function markNotificationsRead(vetId, notifications) {
  if (!vetId || !notifications?.length) return;
  const read = loadReadIdSet(vetId);
  for (const notif of notifications) {
    for (const key of notificationReadKeys(notif)) {
      read.add(key);
    }
    const id = notif.id != null ? String(notif.id) : "";
    if (id.startsWith("support-msg-")) {
      markAdminMessageRead(vetId, id.slice("support-msg-".length));
    }
  }
  saveReadIdSet(vetId, read);
}
