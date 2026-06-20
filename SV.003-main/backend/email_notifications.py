"""Notificaciones por email (tickets de soporte GUIAA)."""
from __future__ import annotations

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

try:
    import httpx
except ImportError:  # pragma: no cover
    httpx = None


def _frontend_url() -> str:
    return (
        os.getenv("FRONTEND_URL", "").strip()
        or os.getenv("PUBLIC_APP_URL", "").strip()
        or "http://localhost:3000"
    ).rstrip("/")


DEFAULT_SUPPORT_NOTIFY_EMAIL = "soporte@guiaa.vet"


def _mail_from() -> str:
    return (
        os.getenv("RESEND_FROM", "").strip()
        or os.getenv("SMTP_FROM", "").strip()
        or "GUIAA Soporte <soporte@guiaa.vet>"
    )


def _reply_to() -> Optional[str]:
    addr = os.getenv("RESEND_REPLY_TO", "").strip() or DEFAULT_SUPPORT_NOTIFY_EMAIL
    return addr or None


def support_notify_emails() -> List[str]:
    raw = os.getenv("SUPPORT_NOTIFY_EMAILS", "").strip()
    if not raw:
        return [DEFAULT_SUPPORT_NOTIFY_EMAIL]
    emails = [e.strip() for e in raw.split(",") if e.strip()]
    return emails or [DEFAULT_SUPPORT_NOTIFY_EMAIL]


def is_email_configured() -> bool:
    if os.getenv("RESEND_API_KEY", "").strip():
        return True
    host = os.getenv("SMTP_HOST", "").strip()
    from_addr = os.getenv("SMTP_FROM", "").strip()
    return bool(host and from_addr)


def get_email_config_status() -> dict:
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    if api_key:
        provider = "resend"
    elif smtp_host:
        provider = "smtp"
    else:
        provider = "none"
    return {
        "provider": provider,
        "configured": is_email_configured(),
        "resend_api_key_set": bool(api_key),
        "from_address": _mail_from(),
        "reply_to": _reply_to(),
        "support_notify_emails": support_notify_emails(),
        "frontend_url": _frontend_url(),
    }


def _send_resend(to_addrs: List[str], subject: str, html: str, text: str) -> Optional[str]:
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    if not api_key or httpx is None:
        return "Resend no configurado"
    from_addr = _mail_from()
    payload = {
        "from": from_addr,
        "to": to_addrs,
        "subject": subject,
        "html": html,
        "text": text,
    }
    reply_to = _reply_to()
    if reply_to:
        payload["reply_to"] = reply_to
    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15.0,
        )
        if response.status_code >= 400:
            return f"Resend {response.status_code}: {response.text[:300]}"
        try:
            data = response.json()
            msg_id = data.get("id")
            if msg_id:
                print(f"[EMAIL ok] Resend id={msg_id} -> {to_addrs}")
        except Exception:  # noqa: BLE001
            print(f"[EMAIL ok] Resend -> {to_addrs}")
        return None
    except Exception as exc:  # noqa: BLE001
        return str(exc)


