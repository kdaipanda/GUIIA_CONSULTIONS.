import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';
import { useSpeciesFormI18n } from '../../hooks/useSpeciesFormI18n';
import { normalizePetSex } from '../../lib/petSex';

const HuronesForm = ({ formData, setFormData }) => {
  const { t, field, placeholder, section, title } = useSpeciesFormI18n('hurones');
  const sexo = normalizePetSex(formData.sexo);
  const [activeSection, setActiveSection] = useState('hurones-info-basica');

  const handleChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });
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
    { id: 'hurones-info-basica', labelKey: 'info_basica', icon: '📋' },
    { id: 'hurones-vacunacion', labelKey: 'vacunacion', icon: '💉' },
    { id: 'hurones-alimentacion', labelKey: 'alimentacion', icon: '🥗' },
    { id: 'hurones-ambiente', labelKey: 'ambiente', icon: '🏠' },
    { id: 'hurones-ejercicio', label: 'Ejercicio', icon: '🏃' },
    { id: 'hurones-socializacion', label: 'Socialización', icon: '🤝' },
    { id: 'hurones-higiene', label: 'Higiene', icon: '🚿' },
    { id: 'hurones-examen', labelKey: 'examen_fisico', icon: '🩺' },
    { id: 'hurones-endocrino', label: 'Sistema Endocrino', icon: '⚖️' },
    { id: 'hurones-digestivo', labelKey: 'digestivo', icon: '🫃' },
    { id: 'hurones-neurologico', labelKey: 'neurologico', icon: '🧠' },
    { id: 'hurones-musculoesqueletico', labelKey: 'musculoesqueletico', icon: '🦴' },
    { id: 'hurones-cutaneo', labelKey: 'cutaneo', icon: '🐾' },
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
      <h2>{title('hurones')}</h2>

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
      
      <div id="hurones-info-basica" className="form-section">
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
              <option value="intacta">{t('options.intacta')}</option>
              <option value="esterilizado">{t('options.esterilizado')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('edad_anos_meses')}</label>
            <input type="text" required value={formData.edad || ''} onChange={(e) => handleChange('edad', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{field('peso_actual_g_2')}</label>
            <input type="text" required value={formData.peso || ''} onChange={(e) => handleChange('peso', e.target.value)} />
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
            <label>{field('se_extrajeron_glandulas_anales')}</label>
            <select required value={formData.glandulas_anales || ''} onChange={(e) => handleChange('glandulas_anales', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="SI">{t('yes')}</option>
              <option value="NO">{t('no')}</option>
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

      <div id="hurones-vacunacion" className="form-section">
        <h3>{section('vacunacion')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('moquillo')}</label>
            <select required value={formData.vacuna_moquillo || ''} onChange={(e) => handleChange('vacuna_moquillo', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="completa">{t('options.completa')}</option>
              <option value="incompleta">{t('options.incompleta')}</option>
              <option value="nunca">{t('options.nunca')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('rabia')}</label>
            <YesNoChips
              value={formData.vacuna_rabia}
              onChange={(val) => handleChange('vacuna_rabia', val)}
            />
          </div>
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
      </div>

      <div id="hurones-alimentacion" className="form-section">
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
            <label>{field('marca_composicion')}</label>
            <input type="text" value={formData.marca_alimento || ''} onChange={(e) => handleChange('marca_alimento', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('suplementos')}</label>
            <input type="text" value={formData.suplementos || ''} onChange={(e) => handleChange('suplementos', e.target.value)} placeholder={placeholder('taurina_enzimas_digestivas_otros')} />
          </div>
          <div className="form-group">
            <label>{field('acceso_a_basura_comida_humana_2')}</label>
            <YesNoChips
              value={formData.acceso_basura}
              onChange={(val) => handleChange('acceso_basura', val)}
            />
          </div>
        </div>
      </div>

      <div id="hurones-ambiente" className="form-section">
        <h3>{section('ambiente')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('casa')}</label>
            <select required value={formData.habitat || ''} onChange={(e) => handleChange('habitat', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="jaula">{t('options.jaula')}</option>
              <option value="corral">{t('options.corral')}</option>
              <option value="libre">{t('options.libre')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('ubicacion_2')}</label>
            <select required value={formData.ubicacion || ''} onChange={(e) => handleChange('ubicacion', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="interior">{t('options.habitat_interior')}</option>
              <option value="exterior">{t('options.habitat_exterior')}</option>
              <option value="habitacion">{t('options.habitacion_especifica')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('temperatura_ambiente_c_2')}</label>
            <input type="text" value={formData.temperatura_ambiente || ''} onChange={(e) => handleChange('temperatura_ambiente', e.target.value)} placeholder={placeholder('ideal_18_24_c')} />
          </div>
          <div className="form-group">
            <label>{field('superficie')}</label>
            <select value={formData.superficie || ''} onChange={(e) => handleChange('superficie', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="alfombra">{t('options.alfombra')}</option>
              <option value="piso_duro">{t('options.piso_duro')}</option>
              <option value="jaula_barrotes">{t('options.jaula_con_barrotes')}</option>
              <option value="sustrato">{t('options.sustrato_aserrin')}</option>
            </select>
          </div>
        </div>
      </div>

      <div id="hurones-ejercicio" className="form-section">
        <h3>Ejercicio</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('tiempo_de_juego_diario_horas')}</label>
            <input
              type="text"
              value={formData.tiempo_juego || ''}
              onChange={(e) => handleChange('tiempo_juego', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{field('tipo_de_juguetes')}</label>
            <select
              value={formData.tipo_juguetes || ''}
              onChange={(e) => handleChange('tipo_juguetes', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="tuneles">{t('options.tuneles')}</option>
              <option value="pelotas">{t('options.pelotas')}</option>
              <option value="objetos_pequenos">{t('options.objetos_pequenos')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('supervision_durante_el_juego')}</label>
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
            <label>{field('vive')}</label>
            <select
              value={formData.socializacion_tipo || ''}
              onChange={(e) => handleChange('socializacion_tipo', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="solo">{t('options.solo')}</option>
              <option value="pareja">{t('options.pareja')}</option>
              <option value="grupo">{t('options.grupo')}</option>
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

        {formData.peleas_recientes === 'SI' && (
          <div className="form-group">
            <label>{field('lesiones')}</label>
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
            <label>{field('limpieza_de_jaula')}</label>
            <select
              value={formData.limpieza_jaula || ''}
              onChange={(e) => handleChange('limpieza_jaula', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="diaria">{t('options.diaria')}</option>
              <option value="cada_2_dias">{t('options.cada_2_dias')}</option>
              <option value="semanal">{t('options.semanal')}</option>
            </select>
          </div>
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
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('uso_de_desinfectantes_2')}</label>
            <YesNoChips
              value={formData.uso_desinfectantes}
              onChange={(val) => handleChange('uso_desinfectantes', val)}
            />
          </div>
          {formData.uso_desinfectantes === 'SI' && (
            <div className="form-group">
              <label>{field('cual')}</label>
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
        <h3>{section('examen_fisico')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('temperatura')}</label>
            <input type="text" value={formData.temperatura || ''} onChange={(e) => handleChange('temperatura', e.target.value)} placeholder={placeholder('normal_38_40_c')} />
          </div>
          <div className="form-group">
            <label>{field('frecuencia_cardiaca')}</label>
            <input type="text" value={formData.frecuencia_cardiaca || ''} onChange={(e) => handleChange('frecuencia_cardiaca', e.target.value)} placeholder={placeholder('normal_200_250')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('frecuencia_respiratoria')}</label>
            <input type="text" value={formData.frecuencia_respiratoria || ''} onChange={(e) => handleChange('frecuencia_respiratoria', e.target.value)} placeholder={placeholder('normal_33_36')} />
          </div>
          <div className="form-group">
            <label>{field('color_de_mucosas_2')}</label>
            <select value={formData.mucosas || 'rosado'} onChange={(e) => handleChange('mucosas', e.target.value)}>
              <option value="rosado">{t('options.rosado')}</option>
              <option value="palido">{t('options.palido')}</option>
              <option value="icterico">{t('options.icterico')}</option>
              <option value="cianotico">{t('options.cianotico')}</option>
            </select>
          </div>
        </div>
      </div>

      <div id="hurones-endocrino" className="form-section">
        <h3>Sistema Endocrino</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('perdida_de_pelo')}</label>
            <select
              required
              value={formData.perdida_pelo || 'NO'}
              onChange={(e) => handleChange('perdida_pelo', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="cola_base">{t('options.solo_en_cola_base')}</option>
              <option value="simetrico">{t('options.lateralmente_simetrico')}</option>
              <option value="total">{t('options.total_excepto_cabeza')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('progresion')}</label>
            <select
              value={formData.progresion_endocrina || ''}
              onChange={(e) => handleChange('progresion_endocrina', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="lenta">{t('options.lenta_meses')}</option>
              <option value="rapida">{t('options.rapida_semanas')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('acompanado_de_picazon_intensa')}</label>
            <YesNoChips
              value={formData.picazon_intensa}
              onChange={(val) => handleChange('picazon_intensa', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('debilidad_colapso')}</label>
            <select
              required
              value={formData.debilidad || 'NO'}
              onChange={(e) => handleChange('debilidad', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="mananas">{t('options.mananas_en_ayunas')}</option>
              <option value="post_ejercicio">{t('options.post_ejercicio')}</option>
              <option value="aleatorio">{t('options.aleatorio')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('mejora_con_azucar_miel')}</label>
            <YesNoChips
              value={formData.mejora_azucar}
              onChange={(val) => handleChange('mejora_azucar', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('temblor_muscular_antes_del_colapso_2')}</label>
            <YesNoChips
              value={formData.temblor_precolapso}
              onChange={(val) => handleChange('temblor_precolapso', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('hinchazon_abdominal_3')}</label>
            <select
              value={formData.hinchazon_abdominal || ''}
              onChange={(e) => handleChange('hinchazon_abdominal', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="difusa">{t('options.difusa')}</option>
              <option value="localizada">{t('options.localizada')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('palpacion_de_masa')}</label>
            <YesNoChips
              value={formData.palpacion_masa}
              onChange={(val) => handleChange('palpacion_masa', val)}
            />
          </div>
        </div>

        {formData.palpacion_masa === 'SI' && (
          <div className="form-group">
            <label>{field('tamano_de_la_masa')}</label>
            <input
              type="text"
              value={formData.masa_tamano || ''}
              onChange={(e) => handleChange('masa_tamano', e.target.value)}
            />
          </div>
        )}

        {sexo === 'hembra' && (
          <div className="form-group">
            <label>{field('hembra_en_celo_permanente')}</label>
            <YesNoChips
              value={formData.celo_permanente}
              onChange={(val) => handleChange('celo_permanente', val)}
            />
          </div>
        )}
      </div>

      <div id="hurones-digestivo" className="form-section">
        <h3>{section('digestivo')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('apetito')}</label>
            <select required value={formData.apetito || 'normal'} onChange={(e) => handleChange('apetito', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="hiperfagia">{t('options.hiperfagia_come_mas')}</option>
              <option value="hipofagia">{t('options.hipofagia_come_menos')}</option>
              <option value="anorexia">{t('options.anorexia')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('come_pero_pierde_peso')}</label>
            <select required value={formData.come_pierde_peso || 'NO'} onChange={(e) => handleChange('come_pierde_peso', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('vomitos_regurgitacion')}</label>
            <select required value={formData.vomitos || 'NO'} onChange={(e) => handleChange('vomitos', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="alimentos">{t('options.alimentos_no_digeridos')}</option>
              <option value="bilis">{t('options.bilis')}</option>
              <option value="sangre">{t('options.sangre')}</option>
              <option value="material_oscuro">{t('options.material_oscuro_heces')}</option>
            </select>
          </div>
          {formData.vomitos !== 'NO' && (
            <div className="form-group">
              <label>{field('frecuencia_veces_horas')}</label>
              <input type="text" value={formData.vomitos_frecuencia || ''} onChange={(e) => handleChange('vomitos_frecuencia', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('heces')}</label>
            <select required value={formData.heces || 'normal'} onChange={(e) => handleChange('heces', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="diarrea_aguda">{t('options.diarrea_aguda_lt_3_dias')}</option>
              <option value="diarrea_cronica">{t('options.diarrea_cronica_gt_1_semana')}</option>
              <option value="estrenimiento">{t('options.estrenimiento')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('color_de_heces')}</label>
            <select value={formData.heces_color || 'normal'} onChange={(e) => handleChange('heces_color', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="negras">{t('options.negras')}</option>
              <option value="rojas">{t('options.rojas')}</option>
              <option value="palidas">{t('options.palidas')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('consistencia_de_heces')}</label>
            <select
              value={formData.heces_consistencia || ''}
              onChange={(e) => handleChange('heces_consistencia', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="liquidas">{t('options.liquidas')}</option>
              <option value="pastosas">{t('options.pastosas')}</option>
              <option value="formadas">{t('options.formadas')}</option>
              <option value="con_moco">{t('options.con_moco')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('presencia_de_parasitos')}</label>
            <YesNoChips
              value={formData.heces_parasitos}
              onChange={(val) => handleChange('heces_parasitos', val)}
            />
          </div>
          {formData.heces_parasitos === 'SI' && (
            <div className="form-group">
              <label>{field('tipo_de_parasitos')}</label>
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
            <label>{field('presencia_de_cuerpos_extranos')}</label>
            <YesNoChips
              value={formData.cuerpos_extranos}
              onChange={(val) => handleChange('cuerpos_extranos', val)}
            />
          </div>
          {formData.cuerpos_extranos === 'SI' && (
            <div className="form-group">
              <label>{field('describir')}</label>
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
        <h3>{section('neurologico')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('convulsiones')}</label>
            <select
              value={formData.convulsiones || ''}
              onChange={(e) => handleChange('convulsiones', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="completa">{t('options.completa_perdida_de_conciencia')}</option>
              <option value="parcial">{t('options.parcial_solo_una_extremidad')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('duracion_segundos_minutos')}</label>
            <input
              type="text"
              value={formData.convulsiones_duracion || ''}
              onChange={(e) => handleChange('convulsiones_duracion', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('ataxia')}</label>
            <select
              value={formData.ataxia || ''}
              onChange={(e) => handleChange('ataxia', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="borracho">{t('options.movimientos_como_borracho')}</option>
              <option value="caidas_laterales">{t('options.caidas_laterales')}</option>
              <option value="no_puede_pararse">{t('options.no_puede_pararse')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('mejora_con_azucar')}</label>
            <YesNoChips
              value={formData.mejora_azucar_neuro}
              onChange={(val) => handleChange('mejora_azucar_neuro', val)}
            />
          </div>
        </div>
      </div>

      <div id="hurones-musculoesqueletico" className="form-section">
        <h3>{section('musculoesqueletico')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('debilidad_posterior')}</label>
            <select
              value={formData.debilidad_posterior || ''}
              onChange={(e) => handleChange('debilidad_posterior', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="dificultad_saltar">{t('options.dificultad_para_saltar')}</option>
              <option value="arrastre_patas_traseras">{t('options.arrastre_de_patas_traseras')}</option>
              <option value="no_puede_pararse">{t('options.no_puede_pararse')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('mejora_temporal_con_estimulacion')}</label>
            <YesNoChips
              value={formData.mejora_estimulacion}
              onChange={(val) => handleChange('mejora_estimulacion', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('temblor_en_patas_traseras')}</label>
            <YesNoChips
              value={formData.temblor_patas_traseras}
              onChange={(val) => handleChange('temblor_patas_traseras', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('postura_anormal')}</label>
            <select
              value={formData.postura_anormal || ''}
              onChange={(e) => handleChange('postura_anormal', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="posicion_rana">{t('options.posicion_de_rana')}</option>
              <option value="espalda_arqueada">{t('options.espalda_arqueada')}</option>
              <option value="cuello_rigido">{t('options.cuello_rigido')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('dolor_al_manipular_columna_2')}</label>
            <YesNoChips
              value={formData.dolor_columna}
              onChange={(val) => handleChange('dolor_columna', val)}
            />
          </div>
          {formData.dolor_columna === 'SI' && (
            <div className="form-group">
              <label>{field('ubicacion')}</label>
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
        <h3>{section('cutaneo')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('presencia_de_piel_grasa_acneica')}</label>
            <YesNoChips
              value={formData.piel_grasa_acneica}
              onChange={(val) => handleChange('piel_grasa_acneica', val)}
            />
          </div>
        </div>

        {sexo === 'hembra' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>{field('genitales_hembras')}</label>
                <select
                  value={formData.genitales_hembras || ''}
                  onChange={(e) => handleChange('genitales_hembras', e.target.value)}
                >
                  <option value="">{t('select')}</option>
                  <option value="hinchazon_vulvar_persistente">{t('options.hinchazon_vulvar_persistente')}</option>
                  <option value="secrecion_sanguinolenta">{t('options.secrecion_sanguinolenta')}</option>
                  <option value="olor_fetido">{t('options.olor_fetido')}</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{field('duracion_de_hinchazon_dias')}</label>
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
            <label>{field('miccion')}</label>
            <select
              value={formData.miccion || ''}
              onChange={(e) => handleChange('miccion', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="frecuencia_aumentada">{t('options.frecuencia_aumentada')}</option>
              <option value="esfuerzo">{t('options.esfuerzo')}</option>
              <option value="grito_al_orinar">{t('options.grito_al_orinar')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('color_de_orina')}</label>
            <select
              value={formData.orina_color || ''}
              onChange={(e) => handleChange('orina_color', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="clara">{t('options.clara')}</option>
              <option value="ambar">{t('options.ambar')}</option>
              <option value="rojiza">{t('options.rojiza')}</option>
              <option value="turbia">{t('options.turbia')}</option>
              <option value="sedimentos">{t('options.con_sedimentos')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('olor_de_la_orina')}</label>
            <select
              value={formData.orina_olor || ''}
              onChange={(e) => handleChange('orina_olor', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="normal">{t('options.normal')}</option>
              <option value="amoniaco">{t('options.amonico')}</option>
              <option value="fetido">{t('options.fetido')}</option>
            </select>
          </div>
        </div>

        {sexo === 'macho' && (
          <div className="form-row">
            <div className="form-group">
              <label>{field('signos_en_machos')}</label>
              <select
                value={formData.signos_machos_uro || ''}
                onChange={(e) => handleChange('signos_machos_uro', e.target.value)}
              >
                <option value="">{t('select')}</option>
                <option value="dificultad_orinar">{t('options.dificultad_para_orinar')}</option>
                <option value="goteo_continuo">{t('options.goteo_continuo')}</option>
                <option value="hinchazon_perineal">{t('options.hinchazon_perineal')}</option>
              </select>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>{field('palpacion_de_prostata_agrandada')}</label>
            <YesNoChips
              value={formData.prostata_agrandada}
              onChange={(val) => handleChange('prostata_agrandada', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('duracion_exacta_del_problema')}</label>
            <select
              value={formData.duracion_problema_uro || ''}
              onChange={(e) => handleChange('duracion_problema_uro', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="<12h">{t('options.lt_12_horas_2')}</option>
              <option value="12-24h">{t('options.n_12_24_h')}</option>
              <option value="2-3dias">{t('options.n_2_3_dias')}</option>
              <option value="4-7dias">{t('options.n_4_7_dias')}</option>
              <option value=">1semana">{t('options.gt_1_semana')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('progresion')}</label>
            <select
              value={formData.progresion_uro || ''}
              onChange={(e) => handleChange('progresion_uro', e.target.value)}
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
        </div>
      </div>
    </div>
  );
};

export default HuronesForm;