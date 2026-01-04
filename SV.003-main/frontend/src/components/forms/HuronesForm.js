import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';

const HuronesForm = ({ formData, setFormData }) => {
  const [activeSection, setActiveSection] = useState('hurones-info-basica');

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleSection = useCallback((e) => {
    const section = e.target.closest('.form-section');
    if (section && e.target.tagName === 'H3') section.classList.toggle('collapsed');
  }, []);

  const requiredFields = [
    'nombre_mascota', 'nombre_dueño', 'sexo', 'edad', 'peso', 'condicion_corporal',
    'vacuna_moquillo', 'desparasitacion_interna', 'tipo_dieta', 'habitat',
    'temperatura', 'apetito', 'heces', 'perdida_pelo'
  ];

  const progress = useMemo(() => {
    const filled = requiredFields.filter(field => formData[field] && formData[field] !== '').length;
    return Math.round((filled / requiredFields.length) * 100);
  }, [formData]);

  const sections = [
    { id: 'hurones-info-basica', label: 'Información Básica', icon: '📋' },
    { id: 'hurones-vacunacion', label: 'Vacunación y Desparasitación', icon: '💉' },
    { id: 'hurones-alimentacion', label: 'Alimentación', icon: '🥗' },
    { id: 'hurones-ambiente', label: 'Ambiente', icon: '🏠' },
    { id: 'hurones-ejercicio', label: 'Ejercicio', icon: '🏃' },
    { id: 'hurones-socializacion', label: 'Socialización', icon: '🤝' },
    { id: 'hurones-higiene', label: 'Higiene', icon: '🚿' },
    { id: 'hurones-examen', label: 'Examen Físico', icon: '🩺' },
    { id: 'hurones-endocrino', label: 'Sistema Endocrino', icon: '⚖️' },
    { id: 'hurones-digestivo', label: 'Sistema Digestivo', icon: '🫃' },
    { id: 'hurones-neurologico', label: 'Sistema Neurológico', icon: '🧠' },
    { id: 'hurones-musculoesqueletico', label: 'Sistema Musculoesquelético', icon: '🦴' },
    { id: 'hurones-cutaneo', label: 'Sistema Cutáneo', icon: '🐾' },
    { id: 'hurones-urogenital', label: 'Sistema Urogenital', icon: '💧' },
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
      <h2>Datos del Paciente - Hurón</h2>

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
      
      <div id="hurones-info-basica" className="form-section">
        <h3>Información Básica</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Nombre del Paciente *</label>
            <input type="text" required value={formData.nombre_mascota || ''} onChange={(e) => handleChange('nombre_mascota', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Nombre del Dueño *</label>
            <input type="text" required value={formData.nombre_dueño || ''} onChange={(e) => handleChange('nombre_dueño', e.target.value)} />
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
              <option value="intacta">Intacta</option>
              <option value="esterilizado">Esterilizado</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Edad (años/meses) *</label>
            <input type="text" required value={formData.edad || ''} onChange={(e) => handleChange('edad', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Peso Actual (g) *</label>
            <input type="text" required value={formData.peso || ''} onChange={(e) => handleChange('peso', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
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
          <div className="form-group">
            <label>Se Extrajeron Glándulas Anales *</label>
            <select required value={formData.glandulas_anales || ''} onChange={(e) => handleChange('glandulas_anales', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
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
      </div>

      <div id="hurones-vacunacion" className="form-section">
        <h3>Vacunación y Desparasitación</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Moquillo *</label>
            <select required value={formData.vacuna_moquillo || ''} onChange={(e) => handleChange('vacuna_moquillo', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="completa">Completa</option>
              <option value="incompleta">Incompleta</option>
              <option value="nunca">Nunca</option>
            </select>
          </div>
          <div className="form-group">
            <label>Rabia *</label>
            <YesNoChips
              value={formData.vacuna_rabia}
              onChange={(val) => handleChange('vacuna_rabia', val)}
            />
          </div>
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
      </div>

      <div id="hurones-alimentacion" className="form-section">
        <h3>Alimentación</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Dieta *</label>
            <select required value={formData.tipo_dieta || ''} onChange={(e) => handleChange('tipo_dieta', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="comercial">Comercial específica</option>
              <option value="casera">Casera</option>
              <option value="mixta">Mixta</option>
            </select>
          </div>
          <div className="form-group">
            <label>Marca/Composición</label>
            <input type="text" value={formData.marca_alimento || ''} onChange={(e) => handleChange('marca_alimento', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Suplementos</label>
            <input type="text" value={formData.suplementos || ''} onChange={(e) => handleChange('suplementos', e.target.value)} placeholder="Taurina, Enzimas digestivas, Otros" />
          </div>
          <div className="form-group">
            <label>Acceso a Basura/Comida Humana *</label>
            <YesNoChips
              value={formData.acceso_basura}
              onChange={(val) => handleChange('acceso_basura', val)}
            />
          </div>
        </div>
      </div>

      <div id="hurones-ambiente" className="form-section">
        <h3>Ambiente</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Casa *</label>
            <select required value={formData.habitat || ''} onChange={(e) => handleChange('habitat', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="jaula">Jaula</option>
              <option value="corral">Corral</option>
              <option value="libre">Libre</option>
            </select>
          </div>
          <div className="form-group">
            <label>Ubicación *</label>
            <select required value={formData.ubicacion || ''} onChange={(e) => handleChange('ubicacion', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
              <option value="habitacion">Habitación específica</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Temperatura Ambiente (°C)</label>
            <input type="text" value={formData.temperatura_ambiente || ''} onChange={(e) => handleChange('temperatura_ambiente', e.target.value)} placeholder="Ideal: 18-24°C" />
          </div>
          <div className="form-group">
            <label>Superficie</label>
            <select value={formData.superficie || ''} onChange={(e) => handleChange('superficie', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="alfombra">Alfombra</option>
              <option value="piso_duro">Piso duro</option>
              <option value="jaula_barrotes">Jaula con barrotes</option>
              <option value="sustrato">Sustrato/Aserrín</option>
            </select>
          </div>
        </div>
      </div>

      <div id="hurones-ejercicio" className="form-section">
        <h3>Ejercicio</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Tiempo de juego diario (horas)</label>
            <input
              type="text"
              value={formData.tiempo_juego || ''}
              onChange={(e) => handleChange('tiempo_juego', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Tipo de juguetes</label>
            <select
              value={formData.tipo_juguetes || ''}
              onChange={(e) => handleChange('tipo_juguetes', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="tuneles">Túneles</option>
              <option value="pelotas">Pelotas</option>
              <option value="objetos_pequenos">Objetos pequeños</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Supervisión durante el juego</label>
            <YesNoChips
              value={formData.supervision_juego}
              onChange={(val) => handleChange('supervision_juego', val)}
            />
          </div>
        </div>
      </div>

      <div id="hurones-socializacion" className="form-section">
        <h3>Socialización</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Vive</label>
            <select
              value={formData.socializacion_tipo || ''}
              onChange={(e) => handleChange('socializacion_tipo', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="solo">Solo</option>
              <option value="pareja">Pareja</option>
              <option value="grupo">Grupo</option>
            </select>
          </div>
          <div className="form-group">
            <label>Peleas recientes</label>
            <YesNoChips
              value={formData.peleas_recientes}
              onChange={(val) => handleChange('peleas_recientes', val)}
            />
          </div>
        </div>

        {formData.peleas_recientes === 'SI' && (
          <div className="form-group">
            <label>Lesiones</label>
            <input
              type="text"
              value={formData.peleas_lesiones || ''}
              onChange={(e) => handleChange('peleas_lesiones', e.target.value)}
            />
          </div>
        )}
      </div>

      <div id="hurones-higiene" className="form-section">
        <h3>Higiene</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Limpieza de jaula</label>
            <select
              value={formData.limpieza_jaula || ''}
              onChange={(e) => handleChange('limpieza_jaula', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="diaria">Diaria</option>
              <option value="cada_2_dias">Cada 2 días</option>
              <option value="semanal">Semanal</option>
            </select>
          </div>
          <div className="form-group">
            <label>Lavado de comederos/bebederos</label>
            <select
              value={formData.lavado_comederos || ''}
              onChange={(e) => handleChange('lavado_comederos', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="diario">Diario</option>
              <option value="cada_2_dias">Cada 2 días</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Uso de desinfectantes</label>
            <YesNoChips
              value={formData.uso_desinfectantes}
              onChange={(val) => handleChange('uso_desinfectantes', val)}
            />
          </div>
          {formData.uso_desinfectantes === 'SI' && (
            <div className="form-group">
              <label>¿Cuál?</label>
              <input
                type="text"
                value={formData.desinfectante_cual || ''}
                onChange={(e) => handleChange('desinfectante_cual', e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div id="hurones-examen" className="form-section">
        <h3>Examen Físico</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Temperatura (°C)</label>
            <input type="text" value={formData.temperatura || ''} onChange={(e) => handleChange('temperatura', e.target.value)} placeholder="Normal: 38-40°C" />
          </div>
          <div className="form-group">
            <label>Frecuencia Cardíaca (lpm)</label>
            <input type="text" value={formData.frecuencia_cardiaca || ''} onChange={(e) => handleChange('frecuencia_cardiaca', e.target.value)} placeholder="Normal: 200-250" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Frecuencia Respiratoria (rpm)</label>
            <input type="text" value={formData.frecuencia_respiratoria || ''} onChange={(e) => handleChange('frecuencia_respiratoria', e.target.value)} placeholder="Normal: 33-36" />
          </div>
          <div className="form-group">
            <label>Color de Mucosas</label>
            <select value={formData.mucosas || 'rosado'} onChange={(e) => handleChange('mucosas', e.target.value)}>
              <option value="rosado">Rosado</option>
              <option value="palido">Pálido</option>
              <option value="icterico">Ictérico</option>
              <option value="cianotico">Cianótico</option>
            </select>
          </div>
        </div>
      </div>

      <div id="hurones-endocrino" className="form-section">
        <h3>Sistema Endocrino</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Pérdida de pelo *</label>
            <select
              required
              value={formData.perdida_pelo || 'NO'}
              onChange={(e) => handleChange('perdida_pelo', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="cola_base">Solo en cola/base</option>
              <option value="simetrico">Lateralmente simétrico</option>
              <option value="total">Total (excepto cabeza)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Progresión</label>
            <select
              value={formData.progresion_endocrina || ''}
              onChange={(e) => handleChange('progresion_endocrina', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="lenta">Lenta (meses)</option>
              <option value="rapida">Rápida (semanas)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Acompañado de picazón intensa?</label>
            <YesNoChips
              value={formData.picazon_intensa}
              onChange={(val) => handleChange('picazon_intensa', val)}
            />
          </div>
          <div className="form-group">
            <label>Debilidad/colapso *</label>
            <select
              required
              value={formData.debilidad || 'NO'}
              onChange={(e) => handleChange('debilidad', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="mananas">Mañanas en ayunas</option>
              <option value="post_ejercicio">Post-ejercicio</option>
              <option value="aleatorio">Aleatorio</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Mejora con azúcar/miel</label>
            <YesNoChips
              value={formData.mejora_azucar}
              onChange={(val) => handleChange('mejora_azucar', val)}
            />
          </div>
          <div className="form-group">
            <label>Temblor muscular antes del colapso</label>
            <YesNoChips
              value={formData.temblor_precolapso}
              onChange={(val) => handleChange('temblor_precolapso', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Hinchazón abdominal</label>
            <select
              value={formData.hinchazon_abdominal || ''}
              onChange={(e) => handleChange('hinchazon_abdominal', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="difusa">Difusa</option>
              <option value="localizada">Localizada</option>
            </select>
          </div>
          <div className="form-group">
            <label>Palpación de masa</label>
            <YesNoChips
              value={formData.palpacion_masa}
              onChange={(val) => handleChange('palpacion_masa', val)}
            />
          </div>
        </div>

        {formData.palpacion_masa === 'SI' && (
          <div className="form-group">
            <label>Tamaño de la masa</label>
            <input
              type="text"
              value={formData.masa_tamano || ''}
              onChange={(e) => handleChange('masa_tamano', e.target.value)}
            />
          </div>
        )}

        {formData.sexo === 'hembra' && (
          <div className="form-group">
            <label>Hembra en celo permanente</label>
            <YesNoChips
              value={formData.celo_permanente}
              onChange={(val) => handleChange('celo_permanente', val)}
            />
          </div>
        )}
      </div>

      <div id="hurones-digestivo" className="form-section">
        <h3>Sistema Digestivo</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Apetito *</label>
            <select required value={formData.apetito || 'normal'} onChange={(e) => handleChange('apetito', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="hiperfagia">Hiperfagia (come más)</option>
              <option value="hipofagia">Hipofagia (come menos)</option>
              <option value="anorexia">Anorexia</option>
            </select>
          </div>
          <div className="form-group">
            <label>Come pero Pierde Peso *</label>
            <select required value={formData.come_pierde_peso || 'NO'} onChange={(e) => handleChange('come_pierde_peso', e.target.value)}>
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Vómitos/Regurgitación *</label>
            <select required value={formData.vomitos || 'NO'} onChange={(e) => handleChange('vomitos', e.target.value)}>
              <option value="NO">No</option>
              <option value="alimentos">Alimentos no digeridos</option>
              <option value="bilis">Bilis</option>
              <option value="sangre">Sangre</option>
              <option value="material_oscuro">Material oscuro (heces)</option>
            </select>
          </div>
          {formData.vomitos !== 'NO' && (
            <div className="form-group">
              <label>Frecuencia (veces/horas)</label>
              <input type="text" value={formData.vomitos_frecuencia || ''} onChange={(e) => handleChange('vomitos_frecuencia', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Heces *</label>
            <select required value={formData.heces || 'normal'} onChange={(e) => handleChange('heces', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="diarrea_aguda">Diarrea aguda (&lt;3 días)</option>
              <option value="diarrea_cronica">Diarrea crónica (&gt;1 semana)</option>
              <option value="estrenimiento">Estreñimiento</option>
            </select>
          </div>
          <div className="form-group">
            <label>Color de Heces</label>
            <select value={formData.heces_color || 'normal'} onChange={(e) => handleChange('heces_color', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="negras">Negras</option>
              <option value="rojas">Rojas</option>
              <option value="palidas">Pálidas</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Consistencia de heces</label>
            <select
              value={formData.heces_consistencia || ''}
              onChange={(e) => handleChange('heces_consistencia', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="liquidas">Líquidas</option>
              <option value="pastosas">Pastosas</option>
              <option value="formadas">Formadas</option>
              <option value="con_moco">Con moco</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Presencia de parásitos?</label>
            <YesNoChips
              value={formData.heces_parasitos}
              onChange={(val) => handleChange('heces_parasitos', val)}
            />
          </div>
          {formData.heces_parasitos === 'SI' && (
            <div className="form-group">
              <label>Tipo de parásitos</label>
              <input
                type="text"
                value={formData.heces_parasitos_tipo || ''}
                onChange={(e) => handleChange('heces_parasitos_tipo', e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Presencia de cuerpos extraños</label>
            <YesNoChips
              value={formData.cuerpos_extranos}
              onChange={(val) => handleChange('cuerpos_extranos', val)}
            />
          </div>
          {formData.cuerpos_extranos === 'SI' && (
            <div className="form-group">
              <label>Describir</label>
              <input
                type="text"
                value={formData.cuerpos_extranos_descripcion || ''}
                onChange={(e) => handleChange('cuerpos_extranos_descripcion', e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div id="hurones-neurologico" className="form-section">
        <h3>Sistema Neurológico</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Convulsiones</label>
            <select
              value={formData.convulsiones || ''}
              onChange={(e) => handleChange('convulsiones', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="completa">Completa (pérdida de conciencia)</option>
              <option value="parcial">Parcial (solo una extremidad)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Duración (segundos/minutos)</label>
            <input
              type="text"
              value={formData.convulsiones_duracion || ''}
              onChange={(e) => handleChange('convulsiones_duracion', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ataxia</label>
            <select
              value={formData.ataxia || ''}
              onChange={(e) => handleChange('ataxia', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="borracho">Movimientos como "borracho"</option>
              <option value="caidas_laterales">Caídas laterales</option>
              <option value="no_puede_pararse">No puede pararse</option>
            </select>
          </div>
          <div className="form-group">
            <label>Mejora con azúcar</label>
            <YesNoChips
              value={formData.mejora_azucar_neuro}
              onChange={(val) => handleChange('mejora_azucar_neuro', val)}
            />
          </div>
        </div>
      </div>

      <div id="hurones-musculoesqueletico" className="form-section">
        <h3>Sistema Musculoesquelético</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Debilidad posterior</label>
            <select
              value={formData.debilidad_posterior || ''}
              onChange={(e) => handleChange('debilidad_posterior', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="dificultad_saltar">Dificultad para saltar</option>
              <option value="arrastre_patas_traseras">Arrastre de patas traseras</option>
              <option value="no_puede_pararse">No puede pararse</option>
            </select>
          </div>
          <div className="form-group">
            <label>Mejora temporal con estimulación</label>
            <YesNoChips
              value={formData.mejora_estimulacion}
              onChange={(val) => handleChange('mejora_estimulacion', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Temblor en patas traseras</label>
            <YesNoChips
              value={formData.temblor_patas_traseras}
              onChange={(val) => handleChange('temblor_patas_traseras', val)}
            />
          </div>
          <div className="form-group">
            <label>Postura anormal</label>
            <select
              value={formData.postura_anormal || ''}
              onChange={(e) => handleChange('postura_anormal', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="posicion_rana">"Posición de rana"</option>
              <option value="espalda_arqueada">Espalda arqueada</option>
              <option value="cuello_rigido">Cuello rígido</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Dolor al manipular columna</label>
            <YesNoChips
              value={formData.dolor_columna}
              onChange={(val) => handleChange('dolor_columna', val)}
            />
          </div>
          {formData.dolor_columna === 'SI' && (
            <div className="form-group">
              <label>Ubicación</label>
              <input
                type="text"
                value={formData.dolor_columna_ubicacion || ''}
                onChange={(e) => handleChange('dolor_columna_ubicacion', e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div id="hurones-cutaneo" className="form-section">
        <h3>Sistema Cutáneo</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Presencia de piel grasa/acnéica</label>
            <YesNoChips
              value={formData.piel_grasa_acneica}
              onChange={(val) => handleChange('piel_grasa_acneica', val)}
            />
          </div>
        </div>

        {formData.sexo === 'hembra' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Genitales (hembras)</label>
                <select
                  value={formData.genitales_hembras || ''}
                  onChange={(e) => handleChange('genitales_hembras', e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="hinchazon_vulvar_persistente">Hinchazón vulvar persistente</option>
                  <option value="secrecion_sanguinolenta">Secreción sanguinolenta</option>
                  <option value="olor_fetido">Olor fétido</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Duración de hinchazón (días)</label>
                <input
                  type="text"
                  value={formData.duracion_hinchazon_vulvar || ''}
                  onChange={(e) => handleChange('duracion_hinchazon_vulvar', e.target.value)}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div id="hurones-urogenital" className="form-section">
        <h3>Sistema Urogenital</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Micción</label>
            <select
              value={formData.miccion || ''}
              onChange={(e) => handleChange('miccion', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="frecuencia_aumentada">Frecuencia aumentada</option>
              <option value="esfuerzo">Esfuerzo</option>
              <option value="grito_al_orinar">Grito al orinar</option>
            </select>
          </div>
          <div className="form-group">
            <label>Color de orina</label>
            <select
              value={formData.orina_color || ''}
              onChange={(e) => handleChange('orina_color', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="clara">Clara</option>
              <option value="ambar">Ámbar</option>
              <option value="rojiza">Rojiza</option>
              <option value="turbia">Turbia</option>
              <option value="sedimentos">Con sedimentos</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Olor de la orina</label>
            <select
              value={formData.orina_olor || ''}
              onChange={(e) => handleChange('orina_olor', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="normal">Normal</option>
              <option value="amoniaco">Amónico</option>
              <option value="fetido">Fétido</option>
            </select>
          </div>
        </div>

        {formData.sexo === 'macho' && (
          <div className="form-row">
            <div className="form-group">
              <label>Signos en machos</label>
              <select
                value={formData.signos_machos_uro || ''}
                onChange={(e) => handleChange('signos_machos_uro', e.target.value)}
              >
                <option value="">Seleccionar</option>
                <option value="dificultad_orinar">Dificultad para orinar</option>
                <option value="goteo_continuo">Goteo continuo</option>
                <option value="hinchazon_perineal">Hinchazón perineal</option>
              </select>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>¿Palpación de próstata agrandada?</label>
            <YesNoChips
              value={formData.prostata_agrandada}
              onChange={(val) => handleChange('prostata_agrandada', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Duración exacta del problema</label>
            <select
              value={formData.duracion_problema_uro || ''}
              onChange={(e) => handleChange('duracion_problema_uro', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="<12h">&lt;12 horas</option>
              <option value="12-24h">12-24 h</option>
              <option value="2-3dias">2-3 días</option>
              <option value="4-7dias">4-7 días</option>
              <option value=">1semana">&gt;1 semana</option>
            </select>
          </div>
          <div className="form-group">
            <label>Progresión</label>
            <select
              value={formData.progresion_uro || ''}
              onChange={(e) => handleChange('progresion_uro', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="mejora">Mejora</option>
              <option value="estable">Estable</option>
              <option value="empeora_rapido">Empeora rápidamente</option>
              <option value="intermitente">Intermitente</option>
            </select>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default HuronesForm;