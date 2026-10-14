import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mic, MicOff, SkipForward, Square, Volume2 } from "lucide-react";
import { DoctorPlumitas } from "../brand/DoctorPlumitas";
import { Button } from "../ui/button";
import {
  extractVoiceField,
  fetchVoiceGuideScript,
  isBrowserSpeechSupported,
  listenOnce,
  scrollToGuideSection,
  speakPlumitas,
  stopSpeaking,
} from "../../lib/plumitasVoiceGuide";

/**
 * Guía por voz campo a campo para 1ª consulta (Perros).
 * STT: Web Speech API · Extracción: backend · TTS: OpenAI si hay key, si no navegador.
 */
export function PlumitasVoiceGuide({
  veterinarianId,
  category = "perros",
  formData,
  setFormData,
  enabled = true,
}) {
  const { t, i18n } = useTranslation("clinic");
  const language = i18n.language?.startsWith("en") ? "en" : "es";
  const [open, setOpen] = useState(false);
  const [script, setScript] = useState(null);
  const [fieldIndex, setFieldIndex] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | loading | speaking | listening | processing | done | error
  const [message, setMessage] = useState("");
  const [lastHeard, setLastHeard] = useState("");
  const [error, setError] = useState("");
  const [ttsEngine, setTtsEngine] = useState("browser"); // openai | browser
  const busyRef = useRef(false);

  const fields = script?.fields || [];
  const currentField = fields[fieldIndex] || null;
  const progress = fields.length
    ? Math.round((fieldIndex / fields.length) * 100)
    : 0;
  const speechOk = isBrowserSpeechSupported();

  const statusLabel = useMemo(() => {
    switch (status) {
      case "speaking":
        return t("voiceGuide.statusSpeaking");
      case "listening":
        return t("voiceGuide.statusListening");
      case "processing":
        return t("voiceGuide.statusProcessing");
      case "done":
        return t("voiceGuide.statusDone");
      case "error":
        return t("voiceGuide.statusError");
      case "loading":
        return t("voiceGuide.statusLoading");
      default:
        return t("voiceGuide.statusIdle");
    }
  }, [status, t]);

  const speak = useCallback(
    async (text, voiceOverride) => {
      if (!text) return;
      setStatus("speaking");
      setMessage(text);
      const voice = voiceOverride || script?.tts_voice || "coral";
      const result = await speakPlumitas(veterinarianId, text, language, {
        preferServer: true,
        voice,
      });
      if (result?.engine) setTtsEngine(result.engine);
      if (result?.engine === "browser" && result?.reason) {
        setError(result.reason);
      }
    },
    [veterinarianId, language, script?.tts_voice],
  );

  const loadScript = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const data = await fetchVoiceGuideScript(veterinarianId, category, language);
      setScript(data);
      setTtsEngine(data.tts_engine === "openai" ? "openai" : "browser");
      setFieldIndex(0);
      setStatus("idle");
      return data;
    } catch (err) {
      setError(err.message || t("voiceGuide.errors.load"));
      setStatus("error");
      return null;
    }
  }, [veterinarianId, category, language, t]);

  useEffect(() => {
    if (open && !script && veterinarianId) {
      loadScript();
    }
  }, [open, script, veterinarianId, loadScript]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const applyValue = useCallback(
    (fieldId, value) => {
      setFormData((prev) => ({ ...prev, [fieldId]: value }));
    },
    [setFormData],
  );

  const goToField = useCallback(
    async (index, data = script) => {
      const list = data?.fields || [];
      const voice = data?.tts_voice || script?.tts_voice || "coral";
      if (index >= list.length) {
        setFieldIndex(list.length);
        setStatus("done");
        await speak(data?.done || t("voiceGuide.done"), voice);
        return;
      }
      setFieldIndex(index);
      const field = list[index];
      scrollToGuideSection(field.section);
      await speak(field.prompt, voice);
      setStatus("idle");
    },
    [script, speak, t],
  );

  const startGuide = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setError("");
    try {
      let data = script;
      if (!data) {
        data = await loadScript();
        if (!data) return;
      }
      // Saltar campos ya llenos
      let start = 0;
      while (start < data.fields.length) {
        const id = data.fields[start].id;
        const val = formData?.[id];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          start += 1;
        } else {
          break;
        }
      }
      await speak(data.intro, data.tts_voice || "coral");
      await goToField(start, data);
    } finally {
      busyRef.current = false;
    }
  };

  const handleListen = async () => {
    if (!currentField || busyRef.current) return;
    if (!speechOk) {
      setError(t("voiceGuide.errors.noSpeechApi"));
      setStatus("idle");
      return;
    }
    busyRef.current = true;
    setError("");
    setLastHeard("");
    stopSpeaking();
    // Evita choque micrófono ↔ TTS (Chrome corta la escucha en vacío)
    await new Promise((r) => setTimeout(r, 400));
    try {
      setStatus("listening");
      setMessage(t("voiceGuide.listeningHint"));
      const transcript = await listenOnce(language);
      if (!transcript) {
        throw new Error(t("voiceGuide.errors.emptyTranscript"));
      }
      setLastHeard(transcript);
      setStatus("processing");
      setMessage(t("voiceGuide.processingHint"));

      const result = await extractVoiceField(
        veterinarianId,
        {
          category,
          field_id: currentField.id,
          transcript,
          language,
          current_value: formData?.[currentField.id] || null,
        },
        currentField,
      );

      if (!result.ok) {
        await speak(result.retry_prompt || t("voiceGuide.retry"));
        setMessage(currentField.prompt);
        setStatus("idle");
        return;
      }

      // No permitir "omitir" lógico en campos obligatorios
      if (result.skipped && !currentField.skippable) {
        setError(t("voiceGuide.errors.requiredField"));
        await speak(t("voiceGuide.errors.requiredFieldSpeak"));
        setMessage(currentField.prompt);
        setStatus("idle");
        return;
      }

      if (!result.skipped && result.value != null) {
        applyValue(result.field_id, result.value);
        setLastHeard(`${transcript} → ${result.value}`);
        // Resalta el control del formulario si tiene data-voice-field
        try {
          const el = document.querySelector(`[data-voice-field="${result.field_id}"]`);
          if (el) {
            el.classList.add("voice-field-filled");
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => el.classList.remove("voice-field-filled"), 1800);
          }
        } catch {
          /* ignore */
        }
      }
      if (result.section) scrollToGuideSection(result.section);
      if (result.speak_confirm) {
        await speak(result.speak_confirm);
      }

      const nextIdx = result.next_field_id
        ? fields.findIndex((f) => f.id === result.next_field_id)
        : fieldIndex + 1;
      const resolvedNext = nextIdx >= 0 ? nextIdx : fieldIndex + 1;

      if (result.done || resolvedNext >= fields.length) {
        setStatus("done");
        setFieldIndex(fields.length);
        await speak(script?.done || t("voiceGuide.done"));
      } else {
        await goToField(resolvedNext);
      }
    } catch (err) {
      // Error suave: nos quedamos en el mismo campo para reintentar
      setError(err.message || t("voiceGuide.errors.listen"));
      setMessage(currentField?.prompt || t("voiceGuide.retry"));
      setStatus("idle");
    } finally {
      busyRef.current = false;
    }
  };

  const handleSkip = async () => {
    if (!currentField || busyRef.current) return;
    if (!currentField.skippable) {
      setError(t("voiceGuide.errors.requiredField"));
      setMessage(currentField.prompt);
      setStatus("idle");
      await speak(t("voiceGuide.errors.requiredFieldSpeak"));
      return;
    }
    busyRef.current = true;
    try {
      await goToField(fieldIndex + 1);
    } finally {
      busyRef.current = false;
    }
  };

  const handleStop = () => {
    stopSpeaking();
    busyRef.current = false;
    setStatus("idle");
    setMessage(t("voiceGuide.stopped"));
  };

  if (!enabled || category !== "perros") return null;

  return (
    <div className={`plumitas-voice-guide${open ? " is-open" : ""}`}>
      {!open ? (
        <button
          type="button"
          className="plumitas-voice-launch"
          onClick={() => setOpen(true)}
        >
          <DoctorPlumitas size="sm" badge={false} className="plumitas-voice-launch-mascot" />
          <span className="plumitas-voice-launch-copy">
            <strong>{t("voiceGuide.launchTitle")}</strong>
            <span>{t("voiceGuide.launchSubtitle")}</span>
          </span>
          <Mic size={18} strokeWidth={1.75} aria-hidden />
        </button>
      ) : (
        <div className="plumitas-voice-panel" role="region" aria-label={t("voiceGuide.panelAria")}>
          <div className="plumitas-voice-panel-head">
            <DoctorPlumitas size="sm" badge className="plumitas-voice-panel-mascot" />
            <div className="plumitas-voice-panel-titles">
              <strong>{t("voiceGuide.panelTitle")}</strong>
              <span className={`plumitas-voice-status plumitas-voice-status--${status}`}>
                {statusLabel}
              </span>
              <span
                className={`plumitas-voice-engine plumitas-voice-engine--${ttsEngine}`}
                title={
                  ttsEngine === "openai"
                    ? t("voiceGuide.ttsOpenAiHint")
                    : t("voiceGuide.ttsBrowserHint")
                }
              >
                {ttsEngine === "openai"
                  ? t("voiceGuide.ttsOpenAi")
                  : t("voiceGuide.ttsBrowser")}
              </span>
            </div>
            <button
              type="button"
              className="plumitas-voice-close"
              onClick={() => {
                handleStop();
                setOpen(false);
              }}
              aria-label={t("voiceGuide.close")}
            >
              ×
            </button>
          </div>

          <div className="plumitas-voice-progress" aria-hidden>
            <div className="plumitas-voice-progress-bar" style={{ width: `${status === "done" ? 100 : progress}%` }} />
          </div>
          <p className="plumitas-voice-step">
            {status === "done"
              ? t("voiceGuide.complete")
              : currentField
                ? t("voiceGuide.stepOf", {
                    current: fieldIndex + 1,
                    total: fields.length || "—",
                    field: currentField.prompt,
                  })
                : t("voiceGuide.ready")}
          </p>

          {message ? <p className="plumitas-voice-message">{message}</p> : null}
          {lastHeard ? (
            <p className="plumitas-voice-heard">
              <Volume2 size={14} aria-hidden /> {t("voiceGuide.youSaid")}: “{lastHeard}”
            </p>
          ) : null}
          {error ? <p className="plumitas-voice-error">{error}</p> : null}
          {!speechOk ? (
            <p className="plumitas-voice-error">{t("voiceGuide.errors.noSpeechApi")}</p>
          ) : null}

          <div className="plumitas-voice-actions">
            {status !== "done" && fieldIndex === 0 && status === "idle" && !message ? (
              <Button type="button" variant="guiaaPrimary" size="consult" onClick={startGuide}>
                {t("voiceGuide.start")}
              </Button>
            ) : null}
            {status === "idle" && currentField && message ? (
              <Button
                type="button"
                variant="guiaaPrimary"
                size="consult"
                className="gap-2"
                onClick={handleListen}
                disabled={!speechOk}
              >
                <Mic size={16} />
                {t("voiceGuide.answer")}
              </Button>
            ) : null}
            {(status === "speaking" || status === "listening" || status === "processing") && (
              <Button type="button" variant="guiaaSoft" size="consult" className="gap-2" onClick={handleStop}>
                <Square size={14} />
                {t("voiceGuide.stop")}
              </Button>
            )}
            {status === "idle" && currentField && message && currentField.skippable ? (
              <Button type="button" variant="guiaaSoft" size="consult" className="gap-2" onClick={handleSkip}>
                <SkipForward size={16} />
                {t("voiceGuide.skip")}
              </Button>
            ) : null}
            {status === "done" || status === "error" ? (
              <Button type="button" variant="guiaaSoft" size="consult" onClick={startGuide}>
                {t("voiceGuide.restart")}
              </Button>
            ) : null}
            {status === "listening" ? (
              <span className="plumitas-voice-listening-pulse" aria-hidden>
                <MicOff size={16} />
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
