import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from "../ui/yes-no-chips";
import { useSpeciesFormI18n } from "../../hooks/useSpeciesFormI18n";
import { normalizePetSex } from "../../lib/petSex";
import ReproductiveSexHint from "./ReproductiveSexHint";

const CuyosForm = ({ formData, setFormData }) => {
  const { t, field, placeholder, section, title } = useSpeciesFormI18n('cuyos');
  const sexo = normalizePetSex(formData.sexo);
  const [activeSection, setActiveSection] = useState('cuyos-info-basica');
  const [collapsedSections, setCollapsedSections] = useState({});

  const handleChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });
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
    { id: 'cuyos-info-basica', labelKey: 'info_basica', icon: '📋' },
    { id: 'cuyos-alimentacion', labelKey: 'alimentacion', icon: '🥗' },
    { id: 'cuyos-ambiente', label: 'Ambiente y Socialización', icon: '🏠' },
    { id: 'cuyos-historia', label: 'Historia Médica Previa', icon: '📁' },
    { id: 'cuyos-examen', labelKey: 'examen_fisico', icon: '🩺' },
    { id: 'cuyos-digestivo', labelKey: 'digestivo', icon: '🫃' },
    { id: 'cuyos-respiratorio', labelKey: 'respiratorio', icon: '🫁' },
    { id: 'cuyos-reproductivo', labelKey: 'reproductivo', icon: '🔬' },
    { id: 'cuyos-neurologico', labelKey: 'neurologico', icon: '🧠' },
    { id: 'cuyos-cutaneo', labelKey: 'cutaneo', icon: '🐾' },
    { id: 'cuyos-ojos', labelKey: 'ojos', icon: '👁️' },
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
      <h2>{title('cuyos')}</h2>

      {/* Barra de Progreso */}
      <div className="species-form-progress">
        <div className="species-form-progress-header">
          <span className="species-form-progress-label">{t('chrome.progress')}</span>
          <span className="species-form-progress-percent">{progress}%</span>
        </div>
        <div className="species-form-progress-bar">
          <div 
            className={`species-form-progress-fill ${progress === 100 ? 'complete' : ''}`}
            style={{ width: `${progress}%` }}
          />
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
      <div id="cuyos-info-basica" className="form-section">
        <h3>📋 Información Básica</h3>

        <div className="form-row">
          <div className="form-group">
            <label>{field('nombre_de_la_mascota')}</label>
            <input
              type="text"
              required
              value={formData.nombre_mascota || ''}
              onChange={(e) => handleChange('nombre_mascota', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{field('nombre_dueño')}</label>
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
            <label>{field('edad_exacta_meses_anos')}</label>
            <input
              type="text"
              required
              placeholder={placeholder('adulto_4_meses_senior_3_anos')}
              value={formData.edad || ''}
              onChange={(e) => handleChange('edad', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{field('edad_confirmada_por_cria')}</label>
            <select
              value={formData.edad_confirmada_cria || ''}
              onChange={(e) => handleChange('edad_confirmada_cria', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
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
              <option value="macho">{t('options.macho')}</option>
              <option value="hembra">{t('options.hembra')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('sexo_confirmado_por')}</label>
            <select
              value={formData.sexo_confirmado || ''}
              onChange={(e) => handleChange('sexo_confirmado', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="visual">{t('options.visual')}</option>
              <option value="comportamiento">{t('options.por_comportamiento')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('esterilizado')}</label>
            <select
              required
              value={formData.esterilizado || ''}
              onChange={(e) => handleChange('esterilizado', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('peso_actual_g')}</label>
            <input
              type="text"
              placeholder={placeholder('normal_700_1200g_machos_hembras')}
              value={formData.peso || ''}
              onChange={(e) => handleChange('peso', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('indice_de_condicion_corporal_icc')}</label>
            <select
              value={formData.condicion_corporal || ''}
              onChange={(e) => handleChange('condicion_corporal', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="1-3">{t('options.n_1_3_emaciado')}</option>
              <option value="4-5">{t('options.n_4_5_delgado')}</option>
              <option value="6-7">{t('options.n_6_7_ideal')}</option>
              <option value="8-9">{t('options.n_8_9_sobrepeso')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('temperamento')}</label>
            <select
              value={formData.temperamento || ''}
              onChange={(e) => handleChange('temperamento', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="tranquilo">{t('options.tranquilo')}</option>
              <option value="nervioso">{t('options.nervioso')}</option>
              <option value="agresivo">{t('options.agresivo')}</option>
              <option value="timido">{t('options.timido')}</option>
              <option value="hiperactivo">{t('options.hiperactivo')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('color_pelaje')}</label>
            <select
              value={formData.color_pelaje || ''}
              onChange={(e) => handleChange('color_pelaje', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="blanco">{t('options.blanco')}</option>
              <option value="negro">{t('options.negro')}</option>
              <option value="marron">{t('options.marron')}</option>
              <option value="tricolor">{t('options.tricolor')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('duracion_exacta_del_problema_2')}</label>
            <select
              required
              value={formData.duracion_problema || ''}
              onChange={(e) => handleChange('duracion_problema', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="<12h">{t('options.lt_12_horas_2')}</option>
              <option value="12-24h">{t('options.n_12_24_h')}</option>
              <option value="2-3dias">{t('options.n_2_3_dias')}</option>
              <option value="4-7dias">{t('options.n_4_7_dias')}</option>
              <option value=">1semana">{t('options.gt_1_semana')}</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{field('progresion_del_problema')}</label>
          <select
            value={formData.progresion_problema || ''}
            onChange={(e) => handleChange('progresion_problema', e.target.value)}
          >
            <option value="">{t('select')}</option>
            <option value="mejora">{t('options.mejora')}</option>
            <option value="estable">{t('options.estable')}</option>
            <option value="empeora_rapido">{t('options.empeora_rapidamente')}</option>
            <option value="intermitente">{t('options.intermitente')}</option>
          </select>
        </div>
      </div>

      {/* Alimentación */}
      <div id="cuyos-alimentacion" className="form-section">
        <h3>🥗 Alimentación</h3>

        <div className="form-row">
          <div className="form-group">
            <label>{field('heno')}</label>
            <select
              required
              value={formData.tipo_heno || ''}
              onChange={(e) => handleChange('tipo_heno', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="avena">{t('options.avena')}</option>
              <option value="alfalfa">{t('options.alfalfa')}</option>
              <option value="otro">{t('options.otro')}</option>
            </select>
          </div>
          {formData.tipo_heno === 'otro' && (
            <div className="form-group">
              <label>{field('otro_tipo_de_heno')}</label>
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
            <label>{field('frecuencia_de_heno')}</label>
            <select
              required
              value={formData.frecuencia_heno || ''}
              onChange={(e) => handleChange('frecuencia_heno', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="ilimitado">{t('options.ilimitado')}</option>
              <option value="limitado">{t('options.limitado')}</option>
              <option value="intermitente">{t('options.intermitente')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('pellets')}</label>
            <YesNoChips
              value={formData.pellets}
              onChange={(val) => handleChange('pellets', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('verduras_frescas')}</label>
            <YesNoChips
              value={formData.verduras_frescas}
              onChange={(val) => handleChange('verduras_frescas', val)}
            />
          </div>
          {formData.verduras_frescas === 'SI' && (
            <div className="form-group">
              <label>{field('cuales_verduras')}</label>
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
            <label>{field('suplementos_vitaminas')}</label>
            <YesNoChips
              value={formData.suplementos_vitaminas}
              onChange={(val) => handleChange('suplementos_vitaminas', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('suplementos_minerales')}</label>
            <YesNoChips
              value={formData.suplementos_minerales}
              onChange={(val) => handleChange('suplementos_minerales', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('suplementos_vitamina_c')}</label>
            <YesNoChips
              value={formData.suplementos_vitamina_c}
              onChange={(val) => handleChange('suplementos_vitamina_c', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('dieta_rica_en_carbohidratos')}</label>
            <YesNoChips
              value={formData.dieta_carbohidratos}
              onChange={(val) => handleChange('dieta_carbohidratos', val)}
            />
          </div>
        </div>

        {formData.dieta_carbohidratos === 'SI' && (
          <div className="form-group">
            <label>{field('detalles_de_dieta_rica_en_carbohidratos')}</label>
            <input
              type="text"
              value={formData.dieta_carbohidratos_detalle || ''}
              onChange={(e) => handleChange('dieta_carbohidratos_detalle', e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label>{field('cantidad_diaria_de_vitamina_c_mg')}</label>
          <input
            type="text"
            placeholder={placeholder('minimo_10_30_mg_dia')}
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
            <label>{field('jaula_vivienda')}</label>
            <select
              required
              value={formData.vivienda || ''}
              onChange={(e) => handleChange('vivienda', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="interior">{t('options.habitat_interior')}</option>
              <option value="exterior">{t('options.habitat_exterior')}</option>
              <option value="mixto">{t('options.mixto')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('superficie_del_piso')}</label>
            <select
              required
              value={formData.superficie_piso || ''}
              onChange={(e) => handleChange('superficie_piso', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="alfombra">{t('options.alfombra')}</option>
              <option value="madera">{t('options.madera')}</option>
              <option value="felpa">{t('options.felpa')}</option>
              <option value="cemento">{t('options.cemento')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('contacto_con_otras_mascotas')}</label>
            <YesNoChips
              value={formData.contacto_mascotas}
              onChange={(val) => handleChange('contacto_mascotas', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('tipo_de_ejercicio')}</label>
            <select
              value={formData.tipo_ejercicio || ''}
              onChange={(e) => handleChange('tipo_ejercicio', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="libre_habitacion">{t('options.libre_en_habitacion')}</option>
              <option value="correa">{t('options.correa')}</option>
              <option value="ninguno">{t('options.ninguno')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('saltos_frecuentes')}</label>
            <select
              value={formData.saltos_frecuentes || 'NO'}
              onChange={(e) => handleChange('saltos_frecuentes', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('vive_solo_o_en_grupo')}</label>
            <select
              value={formData.socializacion || ''}
              onChange={(e) => handleChange('socializacion', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="solo">{t('options.solo')}</option>
              <option value="pareja">{t('options.pareja')}</option>
              <option value="grupo">{t('options.grupo')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('peleas_recientes')}</label>
            <select
              value={formData.peleas_recientes || 'NO'}
              onChange={(e) => handleChange('peleas_recientes', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('compatible_con_companeros')}</label>
            <select
              value={formData.compatible_companeros || ''}
              onChange={(e) => handleChange('compatible_companeros', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{field('limpieza_de_jaula_2')}</label>
          <select
            required
            value={formData.limpieza_jaula || ''}
            onChange={(e) => handleChange('limpieza_jaula', e.target.value)}
          >
            <option value="">{t('select')}</option>
            <option value="diaria">{t('options.diaria')}</option>
            <option value="cada_2_dias">{t('options.cada_2_dias')}</option>
            <option value="semanal">{t('options.semanal')}</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('uso_de_productos_quimicos')}</label>
            <select
              value={formData.uso_quimicos || 'NO'}
              onChange={(e) => handleChange('uso_quimicos', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('banos_frecuentes')}</label>
            <select
              value={formData.banos_frecuentes || 'NO'}
              onChange={(e) => handleChange('banos_frecuentes', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Historia Médica Previa */}
      <div id="cuyos-historia" className="form-section">
        <h3>Historia Médica Previa</h3>

        <div className="form-row">
          <div className="form-group">
            <label>{field('desparasitacion_2')}</label>
            <select
              value={formData.hist_desparasitacion || 'NO'}
              onChange={(e) => handleChange('hist_desparasitacion', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('tratamiento_para_e_cuniculi')}</label>
            <select
              value={formData.tratamiento_e_cuniculi || 'NO'}
              onChange={(e) => handleChange('tratamiento_e_cuniculi', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <h4>Enfermedades previas</h4>
        <div className="form-row">
          <div className="form-group">
            <label>{field('problemas_dentales')}</label>
            <select
              value={formData.enf_prev_dentales || 'NO'}
              onChange={(e) => handleChange('enf_prev_dentales', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('estasis_gi')}</label>
            <select
              value={formData.enf_prev_estasis_gi || 'NO'}
              onChange={(e) => handleChange('enf_prev_estasis_gi', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('infecciones_respiratorias')}</label>
            <select
              value={formData.enf_prev_resp || 'NO'}
              onChange={(e) => handleChange('enf_prev_resp', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('escorbuto')}</label>
            <select
              value={formData.enf_prev_escorbuto || 'NO'}
              onChange={(e) => handleChange('enf_prev_escorbuto', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <h4>Cirugías</h4>
        <div className="form-row">
          <div className="form-group">
            <label>{field('esterilizacion_previa')}</label>
            <select
              value={formData.cirugia_esterilizacion || 'NO'}
              onChange={(e) => handleChange('cirugia_esterilizacion', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('extraccion_dental')}</label>
            <select
              value={formData.cirugia_extraccion_dental || 'NO'}
              onChange={(e) => handleChange('cirugia_extraccion_dental', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{field('drenaje_de_abscesos')}</label>
          <select
            value={formData.cirugia_abscesos || 'NO'}
            onChange={(e) => handleChange('cirugia_abscesos', e.target.value)}
          >
            <option value="NO">{t('no')}</option>
            <option value="SI">{t('yes')}</option>
          </select>
        </div>
      </div>

      {/* Examen Físico Cuantificado */}
      <div id="cuyos-examen" className="form-section">
        <h3>Examen Físico Cuantificado</h3>

        <div className="form-row">
          <div className="form-group">
            <label>{field('temperatura')}</label>
            <input
              type="text"
              placeholder={placeholder('normal_37_39_c')}
              value={formData.temperatura || ''}
              onChange={(e) => handleChange('temperatura', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{field('frecuencia_cardiaca_lpm')}</label>
            <input
              type="text"
              placeholder={placeholder('normal_200_250')}
              value={formData.frecuencia_cardiaca || ''}
              onChange={(e) => handleChange('frecuencia_cardiaca', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('frecuencia_respiratoria_rpm')}</label>
            <input
              type="text"
              placeholder={placeholder('normal_80_100')}
              value={formData.frecuencia_respiratoria || ''}
              onChange={(e) => handleChange('frecuencia_respiratoria', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{field('hidratacion')}</label>
            <select
              value={formData.hidratacion || ''}
              onChange={(e) => handleChange('hidratacion', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="5">{t('options.n_5_piel_vuelve_rapido')}</option>
              <option value="6-8">{t('options.n_6_8_piel_lenta')}</option>
              <option value=">10%">{t('options.gt_10_piel_no_vuelve')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('color_de_mucosas')}</label>
            <select
              value={formData.mucosas || ''}
              onChange={(e) => handleChange('mucosas', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="rosado">{t('options.rosado')}</option>
              <option value="palido">{t('options.palido')}</option>
              <option value="icterico">{t('options.icterico')}</option>
              <option value="cianotico">{t('options.cianotico')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('peso_corporal_g')}</label>
            <input
              type="text"
              value={formData.peso_corporal || ''}
              onChange={(e) => handleChange('peso_corporal', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('condicion_muscular')}</label>
            <select
              value={formData.condicion_muscular || ''}
              onChange={(e) => handleChange('condicion_muscular', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="excelente">{t('options.excelente')}</option>
              <option value="buena">{t('options.buena')}</option>
              <option value="regular">{t('options.regular')}</option>
              <option value="mala">{t('options.mala')}</option>
              <option value="ausente">{t('options.ausente')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('estado_dental')}</label>
            <select
              value={formData.estado_dental || ''}
              onChange={(e) => handleChange('estado_dental', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="normal">{t('options.normal')}</option>
              <option value="sobrecrecimiento">{t('options.sobrecrecimiento')}</option>
              <option value="abscesos">{t('options.dientes_abscesos')}</option>
              <option value="rotos">{t('options.dientes_rotos')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sistema Digestivo */}
      <div id="cuyos-digestivo" className="form-section">
        <h3>{section('digestivo')}</h3>

        <div className="form-row">
          <div className="form-group">
            <label>{field('apetito')}</label>
            <select
              required
              value={formData.apetito || 'normal'}
              onChange={(e) => handleChange('apetito', e.target.value)}
            >
              <option value="normal">{t('options.normal')}</option>
              <option value="anorexia_total">{t('options.totalmente_anorexico_gt_12h')}</option>
              <option value="anorexia_parcial">{t('options.parcialmente_anorexico')}</option>
            </select>
          </div>
          {(formData.apetito === 'anorexia_total' || formData.apetito === 'anorexia_parcial') && (
            <div className="form-group">
              <label>{field('tiempo_sin_comer_horas')}</label>
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
            <label>{field('come_heno')}</label>
            <select
              value={formData.come_heno || ''}
              onChange={(e) => handleChange('come_heno', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('mastica_lentamente_o_deja_comida_sin_masticar')}</label>
            <select
              value={formData.mastica_lento || 'NO'}
              onChange={(e) => handleChange('mastica_lento', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('heces')}</label>
            <select
              required
              value={formData.heces || 'normales'}
              onChange={(e) => handleChange('heces', e.target.value)}
            >
              <option value="normales">{t('options.normales')}</option>
              <option value="ausentes">{t('options.ausentes')}</option>
              <option value="pequenas_duras">{t('options.pequenas_y_duras')}</option>
              <option value="blandas">{t('options.blandas_pastosas')}</option>
              <option value="en_racimo">{t('options.en_racimo')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('frecuencia_veces_dia')}</label>
            <input
              type="text"
              placeholder={placeholder('normal_100_300_segun_tamano')}
              value={formData.heces_frecuencia || ''}
              onChange={(e) => handleChange('heces_frecuencia', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('tamano_de_las_heces')}</label>
            <select
              value={formData.heces_tamano || ''}
              onChange={(e) => handleChange('heces_tamano', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="normal">{t('options.normal')}</option>
              <option value="pequenas">{t('options.pequenas')}</option>
              <option value="ausentes">{t('options.ausentes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('color_de_las_heces')}</label>
            <select
              value={formData.heces_color || ''}
              onChange={(e) => handleChange('heces_color', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="marron_oscuro">{t('options.marron_oscuro')}</option>
              <option value="verde">{t('options.verde')}</option>
              <option value="amarillento">{t('options.amarillento')}</option>
              <option value="blanco_moho">{t('options.blanco_moho')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('estomago_abdomen')}</label>
            <select
              required
              value={formData.abdomen || 'normal'}
              onChange={(e) => handleChange('abdomen', e.target.value)}
            >
              <option value="normal">{t('options.normal')}</option>
              <option value="distendido">{t('options.distendido')}</option>
              <option value="doloroso">{t('options.doloroso_al_tacto')}</option>
              <option value="ruidos_ausentes">{t('options.ruidos_intestinales_ausentes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('regurgitacion')}</label>
            <select
              value={formData.regurgitacion || 'NO'}
              onChange={(e) => handleChange('regurgitacion', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('palpacion_de_bolas_de_pelo')}</label>
            <select
              value={formData.bolas_pelo || 'NO'}
              onChange={(e) => handleChange('bolas_pelo', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('cambio_reciente_de_dieta')}</label>
            <select
              value={formData.desencadenante_dieta || 'NO'}
              onChange={(e) => handleChange('desencadenante_dieta', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('estres_mudanza_veterinario')}</label>
            <select
              value={formData.desencadenante_estres || 'NO'}
              onChange={(e) => handleChange('desencadenante_estres', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('uso_reciente_de_antibioticos')}</label>
            <select
              value={formData.desencadenante_antibioticos || 'NO'}
              onChange={(e) => handleChange('desencadenante_antibioticos', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('dolor_no_tratado')}</label>
            <select
              value={formData.desencadenante_dolor || 'NO'}
              onChange={(e) => handleChange('desencadenante_dolor', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sistema Respiratorio */}
      <div id="cuyos-respiratorio" className="form-section">
        <h3>{section('respiratorio')}</h3>

        <div className="form-row">
          <div className="form-group">
            <label>{field('secrecion_nasal_2')}</label>
            <select
              required
              value={formData.secrecion_nasal || 'NO'}
              onChange={(e) => handleChange('secrecion_nasal', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="clara">{t('options.clara_moco')}</option>
              <option value="purulenta">{t('options.purulenta_amarilla_verde')}</option>
              <option value="sangre">{t('options.sangre')}</option>
              <option value="caseosa">{t('options.caseosa')}</option>
            </select>
          </div>
          {formData.secrecion_nasal !== 'NO' && (
            <div className="form-group">
              <label>{field('unilateral_o_bilateral')}</label>
              <select
                value={formData.secrecion_localizacion || ''}
                onChange={(e) => handleChange('secrecion_localizacion', e.target.value)}
              >
                <option value="">{t('select')}</option>
                <option value="unilateral">{t('options.unilateral')}</option>
                <option value="bilateral">{t('options.bilateral')}</option>
              </select>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('respiracion')}</label>
            <select
              required
              value={formData.respiracion || 'normal'}
              onChange={(e) => handleChange('respiracion', e.target.value)}
            >
              <option value="normal">{t('options.normal')}</option>
              <option value="ruidosa">{t('options.ruidosa')}</option>
              <option value="dificultad_inhalar">{t('options.dificultad_para_inhalar')}</option>
              <option value="dificultad_exhalar">{t('options.dificultad_para_exhalar')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('ronquidos_o_estertores')}</label>
            <select
              value={formData.ronquidos_estertores || 'NO'}
              onChange={(e) => handleChange('ronquidos_estertores', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('estornudos_2')}</label>
            <select
              required
              value={formData.estornudos || 'NO'}
              onChange={(e) => handleChange('estornudos', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="aislados">{t('options.aislados')}</option>
              <option value="frecuentes">{t('options.frecuentes')}</option>
              <option value="con_secrecion">{t('options.con_secrecion')}</option>
              <option value="sin_secrecion">{t('options.sin_secrecion')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('mejora_con_limpieza_nasal')}</label>
            <select
              value={formData.mejora_limpieza_nasal || 'NO'}
              onChange={(e) => handleChange('mejora_limpieza_nasal', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{field('presencia_de_costras_en_nariz')}</label>
          <select
            value={formData.costras_nariz || 'NO'}
            onChange={(e) => handleChange('costras_nariz', e.target.value)}
          >
            <option value="NO">{t('no')}</option>
            <option value="SI">{t('yes')}</option>
          </select>
        </div>
      </div>

      {/* Sistema Reproductivo */}
      <div id="cuyos-reproductivo" className="form-section">
        <h3>{section('reproductivo')}</h3>

                <ReproductiveSexHint sexo={sexo} />
        {sexo === 'hembra' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>{field('ultimo_celo_parto_dias_atras')}</label>
                <input
                  type="text"
                  value={formData.ultimo_celo || ''}
                  onChange={(e) => handleChange('ultimo_celo', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>{field('secrecion_vaginal')}</label>
                <select
                  value={formData.secrecion_vaginal || 'NO'}
                  onChange={(e) => handleChange('secrecion_vaginal', e.target.value)}
                >
                  <option value="NO">{t('no')}</option>
                  <option value="sanguinolenta">{t('options.sanguinolenta')}</option>
                  <option value="purulenta">{t('options.purulenta')}</option>
                  <option value="mucosa">{t('options.mucosa')}</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{field('frecuencia_de_secrecion')}</label>
                <select
                  value={formData.secrecion_vaginal_frecuencia || ''}
                  onChange={(e) => handleChange('secrecion_vaginal_frecuencia', e.target.value)}
                >
                  <option value="">{t('select')}</option>
                  <option value="intermitente">{t('options.intermitente')}</option>
                  <option value="continua">{t('options.continua')}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{field('relacion_con_celo')}</label>
                <select
                  value={formData.relacion_celo || ''}
                  onChange={(e) => handleChange('relacion_celo', e.target.value)}
                >
                  <option value="">{t('select')}</option>
                  <option value="durante_celo">{t('options.durante_celo')}</option>
                  <option value="fuera_celo">{t('options.fuera_de_celo')}</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>{field('hinchazon_abdominal')}</label>
              <select
                value={formData.hinchazon_abdominal || 'NO'}
                onChange={(e) => handleChange('hinchazon_abdominal', e.target.value)}
              >
                <option value="NO">{t('no')}</option>
                <option value="SI">{t('yes')}</option>
              </select>
            </div>
          </>
        )}

        {sexo === 'macho' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>{field('testiculos_descendidos_2')}</label>
                <select
                  required
                  value={formData.testiculos_descendidos || ''}
                  onChange={(e) => handleChange('testiculos_descendidos', e.target.value)}
                >
                  <option value="">{t('select')}</option>
                  <option value="SI">{t('yes')}</option>
                  <option value="NO">{t('no')}</option>
                  <option value="uno">{t('options.uno_solo')}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{field('hinchazon_escrotal')}</label>
                <select
                  value={formData.hinchazon_escrotal || 'NO'}
                  onChange={(e) => handleChange('hinchazon_escrotal', e.target.value)}
                >
                  <option value="NO">{t('no')}</option>
                  <option value="SI">{t('yes')}</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>{field('dificultad_para_orinar')}</label>
              <select
                value={formData.dificultad_orinar || 'NO'}
                onChange={(e) => handleChange('dificultad_orinar', e.target.value)}
              >
                <option value="NO">{t('no')}</option>
                <option value="SI">{t('yes')}</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Sistema Neurológico */}
      <div id="cuyos-neurologico" className="form-section">
        <h3>{section('neurologico')}</h3>

        <div className="form-row">
          <div className="form-group">
            <label>{field('temblor_convulsiones')}</label>
            <select
              required
              value={formData.convulsiones || 'NO'}
              onChange={(e) => handleChange('convulsiones', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="temblor_generalizado">{t('options.temblor_generalizado')}</option>
              <option value="focales">{t('options.convulsiones_focales')}</option>
              <option value="generalizadas">{t('options.convulsiones_generalizadas')}</option>
            </select>
          </div>
          {formData.convulsiones !== 'NO' && (
            <div className="form-group">
              <label>{field('duracion_segundos_minutos')}</label>
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
            <label>{field('desencadenantes')}</label>
            <select
              value={formData.convulsiones_desencadenante || ''}
              onChange={(e) => handleChange('convulsiones_desencadenante', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="estres">{t('options.estres')}</option>
              <option value="manipulacion">{t('options.manipulacion')}</option>
              <option value="ninguno">{t('options.ninguno')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('incoordinacion')}</label>
            <select
              value={formData.incoordinacion || 'NO'}
              onChange={(e) => handleChange('incoordinacion', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="caidas">{t('options.caidas_laterales')}</option>
              <option value="rodar">{t('options.rodar_sin_control')}</option>
              <option value="temblor_generalizado">{t('options.temblor_generalizado')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('temblor_muscular_antes_del_colapso')}</label>
            <select
              value={formData.temblor_pre_colapso || 'NO'}
              onChange={(e) => handleChange('temblor_pre_colapso', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('letargo_extremo')}</label>
            <select
              value={formData.letargo_extremo || ''}
              onChange={(e) => handleChange('letargo_extremo', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="duerme_todo_dia">{t('options.duerme_todo_el_dia')}</option>
              <option value="no_responde_estimul">{t('options.no_responde_a_estimulos')}</option>
              <option value="hipotermia">{t('options.hipotermia')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sistema Cutáneo */}
      <div id="cuyos-cutaneo" className="form-section">
        <h3>{section('cutaneo')}</h3>

        <div className="form-row">
          <div className="form-group">
            <label>{field('pelo_piel')}</label>
            <select
              required
              value={formData.pelo_piel || 'normal'}
              onChange={(e) => handleChange('pelo_piel', e.target.value)}
            >
              <option value="normal">{t('options.normal')}</option>
              <option value="alopecia_simetrica">{t('options.alopecia_simetrica')}</option>
              <option value="costras_cabeza_orejas">{t('options.costras_en_cabeza_orejas')}</option>
              <option value="ulceras_faciales">{t('options.ulceras_faciales')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('prurito_intenso')}</label>
            <select
              value={formData.prurito || 'ausente'}
              onChange={(e) => handleChange('prurito', e.target.value)}
            >
              <option value="ausente">{t('options.ausente')}</option>
              <option value="leve">{t('options.leve')}</option>
              <option value="intenso">{t('options.intenso')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('menton_barba_sucia')}</label>
            <select
              value={formData.barba_sucia || 'NO'}
              onChange={(e) => handleChange('barba_sucia', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="costras">{t('options.presencia_de_costras')}</option>
              <option value="hinchazon">{t('options.hinchazon')}</option>
              <option value="secrecion">{t('options.secrecion')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('asociado_a_comedero_de_plastico')}</label>
            <select
              value={formData.barba_comedero_plastico || 'NO'}
              onChange={(e) => handleChange('barba_comedero_plastico', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('orejas')}</label>
            <select
              value={formData.orejas || 'normales'}
              onChange={(e) => handleChange('orejas', e.target.value)}
            >
              <option value="normales">{t('options.normales')}</option>
              <option value="costras">{t('options.costras_en_interior')}</option>
              <option value="secrecion">{t('options.secrecion_marron')}</option>
              <option value="mal_olor">{t('options.mal_olor')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('acaros_visibles')}</label>
            <select
              value={formData.acaros_visibles || 'NO'}
              onChange={(e) => handleChange('acaros_visibles', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ojos */}
      <div id="cuyos-ojos" className="form-section">
        <h3>{section('ojos')}</h3>

        <div className="form-row">
          <div className="form-group">
            <label>{field('secrecion_ocular_2')}</label>
            <select
              required
              value={formData.secrecion_ocular || 'NO'}
              onChange={(e) => handleChange('secrecion_ocular', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="clara">{t('options.clara')}</option>
              <option value="purulenta">{t('options.purulenta')}</option>
              <option value="seca">{t('options.seca_crosta')}</option>
              <option value="sangre">{t('options.sangre')}</option>
            </select>
          </div>
          {formData.secrecion_ocular !== 'NO' && (
            <div className="form-group">
              <label>{field('unilateral_o_bilateral')}</label>
              <select
                value={formData.secrecion_ocular_localizacion || ''}
                onChange={(e) => handleChange('secrecion_ocular_localizacion', e.target.value)}
              >
                <option value="">{t('select')}</option>
                <option value="unilateral">{t('options.unilateral')}</option>
                <option value="bilateral">{t('options.bilateral')}</option>
              </select>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('ojos_afectados')}</label>
            <select
              value={formData.estado_ojos || 'normales'}
              onChange={(e) => handleChange('estado_ojos', e.target.value)}
            >
              <option value="normales">{t('options.normales')}</option>
              <option value="hinchazon">{t('options.hinchazon')}</option>
              <option value="opacidad">{t('options.opacidad_corneal')}</option>
              <option value="exoftalmia">{t('options.exoftalmia_ojo_salido')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('dolor_al_tacto')}</label>
            <select
              value={formData.dolor_ojos || 'NO'}
              onChange={(e) => handleChange('dolor_ojos', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
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
