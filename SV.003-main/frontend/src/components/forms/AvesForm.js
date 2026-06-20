import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';

const AvesForm = ({ formData, setFormData }) => {
  const [activeSection, setActiveSection] = useState('aves-info-basica');

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
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
    { id: 'aves-info-basica', label: 'Información Básica', icon: '📋' },
    { id: 'aves-respiratorio', label: 'Sistema Respiratorio', icon: '🫁' },
    { id: 'aves-digestivo', label: 'Sistema Digestivo', icon: '🫃' },
    { id: 'aves-reproductivo', label: 'Sistema Reproductivo', icon: '🥚' },
    { id: 'aves-tegumentario', label: 'Sistema Tegumentario', icon: '🪶' },
    { id: 'aves-neurologico', label: 'Sistema Neurológico', icon: '🧠' },
    { id: 'aves-comportamiento', label: 'Comportamiento', icon: '🦜' },
    { id: 'aves-alimentacion', label: 'Alimentación', icon: '🥗' },
    { id: 'aves-ambiente', label: 'Ambiente', icon: '🏠' },
    { id: 'aves-examen-fisico', label: 'Examen Físico', icon: '🩺' },
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
      <h2>Datos de la mascota - Aves (Psitácidos, Passeriformes y Ornamentales)</h2>

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

      {/* Información Básica */}
      <div id="aves-info-basica" className="form-section">
        <h3>Información Básica</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Nombre de la mascota *</label>
            <input type="text" required value={formData.nombre_mascota || ''} onChange={(e) => handleChange('nombre_mascota', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Especie Exacta *</label>
            <input type="text" required value={formData.especie_exacta || ''} onChange={(e) => handleChange('especie_exacta', e.target.value)} placeholder="Ej: Amazona amazonica, Melopsittacus undulatus" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Subespecie/Variante</label>
            <input type="text" value={formData.subespecie || ''} onChange={(e) => handleChange('subespecie', e.target.value)} placeholder="Ej: Lutino, Cinnamon, Albino" />
          </div>
          <div className="form-group">
            <label>Edad (años/meses) *</label>
            <input type="text" required value={formData.edad || ''} onChange={(e) => handleChange('edad', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Edad confirmada por anilla?</label>
            <YesNoChips
              value={formData.edad_confirmada_anilla}
              onChange={(val) => handleChange('edad_confirmada_anilla', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Sexo *</label>
            <select required value={formData.sexo || ''} onChange={(e) => handleChange('sexo', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
              <option value="desconocido">Desconocido</option>
            </select>
          </div>
          <div className="form-group">
            <label>Peso Actual (g) *</label>
            <input type="text" required value={formData.peso || ''} onChange={(e) => handleChange('peso', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Condición Corporal *</label>
            <select required value={formData.condicion_corporal || ''} onChange={(e) => handleChange('condicion_corporal', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="emaciado">Emaciado (músculos ausentes)</option>
              <option value="delgado">Delgado</option>
              <option value="ideal">Ideal</option>
              <option value="sobrepeso">Sobrepeso</option>
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
            <label>¿Sexo confirmado por?</label>
            <select
              value={formData.sexo_confirmado_por || ''}
              onChange={(e) => handleChange('sexo_confirmado_por', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="visual">Visual</option>
              <option value="adn">ADN</option>
              <option value="laparoscopia">Laparoscopia</option>
            </select>
          </div>
          <div className="form-group">
            <label>Anilla identificatoria</label>
            <select
              value={formData.anilla_tipo || ''}
              onChange={(e) => handleChange('anilla_tipo', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="nacional">Nacional</option>
              <option value="cites">CITES</option>
              <option value="sin_anilla">Sin anilla</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Número de anilla</label>
            <input
              type="text"
              value={formData.anilla_numero || ''}
              onChange={(e) => handleChange('anilla_numero', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Temperamento</label>
            <select
              value={formData.temperamento || ''}
              onChange={(e) => handleChange('temperamento', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="tranquilo">Tranquilo</option>
              <option value="nervioso">Nervioso</option>
              <option value="agresivo">Agresivo</option>
              <option value="timido">Tímido</option>
              <option value="afectuoso">Afectuoso</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sistema Respiratorio */}
      <div id="aves-respiratorio" className="form-section">
        <h3>Sistema Respiratorio</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Dificultad Respiratoria *</label>
            <select required value={formData.dificultad_respiratoria || 'NO'} onChange={(e) => handleChange('dificultad_respiratoria', e.target.value)}>
              <option value="NO">No</option>
              <option value="abdomen_moviendo">Abdomen moviéndose exageradamente</option>
              <option value="boca_abierta">Boca abierta</option>
              <option value="aleteo_rapido">Aleteo rápido</option>
            </select>
          </div>
          <div className="form-group">
            <label>Frecuencia Respiratoria (rpm)</label>
            <input type="text" value={formData.frecuencia_respiratoria || ''} onChange={(e) => handleChange('frecuencia_respiratoria', e.target.value)} placeholder="Contar 1 minuto" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Inspiratoria o espiratoria predominante?</label>
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
            <label>Secreciones Nasales/Orales *</label>
            <select required value={formData.secreciones || 'NO'} onChange={(e) => handleChange('secreciones', e.target.value)}>
              <option value="NO">No</option>
              <option value="clara">Clara</option>
              <option value="mucosa">Mucosa</option>
              <option value="purulenta">Purulenta</option>
              <option value="sangre">Sangre</option>
            </select>
          </div>
        </div>

        {formData.secreciones !== 'NO' && (
          <div className="form-group">
            <label>Localización</label>
            <select value={formData.secreciones_localizacion || ''} onChange={(e) => handleChange('secreciones_localizacion', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="unilateral">Unilateral</option>
              <option value="bilateral">Bilateral</option>
              <option value="solo_boca">Solo en boca</option>
            </select>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>¿Cambio en Canto/Vocalización? *</label>
            <YesNoChips
              value={formData.cambio_vocalizacion}
              onChange={(val) => handleChange('cambio_vocalizacion', val)}
            />
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
            <label>¿Uso de aerosoles/limpiadores?</label>
            <YesNoChips
              value={formData.uso_limpiadores}
              onChange={(val) => handleChange('uso_limpiadores', val)}
            />
          </div>
        </div>
      </div>

      {/* Sistema Digestivo */}
      <div id="aves-digestivo" className="form-section">
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
            <select value={formData.contenido || ''} onChange={(e) => handleChange('contenido', e.target.value)}>
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
            <select required value={formData.heces_consistencia || 'normales'} onChange={(e) => handleChange('heces_consistencia', e.target.value)}>
              <option value="normales">Normales</option>
              <option value="liquidas">Líquidas</option>
              <option value="formadas">Formadas</option>
              <option value="sin_formar">Sin formar</option>
              <option value="con_moco">Con moco</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Frecuencia (veces/día)</label>
            <input type="text" value={formData.heces_frecuencia || ''} onChange={(e) => handleChange('heces_frecuencia', e.target.value)} placeholder="Varía por tamaño: pequeñas &gt;20 veces/día" />
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
              <option value="chocolate">Chocolate</option>
              <option value="agua_estancada">Agua estancada</option>
              <option value="alimentos_moho">Alimentos con moho</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sistema Reproductivo */}
      <div id="aves-reproductivo" className="form-section">
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
                <label>Estado de Huevos</label>
                <select value={formData.estado_huevos || ''} onChange={(e) => handleChange('estado_huevos', e.target.value)}>
                  <option value="">Seleccionar</option>
                  <option value="normales">Normales</option>
                  <option value="deformes">Deformes</option>
                  <option value="sin_cascara">Sin cáscara</option>
                  <option value="pegajosos">Pegajosos</option>
                  <option value="rotos">Rotos internamente</option>
                </select>
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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Agresividad repentina</label>
                <YesNoChips
                  value={formData.agresividad}
                  onChange={(val) => handleChange('agresividad', val)}
                />
              </div>
              <div className="form-group">
                <label>Postura de cortejo constante</label>
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
            <label>Plumas *</label>
            <select required value={formData.plumas || 'normales'} onChange={(e) => handleChange('plumas', e.target.value)}>
              <option value="normales">Normales</option>
              <option value="arrancamiento_simetrico">Arrancamiento simétrico (alas, pecho)</option>
              <option value="arrancamiento_asimetrico">Arrancamiento asimétrico</option>
              <option value="vaina_sangrante">Plumas en vaina sangrante</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Nuevas Plumas en Crecimiento? *</label>
            <YesNoChips
              value={formData.nuevas_plumas}
              onChange={(val) => handleChange('nuevas_plumas', val)}
            />
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
            <YesNoChips
              value={formData.acaros}
              onChange={(val) => handleChange('acaros', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Puntos rojos en piel (ácaros rojos)</label>
            <select
              value={formData.puntos_rojos_piel || 'NO'}
              onChange={(e) => handleChange('puntos_rojos_piel', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Escamas engrosadas</label>
            <select
              value={formData.escamas || 'NO'}
              onChange={(e) => handleChange('escamas', e.target.value)}
            >
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

      {/* Sistema Neurológico */}
      <div id="aves-neurologico" className="form-section">
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
            <label>Relación con alimentación</label>
            <select
              value={formData.relacion_alimentacion || ''}
              onChange={(e) => handleChange('relacion_alimentacion', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="mejora_comida">Mejora con comida</option>
              <option value="empeora_ayunas">Empeora en ayunas</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Desencadenantes</label>
            <select
              value={formData.desencadenantes || ''}
              onChange={(e) => handleChange('desencadenantes', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="ruido_fuerte">Ruido fuerte</option>
              <option value="estres">Estrés</option>
              <option value="ninguno">Ninguno</option>
            </select>
          </div>
        </div>
      </div>

      {/* Comportamiento */}
      <div id="aves-comportamiento" className="form-section">
        <h3>Comportamiento</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Cambio en Vocalización *</label>
            <select required value={formData.cambio_voz || 'NO'} onChange={(e) => handleChange('cambio_voz', e.target.value)}>
              <option value="NO">No</option>
              <option value="silencio">Silencio total</option>
              <option value="cambio_tono">Cambio en tono</option>
              <option value="gritos">Gritos de dolor</option>
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
            <select required value={formData.sueno || 'normal'} onChange={(e) => handleChange('sueno', e.target.value)}>
              <option value="normal">Normal (parado en una pata)</option>
              <option value="acostado">Acostado en el fondo</option>
              <option value="cabeza_girada">Con cabeza girada</option>
            </select>
          </div>
          <div className="form-group">
            <label>Horas de Sueño (diarias)</label>
            <input type="text" value={formData.horas_sueno || ''} onChange={(e) => handleChange('horas_sueno', e.target.value)} placeholder="Normal: 10-12 horas" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Cambio en relación con dueño?</label>
            <select
              value={formData.cambio_relacion_dueno || 'NO'}
              onChange={(e) => handleChange('cambio_relacion_dueno', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Cambio en patrón de canto?</label>
            <select
              value={formData.cambio_patron_canto || 'NO'}
              onChange={(e) => handleChange('cambio_patron_canto', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alimentación */}
      <div id="aves-alimentacion" className="form-section">
        <h3>Alimentación</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Dieta *</label>
            <select required value={formData.tipo_dieta || ''} onChange={(e) => handleChange('tipo_dieta', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="semillas">Semillas</option>
              <option value="pellets">Pellets</option>
              <option value="mixta">Mixta</option>
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
        {formData.frutas_verduras === 'SI' && (
          <div className="form-group">
            <label>¿Cuáles frutas/verduras?</label>
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
        <h3>Ambiente</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Tamaño de Jaula (cm)</label>
            <input type="text" value={formData.tamano_jaula || ''} onChange={(e) => handleChange('tamano_jaula', e.target.value)} placeholder="Largo x Ancho x Alto" />
          </div>
          <div className="form-group">
            <label>Ubicación *</label>
            <select required value={formData.ubicacion || ''} onChange={(e) => handleChange('ubicacion', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
              <option value="ventana">Ventana</option>
              <option value="cocina">Cocina</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Temperatura Ambiente (°C)</label>
            <input type="text" value={formData.temperatura_ambiente || ''} onChange={(e) => handleChange('temperatura_ambiente', e.target.value)} placeholder="Ideal: 20-24°C" />
          </div>
          <div className="form-group">
            <label>Iluminación *</label>
            <select required value={formData.iluminacion || ''} onChange={(e) => handleChange('iluminacion', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="natural">Luz natural</option>
              <option value="uvb">Luz UVB</option>
              <option value="sin_luz">Sin luz natural</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ventilación *</label>
            <select required value={formData.ventilacion || ''} onChange={(e) => handleChange('ventilacion', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="buena">Buena</option>
              <option value="corrientes">Con corrientes de aire</option>
              <option value="estancada">Estancada</option>
            </select>
          </div>
          <div className="form-group">
            <label>Contacto con Otras Aves *</label>
            <select required value={formData.contacto_aves || 'NO'} onChange={(e) => handleChange('contacto_aves', e.target.value)}>
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Introducción reciente de nuevas aves?</label>
            <select
              value={formData.introduccion_nuevas_aves || 'NO'}
              onChange={(e) => handleChange('introduccion_nuevas_aves', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Contacto con aves silvestres?</label>
            <select
              value={formData.contacto_aves_silvestres || 'NO'}
              onChange={(e) => handleChange('contacto_aves_silvestres', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Limpieza de Jaula *</label>
          <select required value={formData.limpieza || ''} onChange={(e) => handleChange('limpieza', e.target.value)}>
            <option value="">Seleccionar</option>
            <option value="diaria">Diaria</option>
            <option value="cada_2_dias">Cada 2 días</option>
            <option value="semanal">Semanal</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Lavado de comederos/bebederos</label>
            <select
              value={formData.lavado_comederos || ''}
              onChange={(e) => handleChange('lavado_comederos', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Uso de desinfectantes?</label>
            <select
              value={formData.uso_desinfectantes || 'NO'}
              onChange={(e) => handleChange('uso_desinfectantes', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>
      </div>

      {/* Examen Físico */}
      <div id="aves-examen-fisico" className="form-section">
        <h3>Examen Físico</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Temperatura (°C)</label>
            <input type="text" value={formData.temperatura || ''} onChange={(e) => handleChange('temperatura', e.target.value)} placeholder="Normal: 40-42°C" />
          </div>
          <div className="form-group">
            <label>Frecuencia Cardíaca (lpm)</label>
            <input type="text" value={formData.frecuencia_cardiaca || ''} onChange={(e) => handleChange('frecuencia_cardiaca', e.target.value)} placeholder="Normal: 200-400" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Peso Corporal (g)</label>
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
          <div className="form-group">
            <label>Plumas (examen físico)</label>
            <select
              value={formData.plumas_examen || ''}
              onChange={(e) => handleChange('plumas_examen', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="brillo_normal">Brillo normal</option>
              <option value="opacas">Opacas</option>
              <option value="caidas">Caídas</option>
              <option value="rotas">Rotas</option>
              <option value="sangrantes">Sangrantes</option>
            </select>
          </div>
        </div>
      </div>

      <div id="aves-hallazgos-grupo" className="form-section">
        <h3>Hallazgos Específicos por Grupo</h3>

        <div className="form-row">
          <div className="form-group">
            <label>Psitácidos - ¿Historia de comportamiento estereotipado?</label>
            <select
              value={formData.psitacidos_estereotipias || 'NO'}
              onChange={(e) => handleChange('psitacidos_estereotipias', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Psitácidos - ¿Exposición a metales pesados?</label>
            <select
              value={formData.psitacidos_metales || 'NO'}
              onChange={(e) => handleChange('psitacidos_metales', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Passeriformes - ¿Historia de "twirling" (giros)?</label>
            <select
              value={formData.passeriformes_twirling || 'NO'}
              onChange={(e) => handleChange('passeriformes_twirling', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Passeriformes - ¿Plumas de cola caídas?</label>
            <select
              value={formData.passeriformes_cola_caida || 'NO'}
              onChange={(e) => handleChange('passeriformes_cola_caida', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Passeriformes - ¿Heces verdes brillantes?</label>
            <select
              value={formData.passeriformes_heces_verdes || 'NO'}
              onChange={(e) => handleChange('passeriformes_heces_verdes', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Aves/Exóticas pequeñas - ¿Huevos palpables en abdomen?</label>
            <select
              value={formData.exoticas_huevos_abdomen || 'NO'}
              onChange={(e) => handleChange('exoticas_huevos_abdomen', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Aves/Exóticas pequeñas - ¿Plumas de cola rotas?</label>
            <select
              value={formData.exoticas_cola_rota || 'NO'}
              onChange={(e) => handleChange('exoticas_cola_rota', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </div>
          <div className="form-group">
            <label>Aves/Exóticas pequeñas - ¿Respiración abdominal excesiva?</label>
            <select
              value={formData.exoticas_respiracion_abdominal || 'NO'}
              onChange={(e) => handleChange('exoticas_respiracion_abdominal', e.target.value)}
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
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
