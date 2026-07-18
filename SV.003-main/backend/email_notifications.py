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
    raw = (
        os.getenv("FRONTEND_URL", "").strip()
        or os.getenv("PUBLIC_APP_URL", "").strip()
        or "https://guiaa.vet"
    ).rstrip("/")
    # Evitar enlaces a localhost en correos de producción
    if "localhost" in raw.lower() or "127.0.0.1" in raw:
        prod = (os.getenv("PUBLIC_APP_URL", "").strip() or "https://guiaa.vet").rstrip("/")
        if "localhost" not in prod.lower() and "127.0.0.1" not in prod:
            return prod
        return "https://guiaa.vet"
    return raw


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


def _send_resend(
    to_addrs: List[str],
    subject: str,
    html: str,
    text: str,
    extra_headers: Optional[dict] = None,
) -> Optional[str]:
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
    if extra_headers:
        payload["headers"] = extra_headers
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


def send_email(
    to_addrs: List[str],
    subject: str,
    html: str,
    text: str,
    extra_headers: Optional[dict] = None,
) -> Optional[str]:
    """Envía email. Devuelve mensaje de error o None si OK."""
    recipients = [e.strip() for e in to_addrs if e and e.strip()]
    if not recipients:
        return "Sin destinatarios"

    if os.getenv("RESEND_API_KEY", "").strip():
        err = _send_resend(recipients, subject, html, text, extra_headers=extra_headers)
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


def notify_admins_guia_consultas_lead(lead: dict) -> None:
    admins = support_notify_emails()
    if not admins:
        return

    name = lead.get("name") or "—"
    email = lead.get("email") or "—"
    phone = lead.get("phone") or "—"
    message = (lead.get("message") or "").strip()[:800]
    admin_url = f"{_frontend_url()}/app/admin"

    email_subject = f"[GUIAA] Nueva solicitud ADSGuiaa: {name}"
    text = (
        f"Nueva solicitud de publicidad ADSGuiaa (Guía Consultas)\n\n"
        f"Nombre / empresa: {name}\n"
        f"Email: {email}\n"
        f"Teléfono: {phone}\n\n"
        f"Mensaje:\n{message or '(sin mensaje)'}\n\n"
        f"Ver en Admin GUIAA: {admin_url}\n"
    )
    html = f"""
    <h2>Nueva solicitud — ADSGuiaa</h2>
    <p><strong>Nombre / empresa:</strong> {name}</p>
    <p><strong>Email:</strong> {email}</p>
    <p><strong>Teléfono:</strong> {phone}</p>
    <pre style="background:#f8fafc;padding:12px;border-radius:8px;white-space:pre-wrap;">{message or "(sin mensaje)"}</pre>
    <p><a href="{admin_url}">Abrir Admin GUIAA</a></p>
    """
    err = send_email(admins, email_subject, html, text)
    if err:
        print(f"[WARN] Email admins (Guía Consultas): {err}")


def notify_admins_new_registration(profile: dict) -> None:
    """Avisa a soporte cuando un veterinario se registra en GUIAA."""
    admins = support_notify_emails()
    if not admins:
        return

    name = (profile.get("nombre") or "").strip() or "—"
    email = (profile.get("email") or "").strip() or "—"
    phone = (profile.get("telefono") or "").strip() or "—"
    cedula = (profile.get("cedula_profesional") or "").strip() or "—"
    pais = (profile.get("profesional_pais") or "").strip() or "—"
    especialidad = (profile.get("especialidad") or "").strip() or "—"
    institucion = (profile.get("institucion") or "").strip() or "—"
    profile_id = profile.get("id") or ""
    admin_url = f"{_frontend_url()}/app/admin"

    email_subject = f"[GUIAA] Nuevo registro veterinario: {name}"
    text = (
        f"Nuevo registro de veterinario en GUIAA\n\n"
        f"Nombre: {name}\n"
        f"Email: {email}\n"
        f"Teléfono: {phone}\n"
        f"Registro profesional: {cedula}\n"
        f"País: {pais}\n"
        f"Especialidad: {especialidad}\n"
        f"Institución: {institucion}\n"
        f"ID perfil: {profile_id}\n\n"
        f"Revisar en admin: {admin_url}\n"
    )
    html = f"""
    <h2>Nuevo registro veterinario</h2>
    <p><strong>Nombre:</strong> {name}</p>
    <p><strong>Email:</strong> {email}</p>
    <p><strong>Teléfono:</strong> {phone}</p>
    <p><strong>Registro profesional:</strong> {cedula}</p>
    <p><strong>País:</strong> {pais}</p>
    <p><strong>Especialidad:</strong> {especialidad}</p>
    <p><strong>Institución:</strong> {institucion}</p>
    <p><strong>ID perfil:</strong> {profile_id}</p>
    <p><a href="{admin_url}">Abrir panel Admin GUIAA</a></p>
    """

    err = send_email(admins, email_subject, html, text)
    if err:
        print(f"[WARN] Email admins (nuevo registro): {err}")


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


