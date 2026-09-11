import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';
import { useSpeciesFormI18n } from '../../hooks/useSpeciesFormI18n';
import { normalizePetSex } from '../../lib/petSex';
import ReproductiveSexHint from './ReproductiveSexHint';

const AvesForm = ({ formData, setFormData }) => {
  const { t, field, placeholder, section, title } = useSpeciesFormI18n('aves');
  const sexo = normalizePetSex(formData.sexo);
  const [activeSection, setActiveSection] = useState('aves-info-basica');

  const handleChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });
  };

  const toggleSection = useCallback((e) => {
    const section = e.target.closest('.form-section');
    if (section && e.target.tagName === 'H3') section.classList.toggle('collapsed');
  }, []);

  const requiredFields = [
    'nombre_mascota', 'especie_exacta', 'edad', 'sexo', 'peso', 'condicion_corporal',
    'secrecion_nasal', 'respiracion', 'apetito', 'heces', 'plumas',
    'tipo_dieta', 'habitat', 'temperatura_ambiente'
  ];

  const progress = useMemo(() => {
    const filled = requiredFields.filter(field => formData[field] && formData[field] !== '').length;
    return Math.round((filled / requiredFields.length) * 100);
  }, [formData]);

  const sections = [
    { id: 'aves-info-basica', labelKey: 'info_basica', icon: '📋' },
    { id: 'aves-respiratorio', labelKey: 'respiratorio', icon: '🫁' },
    { id: 'aves-digestivo', labelKey: 'digestivo', icon: '🫃' },
    { id: 'aves-reproductivo', labelKey: 'reproductivo', icon: '🥚' },
    { id: 'aves-tegumentario', label: 'Sistema Tegumentario', icon: '🪶' },
    { id: 'aves-neurologico', labelKey: 'neurologico', icon: '🧠' },
    { id: 'aves-comportamiento', labelKey: 'comportamiento', icon: '🦜' },
    { id: 'aves-alimentacion', labelKey: 'alimentacion', icon: '🥗' },
    { id: 'aves-ambiente', labelKey: 'ambiente', icon: '🏠' },
    { id: 'aves-examen-fisico', labelKey: 'examen_fisico', icon: '🩺' },
    { id: 'aves-hallazgos-grupo', label: 'Hallazgos por Grupo', icon: '📊' },
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
      <h2>{title('aves')}</h2>

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
      <div id="aves-info-basica" className="form-section">
        <h3>{section('info_basica')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('nombre_de_la_mascota')}</label>
            <input type="text" required value={formData.nombre_mascota || ''} onChange={(e) => handleChange('nombre_mascota', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{field('especie_exacta')}</label>
            <input type="text" required value={formData.especie_exacta || ''} onChange={(e) => handleChange('especie_exacta', e.target.value)} placeholder={placeholder('ej_amazona_amazonica_melopsittacus_undulatus')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('subespecie_variante')}</label>
            <input type="text" value={formData.subespecie || ''} onChange={(e) => handleChange('subespecie', e.target.value)} placeholder={placeholder('ej_lutino_cinnamon_albino')} />
          </div>
          <div className="form-group">
            <label>{field('edad_anos_meses')}</label>
            <input type="text" required value={formData.edad || ''} onChange={(e) => handleChange('edad', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('edad_confirmada_por_anilla')}</label>
            <YesNoChips
              value={formData.edad_confirmada_anilla}
              onChange={(val) => handleChange('edad_confirmada_anilla', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('sexo')}</label>
            <select required value={sexo || ''} onChange={(e) => handleChange('sexo', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="macho">{t('options.macho')}</option>
              <option value="hembra">{t('options.hembra')}</option>
              <option value="desconocido">{t('options.desconocido')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('peso_actual_g_2')}</label>
            <input type="text" required value={formData.peso || ''} onChange={(e) => handleChange('peso', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('condicion_corporal_2')}</label>
            <select required value={formData.condicion_corporal || ''} onChange={(e) => handleChange('condicion_corporal', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="emaciado">{t('options.emaciado_musculos_ausentes')}</option>
              <option value="delgado">{t('options.delgado')}</option>
              <option value="ideal">{t('options.ideal')}</option>
              <option value="sobrepeso">{t('options.sobrepeso')}</option>
            </select>
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

        <div className="form-row">
          <div className="form-group">
            <label>{field('sexo_confirmado_por')}</label>
            <select
              value={formData.sexo_confirmado_por || ''}
              onChange={(e) => handleChange('sexo_confirmado_por', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="visual">{t('options.visual')}</option>
              <option value="adn">{t('options.adn')}</option>
              <option value="laparoscopia">{t('options.laparoscopia')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('anilla_identificatoria')}</label>
            <select
              value={formData.anilla_tipo || ''}
              onChange={(e) => handleChange('anilla_tipo', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="nacional">{t('options.nacional')}</option>
              <option value="cites">{t('options.cites')}</option>
              <option value="sin_anilla">{t('options.sin_anilla')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('numero_de_anilla')}</label>
            <input
              type="text"
              value={formData.anilla_numero || ''}
              onChange={(e) => handleChange('anilla_numero', e.target.value)}
            />
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
              <option value="afectuoso">{t('options.afectuoso')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sistema Respiratorio */}
      <div id="aves-respiratorio" className="form-section">
        <h3>{section('respiratorio')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('dificultad_respiratoria')}</label>
            <select required value={formData.dificultad_respiratoria || 'NO'} onChange={(e) => handleChange('dificultad_respiratoria', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="abdomen_moviendo">{t('options.abdomen_moviendose_exageradamente')}</option>
              <option value="boca_abierta">{t('options.boca_abierta')}</option>
              <option value="aleteo_rapido">{t('options.aleteo_rapido')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('frecuencia_respiratoria')}</label>
            <input type="text" value={formData.frecuencia_respiratoria || ''} onChange={(e) => handleChange('frecuencia_respiratoria', e.target.value)} placeholder={placeholder('contar_1_minuto')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('inspiratoria_o_espiratoria_predominante')}</label>
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
            <label>{field('ruidos_respiratorios')}</label>
            <select required value={formData.ruidos_respiratorios || 'NO'} onChange={(e) => handleChange('ruidos_respiratorios', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="silbidos">{t('options.silbidos')}</option>
              <option value="ronquidos">{t('options.ronquidos')}</option>
              <option value="estertores">{t('options.estertores')}</option>
              <option value="estridor">{t('options.estridor')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('secreciones_nasales_orales')}</label>
            <select required value={formData.secreciones || 'NO'} onChange={(e) => handleChange('secreciones', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="clara">{t('options.clara')}</option>
              <option value="mucosa">{t('options.mucosa')}</option>
              <option value="purulenta">{t('options.purulenta')}</option>
              <option value="sangre">{t('options.sangre')}</option>
            </select>
          </div>
        </div>

        {formData.secreciones !== 'NO' && (
          <div className="form-group">
            <label>{field('localizacion')}</label>
            <select value={formData.secreciones_localizacion || ''} onChange={(e) => handleChange('secreciones_localizacion', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="unilateral">{t('options.unilateral')}</option>
              <option value="bilateral">{t('options.bilateral')}</option>
              <option value="solo_boca">{t('options.solo_en_boca')}</option>
            </select>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>{field('cambio_en_canto_vocalizacion')}</label>
            <YesNoChips
              value={formData.cambio_vocalizacion}
              onChange={(val) => handleChange('cambio_vocalizacion', val)}
            />
          </div>
          <div className="form-group">
            <label>{field('exposicion_a_humo_aerosoles')}</label>
            <YesNoChips
              value={formData.exposicion_humo}
              onChange={(val) => handleChange('exposicion_humo', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('uso_de_aerosoles_limpiadores')}</label>
            <YesNoChips
              value={formData.uso_limpiadores}
              onChange={(val) => handleChange('uso_limpiadores', val)}
            />
          </div>
        </div>
      </div>

      {/* Sistema Digestivo */}
      <div id="aves-digestivo" className="form-section">
        <h3>{section('digestivo')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('estado_del_buche')}</label>
            <select required value={formData.buche || 'normal'} onChange={(e) => handleChange('buche', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="distendido">{t('options.distendido_por_gt_4_horas')}</option>
              <option value="liquido">{t('options.liquido')}</option>
              <option value="rancio">{t('options.alimento_rancio')}</option>
              <option value="vacio">{t('options.vacio_cuando_deberia_estar_lleno')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('regurgitacion_vomito')}</label>
            <select required value={formData.regurgitacion || 'NO'} onChange={(e) => handleChange('regurgitacion', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="regurgitacion">{t('options.regurgitacion_suave')}</option>
              <option value="vomito">{t('options.vomito_violento')}</option>
            </select>
          </div>
        </div>

        {formData.regurgitacion !== 'NO' && (
          <div className="form-group">
            <label>{field('contenido')}</label>
            <select value={formData.contenido || ''} onChange={(e) => handleChange('contenido', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="sin_digerir">{t('options.alimento_sin_digerir')}</option>
              <option value="liquido_amarillo">{t('options.liquido_amarillo')}</option>
              <option value="sangre">{t('options.sangre')}</option>
              <option value="fecaloide">{t('options.material_fecaloide')}</option>
            </select>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>{field('heces_color')}</label>
            <select required value={formData.heces_color || 'normal'} onChange={(e) => handleChange('heces_color', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="verde_oscuro">{t('options.verde_oscuro')}</option>
              <option value="amarillo">{t('options.amarillo')}</option>
              <option value="rojo">{t('options.rojo')}</option>
              <option value="blanco">{t('options.blanco')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('heces_consistencia')}</label>
            <select required value={formData.heces_consistencia || 'normales'} onChange={(e) => handleChange('heces_consistencia', e.target.value)}>
              <option value="normales">{t('options.normales')}</option>
              <option value="liquidas">{t('options.liquidas')}</option>
              <option value="formadas">{t('options.formadas')}</option>
              <option value="sin_formar">{t('options.sin_formar')}</option>
              <option value="con_moco">{t('options.con_moco')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('frecuencia_veces_dia')}</label>
            <input type="text" value={formData.heces_frecuencia || ''} onChange={(e) => handleChange('heces_frecuencia', e.target.value)} placeholder={placeholder('varia_por_tamano_pequenas_gt_20_veces_dia')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('cambio_en_proporcion_de_heces')}</label>
            <select
              value={formData.heces_proporcion || ''}
              onChange={(e) => handleChange('heces_proporcion', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="exceso_uratos">{t('options.exceso_de_uratos')}</option>
              <option value="exceso_materia_fecal">{t('options.exceso_de_materia_fecal')}</option>
              <option value="exceso_liquido">{t('options.exceso_de_liquido')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('ingesta_reciente_de_riesgo')}</label>
            <select
              value={formData.ingesta_riesgo || ''}
              onChange={(e) => handleChange('ingesta_riesgo', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="plantas_toxicas">{t('options.plantas_toxicas')}</option>
              <option value="chocolate">{t('options.chocolate')}</option>
              <option value="agua_estancada">{t('options.agua_estancada')}</option>
              <option value="alimentos_moho">{t('options.alimentos_con_moho')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sistema Reproductivo */}
      <div id="aves-reproductivo" className="form-section">
        <h3>{section('reproductivo')}</h3>
                <ReproductiveSexHint sexo={sexo} />
        {sexo === 'hembra' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>{field('esta_poniendo_huevos')}</label>
                <YesNoChips
                  value={formData.poniendo_huevos}
                  onChange={(val) => handleChange('poniendo_huevos', val)}
                />
              </div>
              <div className="form-group">
                <label>{field('dificultad_para_poner_2')}</label>
                <YesNoChips
                  value={formData.dificultad_poner}
                  onChange={(val) => handleChange('dificultad_poner', val)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{field('estado_de_huevos')}</label>
                <select value={formData.estado_huevos || ''} onChange={(e) => handleChange('estado_huevos', e.target.value)}>
                  <option value="">{t('select')}</option>
                  <option value="normales">{t('options.normales')}</option>
                  <option value="deformes">{t('options.deformes')}</option>
                  <option value="sin_cascara">{t('options.sin_cascara')}</option>
                  <option value="pegajosos">{t('options.pegajosos')}</option>
                  <option value="rotos">{t('options.rotos_internamente')}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{field('secrecion_cloacal')}</label>
                <select value={formData.secrecion_cloacal || 'NO'} onChange={(e) => handleChange('secrecion_cloacal', e.target.value)}>
                  <option value="NO">{t('no')}</option>
                  <option value="sanguinolenta">{t('options.sanguinolenta')}</option>
                  <option value="purulenta">{t('options.purulenta')}</option>
                  <option value="mucosa">{t('options.mucosa')}</option>
                </select>
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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{field('agresividad_repentina')}</label>
                <YesNoChips
                  value={formData.agresividad}
                  onChange={(val) => handleChange('agresividad', val)}
                />
              </div>
              <div className="form-group">
                <label>{field('postura_de_cortejo_constante')}</label>
                <YesNoChips
                  value={formData.postura_cortejo}
                  onChange={(val) => handleChange('postura_cortejo', val)}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sistema Tegumentario */}
      <div id="aves-tegumentario" className="form-section">
        <h3>Sistema Tegumentario</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('plumas')}</label>
            <select required value={formData.plumas || 'normales'} onChange={(e) => handleChange('plumas', e.target.value)}>
              <option value="normales">{t('options.normales')}</option>
              <option value="arrancamiento_simetrico">{t('options.arrancamiento_simetrico_alas_pecho')}</option>
              <option value="arrancamiento_asimetrico">{t('options.arrancamiento_asimetrico')}</option>
              <option value="vaina_sangrante">{t('options.plumas_en_vaina_sangrante')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('nuevas_plumas_en_crecimiento')}</label>
            <YesNoChips
              value={formData.nuevas_plumas}
              onChange={(val) => handleChange('nuevas_plumas', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('piel_2')}</label>
            <select required value={formData.piel || 'normal'} onChange={(e) => handleChange('piel', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="descamacion">{t('options.descamacion_excesiva')}</option>
              <option value="costras">{t('options.costras_en_cabeza')}</option>
              <option value="inflamacion">{t('options.inflamacion_periorbital')}</option>
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
            <label>{field('puntos_rojos_en_piel_acaros_rojos')}</label>
            <select
              value={formData.puntos_rojos_piel || 'NO'}
              onChange={(e) => handleChange('puntos_rojos_piel', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('escamas_engrosadas_2')}</label>
            <select
              value={formData.escamas || 'NO'}
              onChange={(e) => handleChange('escamas', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{field('unas_pico')}</label>
          <select required value={formData.unas_pico || 'normales'} onChange={(e) => handleChange('unas_pico', e.target.value)}>
            <option value="normales">{t('options.normales')}</option>
            <option value="crecimiento_excesivo">{t('options.crecimiento_excesivo')}</option>
            <option value="grietas">{t('options.grietas')}</option>
            <option value="deformidades">{t('options.deformidades')}</option>
            <option value="sangrado">{t('options.sangrado')}</option>
          </select>
        </div>
      </div>

      {/* Sistema Neurológico */}
      <div id="aves-neurologico" className="form-section">
        <h3>{section('neurologico')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('incoordinacion_2')}</label>
            <select required value={formData.incoordinacion || 'NO'} onChange={(e) => handleChange('incoordinacion', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="caidas">{t('options.caidas_laterales')}</option>
              <option value="no_posarse">{t('options.no_puede_posarse')}</option>
              <option value="movimientos_circulares">{t('options.movimientos_circulares')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('temblor')}</label>
            <select value={formData.temblor || 'NO'} onChange={(e) => handleChange('temblor', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="cabeza">{t('options.cabeza')}</option>
              <option value="cuerpo">{t('options.cuerpo')}</option>
              <option value="extremidades">{t('options.extremidades')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('convulsiones_2')}</label>
            <select required value={formData.convulsiones || 'NO'} onChange={(e) => handleChange('convulsiones', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="completa">{t('options.completa_perdida_de_conciencia')}</option>
              <option value="parcial">{t('options.parcial_solo_cabeza')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('mejora_en_reposo')}</label>
            <select
              value={formData.mejora_reposo || 'NO'}
              onChange={(e) => handleChange('mejora_reposo', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('relacion_con_alimentacion')}</label>
            <select
              value={formData.relacion_alimentacion || ''}
              onChange={(e) => handleChange('relacion_alimentacion', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="mejora_comida">{t('options.mejora_con_comida')}</option>
              <option value="empeora_ayunas">{t('options.empeora_en_ayunas')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('desencadenantes')}</label>
            <select
              value={formData.desencadenantes || ''}
              onChange={(e) => handleChange('desencadenantes', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="ruido_fuerte">{t('options.ruido_fuerte')}</option>
              <option value="estres">{t('options.estres')}</option>
              <option value="ninguno">{t('options.ninguno')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Comportamiento */}
      <div id="aves-comportamiento" className="form-section">
        <h3>{section('comportamiento')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('cambio_en_vocalizacion')}</label>
            <select required value={formData.cambio_voz || 'NO'} onChange={(e) => handleChange('cambio_voz', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="silencio">{t('options.silencio_total')}</option>
              <option value="cambio_tono">{t('options.cambio_en_tono')}</option>
              <option value="gritos">{t('options.gritos_de_dolor')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('interaccion_social')}</label>
            <select required value={formData.interaccion_social || 'normal'} onChange={(e) => handleChange('interaccion_social', e.target.value)}>
              <option value="normal">{t('options.normal')}</option>
              <option value="aislamiento">{t('options.aislamiento')}</option>
              <option value="agresividad">{t('options.agresividad_repentina')}</option>
              <option value="apegamiento">{t('options.apegamiento_excesivo')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('patrones_de_sueno')}</label>
            <select required value={formData.sueno || 'normal'} onChange={(e) => handleChange('sueno', e.target.value)}>
              <option value="normal">{t('options.normal_parado_en_una_pata')}</option>
              <option value="acostado">{t('options.acostado_en_el_fondo')}</option>
              <option value="cabeza_girada">{t('options.con_cabeza_girada')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('horas_de_sueno_diarias')}</label>
            <input type="text" value={formData.horas_sueno || ''} onChange={(e) => handleChange('horas_sueno', e.target.value)} placeholder={placeholder('normal_10_12_horas')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('cambio_en_relacion_con_dueno')}</label>
            <select
              value={formData.cambio_relacion_dueno || 'NO'}
              onChange={(e) => handleChange('cambio_relacion_dueno', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('cambio_en_patron_de_canto')}</label>
            <select
              value={formData.cambio_patron_canto || 'NO'}
              onChange={(e) => handleChange('cambio_patron_canto', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alimentación */}
      <div id="aves-alimentacion" className="form-section">
        <h3>{section('alimentacion')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('tipo_de_dieta_2')}</label>
            <select required value={formData.tipo_dieta || ''} onChange={(e) => handleChange('tipo_dieta', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="semillas">{t('options.semillas')}</option>
              <option value="pellets">{t('options.pellets')}</option>
              <option value="mixta">{t('options.mixta')}</option>
              <option value="casera">{t('options.casera')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('suplementos')}</label>
            <input type="text" value={formData.suplementos || ''} onChange={(e) => handleChange('suplementos', e.target.value)} placeholder={placeholder('calcio_vitaminas_etc')} />
          </div>
        </div>

        <div className="form-group">
          <label>{field('frutas_verduras_frescas')}</label>
          <select required value={formData.frutas_verduras || ''} onChange={(e) => handleChange('frutas_verduras', e.target.value)}>
            <option value="">{t('select')}</option>
            <option value="SI">{t('yes')}</option>
            <option value="NO">{t('no')}</option>
          </select>
        </div>
        {formData.frutas_verduras === 'SI' && (
          <div className="form-group">
            <label>{field('cuales_frutas_verduras')}</label>
            <input
              type="text"
              value={formData.frutas_verduras_cuales || ''}
              onChange={(e) => handleChange('frutas_verduras_cuales', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Ambiente */}
      <div id="aves-ambiente" className="form-section">
        <h3>{section('ambiente')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('tamano_de_jaula_cm')}</label>
            <input type="text" value={formData.tamano_jaula || ''} onChange={(e) => handleChange('tamano_jaula', e.target.value)} placeholder={placeholder('largo_x_ancho_x_alto')} />
          </div>
          <div className="form-group">
            <label>{field('ubicacion_2')}</label>
            <select required value={formData.ubicacion || ''} onChange={(e) => handleChange('ubicacion', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="interior">{t('options.habitat_interior')}</option>
              <option value="exterior">{t('options.habitat_exterior')}</option>
              <option value="ventana">{t('options.ventana')}</option>
              <option value="cocina">{t('options.cocina')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('temperatura_ambiente_c_2')}</label>
            <input type="text" value={formData.temperatura_ambiente || ''} onChange={(e) => handleChange('temperatura_ambiente', e.target.value)} placeholder={placeholder('ideal_20_24_c')} />
          </div>
          <div className="form-group">
            <label>{field('iluminacion')}</label>
            <select required value={formData.iluminacion || ''} onChange={(e) => handleChange('iluminacion', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="natural">{t('options.luz_natural')}</option>
              <option value="uvb">{t('options.luz_uvb')}</option>
              <option value="sin_luz">{t('options.sin_luz_natural')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('ventilacion')}</label>
            <select required value={formData.ventilacion || ''} onChange={(e) => handleChange('ventilacion', e.target.value)}>
              <option value="">{t('select')}</option>
              <option value="buena">{t('options.buena')}</option>
              <option value="corrientes">{t('options.con_corrientes_de_aire')}</option>
              <option value="estancada">{t('options.estancada')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('contacto_con_otras_aves')}</label>
            <select required value={formData.contacto_aves || 'NO'} onChange={(e) => handleChange('contacto_aves', e.target.value)}>
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('introduccion_reciente_de_nuevas_aves')}</label>
            <select
              value={formData.introduccion_nuevas_aves || 'NO'}
              onChange={(e) => handleChange('introduccion_nuevas_aves', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('contacto_con_aves_silvestres')}</label>
            <select
              value={formData.contacto_aves_silvestres || 'NO'}
              onChange={(e) => handleChange('contacto_aves_silvestres', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{field('limpieza_de_jaula_3')}</label>
          <select required value={formData.limpieza || ''} onChange={(e) => handleChange('limpieza', e.target.value)}>
            <option value="">{t('select')}</option>
            <option value="diaria">{t('options.diaria')}</option>
            <option value="cada_2_dias">{t('options.cada_2_dias')}</option>
            <option value="semanal">{t('options.semanal')}</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('lavado_de_comederos_bebederos')}</label>
            <select
              value={formData.lavado_comederos || ''}
              onChange={(e) => handleChange('lavado_comederos', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="diario">{t('options.diario')}</option>
              <option value="semanal">{t('options.semanal')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('uso_de_desinfectantes')}</label>
            <select
              value={formData.uso_desinfectantes || 'NO'}
              onChange={(e) => handleChange('uso_desinfectantes', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Examen Físico */}
      <div id="aves-examen-fisico" className="form-section">
        <h3>{section('examen_fisico')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{field('temperatura')}</label>
            <input type="text" value={formData.temperatura || ''} onChange={(e) => handleChange('temperatura', e.target.value)} placeholder={placeholder('normal_40_42_c')} />
          </div>
          <div className="form-group">
            <label>{field('frecuencia_cardiaca')}</label>
            <input type="text" value={formData.frecuencia_cardiaca || ''} onChange={(e) => handleChange('frecuencia_cardiaca', e.target.value)} placeholder={placeholder('normal_200_400')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('peso_corporal_g_2')}</label>
            <input type="text" value={formData.peso_corporal || ''} onChange={(e) => handleChange('peso_corporal', e.target.value)} />
          </div>
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
        
        <div className="form-row">
          <div className="form-group">
            <label>{field('condicion_muscular_pectoral')}</label>
            <select
              value={formData.condicion_muscular_pectoral || ''}
              onChange={(e) => handleChange('condicion_muscular_pectoral', e.target.value)}
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
            <label>{field('plumas_examen_fisico')}</label>
            <select
              value={formData.plumas_examen || ''}
              onChange={(e) => handleChange('plumas_examen', e.target.value)}
            >
              <option value="">{t('select')}</option>
              <option value="brillo_normal">{t('options.brillo_normal')}</option>
              <option value="opacas">{t('options.opacas')}</option>
              <option value="caidas">{t('options.caidas')}</option>
              <option value="rotas">{t('options.rotas')}</option>
              <option value="sangrantes">{t('options.sangrantes')}</option>
            </select>
          </div>
        </div>
      </div>

      <div id="aves-hallazgos-grupo" className="form-section">
        <h3>Hallazgos Específicos por Grupo</h3>

        <div className="form-row">
          <div className="form-group">
            <label>{field('psitacidos_historia_de_comportamiento_estereotipado')}</label>
            <select
              value={formData.psitacidos_estereotipias || 'NO'}
              onChange={(e) => handleChange('psitacidos_estereotipias', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('psitacidos_exposicion_a_metales_pesados')}</label>
            <select
              value={formData.psitacidos_metales || 'NO'}
              onChange={(e) => handleChange('psitacidos_metales', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('passeriformes_historia_de_twirling_giros')}</label>
            <select
              value={formData.passeriformes_twirling || 'NO'}
              onChange={(e) => handleChange('passeriformes_twirling', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('passeriformes_plumas_de_cola_caidas')}</label>
            <select
              value={formData.passeriformes_cola_caida || 'NO'}
              onChange={(e) => handleChange('passeriformes_cola_caida', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('passeriformes_heces_verdes_brillantes')}</label>
            <select
              value={formData.passeriformes_heces_verdes || 'NO'}
              onChange={(e) => handleChange('passeriformes_heces_verdes', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('aves_exoticas_pequenas_huevos_palpables_en_abdomen')}</label>
            <select
              value={formData.exoticas_huevos_abdomen || 'NO'}
              onChange={(e) => handleChange('exoticas_huevos_abdomen', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{field('aves_exoticas_pequenas_plumas_de_cola_rotas')}</label>
            <select
              value={formData.exoticas_cola_rota || 'NO'}
              onChange={(e) => handleChange('exoticas_cola_rota', e.target.value)}
            >
              <option value="NO">{t('no')}</option>
              <option value="SI">{t('yes')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{field('aves_exoticas_pequenas_respiracion_abdominal_excesiva')}</label>
            <select
              value={formData.exoticas_respiracion_abdominal || 'NO'}
              onChange={(e) => handleChange('exoticas_respiracion_abdominal', e.target.value)}
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

export default AvesForm;
