import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';
import { useSpeciesFormI18n } from '../../hooks/useSpeciesFormI18n';
import { normalizePetSex } from '../../lib/petSex';

const HamstersForm = ({ formData, setFormData }) => {
  const { t, field, placeholder, section, title } = useSpeciesFormI18n('hamsters');
  const sexo = normalizePetSex(formData.sexo);
  const [activeSection, setActiveSection] = useState('hamsters-info-basica');

  const handleChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });
  };

  const toggleSection = useCallback((e) => {
    const section = e.target.closest('.form-section');
    if (section && e.target.tagName === 'H3') section.classList.toggle('collapsed');
  }, []);

  const requiredFields = [
    'nombre_mascota', 'nombre_dueño', 'especie_hamster', 'edad', 'sexo', 'peso',
    'desparasitacion_interna', 'tipo_dieta', 'habitat', 'temperatura_ambiente',
    'apetito', 'heces', 'secrecion_nasal', 'pelo_piel'
  ];

  const progress = useMemo(() => {
    const filled = requiredFields.filter(field => formData[field] && formData[field] !== '').length;
    return Math.round((filled / requiredFields.length) * 100);
  }, [formData]);

  const sections = [
    { id: 'hamsters-info-basica', labelKey: 'info_basica', icon: '📋' },
    { id: 'hamsters-desparasitacion', label: 'Desparasitación', icon: '💊' },
    { id: 'hamsters-alimentacion', labelKey: 'alimentacion', icon: '🥗' },
    { id: 'hamsters-ambiente', labelKey: 'ambiente', icon: '🏠' },
    { id: 'hamsters-examen', labelKey: 'examen_fisico', icon: '🩺' },
    { id: 'hamsters-digestivo', labelKey: 'digestivo', icon: '🫃' },
    { id: 'hamsters-respiratorio', labelKey: 'respiratorio', icon: '🫁' },
    { id: 'hamsters-neurologico', labelKey: 'neurologico', icon: '🧠' },
    { id: 'hamsters-cutaneo', labelKey: 'cutaneo', icon: '🐭' },
    { id: 'hamsters-dental', label: 'Sistema Dental', icon: '🦷' },
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
      <h2>{title('hamsters')}</h2>

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
      
      <div id="hamsters-info-basica" className="form-section">
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
            <label>{field('especie_exacta')}</label>
            <select required value={formData.especie_exacta || ''} onChange={(e) => handleChange('especie_exacta', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="sirio">{t('options.sirio')}</option>
              <option value="enano">{t('options.enano')}</option>
              <option value="roborovski">{t('options.roborovski')}</option>
              <option value="campbell">{t('options.campbell')}</option>
              <option value="chino">{t('options.chino')}</option>
              <option value="ruso">{t('options.ruso')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('edad_meses')}</label>
            <input type="text" required value={formData.edad || ''} onChange={(e) => handleChange('edad', e.target.value)} placeholder={placeholder('adulto_3_12_meses_senior_gt_18_meses')} />
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
          <div className="form-group">
            <label>{field('fecha_de_esterilizacion')}</label>
            <input
              type="text"
              value={formData.esterilizado_fecha || ''}
              onChange={(e) => handleChange('esterilizado_fecha', e.target.value)}
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>{field('peso_actual_g_2')}</label>
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
              <option value="hiperactivo">{t('options.hiperactivo')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
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
      </div>

      <div id="hamsters-desparasitacion" className="form-section">
        <h3>Desparasitación</h3>
        
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
      </div>

      <div id="hamsters-alimentacion" className="form-section">
        <h3>{section('alimentacion')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('tipo_de_dieta_2')}</label>
            <select required value={formData.tipo_dieta || ''} onChange={(e) => handleChange('tipo_dieta', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="balanceado">{t('options.balanceado_comercial')}</option>
              <option value="mezcla_semillas">{t('options.mezcla_de_semillas')}</option>
              <option value="casera">{t('options.casera')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('marca_y_composicion')}</label>
            <input type="text" value={formData.marca_alimento || ''} onChange={(e) => handleChange('marca_alimento', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('suplementos')}</label>
            <input type="text" value={formData.suplementos || ''} onChange={(e) => handleChange('suplementos', e.target.value)} placeholder={placeholder('vitaminas_calcio_frutas_verduras')} />
          </div>
          <div className="form-group">
            <label>{field('agua_fresca_diaria')}</label>
            <YesNoChips
              value={formData.agua_fresca}
              onChange={(val) => handleChange('agua_fresca', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('alimentos_ricos_en_azucar')}</label>
            <YesNoChips
              value={formData.alimentos_azucar}
              onChange={(val) => handleChange('alimentos_azucar', val)}
            />
          </div>
          {formData.alimentos_azucar === 'SI' && (
            <div className="form-group">
              <label>{field('ejemplos')}</label>
              <input
                type="text"
                value={formData.alimentos_azucar_ejemplos || ''}
                onChange={(e) => handleChange('alimentos_azucar_ejemplos', e.target.value)}
              />
            </div>
          )}
        </div>

        {formData.agua_fresca === 'SI' && (
          <div className="form-row">
            <div className="form-group">
              <label>{field('tipo_de_bebedero')}</label>
              <input
                type="text"
                value={formData.tipo_bebedero || ''}
                onChange={(e) => handleChange('tipo_bebedero', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div id="hamsters-ambiente" className="form-section">
        <h3>{section('ambiente')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('habitat')}</label>
            <select required value={formData.habitat || ''} onChange={(e) => handleChange('habitat', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="jaula_alambre">{t('options.jaula_de_alambre')}</option>
              <option value="acuario">{t('options.acuario')}</option>
              <option value="tunel_modular">{t('options.tunel_modular')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('tamano_de_espacio_cm')}</label>
            <input type="text" value={formData.tamano_espacio || ''} onChange={(e) => handleChange('tamano_espacio', e.target.value)} placeholder={placeholder('minimo_38x60_cm')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('temperatura_ambiente_c_2')}</label>
            <input type="text" value={formData.temperatura_ambiente || ''} onChange={(e) => handleChange('temperatura_ambiente', e.target.value)} placeholder={placeholder('ideal_18_24_c')} />
          </div>
          <div className="form-group">
            <label>{field('humedad')}</label>
            <input type="text" value={formData.humedad || ''} onChange={(e) => handleChange('humedad', e.target.value)} placeholder={placeholder('ideal_40_60')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('piso_sustrato')}</label>
            <select required value={formData.piso || ''} onChange={(e) => handleChange('piso', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="aserrin">{t('options.aserrin')}</option>
              <option value="papel">{t('options.papel_reciclado')}</option>
              <option value="viruta">{t('options.viruta_aromatica')}</option>
              <option value="otro">{t('options.otro')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('rueda_de_ejercicio')}</label>
            <YesNoChips
              value={formData.rueda_ejercicio}
              onChange={(val) => handleChange('rueda_ejercicio', val)}
            />
          </div>
        </div>

        {formData.rueda_ejercicio === 'SI' && (
          <div className="form-group">
            <label>{field('tamano_de_la_rueda')}</label>
            <input
              type="text"
              value={formData.tamano_rueda || ''}
              onChange={(e) => handleChange('tamano_rueda', e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label>{field('tiempo_de_ejercicio_diario_minutos')}</label>
          <input type="text" value={formData.tiempo_ejercicio || ''} onChange={(e) => handleChange('tiempo_ejercicio', e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('tipo_de_ejercicio_principal')}</label>
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

      <div id="hamsters-examen" className="form-section">
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
        </div>
      </div>

      <div id="hamsters-digestivo" className="form-section">
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
            <label>{field('come_semillas')}</label>
            <YesNoChips
              value={formData.come_semillas}
              onChange={(val) => handleChange('come_semillas', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('come_verduras')}</label>
            <YesNoChips
              value={formData.come_verduras}
              onChange={(val) => handleChange('come_verduras', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('almacenamiento_de_comida_en_mejillas_con_mal_olor')}</label>
            <YesNoChips
              value={formData.almacen_mejillas_mal_olor}
              onChange={(val) => handleChange('almacen_mejillas_mal_olor', val)}
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
              <option value="liquidas">{t('options.liquidas_humedas')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('frecuencia_veces_dia')}</label>
            <input type="text" value={formData.heces_frecuencia || ''} onChange={(e) => handleChange('heces_frecuencia', e.target.value)} placeholder={placeholder('normal_10_20_veces_dia')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('color_de_heces')}</label>
            <select value={formData.heces_color || ''} onChange={(e) => handleChange('heces_color', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="marron_oscuro">{t('options.marron_oscuro')}</option>
              <option value="amarillo">{t('options.amarillo')}</option>
              <option value="verde">{t('options.verde')}</option>
              <option value="rojizo">{t('options.rojizo_sangre')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('localizacion_de_heces')}</label>
            <select
              value={formData.heces_localizacion || ''}
              onChange={(e) => handleChange('heces_localizacion', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="en_jaula">{t('options.en_jaula')}</option>
              <option value="pegadas_ano">{t('options.pegadas_al_ano')}</option>
              <option value="en_cola">{t('options.en_cola')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('presencia_de_moco')}</label>
            <YesNoChips
              value={formData.heces_moco}
              onChange={(val) => handleChange('heces_moco', val)}
            />
          </div>
        </div>

        <div className="form-row">
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

      <div id="hamsters-respiratorio" className="form-section">
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
        </div>
      </div>

      <div id="hamsters-neurologico" className="form-section">
        <h3>{section('neurologico')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('temblor_convulsiones')}</label>
            <select required value={formData.convulsiones || 'NO'} onChange={(e) => handleChange('convulsiones', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="temblor_generalizado">{t('options.temblor_generalizado')}</option>
              <option value="focales">{t('options.convulsiones_focales')}</option>
              <option value="generalizadas">{t('options.convulsiones_generalizadas')}</option>
            </select>
          </div>
          {formData.convulsiones !== 'NO' && (
            <div className="form-group">
              <label>{field('duracion_seg_min')}</label>
              <input type="text" value={formData.convulsiones_duracion || ''} onChange={(e) => handleChange('convulsiones_duracion', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('incoordinacion_2')}</label>
            <select required value={formData.incoordinacion || 'NO'} onChange={(e) => handleChange('incoordinacion', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="caidas">{t('options.caidas_laterales')}</option>
              <option value="rodar">{t('options.rodar_sin_control')}</option>
              <option value="no_mantiene">{t('options.no_puede_mantenerse_derecho')}</option>
            </select>
          </div>
        </div>
      </div>

      <div id="hamsters-cutaneo" className="form-section">
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
            <select required value={formData.prurito || 'NO'} onChange={(e) => handleChange('prurito', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="leve">{t('options.leve')}</option>
              <option value="intenso">{t('options.intenso')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('orejas_2')}</label>
            <select required value={formData.orejas || 'normales'} onChange={(e) => handleChange('orejas', e.target.value)}>
              <option value="normales">{t('options.normales')}</option>
              <option value="costras">{t('options.costras_en_interior')}</option>
              <option value="secrecion">{t('options.secrecion_marron')}</option>
              <option value="mal_olor">{t('options.mal_olor')}</option>
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
      </div>

      <div id="hamsters-dental" className="form-section">
        <h3>Sistema Dental</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('dientes_frontales')}</label>
            <select required value={formData.dientes || 'normales'} onChange={(e) => handleChange('dientes', e.target.value)}>
              <option value="normales">{t('options.normales')}</option>
              <option value="amarillentos">{t('options.amarillentos')}</option>
              <option value="curvados">{t('options.curvados')}</option>
              <option value="rotos">{t('options.rotos')}</option>
              <option value="sangrantes">{t('options.sangrantes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('dificultad_para_comer_2')}</label>
            <YesNoChips
              value={formData.dificultad_comer}
              onChange={(val) => handleChange('dificultad_comer', val)}
            />
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default HamstersForm;
