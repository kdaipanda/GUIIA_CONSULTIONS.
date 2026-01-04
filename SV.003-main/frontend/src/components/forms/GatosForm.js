import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';

const GatosForm = ({ formData, setFormData }) => {
  const [activeSection, setActiveSection] = useState('gatos-info-basica');

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleSection = useCallback((e) => {
    const section = e.target.closest('.form-section');
    if (section && e.target.tagName === 'H3') section.classList.toggle('collapsed');
  }, []);

  const requiredFields = [
    'fecha', 'nombre_mascota', 'especie', 'raza', 'sexo', 'edad', 'peso',
    'vacunas', 'desparasitacion', 'esterilizado', 'habitat', 'dieta',
    'temperatura', 'frecuencia_cardiaca', 'frecuencia_respiratoria'
  ];

  const progress = useMemo(() => {
    const filled = requiredFields.filter(field => formData[field] && formData[field] !== '').length;
    return Math.round((filled / requiredFields.length) * 100);
  }, [formData]);

  const sections = [
    { id: 'gatos-info-basica', label: 'Información Básica', icon: '📋' },
    { id: 'gatos-historial-medico', label: 'Historial Médico', icon: '📁' },
    { id: 'gatos-habitat-alimentacion', label: 'Hábitat y Alimentación', icon: '🏠' },
    { id: 'gatos-aspecto-general', label: 'Aspecto General', icon: '👀' },
    { id: 'gatos-historial-reportado', label: 'Historial Reportado', icon: '📝' },
    { id: 'gatos-alimentacion-reciente', label: 'Alimentación Reciente', icon: '🥗' },
    { id: 'gatos-actividad', label: 'Actividad y Medicamentos', icon: '💊' },
    { id: 'gatos-examen-fisico', label: 'Examen Físico', icon: '🩺' },
    { id: 'gatos-examen-sensibilidad', label: 'Examen de Sensibilidad', icon: '🔍' },
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
      <h2>Datos Generales del Gato</h2>

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
      <div id="gatos-info-basica" className="form-section">
        <h3>Información Básica</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Fecha *</label>
            <input
              type="date"
              required
              value={formData.fecha || ''}
              onChange={(e) => handleChange('fecha', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Nombre de la Mascota *</label>
            <input
              type="text"
              required
              value={formData.nombre_mascota || ''}
              onChange={(e) => handleChange('nombre_mascota', e.target.value)}
              placeholder="Nombre de la mascota"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Nombre del Dueño *</label>
            <input
              type="text"
              required
              value={formData.nombre_dueño || ''}
              onChange={(e) => handleChange('nombre_dueño', e.target.value)}
              placeholder="Nombre completo del propietario"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Raza *</label>
            <input
              type="text"
              required
              value={formData.raza || ''}
              onChange={(e) => handleChange('raza', e.target.value)}
              placeholder="Raza del gato"
            />
          </div>
          
          <div className="form-group">
            <label>Mix</label>
            <input
              type="text"
              value={formData.mix || ''}
              onChange={(e) => handleChange('mix', e.target.value)}
              placeholder="Especificar si es mezcla"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Edad *</label>
            <input
              type="text"
              required
              value={formData.edad || ''}
              onChange={(e) => handleChange('edad', e.target.value)}
              placeholder="Edad (años/meses)"
            />
          </div>
          
          <div className="form-group">
            <label>Peso (kg) *</label>
            <input
              type="text"
              required
              value={formData.peso || ''}
              onChange={(e) => handleChange('peso', e.target.value)}
              placeholder="Peso en kilogramos"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Condición Corporal (1-5) *</label>
            <select
              required
              value={formData.condicion_corporal || '3'}
              onChange={(e) => handleChange('condicion_corporal', e.target.value)}
            >
              <option value="1">1 - Muy delgado</option>
              <option value="2">2 - Delgado</option>
              <option value="3">3 - Ideal</option>
              <option value="4">4 - Sobrepeso</option>
              <option value="5">5 - Obeso</option>
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
              <option value="hembra">Hembra</option>
              <option value="macho">Macho</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Estado Reproductivo *</label>
            <select
              required
              value={formData.estado_reproductivo || ''}
              onChange={(e) => handleChange('estado_reproductivo', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="entero">Entero</option>
              <option value="castrado">Castrado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Historial Médico */}
      <div id="gatos-historial-medico" className="form-section">
        <h3>Historial Médico</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Vacunas Vigentes *</label>
            <select
              required
              value={formData.vacunas_vigentes || ''}
              onChange={(e) => handleChange('vacunas_vigentes', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          
          {formData.vacunas_vigentes === 'SI' && (
            <div className="form-group">
              <label>¿Cuáles vacunas?</label>
              <input
                type="text"
                value={formData.vacunas_cual || ''}
                onChange={(e) => handleChange('vacunas_cual', e.target.value)}
                placeholder="Especificar vacunas"
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Desparasitación Interna *</label>
            <select
              required
              value={formData.desparasitacion_interna || ''}
              onChange={(e) => handleChange('desparasitacion_interna', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          
          {formData.desparasitacion_interna === 'SI' && (
            <div className="form-group">
              <label>¿Cuál producto?</label>
              <input
                type="text"
                value={formData.desparasitacion_interna_cual || ''}
                onChange={(e) => handleChange('desparasitacion_interna_cual', e.target.value)}
                placeholder="Nombre del producto"
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Desparasitación Externa *</label>
            <select
              required
              value={formData.desparasitacion_externa || ''}
              onChange={(e) => handleChange('desparasitacion_externa', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          
          {formData.desparasitacion_externa === 'SI' && (
            <>
              <div className="form-group">
                <label>Producto</label>
                <input
                  type="text"
                  value={formData.desparasitacion_externa_producto || ''}
                  onChange={(e) => handleChange('desparasitacion_externa_producto', e.target.value)}
                  placeholder="Nombre del producto"
                />
              </div>
              <div className="form-group">
                <label>Fecha</label>
                <input
                  type="date"
                  value={formData.desparasitacion_externa_fecha || ''}
                  onChange={(e) => handleChange('desparasitacion_externa_fecha', e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Cirugías Previas *</label>
            <select
              required
              value={formData.cirugias_previas || ''}
              onChange={(e) => handleChange('cirugias_previas', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          
          {formData.cirugias_previas === 'SI' && (
            <div className="form-group">
              <label>¿Cuál cirugía?</label>
              <input
                type="text"
                value={formData.cirugias_cual || ''}
                onChange={(e) => handleChange('cirugias_cual', e.target.value)}
                placeholder="Describir cirugía"
              />
            </div>
          )}
        </div>
      </div>

      {/* Hábitat y Alimentación */}
      <div id="gatos-habitat-alimentacion" className="form-section">
        <h3>Hábitat y Alimentación</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Hábitat *</label>
            <select
              required
              value={formData.habitat || ''}
              onChange={(e) => handleChange('habitat', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="INTERIOR">Interior</option>
              <option value="EXTERIOR">Exterior</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Zona Geográfica de Residencia *</label>
            <input
              type="text"
              required
              value={formData.zona_geografica || ''}
              onChange={(e) => handleChange('zona_geografica', e.target.value)}
              placeholder="Ciudad, estado"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Alimentación Seco (Marca)</label>
            <input
              type="text"
              value={formData.alimentacion_seco || ''}
              onChange={(e) => handleChange('alimentacion_seco', e.target.value)}
              placeholder="Marca de alimento seco"
            />
          </div>
          
          <div className="form-group">
            <label>Alimentación Húmedo (Marca)</label>
            <input
              type="text"
              value={formData.alimentacion_humedo || ''}
              onChange={(e) => handleChange('alimentacion_humedo', e.target.value)}
              placeholder="Marca de alimento húmedo"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Alimentación Casera</label>
            <input
              type="text"
              value={formData.alimentacion_casero || ''}
              onChange={(e) => handleChange('alimentacion_casero', e.target.value)}
              placeholder="Describir alimentación casera"
            />
          </div>
          
          <div className="form-group">
            <label>Frecuencia de Alimentación</label>
            <input
              type="text"
              value={formData.alimentacion_frecuencia || ''}
              onChange={(e) => handleChange('alimentacion_frecuencia', e.target.value)}
              placeholder="Ej: 2 veces al día"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Paseos *</label>
            <select
              required
              value={formData.paseos || ''}
              onChange={(e) => handleChange('paseos', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          
          {formData.paseos === 'SI' && (
            <div className="form-group">
              <label>Frecuencia de Paseos</label>
              <input
                type="text"
                value={formData.paseos_frecuencia || ''}
                onChange={(e) => handleChange('paseos_frecuencia', e.target.value)}
                placeholder="Ej: 3 veces al día"
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Baños/Estética Reciente *</label>
            <select
              required
              value={formData.baños_estetica || ''}
              onChange={(e) => handleChange('baños_estetica', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          
          {formData.baños_estetica === 'SI' && (
            <div className="form-group">
              <label>Fecha</label>
              <input
                type="date"
                value={formData.baños_fecha || ''}
                onChange={(e) => handleChange('baños_fecha', e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Aspecto General */}
      <div id="gatos-aspecto-general" className="form-section">
        <h3>Aspecto General de la Mascota</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Pelaje</label>
            <input
              type="text"
              value={formData.aspecto_pelaje || ''}
              onChange={(e) => handleChange('aspecto_pelaje', e.target.value)}
              placeholder="Describir aspecto del pelaje"
            />
          </div>
          
          <div className="form-group">
            <label>Piel</label>
            <input
              type="text"
              value={formData.aspecto_piel || ''}
              onChange={(e) => handleChange('aspecto_piel', e.target.value)}
              placeholder="Describir aspecto de la piel"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Oídos</label>
            <input
              type="text"
              value={formData.aspecto_oidos || ''}
              onChange={(e) => handleChange('aspecto_oidos', e.target.value)}
              placeholder="Describir aspecto de oídos"
            />
          </div>
          
          <div className="form-group">
            <label>Ojos</label>
            <input
              type="text"
              value={formData.aspecto_ojos || ''}
              onChange={(e) => handleChange('aspecto_ojos', e.target.value)}
              placeholder="Describir aspecto de ojos"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Otros</label>
          <textarea
            value={formData.aspecto_otros || ''}
            onChange={(e) => handleChange('aspecto_otros', e.target.value)}
            placeholder="Otras observaciones del aspecto general"
            rows="3"
          />
        </div>
      </div>

      {/* Historial Reportado */}
      <div id="gatos-historial-reportado" className="form-section">
        <h3>Historial Reportado</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Vómito *</label>
            <YesNoChips
              value={formData.vomito}
              onChange={(val) => handleChange('vomito', val)}
            />
          </div>
          
          {formData.vomito === 'SI' && (
            <>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  value={formData.vomito_color || ''}
                  onChange={(e) => handleChange('vomito_color', e.target.value)}
                  placeholder="Color del vómito"
                />
              </div>
              <div className="form-group">
                <label>Aspecto</label>
                <input
                  type="text"
                  value={formData.vomito_aspecto || ''}
                  onChange={(e) => handleChange('vomito_aspecto', e.target.value)}
                  placeholder="Aspecto del vómito"
                />
              </div>
            </>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Diarrea *</label>
            <YesNoChips
              value={formData.diarrea}
              onChange={(val) => handleChange('diarrea', val)}
            />
          </div>
          
          {formData.diarrea === 'SI' && (
            <>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  value={formData.diarrea_color || ''}
                  onChange={(e) => handleChange('diarrea_color', e.target.value)}
                  placeholder="Color de la diarrea"
                />
              </div>
              <div className="form-group">
                <label>Aspecto</label>
                <input
                  type="text"
                  value={formData.diarrea_aspecto || ''}
                  onChange={(e) => handleChange('diarrea_aspecto', e.target.value)}
                  placeholder="Aspecto de la diarrea"
                />
              </div>
            </>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Orina *</label>
            <YesNoChips
              value={formData.orina}
              onChange={(val) => handleChange('orina', val)}
            />
          </div>
          
          {formData.orina === 'SI' && (
            <>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  value={formData.orina_color || ''}
                  onChange={(e) => handleChange('orina_color', e.target.value)}
                  placeholder="Color de la orina"
                />
              </div>
              <div className="form-group">
                <label>Olor</label>
                <input
                  type="text"
                  value={formData.orina_olor || ''}
                  onChange={(e) => handleChange('orina_olor', e.target.value)}
                  placeholder="Olor de la orina"
                />
              </div>
            </>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Secreción Nasal *</label>
            <YesNoChips
              value={formData.secrecion_nasal}
              onChange={(val) => handleChange('secrecion_nasal', val)}
            />
          </div>
          
          {formData.secrecion_nasal === 'SI' && (
            <>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  value={formData.secrecion_nasal_color || ''}
                  onChange={(e) => handleChange('secrecion_nasal_color', e.target.value)}
                  placeholder="Color de la secreción"
                />
              </div>
              <div className="form-group">
                <label>Aspecto</label>
                <input
                  type="text"
                  value={formData.secrecion_nasal_aspecto || ''}
                  onChange={(e) => handleChange('secrecion_nasal_aspecto', e.target.value)}
                  placeholder="Aspecto de la secreción"
                />
              </div>
            </>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Secreción Ocular *</label>
            <YesNoChips
              value={formData.secrecion_ocular}
              onChange={(val) => handleChange('secrecion_ocular', val)}
            />
          </div>
          
          {formData.secrecion_ocular === 'SI' && (
            <div className="form-group">
              <label>Color</label>
              <input
                type="text"
                value={formData.secrecion_ocular_color || ''}
                onChange={(e) => handleChange('secrecion_ocular_color', e.target.value)}
                placeholder="Color de la secreción"
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Dientes *</label>
            <select
              required
              value={formData.dientes || 'limpios'}
              onChange={(e) => handleChange('dientes', e.target.value)}
            >
              <option value="limpios">Limpios</option>
              <option value="placas">Placas</option>
              <option value="gingivitis">Gingivitis</option>
              <option value="periodontitis">Periodontitis</option>
              <option value="otros">Otros</option>
            </select>
          </div>
          
          {formData.dientes === 'otros' && (
            <div className="form-group">
              <label>Especificar</label>
              <input
                type="text"
                value={formData.dientes_otros || ''}
                onChange={(e) => handleChange('dientes_otros', e.target.value)}
                placeholder="Describir estado dental"
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Condición de Piel *</label>
          <select
            required
            value={formData.piel_condicion || 'normal'}
            onChange={(e) => handleChange('piel_condicion', e.target.value)}
          >
            <option value="normal">Normal</option>
            <option value="dermatitis">Dermatitis</option>
            <option value="pulgas">Pulgas</option>
            <option value="tumores">Tumores</option>
            <option value="abscesos">Abscesos</option>
          </select>
        </div>
      </div>

      {/* Alimentación Reciente */}
      <div id="gatos-alimentacion-reciente" className="form-section">
        <h3>Alimentación e Hidratación Reciente</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Última Comida</label>
            <input
              type="text"
              value={formData.ultima_comida || ''}
              onChange={(e) => handleChange('ultima_comida', e.target.value)}
              placeholder="¿Qué comió?"
            />
          </div>
          
          <div className="form-group">
            <label>Fecha/Hora</label>
            <input
              type="datetime-local"
              value={formData.ultima_comida_fecha || ''}
              onChange={(e) => handleChange('ultima_comida_fecha', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Consumo de Líquidos *</label>
            <select
              required
              value={formData.liquidos || ''}
              onChange={(e) => handleChange('liquidos', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          
          {formData.liquidos === 'SI' && (
            <div className="form-group">
              <label>Cantidad</label>
              <input
                type="text"
                value={formData.liquidos_cantidad || ''}
                onChange={(e) => handleChange('liquidos_cantidad', e.target.value)}
                placeholder="Ej: Normal, aumentada, disminuida"
              />
            </div>
          )}
        </div>
      </div>

      {/* Actividad y Medicamentos */}
      <div id="gatos-actividad" className="form-section">
        <h3>Actividad General y Medicamentos</h3>
        
        <div className="form-group">
          <label>Actividad General *</label>
          <select
            required
            value={formData.actividad_general || 'ACTIVO'}
            onChange={(e) => handleChange('actividad_general', e.target.value)}
          >
            <option value="ACTIVO">Activo</option>
            <option value="PASIVO">Pasivo</option>
            <option value="DECAIDO">Decaído</option>
            <option value="ALETARGADO">Aletargado</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Medicamentos Administrados *</label>
            <YesNoChips
              value={formData.medicamentos}
              onChange={(val) => handleChange('medicamentos', val)}
            />
          </div>
          
          {formData.medicamentos === 'SI' && (
            <div className="form-group">
              <label>¿Cuáles medicamentos?</label>
              <textarea
                value={formData.medicamentos_cual || ''}
                onChange={(e) => handleChange('medicamentos_cual', e.target.value)}
                placeholder="Listar medicamentos administrados"
                rows="3"
              />
            </div>
          )}
        </div>
      </div>

      {/* Examen Físico */}
      <div id="gatos-examen-fisico" className="form-section">
        <h3>Examen Físico</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Temperatura (°C)</label>
            <input
              type="text"
              value={formData.temperatura || ''}
              onChange={(e) => handleChange('temperatura', e.target.value)}
              placeholder="Ej: 38.5"
            />
          </div>
          
          <div className="form-group">
            <label>Pupilas</label>
            <select
              value={formData.pupilas || 'NORMAL'}
              onChange={(e) => handleChange('pupilas', e.target.value)}
            >
              <option value="NORMAL">Normal</option>
              <option value="DILATADAS">Dilatadas</option>
              <option value="CONTRAIDAS">Contraídas</option>
              <option value="ANISOCORIA">Anisocoria</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ganglios</label>
            <select
              value={formData.ganglios || 'normal'}
              onChange={(e) => handleChange('ganglios', e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="inflamados">Inflamados</option>
            </select>
          </div>
          
          {formData.ganglios === 'inflamados' && (
            <div className="form-group">
              <label>Región</label>
              <input
                type="text"
                value={formData.ganglios_region || ''}
                onChange={(e) => handleChange('ganglios_region', e.target.value)}
                placeholder="Región afectada"
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Retorno Venoso (seg)</label>
            <select
              value={formData.retorno_venoso || '2'}
              onChange={(e) => handleChange('retorno_venoso', e.target.value)}
            >
              <option value="1">1 segundo</option>
              <option value="2">2 segundos</option>
              <option value="3">3 segundos</option>
              <option value="4">4 segundos o más</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Hidratación</label>
            <select
              value={formData.hidratacion || 'buena'}
              onChange={(e) => handleChange('hidratacion', e.target.value)}
            >
              <option value="buena">Buena</option>
              <option value="media">Media</option>
              <option value="mala">Mala</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Mucosas</label>
            <select
              value={formData.mucosas || 'ROSADA'}
              onChange={(e) => handleChange('mucosas', e.target.value)}
            >
              <option value="ROSADA">Rosada</option>
              <option value="PALIDA">Pálida</option>
              <option value="AMARILLA">Amarilla</option>
              <option value="AZUL">Azul</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Frecuencia Cardíaca (lpm)</label>
            <input
              type="text"
              value={formData.frecuencia_cardiaca || ''}
              onChange={(e) => handleChange('frecuencia_cardiaca', e.target.value)}
              placeholder="Ej: 120"
            />
          </div>
          
          <div className="form-group">
            <label>Frecuencia Respiratoria (rpm)</label>
            <input
              type="text"
              value={formData.frecuencia_respiratoria || ''}
              onChange={(e) => handleChange('frecuencia_respiratoria', e.target.value)}
              placeholder="Ej: 30"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tos *</label>
            <select
              required
              value={formData.tos || 'NO'}
              onChange={(e) => handleChange('tos', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI_SECA">Sí - Seca</option>
              <option value="SI_PRODUCTIVA">Sí - Productiva</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Motilidad Intestinal</label>
            <select
              value={formData.motilidad_intestinal || 'NORMAL'}
              onChange={(e) => handleChange('motilidad_intestinal', e.target.value)}
            >
              <option value="NORMAL">Normal</option>
              <option value="AUSENTE">Ausente</option>
              <option value="AUMENTADA">Aumentada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Examen de Sensibilidad */}
      <div id="gatos-examen-sensibilidad" className="form-section">
        <h3>Examen de Sensibilidad</h3>
        
        <div className="form-group">
          <label>Sensibilidad Cutánea (Test pinchazo)</label>
          <select
            value={formData.sensibilidad_cutanea || 'normal'}
            onChange={(e) => handleChange('sensibilidad_cutanea', e.target.value)}
          >
            <option value="normal">Normal</option>
            <option value="gira_cabeza">Gira la cabeza</option>
            <option value="vocalizacion">Vocalización</option>
            <option value="aparta_extremidad">Aparta extremidad</option>
            <option value="hipersensibilidad">Hipersensibilidad</option>
            <option value="hiposensibilidad">Hiposensibilidad</option>
          </select>
        </div>

        <div className="form-group">
          <label>Sensibilidad Profunda (Propiocepción)</label>
          <select
            value={formData.sensibilidad_profunda || 'positiva'}
            onChange={(e) => handleChange('sensibilidad_profunda', e.target.value)}
          >
            <option value="positiva">Positiva</option>
            <option value="tardia">Tardía</option>
            <option value="sin_respuesta">Sin respuesta</option>
          </select>
        </div>
      </div>

        </div>
      </div>
    </div>
  );
};

export default GatosForm;
