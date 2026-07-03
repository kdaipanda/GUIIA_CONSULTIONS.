import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { fetchNotifications } from "../../lib/clinicApi";
import {
  isNotificationRead,
  markNotificationRead,
  markNotificationsRead,
} from "../../lib/notificationReadState";
import { dispatchOpenSupport } from "../../lib/supportReadState";

export function NotificationBell({ veterinarianId, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);

  const withReadState = useCallback(
    (items) =>
      (items || []).map((n) => ({
        ...n,
        read: isNotificationRead(veterinarianId, n),
      })),
    [veterinarianId],
  );

  const load = useCallback(async () => {
    if (!veterinarianId) return;
    setLoading(true);
    try {
      const data = await fetchNotifications(veterinarianId);
      setNotifications(withReadState(data.notifications));
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [veterinarianId, withReadState]);

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

  const applyRead = useCallback(
    (items) => {
      markNotificationsRead(veterinarianId, items);
      setNotifications((prev) =>
        prev.map((n) => {
          const match = items.find((item) => item.id === n.id);
          return match ? { ...n, read: true } : n;
        }),
      );
    },
    [veterinarianId],
  );

  const handleToggle = () => {
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open || loading || !veterinarianId) return;
    const unreadItems = notifications.filter((n) => !n.read);
    if (unreadItems.length > 0) {
      applyRead(unreadItems);
    }
  }, [open, loading, veterinarianId, notifications, applyRead]);

  const markRead = (notif) => {
    markNotificationRead(veterinarianId, notif);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
    );
    setOpen(false);

    const { action, related_id: relatedId } = notif;
    if (action === "support") {
      dispatchOpenSupport(relatedId);
      return;
    }
    if (action === "admin-support") {
      onNavigate?.("admin-support", relatedId);
      return;
    }
    if (action && onNavigate) {
      onNavigate(action, relatedId);
    }
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="notification-bell-wrap">
      <button
        type="button"
        ref={toggleRef}
        onClick={handleToggle}
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
                  onClick={() => markRead(notif)}
                  onKeyDown={(e) => e.key === "Enter" && markRead(notif)}
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
