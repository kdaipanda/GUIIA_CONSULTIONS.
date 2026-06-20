import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';

const IguanasForm = ({ formData, setFormData }) => {
  const [activeSection, setActiveSection] = useState('iguanas-info-basica');

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
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
    { id: 'iguanas-info-basica', label: 'Información Básica', icon: '📋' },
    { id: 'iguanas-respiratorio', label: 'Sistema Respiratorio', icon: '🫁' },
    { id: 'iguanas-tegumentario', label: 'Sistema Tegumentario', icon: '🦎' },
    { id: 'iguanas-digestivo', label: 'Sistema Digestivo', icon: '🫃' },
    { id: 'iguanas-neurologico', label: 'Sistema Neurológico', icon: '🧠' },
    { id: 'iguanas-comportamiento', label: 'Comportamiento', icon: '👀' },
    { id: 'iguanas-reproductivo', label: 'Sistema Reproductivo', icon: '🔬' },
    { id: 'iguanas-alimentacion', label: 'Alimentación', icon: '🥗' },
    { id: 'iguanas-ambiente', label: 'Ambiente', icon: '🏠' },
    { id: 'iguanas-socializacion', label: 'Socialización y Manejo', icon: '🤝' },
    { id: 'iguanas-historial', label: 'Historial Médico Previo', icon: '📁' },
    { id: 'iguanas-examen', label: 'Examen Físico', icon: '🩺' },
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
      <h2>Datos de la mascota - Iguana</h2>

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
      
      <div id="iguanas-info-basica" className="form-section">
        <h3>Información Básica</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Nombre de la mascota *</label>
            <input type="text" required value={formData.nombre_mascota || ''} onChange={(e) => handleChange('nombre_mascota', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Especie Exacta *</label>
            <input type="text" required value={formData.especie_exacta || ''} onChange={(e) => handleChange('especie_exacta', e.target.value)} placeholder="Ej: Iguana iguana, Ctenosaura similis" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Subespecie/Variante</label>
            <input type="text" value={formData.subespecie || ''} onChange={(e) => handleChange('subespecie', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Edad Estimada (años) *</label>
            <input type="text" required value={formData.edad || ''} onChange={(e) => handleChange('edad', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Edad confirmada?</label>
            <YesNoChips
              value={formData.edad_confirmada}
              onChange={(val) => handleChange('edad_confirmada', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tamaño del Cuerpo *</label>
            <input type="text" required value={formData.tamano_cuerpo || ''} onChange={(e) => handleChange('tamano_cuerpo', e.target.value)} placeholder="Largo total y Largo snout-vent (cm)" />
          </div>
          <div className="form-group">
            <label>Sexo *</label>
            <select required value={formData.sexo || ''} onChange={(e) => handleChange('sexo', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Sexo confirmado por?</label>
            <select
              value={formData.sexo_confirmado_por || ''}
              onChange={(e) => handleChange('sexo_confirmado_por', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="visual">Visual</option>
              <option value="comportamiento">Por comportamiento</option>
              <option value="poros_femorales">Por poros femorales</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Peso Actual (g/kg) *</label>
            <input type="text" required value={formData.peso || ''} onChange={(e) => handleChange('peso', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Condición Corporal *</label>
            <select required value={formData.condicion_corporal || ''} onChange={(e) => handleChange('condicion_corporal', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="emaciado">Emaciado</option>
              <option value="delgado">Delgado</option>
              <option value="ideal">Ideal</option>
              <option value="sobrepeso">Sobrepeso</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Peso habitual (g/kg)</label>
            <input
              type="text"
              value={formData.peso_habitual || ''}
              onChange={(e) => handleChange('peso_habitual', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>% pérdida/ganancia de peso</label>
            <input
              type="text"
              value={formData.porcentaje_cambio_peso || ''}
              onChange={(e) => handleChange('porcentaje_cambio_peso', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Origen *</label>
            <select required value={formData.origen || ''} onChange={(e) => handleChange('origen', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="silvestre">Silvestre</option>
              <option value="criadero">Criadero</option>
              <option value="comercial">Comercial</option>
              <option value="regalo">Regalo</option>
            </select>
          </div>
          {formData.origen === 'silvestre' && (
            <div className="form-group">
              <label>¿Especimen capturado?</label>
              <YesNoChips
                value={formData.silvestre_capturada}
                onChange={(val) => handleChange('silvestre_capturada', val)}
              />
            </div>
          )}
          <div className="form-group">
            <label>Duración del Problema *</label>
            <select required value={formData.duracion_problema || ''} onChange={(e) => handleChange('duracion_problema', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="<12h">&lt; 12 horas</option>
              <option value="12-24h">12-24 horas</option>
              <option value="2-3dias">2-3 días</option>
              <option value="4-7dias">4-7 días</option>
              <option value=">1semana">&gt; 1 semana</option>
            </select>
          </div>
        </div>
      </div>

      <div id="iguanas-respiratorio" className="form-section">
        <h3>Sistema Respiratorio</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Secreción Nasal/Oral *</label>
            <select required value={formData.secrecion_nasal || 'NO'} onChange={(e) => handleChange('secrecion_nasal', e.target.value)}>
              <option value="NO">No</option>
              <option value="clara">Clara</option>
              <option value="mucosa">Mucosa</option>
              <option value="purulenta">Purulenta</option>
              <option value="sangre">Sangre</option>
            </select>
          </div>
          {formData.secrecion_nasal !== 'NO' && (
            <div className="form-group">
              <label>Localización</label>
              <select value={formData.secrecion_localizacion || ''} onChange={(e) => handleChange('secrecion_localizacion', e.target.value)}>
                <option value="">Seleccionar</option>
                <option value="unilateral">Unilateral</option>
                <option value="bilateral">Bilateral</option>
              </select>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Burbujas en boca/nariz? *</label>
            <YesNoChips
              value={formData.burbujas}
              onChange={(val) => handleChange('burbujas', val)}
            />
          </div>
          <div className="form-group">
            <label>Dificultad Respiratoria *</label>
            <select required value={formData.dificultad_respiratoria || 'NO'} onChange={(e) => handleChange('dificultad_respiratoria', e.target.value)}>
              <option value="NO">No</option>
              <option value="boca_abierta">Boca abierta</option>
              <option value="movimiento_cuello">Movimiento cuello exagerado</option>
              <option value="aleteo">Aleteo rápido</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Frecuencia Respiratoria (rpm)</label>
            <input type="text" value={formData.frecuencia_respiratoria || ''} onChange={(e) => handleChange('frecuencia_respiratoria', e.target.value)} placeholder="Normal: 4-10" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Respiración predominante?</label>
            <select
              value={formData.respiracion_predominante || ''}
              onChange={(e) => handleChange('respiracion_predominante', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="inspiratoria">Inspiratoria</option>
              <option value="espiratoria">Espiratoria</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Temperatura ambiente baja?</label>
            <YesNoChips
              value={formData.temperatura_baja}
              onChange={(val) => handleChange('temperatura_baja', val)}
            />
          </div>
          <div className="form-group">
            <label>¿Humedad inadecuada?</label>
            <YesNoChips
              value={formData.humedad_inadecuada}
              onChange={(val) => handleChange('humedad_inadecuada', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Falta de calentador térmico?</label>
            <YesNoChips
              value={formData.falta_calentador}
              onChange={(val) => handleChange('falta_calentador', val)}
            />
          </div>
          <div className="form-group">
            <label>¿Ventilación inadecuada?</label>
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
            <label>Piel *</label>
            <select required value={formData.piel || 'normal'} onChange={(e) => handleChange('piel', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="descamacion">Descamación excesiva</option>
              <option value="costras">Costras</option>
              <option value="ulceras">Úlceras</option>
              <option value="hinchazon">Hinchazón</option>
            </select>
          </div>
          <div className="form-group">
            <label>Localización Específica</label>
            <select value={formData.piel_localizacion || ''} onChange={(e) => handleChange('piel_localizacion', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="cabeza">Cabeza</option>
              <option value="cuello">Cuello</option>
              <option value="tronco">Tronco</option>
              <option value="extremidades">Extremidades</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Edema en párpados? *</label>
            <YesNoChips
              value={formData.edema_parpados}
              onChange={(val) => handleChange('edema_parpados', val)}
            />
          </div>
          <div className="form-group">
            <label>¿Coloración anormal? *</label>
            <select required value={formData.coloracion_anormal || 'NO'} onChange={(e) => handleChange('coloracion_anormal', e.target.value)}>
              <option value="NO">No</option>
              <option value="amarillenta">Amarillenta (ictericia)</option>
              <option value="oscura">Oscura</option>
              <option value="palida">Pálida</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Estado de los Ojos *</label>
            <select required value={formData.ojos || 'normales'} onChange={(e) => handleChange('ojos', e.target.value)}>
              <option value="normales">Normales</option>
              <option value="cerrados">Cerrados</option>
              <option value="hinchados">Hinchados</option>
              <option value="secrecion">Secreción</option>
              <option value="opacidad">Opacidad corneal</option>
            </select>
          </div>
          <div className="form-group">
            <label>Uñas *</label>
            <select required value={formData.unas || 'normales'} onChange={(e) => handleChange('unas', e.target.value)}>
              <option value="normales">Normales</option>
              <option value="crecimiento_excesivo">Crecimiento excesivo</option>
              <option value="grietas">Grietas</option>
              <option value="deformidades">Deformidades</option>
              <option value="sangrado">Sangrado</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>¿Mejora con limpieza?</label>
            <YesNoChips
              value={formData.mejora_con_limpieza}
              onChange={(val) => handleChange('mejora_con_limpieza', val)}
            />
          </div>
          <div className="form-group">
            <label>¿Dificultad para caminar?</label>
            <YesNoChips
              value={formData.dificultad_caminar}
              onChange={(val) => handleChange('dificultad_caminar', val)}
            />
          </div>
        </div>
      </div>

      <div id="iguanas-digestivo" className="form-section">
        <h3>Sistema Digestivo</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Apetito *</label>
            <select required value={formData.apetito || 'normal'} onChange={(e) => handleChange('apetito', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="anorexia_total">Anorexia total (&gt;48h)</option>
              <option value="anorexia_parcial">Anorexia parcial</option>
            </select>
          </div>
          {(formData.apetito === 'anorexia_total' || formData.apetito === 'anorexia_parcial') && (
            <div className="form-group">
              <label>Tiempo sin comer (horas/días)</label>
              <input type="text" value={formData.tiempo_sin_comer || ''} onChange={(e) => handleChange('tiempo_sin_comer', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Come vegetales? *</label>
            <YesNoChips
              value={formData.come_vegetales}
              onChange={(val) => handleChange('come_vegetales', val)}
            />
          </div>
          <div className="form-group">
            <label>¿Come fruta? *</label>
            <YesNoChips
              value={formData.come_fruta}
              onChange={(val) => handleChange('come_fruta', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Calcio suplementado? *</label>
            <YesNoChips
              value={formData.calcio_suplementado}
              onChange={(val) => handleChange('calcio_suplementado', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Heces *</label>
            <select required value={formData.heces || 'normal'} onChange={(e) => handleChange('heces', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="ausentes">Ausentes (&gt;72h)</option>
              <option value="blandas">Blandas</option>
              <option value="liquidas">Líquidas</option>
              <option value="con_sangre">Con sangre</option>
              <option value="con_parasitos">Con parásitos</option>
            </select>
          </div>
          <div className="form-group">
            <label>Frecuencia (veces/semana)</label>
            <input type="text" value={formData.heces_frecuencia || ''} onChange={(e) => handleChange('heces_frecuencia', e.target.value)} placeholder="Normal: 1-7 según temperatura" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Color de las heces</label>
            <select
              value={formData.heces_color || ''}
              onChange={(e) => handleChange('heces_color', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="verde_oscuro">Verde oscuro</option>
              <option value="amarillo">Amarillo</option>
              <option value="rojizo">Rojizo (sangre)</option>
              <option value="blanco_moho">Blanco (moho)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Consistencia de las heces</label>
            <select
              value={formData.heces_consistencia || ''}
              onChange={(e) => handleChange('heces_consistencia', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="formadas">Formadas</option>
              <option value="pastosas">Pastosas</option>
              <option value="liquidas">Líquidas</option>
              <option value="con_moco">Con moco</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Abdomen</label>
            <select
              value={formData.abdomen || ''}
              onChange={(e) => handleChange('abdomen', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="distendido">Distendido</option>
              <option value="doloroso">Doloroso al tacto</option>
              <option value="ruidos_ausentes">Ruidos intestinales ausentes</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Palpación de cuerpo extraño?</label>
            <YesNoChips
              value={formData.cuerpo_extrano}
              onChange={(val) => handleChange('cuerpo_extrano', val)}
            />
          </div>
        </div>

        {formData.cuerpo_extrano === 'SI' && (
          <div className="form-group">
            <label>Ubicación del cuerpo extraño</label>
            <input
              type="text"
              value={formData.cuerpo_extrano_ubicacion || ''}
              onChange={(e) => handleChange('cuerpo_extrano_ubicacion', e.target.value)}
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>¿Deshidratación? *</label>
            <YesNoChips
              value={formData.deshidratacion}
              onChange={(val) => handleChange('deshidratacion', val)}
            />
          </div>
        </div>
      </div>

      <div id="iguanas-neurologico" className="form-section">
        <h3>Sistema Neurológico</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Inestabilidad *</label>
            <select required value={formData.inestabilidad || 'NO'} onChange={(e) => handleChange('inestabilidad', e.target.value)}>
              <option value="NO">No</option>
              <option value="temblor">Temblor en extremidades</option>
              <option value="caidas">Caídas laterales</option>
              <option value="no_mantiene">No puede mantenerse</option>
            </select>
          </div>
          <div className="form-group">
            <label>Convulsiones *</label>
            <select required value={formData.convulsiones || 'NO'} onChange={(e) => handleChange('convulsiones', e.target.value)}>
              <option value="NO">No</option>
              <option value="temblor_generalizado">Temblor generalizado</option>
              <option value="focales">Convulsiones focales</option>
              <option value="generalizadas">Convulsiones generalizadas</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Progresión *</label>
            <select
              required
              value={formData.progresion_neuro || ''}
              onChange={(e) => handleChange('progresion_neuro', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="lenta">Lenta (meses)</option>
              <option value="rapida">Rápida (semanas)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Desencadenantes</label>
            <select
              value={formData.desencadenantes || ''}
              onChange={(e) => handleChange('desencadenantes', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="estres">Estrés</option>
              <option value="manipulacion">Manipulación</option>
              <option value="ninguno">Ninguno</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Letargo Extremo *</label>
            <select required value={formData.letargo || 'NO'} onChange={(e) => handleChange('letargo', e.target.value)}>
              <option value="NO">No</option>
              <option value="no_se_mueve">No se mueve</option>
              <option value="no_responde">No responde a estímulos</option>
              <option value="hipotermia">Hipotermia</option>
            </select>
          </div>
        </div>
      </div>

      <div id="iguanas-comportamiento" className="form-section">
        <h3>Comportamiento</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Actividad diurna/nocturna *</label>
            <select required value={formData.actividad || 'normal'} onChange={(e) => handleChange('actividad', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="hiperactivo">Hiperactivo</option>
              <option value="letargico">Letárgico</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Cambio en patrón de actividad? *</label>
            <YesNoChips
              value={formData.cambio_actividad}
              onChange={(val) => handleChange('cambio_actividad', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Interacción ambiental</label>
            <select
              value={formData.interaccion_ambiental || ''}
              onChange={(e) => handleChange('interaccion_ambiental', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="evita_zona_caliente">Evita zona caliente</option>
              <option value="evita_zona_fria">Evita zona fría</option>
              <option value="no_usa_escondites">No usa escondites</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Cambio en relación con el dueño?</label>
            <YesNoChips
              value={formData.cambio_relacion_dueno}
              onChange={(val) => handleChange('cambio_relacion_dueno', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Comportamiento de termorregulación</label>
            <select
              value={formData.comportamiento_termorregulacion || ''}
              onChange={(e) => handleChange('comportamiento_termorregulacion', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="no_se_acerca_calor">No se acerca a la fuente de calor</option>
              <option value="se_queda_zona_fria">Se queda en zona fría</option>
              <option value="no_se_mueve">No se mueve</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Cambio en patrón habitual de termorregulación?</label>
            <YesNoChips
              value={formData.cambio_patron_termorregulacion}
              onChange={(val) => handleChange('cambio_patron_termorregulacion', val)}
            />
          </div>
        </div>
      </div>

      <div id="iguanas-reproductivo" className="form-section">
        <h3>Sistema Reproductivo</h3>
        
        {formData.sexo === 'hembra' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>¿Última puesta? (días atrás)</label>
                <input type="text" value={formData.ultima_puesta || ''} onChange={(e) => handleChange('ultima_puesta', e.target.value)} />
              </div>
              <div className="form-group">
                <label>¿Dificultad para poner? *</label>
                <YesNoChips
                  value={formData.dificultad_poner}
                  onChange={(val) => handleChange('dificultad_poner', val)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>¿Huevos deformes? *</label>
                <YesNoChips
                  value={formData.huevos_deformes}
                  onChange={(val) => handleChange('huevos_deformes', val)}
                />
              </div>
              <div className="form-group">
                <label>¿Hinchazón abdominal? *</label>
                <YesNoChips
                  value={formData.hinchazon_abdominal}
                  onChange={(val) => handleChange('hinchazon_abdominal', val)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>¿Movimiento anormal de las patas traseras?</label>
                <YesNoChips
                  value={formData.movimiento_patas_traseras}
                  onChange={(val) => handleChange('movimiento_patas_traseras', val)}
                />
              </div>
            </div>
          </>
        )}

        {formData.sexo === 'macho' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Comportamiento Territorial Excesivo *</label>
                <YesNoChips
                  value={formData.territorial}
                  onChange={(val) => handleChange('territorial', val)}
                />
              </div>
              <div className="form-group">
                <label>¿Inflamación de poros femorales? *</label>
                <YesNoChips
                  value={formData.poros_femorales}
                  onChange={(val) => handleChange('poros_femorales', val)}
                />
              </div>
              <div className="form-group">
                <label>Agresividad repentina</label>
                <YesNoChips
                  value={formData.agresividad_reproductiva}
                  onChange={(val) => handleChange('agresividad_reproductiva', val)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>¿Dificultad para aparearse?</label>
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
        <h3>Alimentación</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Dieta *</label>
            <select required value={formData.tipo_dieta || ''} onChange={(e) => handleChange('tipo_dieta', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="herbivora">Herbívora</option>
              <option value="omnivora">Omnívora</option>
            </select>
          </div>
          <div className="form-group">
            <label>Vegetales Diarios</label>
            <input type="text" value={formData.vegetales_diarios || ''} onChange={(e) => handleChange('vegetales_diarios', e.target.value)} placeholder="Hojas verdes, vegetales coloridos, frutas" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Alimento vivo? *</label>
            <YesNoChips
              value={formData.alimento_vivo}
              onChange={(val) => handleChange('alimento_vivo', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Acceso a materiales no comestibles?</label>
            <YesNoChips
              value={formData.acceso_no_comestibles}
              onChange={(val) => handleChange('acceso_no_comestibles', val)}
            />
          </div>
        </div>
      </div>

      <div id="iguanas-ambiente" className="form-section">
        <h3>Ambiente</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Tamaño del Recinto (cm)</label>
            <input type="text" value={formData.tamano_recinto || ''} onChange={(e) => handleChange('tamano_recinto', e.target.value)} placeholder="Mínimo: 1.8x tamaño iguana" />
          </div>
          <div className="form-group">
            <label>Temperatura Ambiente (°C)</label>
            <input type="text" value={formData.temperatura_ambiente || ''} onChange={(e) => handleChange('temperatura_ambiente', e.target.value)} placeholder="Zona fría y zona caliente" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Humedad (%)</label>
            <input type="text" value={formData.humedad || ''} onChange={(e) => handleChange('humedad', e.target.value)} placeholder="Ideal: 70-80%" />
          </div>
          <div className="form-group">
            <label>Iluminación UVB *</label>
            <YesNoChips
              value={formData.iluminacion_uvb}
              onChange={(val) => handleChange('iluminacion_uvb', val)}
            />
          </div>
        </div>

        {formData.iluminacion_uvb === 'SI' && (
          <div className="form-group">
            <label>Distancia de la lámpara (cm)</label>
            <input type="text" value={formData.distancia_lampara || ''} onChange={(e) => handleChange('distancia_lampara', e.target.value)} />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Superficie del sustrato</label>
            <select
              value={formData.sustrato || ''}
              onChange={(e) => handleChange('sustrato', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="tierra">Tierra</option>
              <option value="alfombra">Alfombra</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Limpieza del Recinto *</label>
          <select required value={formData.limpieza_recinto || ''} onChange={(e) => handleChange('limpieza_recinto', e.target.value)}>
            <option value="">Seleccionar</option>
            <option value="diaria">Diaria</option>
            <option value="cada_2_dias">Cada 2 días</option>
            <option value="semanal">Semanal</option>
          </select>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>¿Bañera para hidratación?</label>
            <YesNoChips
              value={formData.banera_hidratacion}
              onChange={(val) => handleChange('banera_hidratacion', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Lavado de comederos</label>
            <select
              value={formData.lavado_comederos || ''}
              onChange={(e) => handleChange('lavado_comederos', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="diario">Diario</option>
              <option value="cada_2_dias">Cada 2 días</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Uso de desinfectantes?</label>
            <YesNoChips
              value={formData.uso_desinfectantes}
              onChange={(val) => handleChange('uso_desinfectantes', val)}
            />
          </div>
        </div>

        {formData.uso_desinfectantes === 'SI' && (
          <div className="form-group">
            <label>¿Cuál desinfectante?</label>
            <input
              type="text"
              value={formData.desinfectante_cual || ''}
              onChange={(e) => handleChange('desinfectante_cual', e.target.value)}
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>¿Presencia de heces acumuladas?</label>
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
            <label>¿Vive sola o en grupo?</label>
            <select
              value={formData.socializacion_tipo || ''}
              onChange={(e) => handleChange('socializacion_tipo', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="sola">Sola</option>
              <option value="pareja">Pareja</option>
              <option value="grupo">Grupo</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Peleas recientes?</label>
            <YesNoChips
              value={formData.peleas_recientes}
              onChange={(val) => handleChange('peleas_recientes', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Manipulación frecuente?</label>
            <select
              value={formData.manipulacion_frecuente || 'NO'}
              onChange={(e) => handleChange('manipulacion_frecuente', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Exposición a luz solar directa?</label>
            <select
              value={formData.exposicion_sol || 'NO'}
              onChange={(e) => handleChange('exposicion_sol', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>
      </div>

      <div id="iguanas-historial" className="form-section">
        <h3>Historial Médico Previo</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Calcio Adicional *</label>
            <select required value={formData.calcio_adicional || 'NO'} onChange={(e) => handleChange('calcio_adicional', e.target.value)}>
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Multivitamínicos *</label>
            <select required value={formData.multivitaminicos || 'NO'} onChange={(e) => handleChange('multivitaminicos', e.target.value)}>
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Desparasitación Interna *</label>
            <select required value={formData.desparasitacion_interna || 'NO'} onChange={(e) => handleChange('desparasitacion_interna', e.target.value)}>
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Historia de parásitos?</label>
            <select
              value={formData.historia_parasitos || 'NO'}
              onChange={(e) => handleChange('historia_parasitos', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Enfermedades previas principales</label>
            <select
              value={formData.enfermedades_previas || ''}
              onChange={(e) => handleChange('enfermedades_previas', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="infecciones_respiratorias">Infecciones respiratorias</option>
              <option value="problemas_oseos">Problemas óseos</option>
              <option value="deficiencias_nutricionales">Deficiencias nutricionales</option>
              <option value="trauma">Trauma</option>
            </select>
          </div>
        </div>
      </div>

      <div id="iguanas-examen" className="form-section">
        <h3>Examen Físico</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Temperatura Corporal (°C)</label>
            <input type="text" value={formData.temperatura || ''} onChange={(e) => handleChange('temperatura', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Peso Corporal (g/kg)</label>
            <input type="text" value={formData.peso_corporal || ''} onChange={(e) => handleChange('peso_corporal', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Condición Muscular</label>
            <select value={formData.condicion_muscular || ''} onChange={(e) => handleChange('condicion_muscular', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="excelente">Excelente</option>
              <option value="buena">Buena</option>
              <option value="regular">Regular</option>
              <option value="mala">Mala</option>
              <option value="ausente">Ausente</option>
            </select>
          </div>
          <div className="form-group">
            <label>Estado de Hidratación</label>
            <select value={formData.hidratacion || ''} onChange={(e) => handleChange('hidratacion', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="normal">Normal</option>
              <option value="leve">Leve</option>
              <option value="moderado">Moderado</option>
              <option value="severo">Severo</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Piel (evaluación rápida)</label>
            <select
              value={formData.piel_examen || ''}
              onChange={(e) => handleChange('piel_examen', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="normal">Normal</option>
              <option value="descamacion">Descamación</option>
              <option value="ulceras">Úlceras</option>
              <option value="edema">Edema</option>
            </select>
          </div>
          <div className="form-group">
            <label>Extremidades</label>
            <select
              value={formData.extremidades_examen || ''}
              onChange={(e) => handleChange('extremidades_examen', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="fuertes">Fuertes</option>
              <option value="debiles">Débiles</option>
              <option value="deformadas">Deformadas</option>
              <option value="fracturadas">Fracturadas</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Estado de Ojos *</label>
            <select required value={formData.estado_ojos || 'normales'} onChange={(e) => handleChange('estado_ojos', e.target.value)}>
              <option value="normales">Normales</option>
              <option value="hinchazon">Hinchazón</option>
              <option value="opacidad">Opacidad corneal</option>
              <option value="exoftalmia">Exoftalmia (ojo salido)</option>
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