def _send_smtp(to_addrs: List[str], subject: str, html: str, text: str) -> Optional[str]:
    host = os.getenv("SMTP_HOST", "").strip()
    from_addr = os.getenv("SMTP_FROM", "").strip()
    if not host or not from_addr:
        return "SMTP no configurado"

    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "").strip()
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("1", "true", "yes")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = ", ".join(to_addrs)
    msg.attach(MIMEText(text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        if use_tls:
            server = smtplib.SMTP(host, port, timeout=15)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
        if user and password:
            server.login(user, password)
        server.sendmail(from_addr, to_addrs, msg.as_string())
        server.quit()
        return None
    except Exception as exc:  # noqa: BLE001
        return str(exc)


def send_email(to_addrs: List[str], subject: str, html: str, text: str) -> Optional[str]:
    """Envía email. Devuelve mensaje de error o None si OK."""
    recipients = [e.strip() for e in to_addrs if e and e.strip()]
    if not recipients:
        return "Sin destinatarios"

    if os.getenv("RESEND_API_KEY", "").strip():
        err = _send_resend(recipients, subject, html, text)
        if not err:
            return None

    if os.getenv("SMTP_HOST", "").strip():
        return _send_smtp(recipients, subject, html, text)

    print(f"[EMAIL skip] {subject} -> {recipients}")
    return None


def notify_admins_new_ticket(ticket: dict, preview: str = "") -> None:
    admins = support_notify_emails()
    if not admins:
        return

    user_name = ticket.get("user_name") or "Usuario"
    user_email = ticket.get("user_email") or "—"
    subject_line = ticket.get("subject") or "Sin asunto"
    ticket_id = ticket.get("id") or ""
    priority = ticket.get("priority") or "normal"
    admin_url = f"{_frontend_url()}/app/admin"

    email_subject = f"[GUIAA Soporte] Nuevo ticket: {subject_line}"
    preview_text = (preview or "").strip()[:600]

    text = (
        f"Nuevo ticket de soporte en GUIAA\n\n"
        f"Usuario: {user_name} ({user_email})\n"
        f"Asunto: {subject_line}\n"
        f"Prioridad: {priority}\n"
        f"ID: {ticket_id}\n\n"
        f"Mensaje:\n{preview_text}\n\n"
        f"Ver en admin: {admin_url}\n"
    )
    html = f"""
    <h2>Nuevo ticket de soporte</h2>
    <p><strong>Usuario:</strong> {user_name} ({user_email})</p>
    <p><strong>Asunto:</strong> {subject_line}</p>
    <p><strong>Prioridad:</strong> {priority}</p>
    <p><strong>ID:</strong> {ticket_id}</p>
    <pre style="background:#f8fafc;padding:12px;border-radius:8px;white-space:pre-wrap;">{preview_text}</pre>
    <p><a href="{admin_url}">Abrir panel Admin GUIAA</a></p>
    """

    err = send_email(admins, email_subject, html, text)
    if err:
        print(f"[WARN] Email admins (nuevo ticket): {err}")


def notify_admins_user_message(ticket: dict, message: str) -> None:
    admins = support_notify_emails()
    if not admins:
        return

    subject_line = ticket.get("subject") or "Sin asunto"
    user_name = ticket.get("user_name") or ticket.get("user_email") or "Usuario"
    admin_url = f"{_frontend_url()}/app/admin"
    preview = (message or "").strip()[:600]

    email_subject = f"[GUIAA Soporte] Nuevo mensaje: {subject_line}"
    text = (
        f"El usuario {user_name} respondió en un ticket.\n\n"
        f"Asunto: {subject_line}\n\n"
        f"Mensaje:\n{preview}\n\n"
        f"Admin: {admin_url}\n"
    )
    html = f"""
    <h2>Nuevo mensaje en ticket</h2>
    <p><strong>Usuario:</strong> {user_name}</p>
    <p><strong>Asunto:</strong> {subject_line}</p>
    <pre style="background:#f8fafc;padding:12px;border-radius:8px;white-space:pre-wrap;">{preview}</pre>
    <p><a href="{admin_url}">Abrir Admin GUIAA</a></p>
    """

    err = send_email(admins, email_subject, html, text)
    if err:
        print(f"[WARN] Email admins (mensaje usuario): {err}")


def notify_user_ticket_reply(ticket: dict, reply_body: str, admin_name: str = "") -> None:
    user_email = (ticket.get("user_email") or "").strip()
    if not user_email:
        return

    subject_line = ticket.get("subject") or "Tu consulta"
    app_url = _frontend_url()
    reply_preview = (reply_body or "").strip()[:800]
    from_label = admin_name or "Equipo GUIAA"

    email_subject = f"[GUIAA] Respuesta a tu ticket: {subject_line}"
    text = (
        f"Hola,\n\n"
        f"El equipo de soporte GUIAA respondió a tu ticket «{subject_line}».\n\n"
        f"Respuesta ({from_label}):\n{reply_preview}\n\n"
        f"Inicia sesión para continuar la conversación: {app_url}\n\n"
        f"— GUIAA\n"
    )
    html = f"""
    <h2>Respuesta de soporte GUIAA</h2>
    <p>Hola,</p>
    <p>Respondimos a tu ticket: <strong>{subject_line}</strong></p>
    <pre style="background:#eff6ff;padding:12px;border-radius:8px;white-space:pre-wrap;">{reply_preview}</pre>
    <p><a href="{app_url}">Entrar a GUIAA</a></p>
    <p style="color:#64748b;font-size:12px;">— {from_label}</p>
    """

    err = send_email([user_email], email_subject, html, text)
    if err:
        print(f"[WARN] Email usuario (respuesta ticket): {err}")


def notify_user_ticket_resolved(ticket: dict) -> None:
    user_email = (ticket.get("user_email") or "").strip()
    if not user_email:
        return

    subject_line = ticket.get("subject") or "Tu consulta"
    app_url = _frontend_url()

    email_subject = f"[GUIAA] Ticket resuelto: {subject_line}"
    text = (
        f"Hola,\n\n"
        f"Tu ticket «{subject_line}» fue marcado como resuelto.\n"
        f"Si necesitas más ayuda, puedes abrir un nuevo ticket desde la app.\n\n"
        f"{app_url}\n"
    )
    html = f"""
    <h2>Ticket resuelto</h2>
    <p>Tu ticket <strong>{subject_line}</strong> fue marcado como resuelto.</p>
    <p>Si necesitas más ayuda, crea un nuevo ticket desde el chat de soporte.</p>
    <p><a href="{app_url}">Entrar a GUIAA</a></p>
    """

    err = send_email([user_email], email_subject, html, text)
    if err:
        print(f"[WARN] Email usuario (ticket resuelto): {err}")


def _format_datetime_es(iso: str) -> str:
    if not iso:
        return "Por confirmar"
    try:
        from datetime import datetime

        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.strftime("%d/%m/%Y %H:%M")
    except (ValueError, TypeError):
        return str(iso)


def notify_clinic_appointment_request(org: dict, request: dict, staff_emails: List[str]) -> None:
    recipients = [e.strip() for e in staff_emails if e and e.strip()]
    if not recipients:
        recipients = support_notify_emails()
    if not recipients:
        return

    org_name = org.get("name") or "Consultorio"
    client = request.get("client_name") or "Cliente"
    patient = request.get("patient_name") or "Paciente"
    preferred = _format_datetime_es(request.get("preferred_starts_at") or "")
    reason = (request.get("reason") or "").strip()[:400]
    agenda_url = f"{_frontend_url()}/app/agenda"

    email_subject = f"[GUIAA] Nueva solicitud de cita — {org_name}"
    text = (
        f"Nueva solicitud de cita en {org_name}\n\n"
        f"Cliente: {client}\n"
        f"Teléfono: {request.get('phone') or '—'}\n"
        f"Email: {request.get('email') or '—'}\n"
        f"Mascota: {patient} ({request.get('species') or '—'})\n"
        f"Fecha preferida: {preferred}\n"
        f"Motivo: {reason or '—'}\n\n"
        f"Revisar en agenda: {agenda_url}\n"
    )
    html = f"""
    <h2>Nueva solicitud de cita</h2>
    <p><strong>Consultorio:</strong> {org_name}</p>
    <p><strong>Cliente:</strong> {client}</p>
    <p><strong>Teléfono:</strong> {request.get('phone') or '—'}</p>
    <p><strong>Email:</strong> {request.get('email') or '—'}</p>
    <p><strong>Mascota:</strong> {patient} ({request.get('species') or '—'})</p>
    <p><strong>Fecha preferida:</strong> {preferred}</p>
    <pre style="background:#f8fafc;padding:12px;border-radius:8px;white-space:pre-wrap;">{reason or '—'}</pre>
    <p><a href="{agenda_url}">Abrir agenda GUIAA</a></p>
    """

    err = send_email(recipients, email_subject, html, text)
    if err:
        print(f"[WARN] Email clínica (solicitud cita): {err}")


def notify_client_appointment_status(
    request: dict,
    org_name: str,
    status: str,
    starts_at: Optional[str] = None,
) -> None:
    client_email = (request.get("email") or "").strip()
    if not client_email:
        return

    client_name = request.get("client_name") or "Hola"
    patient = request.get("patient_name") or "tu mascota"
    clinic = org_name or "el consultorio"

    if status == "approved":
        when = _format_datetime_es(starts_at or request.get("preferred_starts_at") or "")
        email_subject = f"[GUIAA] Cita confirmada — {clinic}"
        text = (
            f"Hola {client_name},\n\n"
            f"Tu solicitud de cita para {patient} fue aprobada.\n"
            f"Fecha programada: {when}\n\n"
            f"Si necesitas cambiar la cita, contacta a {clinic}.\n"
        )
        html = f"""
        <h2>Cita confirmada</h2>
        <p>Hola {client_name},</p>
        <p>Tu solicitud de cita para <strong>{patient}</strong> en <strong>{clinic}</strong> fue aprobada.</p>
        <p><strong>Fecha programada:</strong> {when}</p>
        <p style="color:#64748b;font-size:12px;">Si necesitas cambiar la cita, contacta al consultorio.</p>
        """
    else:
        email_subject = f"[GUIAA] Solicitud de cita — {clinic}"
        text = (
            f"Hola {client_name},\n\n"
            f"Lamentamos informarte que tu solicitud de cita para {patient} "
            f"no pudo ser confirmada en este momento.\n"
            f"Puedes contactar a {clinic} para agendar por otro medio.\n"
        )
        html = f"""
        <h2>Solicitud no confirmada</h2>
        <p>Hola {client_name},</p>
        <p>Tu solicitud de cita para <strong>{patient}</strong> en <strong>{clinic}</strong>
        no pudo ser confirmada en este momento.</p>
        <p>Contacta al consultorio para agendar por otro medio.</p>
        """

    err = send_email([client_email], email_subject, html, text)
    if err:
        print(f"[WARN] Email cliente (cita {status}): {err}")
