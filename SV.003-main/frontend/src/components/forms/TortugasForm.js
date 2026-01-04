import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';

const TortugasForm = ({ formData, setFormData }) => {
  const [activeSection, setActiveSection] = useState('tortugas-info-basica');

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleSection = useCallback((e) => {
    const section = e.target.closest('.form-section');
    if (section && e.target.tagName === 'H3') section.classList.toggle('collapsed');
  }, []);

  const requiredFields = [
    'nombre_mascota', 'especie_exacta', 'edad', 'sexo', 'peso', 'condicion_corporal',
    'secrecion_nasal', 'respiracion', 'caparazon', 'apetito', 'heces',
    'tipo_dieta', 'tipo_ambiente', 'iluminacion_uvb'
  ];

  const progress = useMemo(() => {
    const filled = requiredFields.filter(field => formData[field] && formData[field] !== '').length;
    return Math.round((filled / requiredFields.length) * 100);
  }, [formData]);

  const sections = [
    { id: 'tortugas-info-basica', label: 'Información Básica', icon: '📋' },
    { id: 'tortugas-respiratorio', label: 'Sistema Respiratorio', icon: '🫁' },
    { id: 'tortugas-tegumentario', label: 'Sistema Tegumentario', icon: '🐢' },
    { id: 'tortugas-digestivo', label: 'Sistema Digestivo', icon: '🫃' },
    { id: 'tortugas-neurologico', label: 'Sistema Neurológico', icon: '🧠' },
    { id: 'tortugas-comportamiento', label: 'Comportamiento', icon: '👀' },
    { id: 'tortugas-reproductivo', label: 'Sistema Reproductivo', icon: '🥚' },
    { id: 'tortugas-alimentacion', label: 'Alimentación', icon: '🥗' },
    { id: 'tortugas-ambiente', label: 'Ambiente', icon: '🏠' },
    { id: 'tortugas-socializacion', label: 'Socialización', icon: '🤝' },
    { id: 'tortugas-historial', label: 'Historia Médica Previa', icon: '📁' },
    { id: 'tortugas-examen', label: 'Examen Físico', icon: '🩺' },
    { id: 'tortugas-riesgos', label: 'Factores de Riesgo', icon: '⚠️' },
  ];

  useEffect(() => {
    const observers = [];
    const options = { root: null, rootMargin: '-20% 0px -70% 0px', threshold: 0 };
    sections.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(section.id); });
        }, options);
        observer.observe(element);
        observers.push(observer);
      }
    });
    return () => observers.forEach(observer => observer.disconnect());
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="species-form">
      <h2>Datos del Paciente - Tortuga</h2>

      <div className="species-form-progress">
        <div className="species-form-progress-header">
          <span className="species-form-progress-label">Progreso del formulario</span>
          <span className="species-form-progress-percent">{progress}%</span>
        </div>
        <div className="species-form-progress-bar">
          <div className={`species-form-progress-fill ${progress === 100 ? 'complete' : ''}`} style={{ width: `${progress}%` }} />
        </div>
        <div className="species-form-progress-stats">
          <span>{requiredFields.filter(f => formData[f] && formData[f] !== '').length} de {requiredFields.length} campos</span>
          {progress === 100 && <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Completo</span>}
        </div>
      </div>

      <div className="species-form-layout">
        <aside className="species-form-nav">
          <div className="species-form-nav-title">Secciones</div>
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  className={`species-form-nav-link ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => scrollToSection(section.id)}
                >
                  <span className="nav-icon">{section.icon}</span> {section.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="species-form-content" onClick={toggleSection}>
      
      {/* Información Básica */}
      <div id="tortugas-info-basica" className="form-section">
        <h3>Información Básica</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Nombre del Paciente *</label>
            <input
              type="text"
              required
              value={formData.nombre_mascota || ''}
              onChange={(e) => handleChange('nombre_mascota', e.target.value)}
              placeholder="Nombre"
            />
          </div>
          
          <div className="form-group">
            <label>Nombre del Dueño *</label>
            <input
              type="text"
              required
              value={formData.nombre_dueño || ''}
              onChange={(e) => handleChange('nombre_dueño', e.target.value)}
              placeholder="Nombre del propietario"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Especie Exacta *</label>
            <input
              type="text"
              required
              value={formData.especie_exacta || ''}
              onChange={(e) => handleChange('especie_exacta', e.target.value)}
              placeholder="Ej: Testudo graeca, Chelonoidis carbonaria"
            />
          </div>
          
          <div className="form-group">
            <label>Subespecie/Variante</label>
            <input
              type="text"
              value={formData.subespecie || ''}
              onChange={(e) => handleChange('subespecie', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Edad Estimada (años) *</label>
            <input
              type="text"
              required
              value={formData.edad || ''}
              onChange={(e) => handleChange('edad', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Sexo *</label>
            <select
              required
              value={formData.sexo || ''}
              onChange={(e) => handleChange('sexo', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Peso Actual (g/kg) *</label>
            <input
              type="text"
              required
              value={formData.peso || ''}
              onChange={(e) => handleChange('peso', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Condición Corporal *</label>
            <select
              required
              value={formData.condicion_corporal || ''}
              onChange={(e) => handleChange('condicion_corporal', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="emaciado">Emaciado</option>
              <option value="delgado">Delgado</option>
              <option value="ideal">Ideal</option>
              <option value="sobrepeso">Sobrepeso</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tamaño Caparazón (cm) *</label>
            <input
              type="text"
              required
              value={formData.tamano_caparazon || ''}
              onChange={(e) => handleChange('tamano_caparazon', e.target.value)}
              placeholder="Largo x Ancho x Alto"
            />
          </div>
          
          <div className="form-group">
            <label>Origen *</label>
            <select
              required
              value={formData.origen || ''}
              onChange={(e) => handleChange('origen', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="silvestre">Silvestre</option>
              <option value="criadero">Criadero</option>
              <option value="comercial">Comercial</option>
              <option value="regalo">Regalo</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Duración del Problema *</label>
          <select
            required
            value={formData.duracion_problema || ''}
            onChange={(e) => handleChange('duracion_problema', e.target.value)}
          >
            <option value="">Seleccionar</option>
            <option value="<12h">&lt; 12 horas</option>
            <option value="12-24h">12-24 horas</option>
            <option value="2-3dias">2-3 días</option>
            <option value="4-7dias">4-7 días</option>
            <option value=">1semana">&gt; 1 semana</option>
          </select>
        </div>
      </div>

      {/* Sistema Respiratorio */}
      <div id="tortugas-respiratorio" className="form-section">
        <h3>Sistema Respiratorio</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Secreción Nasal/Oral *</label>
            <select
              required
              value={formData.secrecion_nasal || 'NO'}
              onChange={(e) => handleChange('secrecion_nasal', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="clara">Clara</option>
              <option value="mucosa">Mucosa</option>
              <option value="purulenta">Purulenta</option>
              <option value="sangre">Sangre</option>
            </select>
          </div>
          
          {formData.secrecion_nasal !== 'NO' && (
            <div className="form-group">
              <label>Localización</label>
              <select
                value={formData.secrecion_localizacion || ''}
                onChange={(e) => handleChange('secrecion_localizacion', e.target.value)}
              >
                <option value="">Seleccionar</option>
                <option value="unilateral">Unilateral</option>
                <option value="bilateral">Bilateral</option>
              </select>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Burbujas en boca/nariz? *</label>
            <select
              required
              value={formData.burbujas || 'NO'}
              onChange={(e) => handleChange('burbujas', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Dificultad Respiratoria *</label>
            <select
              required
              value={formData.dificultad_respiratoria || 'NO'}
              onChange={(e) => handleChange('dificultad_respiratoria', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="boca_abierta">Boca abierta</option>
              <option value="movimiento_cuello">Movimiento cuello exagerado</option>
              <option value="aleteo">Aleteo rápido</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Temperatura Ambiente (°C)</label>
            <input
              type="text"
              value={formData.temp_ambiente || ''}
              onChange={(e) => handleChange('temp_ambiente', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>¿Tiene calentador? *</label>
            <select
              required
              value={formData.tiene_calentador || ''}
              onChange={(e) => handleChange('tiene_calentador', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sistema Tegumentario */}
      <div id="tortugas-tegumentario" className="form-section">
        <h3>Sistema Tegumentario/Caparazón</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Estado del Caparazón *</label>
            <select
              required
              value={formData.caparazon || 'normal'}
              onChange={(e) => handleChange('caparazon', e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="blandeza">Blandeza/Ablandamiento</option>
              <option value="manchas_blancas">Manchas blancas</option>
              <option value="manchas_oscuras">Manchas oscuras</option>
              <option value="deformidad">Deformidad</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Localización</label>
            <select
              value={formData.caparazon_localizacion || ''}
              onChange={(e) => handleChange('caparazon_localizacion', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="plastron">Plastrón</option>
              <option value="caparazon">Caparazón</option>
              <option value="marginales">Marginales</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Hundimiento o abombamiento? *</label>
            <select
              required
              value={formData.hundimiento || 'NO'}
              onChange={(e) => handleChange('hundimiento', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>¿Olor fétido? *</label>
            <select
              required
              value={formData.olor_fetido || 'NO'}
              onChange={(e) => handleChange('olor_fetido', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Estado de la Piel *</label>
            <select
              required
              value={formData.piel || 'normal'}
              onChange={(e) => handleChange('piel', e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="descamacion">Descamación excesiva</option>
              <option value="costras">Costras</option>
              <option value="ulceras">Úlceras</option>
              <option value="hinchazon">Hinchazón</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>¿Edema en párpados? *</label>
            <select
              required
              value={formData.edema_parpados || 'NO'}
              onChange={(e) => handleChange('edema_parpados', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Estado de los Ojos *</label>
            <select
              required
              value={formData.ojos || 'normal'}
              onChange={(e) => handleChange('ojos', e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="cerrados">Cerrados</option>
              <option value="hinchados">Hinchados</option>
              <option value="secrecion">Secreción</option>
              <option value="opacidad">Opacidad corneal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sistema Digestivo */}
      <div id="tortugas-digestivo" className="form-section">
        <h3>Sistema Digestivo</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Apetito *</label>
            <select
              required
              value={formData.apetito || 'normal'}
              onChange={(e) => handleChange('apetito', e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="anorexia_total">Anorexia total (&gt;48h)</option>
              <option value="anorexia_parcial">Anorexia parcial</option>
            </select>
          </div>
          
          {(formData.apetito === 'anorexia_total' || formData.apetito === 'anorexia_parcial') && (
            <div className="form-group">
              <label>Tiempo sin comer (horas/días)</label>
              <input
                type="text"
                value={formData.tiempo_sin_comer || ''}
                onChange={(e) => handleChange('tiempo_sin_comer', e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Come fruta? *</label>
            <select
              required
              value={formData.come_fruta || ''}
              onChange={(e) => handleChange('come_fruta', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>¿Tiene calcio suplementado? *</label>
            <select
              required
              value={formData.calcio_suplementado || ''}
              onChange={(e) => handleChange('calcio_suplementado', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Heces *</label>
            <select
              required
              value={formData.heces || 'normal'}
              onChange={(e) => handleChange('heces', e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="ausentes">Ausentes (&gt;72h)</option>
              <option value="blandas">Blandas</option>
              <option value="liquidas">Líquidas</option>
              <option value="con_sangre">Con sangre</option>
              <option value="con_parasitos">Con parásitos</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Frecuencia (veces/semana)</label>
            <input
              type="text"
              value={formData.heces_frecuencia || ''}
              onChange={(e) => handleChange('heces_frecuencia', e.target.value)}
              placeholder="Normal: 1-7 según especie/temperatura"
            />
          </div>
        </div>
  
        <div className="form-row">
          <div className="form-group">
            <label>¿Deshidratación? *</label>
            <select
              required
              value={formData.deshidratacion || 'NO'}
              onChange={(e) => handleChange('deshidratacion', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí (piel no vuelve al pinchar)</option>
            </select>
          </div>
        </div>
      </div>

      <div id="tortugas-neurologico" className="form-section">
        <h3>Sistema Neurológico</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Inestabilidad *</label>
            <select
              required
              value={formData.inestabilidad || 'NO'}
              onChange={(e) => handleChange('inestabilidad', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="temblor_extremidades">Temblor en extremidades</option>
              <option value="caidas_laterales">Caídas laterales</option>
              <option value="no_mantiene_derecho">No puede mantenerse derecho</option>
            </select>
          </div>

          <div className="form-group">
            <label>Progresión *</label>
            <select
              required
              value={formData.progresion || 'NO'}
              onChange={(e) => handleChange('progresion', e.target.value)}
            >
              <option value="NO">No aplica / Desconocido</option>
              <option value="lenta">Lenta (meses)</option>
              <option value="rapida">Rápida (semanas)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Convulsiones *</label>
            <select
              required
              value={formData.convulsiones || 'NO'}
              onChange={(e) => handleChange('convulsiones', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="temblor_generalizado">Temblor generalizado</option>
              <option value="focales">Convulsiones focales</option>
              <option value="generalizadas">Convulsiones generalizadas</option>
            </select>
          </div>

          <div className="form-group">
            <label>Desencadenantes</label>
            <select
              value={formData.desencadenantes || ''}
              onChange={(e) => handleChange('desencadenantes', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="estres">Estrés</option>
              <option value="manipulacion">Manipulación</option>
              <option value="ninguno">Ninguno</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Letargo extremo *</label>
            <select
              required
              value={formData.letargo || 'NO'}
              onChange={(e) => handleChange('letargo', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="no_se_mueve">No se mueve</option>
              <option value="no_responde">No responde a estímulos</option>
              <option value="hipotermia">Hipotermia</option>
            </select>
          </div>

          <div className="form-group">
            <label>Temperatura corporal (°C)</label>
            <input
              type="text"
              value={formData.temperatura_corporal || ''}
              onChange={(e) => handleChange('temperatura_corporal', e.target.value)}
              placeholder="Normal: similar a ambiente"
            />
          </div>
        </div>
      </div>

      <div id="tortugas-comportamiento" className="form-section">
        <h3>Comportamiento</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Actividad diurna/nocturna *</label>
            <select
              required
              value={formData.actividad || 'normal'}
              onChange={(e) => handleChange('actividad', e.target.value)}
            >
              <option value="hiperactivo">Hiperactivo</option>
              <option value="normal">Normal</option>
              <option value="letargico">Letárgico</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          <div className="form-group">
            <label>¿Cambio en patrón de actividad? *</label>
            <select
              required
              value={formData.cambio_actividad || 'NO'}
              onChange={(e) => handleChange('cambio_actividad', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Interacción ambiental</label>
            <select
              value={formData.interaccion_ambiental || ''}
              onChange={(e) => handleChange('interaccion_ambiental', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="evita_zona_caliente">Evita zona caliente</option>
              <option value="evita_zona_fria">Evita zona fría</option>
              <option value="no_usa_escondites">No usa escondites</option>
            </select>
          </div>

          <div className="form-group">
            <label>Dificultad para nadar</label>
            <select
              value={formData.dificultad_nado || ''}
              onChange={(e) => handleChange('dificultad_nado', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="dificultad_sumergirse">Dificultad para sumergirse</option>
              <option value="flota_lateralmente">Flota lateralmente</option>
              <option value="no_nada">No nada</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Dificultad para hundirse?</label>
            <select
              value={formData.dificultad_hundirse || 'NO'}
              onChange={(e) => handleChange('dificultad_hundirse', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>
      </div>

      <div id="tortugas-reproductivo" className="form-section">
        <h3>Sistema Reproductivo</h3>
        
        {formData.sexo === 'hembra' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>¿Última puesta? (días atrás)</label>
                <input
                  type="text"
                  value={formData.ultima_puesta || ''}
                  onChange={(e) => handleChange('ultima_puesta', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>¿Dificultad para poner? *</label>
                <select
                  required
                  value={formData.dificultad_poner || 'NO'}
                  onChange={(e) => handleChange('dificultad_poner', e.target.value)}
                >
                  <option value="NO">No</option>
                  <option value="SI">Sí</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>¿Huevos deformes? *</label>
                <select
                  required
                  value={formData.huevos_deformes || 'NO'}
                  onChange={(e) => handleChange('huevos_deformes', e.target.value)}
                >
                  <option value="NO">No</option>
                  <option value="SI">Sí</option>
                </select>
              </div>
              <div className="form-group">
                <label>¿Hinchazón abdominal? *</label>
                <select
                  required
                  value={formData.hinchazon_abdominal || 'NO'}
                  onChange={(e) => handleChange('hinchazon_abdominal', e.target.value)}
                >
                  <option value="NO">No</option>
                  <option value="SI">Sí</option>
                </select>
              </div>
            </div>
          </>
        )}

        {formData.sexo === 'macho' && (
          <div className="form-row">
            <div className="form-group">
              <label>Comportamiento territorial excesivo *</label>
              <select
                required
                value={formData.territorial || 'NO'}
                onChange={(e) => handleChange('territorial', e.target.value)}
              >
                <option value="NO">No</option>
                <option value="SI">Sí</option>
              </select>
            </div>
            <div className="form-group">
              <label>Agresividad repentina</label>
              <select
                value={formData.agresividad_reproductiva || 'NO'}
                onChange={(e) => handleChange('agresividad_reproductiva', e.target.value)}
              >
                <option value="NO">No</option>
                <option value="SI">Sí</option>
              </select>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>¿Problemas para aparearse?</label>
            <select
              value={formData.problemas_aparearse || 'NO'}
              onChange={(e) => handleChange('problemas_aparearse', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>
      </div>

      <div id="tortugas-alimentacion" className="form-section">
        <h3>Alimentación</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de dieta *</label>
            <select
              required
              value={formData.tipo_dieta || ''}
              onChange={(e) => handleChange('tipo_dieta', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="herbivora">Herbívora</option>
              <option value="omnivora">Omnívora</option>
              <option value="carnivora">Carnívora</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Suplementos de calcio</label>
            <select
              value={formData.suplemento_calcio || 'NO'}
              onChange={(e) => handleChange('suplemento_calcio', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Suplementos de vitamina D3</label>
            <select
              value={formData.suplemento_vitamina_d3 || 'NO'}
              onChange={(e) => handleChange('suplemento_vitamina_d3', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Suplementos multivitamínicos</label>
            <select
              value={formData.suplemento_multivitaminicos || 'NO'}
              onChange={(e) => handleChange('suplemento_multivitaminicos', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Frutas/vegetales frescos?</label>
            <select
              value={formData.frutas_vegetales_frescas || 'NO'}
              onChange={(e) => handleChange('frutas_vegetales_frescas', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        {formData.frutas_vegetales_frescas === 'SI' && (
          <div className="form-group">
            <label>¿Cuáles frutas/vegetales?</label>
            <input
              type="text"
              value={formData.frutas_vegetales_cuales || ''}
              onChange={(e) => handleChange('frutas_vegetales_cuales', e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label>¿Acceso a materiales no comestibles?</label>
          <select
            value={formData.acceso_no_comestibles || 'NO'}
            onChange={(e) => handleChange('acceso_no_comestibles', e.target.value)}
          >
            <option value="NO">No</option>
            <option value="SI">Sí</option>
          </select>
        </div>
      </div>

      {/* Ambiente */}
      <div id="tortugas-ambiente" className="form-section">
        <h3>Ambiente</h3>
        
        <div className="form-group">
          <label>Tipo de Ambiente *</label>
          <select
            required
            value={formData.tipo_ambiente || ''}
            onChange={(e) => handleChange('tipo_ambiente', e.target.value)}
          >
            <option value="">Seleccionar</option>
            <option value="terrestre">Terrestre</option>
            <option value="acuatico">Acuático</option>
          </select>
        </div>

        {formData.tipo_ambiente === 'terrestre' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Tamaño del Recinto (cm)</label>
                <input
                  type="text"
                  value={formData.tamano_recinto || ''}
                  onChange={(e) => handleChange('tamano_recinto', e.target.value)}
                  placeholder="Largo x Ancho x Alto"
                />
              </div>
              
              <div className="form-group">
                <label>Temperatura Ambiente (°C)</label>
                <input
                  type="text"
                  value={formData.temperatura_ambiente || ''}
                  onChange={(e) => handleChange('temperatura_ambiente', e.target.value)}
                  placeholder="Zona fría y zona caliente"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Humedad (%)</label>
                <input
                  type="text"
                  value={formData.humedad || ''}
                  onChange={(e) => handleChange('humedad', e.target.value)}
                  placeholder="Ideal varía por especie: desérticas 30-40%, tropicales 60-80%"
                />
              </div>
              
              <div className="form-group">
                <label>Iluminación UVB *</label>
                <select
                  required
                  value={formData.iluminacion_uvb || ''}
                  onChange={(e) => handleChange('iluminacion_uvb', e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="SI">Sí</option>
                  <option value="NO">No</option>
                </select>
              </div>
            </div>

            {formData.iluminacion_uvb === 'SI' && (
              <>
                <div className="form-group">
                  <label>Distancia de la lámpara (cm)</label>
                  <input
                    type="text"
                    value={formData.distancia_lampara || ''}
                    onChange={(e) => handleChange('distancia_lampara', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>¿Cambio reciente en la lámpara UVB?</label>
                  <select
                    value={formData.cambio_lampara_uvb || 'NO'}
                    onChange={(e) => handleChange('cambio_lampara_uvb', e.target.value)}
                  >
                    <option value="NO">No</option>
                    <option value="SI">Sí</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Superficie del Sustrato *</label>
              <select
                required
                value={formData.sustrato || ''}
                onChange={(e) => handleChange('sustrato', e.target.value)}
              >
                <option value="">Seleccionar</option>
                <option value="tierra">Tierra</option>
                <option value="arena">Arena</option>
                <option value="alfombra">Alfombra</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </>
        )}

        {formData.tipo_ambiente === 'acuatico' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Tamaño del Tanque (L)</label>
                <input
                  type="text"
                  value={formData.tamano_tanque || ''}
                  onChange={(e) => handleChange('tamano_tanque', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Temperatura del Agua (°C)</label>
                <input
                  type="text"
                  value={formData.temp_agua || ''}
                  onChange={(e) => handleChange('temp_agua', e.target.value)}
                  placeholder="Ideal: 24-28°C"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Temperatura de la zona seca (°C)</label>
                <input
                  type="text"
                  value={formData.temp_zona_seca || ''}
                  onChange={(e) => handleChange('temp_zona_seca', e.target.value)}
                  placeholder="Ideal: 30-35°C"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Filtración *</label>
                <select
                  required
                  value={formData.filtracion || ''}
                  onChange={(e) => handleChange('filtracion', e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="SI">Sí</option>
                  <option value="NO">No</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Cambio de Agua *</label>
                <select
                  required
                  value={formData.cambio_agua || ''}
                  onChange={(e) => handleChange('cambio_agua', e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="diario">Diario</option>
                  <option value="cada_2_dias">Cada 2 días</option>
                  <option value="semanal">Semanal</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>¿En hibernación/brumación?</label>
                <select
                  value={formData.hibernacion || 'NO'}
                  onChange={(e) => handleChange('hibernacion', e.target.value)}
                >
                  <option value="NO">No</option>
                  <option value="SI">Sí</option>
                </select>
              </div>

              <div className="form-group">
                <label>¿Control de peso durante hibernación?</label>
                <select
                  value={formData.control_peso_hibernacion || 'NO'}
                  onChange={(e) => handleChange('control_peso_hibernacion', e.target.value)}
                >
                  <option value="NO">No</option>
                  <option value="SI">Sí</option>
                </select>
              </div>
            </div>

            {formData.control_peso_hibernacion === 'SI' && (
              <div className="form-group">
                <label>Peso inicial (g)</label>
                <input
                  type="text"
                  value={formData.peso_inicial_hibernacion || ''}
                  onChange={(e) => handleChange('peso_inicial_hibernacion', e.target.value)}
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>¿Temperatura controlada?</label>
                <select
                  value={formData.temperatura_controlada_hibernacion || 'NO'}
                  onChange={(e) => handleChange('temperatura_controlada_hibernacion', e.target.value)}
                >
                  <option value="NO">No</option>
                  <option value="SI">Sí</option>
                </select>
              </div>
            </div>

            {formData.temperatura_controlada_hibernacion === 'SI' && (
              <div className="form-group">
                <label>Rango de temperatura (°C)</label>
                <input
                  type="text"
                  value={formData.rango_temperatura_hibernacion || ''}
                  onChange={(e) => handleChange('rango_temperatura_hibernacion', e.target.value)}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div id="tortugas-socializacion" className="form-section">
        <h3>Socialización</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>¿Vive sola o en grupo?</label>
            <select
              value={formData.socializacion_tipo || ''}
              onChange={(e) => handleChange('socializacion_tipo', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="sola">Sola</option>
              <option value="pareja">Pareja</option>
              <option value="grupo">Grupo</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Peleas recientes?</label>
            <select
              value={formData.peleas_recientes || 'NO'}
              onChange={(e) => handleChange('peleas_recientes', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Compatible con compañeros?</label>
            <select
              value={formData.compatibilidad_companeros || 'SI'}
              onChange={(e) => handleChange('compatibilidad_companeros', e.target.value)}
            >
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
        </div>
      </div>

      <div id="tortugas-historial" className="form-section">
        <h3>Historia Médica Previa</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Calcio con D3</label>
            <select
              value={formData.hist_calcio_d3 || 'NO'}
              onChange={(e) => handleChange('hist_calcio_d3', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          {formData.hist_calcio_d3 === 'SI' && (
            <div className="form-group">
              <label>Frecuencia</label>
              <input
                type="text"
                value={formData.hist_calcio_d3_frecuencia || ''}
                onChange={(e) => handleChange('hist_calcio_d3_frecuencia', e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Multivitamínicos</label>
            <select
              value={formData.hist_multivitaminicos || 'NO'}
              onChange={(e) => handleChange('hist_multivitaminicos', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          {formData.hist_multivitaminicos === 'SI' && (
            <div className="form-group">
              <label>Frecuencia</label>
              <input
                type="text"
                value={formData.hist_multivitaminicos_frecuencia || ''}
                onChange={(e) => handleChange('hist_multivitaminicos_frecuencia', e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Exposición a luz solar directa?</label>
            <select
              value={formData.exposicion_sol || 'NO'}
              onChange={(e) => handleChange('exposicion_sol', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          {formData.exposicion_sol === 'SI' && (
            <div className="form-group">
              <label>Duración (horas/día)</label>
              <input
                type="text"
                value={formData.exposicion_sol_duracion || ''}
                onChange={(e) => handleChange('exposicion_sol_duracion', e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Desparasitación previa</label>
            <select
              value={formData.desparasitacion_previa || 'NO'}
              onChange={(e) => handleChange('desparasitacion_previa', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Trauma previo</label>
            <select
              value={formData.trauma_previo || 'NO'}
              onChange={(e) => handleChange('trauma_previo', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        {formData.trauma_previo === 'SI' && (
          <div className="form-group">
            <label>Fecha del trauma</label>
            <input
              type="text"
              value={formData.trauma_fecha || ''}
              onChange={(e) => handleChange('trauma_fecha', e.target.value)}
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Reparación de caparazón</label>
            <select
              value={formData.reparacion_caparazon || 'NO'}
              onChange={(e) => handleChange('reparacion_caparazon', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Extracción de cuerpo extraño</label>
            <select
              value={formData.extraccion_cuerpo_extrano || 'NO'}
              onChange={(e) => handleChange('extraccion_cuerpo_extrano', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Medicaciones actuales</label>
            <select
              value={formData.medicaciones_actuales || 'NO'}
              onChange={(e) => handleChange('medicaciones_actuales', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        {formData.medicaciones_actuales === 'SI' && (
          <div className="form-group">
            <label>¿Cuáles medicaciones?</label>
            <input
              type="text"
              value={formData.medicaciones_actuales_cuales || ''}
              onChange={(e) => handleChange('medicaciones_actuales_cuales', e.target.value)}
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Suplementos previos</label>
            <select
              value={formData.suplementos_historia_tipo || ''}
              onChange={(e) => handleChange('suplementos_historia_tipo', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="probioticos">Probióticos</option>
              <option value="vitaminas">Vitaminas</option>
              <option value="otros">Otros</option>
            </select>
          </div>
        </div>

        {formData.suplementos_historia_tipo === 'otros' && (
          <div className="form-group">
            <label>Otros suplementos</label>
            <input
              type="text"
              value={formData.suplementos_historia_otros || ''}
              onChange={(e) => handleChange('suplementos_historia_otros', e.target.value)}
            />
          </div>
        )}
      </div>

      <div id="tortugas-examen" className="form-section">
        <h3>Examen Físico Cuantificado</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Temperatura ambiente (°C)</label>
            <input
              type="text"
              value={formData.examen_temp_ambiente || ''}
              onChange={(e) => handleChange('examen_temp_ambiente', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Temperatura corporal (°C)</label>
            <input
              type="text"
              value={formData.examen_temp_corporal || formData.temperatura_corporal || ''}
              onChange={(e) => handleChange('examen_temp_corporal', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Peso corporal (g/kg)</label>
            <input
              type="text"
              value={formData.peso_corporal_examen || formData.peso || ''}
              onChange={(e) => handleChange('peso_corporal_examen', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Condición muscular</label>
            <select
              value={formData.condicion_muscular || ''}
              onChange={(e) => handleChange('condicion_muscular', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="excelente">Excelente</option>
              <option value="buena">Buena</option>
              <option value="regular">Regular</option>
              <option value="mala">Mala</option>
              <option value="ausente">Ausente</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Estado de hidratación</label>
            <select
              value={formData.estado_hidratacion_examen || ''}
              onChange={(e) => handleChange('estado_hidratacion_examen', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="normal">Normal</option>
              <option value="leve">Leve</option>
              <option value="moderado">Moderado</option>
              <option value="severo">Severo</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Caparazón (evaluación rápida)</label>
            <select
              value={formData.caparazon_examen || ''}
              onChange={(e) => handleChange('caparazon_examen', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="normal">Normal</option>
              <option value="blandeza">Blandeza</option>
              <option value="deformidad">Deformidad</option>
              <option value="lesiones">Lesiones</option>
            </select>
          </div>
          <div className="form-group">
            <label>Piel (evaluación rápida)</label>
            <select
              value={formData.piel_examen || ''}
              onChange={(e) => handleChange('piel_examen', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="normal">Normal</option>
              <option value="descamacion">Descamación</option>
              <option value="ulceras">Úlceras</option>
              <option value="edema">Edema</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ojos (evaluación rápida)</label>
            <select
              value={formData.ojos_examen || ''}
              onChange={(e) => handleChange('ojos_examen', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="abiertos">Abiertos</option>
              <option value="hinchados">Hinchados</option>
              <option value="secrecion">Secreción</option>
              <option value="opacidad">Opacidad</option>
            </select>
          </div>
        </div>
      </div>

      <div id="tortugas-riesgos" className="form-section">
        <h3>Factores de Riesgo Específicos</h3>

        <h4>Tortugas Terrestres (Testudinidae)</h4>
        <div className="form-row">
          <div className="form-group">
            <label>¿Historia de hiperdosis de vitamina D?</label>
            <YesNoChips
              value={formData.hiperdosis_vitamina_d}
              onChange={(val) => handleChange('hiperdosis_vitamina_d', val)}
            />
          </div>
          <div className="form-group">
            <label>¿Dieta rica en proteínas?</label>
            <YesNoChips
              value={formData.dieta_rica_proteinas}
              onChange={(val) => handleChange('dieta_rica_proteinas', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Exposición inadecuada a UVB?</label>
            <YesNoChips
              value={formData.exposicion_uvb_inadecuada}
              onChange={(val) => handleChange('exposicion_uvb_inadecuada', val)}
            />
          </div>
        </div>

        <h4>Tortugas Acuáticas (Emydidae, Trionychidae)</h4>
        <div className="form-row">
          <div className="form-group">
            <label>¿Filtración inadecuada?</label>
            <YesNoChips
              value={formData.filtracion_inadecuada}
              onChange={(val) => handleChange('filtracion_inadecuada', val)}
            />
          </div>
          <div className="form-group">
            <label>¿Temperatura del agua baja?</label>
            <YesNoChips
              value={formData.temperatura_agua_baja}
              onChange={(val) => handleChange('temperatura_agua_baja', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Superficie de descanso inadecuada?</label>
            <YesNoChips
              value={formData.superficie_descanso_inadecuada}
              onChange={(val) => handleChange('superficie_descanso_inadecuada', val)}
            />
          </div>
        </div>

        <h4>Tortugas de Desierto (Gopherus, Geochelone)</h4>
        <div className="form-row">
          <div className="form-group">
            <label>¿Dieta con mucha fruta?</label>
            <YesNoChips
              value={formData.dieta_mucha_fruta_desierto}
              onChange={(val) => handleChange('dieta_mucha_fruta_desierto', val)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>¿Tipo de sustrato? (desierto)</label>
          <input
            type="text"
            value={formData.tipo_sustrato_desierto || ''}
            onChange={(e) => handleChange('tipo_sustrato_desierto', e.target.value)}
          />
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default TortugasForm;