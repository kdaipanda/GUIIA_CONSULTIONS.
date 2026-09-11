import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';
import { useSpeciesFormI18n } from '../../hooks/useSpeciesFormI18n';
import { normalizePetSex } from '../../lib/petSex';
import ReproductiveSexHint from './ReproductiveSexHint';

const ConejosForm = ({ formData, setFormData }) => {
  const { t, field, placeholder, section, title } = useSpeciesFormI18n('conejos');
  const sexo = normalizePetSex(formData.sexo);
  const [activeSection, setActiveSection] = useState('conejos-info-basica');

  const handleChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });
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
    { id: 'conejos-info-basica', labelKey: 'info_basica', icon: '📋' },
    { id: 'conejos-vacunacion', labelKey: 'vacunacion', icon: '💉' },
    { id: 'conejos-alimentacion', labelKey: 'alimentacion', icon: '🥗' },
    { id: 'conejos-ambiente', labelKey: 'ambiente', icon: '🏠' },
    { id: 'conejos-examen-fisico', labelKey: 'examen_fisico', icon: '🩺' },
    { id: 'conejos-digestivo', labelKey: 'digestivo', icon: '🫃' },
    { id: 'conejos-respiratorio', labelKey: 'respiratorio', icon: '🫁' },
    { id: 'conejos-reproductivo', labelKey: 'reproductivo', icon: '🔬' },
    { id: 'conejos-neurologico', labelKey: 'neurologico', icon: '🧠' },
    { id: 'conejos-musculoesqueletico', labelKey: 'musculoesqueletico', icon: '🦴' },
    { id: 'conejos-cutaneo', labelKey: 'cutaneo', icon: '🐾' },
    { id: 'conejos-ojos', labelKey: 'ojos', icon: '👁️' },
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
      <h2>{title('conejos')}</h2>

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
      <div id="conejos-info-basica" className="form-section">
        <h3>{section('info_basica')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('nombre_de_la_mascota')}</label>
            <input type="text" required value={formData.nombre_mascota || ''} onChange={(e) => handleChange('nombre_mascota', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{field('nombre_dueño')}</label>
            <input type="text" required value={formData.nombre_dueño || ''} onChange={(e) => handleChange('nombre_dueño', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('raza_exacta')}</label>
            <select required value={formData.raza || ''} onChange={(e) => handleChange('raza', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="holandes">{t('options.holandes')}</option>
              <option value="lionhead">{t('options.lionhead')}</option>
              <option value="flemish_giant">{t('options.flemish_giant')}</option>
              <option value="mixto">{t('options.mixto')}</option>
              <option value="enano">{t('options.enano')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('edad_anos_meses')}</label>
            <input type="text" required value={formData.edad || ''} onChange={(e) => handleChange('edad', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('sexo')}</label>
            <select required value={sexo || ''} onChange={(e) => handleChange('sexo', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="macho">{t('options.macho')}</option>
              <option value="hembra">{t('options.hembra')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('esterilizado')}</label>
            <select required value={formData.esterilizado || ''} onChange={(e) => handleChange('esterilizado', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </select>
          </div>
        </div>

        {formData.esterilizado === 'SI' && (
          <div className="form-row">
            <div className="form-group">
              <label>{field('fecha_de_esterilizacion')}</label>
              <input
                type="date"
                value={formData.esterilizacion_fecha || ''}
                onChange={(e) => handleChange('esterilizacion_fecha', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{field('tipo_de_esterilizacion')}</label>
              <select
                value={formData.esterilizacion_tipo || ''}
                onChange={(e) => handleChange('esterilizacion_tipo', e.target.value)}
              >
                <option value="">{t('select')}</option>
                <option value="quirurgico">{t('options.quirurgico')}</option>
                <option value="quimico">{t('options.quimico')}</option>
              </select>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>{field('peso_actual_g_kg')}</label>
            <input type="text" required value={formData.peso || ''} onChange={(e) => handleChange('peso', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{field('indice_de_condicion_corporal')}</label>
            <select required value={formData.condicion_corporal || ''} onChange={(e) => handleChange('condicion_corporal', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="1-3">{t('options.n_1_3_emaciado')}</option>
              <option value="4-5">{t('options.n_4_5_delgado')}</option>
              <option value="6-7">{t('options.n_6_7_ideal')}</option>
              <option value="8-9">{t('options.n_8_9_sobrepeso')}</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{field('duracion_del_problema')}</label>
          <select required value={formData.duracion_problema || ''} onChange={(e) => handleChange('duracion_problema', e.target.value)}>
            <option value="">{t('select')}</option>
            <option value="<12h">{t('options.lt_12_horas')}</option>
            <option value="12-24h">{t('options.n_12_24_horas')}</option>
            <option value="2-3dias">{t('options.n_2_3_dias')}</option>
            <option value="4-7dias">{t('options.n_4_7_dias')}</option>
            <option value=">1semana">{t('options.gt_1_semana')}</option>
          </select>
        </div>

        <div className="form-row">
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
              <option value="destructivo">{t('options.destructivo')}</option>
            </select>
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

      {/* Vacunación y Desparasitación */}
      <div id="conejos-vacunacion" className="form-section">
        <h3>{section('vacunacion')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('mixomatosis')}</label>
            <YesNoChips
              value={formData.vacuna_mixomatosis}
              onChange={(val) => handleChange('vacuna_mixomatosis', val)}
            />
          </div>
          {formData.vacuna_mixomatosis === 'SI' && (
            <div className="form-group">
              <label>{field('fecha_simple')}</label>
              <input type="date" value={formData.vacuna_mixomatosis_fecha || ''} onChange={(e) => handleChange('vacuna_mixomatosis_fecha', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('vhs_virus_hemorragico')}</label>
            <YesNoChips
              value={formData.vacuna_vhs}
              onChange={(val) => handleChange('vacuna_vhs', val)}
            />
          </div>
          {formData.vacuna_vhs === 'SI' && (
            <div className="form-group">
              <label>{field('fecha_simple')}</label>
              <input type="date" value={formData.vacuna_vhs_fecha || ''} onChange={(e) => handleChange('vacuna_vhs_fecha', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('desparasitacion_interna')}</label>
            <YesNoChips
              value={formData.desparasitacion_interna}
              onChange={(val) => handleChange('desparasitacion_interna', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('desparasitacion_externa')}</label>
            <YesNoChips
              value={formData.desparasitacion_externa}
              onChange={(val) => handleChange('desparasitacion_externa', val)}
            />
          </div>
        </div>

        {formData.desparasitacion_interna === 'SI' && (
          <div className="form-row">
            <div className="form-group">
              <label>{field('ultima_desparasitacion_interna_fecha')}</label>
              <input
                type="date"
                value={formData.desparasitacion_interna_fecha || ''}
                onChange={(e) => handleChange('desparasitacion_interna_fecha', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{field('producto_interna')}</label>
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
              <label>{field('ultima_desparasitacion_externa_fecha')}</label>
              <input
                type="date"
                value={formData.desparasitacion_externa_fecha || ''}
                onChange={(e) => handleChange('desparasitacion_externa_fecha', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{field('producto_externa')}</label>
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
        <h3>{section('alimentacion')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('tipo_de_heno')}</label>
            <select required value={formData.tipo_heno || ''} onChange={(e) => handleChange('tipo_heno', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="avena">{t('options.avena')}</option>
              <option value="alfalfa">{t('options.alfalfa')}</option>
              <option value="otro">{t('options.otro')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('frecuencia_de_heno_2')}</label>
            <select required value={formData.frecuencia_heno || ''} onChange={(e) => handleChange('frecuencia_heno', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="ilimitado">{t('options.ilimitado')}</option>
              <option value="limitado">{t('options.limitado')}</option>
              <option value="intermitente">{t('options.intermitente')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('pellets_marca')}</label>
            <input type="text" value={formData.pellets_marca || ''} onChange={(e) => handleChange('pellets_marca', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{field('cantidad_diaria_g')}</label>
            <input type="text" value={formData.pellets_cantidad || ''} onChange={(e) => handleChange('pellets_cantidad', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('verduras_frescas_2')}</label>
            <select required value={formData.verduras_frescas || ''} onChange={(e) => handleChange('verduras_frescas', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </select>
          </div>
          {formData.verduras_frescas === 'SI' && (
            <div className="form-group">
              <label>{field('cuales')}</label>
              <input type="text" value={formData.verduras_cuales || ''} onChange={(e) => handleChange('verduras_cuales', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>{field('suplementos')}</label>
          <input type="text" value={formData.suplementos || ''} onChange={(e) => handleChange('suplementos', e.target.value)} placeholder={placeholder('vitaminas_minerales_otros')} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>{field('dieta_rica_en_carbohidratos_2')}</label>
            <select
              value={formData.dieta_carbohidratos || 'NO'}
              onChange={(e) => handleChange('dieta_carbohidratos', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          {formData.dieta_carbohidratos === 'SI' && (
            <div className="form-group">
              <label>{field('detalles_frutas_pan_cereales')}</label>
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
        <h3>{section('ambiente')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('jaula_vivienda')}</label>
            <select required value={formData.vivienda || ''} onChange={(e) => handleChange('vivienda', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="interior">{t('options.habitat_interior')}</option>
              <option value="exterior">{t('options.habitat_exterior')}</option>
              <option value="mixto">{t('options.mixto')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('tamano_de_espacio_m')}</label>
            <input type="text" value={formData.tamano_espacio || ''} onChange={(e) => handleChange('tamano_espacio', e.target.value)} placeholder={placeholder('minimo_2_5_m_area_ejercicio')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('temperatura_ambiente_c_2')}</label>
            <input type="text" value={formData.temperatura_ambiente || ''} onChange={(e) => handleChange('temperatura_ambiente', e.target.value)} placeholder={placeholder('ideal_16_21_c')} />
          </div>
          <div className="form-group">
            <label>{field('humedad')}</label>
            <input type="text" value={formData.humedad || ''} onChange={(e) => handleChange('humedad', e.target.value)} placeholder={placeholder('ideal_40_60')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('superficie_del_piso_2')}</label>
            <select required value={formData.superficie_piso || ''} onChange={(e) => handleChange('superficie_piso', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="alambre">{t('options.alambre')}</option>
              <option value="madera">{t('options.madera')}</option>
              <option value="felpa">{t('options.felpa')}</option>
              <option value="cemento">{t('options.cemento')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('tiempo_de_ejercicio_diario_horas')}</label>
            <input type="text" value={formData.tiempo_ejercicio || ''} onChange={(e) => handleChange('tiempo_ejercicio', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
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
          <div className="form-group">
            <label>{field('saltos_frecuentes_2')}</label>
            <select
              value={formData.saltos_frecuentes || 'NO'}
              onChange={(e) => handleChange('saltos_frecuentes', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
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
          <div className="form-group">
            <label>{field('peleas_recientes_2')}</label>
            <select
              value={formData.peleas_recientes || 'NO'}
              onChange={(e) => handleChange('peleas_recientes', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>
        {formData.peleas_recientes === 'SI' && (
          <div className="form-group">
            <label>{field('lesiones_por_peleas')}</label>
            <input
              type="text"
              value={formData.peleas_lesiones || ''}
              onChange={(e) => handleChange('peleas_lesiones', e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label>{field('limpieza_de_jaula_3')}</label>
          <select required value={formData.limpieza_jaula || ''} onChange={(e) => handleChange('limpieza_jaula', e.target.value)}>
            <option value="">{t('select')}</option>
            <option value="diaria">{t('options.diaria')}</option>
            <option value="cada_2_dias">{t('options.cada_2_dias')}</option>
            <option value="semanal">{t('options.semanal')}</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('uso_de_productos_quimicos')}</label>
            <YesNoChips
              value={formData.uso_quimicos}
              onChange={(val) => handleChange('uso_quimicos', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('banos_frecuentes')}</label>
            <YesNoChips
              value={formData.banos_frecuentes}
              onChange={(val) => handleChange('banos_frecuentes', val)}
            />
          </div>
        </div>
        {formData.uso_quimicos === 'SI' && (
          <div className="form-group">
            <label>{field('cuales_productos_quimicos')}</label>
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
        <h3>{section('examen_fisico')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('temperatura')}</label>
            <input type="text" value={formData.temperatura || ''} onChange={(e) => handleChange('temperatura', e.target.value)} placeholder={placeholder('normal_38_5_39_5_c')} />
          </div>
          <div className="form-group">
            <label>{field('frecuencia_cardiaca')}</label>
            <input type="text" value={formData.frecuencia_cardiaca || ''} onChange={(e) => handleChange('frecuencia_cardiaca', e.target.value)} placeholder={placeholder('normal_180_250')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('frecuencia_respiratoria')}</label>
            <input type="text" value={formData.frecuencia_respiratoria || ''} onChange={(e) => handleChange('frecuencia_respiratoria', e.target.value)} placeholder={placeholder('normal_30_60')} />
          </div>
          <div className="form-group">
            <label>{field('hidratacion')}</label>
            <select value={formData.hidratacion || ''} onChange={(e) => handleChange('hidratacion', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="5">{t('options.n_5_piel_vuelve_rapido')}</option>
              <option value="6-8">{t('options.n_6_8_piel_lenta')}</option>
              <option value=">10%">{t('options.gt_10_piel_no_vuelve')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('color_de_mucosas_2')}</label>
            <select value={formData.mucosas || ''} onChange={(e) => handleChange('mucosas', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="rosado">{t('options.rosado')}</option>
              <option value="palido">{t('options.palido')}</option>
              <option value="icterico">{t('options.icterico')}</option>
              <option value="cianotico">{t('options.cianotico')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('estado_dental_2')}</label>
            <select value={formData.estado_dental || ''} onChange={(e) => handleChange('estado_dental', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="normal">{t('options.normal')}</option>
              <option value="sobrecrecimiento">{t('options.sobrecrecimiento')}</option>
              <option value="abscesos">{t('options.dientes_abscesos')}</option>
              <option value="rotos">{t('options.dientes_rotos')}</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>{field('tiempo_de_relleno_capilar_trc')}</label>
            <input
              type="text"
              value={formData.trc || ''}
              onChange={(e) => handleChange('trc', e.target.value)}
              placeholder={placeholder('normal_2_seg')}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('peso_corporal_g_kg')}</label>
            <input
              type="text"
              value={formData.peso_corporal || ''}
              onChange={(e) => handleChange('peso_corporal', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{field('perdida_ganancia_de_peso')}</label>
            <input
              type="text"
              value={formData.peso_cambio_porcentaje || ''}
              onChange={(e) => handleChange('peso_cambio_porcentaje', e.target.value)}
            />
          </div>
        </div>

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
      </div>

      {/* Sistema Digestivo */}
      <div id="conejos-digestivo" className="form-section">
        <h3>{section('digestivo')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('apetito')}</label>
            <select required value={formData.apetito || 'normal'} onChange={(e) => handleChange('apetito', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="anorexia_total">{t('options.totalmente_anorexico_gt_12h')}</option>
              <option value="anorexia_parcial">{t('options.parcialmente_anorexico')}</option>
            </select>
          </div>
          {(formData.apetito === 'anorexia_total' || formData.apetito === 'anorexia_parcial') && (
            <div className="form-group">
              <label>{field('tiempo_sin_comer_horas')}</label>
              <input type="text" value={formData.tiempo_sin_comer || ''} onChange={(e) => handleChange('tiempo_sin_comer', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('come_heno_2')}</label>
            <select required value={formData.come_heno || ''} onChange={(e) => handleChange('come_heno', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('come_pellets')}</label>
            <select required value={formData.come_pellets || ''} onChange={(e) => handleChange('come_pellets', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('come_frutas_y_verduras')}</label>
            <select
              value={formData.come_frutas_verduras || ''}
              onChange={(e) => handleChange('come_frutas_verduras', e.target.value)}
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
            <select required value={formData.heces || 'normales'} onChange={(e) => handleChange('heces', e.target.value)}>
              <option value="normales">{t('options.normales')}</option>
              <option value="ausentes">{t('options.ausentes_gt_12h')}</option>
              <option value="pequenas_duras">{t('options.pequenas_y_duras')}</option>
              <option value="blandas">{t('options.blandas_pastosas')}</option>
              <option value="en_racimo">{t('options.en_racimo')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('frecuencia_veces_dia')}</label>
            <input type="text" value={formData.heces_frecuencia || ''} onChange={(e) => handleChange('heces_frecuencia', e.target.value)} placeholder={placeholder('normal_100_300_segun_tamano')} />
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
            <label>{field('estomago_abdomen_2')}</label>
            <select required value={formData.abdomen || 'normal'} onChange={(e) => handleChange('abdomen', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="distendido">{t('options.distendido')}</option>
              <option value="doloroso">{t('options.doloroso_al_tacto')}</option>
              <option value="ruidos_ausentes">{t('options.ruidos_intestinales_ausentes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('regurgitacion_2')}</label>
            <YesNoChips
              value={formData.regurgitacion}
              onChange={(val) => handleChange('regurgitacion', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('palpacion_de_bolas_de_pelo')}</label>
            <YesNoChips
              value={formData.bolas_pelo}
              onChange={(val) => handleChange('bolas_pelo', val)}
            />
          </div>
          {formData.bolas_pelo === 'SI' && (
            <div className="form-group">
              <label>{field('ubicacion_de_bolas_de_pelo')}</label>
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
            <label>{field('cambio_reciente_de_dieta')}</label>
            <YesNoChips
              value={formData.desencadenante_dieta}
              onChange={(val) => handleChange('desencadenante_dieta', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('estres_mudanza_veterinario')}</label>
            <YesNoChips
              value={formData.desencadenante_estres}
              onChange={(val) => handleChange('desencadenante_estres', val)}
            />
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
      <div id="conejos-respiratorio" className="form-section">
        <h3>{section('respiratorio')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('secrecion_nasal')}</label>
            <select required value={formData.secrecion_nasal || 'NO'} onChange={(e) => handleChange('secrecion_nasal', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="clara">{t('options.clara_moco')}</option>
              <option value="purulenta">{t('options.purulenta_amarilla_verde')}</option>
              <option value="sangre">{t('options.sangre')}</option>
              <option value="caseosa">{t('options.caseosa')}</option>
            </select>
          </div>
          {formData.secrecion_nasal !== 'NO' && (
            <div className="form-group">
              <label>{field('localizacion')}</label>
              <select value={formData.secrecion_localizacion || ''} onChange={(e) => handleChange('secrecion_localizacion', e.target.value)}>
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
            <select required value={formData.respiracion || 'normal'} onChange={(e) => handleChange('respiracion', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="ruidosa">{t('options.ruidosa')}</option>
              <option value="dificultad_inhalar">{t('options.dificultad_para_inhalar')}</option>
              <option value="dificultad_exhalar">{t('options.dificultad_para_exhalar')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('estornudos_2')}</label>
            <select required value={formData.estornudos || 'NO'} onChange={(e) => handleChange('estornudos', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="aislados">{t('options.aislados')}</option>
              <option value="frecuentes">{t('options.frecuentes')}</option>
              <option value="con_secrecion">{t('options.con_secrecion')}</option>
              <option value="sin_secrecion">{t('options.sin_secrecion')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
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

        <div className="form-row">
          <div className="form-group">
            <label>{field('presencia_de_costras_en_nariz_2')}</label>
            <select
              value={formData.costras_nariz || 'NO'}
              onChange={(e) => handleChange('costras_nariz', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sistema Reproductivo */}
      <div id="conejos-reproductivo" className="form-section">
        <h3>{section('reproductivo')}</h3>
                <ReproductiveSexHint sexo={sexo} />
        {sexo === 'hembra' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>{field('ultimo_celo_parto_dias_atras_2')}</label>
                <input type="text" value={formData.ultimo_celo || ''} onChange={(e) => handleChange('ultimo_celo', e.target.value)} />
              </div>
              <div className="form-group">
                <label>{field('secrecion_vaginal_2')}</label>
                <select value={formData.secrecion_vaginal || 'NO'} onChange={(e) => handleChange('secrecion_vaginal', e.target.value)}>
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
              <label>{field('hinchazon_abdominal_4')}</label>
              <select required value={formData.hinchazon_abdominal || 'NO'} onChange={(e) => handleChange('hinchazon_abdominal', e.target.value)}>
                <option value="NO">{t('no')}</option>
                <option value="SI">{t('yes')}</option>
              </select>
            </div>
            {formData.hinchazon_abdominal === 'SI' && (
              <div className="form-group">
                <label>{field('tamano_de_hinchazon_abdominal')}</label>
                <input
                  type="text"
                  value={formData.hinchazon_abdominal_tamano || ''}
                  onChange={(e) => handleChange('hinchazon_abdominal_tamano', e.target.value)}
                />
              </div>
            )}
          </>
        )}

        {sexo === 'macho' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>{field('testiculos_descendidos_3')}</label>
                <select required value={formData.testiculos_descendidos || ''} onChange={(e) => handleChange('testiculos_descendidos', e.target.value)}>
                  <option value="">{t('select')}</option>
                  <option value="SI">{t('yes')}</option>
                  <option value="NO">{t('no')}</option>
                  <option value="uno">{t('options.uno_solo')}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{field('hinchazon_escrotal_2')}</label>
                <select required value={formData.hinchazon_escrotal || 'NO'} onChange={(e) => handleChange('hinchazon_escrotal', e.target.value)}>
                  <option value="NO">{t('no')}</option>
                  <option value="SI">{t('yes')}</option>
                </select>
              </div>
            </div>
            {formData.hinchazon_escrotal === 'SI' && (
              <div className="form-group">
                <label>{field('caracteristicas_de_la_hinchazon_escrotal')}</label>
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
        <h3>{section('neurologico')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('inclinacion_de_cabeza')}</label>
            <select required value={formData.inclinacion_cabeza || 'NO'} onChange={(e) => handleChange('inclinacion_cabeza', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="leve">{t('options.leve_15')}</option>
              <option value="moderada">{t('options.moderada_45')}</option>
              <option value="severa">{t('options.severa_90')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('nistagmo')}</label>
            <select value={formData.nistagmo || 'NO'} onChange={(e) => handleChange('nistagmo', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="horizontal">{t('options.horizontal')}</option>
              <option value="vertical">{t('options.vertical')}</option>
              <option value="rotatorio">{t('options.rotatorio')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('movimientos_anormales')}</label>
            <select required value={formData.movimientos_anormales || 'NO'} onChange={(e) => handleChange('movimientos_anormales', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="caidas">{t('options.caidas_laterales')}</option>
              <option value="rodar">{t('options.rodar_sin_control')}</option>
              <option value="temblor">{t('options.temblor_generalizado')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('mejora_con_reposo')}</label>
            <select
              value={formData.mejora_reposo || 'NO'}
              onChange={(e) => handleChange('mejora_reposo', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('desencadenado_por_movimiento')}</label>
            <select
              value={formData.desencadenado_movimiento || 'NO'}
              onChange={(e) => handleChange('desencadenado_movimiento', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('cambios_de_comportamiento')}</label>
            <select
              value={formData.cambios_comportamiento || 'NO'}
              onChange={(e) => handleChange('cambios_comportamiento', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="letargo_extremo">{t('options.letargo_extremo')}</option>
              <option value="agresividad_repentina">{t('options.agresividad_repentina')}</option>
              <option value="no_responde_estimul">{t('options.no_responde_a_estimulos')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('perdida_de_vision')}</label>
            <select
              value={formData.perdida_vision || 'NO'}
              onChange={(e) => handleChange('perdida_vision', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>
        {formData.perdida_vision === 'SI' && (
          <div className="form-group">
            <label>{field('perdida_de_vision_confirmada_por')}</label>
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
        <h3>{section('musculoesqueletico')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('cojera_movimiento')}</label>
            <select required value={formData.cojera || 'normal'} onChange={(e) => handleChange('cojera', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="no_saltar">{t('options.no_puede_saltar')}</option>
              <option value="evita_erectas">{t('options.evita_posiciones_erectas')}</option>
              <option value="arrastra">{t('options.se_arrastra')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('localizacion')}</label>
            <select value={formData.cojera_localizacion || ''} onChange={(e) => handleChange('cojera_localizacion', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="patas_traseras">{t('options.patas_traseras')}</option>
              <option value="patas_delanteras">{t('options.patas_delanteras')}</option>
              <option value="ambas">{t('options.ambas')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('patas')}</label>
            <select required value={formData.patas || 'normales'} onChange={(e) => handleChange('patas', e.target.value)}>
              <option value="normales">{t('options.normales')}</option>
              <option value="ulceras">{t('options.ulceras_en_almohadillas')}</option>
              <option value="perdida_pelo">{t('options.perdida_de_pelo')}</option>
              <option value="hinchazon">{t('options.hinchazon')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('dolor_al_manipular_columna_2')}</label>
            <select
              value={formData.dolor_columna || 'NO'}
              onChange={(e) => handleChange('dolor_columna', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          {formData.dolor_columna === 'SI' && (
            <div className="form-group">
              <label>{field('ubicacion_del_dolor_en_columna')}</label>
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
            <label>{field('gravedad_escala_1_4')}</label>
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
        <h3>{section('cutaneo')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('pelo_piel')}</label>
            <select required value={formData.pelo_piel || 'normal'} onChange={(e) => handleChange('pelo_piel', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="alopecia_simetrica">{t('options.alopecia_simetrica')}</option>
              <option value="costras">{t('options.costras_en_cabeza_orejas')}</option>
              <option value="ulceras">{t('options.ulceras_faciales')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('prurito_intenso_2')}</label>
            <select required value={formData.prurito || 'ausente'} onChange={(e) => handleChange('prurito', e.target.value)}>
              <option value="ausente">{t('options.ausente')}</option>
              <option value="leve">{t('options.leve')}</option>
              <option value="intenso">{t('options.intenso')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('menton_barba_sucia_2')}</label>
            <select required value={formData.barba_sucia || 'NO'} onChange={(e) => handleChange('barba_sucia', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="costras">{t('options.presencia_de_costras')}</option>
              <option value="hinchazon">{t('options.hinchazon')}</option>
              <option value="secrecion">{t('options.secrecion')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('orejas')}</label>
            <select value={formData.orejas || 'normales'} onChange={(e) => handleChange('orejas', e.target.value)}>
              <option value="normales">{t('options.normales')}</option>
              <option value="costras">{t('options.costras_en_interior')}</option>
              <option value="secrecion">{t('options.secrecion_marron')}</option>
              <option value="mal_olor">{t('options.mal_olor')}</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{field('localizacion_especifica_de_lesiones')}</label>
          <input
            type="text"
            value={formData.localizacion_cutanea || ''}
            onChange={(e) => handleChange('localizacion_cutanea', e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('acaros_visibles_2')}</label>
            <select
              value={formData.acaros_visibles || 'NO'}
              onChange={(e) => handleChange('acaros_visibles', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          {formData.acaros_visibles === 'SI' && (
            <div className="form-group">
              <label>{field('tipo_de_acaros')}</label>
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
        <h3>{section('ojos')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('secrecion_ocular')}</label>
            <select required value={formData.secrecion_ocular || 'NO'} onChange={(e) => handleChange('secrecion_ocular', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="clara">{t('options.clara')}</option>
              <option value="purulenta">{t('options.purulenta')}</option>
              <option value="seca">{t('options.seca_costra')}</option>
              <option value="sangre">{t('options.sangre')}</option>
            </select>
          </div>
          {formData.secrecion_ocular !== 'NO' && (
            <div className="form-group">
              <label>{field('localizacion')}</label>
              <select value={formData.secrecion_ocular_localizacion || ''} onChange={(e) => handleChange('secrecion_ocular_localizacion', e.target.value)}>
                <option value="">{t('select')}</option>
                <option value="unilateral">{t('options.unilateral')}</option>
                <option value="bilateral">{t('options.bilateral')}</option>
              </select>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('estado_de_ojos')}</label>
            <select required value={formData.estado_ojos || 'normales'} onChange={(e) => handleChange('estado_ojos', e.target.value)}>
              <option value="normales">{t('options.normales')}</option>
              <option value="hinchazon">{t('options.hinchazon')}</option>
              <option value="opacidad">{t('options.opacidad_corneal')}</option>
              <option value="exoftalmia">{t('options.exoftalmia_ojo_salido')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('mejora_con_limpieza_ocular')}</label>
            <select
              value={formData.mejora_limpieza_ocular || 'NO'}
              onChange={(e) => handleChange('mejora_limpieza_ocular', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('dolor_al_tacto_2')}</label>
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

export default ConejosForm;
