import { BACKEND_URL } from "./backendUrl";
import { getAuthHeaders } from "./authHeaders";

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export function isBrowserSpeechSupported() {
  return Boolean(SpeechRecognition);
}

export function isBrowserTtsSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export async function fetchVoiceGuideScript(veterinarianId, category, language = "es") {
  const response = await fetch(
    `${BACKEND_URL}/api/voice-guide/script/${encodeURIComponent(category)}?language=${encodeURIComponent(language)}`,
    { headers: getAuthHeaders(veterinarianId) },
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "No se pudo cargar la guía de voz");
  }
  return response.json();
}

/** Extracción local (misma lógica del backend) para no depender solo del API. */
export function extractVoiceFieldLocal(field, transcript) {
  const t = String(transcript || "").trim();
  const lower = t.toLowerCase();
  const skippable = Boolean(field?.skippable);
  const skipRe =
    /\b(omitir|saltar|skip|pasar|no\s+s[eé]|desconozco|ninguna|ninguno)\b/i;

  if (skippable && skipRe.test(lower)) {
    return {
      ok: true,
      field_id: field.id,
      value: null,
      skipped: true,
      speak_confirm: "De acuerdo, lo omitimos.",
      next_field_id: field.next_field_id || null,
      done: false,
      section: field.section,
      source: "local",
    };
  }

  let value = null;
  const ftype = field?.type;

  if (ftype === "yesno") {
    if (/\b(s[ií]|sip|claro|afirmativo|yes|yeah)\b/i.test(lower)) value = "SI";
    else if (/\b(no|nop|negativo|ninguna|ninguno)\b/i.test(lower)) value = "NO";
  } else if (field.id === "sexo") {
    if (/\b(hembra|femenino|female|hembrita)\b/i.test(lower)) value = "hembra";
    else if (/\b(macho|masculino|male)\b/i.test(lower)) value = "macho";
  } else if (field.id === "estado_reproductivo") {
    if (
      /\b(esterilizad[oa]|castrad[oa]|spay|neuter|orquid|operad[oa])\b/i.test(lower)
    ) {
      value = "castrado";
    } else if (/\b(enter[oa]|intact[oa]|completo|sin\s+operar)\b/i.test(lower)) {
      value = "entero";
    }
  } else if (field.id === "habitat") {
    if (/\b(interior|dentro|casa|departamento|depto|apartamento|indoor|adentro)\b/i.test(lower)) {
      value = "INTERIOR";
    } else if (/\b(exterior|afuera|patio|jard[ií]n|calle|outdoor|fuera)\b/i.test(lower)) {
      value = "EXTERIOR";
    }
  } else if (ftype === "number") {
    const m = lower.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
    if (m) value = m[1];
  } else if (ftype === "enum" && Array.isArray(field.values)) {
    value =
      field.values.find((v) => lower.includes(String(v).toLowerCase())) || null;
  } else {
    // texto libre
    value = t
      .replace(
        /^(el nombre es|se llama|es|la raza es|vive en|el dueño es|la dueña es)\s+/i,
        "",
      )
      .trim()
      .replace(/^[._,;:\s]+|[._,;:\s]+$/g, "");
    if (value) value = value.charAt(0).toUpperCase() + value.slice(1);
  }

  const ok = value != null && String(value).trim() !== "";
  const tmpl = field.confirm_template || "Registrado: {value}.";
  return {
    ok,
    field_id: field.id,
    value: ok ? value : null,
    skipped: false,
    confidence: ok ? 0.85 : 0,
    speak_confirm: ok ? tmpl.replace("{value}", value) : null,
    retry_prompt: ok ? null : field.prompt,
    next_field_id: field.next_field_id || null,
    done: false,
    section: field.section,
    source: "local",
  };
}

