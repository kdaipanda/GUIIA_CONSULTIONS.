import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fetchNotifications } from "../../lib/clinicApi";
import {
  isNotificationRead,
  markNotificationRead,
  markNotificationsRead,
} from "../../lib/notificationReadState";
import { dispatchOpenSupport } from "../../lib/supportReadState";

export function NotificationBell({ veterinarianId, onNavigate }) {
  const { t, i18n } = useTranslation("clinic");
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);
  const locale = (i18n.language || "es").startsWith("en") ? "en-US" : "es-MX";

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
    const handleKeyDown = (event) => {
      if (open && event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
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
  const panelId = "clinic-notification-panel";

  return (
    <div className="notification-bell-wrap">
      <button
        type="button"
        ref={toggleRef}
        onClick={handleToggle}
        className="icon-btn notification-bell-btn"
        aria-label={
          open
            ? t("notifications.closeAria")
            : unread > 0
              ? t("notifications.openAriaUnread", { count: unread })
              : t("notifications.openAria")
        }
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
      >
        <Bell size={18} aria-hidden />
        {unread > 0 && (
          <span className="notification-badge" aria-hidden>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          className="notification-panel notification-panel-floating"
          role="dialog"
          aria-label={t("notifications.title")}
        >
          <div className="notification-panel-header">
            <h3>{t("notifications.title")}</h3>
          </div>
          {loading ? (
            <div className="notification-empty" role="status">
              {t("notifications.loading")}
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">{t("notifications.empty")}</div>
          ) : (
            <div className="notification-panel-body" role="list">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  role="listitem"
                  tabIndex={0}
                  onClick={() => markRead(notif)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      markRead(notif);
                    }
                  }}
                  className={`notification-item${notif.read ? "" : " unread"}`}
                >
                  <div className="notification-title">{notif.title}</div>
                  <div className="notification-description">{notif.description}</div>
                  <div className="notification-timestamp">
                    {new Date(notif.timestamp).toLocaleString(locale)}
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
