import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import "./TermsAndConditionsModal.css";

function LegalIntro({ privacy = false }) {
  return (
    <div className="legal-modal__intro">
      <h2>Plataforma GUIAA — Soporte a la Decisión Clínica (CDS)</h2>
      <p>
        <strong>Avanzado grado L4 y L5</strong>
        {privacy
          ? "Documento de privacidad y tratamiento de datos para profesionales veterinarios."
          : "Términos legales de uso para profesionales veterinarios certificados."}
      </p>
      <p className="legal-modal__intro-meta">
        Última actualización: 28 de diciembre de 2025 · Vigente desde el 1 de enero de 2026
      </p>
    </div>
  );
}

function PrivacyPolicyBody() {
  return (
    <>
      <h3 id="legal-privacy">Protección de datos y privacidad</h3>
      <h4>Marco legal aplicable</h4>
      <p>La Plataforma cumple con:</p>
      <ul>
        <li>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</li>
        <li>Reglamento General de Protección de Datos (GDPR) para usuarios en la Unión Europea</li>
        <li>Normativa de protección de datos de salud aplicable</li>
        <li>Estándares internacionales de seguridad de información (ISO 27001, ISO 27799)</li>
      </ul>

      <h4>Datos recopilados</h4>
      <p>Recopilamos:</p>
      <ul>
        <li>Datos de identificación profesional (nombre, país, registro, institución)</li>
        <li>Datos de contacto (correo electrónico, teléfono)</li>
        <li>Datos de uso de la Plataforma</li>
        <li>Datos clínicos anonimizados con fines de mejora del sistema</li>
      </ul>

      <h4>Uso de datos</h4>
      <p>Los datos se utilizan para:</p>
      <ul>
        <li>Proporcionar y mejorar el servicio</li>
        <li>Verificación de credenciales profesionales</li>
        <li>Análisis estadístico y mejora de algoritmos</li>
        <li>Cumplimiento de obligaciones legales</li>
        <li>Comunicaciones relacionadas con el servicio</li>
      </ul>

      <h4>Seguridad</h4>
      <p>Implementamos medidas de seguridad que incluyen:</p>
      <ul>
        <li>Encriptación de datos en tránsito y en reposo (TLS 1.3, AES-256)</li>
        <li>Autenticación multifactor</li>
        <li>Controles de acceso basados en roles</li>
        <li>Auditorías de seguridad periódicas</li>
        <li>Protocolos de respuesta a incidentes</li>
      </ul>

      <h4>Derechos del usuario</h4>
      <p>Usted tiene derecho a:</p>
      <ul>
        <li>Acceder a sus datos personales</li>
        <li>Rectificar datos inexactos</li>
        <li>Cancelar su cuenta y datos</li>
        <li>Oponerse al tratamiento de datos</li>
        <li>Portabilidad de datos</li>
        <li>Revocar consentimientos otorgados</li>
      </ul>

      <div className="legal-modal__contact">
        <p>
          Para ejercer sus derechos ARCO o consultas de privacidad, escríbenos a{" "}
          <a href="mailto:privacidad@guiaa.com">privacidad@guiaa.com</a>.
        </p>
      </div>
    </>
  );
}

