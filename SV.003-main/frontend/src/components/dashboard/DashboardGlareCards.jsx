import { GlareCard } from "@/components/ui/glare-cards";
import { Activity, CalendarDays, FlaskConical, Stethoscope } from "lucide-react";
import "./dashboardGlareCards.css";

const CDS_IMAGE =
  "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1200&q=80";
const LAB_IMAGE =
  "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1200&q=80";
const AGENDA_IMAGE =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=80";

function bindActivate(handler) {
  return {
    role: "button",
    tabIndex: 0,
    onClick: handler,
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handler?.();
      }
    },
  };
}

function MediaGlareCard({
  image,
  imagePosition = "center 30%",
  glareColor,
  tiltIntensity = 9,
  eyebrow,
  EyebrowIcon,
  title,
  description,
  metricValue,
  metricLabel,
  onActivate,
}) {
  return (
    <GlareCard
      tiltIntensity={tiltIntensity}
      glareColor={glareColor}
      className="dash-glare-card dash-glare-card--media"
      {...bindActivate(onActivate)}
    >
      <div className="dash-glare-media-shade" />
      <img
        src={image}
        alt=""
        className="dash-glare-media-img"
        style={{ objectPosition: imagePosition }}
      />
      <div className="dash-glare-eyebrow dash-glare-eyebrow--on-media">
        <EyebrowIcon size={15} aria-hidden />
        {eyebrow}
      </div>
      {metricValue != null && (
        <div className="dash-glare-media-metric">
          <span className="dash-glare-media-metric-value">{metricValue}</span>
          <span className="dash-glare-media-metric-label">{metricLabel}</span>
        </div>
      )}
      <div className="dash-glare-media-copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </GlareCard>
  );
}

export function DashboardGlareCards({
  today = {},
  week = {},
  onOpenCds,
  onOpenLab,
  onOpenAgenda,
}) {
  const cdsToday = Number(today.consultations) || 0;
  const cdsWeek = Number(week.consultations) || 0;
  const appointmentsUpcoming = Number(today.appointments_upcoming) || 0;
  const appointmentsTotal = Number(today.appointments_total) || 0;
  const pending = Number(today.pending_requests) || 0;

  return (
    <section className="dash-glare-section" aria-label="Resumen visual de actividad">
      <div className="dash-glare-section-head">
        <div>
          <h2>
            <Activity size={18} aria-hidden />
            Actividad de la clínica
          </h2>
          <p>
            Consultas, imagen médica y agenda — con la misma mirada del panel, más
            detalle al pasar el cursor.
          </p>
        </div>
      </div>

      <div className="dash-glare-grid">
        <MediaGlareCard
          image={CDS_IMAGE}
          imagePosition="center 35%"
          glareColor="rgba(61, 155, 143, 0.32)"
          tiltIntensity={8}
          EyebrowIcon={Stethoscope}
          eyebrow="Consultas CDS"
          title="Carga clínica"
          description={`${cdsWeek} esta semana · clic para ir al panel CDS`}
          metricValue={cdsToday}
          metricLabel="hoy"
          onActivate={onOpenCds}
        />

        <MediaGlareCard
          image={LAB_IMAGE}
          imagePosition="center 25%"
          glareColor="rgba(38, 91, 147, 0.3)"
          tiltIntensity={10}
          EyebrowIcon={FlaskConical}
          eyebrow="Laboratorio"
          title="Imágenes médicas"
          description="Abre el laboratorio para interpretación asistida de estudios."
          onActivate={onOpenLab}
        />

        <MediaGlareCard
          image={AGENDA_IMAGE}
          imagePosition="center 40%"
          glareColor="rgba(38, 91, 147, 0.28)"
          tiltIntensity={8}
          EyebrowIcon={CalendarDays}
          eyebrow="Agenda"
          title="Próximas citas"
          description={
            pending > 0
              ? `${appointmentsTotal} programadas hoy · ${pending} solicitudes`
              : `${appointmentsTotal} programadas hoy`
          }
          metricValue={appointmentsUpcoming}
          metricLabel="por atender"
          onActivate={onOpenAgenda}
        />
      </div>
    </section>
  );
}
