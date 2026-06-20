import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { fetchNotifications } from "../../lib/clinicApi";
import { dispatchOpenSupport } from "../../lib/supportReadState";

function readStorageKey(vetId) {
  return `guiaa_notif_read_${vetId}`;
}

function loadReadIds(vetId) {
  try {
    const raw = localStorage.getItem(readStorageKey(vetId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReadIds(vetId, ids) {
  try {
    localStorage.setItem(readStorageKey(vetId), JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function NotificationBell({ veterinarianId, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);

  const load = useCallback(async () => {
    if (!veterinarianId) return;
    setLoading(true);
    try {
      const data = await fetchNotifications(veterinarianId);
      const readIds = new Set(loadReadIds(veterinarianId));
      setNotifications(
        (data.notifications || []).map((n) => ({
          ...n,
          read: readIds.has(n.id),
        })),
      );
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [veterinarianId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!open) return;
      if (
        panelRef.current &&
        toggleRef.current &&
        !panelRef.current.contains(event.target) &&
        !toggleRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markRead = (id, action, relatedId) => {
    const readIds = loadReadIds(veterinarianId);
    if (!readIds.includes(id)) {
      saveReadIds(veterinarianId, [...readIds, id]);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setOpen(false);
    if (action === "support") {
      dispatchOpenSupport(relatedId);
      return;
    }
    if (action === "admin-support") {
      onNavigate?.("admin-support", relatedId);
      return;
    }
    if (action && onNavigate) {
      onNavigate(action);
    }
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="notification-bell-wrap">
      <button
        type="button"
        ref={toggleRef}
        onClick={() => setOpen((v) => !v)}
        className="icon-btn notification-bell-btn"
        aria-label={open ? "Cerrar notificaciones" : "Abrir notificaciones"}
        aria-expanded={open}
      >
        <Bell size={18} aria-hidden />
        {unread > 0 && <span className="notification-badge">{unread}</span>}
      </button>

      {open && (
        <div ref={panelRef} className="notification-panel notification-panel-floating">
          <div className="notification-panel-header">
            <h3>Notificaciones</h3>
          </div>
          {loading ? (
            <div className="notification-empty">Cargando...</div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">No hay notificaciones</div>
          ) : (
            <div className="notification-panel-body">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => markRead(notif.id, notif.action, notif.related_id)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && markRead(notif.id, notif.action, notif.related_id)
                  }
                  className={`notification-item ${notif.read ? "" : "unread"}`}
                >
                  <div className="notification-title">{notif.title}</div>
                  <div className="notification-description">{notif.description}</div>
                  <div className="notification-timestamp">
                    {new Date(notif.timestamp).toLocaleString("es-MX")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