export async function extractVoiceField(veterinarianId, payload, fieldMeta) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/voice-guide/extract`, {
      method: "POST",
      headers: getAuthHeaders(veterinarianId),
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      return response.json();
    }
  } catch {
    /* fallback local */
  }
  if (fieldMeta) {
    return extractVoiceFieldLocal(fieldMeta, payload.transcript);
  }
  throw new Error("No se pudo interpretar la respuesta");
}

/**
 * Reproduce TTS ChatGPT (OpenAI) si el backend tiene OPENAI_API_KEY.
 * Si no, usa SpeechSynthesis del navegador.
 * @returns {Promise<{ engine: 'openai' | 'browser', reason?: string }>}
 */
export async function speakPlumitas(
  veterinarianId,
  text,
  language = "es",
  { preferServer = true, voice = "coral" } = {},
) {
  const clean = String(text || "").trim();
  if (!clean) return { engine: "browser" };

  if (preferServer) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/voice-guide/speak`, {
        method: "POST",
        headers: getAuthHeaders(veterinarianId),
        body: JSON.stringify({ text: clean, language, voice }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        await playAudioUrl(url);
        URL.revokeObjectURL(url);
        return { engine: "openai" };
      }
      let reason = "";
      try {
        const data = await response.json();
        reason = typeof data?.detail === "string" ? data.detail : "";
      } catch {
        reason = `TTS HTTP ${response.status}`;
      }
      await speakBrowser(clean, language);
      return { engine: "browser", reason };
    } catch (err) {
      await speakBrowser(clean, language);
      return {
        engine: "browser",
        reason: err?.message || "No se pudo conectar al TTS del backend",
      };
    }
  }

  await speakBrowser(clean, language);
  return { engine: "browser" };
}

function playAudioUrl(url) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error("Error reproduciendo audio"));
    audio.play().catch(reject);
  });
}

export function speakBrowser(text, language = "es") {
  return new Promise((resolve) => {
    if (!isBrowserTtsSupported()) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language.startsWith("en") ? "en-US" : "es-MX";
    utter.rate = 1;
    utter.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices?.() || [];
    const preferred = voices.find((v) =>
      language.startsWith("en")
        ? /en[-_](US|GB)/i.test(v.lang)
        : /es[-_](MX|US|ES)/i.test(v.lang),
    );
    if (preferred) utter.voice = preferred;
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
  });
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}

function collectTranscript(event) {
  if (!event?.results) return "";
  let text = "";
  for (let i = 0; i < event.results.length; i += 1) {
    const result = event.results[i];
    if (result?.[0]?.transcript) {
      text += `${result[0].transcript} `;
    }
  }
  return text.trim();
}

/**
 * Escucha una sola frase con Web Speech API.
 * Reintenta una vez si Chrome cierra la sesión sin resultado (muy frecuente).
 * @returns {Promise<string>}
 */
export function listenOnce(language = "es", { timeoutMs = 15000, maxAttempts = 2 } = {}) {
  if (!SpeechRecognition) {
    return Promise.reject(
      new Error("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge."),
    );
  }

  const lang = language.startsWith("en") ? "en-US" : "es-MX";

  const attempt = (attemptIndex) =>
    new Promise((resolve, reject) => {
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      let settled = false;
      let latest = "";

      const finish = (fn) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn();
      };

      const timer = setTimeout(() => {
        try {
          recognition.stop();
        } catch {
          /* ignore */
        }
        // onend manejará resolve/reject con latest
      }, timeoutMs);

      recognition.onresult = (event) => {
        const text = collectTranscript(event);
        if (text) latest = text;
        // Si ya hay un resultado final, cerrar pronto
        const last = event.results?.[event.results.length - 1];
        if (last?.isFinal && latest) {
          try {
            recognition.stop();
          } catch {
            /* ignore */
          }
        }
      };

      recognition.onerror = (event) => {
        const code = event.error || "error";
        // aborted: stop() manual / solapamiento con TTS — no es fallo duro
        if (code === "aborted") return;
        if (code === "no-speech" || code === "audio-capture") {
          // Dejar que onend reintente o falle con latest
          return;
        }
        finish(() => {
          if (code === "not-allowed") {
            reject(new Error("Permiso de micrófono denegado."));
          } else {
            reject(new Error(`Error de micrófono: ${code}`));
          }
        });
      };

      recognition.onend = () => {
        if (settled) return;
        if (latest) {
          finish(() => resolve(latest));
          return;
        }
        if (attemptIndex + 1 < maxAttempts) {
          finish(() => {
            // Pequeña pausa antes del reintento (micrófono / motor de voz)
            setTimeout(() => {
              attempt(attemptIndex + 1).then(resolve, reject);
            }, 280);
          });
          return;
        }
        finish(() =>
          reject(
            new Error(
              "No capturé tu respuesta. Toca Responder otra vez y habla al terminar el beep.",
            ),
          ),
        );
      };

      try {
        recognition.start();
      } catch (err) {
        finish(() => {
          if (attemptIndex + 1 < maxAttempts) {
            setTimeout(() => {
              attempt(attemptIndex + 1).then(resolve, reject);
            }, 280);
          } else {
            reject(err);
          }
        });
      }
    });

  return attempt(0);
}

export function scrollToGuideSection(sectionId) {
  if (!sectionId || typeof document === "undefined") return;
  const el = document.getElementById(sectionId);
  if (el) {
    el.classList.remove("collapsed");
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
