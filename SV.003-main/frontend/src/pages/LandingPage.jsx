import React from "react";
import { Header } from "../components/Header";

export function LandingPage({ setView }) {
  return (
    <div className="landing-page">
      <Header setView={setView} />

      {/* Hero Section */}
      <section className="hero-ivet">
        {/* Aurora borealis effect */}
        <div className="aurora-bg">
          <div className="aurora-layer"></div>
        </div>
        
        {/* Morphing shape */}
        <div className="morph-shape" style={{top: '20%', right: '10%'}}></div>
        
        {/* Spotlight */}
        <div className="spotlight" style={{top: '30%', left: '20%'}}></div>
        
        {/* Blobs animados */}
        <div className="hero-blob hero-blob-1"></div>
        <div className="hero-blob hero-blob-2"></div>
        <div className="hero-blob hero-blob-3"></div>
        
        {/* Partículas animadas */}
        <div className="hero-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
        
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Plataforma exclusiva para veterinarios
            </div>
            
            <h1 className="hero-title">
              Diagnósticos<br />
              <span className="highlight">Profesionales</span>
            </h1>
            
            <p className="hero-subtitle">
              Integra anamnesis, hallazgos clínicos y antecedentes para proponer
              planes diagnósticos y terapéuticos basados en evidencia.
              Diseñada exclusivamente para médicos veterinarios certificados.
            </p>
            <p className="hero-subtitle hero-subtitle-secondary">
              Plataforma de diagnóstico veterinario con soporte CDS avanzado
              de nivel L4 y L5.
            </p>
            
            <div className="hero-cta">
              <button 
                onClick={() => setView("register")}
                className="btn-hero-primary"
              >
                🩺 Registrarme como Veterinario
              </button>
              <button 
                onClick={() => setView("login")}
                className="btn-hero-secondary"
              >
                Iniciar Sesión
              </button>
            </div>
            
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-icon">🩺</div>
                <div className="hero-stat-number" data-target="500">500+</div>
                <div className="hero-stat-label">Veterinarios activos</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-icon">📋</div>
                <div className="hero-stat-number" data-target="10000">10K+</div>
                <div className="hero-stat-label">Consultas realizadas</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-icon">⭐</div>
                <div className="hero-stat-number" data-target="98">98%</div>
                <div className="hero-stat-label">Satisfacción</div>
              </div>
            </div>
          </div>
          
          <div className="hero-visual">
            {/* Floating badges */}
            <div className="video-floating-badge top-left">🔬 Análisis Clínico</div>
            <div className="video-floating-badge top-right">⚡ Tiempo Real</div>
            <div className="video-floating-badge bottom-left">✓ Verificado</div>
            
            <div className="hero-video-container">
              <div className="hero-video-inner">
                {/* Browser bar mockup */}
                <div className="video-browser-bar">
                  <div className="browser-dot red"></div>
                  <div className="browser-dot yellow"></div>
                  <div className="browser-dot green"></div>
                  <div className="browser-url">guia.vet/dashboard</div>
                </div>
                
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="hero-video"
                >
                  <source src="/VG1.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-scroll-indicator">
          <span className="scroll-label">Desliza para descubrir más</span>
          <span className="scroll-mouse">
            <span className="scroll-wheel"></span>
          </span>
        </div>
      </section>

      {/* Trust Badges - Carrusel */}
      <section className="trust-badges">
        <div className="trust-badges-track">
          <div className="trust-badge">
            <div className="trust-badge-icon">🔒</div>
            <span>Datos Encriptados</span>
          </div>
          <div className="trust-badge">
            <div className="trust-badge-icon">✓</div>
            <span>Veterinarios Verificados</span>
          </div>
          <div className="trust-badge">
            <div className="trust-badge-icon">🏥</div>
            <span>Cumple NORMA Oficial</span>
          </div>
          <div className="trust-badge">
            <div className="trust-badge-icon">⚡</div>
            <span>Respuesta Inmediata</span>
          </div>

          {/* Duplicado para scroll continuo */}
          <div className="trust-badge">
            <div className="trust-badge-icon">🔒</div>
            <span>Datos Encriptados</span>
          </div>
          <div className="trust-badge">
            <div className="trust-badge-icon">✓</div>
            <span>Veterinarios Verificados</span>
          </div>
          <div className="trust-badge">
            <div className="trust-badge-icon">🏥</div>
            <span>Cumple NORMA Oficial</span>
          </div>
          <div className="trust-badge">
            <div className="trust-badge-icon">⚡</div>
            <span>Respuesta Inmediata</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Características</span>
            <h2>Herramientas clínicas integradas para tu práctica</h2>
            <p>
              Suite de soporte clínico para estructurar anamnesis, razonamiento
              diagnóstico y plan terapéutico en cada consulta.
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔬</div>
              <h3>Análisis Especializado</h3>
              <p>Motor de análisis clínico que integra signos, antecedentes, comorbilidades y literatura actualizada para priorizar hipótesis diagnósticas y estudios complementarios.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Historial Completo</h3>
              <p>Registro clínico longitudinal con búsqueda avanzada, filtros por especie y exportación de reportes para auditoría o seguimiento.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💊</div>
              <h3>Planes de Tratamiento</h3>
              <p>Generación de esquemas terapéuticos sugeridos con dosis, frecuencia, duración y recordatorios de reevaluación según la presentación clínica.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🐾</div>
              <h3>Multi-Especies</h3>
              <p>Protocolos adaptados para perros, gatos, aves, reptiles y pequeños mamíferos, con parámetros fisiológicos y rangos de referencia específicos por especie.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Acceso 24/7</h3>
              <p>Acceso seguro desde cualquier dispositivo, con sesiones cifradas y alta disponibilidad en la nube para consultas en guardias y urgencias.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Seguro y Privado</h3>
              <p>Datos encriptados en tránsito y en reposo, controles de acceso por usuario y alineación con buenas prácticas de protección de información médica.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge" style={{background: 'rgba(59,130,246,0.2)', color: '#93c5fd'}}>Testimonios</span>
            <h2>Lo que dicen nuestros usuarios</h2>
            <p>Veterinarios de todo México confían en GUIAA</p>
          </div>
          
          <div className="testimonials-wrapper">
            <div className="testimonial-card">
              <div className="testimonial-rating">
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
              </div>
              <p className="testimonial-quote">
                "GUIAA me ha ahorrado horas de análisis cada semana. El soporte a la decisión clínica 
                es consistente y las recomendaciones terapéuticas están sólidamente justificadas."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">DG</div>
                <div className="testimonial-info">
                  <h4>Dr. García Mendoza</h4>
                  <p>Clínica Veterinaria Central, CDMX</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-rating">
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
              </div>
              <p className="testimonial-quote">
                "La mejor inversión para mi clínica. El análisis de pruebas de laboratorio 
                es muy completo y me ayuda a dar mejores diagnósticos."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">ML</div>
                <div className="testimonial-info">
                  <h4>Dra. López Ramírez</h4>
                  <p>Hospital Veterinario Sur, Monterrey</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-rating">
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
              </div>
              <p className="testimonial-quote">
                "Excelente para casos de especies exóticas. Los protocolos específicos 
                y la base de conocimiento me dan confianza en mis diagnósticos."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">CR</div>
                <div className="testimonial-info">
                  <h4>Dr. Rodríguez Sánchez</h4>
                  <p>Clínica de Exóticos, Guadalajara</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos Marquee - Especies soportadas */}
      <section className="logos-marquee">
        <p className="logos-marquee-title">Especies que puedes consultar con GUIAA</p>
        <div className="logos-marquee-track">
          <div className="logo-marquee-item"><span>🐕</span> Perros</div>
          <div className="logo-marquee-item"><span>🐈</span> Gatos</div>
          <div className="logo-marquee-item"><span>🦜</span> Aves</div>
          <div className="logo-marquee-item"><span>🐰</span> Conejos y roedores</div>
          <div className="logo-marquee-item"><span>🐢</span> Tortugas y reptiles</div>
          <div className="logo-marquee-item"><span>🦎</span> Iguanas y exóticos pequeños</div>
          <div className="logo-marquee-item"><span>🐭</span> Pequeños mamíferos</div>
          <div className="logo-marquee-item"><span>🐾</span> Otros casos especiales</div>
          {/* Duplicados para el efecto infinito */}
          <div className="logo-marquee-item"><span>🐕</span> Perros</div>
          <div className="logo-marquee-item"><span>🐈</span> Gatos</div>
          <div className="logo-marquee-item"><span>🦜</span> Aves</div>
          <div className="logo-marquee-item"><span>🐰</span> Conejos y roedores</div>
          <div className="logo-marquee-item"><span>🐢</span> Tortugas y reptiles</div>
          <div className="logo-marquee-item"><span>🦎</span> Iguanas y exóticos pequeños</div>
          <div className="logo-marquee-item"><span>🐭</span> Pequeños mamíferos</div>
          <div className="logo-marquee-item"><span>🐾</span> Otros casos especiales</div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="pricing-preview">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Precios</span>
            <h2>Planes simples y transparentes</h2>
            <p>Elige el plan que se adapte a tu práctica</p>
          </div>
          
          <div className="pricing-preview-cards">
            <div className="pricing-preview-card">
              <div className="plan-name">Básico</div>
              <div className="plan-price">$950<span>/mes</span></div>
              <div className="plan-feature">30C (consultas mensuales)</div>
            </div>
            
            <div className="pricing-preview-card popular">
              <div className="popular-tag">⭐ Más Popular</div>
              <div className="plan-name">Premium</div>
              <div className="plan-price">$2200<span>/mes</span></div>
              <div className="plan-feature">150C (consultas mensuales)</div>
            </div>
            
            <div className="pricing-preview-card">
              <div className="plan-name">Profesional</div>
              <div className="plan-price">$1250<span>/mes</span></div>
              <div className="plan-feature">35C (consultas mensuales)</div>
            </div>
          </div>
          
          <div style={{textAlign: 'center', marginTop: '40px'}}>
            <button 
              onClick={() => setView("membership")}
              className="btn-hero-secondary"
              style={{background: '#0f172a', borderColor: '#334155'}}
            >
              Ver todos los planes →
            </button>
          </div>
          
          <p style={{
            textAlign: 'center', 
            marginTop: '24px', 
            fontSize: '14px', 
            color: 'var(--text-secondary)',
            fontStyle: 'italic'
          }}>
            * Si requieres factura, será más IVA sobre el costo del plan.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">FAQ</span>
            <h2>Preguntas Frecuentes</h2>
            <p>Todo lo que necesitas saber sobre GUIAA</p>
          </div>
          
          <div className="faq-grid">
            <div className="faq-item">
              <button className="faq-question" onClick={(e) => e.currentTarget.parentElement.classList.toggle('open')}>
                ¿Qué tipo de veterinarios pueden usar GUIAA?
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <p>GUIAA está diseñado exclusivamente para médicos veterinarios titulados y con cédula profesional vigente, que realizan práctica clínica de pequeños animales y exóticos.</p>
              </div>
            </div>
            
            <div className="faq-item">
              <button className="faq-question" onClick={(e) => e.currentTarget.parentElement.classList.toggle('open')}>
                ¿Cómo funciona el análisis clínico?
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <p>El sistema estructura los datos de la consulta (síntomas, hallazgos físicos y antecedentes), los compara con una base de casos anonimizados y aplica algoritmos clínicos y guías actualizadas para sugerir hipótesis diagnósticas y estudios a considerar.</p>
              </div>
            </div>
            
            <div className="faq-item">
              <button className="faq-question" onClick={(e) => e.currentTarget.parentElement.classList.toggle('open')}>
                ¿Qué significa diagnóstico médico veterinario nivel L4 y L5?
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <p>Hace referencia a niveles avanzados de soporte a la decisión clínica (Clinical Decision Support). En L4 y L5 el sistema no solo presenta información, sino que integra múltiples variables clínicas, aplica protocolos y guías, y propone cursos de acción sugeridos para apoyar decisiones médicas más seguras y consistentes.</p>
              </div>
            </div>
            
            <div className="faq-item">
              <button className="faq-question" onClick={(e) => e.currentTarget.parentElement.classList.toggle('open')}>
                ¿Mis datos están seguros?
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <p>Sí, todos los datos están encriptados y cumplimos con las normativas de protección de datos. Tú controlas toda tu información.</p>
              </div>
            </div>
            
            <div className="faq-item">
              <button className="faq-question" onClick={(e) => e.currentTarget.parentElement.classList.toggle('open')}>
                ¿Puedo cancelar mi membresía?
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <p>Sí, puedes cancelar en cualquier momento sin penalizaciones. Tu acceso continuará hasta el fin del período pagado.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <h2>¿Listo para transformar tu práctica?</h2>
            <p>Únete a cientos de veterinarios que ya confían en GUIAA</p>
            <button 
              onClick={() => setView("register")}
              className="btn-cta"
            >
              Comenzar Ahora
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-modern">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3>GUIAA</h3>
              <p>
                Plataforma profesional de consultoría veterinaria. 
                Diseñada exclusivamente para médicos veterinarios certificados en México.
              </p>
              <div className="footer-social">
                <a href="#">📘</a>
                <a href="#">🐦</a>
                <a href="#">📷</a>
                <a href="#">💼</a>
              </div>
            </div>
            
            <div className="footer-column">
              <h4>Producto</h4>
              <ul>
                <li><a href="#" onClick={() => setView("register")}>Consultas Veterinarias</a></li>
                <li><a href="#" onClick={() => setView("membership")}>Planes y Membresías</a></li>
                <li><a href="#" onClick={() => setView("register")}>Recursos Clínicos</a></li>
                <li><a href="#" onClick={() => setView("register")}>Centro de Ayuda</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Empresa</h4>
              <ul>
                <li><a href="#" onClick={() => setView("landing")}>Quiénes Somos</a></li>
                <li><a href="#" onClick={() => setView("landing")}>Noticias y Actualizaciones</a></li>
                <li><a href="#" onClick={() => setView("landing")}>Nuestro Equipo</a></li>
                <li><a href="https://wa.me/5215512345678?text=Hola,%20me%20interesa%20GUIAA" target="_blank" rel="noopener noreferrer">Contacto</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Legal</h4>
              <ul>
                <li><a href="#" onClick={() => setView("landing")}>Política de Privacidad</a></li>
                <li><a href="#" onClick={() => setView("landing")}>Términos de Uso</a></li>
                <li><a href="#" onClick={() => setView("landing")}>Política de Cookies</a></li>
                <li><a href="#" onClick={() => setView("landing")}>Aviso Legal</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-badges">
            <div className="footer-badge">
              <span className="badge-icon">🔒</span>
              <span>SSL Seguro</span>
            </div>
            <div className="footer-badge">
              <span className="badge-icon">🛡️</span>
              <span>Datos Protegidos</span>
            </div>
            <div className="footer-badge">
              <span className="badge-icon">✓</span>
              <span>HIPAA Compliant</span>
            </div>
            <div className="footer-badge">
              <span className="badge-icon">🇲🇽</span>
              <span>Hecho en México</span>
            </div>
          </div>
          
          <div className="footer-bottom-modern">
            <p>© 2025 GUIAA. Todos los derechos reservados.</p>
            <p>Hecho con ❤️ para veterinarios mexicanos</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