export function TermsAndConditionsModal({
  isOpen,
  onClose,
  onAccept,
  readOnly = false,
  variant = "terms",
}) {

  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const contentRef = useRef(null);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setScrolledToBottom(true);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setScrolledToBottom(false);
      return undefined;
    }

    if (readOnly || variant === "privacy") {
      setScrolledToBottom(true);
    }

    const frame = window.requestAnimationFrame(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, readOnly, variant, onClose]);

  if (!isOpen) return null;

  const isPrivacy = variant === "privacy";
  const modalTitle = isPrivacy ? "Política de Privacidad" : "Términos y Condiciones";
  const modalSubtitle = isPrivacy
    ? "Cómo protegemos y tratamos tus datos profesionales y clínicos."
    : "Condiciones de uso de la plataforma GUIAA para MVZ certificados.";

  return createPortal(
    <div
      className="modal-overlay legal-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal-content terms-modal legal-modal${isPrivacy ? " legal-modal--privacy" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        <div className="modal-header legal-modal__header">
          <div className="legal-modal__header-text">
            <h2 id="legal-modal-title" className="legal-modal__title">
              {modalTitle}
            </h2>
            <p className="legal-modal__subtitle">{modalSubtitle}</p>
          </div>
          <button
            type="button"
            className="modal-close legal-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="modal-body terms-content legal-modal__body"
        >
          <LegalIntro privacy={isPrivacy} />

          {isPrivacy ? (
            <PrivacyPolicyBody />
          ) : (
            <>
          <h3>1. ACEPTACIÓN DE LOS TÉRMINOS</h3>
          <p>Al acceder y utilizar la Plataforma GUIAA (en adelante, "la Plataforma"), usted acepta estar legalmente vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar la Plataforma.</p>

          <h3>2. DEFINICIONES</h3>
          <ul>
            <li><strong>Plataforma GUIAA:</strong> Sistema de Soporte a la Decisión Clínica (CDS) de grado avanzado L4 y L5 para profesionales veterinarios.</li>
            <li><strong>Usuario:</strong> Médico veterinario titulado con registro o licencia profesional vigente en su país.</li>
            <li><strong>CDS L4-L5:</strong> Sistema de soporte a la decisión clínica de nivel 4 y 5, que proporciona recomendaciones basadas en análisis de datos clínicos.</li>
            <li><strong>Datos Clínicos:</strong> Información relacionada con mascotas ingresada en la Plataforma.</li>
          </ul>

          <h3>3. ELEGIBILIDAD Y REGISTRO</h3>
          <h4>3.1 Requisitos de Elegibilidad</h4>
          <p>Para utilizar la Plataforma, usted debe:</p>
          <ul>
            <li>Ser médico veterinario titulado en Latinoamérica</li>
            <li>Poseer matrícula, licencia o registro profesional válido emitido por la autoridad competente de su país</li>
            <li>Estar legalmente autorizado para ejercer la medicina veterinaria en su jurisdicción</li>
            <li>Ser mayor de edad según las leyes aplicables</li>
            <li>Tener capacidad legal para celebrar contratos vinculantes</li>
          </ul>

          <h4>3.2 Proceso de Verificación</h4>
          <ul>
            <li>Durante el registro, deberá indicar su país y número de registro profesional</li>
            <li>Deberá subir un documento que acredite su titulación (título, matrícula o licencia)</li>
            <li>Nuestro equipo revisará la documentación; en México también se intenta validación automática con SEP</li>
            <li>Nos reservamos el derecho de solicitar documentación adicional</li>
            <li>El acceso será otorgado únicamente tras la verificación exitosa</li>
            <li>La verificación puede tardar hasta 72 horas hábiles</li>
          </ul>

          <h4>3.3 Responsabilidad del Usuario</h4>
          <p>Usted es responsable de:</p>
          <ul>
            <li>Mantener la confidencialidad de sus credenciales de acceso</li>
            <li>Todas las actividades realizadas bajo su cuenta</li>
            <li>Notificar inmediatamente cualquier uso no autorizado</li>
            <li>Actualizar su información profesional cuando sea necesario</li>
          </ul>

          <h3>4. NATURALEZA DEL SERVICIO</h3>
          <h4>4.1 Herramienta de Apoyo</h4>
          <p>La Plataforma GUIAA es una herramienta de SOPORTE a la decisión clínica que:</p>
          <ul>
            <li>Proporciona información basada en evidencia científica</li>
            <li>Ofrece recomendaciones algorítmicas</li>
            <li>Facilita el análisis de datos clínicos</li>
            <li><strong>NO sustituye el juicio clínico profesional del veterinario</strong></li>
          </ul>

          <h4>4.2 Limitaciones</h4>
          <ul>
            <li>Las recomendaciones son orientativas, no prescriptivas</li>
            <li>El veterinario usuario es el único responsable de las decisiones clínicas finales</li>
            <li>La Plataforma no establece relación veterinario–mascota</li>
            <li>No proporciona diagnósticos definitivos ni tratamientos específicos sin evaluación profesional</li>
          </ul>

          <h4>4.3 Responsabilidad Profesional</h4>
          <p>El usuario veterinario:</p>
          <ul>
            <li>Mantiene la responsabilidad exclusiva sobre sus decisiones clínicas</li>
            <li>Debe verificar toda información antes de aplicarla clínicamente</li>
            <li>Debe considerar las circunstancias individuales de cada caso</li>
            <li>Es responsable del cumplimiento de las normas profesionales y éticas aplicables</li>
          </ul>

          <h3 id="legal-privacy">5. PROTECCIÓN DE DATOS Y PRIVACIDAD</h3>
          <h4>5.1 Marco Legal Aplicable</h4>
          <p>La Plataforma cumple con:</p>
          <ul>
            <li>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</li>
            <li>Reglamento General de Protección de Datos (GDPR) para usuarios en la Unión Europea</li>
            <li>Normativa de protección de datos de salud aplicable</li>
            <li>Estándares internacionales de seguridad de información (ISO 27001, ISO 27799)</li>
          </ul>

          <h4>5.2 Datos Recopilados</h4>
          <p>Recopilamos:</p>
          <ul>
            <li>Datos de identificación profesional (nombre, país, registro, institución)</li>
            <li>Datos de contacto (correo electrónico, teléfono)</li>
            <li>Datos de uso de la Plataforma</li>
            <li>Datos clínicos anonimizados con fines de mejora del sistema</li>
          </ul>

          <h4>5.3 Uso de Datos</h4>
          <p>Los datos se utilizan para:</p>
          <ul>
            <li>Proporcionar y mejorar el servicio</li>
            <li>Verificación de credenciales profesionales</li>
            <li>Análisis estadístico y mejora de algoritmos</li>
            <li>Cumplimiento de obligaciones legales</li>
            <li>Comunicaciones relacionadas con el servicio</li>
          </ul>

          <h4>5.4 Seguridad</h4>
          <p>Implementamos medidas de seguridad que incluyen:</p>
          <ul>
            <li>Encriptación de datos en tránsito y en reposo (TLS 1.3, AES-256)</li>
            <li>Autenticación multifactor</li>
            <li>Controles de acceso basados en roles</li>
            <li>Auditorías de seguridad periódicas</li>
            <li>Protocolos de respuesta a incidentes</li>
          </ul>

          <h4>5.5 Derechos del Usuario</h4>
          <p>Usted tiene derecho a:</p>
          <ul>
            <li>Acceder a sus datos personales</li>
            <li>Rectificar datos inexactos</li>
            <li>Cancelar su cuenta y datos</li>
            <li>Oponerse al tratamiento de datos</li>
            <li>Portabilidad de datos</li>
            <li>Revocar consentimientos otorgados</li>
          </ul>
          <p>Para ejercer sus derechos, contacte a: <strong>privacidad@guiaa.com</strong></p>

          <h3>6. PROPIEDAD INTELECTUAL</h3>
          <h4>6.1 Derechos de la Plataforma</h4>
          <p>Todos los derechos de propiedad intelectual sobre la Plataforma, incluyendo software, código fuente, algoritmos, diseño, contenido, textos, gráficos, materiales, marcas comerciales y logotipos son propiedad exclusiva de GUIAA o sus licenciantes.</p>

          <h4>6.2 Licencia de Uso</h4>
          <p>Se otorga una licencia limitada, no exclusiva, no transferible y revocable para acceder y utilizar la Plataforma conforme a estos términos, con fines profesionales legítimos exclusivamente.</p>

          <h4>6.3 Restricciones</h4>
          <p>Queda estrictamente prohibido:</p>
          <ul>
            <li>Copiar, modificar o crear obras derivadas</li>
            <li>Realizar ingeniería inversa del software</li>
            <li>Extraer datos mediante web scraping o técnicas similares</li>
            <li>Comercializar o revender el acceso a la Plataforma</li>
            <li>Remover avisos de propiedad intelectual</li>
          </ul>

          <h3>7. USO ACEPTABLE</h3>
          <h4>7.1 Conductas Permitidas</h4>
          <p>La Plataforma debe utilizarse exclusivamente para:</p>
          <ul>
            <li>Apoyo en la toma de decisiones clínicas veterinarias</li>
            <li>Consulta de información científica actualizada</li>
            <li>Análisis de casos clínicos con fines profesionales</li>
            <li>Educación y formación profesional continua</li>
          </ul>

          <h4>7.2 Conductas Prohibidas</h4>
          <p>Está estrictamente prohibido:</p>
          <ul>
            <li>Compartir credenciales de acceso con terceros no autorizados</li>
            <li>Utilizar la Plataforma para fines no veterinarios</li>
            <li>Ingresar información falsa o engañosa</li>
            <li>Interferir con el funcionamiento de la Plataforma</li>
            <li>Realizar actividades que violen leyes aplicables</li>
            <li>Automatizar el acceso mediante bots o scripts no autorizados</li>
          </ul>

          <h3>8. SISTEMA DE SOPORTE A LA DECISIÓN CLÍNICA</h3>
          <h4>8.1 Funcionamiento del CDS L4-L5</h4>
          <p>La Plataforma utiliza:</p>
          <ul>
            <li>Algoritmos computacionales entrenados con datos veterinarios</li>
            <li>Modelos de procesamiento de información clínica</li>
            <li>Sistemas de recomendación basados en evidencia científica</li>
            <li>Análisis predictivo de patrones clínicos</li>
          </ul>

          <h4>8.2 Limitaciones del Sistema</h4>
          <p>El usuario reconoce que:</p>
          <ul>
            <li>Los sistemas computacionales pueden cometer errores</li>
            <li>Las recomendaciones se basan en datos históricos y pueden no aplicar a todos los casos</li>
            <li>La tecnología está en constante evolución y mejora</li>
            <li>Existe un margen de incertidumbre en las predicciones</li>
          </ul>

          <h3>9. RESPONSABILIDAD Y GARANTÍAS</h3>
          <h4>9.1 Exclusión de Garantías</h4>
          <p>La Plataforma se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD", sin garantías de ningún tipo.</p>

          <h4>9.2 Limitación de Responsabilidad</h4>
          <p>GUIAA no será responsable por:</p>
          <ul>
            <li>Decisiones clínicas tomadas por el usuario</li>
            <li>Daños derivados del uso o incapacidad de usar la Plataforma</li>
            <li>Pérdida de datos, beneficios o información</li>
            <li>Interrupciones del servicio por causas de fuerza mayor</li>
          </ul>

          <h3>10. CUMPLIMIENTO REGULATORIO</h3>
          <p>El usuario debe cumplir con:</p>
          <ul>
            <li>Ley Federal de Sanidad Animal (México)</li>
            <li>Normas Oficiales Mexicanas aplicables</li>
            <li>Regulaciones estatales y locales de práctica veterinaria</li>
            <li>Códigos de ética profesional</li>
          </ul>

          <h3>11. TARIFAS Y PAGOS</h3>
          <ul>
            <li>La Plataforma opera bajo modelo de suscripción</li>
            <li>Las tarifas se especifican en el sitio web</li>
            <li>Periodo de garantía de satisfacción: 14 días</li>
          </ul>

          <h3>12. DURACIÓN Y TERMINACIÓN</h3>
          <p>El usuario puede cancelar su suscripción en cualquier momento. GUIAA puede suspender o terminar el acceso por violación de estos términos.</p>

          <h3>13. DISPOSICIONES GENERALES</h3>
          <p>Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia se someterá a la jurisdicción exclusiva de los tribunales de Ciudad de México.</p>

          <h3>14. CONTACTO</h3>
          <p>
            <strong>Plataforma GUIAA</strong><br/>
            Correo electrónico: soporte@guiaa.com<br/>
            Privacidad y datos: privacidad@guiaa.com<br/>
            Legal: legal@guiaa.com
          </p>

          <div style={{ 
            marginTop: "30px", 
            padding: "20px", 
            backgroundColor: "var(--bg-secondary)", 
            borderRadius: "8px",
            border: "2px solid var(--primary-color)"
          }}>
            <h3 style={{ marginTop: 0 }}>CONSENTIMIENTO</h3>
            <p>Al marcar la casilla de aceptación y/o utilizar la Plataforma GUIAA, usted declara que:</p>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li>✓ Ha leído y comprendido estos Términos y Condiciones</li>
              <li>✓ Es veterinario titulado con registro profesional válido</li>
              <li>✓ Acepta estar legalmente vinculado por estos términos</li>
              <li>✓ Utilizará la Plataforma de manera responsable y ética</li>
              <li>✓ Comprende que es el único responsable de sus decisiones clínicas</li>
              <li>✓ Ha sido informado sobre el tratamiento de sus datos personales</li>
            </ul>
          </div>

          <p className="legal-modal__meta">
            Fecha de última actualización: 28 de diciembre de 2025
            <br />
            Versión: 1.0 - 2026
            <br />
            © 2026 Plataforma GUIAA. Todos los derechos reservados.
          </p>
            </>
          )}

          {isPrivacy && (
            <p className="legal-modal__meta">
              © 2026 Plataforma GUIAA. Todos los derechos reservados.
            </p>
          )}
        </div>

        <div
          className={`modal-footer legal-modal__footer${readOnly ? " legal-modal__footer--readonly" : ""}`}
        >
          {readOnly ? (
            <Button type="button" className="legal-modal__btn-close" onClick={onClose}>
              Cerrar
            </Button>
          ) : (
            <>
              <span className="legal-modal__hint">
                {!scrolledToBottom && "Desplázate para leer todos los términos"}
              </span>
              <div className="legal-modal__actions">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={onAccept}
                  disabled={!scrolledToBottom}
                  className={!scrolledToBottom ? "opacity-50" : ""}
                >
                  Acepto los Términos
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
