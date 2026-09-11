import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';
import { useSpeciesFormI18n } from '../../hooks/useSpeciesFormI18n';
import { normalizePetSex } from '../../lib/petSex';
import ReproductiveSexHint from './ReproductiveSexHint';

const ErizosForm = ({ formData, setFormData }) => {
  const { t, field, placeholder, section, title } = useSpeciesFormI18n('erizos');
  const sexo = normalizePetSex(formData.sexo);
  const [activeSection, setActiveSection] = useState('erizos-info-basica');

  const handleChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });
  };

  const toggleSection = useCallback((e) => {
    const section = e.target.closest('.form-section');
    if (section && e.target.tagName === 'H3') section.classList.toggle('collapsed');
  }, []);

  const requiredFields = [
    'nombre_mascota', 'nombre_dueño', 'edad', 'sexo', 'peso', 'condicion_corporal',
    'desparasitacion_interna', 'tipo_dieta', 'habitat', 'temperatura_ambiente',
    'secrecion_nasal', 'respiracion', 'apetito', 'heces', 'puas'
  ];

  const progress = useMemo(() => {
    const filled = requiredFields.filter(field => formData[field] && formData[field] !== '').length;
    return Math.round((filled / requiredFields.length) * 100);
  }, [formData]);

  const sections = [
    { id: 'erizos-info-basica', labelKey: 'info_basica', icon: '📋' },
    { id: 'erizos-historial', labelKey: 'historial_medico', icon: '📁' },
    { id: 'erizos-alimentacion', labelKey: 'alimentacion', icon: '🥗' },
    { id: 'erizos-ambiente', labelKey: 'ambiente', icon: '🏠' },
    { id: 'erizos-ejercicio', label: 'Ejercicio', icon: '🏃' },
    { id: 'erizos-socializacion', label: 'Socialización', icon: '🤝' },
    { id: 'erizos-higiene', label: 'Higiene', icon: '🚿' },
    { id: 'erizos-respiratorio', labelKey: 'respiratorio', icon: '🫁' },
    { id: 'erizos-digestivo', labelKey: 'digestivo', icon: '🫃' },
    { id: 'erizos-tegumentario', label: 'Sistema Tegumentario', icon: '🦔' },
    { id: 'erizos-examen', labelKey: 'examen_fisico', icon: '🩺' },
    { id: 'erizos-neurologico', labelKey: 'neurologico', icon: '🧠' },
    { id: 'erizos-dental', label: 'Sistema Dental', icon: '🦷' },
    { id: 'erizos-reproductivo', labelKey: 'reproductivo', icon: '🔬' },
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
      <h2>{title('erizos')}</h2>

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
      
      <div id="erizos-info-basica" className="form-section">
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
            <label>{field('edad_anos_meses')}</label>
            <input type="text" required value={formData.edad || ''} onChange={(e) => handleChange('edad', e.target.value)} placeholder={placeholder('adulto_gt_6_meses_senior_gt_3_anos')} />
          </div>
          <div className="form-group">
            <label>{field('sexo')}</label>
            <select required value={sexo || ''} onChange={(e) => handleChange('sexo', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="macho">{t('options.macho')}</option>
              <option value="hembra">{t('options.hembra')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('esterilizado')}</label>
            <select required value={formData.esterilizado || ''} onChange={(e) => handleChange('esterilizado', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('peso_actual_g_2')}</label>
            <input type="text" required value={formData.peso || ''} onChange={(e) => handleChange('peso', e.target.value)} placeholder={placeholder('normal_300_600g')} />
          </div>
        </div>

        <div className="form-row">
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
          <div className="form-group">
            <label>{field('temperamento')}</label>
            <select value={formData.temperamento || 'tranquilo'} onChange={(e) => handleChange('temperamento', e.target.value)}>
              <option value="activo">{t('options.actividad_activo')}</option>
              <option value="letargico">{t('options.letargico')}</option>
              <option value="agresivo">{t('options.agresivo')}</option>
              <option value="timido">{t('options.timido')}</option>
              <option value="hiperactivo">{t('options.hiperactivo')}</option>
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
      </div>

      <div id="erizos-historial" className="form-section">
        <h3>{section('historial_medico')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('desparasitacion_interna')}</label>
            <YesNoChips
              value={formData.desparasitacion_interna}
              onChange={(val) => handleChange('desparasitacion_interna', val)}
            />
          </div>
          {formData.desparasitacion_interna === 'SI' && (
            <div className="form-group">
              <label>{field('producto_fecha')}</label>
              <input type="text" value={formData.despara_interna_producto || ''} onChange={(e) => handleChange('despara_interna_producto', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('desparasitacion_externa')}</label>
            <YesNoChips
              value={formData.desparasitacion_externa}
              onChange={(val) => handleChange('desparasitacion_externa', val)}
            />
          </div>
          {formData.desparasitacion_externa === 'SI' && (
            <div className="form-group">
              <label>{field('producto_fecha')}</label>
              <input type="text" value={formData.despara_externa_producto || ''} onChange={(e) => handleChange('despara_externa_producto', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('tratamiento_para_sarna')}</label>
            <YesNoChips
              value={formData.tratamiento_sarna}
              onChange={(val) => handleChange('tratamiento_sarna', val)}
            />
          </div>
        </div>
      </div>

      <div id="erizos-alimentacion" className="form-section">
        <h3>{section('alimentacion')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('tipo_de_dieta_2')}</label>
            <select required value={formData.tipo_dieta || ''} onChange={(e) => handleChange('tipo_dieta', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="comercial">{t('options.comercial_especifica')}</option>
              <option value="casera">{t('options.casera')}</option>
              <option value="mixta">{t('options.mixta')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('marca_y_composicion')}</label>
            <input type="text" value={formData.marca_alimento || ''} onChange={(e) => handleChange('marca_alimento', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('come_insectos')}</label>
            <YesNoChips
              value={formData.come_insectos}
              onChange={(val) => handleChange('come_insectos', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('come_pellets')}</label>
            <YesNoChips
              value={formData.come_pellets}
              onChange={(val) => handleChange('come_pellets', val)}
            />
          </div>
        </div>
      </div>

      <div id="erizos-ambiente" className="form-section">
        <h3>{section('ambiente')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('habitat')}</label>
            <select required value={formData.habitat || ''} onChange={(e) => handleChange('habitat', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="jaula">{t('options.jaula')}</option>
              <option value="corral">{t('options.corral')}</option>
              <option value="pecera">{t('options.pecera')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('ubicacion_2')}</label>
            <select required value={formData.ubicacion || ''} onChange={(e) => handleChange('ubicacion', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="interior">{t('options.habitat_interior')}</option>
              <option value="exterior">{t('options.habitat_exterior')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('uso_de_placa_termica')}</label>
            <YesNoChips
              value={formData.placa_termica}
              onChange={(val) => handleChange('placa_termica', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('superficie_donde_vive')}</label>
            <select required value={formData.superficie || ''} onChange={(e) => handleChange('superficie', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="alfombra">{t('options.alfombra')}</option>
              <option value="piso_duro">{t('options.piso_duro')}</option>
              <option value="sustrato">{t('options.sustrato_aserrin')}</option>
              <option value="jaula_barrotes">{t('options.jaula_con_barrotes')}</option>
              <option value="otro">{t('options.otro')}</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{field('limpieza_de_jaula_3')}</label>
          <select required value={formData.limpieza_jaula || ''} onChange={(e) => handleChange('limpieza_jaula', e.target.value)}>
            <option value="">{t('select')}</option>
            <option value="diaria">{t('options.diaria')}</option>
            <option value="cada_2_dias">{t('options.cada_2_dias')}</option>
            <option value="semanal">{t('options.semanal')}</option>
          </select>
        </div>
      </div>

      <div id="erizos-ejercicio" className="form-section">
        <h3>Ejercicio</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('tiempo_de_actividad_nocturna_horas')}</label>
            <input
              type="text"
              value={formData.actividad_nocturna_horas || ''}
              onChange={(e) => handleChange('actividad_nocturna_horas', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{field('tipo_de_ejercicio')}</label>
            <select
              value={formData.tipo_ejercicio || ''}
              onChange={(e) => handleChange('tipo_ejercicio', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="rueda">{t('options.rueda')}</option>
              <option value="tuneles">{t('options.tuneles')}</option>
              <option value="libre_habitacion">{t('options.libre_en_habitacion')}</option>
            </select>
          </div>
        </div>
      </div>

      <div id="erizos-socializacion" className="form-section">
        <h3>Socialización</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('vive')}</label>
            <select
              value={formData.socializacion_tipo || ''}
              onChange={(e) => handleChange('socializacion_tipo', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="solo">{t('options.solo')}</option>
              <option value="pareja">{t('options.pareja')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('peleas_recientes_2')}</label>
            <YesNoChips
              value={formData.peleas_recientes}
              onChange={(val) => handleChange('peleas_recientes', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('compatible_con_companeros_2')}</label>
            <YesNoChips
              value={formData.compatibilidad_companeros}
              onChange={(val) => handleChange('compatibilidad_companeros', val)}
            />
          </div>
        </div>
      </div>

      <div id="erizos-higiene" className="form-section">
        <h3>Higiene</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('lavado_de_comederos_bebederos')}</label>
            <select
              value={formData.lavado_comederos || ''}
              onChange={(e) => handleChange('lavado_comederos', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="diario">{t('options.diario')}</option>
              <option value="cada_2_dias">{t('options.cada_2_dias')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('uso_de_desinfectantes_2')}</label>
            <YesNoChips
              value={formData.uso_desinfectantes}
              onChange={(val) => handleChange('uso_desinfectantes', val)}
            />
          </div>
        </div>
      </div>

      <div id="erizos-respiratorio" className="form-section">
        <h3>{section('respiratorio')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('secrecion_nasal')}</label>
            <select required value={formData.secrecion_nasal || 'NO'} onChange={(e) => handleChange('secrecion_nasal', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="clara">{t('options.clara_moco')}</option>
              <option value="purulenta">{t('options.purulenta_amarilla_verde')}</option>
              <option value="sangre">{t('options.sangre')}</option>
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
            <label>{field('frecuencia_respiratoria')}</label>
            <input type="text" value={formData.frecuencia_respiratoria || ''} onChange={(e) => handleChange('frecuencia_respiratoria', e.target.value)} placeholder={placeholder('normal_40_60')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('costras_en_nariz_orejas')}</label>
            <YesNoChips
              value={formData.costras_nariz_orejas}
              onChange={(val) => handleChange('costras_nariz_orejas', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('ronquidos_o_estertores')}</label>
            <YesNoChips
              value={formData.ronquidos_estertores}
              onChange={(val) => handleChange('ronquidos_estertores', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('estornudos')}</label>
            <select
              value={formData.estornudos || ''}
              onChange={(e) => handleChange('estornudos', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="aislados">{t('options.aislados')}</option>
              <option value="frecuentes">{t('options.frecuentes')}</option>
              <option value="con_secrecion">{t('options.con_secrecion')}</option>
              <option value="sin_secrecion">{t('options.sin_secrecion')}</option>
            </select>
          </div>
        </div>
      </div>

      <div id="erizos-digestivo" className="form-section">
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
            <label>{field('rechaza_comida_humeda')}</label>
            <YesNoChips
              value={formData.rechaza_comida_humeda}
              onChange={(val) => handleChange('rechaza_comida_humeda', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('heces')}</label>
            <select required value={formData.heces || 'normal'} onChange={(e) => handleChange('heces', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="ausentes">{t('options.ausentes_gt_24h')}</option>
              <option value="blandas">{t('options.blandas_pastosas')}</option>
              <option value="liquidas">{t('options.liquidas')}</option>
              <option value="con_sangre">{t('options.con_sangre')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('frecuencia_veces_dia')}</label>
            <input type="text" value={formData.heces_frecuencia || ''} onChange={(e) => handleChange('heces_frecuencia', e.target.value)} placeholder={placeholder('normal_1_3_veces_dia')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('color_de_las_heces')}</label>
            <select
              value={formData.heces_color || ''}
              onChange={(e) => handleChange('heces_color', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="marron_oscuro">{t('options.marron_oscuro')}</option>
              <option value="amarillo">{t('options.amarillo')}</option>
              <option value="verde">{t('options.verde')}</option>
              <option value="rojizo">{t('options.rojizo_sangre')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('presencia_de_moco_2')}</label>
            <YesNoChips
              value={formData.heces_moco}
              onChange={(val) => handleChange('heces_moco', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('presencia_de_parasitos_3')}</label>
            <YesNoChips
              value={formData.heces_parasitos}
              onChange={(val) => handleChange('heces_parasitos', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('abdomen')}</label>
            <select
              value={formData.abdomen || ''}
              onChange={(e) => handleChange('abdomen', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="distendido">{t('options.distendido')}</option>
              <option value="doloroso">{t('options.doloroso_al_tacto')}</option>
              <option value="ruidos_ausentes">{t('options.ruidos_intestinales_ausentes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('deshidratacion_visible')}</label>
            <YesNoChips
              value={formData.deshidratacion_visible}
              onChange={(val) => handleChange('deshidratacion_visible', val)}
            />
          </div>
        </div>
      </div>

      <div id="erizos-tegumentario" className="form-section">
        <h3>Sistema Tegumentario</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('puas')}</label>
            <select required value={formData.puas || 'normales'} onChange={(e) => handleChange('puas', e.target.value)}>
              <option value="normales">{t('options.normales')}</option>
              <option value="caida_simetrica">{t('options.caida_simetrica')}</option>
              <option value="caida_localizada">{t('options.caida_localizada')}</option>
              <option value="rotas">{t('options.puas_rotas')}</option>
              <option value="con_costras">{t('options.con_costras')}</option>
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
            <label>{field('piel_2')}</label>
            <select required value={formData.piel || 'normal'} onChange={(e) => handleChange('piel', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="descamacion">{t('options.descamacion_excesiva')}</option>
              <option value="costras">{t('options.costras_en_cabeza')}</option>
              <option value="ulceras">{t('options.ulceras_faciales')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('acaros_visibles_3')}</label>
            <YesNoChips
              value={formData.acaros}
              onChange={(val) => handleChange('acaros', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('piel_seca_grasa')}</label>
            <YesNoChips
              value={formData.piel_seca_grasa}
              onChange={(val) => handleChange('piel_seca_grasa', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('pies')}</label>
            <select
              value={formData.pies || ''}
              onChange={(e) => handleChange('pies', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="ulceras_almohadillas">{t('options.ulceras_en_almohadillas')}</option>
              <option value="hinchazon">{t('options.hinchazon')}</option>
              <option value="sangrado">{t('options.sangrado')}</option>
            </select>
          </div>
        </div>
      </div>

      <div id="erizos-examen" className="form-section">
        <h3>{section('examen_fisico')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('temperatura')}</label>
            <input type="text" value={formData.temperatura || ''} onChange={(e) => handleChange('temperatura', e.target.value)} placeholder={placeholder('normal_32_35_c')} />
          </div>
          <div className="form-group">
            <label>{field('peso_corporal_g_2')}</label>
            <input type="text" value={formData.peso_corporal || ''} onChange={(e) => handleChange('peso_corporal', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('color_de_mucosas_2')}</label>
            <select value={formData.mucosas || 'rosado'} onChange={(e) => handleChange('mucosas', e.target.value)}>
              <option value="rosado">{t('options.rosado')}</option>
              <option value="palido">{t('options.palido')}</option>
              <option value="icterico">{t('options.icterico')}</option>
              <option value="cianotico">{t('options.cianotico')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('estado_de_hidratacion_2')}</label>
            <select value={formData.hidratacion || 'normal'} onChange={(e) => handleChange('hidratacion', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="leve">{t('options.leve')}</option>
              <option value="moderado">{t('options.moderado')}</option>
              <option value="severo">{t('options.severo')}</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('tiempo_de_relleno_capilar_trc_segundos')}</label>
            <input
              type="text"
              value={formData.trc_segundos || ''}
              onChange={(e) => handleChange('trc_segundos', e.target.value)}
            />
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

        <div className="form-row">
          <div className="form-group">
            <label>{field('estado_de_las_puas')}</label>
            <select
              value={formData.estado_puas || ''}
              onChange={(e) => handleChange('estado_puas', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="completo">{t('options.completo')}</option>
              <option value="perdida_parcial">{t('options.perdida_parcial')}</option>
              <option value="perdida_total">{t('options.perdida_total')}</option>
            </select>
          </div>
        </div>
      </div>

      <div id="erizos-neurologico" className="form-section">
        <h3>{section('neurologico')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('inestabilidad')}</label>
            <select
              value={formData.inestabilidad || ''}
              onChange={(e) => handleChange('inestabilidad', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="temblor_patas_traseras">{t('options.temblor_en_patas_traseras')}</option>
              <option value="caidas_laterales">{t('options.caidas_laterales')}</option>
              <option value="no_mantiene_derecho">{t('options.no_puede_mantenerse_derecho')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('progresion')}</label>
            <select
              value={formData.progresion || ''}
              onChange={(e) => handleChange('progresion', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="lenta">{t('options.lenta_meses')}</option>
              <option value="rapida">{t('options.rapida_semanas')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('convulsiones')}</label>
            <select
              value={formData.convulsiones || ''}
              onChange={(e) => handleChange('convulsiones', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="temblor_generalizado">{t('options.temblor_generalizado')}</option>
              <option value="focales">{t('options.convulsiones_focales')}</option>
              <option value="generalizadas">{t('options.convulsiones_generalizadas')}</option>
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
              <option value="no_responde_estimulos">{t('options.no_responde_a_estimulos')}</option>
              <option value="hipotermia">{t('options.hipotermia')}</option>
            </select>
          </div>
        </div>
      </div>

      <div id="erizos-dental" className="form-section">
        <h3>Sistema Dental</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('dientes_2')}</label>
            <select
              value={formData.dientes_estado || ''}
              onChange={(e) => handleChange('dientes_estado', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="amarillentos">{t('options.amarillentos')}</option>
              <option value="caries">{t('options.caries')}</option>
              <option value="rotos">{t('options.rotos')}</option>
              <option value="sangrantes">{t('options.sangrantes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('dificultad_para_comer')}</label>
            <YesNoChips
              value={formData.dificultad_comer}
              onChange={(val) => handleChange('dificultad_comer', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('secrecion_bucal')}</label>
            <YesNoChips
              value={formData.secrecion_bucal}
              onChange={(val) => handleChange('secrecion_bucal', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('comportamiento_alimenticio')}</label>
            <select
              value={formData.comportamiento_alimenticio || ''}
              onChange={(e) => handleChange('comportamiento_alimenticio', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="mordisquea_lentamente">{t('options.mordisquea_lentamente')}</option>
              <option value="deja_sin_masticar">{t('options.deja_comida_sin_masticar')}</option>
              <option value="rechaza_comida_dura">{t('options.rechaza_comida_dura')}</option>
              <option value="prefiere_blanda">{t('options.preferencia_por_comida_blanda')}</option>
            </select>
          </div>
        </div>
      </div>

      <div id="erizos-reproductivo" className="form-section">
        <h3>{section('reproductivo')}</h3>
        
                <ReproductiveSexHint sexo={sexo} />
        {sexo === 'hembra' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>{field('ultimo_celo_dias_atras')}</label>
                <input
                  type="text"
                  value={formData.ultimo_celo_dias || ''}
                  onChange={(e) => handleChange('ultimo_celo_dias', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
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
              {formData.secrecion_vaginal !== 'NO' && (
                <div className="form-group">
                  <label>{field('frecuencia')}</label>
                  <select
                    value={formData.secrecion_vaginal_frecuencia || ''}
                    onChange={(e) => handleChange('secrecion_vaginal_frecuencia', e.target.value)}
                  >
                    <option value="">{t('select')}</option>
                    <option value="intermitente">{t('options.intermitente')}</option>
                    <option value="continua">{t('options.continua')}</option>
                  </select>
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{field('hinchazon_abdominal_3')}</label>
                <YesNoChips
                  value={formData.hinchazon_abdominal}
                  onChange={(val) => handleChange('hinchazon_abdominal', val)}
                />
              </div>
            </div>
          </>
        )}

        {sexo === 'macho' && (
          <div className="form-row">
            <div className="form-group">
              <label>{field('testiculos_descendidos')}</label>
              <YesNoChips
                value={formData.testiculos_descendidos}
                onChange={(val) => handleChange('testiculos_descendidos', val)}
              />
            </div>
            <div className="form-group">
              <label>{field('hinchazon_escrotal')}</label>
              <YesNoChips
                value={formData.hinchazon_escrotal}
                onChange={(val) => handleChange('hinchazon_escrotal', val)}
              />
            </div>
          </div>
        )}
      </div>
        </div>
      </div>
    </div>
  );
};

export default ErizosForm;