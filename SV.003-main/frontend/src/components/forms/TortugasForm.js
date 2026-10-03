import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';
import { useSpeciesFormI18n } from '../../hooks/useSpeciesFormI18n';
import { normalizePetSex } from '../../lib/petSex';
import ReproductiveSexHint from './ReproductiveSexHint';
import { FormCombobox } from "../../components/ui/combobox";

const TortugasForm = ({ formData, setFormData }) => {
  const { t, field, placeholder, section, title } = useSpeciesFormI18n('tortugas');
  const sexo = normalizePetSex(formData.sexo);
  const [activeSection, setActiveSection] = useState('tortugas-info-basica');

  const handleChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });
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
    { id: 'tortugas-info-basica', labelKey: 'info_basica', icon: '📋' },
    { id: 'tortugas-respiratorio', labelKey: 'respiratorio', icon: '🫁' },
    { id: 'tortugas-tegumentario', label: 'Sistema Tegumentario', icon: '🐢' },
    { id: 'tortugas-digestivo', labelKey: 'digestivo', icon: '🫃' },
    { id: 'tortugas-neurologico', labelKey: 'neurologico', icon: '🧠' },
    { id: 'tortugas-comportamiento', labelKey: 'comportamiento', icon: '👀' },
    { id: 'tortugas-reproductivo', labelKey: 'reproductivo', icon: '🥚' },
    { id: 'tortugas-alimentacion', labelKey: 'alimentacion', icon: '🥗' },
    { id: 'tortugas-ambiente', labelKey: 'ambiente', icon: '🏠' },
    { id: 'tortugas-socializacion', label: 'Socialización', icon: '🤝' },
    { id: 'tortugas-historial', label: 'Historia Médica Previa', icon: '📁' },
    { id: 'tortugas-examen', labelKey: 'examen_fisico', icon: '🩺' },
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
      <h2>{title('tortugas')}</h2>

      <div className="species-form-progress">
        <div className="species-form-progress-header">
          <span className="species-form-progress-label">{t('chrome.progress')}</span>
          <span className="species-form-progress-percent">{progress}%</span>
        </div>
        <div className="species-form-progress-bar">
          <div className={`species-form-progress-fill ${progress === 100 ? 'complete' : ''}`} style={{ width: `${progress}%` }} />
        </div>
        <div className="species-form-progress-stats">
          <span>{t('chrome.fieldsCount', { filled: requiredFields.filter(f => formData[f] && formData[f] !== '').length, total: requiredFields.length })}</span>
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
      <div id="tortugas-info-basica" className="form-section">
        <h3>{section('info_basica')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('nombre_de_la_mascota')}</label>
            <input
              type="text"
              required
              value={formData.nombre_mascota || ''}
              onChange={(e) => handleChange('nombre_mascota', e.target.value)}
              placeholder={placeholder('nombre')}
            />
          </div>
          
          <div className="form-group">
            <label>{field('nombre_dueño')}</label>
            <input
              type="text"
              required
              value={formData.nombre_dueño || ''}
              onChange={(e) => handleChange('nombre_dueño', e.target.value)}
              placeholder={placeholder('nombre_del_propietario')}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('especie_exacta')}</label>
            <input
              type="text"
              required
              value={formData.especie_exacta || ''}
              onChange={(e) => handleChange('especie_exacta', e.target.value)}
              placeholder={placeholder('ej_testudo_graeca_chelonoidis_carbonaria')}
            />
          </div>
          
          <div className="form-group">
            <label>{field('subespecie_variante')}</label>
            <input
              type="text"
              value={formData.subespecie || ''}
              onChange={(e) => handleChange('subespecie', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('edad_estimada_anos')}</label>
            <input
              type="text"
              required
              value={formData.edad || ''}
              onChange={(e) => handleChange('edad', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>{field('sexo')}</label>
            <FormCombobox
              required
              value={sexo || ''}
              onChange={(e) => handleChange('sexo', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="macho">{t('options.macho')}</option>
              <option value="hembra">{t('options.hembra')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('peso_actual_g_kg')}</label>
            <input
              type="text"
              required
              value={formData.peso || ''}
              onChange={(e) => handleChange('peso', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>{field('condicion_corporal_2')}</label>
            <FormCombobox
              required
              value={formData.condicion_corporal || ''}
              onChange={(e) => handleChange('condicion_corporal', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="emaciado">{t('options.emaciado')}</option>
              <option value="delgado">{t('options.delgado')}</option>
              <option value="ideal">{t('options.ideal')}</option>
              <option value="sobrepeso">{t('options.sobrepeso')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('tamano_caparazon_cm')}</label>
            <input
              type="text"
              required
              value={formData.tamano_caparazon || ''}
              onChange={(e) => handleChange('tamano_caparazon', e.target.value)}
              placeholder={placeholder('largo_x_ancho_x_alto')}
            />
          </div>
          
          <div className="form-group">
            <label>{field('origen')}</label>
            <FormCombobox
              required
              value={formData.origen || ''}
              onChange={(e) => handleChange('origen', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="silvestre">{t('options.silvestre')}</option>
              <option value="criadero">{t('options.criadero')}</option>
              <option value="comercial">{t('options.comercial')}</option>
              <option value="regalo">{t('options.regalo')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-group">
          <label>{field('duracion_del_problema')}</label>
          <FormCombobox
            required
            value={formData.duracion_problema || ''}
            onChange={(e) => handleChange('duracion_problema', e.target.value)}
          >
            <option value="">{t('select')}</option>
            <option value="<12h">{t('options.lt_12_horas')}</option>
            <option value="12-24h">{t('options.n_12_24_horas')}</option>
            <option value="2-3dias">{t('options.n_2_3_dias')}</option>
            <option value="4-7dias">{t('options.n_4_7_dias')}</option>
            <option value=">1semana">{t('options.gt_1_semana')}</option>
          </FormCombobox>
        </div>
      </div>

      {/* Sistema Respiratorio */}
      <div id="tortugas-respiratorio" className="form-section">
        <h3>{section('respiratorio')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('secrecion_nasal_oral')}</label>
            <FormCombobox
              required
              value={formData.secrecion_nasal || 'NO'}
              onChange={(e) => handleChange('secrecion_nasal', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="clara">{t('options.clara')}</option>
              <option value="mucosa">{t('options.mucosa')}</option>
              <option value="purulenta">{t('options.purulenta')}</option>
              <option value="sangre">{t('options.sangre')}</option>
            </FormCombobox>
          </div>
          
          {formData.secrecion_nasal !== 'NO' && (
            <div className="form-group">
              <label>{field('localizacion')}</label>
              <FormCombobox
                value={formData.secrecion_localizacion || ''}
                onChange={(e) => handleChange('secrecion_localizacion', e.target.value)}
              >
                <option value="">{t('select')}</option>
                <option value="unilateral">{t('options.unilateral')}</option>
                <option value="bilateral">{t('options.bilateral')}</option>
              </FormCombobox>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('burbujas_en_boca_nariz')}</label>
            <FormCombobox
              required
              value={formData.burbujas || 'NO'}
              onChange={(e) => handleChange('burbujas', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
          
          <div className="form-group">
            <label>{field('dificultad_respiratoria')}</label>
            <FormCombobox
              required
              value={formData.dificultad_respiratoria || 'NO'}
              onChange={(e) => handleChange('dificultad_respiratoria', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="boca_abierta">{t('options.boca_abierta')}</option>
              <option value="movimiento_cuello">{t('options.movimiento_cuello_exagerado')}</option>
              <option value="aleteo">{t('options.aleteo_rapido')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('temperatura_ambiente_c_2')}</label>
            <input
              type="text"
              value={formData.temp_ambiente || ''}
              onChange={(e) => handleChange('temp_ambiente', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>{field('tiene_calentador')}</label>
            <FormCombobox
              required
              value={formData.tiene_calentador || ''}
              onChange={(e) => handleChange('tiene_calentador', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </FormCombobox>
          </div>
        </div>
      </div>

      {/* Sistema Tegumentario */}
      <div id="tortugas-tegumentario" className="form-section">
        <h3>Sistema Tegumentario/Caparazón</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('estado_del_caparazon')}</label>
            <FormCombobox
              required
              value={formData.caparazon || 'normal'}
              onChange={(e) => handleChange('caparazon', e.target.value)}
            >
              <option value="normal">{t('options.normal')}</option>
              <option value="blandeza">{t('options.blandeza_ablandamiento')}</option>
              <option value="manchas_blancas">{t('options.manchas_blancas')}</option>
              <option value="manchas_oscuras">{t('options.manchas_oscuras')}</option>
              <option value="deformidad">{t('options.deformidad')}</option>
            </FormCombobox>
          </div>
          
          <div className="form-group">
            <label>{field('localizacion')}</label>
            <FormCombobox
              value={formData.caparazon_localizacion || ''}
              onChange={(e) => handleChange('caparazon_localizacion', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="plastron">{t('options.plastron')}</option>
              <option value="caparazon">{t('options.caparazon')}</option>
              <option value="marginales">{t('options.marginales')}</option>
              <option value="ambos">{t('options.ambos')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('hundimiento_o_abombamiento')}</label>
            <FormCombobox
              required
              value={formData.hundimiento || 'NO'}
              onChange={(e) => handleChange('hundimiento', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
          
          <div className="form-group">
            <label>{field('olor_fetido')}</label>
            <FormCombobox
              required
              value={formData.olor_fetido || 'NO'}
              onChange={(e) => handleChange('olor_fetido', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('estado_de_la_piel')}</label>
            <FormCombobox
              required
              value={formData.piel || 'normal'}
              onChange={(e) => handleChange('piel', e.target.value)}
            >
              <option value="normal">{t('options.normal')}</option>
              <option value="descamacion">{t('options.descamacion_excesiva')}</option>
              <option value="costras">{t('options.costras')}</option>
              <option value="ulceras">{t('options.ulceras')}</option>
              <option value="hinchazon">{t('options.hinchazon')}</option>
            </FormCombobox>
          </div>
          
          <div className="form-group">
            <label>{field('edema_en_parpados')}</label>
            <FormCombobox
              required
              value={formData.edema_parpados || 'NO'}
              onChange={(e) => handleChange('edema_parpados', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('estado_de_los_ojos')}</label>
            <FormCombobox
              required
              value={formData.ojos || 'normal'}
              onChange={(e) => handleChange('ojos', e.target.value)}
            >
              <option value="normal">{t('options.normal')}</option>
              <option value="cerrados">{t('options.cerrados')}</option>
              <option value="hinchados">{t('options.hinchados')}</option>
              <option value="secrecion">{t('options.secrecion')}</option>
              <option value="opacidad">{t('options.opacidad_corneal')}</option>
            </FormCombobox>
          </div>
        </div>
      </div>

      {/* Sistema Digestivo */}
      <div id="tortugas-digestivo" className="form-section">
        <h3>{section('digestivo')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('apetito')}</label>
            <FormCombobox
              required
              value={formData.apetito || 'normal'}
              onChange={(e) => handleChange('apetito', e.target.value)}
            >
              <option value="normal">{t('options.normal')}</option>
              <option value="anorexia_total">{t('options.anorexia_total_gt_48h')}</option>
              <option value="anorexia_parcial">{t('options.anorexia_parcial')}</option>
            </FormCombobox>
          </div>
          
          {(formData.apetito === 'anorexia_total' || formData.apetito === 'anorexia_parcial') && (
            <div className="form-group">
              <label>{field('tiempo_sin_comer_horas_dias')}</label>
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
            <label>{field('come_fruta')}</label>
            <FormCombobox
              required
              value={formData.come_fruta || ''}
              onChange={(e) => handleChange('come_fruta', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </FormCombobox>
          </div>
          
          <div className="form-group">
            <label>{field('tiene_calcio_suplementado')}</label>
            <FormCombobox
              required
              value={formData.calcio_suplementado || ''}
              onChange={(e) => handleChange('calcio_suplementado', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('heces')}</label>
            <FormCombobox
              required
              value={formData.heces || 'normal'}
              onChange={(e) => handleChange('heces', e.target.value)}
            >
              <option value="normal">{t('options.normal')}</option>
              <option value="ausentes">{t('options.ausentes_gt_72h')}</option>
              <option value="blandas">{t('options.blandas')}</option>
              <option value="liquidas">{t('options.liquidas')}</option>
              <option value="con_sangre">{t('options.con_sangre')}</option>
              <option value="con_parasitos">{t('options.con_parasitos')}</option>
            </FormCombobox>
          </div>
          
          <div className="form-group">
            <label>{field('frecuencia_veces_semana')}</label>
            <input
              type="text"
              value={formData.heces_frecuencia || ''}
              onChange={(e) => handleChange('heces_frecuencia', e.target.value)}
              placeholder={placeholder('normal_1_7_segun_especie_temperatura')}
            />
          </div>
        </div>
  
        <div className="form-row">
          <div className="form-group">
            <label>{field('deshidratacion')}</label>
            <FormCombobox
              required
              value={formData.deshidratacion || 'NO'}
              onChange={(e) => handleChange('deshidratacion', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('options.si_piel_no_vuelve_al_pinchar')}</option>
            </FormCombobox>
          </div>
        </div>
      </div>

      <div id="tortugas-neurologico" className="form-section">
        <h3>{section('neurologico')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('inestabilidad_2')}</label>
            <FormCombobox
              required
              value={formData.inestabilidad || 'NO'}
              onChange={(e) => handleChange('inestabilidad', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="temblor_extremidades">{t('options.temblor_en_extremidades')}</option>
              <option value="caidas_laterales">{t('options.caidas_laterales')}</option>
              <option value="no_mantiene_derecho">{t('options.no_puede_mantenerse_derecho')}</option>
            </FormCombobox>
          </div>

          <div className="form-group">
            <label>{field('progresion_2')}</label>
            <FormCombobox
              required
              value={formData.progresion || 'NO'}
              onChange={(e) => handleChange('progresion', e.target.value)}
            >
              <option value="NO">{t('options.no_aplica_desconocido')}</option>
              <option value="lenta">{t('options.lenta_meses')}</option>
              <option value="rapida">{t('options.rapida_semanas')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('convulsiones_2')}</label>
            <FormCombobox
              required
              value={formData.convulsiones || 'NO'}
              onChange={(e) => handleChange('convulsiones', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="temblor_generalizado">{t('options.temblor_generalizado')}</option>
              <option value="focales">{t('options.convulsiones_focales')}</option>
              <option value="generalizadas">{t('options.convulsiones_generalizadas')}</option>
            </FormCombobox>
          </div>

          <div className="form-group">
            <label>{field('desencadenantes')}</label>
            <FormCombobox
              value={formData.desencadenantes || ''}
              onChange={(e) => handleChange('desencadenantes', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="estres">{t('options.estres')}</option>
              <option value="manipulacion">{t('options.manipulacion')}</option>
              <option value="ninguno">{t('options.ninguno')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('letargo_extremo_2')}</label>
            <FormCombobox
              required
              value={formData.letargo || 'NO'}
              onChange={(e) => handleChange('letargo', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="no_se_mueve">{t('options.no_se_mueve')}</option>
              <option value="no_responde">{t('options.no_responde_a_estimulos')}</option>
              <option value="hipotermia">{t('options.hipotermia')}</option>
            </FormCombobox>
          </div>

          <div className="form-group">
            <label>{field('temperatura_corporal_c')}</label>
            <input
              type="text"
              value={formData.temperatura_corporal || ''}
              onChange={(e) => handleChange('temperatura_corporal', e.target.value)}
              placeholder={placeholder('normal_similar_a_ambiente')}
            />
          </div>
        </div>
      </div>

      <div id="tortugas-comportamiento" className="form-section">
        <h3>{section('comportamiento')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('actividad_diurna_nocturna')}</label>
            <FormCombobox
              required
              value={formData.actividad || 'normal'}
              onChange={(e) => handleChange('actividad', e.target.value)}
            >
              <option value="hiperactivo">{t('options.hiperactivo')}</option>
              <option value="normal">{t('options.normal')}</option>
              <option value="letargico">{t('options.letargico')}</option>
              <option value="inactivo">{t('options.inactivo')}</option>
            </FormCombobox>
          </div>

          <div className="form-group">
            <label>{field('cambio_en_patron_de_actividad')}</label>
            <FormCombobox
              required
              value={formData.cambio_actividad || 'NO'}
              onChange={(e) => handleChange('cambio_actividad', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('interaccion_ambiental')}</label>
            <FormCombobox
              value={formData.interaccion_ambiental || ''}
              onChange={(e) => handleChange('interaccion_ambiental', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="evita_zona_caliente">{t('options.evita_zona_caliente')}</option>
              <option value="evita_zona_fria">{t('options.evita_zona_fria')}</option>
              <option value="no_usa_escondites">{t('options.no_usa_escondites')}</option>
            </FormCombobox>
          </div>

          <div className="form-group">
            <label>{field('dificultad_para_nadar')}</label>
            <FormCombobox
              value={formData.dificultad_nado || ''}
              onChange={(e) => handleChange('dificultad_nado', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="dificultad_sumergirse">{t('options.dificultad_para_sumergirse')}</option>
              <option value="flota_lateralmente">{t('options.flota_lateralmente')}</option>
              <option value="no_nada">{t('options.no_nada')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('dificultad_para_hundirse')}</label>
            <FormCombobox
              value={formData.dificultad_hundirse || 'NO'}
              onChange={(e) => handleChange('dificultad_hundirse', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
        </div>
      </div>

      <div id="tortugas-reproductivo" className="form-section">
        <h3>{section('reproductivo')}</h3>
        
                <ReproductiveSexHint sexo={sexo} />
        {sexo === 'hembra' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>{field('ultima_puesta_dias_atras')}</label>
                <input
                  type="text"
                  value={formData.ultima_puesta || ''}
                  onChange={(e) => handleChange('ultima_puesta', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>{field('dificultad_para_poner')}</label>
                <FormCombobox
                  required
                  value={formData.dificultad_poner || 'NO'}
                  onChange={(e) => handleChange('dificultad_poner', e.target.value)}
                >
                  <option value="NO">{t('no')}</option>
                  <option value="SI">{t('yes')}</option>
                </FormCombobox>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{field('huevos_deformes')}</label>
                <FormCombobox
                  required
                  value={formData.huevos_deformes || 'NO'}
                  onChange={(e) => handleChange('huevos_deformes', e.target.value)}
                >
                  <option value="NO">{t('no')}</option>
                  <option value="SI">{t('yes')}</option>
                </FormCombobox>
              </div>
              <div className="form-group">
                <label>{field('hinchazon_abdominal_2')}</label>
                <FormCombobox
                  required
                  value={formData.hinchazon_abdominal || 'NO'}
                  onChange={(e) => handleChange('hinchazon_abdominal', e.target.value)}
                >
                  <option value="NO">{t('no')}</option>
                  <option value="SI">{t('yes')}</option>
                </FormCombobox>
              </div>
            </div>
          </>
        )}

        {sexo === 'macho' && (
          <div className="form-row">
            <div className="form-group">
              <label>{field('comportamiento_territorial_excesivo')}</label>
              <FormCombobox
                required
                value={formData.territorial || 'NO'}
                onChange={(e) => handleChange('territorial', e.target.value)}
              >
                <option value="NO">{t('no')}</option>
                <option value="SI">{t('yes')}</option>
              </FormCombobox>
            </div>
            <div className="form-group">
              <label>{field('agresividad_repentina')}</label>
              <FormCombobox
                value={formData.agresividad_reproductiva || 'NO'}
                onChange={(e) => handleChange('agresividad_reproductiva', e.target.value)}
              >
                <option value="NO">{t('no')}</option>
                <option value="SI">{t('yes')}</option>
              </FormCombobox>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>{field('problemas_para_aparearse')}</label>
            <FormCombobox
              value={formData.problemas_aparearse || 'NO'}
              onChange={(e) => handleChange('problemas_aparearse', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
        </div>
      </div>

      <div id="tortugas-alimentacion" className="form-section">
        <h3>{section('alimentacion')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('tipo_de_dieta')}</label>
            <FormCombobox
              required
              value={formData.tipo_dieta || ''}
              onChange={(e) => handleChange('tipo_dieta', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="herbivora">{t('options.herbivora')}</option>
              <option value="omnivora">{t('options.omnivora')}</option>
              <option value="carnivora">{t('options.carnivora')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('suplementos_de_calcio')}</label>
            <FormCombobox
              value={formData.suplemento_calcio || 'NO'}
              onChange={(e) => handleChange('suplemento_calcio', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
          <div className="form-group">
            <label>{field('suplementos_de_vitamina_d3')}</label>
            <FormCombobox
              value={formData.suplemento_vitamina_d3 || 'NO'}
              onChange={(e) => handleChange('suplemento_vitamina_d3', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('suplementos_multivitaminicos')}</label>
            <FormCombobox
              value={formData.suplemento_multivitaminicos || 'NO'}
              onChange={(e) => handleChange('suplemento_multivitaminicos', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
          <div className="form-group">
            <label>{field('frutas_vegetales_frescos')}</label>
            <FormCombobox
              value={formData.frutas_vegetales_frescas || 'NO'}
              onChange={(e) => handleChange('frutas_vegetales_frescas', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
        </div>

        {formData.frutas_vegetales_frescas === 'SI' && (
          <div className="form-group">
            <label>{field('cuales_frutas_vegetales')}</label>
            <input
              type="text"
              value={formData.frutas_vegetales_cuales || ''}
              onChange={(e) => handleChange('frutas_vegetales_cuales', e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label>{field('acceso_a_materiales_no_comestibles')}</label>
          <FormCombobox
            value={formData.acceso_no_comestibles || 'NO'}
            onChange={(e) => handleChange('acceso_no_comestibles', e.target.value)}
          >
            <option value="NO">{t('no')}</option>
            <option value="SI">{t('yes')}</option>
          </FormCombobox>
        </div>
      </div>

      {/* Ambiente */}
      <div id="tortugas-ambiente" className="form-section">
        <h3>{section('ambiente')}</h3>
        
        <div className="form-group">
          <label>{field('tipo_de_ambiente')}</label>
          <FormCombobox
            required
            value={formData.tipo_ambiente || ''}
            onChange={(e) => handleChange('tipo_ambiente', e.target.value)}
          >
            <option value="">{t('select')}</option>
            <option value="terrestre">{t('options.terrestre')}</option>
            <option value="acuatico">{t('options.acuatico')}</option>
          </FormCombobox>
        </div>

        {formData.tipo_ambiente === 'terrestre' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>{field('tamano_del_recinto_cm')}</label>
                <input
                  type="text"
                  value={formData.tamano_recinto || ''}
                  onChange={(e) => handleChange('tamano_recinto', e.target.value)}
                  placeholder={placeholder('largo_x_ancho_x_alto')}
                />
              </div>
              
              <div className="form-group">
                <label>{field('temperatura_ambiente_c_2')}</label>
                <input
                  type="text"
                  value={formData.temperatura_ambiente || ''}
                  onChange={(e) => handleChange('temperatura_ambiente', e.target.value)}
                  placeholder={placeholder('zona_fria_y_zona_caliente')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{field('humedad')}</label>
                <input
                  type="text"
                  value={formData.humedad || ''}
                  onChange={(e) => handleChange('humedad', e.target.value)}
                  placeholder={placeholder('ideal_varia_por_especie_deserticas_30_40_tropicales_60_80')}
                />
              </div>
              
              <div className="form-group">
                <label>{field('iluminacion_uvb')}</label>
                <FormCombobox
                  required
                  value={formData.iluminacion_uvb || ''}
                  onChange={(e) => handleChange('iluminacion_uvb', e.target.value)}
                >
                  <option value="">{t('select')}</option>
                  <option value="SI">{t('yes')}</option>
                  <option value="NO">{t('no')}</option>
                </FormCombobox>
              </div>
            </div>

            {formData.iluminacion_uvb === 'SI' && (
              <>
                <div className="form-group">
                  <label>{field('distancia_de_la_lampara_cm')}</label>
                  <input
                    type="text"
                    value={formData.distancia_lampara || ''}
                    onChange={(e) => handleChange('distancia_lampara', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{field('cambio_reciente_en_la_lampara_uvb')}</label>
                  <FormCombobox
                    value={formData.cambio_lampara_uvb || 'NO'}
                    onChange={(e) => handleChange('cambio_lampara_uvb', e.target.value)}
                  >
                    <option value="NO">{t('no')}</option>
                    <option value="SI">{t('yes')}</option>
                  </FormCombobox>
                </div>
              </>
            )}

            <div className="form-group">
              <label>{field('superficie_del_sustrato_2')}</label>
              <FormCombobox
                required
                value={formData.sustrato || ''}
                onChange={(e) => handleChange('sustrato', e.target.value)}
              >
                <option value="">{t('select')}</option>
                <option value="tierra">{t('options.tierra')}</option>
                <option value="arena">{t('options.arena')}</option>
                <option value="alfombra">{t('options.alfombra')}</option>
                <option value="otro">{t('options.otro')}</option>
              </FormCombobox>
            </div>
          </>
        )}

        {formData.tipo_ambiente === 'acuatico' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>{field('tamano_del_tanque_l')}</label>
                <input
                  type="text"
                  value={formData.tamano_tanque || ''}
                  onChange={(e) => handleChange('tamano_tanque', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>{field('temperatura_del_agua_c')}</label>
                <input
                  type="text"
                  value={formData.temp_agua || ''}
                  onChange={(e) => handleChange('temp_agua', e.target.value)}
                  placeholder={placeholder('ideal_24_28_c')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{field('temperatura_de_la_zona_seca_c')}</label>
                <input
                  type="text"
                  value={formData.temp_zona_seca || ''}
                  onChange={(e) => handleChange('temp_zona_seca', e.target.value)}
                  placeholder={placeholder('ideal_30_35_c')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{field('filtracion')}</label>
                <FormCombobox
                  required
                  value={formData.filtracion || ''}
                  onChange={(e) => handleChange('filtracion', e.target.value)}
                >
                  <option value="">{t('select')}</option>
                  <option value="SI">{t('yes')}</option>
                  <option value="NO">{t('no')}</option>
                </FormCombobox>
              </div>
              
              <div className="form-group">
                <label>{field('cambio_de_agua')}</label>
                <FormCombobox
                  required
                  value={formData.cambio_agua || ''}
                  onChange={(e) => handleChange('cambio_agua', e.target.value)}
                >
                  <option value="">{t('select')}</option>
                  <option value="diario">{t('options.diario')}</option>
                  <option value="cada_2_dias">{t('options.cada_2_dias')}</option>
                  <option value="semanal">{t('options.semanal')}</option>
                </FormCombobox>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{field('en_hibernacion_brumacion')}</label>
                <FormCombobox
                  value={formData.hibernacion || 'NO'}
                  onChange={(e) => handleChange('hibernacion', e.target.value)}
                >
                  <option value="NO">{t('no')}</option>
                  <option value="SI">{t('yes')}</option>
                </FormCombobox>
              </div>

              <div className="form-group">
                <label>{field('control_de_peso_durante_hibernacion')}</label>
                <FormCombobox
                  value={formData.control_peso_hibernacion || 'NO'}
                  onChange={(e) => handleChange('control_peso_hibernacion', e.target.value)}
                >
                  <option value="NO">{t('no')}</option>
                  <option value="SI">{t('yes')}</option>
                </FormCombobox>
              </div>
            </div>

            {formData.control_peso_hibernacion === 'SI' && (
              <div className="form-group">
                <label>{field('peso_inicial_g')}</label>
                <input
                  type="text"
                  value={formData.peso_inicial_hibernacion || ''}
                  onChange={(e) => handleChange('peso_inicial_hibernacion', e.target.value)}
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>{field('temperatura_controlada')}</label>
                <FormCombobox
                  value={formData.temperatura_controlada_hibernacion || 'NO'}
                  onChange={(e) => handleChange('temperatura_controlada_hibernacion', e.target.value)}
                >
                  <option value="NO">{t('no')}</option>
                  <option value="SI">{t('yes')}</option>
                </FormCombobox>
              </div>
            </div>

            {formData.temperatura_controlada_hibernacion === 'SI' && (
              <div className="form-group">
                <label>{field('rango_de_temperatura_c')}</label>
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
            <label>{field('vive_sola_o_en_grupo')}</label>
            <FormCombobox
              value={formData.socializacion_tipo || ''}
              onChange={(e) => handleChange('socializacion_tipo', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="sola">{t('options.sola')}</option>
              <option value="pareja">{t('options.pareja')}</option>
              <option value="grupo">{t('options.grupo')}</option>
            </FormCombobox>
          </div>
          <div className="form-group">
            <label>{field('peleas_recientes')}</label>
            <FormCombobox
              value={formData.peleas_recientes || 'NO'}
              onChange={(e) => handleChange('peleas_recientes', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('compatible_con_companeros')}</label>
            <FormCombobox
              value={formData.compatibilidad_companeros || 'SI'}
              onChange={(e) => handleChange('compatibilidad_companeros', e.target.value)}
            >
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </FormCombobox>
          </div>
        </div>
      </div>

      <div id="tortugas-historial" className="form-section">
        <h3>Historia Médica Previa</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('calcio_con_d3')}</label>
            <FormCombobox
              value={formData.hist_calcio_d3 || 'NO'}
              onChange={(e) => handleChange('hist_calcio_d3', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
          {formData.hist_calcio_d3 === 'SI' && (
            <div className="form-group">
              <label>{field('frecuencia')}</label>
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
            <label>{field('multivitaminicos')}</label>
            <FormCombobox
              value={formData.hist_multivitaminicos || 'NO'}
              onChange={(e) => handleChange('hist_multivitaminicos', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
          {formData.hist_multivitaminicos === 'SI' && (
            <div className="form-group">
              <label>{field('frecuencia')}</label>
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
            <label>{field('exposicion_a_luz_solar_directa')}</label>
            <FormCombobox
              value={formData.exposicion_sol || 'NO'}
              onChange={(e) => handleChange('exposicion_sol', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
          {formData.exposicion_sol === 'SI' && (
            <div className="form-group">
              <label>{field('duracion_horas_dia')}</label>
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
            <label>{field('desparasitacion_previa')}</label>
            <FormCombobox
              value={formData.desparasitacion_previa || 'NO'}
              onChange={(e) => handleChange('desparasitacion_previa', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
          <div className="form-group">
            <label>{field('trauma_previo')}</label>
            <FormCombobox
              value={formData.trauma_previo || 'NO'}
              onChange={(e) => handleChange('trauma_previo', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
        </div>

        {formData.trauma_previo === 'SI' && (
          <div className="form-group">
            <label>{field('fecha_del_trauma')}</label>
            <input
              type="text"
              value={formData.trauma_fecha || ''}
              onChange={(e) => handleChange('trauma_fecha', e.target.value)}
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>{field('reparacion_de_caparazon')}</label>
            <FormCombobox
              value={formData.reparacion_caparazon || 'NO'}
              onChange={(e) => handleChange('reparacion_caparazon', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
          <div className="form-group">
            <label>{field('extraccion_de_cuerpo_extrano')}</label>
            <FormCombobox
              value={formData.extraccion_cuerpo_extrano || 'NO'}
              onChange={(e) => handleChange('extraccion_cuerpo_extrano', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('medicaciones_actuales')}</label>
            <FormCombobox
              value={formData.medicaciones_actuales || 'NO'}
              onChange={(e) => handleChange('medicaciones_actuales', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </FormCombobox>
          </div>
        </div>

        {formData.medicaciones_actuales === 'SI' && (
          <div className="form-group">
            <label>{field('cuales_medicaciones')}</label>
            <input
              type="text"
              value={formData.medicaciones_actuales_cuales || ''}
              onChange={(e) => handleChange('medicaciones_actuales_cuales', e.target.value)}
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>{field('suplementos_previos')}</label>
            <FormCombobox
              value={formData.suplementos_historia_tipo || ''}
              onChange={(e) => handleChange('suplementos_historia_tipo', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="probioticos">{t('options.probioticos')}</option>
              <option value="vitaminas">{t('options.vitaminas')}</option>
              <option value="otros">{t('options.otros')}</option>
            </FormCombobox>
          </div>
        </div>

        {formData.suplementos_historia_tipo === 'otros' && (
          <div className="form-group">
            <label>{field('otros_suplementos')}</label>
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
            <label>{field('temperatura_ambiente_c')}</label>
            <input
              type="text"
              value={formData.examen_temp_ambiente || ''}
              onChange={(e) => handleChange('examen_temp_ambiente', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{field('temperatura_corporal_c')}</label>
            <input
              type="text"
              value={formData.examen_temp_corporal || formData.temperatura_corporal || ''}
              onChange={(e) => handleChange('examen_temp_corporal', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('peso_corporal_g_kg')}</label>
            <input
              type="text"
              value={formData.peso_corporal_examen || formData.peso || ''}
              onChange={(e) => handleChange('peso_corporal_examen', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{field('condicion_muscular')}</label>
            <FormCombobox
              value={formData.condicion_muscular || ''}
              onChange={(e) => handleChange('condicion_muscular', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="excelente">{t('options.excelente')}</option>
              <option value="buena">{t('options.buena')}</option>
              <option value="regular">{t('options.regular')}</option>
              <option value="mala">{t('options.mala')}</option>
              <option value="ausente">{t('options.ausente')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('estado_de_hidratacion')}</label>
            <FormCombobox
              value={formData.estado_hidratacion_examen || ''}
              onChange={(e) => handleChange('estado_hidratacion_examen', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="normal">{t('options.normal')}</option>
              <option value="leve">{t('options.leve')}</option>
              <option value="moderado">{t('options.moderado')}</option>
              <option value="severo">{t('options.severo')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('caparazon_evaluacion_rapida')}</label>
            <FormCombobox
              value={formData.caparazon_examen || ''}
              onChange={(e) => handleChange('caparazon_examen', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="normal">{t('options.normal')}</option>
              <option value="blandeza">{t('options.blandeza')}</option>
              <option value="deformidad">{t('options.deformidad')}</option>
              <option value="lesiones">{t('options.lesiones')}</option>
            </FormCombobox>
          </div>
          <div className="form-group">
            <label>{field('piel_evaluacion_rapida')}</label>
            <FormCombobox
              value={formData.piel_examen || ''}
              onChange={(e) => handleChange('piel_examen', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="normal">{t('options.normal')}</option>
              <option value="descamacion">{t('options.descamacion')}</option>
              <option value="ulceras">{t('options.ulceras')}</option>
              <option value="edema">{t('options.edema')}</option>
            </FormCombobox>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('ojos_evaluacion_rapida')}</label>
            <FormCombobox
              value={formData.ojos_examen || ''}
              onChange={(e) => handleChange('ojos_examen', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="abiertos">{t('options.abiertos')}</option>
              <option value="hinchados">{t('options.hinchados')}</option>
              <option value="secrecion">{t('options.secrecion')}</option>
              <option value="opacidad">{t('options.opacidad')}</option>
            </FormCombobox>
          </div>
        </div>
      </div>

      <div id="tortugas-riesgos" className="form-section">
        <h3>Factores de Riesgo Específicos</h3>

        <h4>Tortugas Terrestres (Testudinidae)</h4>
        <div className="form-row">
          <div className="form-group">
            <label>{field('historia_de_hiperdosis_de_vitamina_d')}</label>
            <YesNoChips
              value={formData.hiperdosis_vitamina_d}
              onChange={(val) => handleChange('hiperdosis_vitamina_d', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('dieta_rica_en_proteinas')}</label>
            <YesNoChips
              value={formData.dieta_rica_proteinas}
              onChange={(val) => handleChange('dieta_rica_proteinas', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('exposicion_inadecuada_a_uvb')}</label>
            <YesNoChips
              value={formData.exposicion_uvb_inadecuada}
              onChange={(val) => handleChange('exposicion_uvb_inadecuada', val)}
            />
          </div>
        </div>

        <h4>Tortugas Acuáticas (Emydidae, Trionychidae)</h4>
        <div className="form-row">
          <div className="form-group">
            <label>{field('filtracion_inadecuada')}</label>
            <YesNoChips
              value={formData.filtracion_inadecuada}
              onChange={(val) => handleChange('filtracion_inadecuada', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('temperatura_del_agua_baja')}</label>
            <YesNoChips
              value={formData.temperatura_agua_baja}
              onChange={(val) => handleChange('temperatura_agua_baja', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('superficie_de_descanso_inadecuada')}</label>
            <YesNoChips
              value={formData.superficie_descanso_inadecuada}
              onChange={(val) => handleChange('superficie_descanso_inadecuada', val)}
            />
          </div>
        </div>

        <h4>Tortugas de Desierto (Gopherus, Geochelone)</h4>
        <div className="form-row">
          <div className="form-group">
            <label>{field('dieta_con_mucha_fruta')}</label>
            <YesNoChips
              value={formData.dieta_mucha_fruta_desierto}
              onChange={(val) => handleChange('dieta_mucha_fruta_desierto', val)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>{field('tipo_de_sustrato_desierto')}</label>
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