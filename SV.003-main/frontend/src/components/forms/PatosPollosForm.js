import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';

const PatosPollosForm = ({ formData, setFormData }) => {
  const [activeSection, setActiveSection] = useState('patospollos-info-basica');

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleSection = useCallback((e) => {
    const section = e.target.closest('.form-section');
    if (section && e.target.tagName === 'H3') section.classList.toggle('collapsed');
  }, []);

  const requiredFields = [
    'nombre_mascota', 'especie_exacta', 'edad', 'sexo', 'peso', 'condicion_corporal',
    'secrecion_nasal', 'respiracion', 'buche', 'heces', 'plumas',
    'tipo_alimento', 'ubicacion', 'vacuna_newcastle'
  ];

  const progress = useMemo(() => {
    const filled = requiredFields.filter(field => formData[field] && formData[field] !== '').length;
    return Math.round((filled / requiredFields.length) * 100);
  }, [formData]);

  const sections = [
    { id: 'patospollos-info-basica', label: 'Información Básica', icon: '📋' },
    { id: 'patospollos-respiratorio', label: 'Sistema Respiratorio', icon: '🫁' },
    { id: 'patospollos-reproductivo', label: 'Sistema Reproductivo', icon: '🥚' },
    { id: 'patospollos-digestivo', label: 'Sistema Digestivo', icon: '🫃' },
    { id: 'patospollos-musculoesqueletico', label: 'Sistema Musculoesquelético', icon: '🦴' },
    { id: 'patospollos-cutaneo', label: 'Sistema Cutáneo', icon: '🪶' },
    { id: 'patospollos-neurologico', label: 'Sistema Neurológico', icon: '🧠' },
    { id: 'patospollos-comportamiento', label: 'Comportamiento', icon: '🐥' },
    { id: 'patospollos-alimentacion', label: 'Alimentación', icon: '🥗' },
    { id: 'patospollos-ambiente', label: 'Ambiente', icon: '🏠' },
    { id: 'patospollos-historial', label: 'Historial Médico Previo', icon: '📁' },
    { id: 'patospollos-examen', label: 'Examen Físico', icon: '🩺' },
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
      <h2>Datos del Paciente - Patos y Pollos</h2>

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
      
      <div id="patospollos-info-basica" className="form-section">
        <h3>Información Básica</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Nombre del Paciente *</label>
            <input type="text" required value={formData.nombre_mascota || ''} onChange={(e) => handleChange('nombre_mascota', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Especie Exacta *</label>
            <select required value={formData.especie_exacta || ''} onChange={(e) => handleChange('especie_exacta', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="pollo_domestico">Pollo doméstico</option>
              <option value="pato">Pato</option>
              <option value="gallina_guinea">Gallina de Guinea</option>
              <option value="pavo">Pavo</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Edad Exacta *</label>
            <input type="text" required value={formData.edad || ''} onChange={(e) => handleChange('edad', e.target.value)} placeholder="semanas/meses/años" />
          </div>
          <div className="form-group">
            <label>Sexo *</label>
            <select required value={formData.sexo || ''} onChange={(e) => handleChange('sexo', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="hembra">Hembra</option>
              <option value="macho">Macho</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Propósito *</label>
            <select required value={formData.proposito || ''} onChange={(e) => handleChange('proposito', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="huevos">Producción de huevos</option>
              <option value="carne">Producción de carne</option>
              <option value="mascota">Mascota</option>
              <option value="exhibicion">Exhibición</option>
            </select>
          </div>
          <div className="form-group">
            <label>Peso Actual (g/kg) *</label>
            <input type="text" required value={formData.peso || ''} onChange={(e) => handleChange('peso', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Condición Corporal *</label>
            <select required value={formData.condicion_corporal || ''} onChange={(e) => handleChange('condicion_corporal', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="emaciado">Emaciado</option>
              <option value="delgado">Delgado</option>
              <option value="ideal">Ideal</option>
              <option value="sobrepeso">Sobrepeso</option>
              <option value="obeso">Obeso</option>
            </select>
          </div>
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
        
        <div className="form-row">
          <div className="form-group">
            <label>Progresión del problema</label>
            <select
              value={formData.progresion_problema || ''}
              onChange={(e) => handleChange('progresion_problema', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="mejora">Mejora</option>
              <option value="estable">Estable</option>
              <option value="empeora_rapido">Empeora rápidamente</option>
              <option value="intermitente">Intermitente</option>
            </select>
          </div>
        </div>
      </div>

      <div id="patospollos-respiratorio" className="form-section">
        <h3>Sistema Respiratorio</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Secreción Nasal/Oral *</label>
            <select required value={formData.secrecion_nasal || 'NO'} onChange={(e) => handleChange('secrecion_nasal', e.target.value)}>
              <option value="NO">No</option>
              <option value="clara">Clara</option>
              <option value="mucosa">Mucosa</option>
              <option value="purulenta">Purulenta</option>
              <option value="caseosa">Caseosa</option>
            </select>
          </div>
          {formData.secrecion_nasal !== 'NO' && (
            <div className="form-group">
              <label>Localización</label>
              <select value={formData.secrecion_localizacion || ''} onChange={(e) => handleChange('secrecion_localizacion', e.target.value)}>
                <option value="">Seleccionar</option>
                <option value="unilateral">Unilateral</option>
                <option value="bilateral">Bilateral</option>
                <option value="solo_boca">Solo en boca</option>
              </select>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ruidos Respiratorios *</label>
            <select required value={formData.ruidos_respiratorios || 'NO'} onChange={(e) => handleChange('ruidos_respiratorios', e.target.value)}>
              <option value="NO">No</option>
              <option value="silbidos">Silbidos</option>
              <option value="ronquidos">Ronquidos</option>
              <option value="estertores">Estertores</option>
              <option value="estridor">Estridor</option>
            </select>
          </div>
          <div className="form-group">
            <label>Dificultad Respiratoria *</label>
            <select required value={formData.dificultad_respiratoria || 'NO'} onChange={(e) => handleChange('dificultad_respiratoria', e.target.value)}>
              <option value="NO">No</option>
              <option value="abdomen_moviendo">Abdomen moviéndose exageradamente</option>
              <option value="boca_abierta">Boca abierta</option>
              <option value="aleteo_rapido">Aleteo rápido</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Frecuencia Respiratoria (rpm)</label>
            <input type="text" value={formData.frecuencia_respiratoria || ''} onChange={(e) => handleChange('frecuencia_respiratoria', e.target.value)} placeholder="Normal: 15-30" />
          </div>
          <div className="form-group">
            <label>Exposición a Humo/Aerosoles *</label>
            <YesNoChips
              value={formData.exposicion_humo}
              onChange={(val) => handleChange('exposicion_humo', val)}
            />
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
          <div className="form-group">
            <label>¿Uso de aerosoles/limpiadores?</label>
            <YesNoChips
              value={formData.uso_limpiadores}
              onChange={(val) => handleChange('uso_limpiadores', val)}
            />
          </div>
        </div>
      </div>

      <div id="patospollos-reproductivo" className="form-section">
        <h3>Sistema Reproductivo</h3>
        
        {formData.sexo === 'hembra' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>¿Está Poniendo Huevos? *</label>
                <YesNoChips
                  value={formData.poniendo_huevos}
                  onChange={(val) => handleChange('poniendo_huevos', val)}
                />
              </div>
              <div className="form-group">
                <label>¿Dificultad para Poner? *</label>
                <YesNoChips
                  value={formData.dificultad_poner}
                  onChange={(val) => handleChange('dificultad_poner', val)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Estado de los Huevos</label>
                <select value={formData.estado_huevos || 'normales'} onChange={(e) => handleChange('estado_huevos', e.target.value)}>
                  <option value="normales">Normales</option>
                  <option value="deformes">Deformes</option>
                  <option value="sin_cascara">Sin cáscara</option>
                  <option value="pegajosos">Pegajosos</option>
                  <option value="rotos_internamente">Rotos internamente</option>
                </select>
              </div>
              <div className="form-group">
                <label>¿Prolapso Cloacal? *</label>
                <YesNoChips
                  value={formData.prolapso_cloacal}
                  onChange={(val) => handleChange('prolapso_cloacal', val)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Secreción Cloacal</label>
              <select value={formData.secrecion_cloacal || 'NO'} onChange={(e) => handleChange('secrecion_cloacal', e.target.value)}>
                <option value="NO">No</option>
                <option value="sanguinolenta">Sanguinolenta</option>
                <option value="purulenta">Purulenta</option>
                <option value="mucosa">Mucosa</option>
              </select>
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
                <label>Agresividad Repentina *</label>
                <YesNoChips
                  value={formData.agresividad}
                  onChange={(val) => handleChange('agresividad', val)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Postura de cortejo constante</label>
                <YesNoChips
                  value={formData.postura_cortejo}
                  onChange={(val) => handleChange('postura_cortejo', val)}
                />
              </div>
              <div className="form-group">
                <label>¿Problemas para aparearse?</label>
                <YesNoChips
                  value={formData.problemas_aparearse}
                  onChange={(val) => handleChange('problemas_aparearse', val)}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div id="patospollos-digestivo" className="form-section">
        <h3>Sistema Digestivo</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Estado del Buche *</label>
            <select required value={formData.buche || 'normal'} onChange={(e) => handleChange('buche', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="distendido">Distendido por &gt;4 horas</option>
              <option value="liquido">Líquido</option>
              <option value="rancio">Alimento rancio</option>
              <option value="vacio">Vacío cuando debería estar lleno</option>
            </select>
          </div>
          <div className="form-group">
            <label>Regurgitación/Vómito *</label>
            <select required value={formData.regurgitacion || 'NO'} onChange={(e) => handleChange('regurgitacion', e.target.value)}>
              <option value="NO">No</option>
              <option value="regurgitacion">Regurgitación (suave)</option>
              <option value="vomito">Vómito (violento)</option>
            </select>
          </div>
        </div>

        {formData.regurgitacion !== 'NO' && (
          <div className="form-group">
            <label>Contenido</label>
            <select value={formData.contenido_regurgitacion || ''} onChange={(e) => handleChange('contenido_regurgitacion', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="sin_digerir">Alimento sin digerir</option>
              <option value="liquido_amarillo">Líquido amarillo</option>
              <option value="sangre">Sangre</option>
              <option value="fecaloide">Material fecaloide</option>
            </select>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Heces - Color *</label>
            <select required value={formData.heces_color || 'normal'} onChange={(e) => handleChange('heces_color', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="verde_oscuro">Verde oscuro</option>
              <option value="amarillo">Amarillo</option>
              <option value="rojo">Rojo</option>
              <option value="blanco">Blanco</option>
            </select>
          </div>
          <div className="form-group">
            <label>Heces - Consistencia *</label>
            <select required value={formData.heces_consistencia || 'formadas'} onChange={(e) => handleChange('heces_consistencia', e.target.value)}>
              <option value="formadas">Formadas</option>
              <option value="liquidas">Líquidas</option>
              <option value="sin_formar">Sin formar</option>
              <option value="con_moco">Con moco</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Cambio en proporción de heces</label>
            <select
              value={formData.heces_proporcion || ''}
              onChange={(e) => handleChange('heces_proporcion', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="exceso_uratos">Exceso de uratos</option>
              <option value="exceso_materia_fecal">Exceso de materia fecal</option>
              <option value="exceso_liquido">Exceso de líquido</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ingesta reciente de riesgo</label>
            <select
              value={formData.ingesta_riesgo || ''}
              onChange={(e) => handleChange('ingesta_riesgo', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="plantas_toxicas">Plantas tóxicas</option>
              <option value="agua_estancada">Agua estancada</option>
              <option value="alimentos_moho">Alimentos con moho</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Presencia de Parásitos? *</label>
            <YesNoChips
              value={formData.parasitos}
              onChange={(val) => handleChange('parasitos', val)}
            />
          </div>
        </div>
      </div>

      <div id="patospollos-musculoesqueletico" className="form-section">
        <h3>Sistema Musculoesquelético</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Cojera/Movimiento *</label>
            <select required value={formData.cojera || 'normal'} onChange={(e) => handleChange('cojera', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="dificultad_caminar">Dificultad para caminar</option>
              <option value="evita_posiciones">Evita posiciones erectas</option>
              <option value="arrastra">Se arrastra</option>
            </select>
          </div>
          <div className="form-group">
            <label>Localización</label>
            <select value={formData.cojera_localizacion || ''} onChange={(e) => handleChange('cojera_localizacion', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="patas_traseras">Patas traseras</option>
              <option value="patas_delanteras">Patas delanteras</option>
              <option value="ambas">Ambas</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Estado de las Patas *</label>
            <select required value={formData.patas || 'normales'} onChange={(e) => handleChange('patas', e.target.value)}>
              <option value="normales">Normales</option>
              <option value="ulceras">Úlceras en almohadillas</option>
              <option value="perdida_pelo">Pérdida de pelo</option>
              <option value="hinchazon">Hinchazón</option>
            </select>
          </div>
          <div className="form-group">
            <label>Superficie Donde Vive *</label>
            <select required value={formData.superficie || ''} onChange={(e) => handleChange('superficie', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="alambre">Alambre</option>
              <option value="madera">Madera</option>
              <option value="felpa">Felpa</option>
              <option value="cemento">Cemento</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Dolor al manipular columna?</label>
            <YesNoChips
              value={formData.dolor_columna}
              onChange={(val) => handleChange('dolor_columna', val)}
            />
          </div>
        </div>
      </div>

      <div id="patospollos-cutaneo" className="form-section">
        <h3>Sistema Cutáneo</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Plumas *</label>
            <select required value={formData.plumas || 'normales'} onChange={(e) => handleChange('plumas', e.target.value)}>
              <option value="normales">Normales</option>
              <option value="caida_simetrica">Caída simétrica</option>
              <option value="caida_localizada">Caída localizada</option>
              <option value="rotas">Plumas rotas</option>
              <option value="sangrantes">Plumas en vaina sangrante</option>
            </select>
          </div>
          <div className="form-group">
            <label>Prurito Intenso *</label>
            <select required value={formData.prurito || 'NO'} onChange={(e) => handleChange('prurito', e.target.value)}>
              <option value="NO">No</option>
              <option value="leve">Leve</option>
              <option value="intenso">Intenso</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Piel *</label>
            <select required value={formData.piel || 'normal'} onChange={(e) => handleChange('piel', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="descamacion">Descamación excesiva</option>
              <option value="costras">Costras en cabeza</option>
              <option value="inflamacion">Inflamación periorbital</option>
            </select>
          </div>
          <div className="form-group">
            <label>Ácaros Visibles *</label>
            <select required value={formData.acaros || 'NO'} onChange={(e) => handleChange('acaros', e.target.value)}>
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Uñas/Pico *</label>
          <select required value={formData.unas_pico || 'normales'} onChange={(e) => handleChange('unas_pico', e.target.value)}>
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
          <label>¿Escamas engrosadas?</label>
          <select
            value={formData.escamas || 'NO'}
            onChange={(e) => handleChange('escamas', e.target.value)}
          >
            <option value="NO">No</option>
            <option value="SI">Sí</option>
          </select>
        </div>
        <div className="form-group">
          <label>Puntos rojos en piel</label>
          <select
            value={formData.puntos_rojos_piel || 'NO'}
            onChange={(e) => handleChange('puntos_rojos_piel', e.target.value)}
          >
            <option value="NO">No</option>
            <option value="SI">Sí</option>
          </select>
        </div>
      </div>

      <div id="patospollos-neurologico" className="form-section">
        <h3>Sistema Neurológico</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Incoordinación *</label>
            <select required value={formData.incoordinacion || 'NO'} onChange={(e) => handleChange('incoordinacion', e.target.value)}>
              <option value="NO">No</option>
              <option value="caidas">Caídas laterales</option>
              <option value="no_posarse">No puede posarse</option>
              <option value="movimientos_circulares">Movimientos circulares</option>
            </select>
          </div>
          <div className="form-group">
            <label>Temblor</label>
            <select value={formData.temblor || 'NO'} onChange={(e) => handleChange('temblor', e.target.value)}>
              <option value="NO">No</option>
              <option value="cabeza">Cabeza</option>
              <option value="cuerpo">Cuerpo</option>
              <option value="extremidades">Extremidades</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Convulsiones *</label>
            <select required value={formData.convulsiones || 'NO'} onChange={(e) => handleChange('convulsiones', e.target.value)}>
              <option value="NO">No</option>
              <option value="completa">Completa (pérdida de conciencia)</option>
              <option value="parcial">Parcial (solo cabeza)</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>¿Mejora en reposo?</label>
            <select
              value={formData.mejora_reposo || 'NO'}
              onChange={(e) => handleChange('mejora_reposo', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Desencadenantes</label>
            <select
              value={formData.desencadenantes_neuro || ''}
              onChange={(e) => handleChange('desencadenantes_neuro', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="ruido_fuerte">Ruido fuerte</option>
              <option value="estres">Estrés</option>
              <option value="ninguno">Ninguno</option>
            </select>
          </div>
        </div>
      </div>

      <div id="patospollos-comportamiento" className="form-section">
        <h3>Comportamiento</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Cambio en Vocalización *</label>
            <select required value={formData.vocalizacion || 'normal'} onChange={(e) => handleChange('vocalizacion', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="silencio">Silencio total</option>
              <option value="cambio_tono">Cambio en tono</option>
              <option value="gritos_dolor">Gritos de dolor</option>
            </select>
          </div>
          <div className="form-group">
            <label>Interacción Social *</label>
            <select required value={formData.interaccion_social || 'normal'} onChange={(e) => handleChange('interaccion_social', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="aislamiento">Aislamiento</option>
              <option value="agresividad">Agresividad repentina</option>
              <option value="apegamiento">Apegamiento excesivo</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Patrones de Sueño *</label>
            <select required value={formData.patrones_sueno || 'normal'} onChange={(e) => handleChange('patrones_sueno', e.target.value)}>
              <option value="normal">Normal (parado en una pata)</option>
              <option value="acostado">Acostado en el fondo</option>
              <option value="cabeza_girada">Con cabeza girada</option>
            </select>
          </div>
          <div className="form-group">
            <label>Horas de Sueño (diarias)</label>
            <input type="text" value={formData.horas_sueno || ''} onChange={(e) => handleChange('horas_sueno', e.target.value)} placeholder="Normal: 8-10 horas" />
          </div>
        </div>
      </div>

      <div id="patospollos-alimentacion" className="form-section">
        <h3>Alimentación</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Alimento *</label>
            <select required value={formData.tipo_alimento || ''} onChange={(e) => handleChange('tipo_alimento', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="pellets">Pellets comerciales</option>
              <option value="semillas">Mezcla de semillas</option>
              <option value="casera">Casera</option>
            </select>
          </div>
          <div className="form-group">
            <label>Suplementos</label>
            <input type="text" value={formData.suplementos || ''} onChange={(e) => handleChange('suplementos', e.target.value)} placeholder="Calcio, Vitaminas, etc." />
          </div>
        </div>

        <div className="form-group">
          <label>¿Frutas/Verduras Frescas? *</label>
          <select required value={formData.frutas_verduras || ''} onChange={(e) => handleChange('frutas_verduras', e.target.value)}>
            <option value="">Seleccionar</option>
            <option value="SI">Sí</option>
            <option value="NO">No</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>¿Acceso a basura/comida humana?</label>
          <select
            value={formData.acceso_basura || 'NO'}
            onChange={(e) => handleChange('acceso_basura', e.target.value)}
          >
            <option value="NO">No</option>
            <option value="SI">Sí</option>
          </select>
        </div>
      </div>

      <div id="patospollos-ambiente" className="form-section">
        <h3>Ambiente</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Tamaño Jaula/Galpón (m²)</label>
            <input type="text" value={formData.tamano_jaula || ''} onChange={(e) => handleChange('tamano_jaula', e.target.value)} placeholder="Mínimo: 0.1-0.25 m²/ave" />
          </div>
          <div className="form-group">
            <label>Ubicación *</label>
            <select required value={formData.ubicacion || ''} onChange={(e) => handleChange('ubicacion', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Temperatura Ambiente (°C)</label>
            <input type="text" value={formData.temperatura_ambiente || ''} onChange={(e) => handleChange('temperatura_ambiente', e.target.value)} placeholder="Ideal: 15-25°C" />
          </div>
          <div className="form-group">
            <label>Ventilación *</label>
            <select required value={formData.ventilacion || ''} onChange={(e) => handleChange('ventilacion', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="buena">Buena</option>
              <option value="corrientes">Con corrientes de aire</option>
              <option value="estancada">Estancada</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Contacto con Aves Silvestres *</label>
            <select required value={formData.contacto_silvestres || 'NO'} onChange={(e) => handleChange('contacto_silvestres', e.target.value)}>
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Limpieza de Jaula/Galpón *</label>
            <select required value={formData.limpieza || ''} onChange={(e) => handleChange('limpieza', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="diaria">Diaria</option>
              <option value="cada_2_dias">Cada 2 días</option>
              <option value="semanal">Semanal</option>
            </select>
          </div>
        </div>
      </div>

      <div id="patospollos-historial" className="form-section">
        <h3>Historial Médico Previo</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Vacuna Newcastle *</label>
            <select required value={formData.vacuna_newcastle || 'NO'} onChange={(e) => handleChange('vacuna_newcastle', e.target.value)}>
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Vacuna Gumboro *</label>
            <select required value={formData.vacuna_gumboro || 'NO'} onChange={(e) => handleChange('vacuna_gumboro', e.target.value)}>
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Bronquitis Infecciosa *</label>
            <select required value={formData.vacuna_bronquitis || 'NO'} onChange={(e) => handleChange('vacuna_bronquitis', e.target.value)}>
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Vacuna Marek *</label>
            <select required value={formData.vacuna_marek || 'NO'} onChange={(e) => handleChange('vacuna_marek', e.target.value)}>
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>¿Zona endémica para influenza aviar?</label>
            <select
              value={formData.zona_endemica_influenza || 'NO'}
              onChange={(e) => handleChange('zona_endemica_influenza', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Tumores previos</label>
            <select
              value={formData.tumores_previos || 'NO'}
              onChange={(e) => handleChange('tumores_previos', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>
      </div>

      <div id="patospollos-examen" className="form-section">
        <h3>Examen Físico</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Temperatura (°C)</label>
            <input type="text" value={formData.temperatura || ''} onChange={(e) => handleChange('temperatura', e.target.value)} placeholder="Normal: 40-42°C" />
          </div>
          <div className="form-group">
            <label>Frecuencia Cardíaca (lpm)</label>
            <input type="text" value={formData.frecuencia_cardiaca || ''} onChange={(e) => handleChange('frecuencia_cardiaca', e.target.value)} placeholder="Normal: 250-350" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Peso Corporal (g/kg)</label>
            <input type="text" value={formData.peso_corporal || ''} onChange={(e) => handleChange('peso_corporal', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Color de Mucosas</label>
            <select value={formData.mucosas || ''} onChange={(e) => handleChange('mucosas', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="rosado">Rosado</option>
              <option value="palido">Pálido</option>
              <option value="icterico">Ictérico</option>
              <option value="cianotico">Cianótico</option>
            </select>
          </div>
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
        
        <div className="form-row">
          <div className="form-group">
            <label>Condición muscular pectoral</label>
            <select
              value={formData.condicion_muscular_pectoral || ''}
              onChange={(e) => handleChange('condicion_muscular_pectoral', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="excelente">Excelente</option>
              <option value="buena">Buena</option>
              <option value="regular">Regular</option>
              <option value="mala">Mala</option>
              <option value="ausente">Ausente</option>
            </select>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default PatosPollosForm;