def notify_user_cedula_approved(profile: dict) -> None:
    """Avisa al veterinario cuando su registro profesional queda verificado."""
    user_email = (profile.get("email") or "").strip()
    if not user_email:
        return

    user_name = (profile.get("nombre") or "").strip() or "colega"
    cedula = (profile.get("cedula_profesional") or "").strip()
    app_url = _frontend_url()
    login_url = f"{app_url}/login"
    support_email = DEFAULT_SUPPORT_NOTIFY_EMAIL

    cedula_line = f"Registro profesional: {cedula}\n" if cedula else ""
    cedula_html = (
        f'<p><strong>Registro profesional:</strong> {cedula}</p>' if cedula else ""
    )

    email_subject = "[GUIAA] Tu registro profesional fue aprobado"
    text = (
        f"Hola {user_name},\n\n"
        f"¡Buenas noticias! Tu registro profesional veterinario en GUIAA fue verificado "
        f"y aprobado por nuestro equipo.\n\n"
        f"{cedula_line}"
        f"Email de tu cuenta: {user_email}\n\n"
        f"Ya puedes usar la plataforma con acceso completo según tu plan de membresía.\n\n"
        f"Inicia sesión: {login_url}\n\n"
        f"Si tienes dudas, escríbenos a {support_email}.\n\n"
        f"— Equipo GUIAA\n"
    )
    html = f"""
    <h2>¡Registro profesional aprobado!</h2>
    <p>Hola {user_name},</p>
    <p>Tu <strong>registro profesional veterinario</strong> en GUIAA fue verificado y aprobado.</p>
    {cedula_html}
    <p><strong>Email de tu cuenta:</strong> {user_email}</p>
    <p>Ya puedes usar la plataforma con acceso completo según tu plan de membresía.</p>
    <p><a href="{login_url}">Iniciar sesión en GUIAA</a></p>
    <p style="color:#64748b;font-size:12px;">
      ¿Dudas? Escríbenos a <a href="mailto:{support_email}">{support_email}</a>
    </p>
    <p style="color:#64748b;font-size:12px;">— Equipo GUIAA</p>
    """

    err = send_email([user_email], email_subject, html, text)
    if err:
        print(f"[WARN] Email usuario (cédula aprobada): {err}")


def notify_user_cedula_rejected(profile: dict, reason: str = "") -> None:
    """Avisa al veterinario cuando su registro profesional fue rechazado."""
    user_email = (profile.get("email") or "").strip()
    if not user_email:
        return

    user_name = (profile.get("nombre") or "").strip() or "colega"
    app_url = _frontend_url()
    login_url = f"{app_url}/login"
    support_email = DEFAULT_SUPPORT_NOTIFY_EMAIL

    reason_text = (reason or profile.get("cedula_verification_error") or "").strip()
    if not reason_text:
        reason_text = "No pudimos validar tu documentación con la información proporcionada."

    email_subject = "[GUIAA] Tu registro profesional requiere revisión"
    text = (
        f"Hola {user_name},\n\n"
        f"Lamentamos informarte que tu registro profesional veterinario en GUIAA "
        f"no pudo ser verificado en este momento.\n\n"
        f"Motivo:\n{reason_text}\n\n"
        f"Puedes iniciar sesión, subir un nuevo documento o corregir tus datos "
        f"y volver a solicitar la verificación:\n{login_url}\n\n"
        f"Si crees que se trata de un error, escríbenos a {support_email}.\n\n"
        f"— Equipo GUIAA\n"
    )
    html = f"""
    <h2>Registro profesional no verificado</h2>
    <p>Hola {user_name},</p>
    <p>Tu <strong>registro profesional veterinario</strong> en GUIAA no pudo ser verificado en este momento.</p>
    <pre style="background:#fef2f2;padding:12px;border-radius:8px;white-space:pre-wrap;border:1px solid #fecaca;">{reason_text}</pre>
    <p>Puedes iniciar sesión, subir un nuevo documento o corregir tus datos y volver a solicitar la verificación.</p>
    <p><a href="{login_url}">Iniciar sesión en GUIAA</a></p>
    <p style="color:#64748b;font-size:12px;">¿Dudas? Escríbenos a <a href="mailto:{support_email}">{support_email}</a></p>
    <p style="color:#64748b;font-size:12px;">— Equipo GUIAA</p>
    """

    err = send_email([user_email], email_subject, html, text)
    if err:
        print(f"[WARN] Email usuario (cédula rechazada): {err}")


