import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';
import { useSpeciesFormI18n } from '../../hooks/useSpeciesFormI18n';
import { normalizePetSex } from '../../lib/petSex';

const GatosForm = ({ formData, setFormData }) => {
  const { t, field, placeholder, section, title, sex, reproductive, bodyCondition } =
    useSpeciesFormI18n('gatos');
  const sexo = normalizePetSex(formData.sexo);
  const [activeSection, setActiveSection] = useState('gatos-info-basica');

  const handleChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });
  };

  const toggleSection = useCallback((e) => {
    const sectionEl = e.target.closest('.form-section');
    if (sectionEl && e.target.tagName === 'H3') sectionEl.classList.toggle('collapsed');
  }, []);

  const requiredFields = [
    'fecha', 'nombre_mascota', 'especie', 'raza', 'sexo', 'edad', 'peso',
    'vacunas', 'desparasitacion', 'esterilizado', 'habitat', 'dieta',
    'temperatura', 'frecuencia_cardiaca', 'frecuencia_respiratoria'
  ];

  const progress = useMemo(() => {
    const filled = requiredFields.filter(f => formData[f] && formData[f] !== '').length;
    return Math.round((filled / requiredFields.length) * 100);
  }, [formData]);

  const sections = [
    { id: 'gatos-info-basica', labelKey: 'info_basica', icon: '📋' },
    { id: 'gatos-historial-medico', labelKey: 'historial_medico', icon: '📁' },
    { id: 'gatos-habitat-alimentacion', labelKey: 'habitat_alimentacion', icon: '🏠' },
    { id: 'gatos-aspecto-general', labelKey: 'aspecto_general', icon: '👀' },
    { id: 'gatos-historial-reportado', labelKey: 'historial_reportado', icon: '📝' },
    { id: 'gatos-alimentacion-reciente', labelKey: 'alimentacion_reciente', icon: '🥗' },
    { id: 'gatos-actividad', labelKey: 'actividad', icon: '💊' },
    { id: 'gatos-examen-fisico', labelKey: 'examen_fisico', icon: '🩺' },
    { id: 'gatos-examen-sensibilidad', labelKey: 'examen_sensibilidad', icon: '🔍' },
  ];

  useEffect(() => {
    const observers = [];
    const options = { root: null, rootMargin: '-20% 0px -70% 0px', threshold: 0 };
    sections.forEach(sec => {
      const element = document.getElementById(sec.id);
      if (element) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(sec.id); });
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

  const filledCount = requiredFields.filter(f => formData[f] && formData[f] !== '').length;

  return (
    <div className="species-form">
      <h2>{title('gatos')}</h2>

      <div className="species-form-progress">
        <div className="species-form-progress-header">
          <span className="species-form-progress-label">{t('chrome.progress')}</span>
          <span className="species-form-progress-percent">{progress}%</span>
        </div>
        <div className="species-form-progress-bar">
          <div className={`species-form-progress-fill ${progress === 100 ? 'complete' : ''}`} style={{ width: `${progress}%` }} />
        </div>
        <div className="species-form-progress-stats">
          <span>{t('chrome.fieldsCount', { filled: filledCount, total: requiredFields.length })}</span>
          {progress === 100 && <span style={{ color: '#10b981', fontWeight: 600 }}>✓ {t('chrome.complete')}</span>}
        </div>
      </div>
      
      <div className="species-form-layout">
        <aside className="species-form-nav">
          <div className="species-form-nav-title">{t('chrome.sections')}</div>
          <ul>
            {sections.map((sec) => (
              <li key={sec.id}>
                <button
                  type="button"
                  className={`species-form-nav-link ${activeSection === sec.id ? 'active' : ''}`}
                  onClick={() => scrollToSection(sec.id)}
                >
                  <span className="nav-icon">{sec.icon}</span> {sec.label || section(sec.labelKey)}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="species-form-content" onClick={toggleSection}>

      {/* Información Básica */}
      <div id="gatos-info-basica" className="form-section">
        <h3>{section('info_basica')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('fecha')}</label>
            <input
              type="date"
              required
              value={formData.fecha || ''}
              onChange={(e) => handleChange('fecha', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>{field('nombre_mascota')}</label>
            <input
              type="text"
              required
              value={formData.nombre_mascota || ''}
              onChange={(e) => handleChange('nombre_mascota', e.target.value)}
              placeholder={placeholder('nombre_mascota')}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('nombre_dueño')}</label>
            <input
              type="text"
              required
              value={formData.nombre_dueño || ''}
              onChange={(e) => handleChange('nombre_dueño', e.target.value)}
              placeholder={placeholder('nombre_dueño')}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('raza')}</label>
            <input
              type="text"
              required
              value={formData.raza || ''}
              onChange={(e) => handleChange('raza', e.target.value)}
              placeholder={placeholder('raza_gato')}
            />
          </div>
          
          <div className="form-group">
            <label>{field('mix')}</label>
            <input
              type="text"
              value={formData.mix || ''}
              onChange={(e) => handleChange('mix', e.target.value)}
              placeholder={placeholder('mix')}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('edad')}</label>
            <input
              type="text"
              required
              value={formData.edad || ''}
              onChange={(e) => handleChange('edad', e.target.value)}
              placeholder={placeholder('edad')}
            />
          </div>
          
          <div className="form-group">
            <label>{field('peso')}</label>
            <input
              type="text"
              required
              value={formData.peso || ''}
              onChange={(e) => handleChange('peso', e.target.value)}
              placeholder={placeholder('peso')}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('condicion_corporal')}</label>
            <select
              required
              value={formData.condicion_corporal || '3'}
              onChange={(e) => handleChange('condicion_corporal', e.target.value)}
            >
              <option value="1">{bodyCondition('1')}</option>
              <option value="2">{bodyCondition('2')}</option>
              <option value="3">{bodyCondition('3')}</option>
              <option value="4">{bodyCondition('4')}</option>
              <option value="5">{bodyCondition('5')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('sexo')}</label>
            <select
              required
              value={sexo || ''}
              onChange={(e) => handleChange('sexo', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="hembra">{sex('hembra')}</option>
              <option value="macho">{sex('macho')}</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>{field('estado_reproductivo')}</label>
            <select
              required
              value={formData.estado_reproductivo || ''}
              onChange={(e) => handleChange('estado_reproductivo', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="entero">{reproductive('entero')}</option>
              <option value="castrado">{reproductive('castrado')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Historial Médico */}
      <div id="gatos-historial-medico" className="form-section">
        <h3>{section('historial_medico')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('vacunas_vigentes')}</label>
            <select
              required
              value={formData.vacunas_vigentes || ''}
              onChange={(e) => handleChange('vacunas_vigentes', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </select>
          </div>
          
          {formData.vacunas_vigentes === 'SI' && (
            <div className="form-group">
              <label>{field('vacunas_cual')}</label>
              <input
                type="text"
                value={formData.vacunas_cual || ''}
                onChange={(e) => handleChange('vacunas_cual', e.target.value)}
                placeholder={placeholder('vacunas_cual')}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('desparasitacion_interna')}</label>
            <select
              required
              value={formData.desparasitacion_interna || ''}
              onChange={(e) => handleChange('desparasitacion_interna', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </select>
          </div>
          
          {formData.desparasitacion_interna === 'SI' && (
            <div className="form-group">
              <label>{field('cual_producto')}</label>
              <input
                type="text"
                value={formData.desparasitacion_interna_cual || ''}
                onChange={(e) => handleChange('desparasitacion_interna_cual', e.target.value)}
                placeholder={placeholder('producto')}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('desparasitacion_externa')}</label>
            <select
              required
              value={formData.desparasitacion_externa || ''}
              onChange={(e) => handleChange('desparasitacion_externa', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </select>
          </div>
          
          {formData.desparasitacion_externa === 'SI' && (
            <>
              <div className="form-group">
                <label>{field('producto')}</label>
                <input
                  type="text"
                  value={formData.desparasitacion_externa_producto || ''}
                  onChange={(e) => handleChange('desparasitacion_externa_producto', e.target.value)}
                  placeholder={placeholder('producto')}
                />
              </div>
              <div className="form-group">
                <label>{field('fecha_simple')}</label>
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
            <label>{field('cirugias_previas')}</label>
            <select
              required
              value={formData.cirugias_previas || ''}
              onChange={(e) => handleChange('cirugias_previas', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </select>
          </div>
          
          {formData.cirugias_previas === 'SI' && (
            <div className="form-group">
              <label>{field('cirugias_cual')}</label>
              <input
                type="text"
                value={formData.cirugias_cual || ''}
                onChange={(e) => handleChange('cirugias_cual', e.target.value)}
                placeholder={placeholder('cirugia')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Hábitat y Alimentación */}
      <div id="gatos-habitat-alimentacion" className="form-section">
        <h3>{section('habitat_alimentacion')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('habitat')}</label>
            <select
              required
              value={formData.habitat || ''}
              onChange={(e) => handleChange('habitat', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="INTERIOR">{t('options.habitat_interior')}</option>
              <option value="EXTERIOR">{t('options.habitat_exterior')}</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>{field('zona_geografica')}</label>
            <input
              type="text"
              required
              value={formData.zona_geografica || ''}
              onChange={(e) => handleChange('zona_geografica', e.target.value)}
              placeholder={placeholder('zona')}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('alimentacion_seco')}</label>
            <input
              type="text"
              value={formData.alimentacion_seco || ''}
              onChange={(e) => handleChange('alimentacion_seco', e.target.value)}
              placeholder={placeholder('alimento_seco')}
            />
          </div>
          
          <div className="form-group">
            <label>{field('alimentacion_humedo')}</label>
            <input
              type="text"
              value={formData.alimentacion_humedo || ''}
              onChange={(e) => handleChange('alimentacion_humedo', e.target.value)}
              placeholder={placeholder('alimento_humedo')}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('alimentacion_casera')}</label>
            <input
              type="text"
              value={formData.alimentacion_casero || ''}
              onChange={(e) => handleChange('alimentacion_casero', e.target.value)}
              placeholder={placeholder('alimento_casero')}
            />
          </div>
          
          <div className="form-group">
            <label>{field('alimentacion_frecuencia')}</label>
            <input
              type="text"
              value={formData.alimentacion_frecuencia || ''}
              onChange={(e) => handleChange('alimentacion_frecuencia', e.target.value)}
              placeholder={placeholder('frecuencia_comida')}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('paseos')}</label>
            <select
              required
              value={formData.paseos || ''}
              onChange={(e) => handleChange('paseos', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </select>
          </div>
          
          {formData.paseos === 'SI' && (
            <div className="form-group">
              <label>{field('paseos_frecuencia')}</label>
              <input
                type="text"
                value={formData.paseos_frecuencia || ''}
                onChange={(e) => handleChange('paseos_frecuencia', e.target.value)}
                placeholder={placeholder('frecuencia_paseos')}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('banos_estetica')}</label>
            <select
              required
              value={formData.baños_estetica || ''}
              onChange={(e) => handleChange('baños_estetica', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </select>
          </div>
          
          {formData.baños_estetica === 'SI' && (
            <div className="form-group">
              <label>{field('fecha_simple')}</label>
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
        <h3>{section('aspecto_general')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('pelaje')}</label>
            <input
              type="text"
              value={formData.aspecto_pelaje || ''}
              onChange={(e) => handleChange('aspecto_pelaje', e.target.value)}
              placeholder={placeholder('pelaje')}
            />
          </div>
          
          <div className="form-group">
            <label>{field('piel')}</label>
            <input
              type="text"
              value={formData.aspecto_piel || ''}
              onChange={(e) => handleChange('aspecto_piel', e.target.value)}
              placeholder={placeholder('piel')}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('oidos')}</label>
            <input
              type="text"
              value={formData.aspecto_oidos || ''}
              onChange={(e) => handleChange('aspecto_oidos', e.target.value)}
              placeholder={placeholder('oidos')}
            />
          </div>
          
          <div className="form-group">
            <label>{field('ojos')}</label>
            <input
              type="text"
              value={formData.aspecto_ojos || ''}
              onChange={(e) => handleChange('aspecto_ojos', e.target.value)}
              placeholder={placeholder('ojos')}
            />
          </div>
        </div>

        <div className="form-group">
          <label>{field('otros')}</label>
          <textarea
            value={formData.aspecto_otros || ''}
            onChange={(e) => handleChange('aspecto_otros', e.target.value)}
            placeholder={placeholder('otros_aspecto')}
            rows="3"
          />
        </div>
      </div>

      {/* Historial Reportado */}
      <div id="gatos-historial-reportado" className="form-section">
        <h3>{section('historial_reportado')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('vomito')}</label>
            <YesNoChips
              value={formData.vomito}
              onChange={(val) => handleChange('vomito', val)}
            />
          </div>
          
          {formData.vomito === 'SI' && (
            <>
              <div className="form-group">
                <label>{field('color')}</label>
                <input
                  type="text"
                  value={formData.vomito_color || ''}
                  onChange={(e) => handleChange('vomito_color', e.target.value)}
                  placeholder={placeholder('color_vomito')}
                />
              </div>
              <div className="form-group">
                <label>{field('aspecto')}</label>
                <input
                  type="text"
                  value={formData.vomito_aspecto || ''}
                  onChange={(e) => handleChange('vomito_aspecto', e.target.value)}
                  placeholder={placeholder('aspecto_vomito')}
                />
              </div>
            </>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('diarrea')}</label>
            <YesNoChips
              value={formData.diarrea}
              onChange={(val) => handleChange('diarrea', val)}
            />
          </div>
          
          {formData.diarrea === 'SI' && (
            <>
              <div className="form-group">
                <label>{field('color')}</label>
                <input
                  type="text"
                  value={formData.diarrea_color || ''}
                  onChange={(e) => handleChange('diarrea_color', e.target.value)}
                  placeholder={placeholder('color_diarrea')}
                />
              </div>
              <div className="form-group">
                <label>{field('aspecto')}</label>
                <input
                  type="text"
                  value={formData.diarrea_aspecto || ''}
                  onChange={(e) => handleChange('diarrea_aspecto', e.target.value)}
                  placeholder={placeholder('aspecto_diarrea')}
                />
              </div>
            </>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('orina')}</label>
            <YesNoChips
              value={formData.orina}
              onChange={(val) => handleChange('orina', val)}
            />
          </div>
          
          {formData.orina === 'SI' && (
            <>
              <div className="form-group">
                <label>{field('color')}</label>
                <input
                  type="text"
                  value={formData.orina_color || ''}
                  onChange={(e) => handleChange('orina_color', e.target.value)}
                  placeholder={placeholder('color_orina')}
                />
              </div>
              <div className="form-group">
                <label>{field('olor')}</label>
                <input
                  type="text"
                  value={formData.orina_olor || ''}
                  onChange={(e) => handleChange('orina_olor', e.target.value)}
                  placeholder={placeholder('olor_orina')}
                />
              </div>
            </>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('secrecion_nasal')}</label>
            <YesNoChips
              value={formData.secrecion_nasal}
              onChange={(val) => handleChange('secrecion_nasal', val)}
            />
          </div>
          
          {formData.secrecion_nasal === 'SI' && (
            <>
              <div className="form-group">
                <label>{field('color')}</label>
                <input
                  type="text"
                  value={formData.secrecion_nasal_color || ''}
                  onChange={(e) => handleChange('secrecion_nasal_color', e.target.value)}
                  placeholder={placeholder('color_secrecion')}
                />
              </div>
              <div className="form-group">
                <label>{field('aspecto')}</label>
                <input
                  type="text"
                  value={formData.secrecion_nasal_aspecto || ''}
                  onChange={(e) => handleChange('secrecion_nasal_aspecto', e.target.value)}
                  placeholder={placeholder('aspecto_secrecion')}
                />
              </div>
            </>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('secrecion_ocular')}</label>
            <YesNoChips
              value={formData.secrecion_ocular}
              onChange={(val) => handleChange('secrecion_ocular', val)}
            />
          </div>
          
          {formData.secrecion_ocular === 'SI' && (
            <div className="form-group">
              <label>{field('color')}</label>
              <input
                type="text"
                value={formData.secrecion_ocular_color || ''}
                onChange={(e) => handleChange('secrecion_ocular_color', e.target.value)}
                placeholder={placeholder('color_secrecion')}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('dientes')}</label>
            <select
              required
              value={formData.dientes || 'limpios'}
              onChange={(e) => handleChange('dientes', e.target.value)}
            >
              <option value="limpios">{t('options.ganglios_limpios')}</option>
              <option value="placas">{t('options.dientes_placas')}</option>
              <option value="gingivitis">{t('options.dientes_gingivitis')}</option>
              <option value="periodontitis">{t('options.dientes_periodontitis')}</option>
              <option value="otros">{t('options.otros')}</option>
            </select>
          </div>
          
          {formData.dientes === 'otros' && (
            <div className="form-group">
              <label>{field('especificar')}</label>
              <input
                type="text"
                value={formData.dientes_otros || ''}
                onChange={(e) => handleChange('dientes_otros', e.target.value)}
                placeholder={placeholder('dientes')}
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>{field('condicion_piel')}</label>
          <select
            required
            value={formData.piel_condicion || 'normal'}
            onChange={(e) => handleChange('piel_condicion', e.target.value)}
          >
            <option value="normal">{t('options.normal')}</option>
            <option value="dermatitis">{t('options.piel_dermatitis')}</option>
            <option value="pulgas">{t('options.piel_pulgas')}</option>
            <option value="tumores">{t('options.piel_tumores')}</option>
            <option value="abscesos">{t('options.dientes_abscesos')}</option>
          </select>
        </div>
      </div>

      {/* Alimentación Reciente */}
      <div id="gatos-alimentacion-reciente" className="form-section">
        <h3>{section('alimentacion_reciente')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('ultima_comida')}</label>
            <input
              type="text"
              value={formData.ultima_comida || ''}
              onChange={(e) => handleChange('ultima_comida', e.target.value)}
              placeholder={placeholder('ultima_comida')}
            />
          </div>
          
          <div className="form-group">
            <label>{field('fecha_hora')}</label>
            <input
              type="datetime-local"
              value={formData.ultima_comida_fecha || ''}
              onChange={(e) => handleChange('ultima_comida_fecha', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('consumo_liquidos')}</label>
            <select
              required
              value={formData.liquidos || ''}
              onChange={(e) => handleChange('liquidos', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </select>
          </div>
          
          {formData.liquidos === 'SI' && (
            <div className="form-group">
              <label>{field('cantidad')}</label>
              <input
                type="text"
                value={formData.liquidos_cantidad || ''}
                onChange={(e) => handleChange('liquidos_cantidad', e.target.value)}
                placeholder={placeholder('motilidad')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Actividad y Medicamentos */}
      <div id="gatos-actividad" className="form-section">
        <h3>{section('actividad')}</h3>
        
        <div className="form-group">
          <label>{field('actividad_general')}</label>
          <select
            required
            value={formData.actividad_general || 'ACTIVO'}
            onChange={(e) => handleChange('actividad_general', e.target.value)}
          >
            <option value="ACTIVO">{t('options.actividad_activo')}</option>
            <option value="PASIVO">{t('options.actividad_pasivo')}</option>
            <option value="DECAIDO">{t('options.actividad_decaido')}</option>
            <option value="ALETARGADO">{t('options.actividad_aletargado')}</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('medicamentos')}</label>
            <YesNoChips
              value={formData.medicamentos}
              onChange={(val) => handleChange('medicamentos', val)}
            />
          </div>
          
          {formData.medicamentos === 'SI' && (
            <div className="form-group">
              <label>{field('medicamentos_cual')}</label>
              <textarea
                value={formData.medicamentos_cual || ''}
                onChange={(e) => handleChange('medicamentos_cual', e.target.value)}
                placeholder={placeholder('medicamentos')}
                rows="3"
              />
            </div>
          )}
        </div>
      </div>

      {/* Examen Físico */}
      <div id="gatos-examen-fisico" className="form-section">
        <h3>{section('examen_fisico')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('temperatura')}</label>
            <input
              type="text"
              value={formData.temperatura || ''}
              onChange={(e) => handleChange('temperatura', e.target.value)}
              placeholder={placeholder('temp')}
            />
          </div>
          
          <div className="form-group">
            <label>{field('pupilas')}</label>
            <select
              value={formData.pupilas || 'NORMAL'}
              onChange={(e) => handleChange('pupilas', e.target.value)}
            >
              <option value="NORMAL">{t('options.normal')}</option>
              <option value="DILATADAS">{t('options.pupilas_dilatadas')}</option>
              <option value="CONTRAIDAS">{t('options.pupilas_contraidas')}</option>
              <option value="ANISOCORIA">{t('options.pupilas_anisocoria')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('ganglios')}</label>
            <select
              value={formData.ganglios || 'normal'}
              onChange={(e) => handleChange('ganglios', e.target.value)}
            >
              <option value="normal">{t('options.normal')}</option>
              <option value="inflamados">{t('options.ganglios_inflamados')}</option>
            </select>
          </div>
          
          {formData.ganglios === 'inflamados' && (
            <div className="form-group">
              <label>{field('region')}</label>
              <input
                type="text"
                value={formData.ganglios_region || ''}
                onChange={(e) => handleChange('ganglios_region', e.target.value)}
                placeholder={placeholder('region')}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('retorno_venoso')}</label>
            <select
              value={formData.retorno_venoso || '2'}
              onChange={(e) => handleChange('retorno_venoso', e.target.value)}
            >
              <option value="1">{t('options.retorno_1')}</option>
              <option value="2">{t('options.retorno_2')}</option>
              <option value="3">{t('options.retorno_3')}</option>
              <option value="4">{t('options.retorno_4')}</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>{field('hidratacion')}</label>
            <select
              value={formData.hidratacion || 'buena'}
              onChange={(e) => handleChange('hidratacion', e.target.value)}
            >
              <option value="buena">{t('options.buena')}</option>
              <option value="media">{t('options.media')}</option>
              <option value="mala">{t('options.mala')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('mucosas')}</label>
            <select
              value={formData.mucosas || 'ROSADA'}
              onChange={(e) => handleChange('mucosas', e.target.value)}
            >
              <option value="ROSADA">{t('options.mucosas_rosada')}</option>
              <option value="PALIDA">{t('options.mucosas_palida')}</option>
              <option value="AMARILLA">{t('options.mucosas_amarilla')}</option>
              <option value="AZUL">{t('options.mucosas_azul')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('frecuencia_cardiaca')}</label>
            <input
              type="text"
              value={formData.frecuencia_cardiaca || ''}
              onChange={(e) => handleChange('frecuencia_cardiaca', e.target.value)}
              placeholder={placeholder('fc')}
            />
          </div>
          
          <div className="form-group">
            <label>{field('frecuencia_respiratoria')}</label>
            <input
              type="text"
              value={formData.frecuencia_respiratoria || ''}
              onChange={(e) => handleChange('frecuencia_respiratoria', e.target.value)}
              placeholder={placeholder('fr')}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('tos')}</label>
            <select
              required
              value={formData.tos || 'NO'}
              onChange={(e) => handleChange('tos', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI_SECA">{t('options.tos_seca')}</option>
              <option value="SI_PRODUCTIVA">{t('options.tos_productiva')}</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>{field('motilidad_intestinal')}</label>
            <select
              value={formData.motilidad_intestinal || 'NORMAL'}
              onChange={(e) => handleChange('motilidad_intestinal', e.target.value)}
            >
              <option value="NORMAL">{t('options.normal')}</option>
              <option value="AUSENTE">{t('options.ausente')}</option>
              <option value="AUMENTADA">{t('options.aumentada')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Examen de Sensibilidad */}
      <div id="gatos-examen-sensibilidad" className="form-section">
        <h3>{section('examen_sensibilidad')}</h3>
        
        <div className="form-group">
          <label>{field('sensibilidad_cutanea')}</label>
          <select
            value={formData.sensibilidad_cutanea || 'normal'}
            onChange={(e) => handleChange('sensibilidad_cutanea', e.target.value)}
          >
            <option value="normal">{t('options.normal')}</option>
            <option value="gira_cabeza">{t('options.prop_gira')}</option>
            <option value="vocalizacion">{t('options.prop_vocal')}</option>
            <option value="aparta_extremidad">{t('options.prop_aparta')}</option>
            <option value="hipersensibilidad">{t('options.sens_hiper')}</option>
            <option value="hiposensibilidad">{t('options.sens_hipo')}</option>
          </select>
        </div>

        <div className="form-group">
          <label>{field('sensibilidad_profunda')}</label>
          <select
            value={formData.sensibilidad_profunda || 'positiva'}
            onChange={(e) => handleChange('sensibilidad_profunda', e.target.value)}
          >
            <option value="positiva">{t('options.sens_positiva')}</option>
            <option value="tardia">{t('options.prop_tardia')}</option>
            <option value="sin_respuesta">{t('options.sens_sin')}</option>
          </select>
        </div>
      </div>

        </div>
      </div>
    </div>
  );
};

export default GatosForm;
