import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';
import { useSpeciesFormI18n } from '../../hooks/useSpeciesFormI18n';
import { normalizePetSex } from '../../lib/petSex';
import ReproductiveSexHint from './ReproductiveSexHint';

const IguanasForm = ({ formData, setFormData }) => {
  const { t, field, placeholder, section, title, reproductive } = useSpeciesFormI18n('iguanas');
  const sexo = normalizePetSex(formData.sexo);
  const [activeSection, setActiveSection] = useState('iguanas-info-basica');

  const handleChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });
  };

  const toggleSection = useCallback((e) => {
    const section = e.target.closest('.form-section');
    if (section && e.target.tagName === 'H3') section.classList.toggle('collapsed');
  }, []);

  const requiredFields = [
    'nombre_mascota', 'especie_exacta', 'edad', 'sexo', 'peso', 'condicion_corporal',
    'secrecion_nasal', 'respiracion', 'piel', 'apetito', 'heces',
    'tipo_dieta', 'temperatura_ambiente', 'iluminacion_uvb'
  ];

  const progress = useMemo(() => {
    const filled = requiredFields.filter(field => formData[field] && formData[field] !== '').length;
    return Math.round((filled / requiredFields.length) * 100);
  }, [formData]);

  const sections = [
    { id: 'iguanas-info-basica', labelKey: 'info_basica', icon: '📋' },
    { id: 'iguanas-respiratorio', labelKey: 'respiratorio', icon: '🫁' },
    { id: 'iguanas-tegumentario', label: 'Sistema Tegumentario', icon: '🦎' },
    { id: 'iguanas-digestivo', labelKey: 'digestivo', icon: '🫃' },
    { id: 'iguanas-neurologico', labelKey: 'neurologico', icon: '🧠' },
    { id: 'iguanas-comportamiento', labelKey: 'comportamiento', icon: '👀' },
    { id: 'iguanas-reproductivo', labelKey: 'reproductivo', icon: '🔬' },
    { id: 'iguanas-alimentacion', labelKey: 'alimentacion', icon: '🥗' },
    { id: 'iguanas-ambiente', labelKey: 'ambiente', icon: '🏠' },
    { id: 'iguanas-socializacion', label: 'Socialización y Manejo', icon: '🤝' },
    { id: 'iguanas-historial', label: 'Historial Médico Previo', icon: '📁' },
    { id: 'iguanas-examen', labelKey: 'examen_fisico', icon: '🩺' },
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
      <h2>{title('iguanas')}</h2>

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
      
      <div id="iguanas-info-basica" className="form-section">
        <h3>{section('info_basica')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('nombre_de_la_mascota')}</label>
            <input type="text" required value={formData.nombre_mascota || ''} onChange={(e) => handleChange('nombre_mascota', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{field('especie_exacta')}</label>
            <input type="text" required value={formData.especie_exacta || ''} onChange={(e) => handleChange('especie_exacta', e.target.value)} placeholder={placeholder('ej_iguana_iguana_ctenosaura_similis')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('subespecie_variante')}</label>
            <input type="text" value={formData.subespecie || ''} onChange={(e) => handleChange('subespecie', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{field('edad_estimada_anos')}</label>
            <input type="text" required value={formData.edad || ''} onChange={(e) => handleChange('edad', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('edad_confirmada')}</label>
            <YesNoChips
              value={formData.edad_confirmada}
              onChange={(val) => handleChange('edad_confirmada', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('tamano_del_cuerpo')}</label>
            <input type="text" required value={formData.tamano_cuerpo || ''} onChange={(e) => handleChange('tamano_cuerpo', e.target.value)} placeholder={placeholder('largo_total_y_largo_snout_vent_cm')} />
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
            <label>{field('sexo_confirmado_por')}</label>
            <select
              value={formData.sexo_confirmado_por || ''}
              onChange={(e) => handleChange('sexo_confirmado_por', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="visual">{t('options.visual')}</option>
              <option value="comportamiento">{t('options.por_comportamiento')}</option>
              <option value="poros_femorales">{t('options.por_poros_femorales')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('peso_actual_g_kg')}</label>
            <input type="text" required value={formData.peso || ''} onChange={(e) => handleChange('peso', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{field('condicion_corporal_2')}</label>
            <select required value={formData.condicion_corporal || ''} onChange={(e) => handleChange('condicion_corporal', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="emaciado">{t('options.emaciado')}</option>
              <option value="delgado">{t('options.delgado')}</option>
              <option value="ideal">{t('options.ideal')}</option>
              <option value="sobrepeso">{t('options.sobrepeso')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('peso_habitual_g_kg')}</label>
            <input
              type="text"
              value={formData.peso_habitual || ''}
              onChange={(e) => handleChange('peso_habitual', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{field('perdida_ganancia_de_peso')}</label>
            <input
              type="text"
              value={formData.porcentaje_cambio_peso || ''}
              onChange={(e) => handleChange('porcentaje_cambio_peso', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('origen')}</label>
            <select required value={formData.origen || ''} onChange={(e) => handleChange('origen', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="silvestre">{t('options.silvestre')}</option>
              <option value="criadero">{t('options.criadero')}</option>
              <option value="comercial">{t('options.comercial')}</option>
              <option value="regalo">{t('options.regalo')}</option>
            </select>
          </div>
          {formData.origen === 'silvestre' && (
            <div className="form-group">
              <label>{field('especimen_capturado')}</label>
              <YesNoChips
                value={formData.silvestre_capturada}
                onChange={(val) => handleChange('silvestre_capturada', val)}
              />
            </div>
          )}
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
      </div>

      <div id="iguanas-respiratorio" className="form-section">
        <h3>{section('respiratorio')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('secrecion_nasal_oral')}</label>
            <select required value={formData.secrecion_nasal || 'NO'} onChange={(e) => handleChange('secrecion_nasal', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="clara">{t('options.clara')}</option>
              <option value="mucosa">{t('options.mucosa')}</option>
              <option value="purulenta">{t('options.purulenta')}</option>
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
            <label>{field('burbujas_en_boca_nariz')}</label>
            <YesNoChips
              value={formData.burbujas}
              onChange={(val) => handleChange('burbujas', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('dificultad_respiratoria')}</label>
            <select required value={formData.dificultad_respiratoria || 'NO'} onChange={(e) => handleChange('dificultad_respiratoria', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="boca_abierta">{t('options.boca_abierta')}</option>
              <option value="movimiento_cuello">{t('options.movimiento_cuello_exagerado')}</option>
              <option value="aleteo">{t('options.aleteo_rapido')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('frecuencia_respiratoria')}</label>
            <input type="text" value={formData.frecuencia_respiratoria || ''} onChange={(e) => handleChange('frecuencia_respiratoria', e.target.value)} placeholder={placeholder('normal_4_10')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('respiracion_predominante')}</label>
            <select
              value={formData.respiracion_predominante || ''}
              onChange={(e) => handleChange('respiracion_predominante', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="inspiratoria">{t('options.inspiratoria')}</option>
              <option value="espiratoria">{t('options.espiratoria')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('temperatura_ambiente_baja')}</label>
            <YesNoChips
              value={formData.temperatura_baja}
              onChange={(val) => handleChange('temperatura_baja', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('humedad_inadecuada')}</label>
            <YesNoChips
              value={formData.humedad_inadecuada}
              onChange={(val) => handleChange('humedad_inadecuada', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('falta_de_calentador_termico')}</label>
            <YesNoChips
              value={formData.falta_calentador}
              onChange={(val) => handleChange('falta_calentador', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('ventilacion_inadecuada')}</label>
            <YesNoChips
              value={formData.ventilacion_inadecuada}
              onChange={(val) => handleChange('ventilacion_inadecuada', val)}
            />
          </div>
        </div>
      </div>

      <div id="iguanas-tegumentario" className="form-section">
        <h3>Sistema Tegumentario</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('piel_2')}</label>
            <select required value={formData.piel || 'normal'} onChange={(e) => handleChange('piel', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="descamacion">{t('options.descamacion_excesiva')}</option>
              <option value="costras">{t('options.costras')}</option>
              <option value="ulceras">{t('options.ulceras')}</option>
              <option value="hinchazon">{t('options.hinchazon')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('localizacion_especifica')}</label>
            <select value={formData.piel_localizacion || ''} onChange={(e) => handleChange('piel_localizacion', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="cabeza">{t('options.cabeza')}</option>
              <option value="cuello">{t('options.cuello')}</option>
              <option value="tronco">{t('options.tronco')}</option>
              <option value="extremidades">{t('options.extremidades')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('edema_en_parpados')}</label>
            <YesNoChips
              value={formData.edema_parpados}
              onChange={(val) => handleChange('edema_parpados', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('coloracion_anormal')}</label>
            <select required value={formData.coloracion_anormal || 'NO'} onChange={(e) => handleChange('coloracion_anormal', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="amarillenta">{t('options.amarillenta_ictericia')}</option>
              <option value="oscura">{t('options.oscura')}</option>
              <option value="palida">{t('options.mucosas_palida')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('estado_de_los_ojos')}</label>
            <select required value={formData.ojos || 'normales'} onChange={(e) => handleChange('ojos', e.target.value)}>
              <option value="normales">{t('options.normales')}</option>
              <option value="cerrados">{t('options.cerrados')}</option>
              <option value="hinchados">{t('options.hinchados')}</option>
              <option value="secrecion">{t('options.secrecion')}</option>
              <option value="opacidad">{t('options.opacidad_corneal')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('unas')}</label>
            <select required value={formData.unas || 'normales'} onChange={(e) => handleChange('unas', e.target.value)}>
              <option value="normales">{t('options.normales')}</option>
              <option value="crecimiento_excesivo">{t('options.crecimiento_excesivo')}</option>
              <option value="grietas">{t('options.grietas')}</option>
              <option value="deformidades">{t('options.deformidades')}</option>
              <option value="sangrado">{t('options.sangrado')}</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('mejora_con_limpieza')}</label>
            <YesNoChips
              value={formData.mejora_con_limpieza}
              onChange={(val) => handleChange('mejora_con_limpieza', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('dificultad_para_caminar')}</label>
            <YesNoChips
              value={formData.dificultad_caminar}
              onChange={(val) => handleChange('dificultad_caminar', val)}
            />
          </div>
        </div>
      </div>

      <div id="iguanas-digestivo" className="form-section">
        <h3>{section('digestivo')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('apetito')}</label>
            <select required value={formData.apetito || 'normal'} onChange={(e) => handleChange('apetito', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="anorexia_total">{t('options.anorexia_total_gt_48h')}</option>
              <option value="anorexia_parcial">{t('options.anorexia_parcial')}</option>
            </select>
          </div>
          {(formData.apetito === 'anorexia_total' || formData.apetito === 'anorexia_parcial') && (
            <div className="form-group">
              <label>{field('tiempo_sin_comer_horas_dias')}</label>
              <input type="text" value={formData.tiempo_sin_comer || ''} onChange={(e) => handleChange('tiempo_sin_comer', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('come_vegetales')}</label>
            <YesNoChips
              value={formData.come_vegetales}
              onChange={(val) => handleChange('come_vegetales', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('come_fruta')}</label>
            <YesNoChips
              value={formData.come_fruta}
              onChange={(val) => handleChange('come_fruta', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('calcio_suplementado')}</label>
            <YesNoChips
              value={formData.calcio_suplementado}
              onChange={(val) => handleChange('calcio_suplementado', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('heces')}</label>
            <select required value={formData.heces || 'normal'} onChange={(e) => handleChange('heces', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="ausentes">{t('options.ausentes_gt_72h')}</option>
              <option value="blandas">{t('options.blandas')}</option>
              <option value="liquidas">{t('options.liquidas')}</option>
              <option value="con_sangre">{t('options.con_sangre')}</option>
              <option value="con_parasitos">{t('options.con_parasitos')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('frecuencia_veces_semana')}</label>
            <input type="text" value={formData.heces_frecuencia || ''} onChange={(e) => handleChange('heces_frecuencia', e.target.value)} placeholder={placeholder('normal_1_7_segun_temperatura')} />
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
              <option value="verde_oscuro">{t('options.verde_oscuro')}</option>
              <option value="amarillo">{t('options.amarillo')}</option>
              <option value="rojizo">{t('options.rojizo_sangre')}</option>
              <option value="blanco_moho">{t('options.blanco_moho')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('consistencia_de_las_heces')}</label>
            <select
              value={formData.heces_consistencia || ''}
              onChange={(e) => handleChange('heces_consistencia', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="formadas">{t('options.formadas')}</option>
              <option value="pastosas">{t('options.pastosas')}</option>
              <option value="liquidas">{t('options.liquidas')}</option>
              <option value="con_moco">{t('options.con_moco')}</option>
            </select>
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
          <div className="form-group">
            <label>{field('palpacion_de_cuerpo_extrano')}</label>
            <YesNoChips
              value={formData.cuerpo_extrano}
              onChange={(val) => handleChange('cuerpo_extrano', val)}
            />
          </div>
        </div>

        {formData.cuerpo_extrano === 'SI' && (
          <div className="form-group">
            <label>{field('ubicacion_del_cuerpo_extrano')}</label>
            <input
              type="text"
              value={formData.cuerpo_extrano_ubicacion || ''}
              onChange={(e) => handleChange('cuerpo_extrano_ubicacion', e.target.value)}
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>{field('deshidratacion')}</label>
            <YesNoChips
              value={formData.deshidratacion}
              onChange={(val) => handleChange('deshidratacion', val)}
            />
          </div>
        </div>
      </div>

      <div id="iguanas-neurologico" className="form-section">
        <h3>{section('neurologico')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('inestabilidad_2')}</label>
            <select required value={formData.inestabilidad || 'NO'} onChange={(e) => handleChange('inestabilidad', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="temblor">{t('options.temblor_en_extremidades')}</option>
              <option value="caidas">{t('options.caidas_laterales')}</option>
              <option value="no_mantiene">{t('options.no_puede_mantenerse')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('convulsiones_2')}</label>
            <select required value={formData.convulsiones || 'NO'} onChange={(e) => handleChange('convulsiones', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="temblor_generalizado">{t('options.temblor_generalizado')}</option>
              <option value="focales">{t('options.convulsiones_focales')}</option>
              <option value="generalizadas">{t('options.convulsiones_generalizadas')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('progresion_2')}</label>
            <select
              required
              value={formData.progresion_neuro || ''}
              onChange={(e) => handleChange('progresion_neuro', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="lenta">{t('options.lenta_meses')}</option>
              <option value="rapida">{t('options.rapida_semanas')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('desencadenantes')}</label>
            <select
              value={formData.desencadenantes || ''}
              onChange={(e) => handleChange('desencadenantes', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="estres">{t('options.estres')}</option>
              <option value="manipulacion">{t('options.manipulacion')}</option>
              <option value="ninguno">{t('options.ninguno')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('letargo_extremo_3')}</label>
            <select required value={formData.letargo || 'NO'} onChange={(e) => handleChange('letargo', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="no_se_mueve">{t('options.no_se_mueve')}</option>
              <option value="no_responde">{t('options.no_responde_a_estimulos')}</option>
              <option value="hipotermia">{t('options.hipotermia')}</option>
            </select>
          </div>
        </div>
      </div>

      <div id="iguanas-comportamiento" className="form-section">
        <h3>{section('comportamiento')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('actividad_diurna_nocturna')}</label>
            <select required value={formData.actividad || 'normal'} onChange={(e) => handleChange('actividad', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="hiperactivo">{t('options.hiperactivo')}</option>
              <option value="letargico">{t('options.letargico')}</option>
              <option value="inactivo">{t('options.inactivo')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('cambio_en_patron_de_actividad')}</label>
            <YesNoChips
              value={formData.cambio_actividad}
              onChange={(val) => handleChange('cambio_actividad', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('interaccion_ambiental')}</label>
            <select
              value={formData.interaccion_ambiental || ''}
              onChange={(e) => handleChange('interaccion_ambiental', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="evita_zona_caliente">{t('options.evita_zona_caliente')}</option>
              <option value="evita_zona_fria">{t('options.evita_zona_fria')}</option>
              <option value="no_usa_escondites">{t('options.no_usa_escondites')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('cambio_en_relacion_con_el_dueno')}</label>
            <YesNoChips
              value={formData.cambio_relacion_dueno}
              onChange={(val) => handleChange('cambio_relacion_dueno', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('comportamiento_de_termorregulacion')}</label>
            <select
              value={formData.comportamiento_termorregulacion || ''}
              onChange={(e) => handleChange('comportamiento_termorregulacion', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="no_se_acerca_calor">{t('options.no_se_acerca_a_la_fuente_de_calor')}</option>
              <option value="se_queda_zona_fria">{t('options.se_queda_en_zona_fria')}</option>
              <option value="no_se_mueve">{t('options.no_se_mueve')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('cambio_en_patron_habitual_de_termorregulacion')}</label>
            <YesNoChips
              value={formData.cambio_patron_termorregulacion}
              onChange={(val) => handleChange('cambio_patron_termorregulacion', val)}
            />
          </div>
        </div>
      </div>

      <div id="iguanas-reproductivo" className="form-section">
        <h3>{section('reproductivo')}</h3>

        <div className="form-row">
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
        </div>

        <ReproductiveSexHint sexo={sexo} />
        
        {sexo === 'hembra' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>{field('ultima_puesta_dias_atras')}</label>
                <input type="text" value={formData.ultima_puesta || ''} onChange={(e) => handleChange('ultima_puesta', e.target.value)} />
              </div>
              <div className="form-group">
                <label>{field('dificultad_para_poner')}</label>
                <YesNoChips
                  value={formData.dificultad_poner}
                  onChange={(val) => handleChange('dificultad_poner', val)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{field('huevos_deformes')}</label>
                <YesNoChips
                  value={formData.huevos_deformes}
                  onChange={(val) => handleChange('huevos_deformes', val)}
                />
              </div>
              <div className="form-group">
                <label>{field('hinchazon_abdominal_2')}</label>
                <YesNoChips
                  value={formData.hinchazon_abdominal}
                  onChange={(val) => handleChange('hinchazon_abdominal', val)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{field('movimiento_anormal_de_las_patas_traseras')}</label>
                <YesNoChips
                  value={formData.movimiento_patas_traseras}
                  onChange={(val) => handleChange('movimiento_patas_traseras', val)}
                />
              </div>
            </div>
          </>
        )}

        {sexo === 'macho' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>{field('comportamiento_territorial_excesivo_2')}</label>
                <YesNoChips
                  value={formData.territorial}
                  onChange={(val) => handleChange('territorial', val)}
                />
              </div>
              <div className="form-group">
                <label>{field('inflamacion_de_poros_femorales')}</label>
                <YesNoChips
                  value={formData.poros_femorales}
                  onChange={(val) => handleChange('poros_femorales', val)}
                />
              </div>
              <div className="form-group">
                <label>{field('agresividad_repentina')}</label>
                <YesNoChips
                  value={formData.agresividad_reproductiva}
                  onChange={(val) => handleChange('agresividad_reproductiva', val)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{field('dificultad_para_aparearse')}</label>
                <YesNoChips
                  value={formData.dificultad_aparearse}
                  onChange={(val) => handleChange('dificultad_aparearse', val)}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div id="iguanas-alimentacion" className="form-section">
        <h3>{section('alimentacion')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('tipo_de_dieta_2')}</label>
            <select required value={formData.tipo_dieta || ''} onChange={(e) => handleChange('tipo_dieta', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="herbivora">{t('options.herbivora')}</option>
              <option value="omnivora">{t('options.omnivora')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('vegetales_diarios')}</label>
            <input type="text" value={formData.vegetales_diarios || ''} onChange={(e) => handleChange('vegetales_diarios', e.target.value)} placeholder={placeholder('hojas_verdes_vegetales_coloridos_frutas')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('alimento_vivo')}</label>
            <YesNoChips
              value={formData.alimento_vivo}
              onChange={(val) => handleChange('alimento_vivo', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('acceso_a_materiales_no_comestibles')}</label>
            <YesNoChips
              value={formData.acceso_no_comestibles}
              onChange={(val) => handleChange('acceso_no_comestibles', val)}
            />
          </div>
        </div>
      </div>

      <div id="iguanas-ambiente" className="form-section">
        <h3>{section('ambiente')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('tamano_del_recinto_cm')}</label>
            <input type="text" value={formData.tamano_recinto || ''} onChange={(e) => handleChange('tamano_recinto', e.target.value)} placeholder={placeholder('minimo_1_8x_tamano_iguana')} />
          </div>
          <div className="form-group">
            <label>{field('temperatura_ambiente_c_2')}</label>
            <input type="text" value={formData.temperatura_ambiente || ''} onChange={(e) => handleChange('temperatura_ambiente', e.target.value)} placeholder={placeholder('zona_fria_y_zona_caliente')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('humedad')}</label>
            <input type="text" value={formData.humedad || ''} onChange={(e) => handleChange('humedad', e.target.value)} placeholder={placeholder('ideal_70_80')} />
          </div>
          <div className="form-group">
            <label>{field('iluminacion_uvb')}</label>
            <YesNoChips
              value={formData.iluminacion_uvb}
              onChange={(val) => handleChange('iluminacion_uvb', val)}
            />
          </div>
        </div>

        {formData.iluminacion_uvb === 'SI' && (
          <div className="form-group">
            <label>{field('distancia_de_la_lampara_cm')}</label>
            <input type="text" value={formData.distancia_lampara || ''} onChange={(e) => handleChange('distancia_lampara', e.target.value)} />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>{field('superficie_del_sustrato')}</label>
            <select
              value={formData.sustrato || ''}
              onChange={(e) => handleChange('sustrato', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="tierra">{t('options.tierra')}</option>
              <option value="alfombra">{t('options.alfombra')}</option>
              <option value="otro">{t('options.otro')}</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{field('limpieza_del_recinto')}</label>
          <select required value={formData.limpieza_recinto || ''} onChange={(e) => handleChange('limpieza_recinto', e.target.value)}>
            <option value="">{t('select')}</option>
            <option value="diaria">{t('options.diaria')}</option>
            <option value="cada_2_dias">{t('options.cada_2_dias')}</option>
            <option value="semanal">{t('options.semanal')}</option>
          </select>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('banera_para_hidratacion')}</label>
            <YesNoChips
              value={formData.banera_hidratacion}
              onChange={(val) => handleChange('banera_hidratacion', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('lavado_de_comederos')}</label>
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
            <label>{field('uso_de_desinfectantes')}</label>
            <YesNoChips
              value={formData.uso_desinfectantes}
              onChange={(val) => handleChange('uso_desinfectantes', val)}
            />
          </div>
        </div>

        {formData.uso_desinfectantes === 'SI' && (
          <div className="form-group">
            <label>{field('cual_desinfectante')}</label>
            <input
              type="text"
              value={formData.desinfectante_cual || ''}
              onChange={(e) => handleChange('desinfectante_cual', e.target.value)}
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>{field('presencia_de_heces_acumuladas')}</label>
            <YesNoChips
              value={formData.heces_acumuladas}
              onChange={(val) => handleChange('heces_acumuladas', val)}
            />
          </div>
        </div>
      </div>

      <div id="iguanas-socializacion" className="form-section">
        <h3>Socialización y Manejo</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('vive_sola_o_en_grupo')}</label>
            <select
              value={formData.socializacion_tipo || ''}
              onChange={(e) => handleChange('socializacion_tipo', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="sola">{t('options.sola')}</option>
              <option value="pareja">{t('options.pareja')}</option>
              <option value="grupo">{t('options.grupo')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('peleas_recientes')}</label>
            <YesNoChips
              value={formData.peleas_recientes}
              onChange={(val) => handleChange('peleas_recientes', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('manipulacion_frecuente')}</label>
            <select
              value={formData.manipulacion_frecuente || 'NO'}
              onChange={(e) => handleChange('manipulacion_frecuente', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('exposicion_a_luz_solar_directa')}</label>
            <select
              value={formData.exposicion_sol || 'NO'}
              onChange={(e) => handleChange('exposicion_sol', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>
      </div>

      <div id="iguanas-historial" className="form-section">
        <h3>Historial Médico Previo</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('calcio_adicional')}</label>
            <select required value={formData.calcio_adicional || 'NO'} onChange={(e) => handleChange('calcio_adicional', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('multivitaminicos_2')}</label>
            <select required value={formData.multivitaminicos || 'NO'} onChange={(e) => handleChange('multivitaminicos', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('desparasitacion_interna')}</label>
            <select required value={formData.desparasitacion_interna || 'NO'} onChange={(e) => handleChange('desparasitacion_interna', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('historia_de_parasitos')}</label>
            <select
              value={formData.historia_parasitos || 'NO'}
              onChange={(e) => handleChange('historia_parasitos', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('enfermedades_previas_principales')}</label>
            <select
              value={formData.enfermedades_previas || ''}
              onChange={(e) => handleChange('enfermedades_previas', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="infecciones_respiratorias">{t('options.infecciones_respiratorias')}</option>
              <option value="problemas_oseos">{t('options.problemas_oseos')}</option>
              <option value="deficiencias_nutricionales">{t('options.deficiencias_nutricionales')}</option>
              <option value="trauma">{t('options.trauma')}</option>
            </select>
          </div>
        </div>
      </div>

      <div id="iguanas-examen" className="form-section">
        <h3>{section('examen_fisico')}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('temperatura_corporal_c_2')}</label>
            <input type="text" value={formData.temperatura || ''} onChange={(e) => handleChange('temperatura', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{field('peso_corporal_g_kg_2')}</label>
            <input type="text" value={formData.peso_corporal || ''} onChange={(e) => handleChange('peso_corporal', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('condicion_muscular_2')}</label>
            <select value={formData.condicion_muscular || ''} onChange={(e) => handleChange('condicion_muscular', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="excelente">{t('options.excelente')}</option>
              <option value="buena">{t('options.buena')}</option>
              <option value="regular">{t('options.regular')}</option>
              <option value="mala">{t('options.mala')}</option>
              <option value="ausente">{t('options.ausente')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('estado_de_hidratacion_2')}</label>
            <select value={formData.hidratacion || ''} onChange={(e) => handleChange('hidratacion', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="normal">{t('options.normal')}</option>
              <option value="leve">{t('options.leve')}</option>
              <option value="moderado">{t('options.moderado')}</option>
              <option value="severo">{t('options.severo')}</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('piel_evaluacion_rapida')}</label>
            <select
              value={formData.piel_examen || ''}
              onChange={(e) => handleChange('piel_examen', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="normal">{t('options.normal')}</option>
              <option value="descamacion">{t('options.descamacion')}</option>
              <option value="ulceras">{t('options.ulceras')}</option>
              <option value="edema">{t('options.edema')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('extremidades')}</label>
            <select
              value={formData.extremidades_examen || ''}
              onChange={(e) => handleChange('extremidades_examen', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="fuertes">{t('options.fuertes')}</option>
              <option value="debiles">{t('options.debiles')}</option>
              <option value="deformadas">{t('options.deformadas')}</option>
              <option value="fracturadas">{t('options.fracturadas')}</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>{field('estado_de_ojos_2')}</label>
            <select required value={formData.estado_ojos || 'normales'} onChange={(e) => handleChange('estado_ojos', e.target.value)}>
              <option value="normales">{t('options.normales')}</option>
              <option value="hinchazon">{t('options.hinchazon')}</option>
              <option value="opacidad">{t('options.opacidad_corneal')}</option>
              <option value="exoftalmia">{t('options.exoftalmia_ojo_salido')}</option>
            </select>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default IguanasForm;