def notify_user_cedula_upload_reminder(profile: dict) -> None:
    """Recuerda al veterinario que envíe su documento de registro profesional."""
    user_email = (profile.get("email") or "").strip()
    if not user_email:
        return

    user_name = (profile.get("nombre") or "").strip() or "colega"
    cedula = (profile.get("cedula_profesional") or "").strip()
    app_url = _frontend_url()
    login_url = f"{app_url}/login"
    support_email = DEFAULT_SUPPORT_NOTIFY_EMAIL

    cedula_line = f"Registro profesional: {cedula}\n" if cedula else ""
    cedula_html = (
        f'<p><strong>Registro profesional:</strong> {cedula}</p>' if cedula else ""
    )

    email_subject = "[GUIAA] Recuerda enviar tu documento de registro profesional"
    text = (
        f"Hola {user_name},\n\n"
        f"Para completar tu cuenta en GUIAA necesitamos una copia de tu documento "
        f"de registro profesional veterinario (cédula, matrícula o licencia).\n\n"
        f"{cedula_line}"
        f"Email de tu cuenta: {user_email}\n\n"
        f"Puedes hacerlo de dos formas:\n"
        f"1. Inicia sesión y súbelo desde la app: {login_url}\n"
        f"2. Responde a este correo o escribe a {support_email} adjuntando "
        f"una foto o PDF legible de tu documento (JPG, PNG o PDF).\n\n"
        f"Sin este documento no podremos verificar tu perfil profesional.\n\n"
        f"— Equipo GUIAA\n"
    )
    html = f"""
    <h2>Documento de registro profesional pendiente</h2>
    <p>Hola {user_name},</p>
    <p>Para completar tu cuenta en <strong>GUIAA</strong> necesitamos una copia de tu
    documento de registro profesional veterinario (cédula, matrícula o licencia).</p>
    {cedula_html}
    <p><strong>Email de tu cuenta:</strong> {user_email}</p>
    <h3 style="font-size:15px;margin-bottom:8px;">Cómo enviarlo</h3>
    <ol style="padding-left:20px;line-height:1.6;">
      <li><a href="{login_url}">Inicia sesión en GUIAA</a> y súbelo desde la pantalla de verificación.</li>
      <li>O responde a este correo / escribe a
        <a href="mailto:{support_email}">{support_email}</a>
        adjuntando una foto o PDF legible (JPG, PNG o PDF).</li>
    </ol>
    <p style="color:#64748b;font-size:13px;">
      Sin este documento no podremos verificar tu perfil profesional.
    </p>
    <p style="color:#64748b;font-size:12px;">— Equipo GUIAA</p>
    """

    err = send_email([user_email], email_subject, html, text)
    if err:
        print(f"[WARN] Email usuario (recordatorio cédula): {err}")


def notify_user_trial_credits_restored(profile: dict) -> Optional[str]:
    """Avisa que se restauraron las 3 consultas de prueba."""
    user_email = (profile.get("email") or "").strip()
    if not user_email:
        return "Sin email"

    user_name = (profile.get("nombre") or "").strip() or "colega"
    credits = int(profile.get("consultations_remaining") or 3)
    app_url = _frontend_url()
    login_url = f"{app_url}/login"
    support_email = DEFAULT_SUPPORT_NOTIFY_EMAIL

    email_subject = "[GUIAA] Te regalamos de nuevo 3 consultas de prueba"
    text = (
        f"Hola {user_name},\n\n"
        f"Queremos que pruebes GUIAA sin fricción: te restauramos "
        f"{credits} consultas de prueba en tu cuenta.\n\n"
        f"Email de tu cuenta: {user_email}\n"
        f"Consultas disponibles: {credits}\n\n"
        f"Entra y úsalas cuando quieras en una consulta real:\n{login_url}\n\n"
        f"Si tienes dudas, escríbenos a {support_email}.\n\n"
        f"— Equipo GUIAA\n"
    )
    html = f"""
    <h2>🎁 Tus 3 consultas de prueba están de vuelta</h2>
    <p>Hola {user_name},</p>
    <p>
      Queremos que pruebes <strong>GUIAA</strong> sin fricción: te restauramos
      <strong>{credits} consultas de prueba</strong> en tu cuenta.
    </p>
    <ul>
      <li><strong>Email:</strong> {user_email}</li>
      <li><strong>Consultas disponibles:</strong> {credits}</li>
    </ul>
    <p>
      Úsalas en una consulta clínica real cuando quieras.
      <a href="{login_url}">Iniciar sesión en GUIAA</a>
    </p>
    <p style="color:#64748b;font-size:12px;">
      ¿Dudas? Escríbenos a <a href="mailto:{support_email}">{support_email}</a>
    </p>
    <p style="color:#64748b;font-size:12px;">— Equipo GUIAA</p>
    """

    err = send_email([user_email], email_subject, html, text)
    if err:
        print(f"[WARN] Email trial credits ({user_email}): {err}")
    return err


