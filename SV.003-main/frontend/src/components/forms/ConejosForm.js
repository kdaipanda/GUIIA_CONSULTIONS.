import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';

const ConejosForm = ({ formData, setFormData }) => {
  const [activeSection, setActiveSection] = useState('conejos-info-basica');

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleSection = useCallback((e) => {
    const section = e.target.closest('.form-section');
    if (section && e.target.tagName === 'H3') section.classList.toggle('collapsed');
  }, []);

  const requiredFields = [
    'nombre_mascota', 'nombre_dueño', 'edad', 'sexo', 'peso', 'condicion_corporal',
    'vacuna_mixomatosis', 'desparasitacion_interna', 'tipo_dieta', 'heno_acceso',
    'habitat', 'temperatura_ambiente', 'apetito', 'heces', 'secrecion_nasal'
  ];

  const progress = useMemo(() => {
    const filled = requiredFields.filter(field => formData[field] && formData[field] !== '').length;
    return Math.round((filled / requiredFields.length) * 100);
  }, [formData]);

  const sections = [
    { id: 'conejos-info-basica', label: 'Información Básica', icon: '📋' },
    { id: 'conejos-vacunacion', label: 'Vacunación y Desparasitación', icon: '💉' },
    { id: 'conejos-alimentacion', label: 'Alimentación', icon: '🥗' },
    { id: 'conejos-ambiente', label: 'Ambiente', icon: '🏠' },
    { id: 'conejos-examen-fisico', label: 'Examen Físico', icon: '🩺' },
    { id: 'conejos-digestivo', label: 'Sistema Digestivo', icon: '🫃' },
    { id: 'conejos-respiratorio', label: 'Sistema Respiratorio', icon: '🫁' },
    { id: 'conejos-reproductivo', label: 'Sistema Reproductivo', icon: '🔬' },
    { id: 'conejos-neurologico', label: 'Sistema Neurológico', icon: '🧠' },
    { id: 'conejos-musculoesqueletico', label: 'Sistema Musculoesquelético', icon: '🦴' },
    { id: 'conejos-cutaneo', label: 'Sistema Cutáneo', icon: '🐾' },
    { id: 'conejos-ojos', label: 'Ojos', icon: '👁️' },
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
      <h2>Datos de la mascota - Conejo</h2>

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
      <div id="conejos-info-basica" className="form-section">
        <h3>Información Básica</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Nombre de la mascota *</label>
            <input type="text" required value={formData.nombre_mascota || ''} onChange={(e) => handleChange('nombre_mascota', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Nombre del Dueño *</label>
            <input type="text" required value={formData.nombre_dueño || ''} onChange={(e) => handleChange('nombre_dueño', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Raza Exacta *</label>
            <select required value={formData.raza || ''} onChange={(e) => handleChange('raza', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="holandes">Holandés</option>
              <option value="lionhead">Lionhead</option>
              <option value="flemish_giant">Flemish Giant</option>
              <option value="mixto">Mixto</option>
              <option value="enano">Enano</option>
            </select>
          </div>
          <div className="form-group">
            <label>Edad (años/meses) *</label>
            <input type="text" required value={formData.edad || ''} onChange={(e) => handleChange('edad', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Sexo *</label>
            <select required value={formData.sexo || ''} onChange={(e) => handleChange('sexo', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </div>
          <div className="form-group">
            <label>Esterilizado *</label>
            <select required value={formData.esterilizado || ''} onChange={(e) => handleChange('esterilizado', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
        </div>

        {formData.esterilizado === 'SI' && (
          <div className="form-row">
            <div className="form-group">
              <label>Fecha de esterilización</label>
              <input
                type="date"
                value={formData.esterilizacion_fecha || ''}
                onChange={(e) => handleChange('esterilizacion_fecha', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Tipo de esterilización</label>
              <select
                value={formData.esterilizacion_tipo || ''}
                onChange={(e) => handleChange('esterilizacion_tipo', e.target.value)}
              >
                <option value="">Seleccionar</option>
                <option value="quirurgico">Quirúrgico</option>
                <option value="quimico">Químico</option>
              </select>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Peso Actual (g/kg) *</label>
            <input type="text" required value={formData.peso || ''} onChange={(e) => handleChange('peso', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Índice de Condición Corporal *</label>
            <select required value={formData.condicion_corporal || ''} onChange={(e) => handleChange('condicion_corporal', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="1-3">1-3 (Emaciado)</option>
              <option value="4-5">4-5 (Delgado)</option>
              <option value="6-7">6-7 (Ideal)</option>
              <option value="8-9">8-9 (Sobrepeso)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Duración del Problema *</label>
          <select required value={formData.duracion_problema || ''} onChange={(e) => handleChange('duracion_problema', e.target.value)}>
            <option value="">Seleccionar</option>
            <option value="<12h">&lt; 12 horas</option>
            <option value="12-24h">12-24 horas</option>
            <option value="2-3dias">2-3 días</option>
            <option value="4-7dias">4-7 días</option>
            <option value=">1semana">&gt; 1 semana</option>
          </select>
        </div>

        <div className="form-row">
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
              <option value="destructivo">Destructivo</option>
            </select>
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

      {/* Vacunación y Desparasitación */}
      <div id="conejos-vacunacion" className="form-section">
        <h3>Vacunación y Desparasitación</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Mixomatosis *</label>
            <YesNoChips
              value={formData.vacuna_mixomatosis}
              onChange={(val) => handleChange('vacuna_mixomatosis', val)}
            />
          </div>
          {formData.vacuna_mixomatosis === 'SI' && (
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" value={formData.vacuna_mixomatosis_fecha || ''} onChange={(e) => handleChange('vacuna_mixomatosis_fecha', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>VHS (Virus Hemorrágico) *</label>
            <YesNoChips
              value={formData.vacuna_vhs}
              onChange={(val) => handleChange('vacuna_vhs', val)}
            />
          </div>
          {formData.vacuna_vhs === 'SI' && (
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" value={formData.vacuna_vhs_fecha || ''} onChange={(e) => handleChange('vacuna_vhs_fecha', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Desparasitación Interna *</label>
            <YesNoChips
              value={formData.desparasitacion_interna}
              onChange={(val) => handleChange('desparasitacion_interna', val)}
            />
          </div>
          <div className="form-group">
            <label>Desparasitación Externa *</label>
            <YesNoChips
              value={formData.desparasitacion_externa}
              onChange={(val) => handleChange('desparasitacion_externa', val)}
            />
          </div>
        </div>

        {formData.desparasitacion_interna === 'SI' && (
          <div className="form-row">
            <div className="form-group">
              <label>Última desparasitación interna (fecha)</label>
              <input
                type="date"
                value={formData.desparasitacion_interna_fecha || ''}
                onChange={(e) => handleChange('desparasitacion_interna_fecha', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Producto (interna)</label>
              <input
                type="text"
                value={formData.desparasitacion_interna_producto || ''}
                onChange={(e) => handleChange('desparasitacion_interna_producto', e.target.value)}
              />
            </div>
          </div>
        )}

        {formData.desparasitacion_externa === 'SI' && (
          <div className="form-row">
            <div className="form-group">
              <label>Última desparasitación externa (fecha)</label>
              <input
                type="date"
                value={formData.desparasitacion_externa_fecha || ''}
                onChange={(e) => handleChange('desparasitacion_externa_fecha', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Producto (externa)</label>
              <input
                type="text"
                value={formData.desparasitacion_externa_producto || ''}
                onChange={(e) => handleChange('desparasitacion_externa_producto', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Alimentación */}
      <div id="conejos-alimentacion" className="form-section">
        <h3>Alimentación</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Heno *</label>
            <select required value={formData.tipo_heno || ''} onChange={(e) => handleChange('tipo_heno', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="avena">Avena</option>
              <option value="alfalfa">Alfalfa</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="form-group">
            <label>Frecuencia de Heno *</label>
            <select required value={formData.frecuencia_heno || ''} onChange={(e) => handleChange('frecuencia_heno', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="ilimitado">Ilimitado</option>
              <option value="limitado">Limitado</option>
              <option value="intermitente">Intermitente</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Pellets (Marca)</label>
            <input type="text" value={formData.pellets_marca || ''} onChange={(e) => handleChange('pellets_marca', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Cantidad Diaria (g)</label>
            <input type="text" value={formData.pellets_cantidad || ''} onChange={(e) => handleChange('pellets_cantidad', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Verduras Frescas *</label>
            <select required value={formData.verduras_frescas || ''} onChange={(e) => handleChange('verduras_frescas', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          {formData.verduras_frescas === 'SI' && (
            <div className="form-group">
              <label>¿Cuáles?</label>
              <input type="text" value={formData.verduras_cuales || ''} onChange={(e) => handleChange('verduras_cuales', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Suplementos</label>
          <input type="text" value={formData.suplementos || ''} onChange={(e) => handleChange('suplementos', e.target.value)} placeholder="Vitaminas, Minerales, Otros" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Dieta rica en carbohidratos</label>
            <select
              value={formData.dieta_carbohidratos || 'NO'}
              onChange={(e) => handleChange('dieta_carbohidratos', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          {formData.dieta_carbohidratos === 'SI' && (
            <div className="form-group">
              <label>Detalles (frutas, pan, cereales)</label>
              <input
                type="text"
                value={formData.dieta_carbohidratos_detalle || ''}
                onChange={(e) => handleChange('dieta_carbohidratos_detalle', e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Ambiente */}
      <div id="conejos-ambiente" className="form-section">
        <h3>Ambiente</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Jaula/Vivienda *</label>
            <select required value={formData.vivienda || ''} onChange={(e) => handleChange('vivienda', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>
          <div className="form-group">
            <label>Tamaño de Espacio (m²)</label>
            <input type="text" value={formData.tamano_espacio || ''} onChange={(e) => handleChange('tamano_espacio', e.target.value)} placeholder="Mínimo: 2.5 m² + área ejercicio" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Temperatura Ambiente (°C)</label>
            <input type="text" value={formData.temperatura_ambiente || ''} onChange={(e) => handleChange('temperatura_ambiente', e.target.value)} placeholder="Ideal: 16-21°C" />
          </div>
          <div className="form-group">
            <label>Humedad (%)</label>
            <input type="text" value={formData.humedad || ''} onChange={(e) => handleChange('humedad', e.target.value)} placeholder="Ideal: 40-60%" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Superficie del Piso *</label>
            <select required value={formData.superficie_piso || ''} onChange={(e) => handleChange('superficie_piso', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="alambre">Alambre</option>
              <option value="madera">Madera</option>
              <option value="felpa">Felpa</option>
              <option value="cemento">Cemento</option>
            </select>
          </div>
          <div className="form-group">
            <label>Tiempo de Ejercicio Diario (horas)</label>
            <input type="text" value={formData.tiempo_ejercicio || ''} onChange={(e) => handleChange('tiempo_ejercicio', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
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
          <div className="form-group">
            <label>Saltos frecuentes</label>
            <select
              value={formData.saltos_frecuentes || 'NO'}
              onChange={(e) => handleChange('saltos_frecuentes', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
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
          <div className="form-group">
            <label>Peleas recientes</label>
            <select
              value={formData.peleas_recientes || 'NO'}
              onChange={(e) => handleChange('peleas_recientes', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>
        {formData.peleas_recientes === 'SI' && (
          <div className="form-group">
            <label>Lesiones por peleas</label>
            <input
              type="text"
              value={formData.peleas_lesiones || ''}
              onChange={(e) => handleChange('peleas_lesiones', e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label>Limpieza de Jaula *</label>
          <select required value={formData.limpieza_jaula || ''} onChange={(e) => handleChange('limpieza_jaula', e.target.value)}>
            <option value="">Seleccionar</option>
            <option value="diaria">Diaria</option>
            <option value="cada_2_dias">Cada 2 días</option>
            <option value="semanal">Semanal</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Uso de productos químicos</label>
            <YesNoChips
              value={formData.uso_quimicos}
              onChange={(val) => handleChange('uso_quimicos', val)}
            />
          </div>
          <div className="form-group">
            <label>Baños frecuentes</label>
            <YesNoChips
              value={formData.banos_frecuentes}
              onChange={(val) => handleChange('banos_frecuentes', val)}
            />
          </div>
        </div>
        {formData.uso_quimicos === 'SI' && (
          <div className="form-group">
            <label>¿Cuáles productos químicos?</label>
            <input
              type="text"
              value={formData.quimicos_cuales || ''}
              onChange={(e) => handleChange('quimicos_cuales', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Examen Físico */}
      <div id="conejos-examen-fisico" className="form-section">
        <h3>Examen Físico</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Temperatura (°C)</label>
            <input type="text" value={formData.temperatura || ''} onChange={(e) => handleChange('temperatura', e.target.value)} placeholder="Normal: 38.5-39.5°C" />
          </div>
          <div className="form-group">
            <label>Frecuencia Cardíaca (lpm)</label>
            <input type="text" value={formData.frecuencia_cardiaca || ''} onChange={(e) => handleChange('frecuencia_cardiaca', e.target.value)} placeholder="Normal: 180-250" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Frecuencia Respiratoria (rpm)</label>
            <input type="text" value={formData.frecuencia_respiratoria || ''} onChange={(e) => handleChange('frecuencia_respiratoria', e.target.value)} placeholder="Normal: 30-60" />
          </div>
          <div className="form-group">
            <label>Hidratación</label>
            <select value={formData.hidratacion || ''} onChange={(e) => handleChange('hidratacion', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="5">5% (piel vuelve rápido)</option>
              <option value="6-8">6-8% (piel lenta)</option>
              <option value=">10">&gt;10% (piel no vuelve)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Color de Mucosas</label>
            <select value={formData.mucosas || ''} onChange={(e) => handleChange('mucosas', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="rosado">Rosado</option>
              <option value="palido">Pálido</option>
              <option value="icterico">Ictérico</option>
              <option value="cianotico">Cianótico</option>
            </select>
          </div>
          <div className="form-group">
            <label>Estado Dental</label>
            <select value={formData.estado_dental || ''} onChange={(e) => handleChange('estado_dental', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="normal">Normal</option>
              <option value="sobrecrecimiento">Sobrecrecimiento</option>
              <option value="abscesos">Abscesos</option>
              <option value="rotos">Dientes rotos</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Tiempo de relleno capilar (TRC)</label>
            <input
              type="text"
              value={formData.trc || ''}
              onChange={(e) => handleChange('trc', e.target.value)}
              placeholder="Normal: < 2 seg"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Peso corporal (g/kg)</label>
            <input
              type="text"
              value={formData.peso_corporal || ''}
              onChange={(e) => handleChange('peso_corporal', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>% pérdida/ganancia de peso</label>
            <input
              type="text"
              value={formData.peso_cambio_porcentaje || ''}
              onChange={(e) => handleChange('peso_cambio_porcentaje', e.target.value)}
            />
          </div>
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

      {/* Sistema Digestivo */}
      <div id="conejos-digestivo" className="form-section">
        <h3>Sistema Digestivo</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Apetito *</label>
            <select required value={formData.apetito || 'normal'} onChange={(e) => handleChange('apetito', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="anorexia_total">Totalmente anoréxico (&gt;12h)</option>
              <option value="anorexia_parcial">Parcialmente anoréxico</option>
            </select>
          </div>
          {(formData.apetito === 'anorexia_total' || formData.apetito === 'anorexia_parcial') && (
            <div className="form-group">
              <label>Tiempo sin comer (horas)</label>
              <input type="text" value={formData.tiempo_sin_comer || ''} onChange={(e) => handleChange('tiempo_sin_comer', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Come Heno *</label>
            <select required value={formData.come_heno || ''} onChange={(e) => handleChange('come_heno', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Come Pellets *</label>
            <select required value={formData.come_pellets || ''} onChange={(e) => handleChange('come_pellets', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Come frutas y verduras?</label>
            <select
              value={formData.come_frutas_verduras || ''}
              onChange={(e) => handleChange('come_frutas_verduras', e.target.value)}
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
            <select required value={formData.heces || 'normales'} onChange={(e) => handleChange('heces', e.target.value)}>
              <option value="normales">Normales</option>
              <option value="ausentes">Ausentes (&gt;12h)</option>
              <option value="pequenas_duras">Pequeñas y duras</option>
              <option value="blandas">Blandas/pastosas</option>
              <option value="en_racimo">En racimo</option>
            </select>
          </div>
          <div className="form-group">
            <label>Frecuencia (veces/día)</label>
            <input type="text" value={formData.heces_frecuencia || ''} onChange={(e) => handleChange('heces_frecuencia', e.target.value)} placeholder="Normal: 100-300 según tamaño" />
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
            <label>Estómago/Abdomen *</label>
            <select required value={formData.abdomen || 'normal'} onChange={(e) => handleChange('abdomen', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="distendido">Distendido</option>
              <option value="doloroso">Doloroso al tacto</option>
              <option value="ruidos_ausentes">Ruidos intestinales ausentes</option>
            </select>
          </div>
          <div className="form-group">
            <label>Regurgitación *</label>
            <YesNoChips
              value={formData.regurgitacion}
              onChange={(val) => handleChange('regurgitacion', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Palpación de bolas de pelo</label>
            <YesNoChips
              value={formData.bolas_pelo}
              onChange={(val) => handleChange('bolas_pelo', val)}
            />
          </div>
          {formData.bolas_pelo === 'SI' && (
            <div className="form-group">
              <label>Ubicación de bolas de pelo</label>
              <input
                type="text"
                value={formData.bolas_pelo_ubicacion || ''}
                onChange={(e) => handleChange('bolas_pelo_ubicacion', e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Cambio reciente de dieta</label>
            <YesNoChips
              value={formData.desencadenante_dieta}
              onChange={(val) => handleChange('desencadenante_dieta', val)}
            />
          </div>
          <div className="form-group">
            <label>Estrés (mudanza/veterinario)</label>
            <YesNoChips
              value={formData.desencadenante_estres}
              onChange={(val) => handleChange('desencadenante_estres', val)}
            />
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
      <div id="conejos-respiratorio" className="form-section">
        <h3>Sistema Respiratorio</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Secreción Nasal *</label>
            <select required value={formData.secrecion_nasal || 'NO'} onChange={(e) => handleChange('secrecion_nasal', e.target.value)}>
              <option value="NO">No</option>
              <option value="clara">Clara (moco)</option>
              <option value="purulenta">Purulenta (amarilla/verde)</option>
              <option value="sangre">Sangre</option>
              <option value="caseosa">Caseosa</option>
            </select>
          </div>
          {formData.secrecion_nasal !== 'NO' && (
            <div className="form-group">
              <label>Localización</label>
              <select value={formData.secrecion_localizacion || ''} onChange={(e) => handleChange('secrecion_localizacion', e.target.value)}>
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
            <select required value={formData.respiracion || 'normal'} onChange={(e) => handleChange('respiracion', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="ruidosa">Ruidosa</option>
              <option value="dificultad_inhalar">Dificultad para inhalar</option>
              <option value="dificultad_exhalar">Dificultad para exhalar</option>
            </select>
          </div>
          <div className="form-group">
            <label>Estornudos *</label>
            <select required value={formData.estornudos || 'NO'} onChange={(e) => handleChange('estornudos', e.target.value)}>
              <option value="NO">No</option>
              <option value="aislados">Aislados</option>
              <option value="frecuentes">Frecuentes</option>
              <option value="con_secrecion">Con secreción</option>
              <option value="sin_secrecion">Sin secreción</option>
            </select>
          </div>
        </div>

        <div className="form-row">
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

        <div className="form-row">
          <div className="form-group">
            <label>Presencia de costras en nariz</label>
            <select
              value={formData.costras_nariz || 'NO'}
              onChange={(e) => handleChange('costras_nariz', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sistema Reproductivo */}
      <div id="conejos-reproductivo" className="form-section">
        <h3>Sistema Reproductivo</h3>
        {formData.sexo === 'hembra' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Último Celo/Parto (días atrás)</label>
                <input type="text" value={formData.ultimo_celo || ''} onChange={(e) => handleChange('ultimo_celo', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Secreción Vaginal</label>
                <select value={formData.secrecion_vaginal || 'NO'} onChange={(e) => handleChange('secrecion_vaginal', e.target.value)}>
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
              <label>Hinchazón Abdominal *</label>
              <select required value={formData.hinchazon_abdominal || 'NO'} onChange={(e) => handleChange('hinchazon_abdominal', e.target.value)}>
                <option value="NO">No</option>
                <option value="SI">Sí</option>
              </select>
            </div>
            {formData.hinchazon_abdominal === 'SI' && (
              <div className="form-group">
                <label>Tamaño de hinchazón abdominal</label>
                <input
                  type="text"
                  value={formData.hinchazon_abdominal_tamano || ''}
                  onChange={(e) => handleChange('hinchazon_abdominal_tamano', e.target.value)}
                />
              </div>
            )}
          </>
        )}

        {formData.sexo === 'macho' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Testículos Descendidos *</label>
                <select required value={formData.testiculos_descendidos || ''} onChange={(e) => handleChange('testiculos_descendidos', e.target.value)}>
                  <option value="">Seleccionar</option>
                  <option value="SI">Sí</option>
                  <option value="NO">No</option>
                  <option value="uno">Uno solo</option>
                </select>
              </div>
              <div className="form-group">
                <label>Hinchazón Escrotal *</label>
                <select required value={formData.hinchazon_escrotal || 'NO'} onChange={(e) => handleChange('hinchazon_escrotal', e.target.value)}>
                  <option value="NO">No</option>
                  <option value="SI">Sí</option>
                </select>
              </div>
            </div>
            {formData.hinchazon_escrotal === 'SI' && (
              <div className="form-group">
                <label>Características de la hinchazón escrotal</label>
                <input
                  type="text"
                  value={formData.hinchazon_escrotal_caracteristicas || ''}
                  onChange={(e) => handleChange('hinchazon_escrotal_caracteristicas', e.target.value)}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Sistema Neurológico */}
      <div id="conejos-neurologico" className="form-section">
        <h3>Sistema Neurológico</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Inclinación de Cabeza *</label>
            <select required value={formData.inclinacion_cabeza || 'NO'} onChange={(e) => handleChange('inclinacion_cabeza', e.target.value)}>
              <option value="NO">No</option>
              <option value="leve">Leve (15°)</option>
              <option value="moderada">Moderada (45°)</option>
              <option value="severa">Severa (90°+)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Nistagmo</label>
            <select value={formData.nistagmo || 'NO'} onChange={(e) => handleChange('nistagmo', e.target.value)}>
              <option value="NO">No</option>
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
              <option value="rotatorio">Rotatorio</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Movimientos Anormales *</label>
            <select required value={formData.movimientos_anormales || 'NO'} onChange={(e) => handleChange('movimientos_anormales', e.target.value)}>
              <option value="NO">No</option>
              <option value="caidas">Caídas laterales</option>
              <option value="rodar">Rodar sin control</option>
              <option value="temblor">Temblor generalizado</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Mejora con reposo?</label>
            <select
              value={formData.mejora_reposo || 'NO'}
              onChange={(e) => handleChange('mejora_reposo', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Desencadenado por movimiento?</label>
            <select
              value={formData.desencadenado_movimiento || 'NO'}
              onChange={(e) => handleChange('desencadenado_movimiento', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Cambios de comportamiento</label>
            <select
              value={formData.cambios_comportamiento || 'NO'}
              onChange={(e) => handleChange('cambios_comportamiento', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="letargo_extremo">Letargo extremo</option>
              <option value="agresividad_repentina">Agresividad repentina</option>
              <option value="no_responde_estimul">No responde a estímulos</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Pérdida de visión</label>
            <select
              value={formData.perdida_vision || 'NO'}
              onChange={(e) => handleChange('perdida_vision', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>
        {formData.perdida_vision === 'SI' && (
          <div className="form-group">
            <label>¿Pérdida de visión confirmada por?</label>
            <input
              type="text"
              value={formData.perdida_vision_confirmada || ''}
              onChange={(e) => handleChange('perdida_vision_confirmada', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Sistema Musculoesquelético */}
      <div id="conejos-musculoesqueletico" className="form-section">
        <h3>Sistema Musculoesquelético</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Cojera/Movimiento *</label>
            <select required value={formData.cojera || 'normal'} onChange={(e) => handleChange('cojera', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="no_saltar">No puede saltar</option>
              <option value="evita_erectas">Evita posiciones erectas</option>
              <option value="arrastra">Se arrastra</option>
            </select>
          </div>
          <div className="form-group">
            <label>Localización</label>
            <select value={formData.cojera_localizacion || ''} onChange={(e) => handleChange('cojera_localizacion', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="patas_traseras">Patas traseras</option>
              <option value="patas_delanteras">Patas delanteras</option>
              <option value="ambas">Ambas</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Patas *</label>
            <select required value={formData.patas || 'normales'} onChange={(e) => handleChange('patas', e.target.value)}>
              <option value="normales">Normales</option>
              <option value="ulceras">Úlceras en almohadillas</option>
              <option value="perdida_pelo">Pérdida de pelo</option>
              <option value="hinchazon">Hinchazón</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Dolor al manipular columna</label>
            <select
              value={formData.dolor_columna || 'NO'}
              onChange={(e) => handleChange('dolor_columna', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          {formData.dolor_columna === 'SI' && (
            <div className="form-group">
              <label>Ubicación del dolor en columna</label>
              <input
                type="text"
                value={formData.dolor_columna_ubicacion || ''}
                onChange={(e) => handleChange('dolor_columna_ubicacion', e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Gravedad (escala 1-4)</label>
            <input
              type="text"
              value={formData.gravedad_musculoesqueletico || ''}
              onChange={(e) => handleChange('gravedad_musculoesqueletico', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Sistema Cutáneo */}
      <div id="conejos-cutaneo" className="form-section">
        <h3>Sistema Cutáneo</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Pelo/Piel *</label>
            <select required value={formData.pelo_piel || 'normal'} onChange={(e) => handleChange('pelo_piel', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="alopecia_simetrica">Alopecia simétrica</option>
              <option value="costras">Costras en cabeza/orejas</option>
              <option value="ulceras">Úlceras faciales</option>
            </select>
          </div>
          <div className="form-group">
            <label>Prurito Intenso *</label>
            <select required value={formData.prurito || 'ausente'} onChange={(e) => handleChange('prurito', e.target.value)}>
              <option value="ausente">Ausente</option>
              <option value="leve">Leve</option>
              <option value="intenso">Intenso</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Mentón ("Barba Sucia") *</label>
            <select required value={formData.barba_sucia || 'NO'} onChange={(e) => handleChange('barba_sucia', e.target.value)}>
              <option value="NO">No</option>
              <option value="costras">Presencia de costras</option>
              <option value="hinchazon">Hinchazón</option>
              <option value="secrecion">Secreción</option>
            </select>
          </div>
          <div className="form-group">
            <label>Orejas</label>
            <select value={formData.orejas || 'normales'} onChange={(e) => handleChange('orejas', e.target.value)}>
              <option value="normales">Normales</option>
              <option value="costras">Costras en interior</option>
              <option value="secrecion">Secreción marrón</option>
              <option value="mal_olor">Mal olor</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Localización específica de lesiones</label>
          <input
            type="text"
            value={formData.localizacion_cutanea || ''}
            onChange={(e) => handleChange('localizacion_cutanea', e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ácaros visibles</label>
            <select
              value={formData.acaros_visibles || 'NO'}
              onChange={(e) => handleChange('acaros_visibles', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          {formData.acaros_visibles === 'SI' && (
            <div className="form-group">
              <label>Tipo de ácaros</label>
              <input
                type="text"
                value={formData.acaros_tipo || ''}
                onChange={(e) => handleChange('acaros_tipo', e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Ojos */}
      <div id="conejos-ojos" className="form-section">
        <h3>Ojos</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Secreción Ocular *</label>
            <select required value={formData.secrecion_ocular || 'NO'} onChange={(e) => handleChange('secrecion_ocular', e.target.value)}>
              <option value="NO">No</option>
              <option value="clara">Clara</option>
              <option value="purulenta">Purulenta</option>
              <option value="seca">Seca/costra</option>
              <option value="sangre">Sangre</option>
            </select>
          </div>
          {formData.secrecion_ocular !== 'NO' && (
            <div className="form-group">
              <label>Localización</label>
              <select value={formData.secrecion_ocular_localizacion || ''} onChange={(e) => handleChange('secrecion_ocular_localizacion', e.target.value)}>
                <option value="">Seleccionar</option>
                <option value="unilateral">Unilateral</option>
                <option value="bilateral">Bilateral</option>
              </select>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Estado de Ojo(s) *</label>
            <select required value={formData.estado_ojos || 'normales'} onChange={(e) => handleChange('estado_ojos', e.target.value)}>
              <option value="normales">Normales</option>
              <option value="hinchazon">Hinchazón</option>
              <option value="opacidad">Opacidad corneal</option>
              <option value="exoftalmia">Exoftalmia (ojo salido)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Mejora con limpieza ocular?</label>
            <select
              value={formData.mejora_limpieza_ocular || 'NO'}
              onChange={(e) => handleChange('mejora_limpieza_ocular', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Dolor al tacto</label>
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

export default ConejosForm;
