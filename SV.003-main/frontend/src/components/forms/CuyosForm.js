import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from "../ui/yes-no-chips";

const CuyosForm = ({ formData, setFormData }) => {
  const [activeSection, setActiveSection] = useState('cuyos-info-basica');
  const [collapsedSections, setCollapsedSections] = useState({});

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleSection = useCallback((e) => {
    const section = e.target.closest('.form-section');
    if (section && e.target.tagName === 'H3') {
      const sectionId = section.id;
      setCollapsedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
      section.classList.toggle('collapsed');
    }
  }, []);

  // Campos requeridos para calcular progreso
  const requiredFields = [
    'nombre_mascota', 'nombre_dueño', 'edad', 'sexo', 'peso', 'condicion_corporal',
    'tipo_dieta', 'frecuencia_alimentacion', 'heno_acceso',
    'habitat', 'temperatura_ambiente', 'socializacion_tipo',
    'desparasitacion_interna', 'vacunacion',
    'temperatura', 'frecuencia_cardiaca', 'frecuencia_respiratoria',
    'apetito', 'heces', 'orina',
    'secrecion_nasal', 'respiracion',
    'actividad', 'postura'
  ];

  const progress = useMemo(() => {
    const filled = requiredFields.filter(field => formData[field] && formData[field] !== '').length;
    return Math.round((filled / requiredFields.length) * 100);
  }, [formData]);

  const sections = [
    { id: 'cuyos-info-basica', label: 'Información Básica', icon: '📋' },
    { id: 'cuyos-alimentacion', label: 'Alimentación', icon: '🥗' },
    { id: 'cuyos-ambiente', label: 'Ambiente y Socialización', icon: '🏠' },
    { id: 'cuyos-historia', label: 'Historia Médica Previa', icon: '📁' },
    { id: 'cuyos-examen', label: 'Examen Físico', icon: '🩺' },
    { id: 'cuyos-digestivo', label: 'Sistema Digestivo', icon: '🫃' },
    { id: 'cuyos-respiratorio', label: 'Sistema Respiratorio', icon: '🫁' },
    { id: 'cuyos-reproductivo', label: 'Sistema Reproductivo', icon: '🔬' },
    { id: 'cuyos-neurologico', label: 'Sistema Neurológico', icon: '🧠' },
    { id: 'cuyos-cutaneo', label: 'Sistema Cutáneo', icon: '🐾' },
    { id: 'cuyos-ojos', label: 'Ojos', icon: '👁️' },
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
      <h2>Datos del Paciente - Cuyo</h2>

      {/* Barra de Progreso */}
      <div className="species-form-progress">
        <div className="species-form-progress-header">
          <span className="species-form-progress-label">Progreso del formulario</span>
          <span className="species-form-progress-percent">{progress}%</span>
        </div>
        <div className="species-form-progress-bar">
          <div 
            className={`species-form-progress-fill ${progress === 100 ? 'complete' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="species-form-progress-stats">
          <span>{requiredFields.filter(f => formData[f] && formData[f] !== '').length} de {requiredFields.length} campos completados</span>
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
      <div id="cuyos-info-basica" className="form-section">
        <h3>📋 Información Básica</h3>

        <div className="form-row">
          <div className="form-group">
            <label>Nombre del Paciente *</label>
            <input
              type="text"
              required
              value={formData.nombre_mascota || ''}
              onChange={(e) => handleChange('nombre_mascota', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Nombre del Dueño *</label>
            <input
              type="text"
              required
              value={formData.nombre_dueño || ''}
              onChange={(e) => handleChange('nombre_dueño', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Edad exacta (meses/años) *</label>
            <input
              type="text"
              required
              placeholder="Adulto: >4 meses, Senior: >3 años"
              value={formData.edad || ''}
              onChange={(e) => handleChange('edad', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>¿Edad confirmada por cría?</label>
            <select
              value={formData.edad_confirmada_cria || ''}
              onChange={(e) => handleChange('edad_confirmada_cria', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
        </div>

        <div className="form-row">
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
          <div className="form-group">
            <label>¿Sexo confirmado por?</label>
            <select
              value={formData.sexo_confirmado || ''}
              onChange={(e) => handleChange('sexo_confirmado', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="visual">Visual</option>
              <option value="comportamiento">Por comportamiento</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Esterilizado *</label>
            <select
              required
              value={formData.esterilizado || ''}
              onChange={(e) => handleChange('esterilizado', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Peso actual (g)</label>
            <input
              type="text"
              placeholder="Normal: 700-1200g; machos > hembras"
              value={formData.peso || ''}
              onChange={(e) => handleChange('peso', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Índice de Condición Corporal (ICC)</label>
            <select
              value={formData.condicion_corporal || ''}
              onChange={(e) => handleChange('condicion_corporal', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="1-3">1-3 (Emaciado)</option>
              <option value="4-5">4-5 (Delgado)</option>
              <option value="6-7">6-7 (Ideal)</option>
              <option value="8-9">8-9 (Sobrepeso)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Temperamento</label>
            <select
              value={formData.temperamento || ''}
              onChange={(e) => handleChange('temperamento', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="tranquilo">Tranquilo</option>
              <option value="nervioso">Nervioso</option>
              <option value="agresivo">Agresivo</option>
              <option value="timido">Tímido</option>
              <option value="hiperactivo">Hiperactivo</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Color/Pelaje</label>
            <select
              value={formData.color_pelaje || ''}
              onChange={(e) => handleChange('color_pelaje', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="blanco">Blanco</option>
              <option value="negro">Negro</option>
              <option value="marron">Marrón</option>
              <option value="tricolor">Tricolor</option>
            </select>
          </div>
          <div className="form-group">
            <label>Duración exacta del problema *</label>
            <select
              required
              value={formData.duracion_problema || ''}
              onChange={(e) => handleChange('duracion_problema', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="<12h">&lt;12 horas</option>
              <option value="12-24h">12-24 h</option>
              <option value="2-3dias">2-3 días</option>
              <option value="4-7dias">4-7 días</option>
              <option value=">1semana">&gt;1 semana</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Progresión del problema</label>
          <select
            value={formData.progresion_problema || ''}
            onChange={(e) => handleChange('progresion_problema', e.target.value)}
          >
            <option value="">Seleccionar</option>
            <option value="mejora">Mejora</option>
            <option value="estable">Estable</option>
            <option value="empeora_rapido">Empeora rápidamente</option>
            <option value="intermitente">Intermitente</option>
          </select>
        </div>
      </div>

      {/* Alimentación */}
      <div id="cuyos-alimentacion" className="form-section">
        <h3>🥗 Alimentación</h3>

        <div className="form-row">
          <div className="form-group">
            <label>Heno *</label>
            <select
              required
              value={formData.tipo_heno || ''}
              onChange={(e) => handleChange('tipo_heno', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="avena">Avena</option>
              <option value="alfalfa">Alfalfa</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          {formData.tipo_heno === 'otro' && (
            <div className="form-group">
              <label>Otro tipo de heno</label>
              <input
                type="text"
                value={formData.tipo_heno_otro || ''}
                onChange={(e) => handleChange('tipo_heno_otro', e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Frecuencia de heno *</label>
            <select
              required
              value={formData.frecuencia_heno || ''}
              onChange={(e) => handleChange('frecuencia_heno', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="ilimitado">Ilimitado</option>
              <option value="limitado">Limitado</option>
              <option value="intermitente">Intermitente</option>
            </select>
          </div>
          <div className="form-group">
            <label>Pellets</label>
            <YesNoChips
              value={formData.pellets}
              onChange={(val) => handleChange('pellets', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Verduras frescas</label>
            <YesNoChips
              value={formData.verduras_frescas}
              onChange={(val) => handleChange('verduras_frescas', val)}
            />
          </div>
          {formData.verduras_frescas === 'SI' && (
            <div className="form-group">
              <label>¿Cuáles verduras?</label>
              <input
                type="text"
                value={formData.verduras_cuales || ''}
                onChange={(e) => handleChange('verduras_cuales', e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Suplementos: Vitaminas</label>
            <YesNoChips
              value={formData.suplementos_vitaminas}
              onChange={(val) => handleChange('suplementos_vitaminas', val)}
            />
          </div>
          <div className="form-group">
            <label>Suplementos: Minerales</label>
            <YesNoChips
              value={formData.suplementos_minerales}
              onChange={(val) => handleChange('suplementos_minerales', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Suplementos: Vitamina C</label>
            <YesNoChips
              value={formData.suplementos_vitamina_c}
              onChange={(val) => handleChange('suplementos_vitamina_c', val)}
            />
          </div>
          <div className="form-group">
            <label>¿Dieta rica en carbohidratos?</label>
            <YesNoChips
              value={formData.dieta_carbohidratos}
              onChange={(val) => handleChange('dieta_carbohidratos', val)}
            />
          </div>
        </div>

        {formData.dieta_carbohidratos === 'SI' && (
          <div className="form-group">
            <label>Detalles de dieta rica en carbohidratos</label>
            <input
              type="text"
              value={formData.dieta_carbohidratos_detalle || ''}
              onChange={(e) => handleChange('dieta_carbohidratos_detalle', e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label>Cantidad diaria de vitamina C (mg)</label>
          <input
            type="text"
            placeholder="Mínimo: 10-30 mg/día"
            value={formData.vitamina_c_mg_diaria || ''}
            onChange={(e) => handleChange('vitamina_c_mg_diaria', e.target.value)}
          />
        </div>
      </div>

      {/* Ambiente y Socialización */}
      <div id="cuyos-ambiente" className="form-section">
        <h3>Ambiente y Socialización</h3>

        <div className="form-row">
          <div className="form-group">
            <label>Jaula/Vivienda *</label>
            <select
              required
              value={formData.vivienda || ''}
              onChange={(e) => handleChange('vivienda', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>
          <div className="form-group">
            <label>Superficie del piso *</label>
            <select
              required
              value={formData.superficie_piso || ''}
              onChange={(e) => handleChange('superficie_piso', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="alfombra">Alfombra</option>
              <option value="madera">Madera</option>
              <option value="felpa">Felpa</option>
              <option value="cemento">Cemento</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Contacto con otras mascotas?</label>
            <YesNoChips
              value={formData.contacto_mascotas}
              onChange={(val) => handleChange('contacto_mascotas', val)}
            />
          </div>
          <div className="form-group">
            <label>Tipo de ejercicio</label>
            <select
              value={formData.tipo_ejercicio || ''}
              onChange={(e) => handleChange('tipo_ejercicio', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="libre_habitacion">Libre en habitación</option>
              <option value="correa">Correa</option>
              <option value="ninguno">Ninguno</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Saltos frecuentes?</label>
            <select
              value={formData.saltos_frecuentes || 'NO'}
              onChange={(e) => handleChange('saltos_frecuentes', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Vive solo o en grupo</label>
            <select
              value={formData.socializacion || ''}
              onChange={(e) => handleChange('socializacion', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="solo">Solo</option>
              <option value="pareja">Pareja</option>
              <option value="grupo">Grupo</option>
            </select>
          </div>
        </div>

        <div className="form-row">
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
          <div className="form-group">
            <label>¿Compatible con compañeros?</label>
            <select
              value={formData.compatible_companeros || ''}
              onChange={(e) => handleChange('compatible_companeros', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Limpieza de jaula *</label>
          <select
            required
            value={formData.limpieza_jaula || ''}
            onChange={(e) => handleChange('limpieza_jaula', e.target.value)}
          >
            <option value="">Seleccionar</option>
            <option value="diaria">Diaria</option>
            <option value="cada_2_dias">Cada 2 días</option>
            <option value="semanal">Semanal</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Uso de productos químicos</label>
            <select
              value={formData.uso_quimicos || 'NO'}
              onChange={(e) => handleChange('uso_quimicos', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Baños frecuentes</label>
            <select
              value={formData.banos_frecuentes || 'NO'}
              onChange={(e) => handleChange('banos_frecuentes', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>
      </div>

      {/* Historia Médica Previa */}
      <div id="cuyos-historia" className="form-section">
        <h3>Historia Médica Previa</h3>

        <div className="form-row">
          <div className="form-group">
            <label>Desparasitación</label>
            <select
              value={formData.hist_desparasitacion || 'NO'}
              onChange={(e) => handleChange('hist_desparasitacion', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Tratamiento para E. cuniculi?</label>
            <select
              value={formData.tratamiento_e_cuniculi || 'NO'}
              onChange={(e) => handleChange('tratamiento_e_cuniculi', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <h4>Enfermedades previas</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Problemas dentales</label>
            <select
              value={formData.enf_prev_dentales || 'NO'}
              onChange={(e) => handleChange('enf_prev_dentales', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Estasis GI</label>
            <select
              value={formData.enf_prev_estasis_gi || 'NO'}
              onChange={(e) => handleChange('enf_prev_estasis_gi', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Infecciones respiratorias</label>
            <select
              value={formData.enf_prev_resp || 'NO'}
              onChange={(e) => handleChange('enf_prev_resp', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Escorbuto</label>
            <select
              value={formData.enf_prev_escorbuto || 'NO'}
              onChange={(e) => handleChange('enf_prev_escorbuto', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <h4>Cirugías</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Esterilización previa</label>
            <select
              value={formData.cirugia_esterilizacion || 'NO'}
              onChange={(e) => handleChange('cirugia_esterilizacion', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Extracción dental</label>
            <select
              value={formData.cirugia_extraccion_dental || 'NO'}
              onChange={(e) => handleChange('cirugia_extraccion_dental', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Drenaje de abscesos</label>
          <select
            value={formData.cirugia_abscesos || 'NO'}
            onChange={(e) => handleChange('cirugia_abscesos', e.target.value)}
          >
            <option value="NO">No</option>
            <option value="SI">Sí</option>
          </select>
        </div>
      </div>

      {/* Examen Físico Cuantificado */}
      <div id="cuyos-examen" className="form-section">
        <h3>Examen Físico Cuantificado</h3>

        <div className="form-row">
          <div className="form-group">
            <label>Temperatura (°C)</label>
            <input
              type="text"
              placeholder="Normal: 37-39°C"
              value={formData.temperatura || ''}
              onChange={(e) => handleChange('temperatura', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Frecuencia cardíaca (lpm)</label>
            <input
              type="text"
              placeholder="Normal: 200-250"
              value={formData.frecuencia_cardiaca || ''}
              onChange={(e) => handleChange('frecuencia_cardiaca', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Frecuencia respiratoria (rpm)</label>
            <input
              type="text"
              placeholder="Normal: 80-100"
              value={formData.frecuencia_respiratoria || ''}
              onChange={(e) => handleChange('frecuencia_respiratoria', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Hidratación</label>
            <select
              value={formData.hidratacion || ''}
              onChange={(e) => handleChange('hidratacion', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="5">5% (piel vuelve rápido)</option>
              <option value="6-8">6-8% (piel lenta)</option>
              <option value=">10">&gt;10% (piel no vuelve)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Color de mucosas</label>
            <select
              value={formData.mucosas || ''}
              onChange={(e) => handleChange('mucosas', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="rosado">Rosado</option>
              <option value="palido">Pálido</option>
              <option value="icterico">Ictérico</option>
              <option value="cianotico">Cianótico</option>
            </select>
          </div>
          <div className="form-group">
            <label>Peso corporal (g)</label>
            <input
              type="text"
              value={formData.peso_corporal || ''}
              onChange={(e) => handleChange('peso_corporal', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
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
          <div className="form-group">
            <label>Estado dental</label>
            <select
              value={formData.estado_dental || ''}
              onChange={(e) => handleChange('estado_dental', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="normal">Normal</option>
              <option value="sobrecrecimiento">Sobrecrecimiento</option>
              <option value="abscesos">Abscesos</option>
              <option value="rotos">Dientes rotos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sistema Digestivo */}
      <div id="cuyos-digestivo" className="form-section">
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
              <option value="anorexia_total">Totalmente anoréxico (&gt;12h)</option>
              <option value="anorexia_parcial">Parcialmente anoréxico</option>
            </select>
          </div>
          {(formData.apetito === 'anorexia_total' || formData.apetito === 'anorexia_parcial') && (
            <div className="form-group">
              <label>Tiempo sin comer (horas)</label>
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
            <label>¿Come heno?</label>
            <select
              value={formData.come_heno || ''}
              onChange={(e) => handleChange('come_heno', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Mastica lentamente o deja comida sin masticar?</label>
            <select
              value={formData.mastica_lento || 'NO'}
              onChange={(e) => handleChange('mastica_lento', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Heces *</label>
            <select
              required
              value={formData.heces || 'normales'}
              onChange={(e) => handleChange('heces', e.target.value)}
            >
              <option value="normales">Normales</option>
              <option value="ausentes">Ausentes</option>
              <option value="pequenas_duras">Pequeñas y duras</option>
              <option value="blandas">Blandas/pastosas</option>
              <option value="en_racimo">En racimo</option>
            </select>
          </div>
          <div className="form-group">
            <label>Frecuencia (veces/día)</label>
            <input
              type="text"
              placeholder="Normal: 100-300 según tamaño"
              value={formData.heces_frecuencia || ''}
              onChange={(e) => handleChange('heces_frecuencia', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tamaño de las heces</label>
            <select
              value={formData.heces_tamano || ''}
              onChange={(e) => handleChange('heces_tamano', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="normal">Normal</option>
              <option value="pequenas">Pequeñas</option>
              <option value="ausentes">Ausentes</option>
            </select>
          </div>
          <div className="form-group">
            <label>Color de las heces</label>
            <select
              value={formData.heces_color || ''}
              onChange={(e) => handleChange('heces_color', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="marron_oscuro">Marrón oscuro</option>
              <option value="verde">Verde</option>
              <option value="amarillento">Amarillento</option>
              <option value="blanco_moho">Blanco (moho)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Estómago/abdomen *</label>
            <select
              required
              value={formData.abdomen || 'normal'}
              onChange={(e) => handleChange('abdomen', e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="distendido">Distendido</option>
              <option value="doloroso">Doloroso al tacto</option>
              <option value="ruidos_ausentes">Ruidos intestinales ausentes</option>
            </select>
          </div>
          <div className="form-group">
            <label>Regurgitación</label>
            <select
              value={formData.regurgitacion || 'NO'}
              onChange={(e) => handleChange('regurgitacion', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Palpación de bolas de pelo</label>
            <select
              value={formData.bolas_pelo || 'NO'}
              onChange={(e) => handleChange('bolas_pelo', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Cambio reciente de dieta</label>
            <select
              value={formData.desencadenante_dieta || 'NO'}
              onChange={(e) => handleChange('desencadenante_dieta', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Estrés (mudanza/veterinario)</label>
            <select
              value={formData.desencadenante_estres || 'NO'}
              onChange={(e) => handleChange('desencadenante_estres', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Uso reciente de antibióticos</label>
            <select
              value={formData.desencadenante_antibioticos || 'NO'}
              onChange={(e) => handleChange('desencadenante_antibioticos', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Dolor no tratado</label>
            <select
              value={formData.desencadenante_dolor || 'NO'}
              onChange={(e) => handleChange('desencadenante_dolor', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sistema Respiratorio */}
      <div id="cuyos-respiratorio" className="form-section">
        <h3>Sistema Respiratorio</h3>

        <div className="form-row">
          <div className="form-group">
            <label>Secreción nasal *</label>
            <select
              required
              value={formData.secrecion_nasal || 'NO'}
              onChange={(e) => handleChange('secrecion_nasal', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="clara">Clara (moco)</option>
              <option value="purulenta">Purulenta (amarilla/verde)</option>
              <option value="sangre">Sangre</option>
              <option value="caseosa">Caseosa</option>
            </select>
          </div>
          {formData.secrecion_nasal !== 'NO' && (
            <div className="form-group">
              <label>¿Unilateral o bilateral?</label>
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
            <label>Respiración *</label>
            <select
              required
              value={formData.respiracion || 'normal'}
              onChange={(e) => handleChange('respiracion', e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="ruidosa">Ruidosa</option>
              <option value="dificultad_inhalar">Dificultad para inhalar</option>
              <option value="dificultad_exhalar">Dificultad para exhalar</option>
            </select>
          </div>
          <div className="form-group">
            <label>Ronquidos o estertores</label>
            <select
              value={formData.ronquidos_estertores || 'NO'}
              onChange={(e) => handleChange('ronquidos_estertores', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Estornudos *</label>
            <select
              required
              value={formData.estornudos || 'NO'}
              onChange={(e) => handleChange('estornudos', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="aislados">Aislados</option>
              <option value="frecuentes">Frecuentes</option>
              <option value="con_secrecion">Con secreción</option>
              <option value="sin_secrecion">Sin secreción</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Mejora con limpieza nasal?</label>
            <select
              value={formData.mejora_limpieza_nasal || 'NO'}
              onChange={(e) => handleChange('mejora_limpieza_nasal', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>¿Presencia de costras en nariz?</label>
          <select
            value={formData.costras_nariz || 'NO'}
            onChange={(e) => handleChange('costras_nariz', e.target.value)}
          >
            <option value="NO">No</option>
            <option value="SI">Sí</option>
          </select>
        </div>
      </div>

      {/* Sistema Reproductivo */}
      <div id="cuyos-reproductivo" className="form-section">
        <h3>Sistema Reproductivo</h3>

        {formData.sexo === 'hembra' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Último celo/parto (días atrás)</label>
                <input
                  type="text"
                  value={formData.ultimo_celo || ''}
                  onChange={(e) => handleChange('ultimo_celo', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Secreción vaginal</label>
                <select
                  value={formData.secrecion_vaginal || 'NO'}
                  onChange={(e) => handleChange('secrecion_vaginal', e.target.value)}
                >
                  <option value="NO">No</option>
                  <option value="sanguinolenta">Sanguinolenta</option>
                  <option value="purulenta">Purulenta</option>
                  <option value="mucosa">Mucosa</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Frecuencia de secreción</label>
                <select
                  value={formData.secrecion_vaginal_frecuencia || ''}
                  onChange={(e) => handleChange('secrecion_vaginal_frecuencia', e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="intermitente">Intermitente</option>
                  <option value="continua">Continua</option>
                </select>
              </div>
              <div className="form-group">
                <label>Relación con celo</label>
                <select
                  value={formData.relacion_celo || ''}
                  onChange={(e) => handleChange('relacion_celo', e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="durante_celo">Durante celo</option>
                  <option value="fuera_celo">Fuera de celo</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>¿Hinchazón abdominal?</label>
              <select
                value={formData.hinchazon_abdominal || 'NO'}
                onChange={(e) => handleChange('hinchazon_abdominal', e.target.value)}
              >
                <option value="NO">No</option>
                <option value="SI">Sí</option>
              </select>
            </div>
          </>
        )}

        {formData.sexo === 'macho' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Testículos descendidos *</label>
                <select
                  required
                  value={formData.testiculos_descendidos || ''}
                  onChange={(e) => handleChange('testiculos_descendidos', e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="SI">Sí</option>
                  <option value="NO">No</option>
                  <option value="uno">Uno solo</option>
                </select>
              </div>
              <div className="form-group">
                <label>Hinchazón escrotal</label>
                <select
                  value={formData.hinchazon_escrotal || 'NO'}
                  onChange={(e) => handleChange('hinchazon_escrotal', e.target.value)}
                >
                  <option value="NO">No</option>
                  <option value="SI">Sí</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>¿Dificultad para orinar?</label>
              <select
                value={formData.dificultad_orinar || 'NO'}
                onChange={(e) => handleChange('dificultad_orinar', e.target.value)}
              >
                <option value="NO">No</option>
                <option value="SI">Sí</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Sistema Neurológico */}
      <div id="cuyos-neurologico" className="form-section">
        <h3>Sistema Neurológico</h3>

        <div className="form-row">
          <div className="form-group">
            <label>Temblor/Convulsiones *</label>
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
          {formData.convulsiones !== 'NO' && (
            <div className="form-group">
              <label>Duración (segundos/minutos)</label>
              <input
                type="text"
                value={formData.convulsiones_duracion || ''}
                onChange={(e) => handleChange('convulsiones_duracion', e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Desencadenantes</label>
            <select
              value={formData.convulsiones_desencadenante || ''}
              onChange={(e) => handleChange('convulsiones_desencadenante', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="estres">Estrés</option>
              <option value="manipulacion">Manipulación</option>
              <option value="ninguno">Ninguno</option>
            </select>
          </div>
          <div className="form-group">
            <label>Incoordinación</label>
            <select
              value={formData.incoordinacion || 'NO'}
              onChange={(e) => handleChange('incoordinacion', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="caidas">Caídas laterales</option>
              <option value="rodar">Rodar sin control</option>
              <option value="temblor_generalizado">Temblor generalizado</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Temblor muscular antes del colapso?</label>
            <select
              value={formData.temblor_pre_colapso || 'NO'}
              onChange={(e) => handleChange('temblor_pre_colapso', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Letargo extremo</label>
            <select
              value={formData.letargo_extremo || ''}
              onChange={(e) => handleChange('letargo_extremo', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="duerme_todo_dia">Duerme todo el día</option>
              <option value="no_responde_estimul">No responde a estímulos</option>
              <option value="hipotermia">Hipotermia</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sistema Cutáneo */}
      <div id="cuyos-cutaneo" className="form-section">
        <h3>Sistema Cutáneo</h3>

        <div className="form-row">
          <div className="form-group">
            <label>Pelo/Piel *</label>
            <select
              required
              value={formData.pelo_piel || 'normal'}
              onChange={(e) => handleChange('pelo_piel', e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="alopecia_simetrica">Alopecia simétrica</option>
              <option value="costras_cabeza_orejas">Costras en cabeza/orejas</option>
              <option value="ulceras_faciales">Úlceras faciales</option>
            </select>
          </div>
          <div className="form-group">
            <label>Prurito intenso</label>
            <select
              value={formData.prurito || 'ausente'}
              onChange={(e) => handleChange('prurito', e.target.value)}
            >
              <option value="ausente">Ausente</option>
              <option value="leve">Leve</option>
              <option value="intenso">Intenso</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Mentón ("barba sucia")</label>
            <select
              value={formData.barba_sucia || 'NO'}
              onChange={(e) => handleChange('barba_sucia', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="costras">Presencia de costras</option>
              <option value="hinchazon">Hinchazón</option>
              <option value="secrecion">Secreción</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Asociado a comedero de plástico?</label>
            <select
              value={formData.barba_comedero_plastico || 'NO'}
              onChange={(e) => handleChange('barba_comedero_plastico', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Orejas</label>
            <select
              value={formData.orejas || 'normales'}
              onChange={(e) => handleChange('orejas', e.target.value)}
            >
              <option value="normales">Normales</option>
              <option value="costras">Costras en interior</option>
              <option value="secrecion">Secreción marrón</option>
              <option value="mal_olor">Mal olor</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Ácaros visibles?</label>
            <select
              value={formData.acaros_visibles || 'NO'}
              onChange={(e) => handleChange('acaros_visibles', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ojos */}
      <div id="cuyos-ojos" className="form-section">
        <h3>Ojos</h3>

        <div className="form-row">
          <div className="form-group">
            <label>Secreción ocular *</label>
            <select
              required
              value={formData.secrecion_ocular || 'NO'}
              onChange={(e) => handleChange('secrecion_ocular', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="clara">Clara</option>
              <option value="purulenta">Purulenta</option>
              <option value="seca">Seca/crosta</option>
              <option value="sangre">Sangre</option>
            </select>
          </div>
          {formData.secrecion_ocular !== 'NO' && (
            <div className="form-group">
              <label>¿Unilateral o bilateral?</label>
              <select
                value={formData.secrecion_ocular_localizacion || ''}
                onChange={(e) => handleChange('secrecion_ocular_localizacion', e.target.value)}
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
            <label>Ojo(s) afectado(s)</label>
            <select
              value={formData.estado_ojos || 'normales'}
              onChange={(e) => handleChange('estado_ojos', e.target.value)}
            >
              <option value="normales">Normales</option>
              <option value="hinchazon">Hinchazón</option>
              <option value="opacidad">Opacidad corneal</option>
              <option value="exoftalmia">Exoftalmia (ojo salido)</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Dolor al tacto?</label>
            <select
              value={formData.dolor_ojos || 'NO'}
              onChange={(e) => handleChange('dolor_ojos', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>
      </div>

        </div>
      </div>
    </div>
  );
};

export default CuyosForm;