def notify_user_2fa_code(profile: dict, code: str) -> None:
    """Envía código de verificación en dos pasos al email del veterinario."""
    user_email = (profile.get("email") or "").strip()
    if not user_email or not code:
        return

    user_name = (profile.get("nombre") or "").strip() or "colega"
    email_subject = "[GUIAA] Tu código de verificación"
    text = (
        f"Hola {user_name},\n\n"
        f"Tu código de verificación para iniciar sesión en GUIAA es: {code}\n\n"
        f"Válido por 10 minutos. Si no solicitaste este código, ignora este mensaje.\n\n"
        f"— Equipo GUIAA\n"
    )
    html = f"""
    <h2>Código de verificación</h2>
    <p>Hola {user_name},</p>
    <p>Usa este código para completar tu inicio de sesión en GUIAA:</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:24px 0;">{code}</p>
    <p style="color:#64748b;font-size:13px;">Válido por 10 minutos. Si no fuiste tú, ignora este correo.</p>
    <p style="color:#64748b;font-size:12px;">— Equipo GUIAA</p>
    """

    err = send_email([user_email], email_subject, html, text)
    if err:
        print(f"[WARN] Email 2FA: {err}")


def send_promotional_email(
    to_addr: str,
    nombre: str,
    offer: dict,
    image_url: Optional[str] = None,
    segment: str = "promo",
) -> Optional[str]:
    """Email promocional con imagen de oferta y enlace de baja."""
    email = (to_addr or "").strip()
    if not email:
        return "Sin email"

    frontend = _frontend_url()
    headline = (offer.get("headline") or "Oferta GUIAA").strip()
    message = (offer.get("message") or "").strip()
    promo = (offer.get("promo_code") or "").strip()
    plan = (offer.get("plan_name") or "Premium").strip()
    membership_url = f"{frontend}/app/membership?utm_source=email&utm_campaign=promo_{segment}"
    if promo:
        membership_url += f"&promo={promo}"

    unsubscribe_url = f"{frontend}/app/settings/marketing-unsubscribe?email={email}"
    subject = f"GUIAA — {headline}"

    img_block = ""
    if image_url:
        img_block = f'<p style="text-align:center;margin:24px 0;"><img src="{image_url}" alt="Oferta GUIAA" style="max-width:100%;border-radius:12px;" /></p>'

    promo_line = f"<p><strong>Cupón:</strong> {promo}</p>" if promo else ""

    text = (
        f"Hola {nombre},\n\n"
        f"{headline}\n\n"
        f"{message}\n\n"
        f"Plan: {plan}\n"
        + (f"Cupón: {promo}\n" if promo else "")
        + f"\nContratar: {membership_url}\n\n"
        f"Para dejar de recibir promociones: {unsubscribe_url}\n"
    )
    html = f"""
    <div style="font-family:system-ui,sans-serif;color:#0c2d4d;max-width:560px;margin:0 auto;">
      <p>Hola {nombre},</p>
      <h2 style="color:#265B93;margin:16px 0;">{headline}</h2>
      <p>{message}</p>
      {img_block}
      <p><strong>Plan {plan}</strong></p>
      {promo_line}
      <p style="margin:28px 0;">
        <a href="{membership_url}" style="background:#265B93;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          Ver oferta en GUIAA
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;margin-top:32px;">
        Recibes este correo porque estás registrado en GUIAA.
        <a href="{unsubscribe_url}">Darme de baja de promociones</a>
      </p>
    </div>
    """

    headers = {
        "List-Unsubscribe": f"<{unsubscribe_url}>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    }
    return send_email([email], subject, html, text, extra_headers=headers)

