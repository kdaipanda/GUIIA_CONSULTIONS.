import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';

const HamstersForm = ({ formData, setFormData }) => {
  const [activeSection, setActiveSection] = useState('hamsters-info-basica');

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
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
    { id: 'hamsters-info-basica', label: 'Información Básica', icon: '📋' },
    { id: 'hamsters-desparasitacion', label: 'Desparasitación', icon: '💊' },
    { id: 'hamsters-alimentacion', label: 'Alimentación', icon: '🥗' },
    { id: 'hamsters-ambiente', label: 'Ambiente', icon: '🏠' },
    { id: 'hamsters-examen', label: 'Examen Físico', icon: '🩺' },
    { id: 'hamsters-digestivo', label: 'Sistema Digestivo', icon: '🫃' },
    { id: 'hamsters-respiratorio', label: 'Sistema Respiratorio', icon: '🫁' },
    { id: 'hamsters-neurologico', label: 'Sistema Neurológico', icon: '🧠' },
    { id: 'hamsters-cutaneo', label: 'Sistema Cutáneo', icon: '🐭' },
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
      <h2>Datos de la mascota - Hámster</h2>

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
      
      <div id="hamsters-info-basica" className="form-section">
        <h3>Información Básica</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Nombre de la mascota *</label>
            <input type="text" required value={formData.nombre_mascota || ''} onChange={(e) => handleChange('nombre_mascota', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Nombre del Dueño *</label>
            <input type="text" required value={formData.nombre_dueño || ''} onChange={(e) => handleChange('nombre_dueño', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Especie Exacta *</label>
            <select required value={formData.especie_exacta || ''} onChange={(e) => handleChange('especie_exacta', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="sirio">Sirio</option>
              <option value="enano">Enano</option>
              <option value="roborovski">Roborovski</option>
              <option value="campbell">Campbell</option>
              <option value="chino">Chino</option>
              <option value="ruso">Ruso</option>
            </select>
          </div>
          <div className="form-group">
            <label>Edad (meses) *</label>
            <input type="text" required value={formData.edad || ''} onChange={(e) => handleChange('edad', e.target.value)} placeholder="Adulto: 3-12 meses, Senior: &gt;18 meses" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Sexo *</label>
            <select required value={formData.sexo || ''} onChange={(e) => handleChange('sexo', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </div>
          <div className="form-group">
            <label>Esterilizado *</label>
            <select required value={formData.esterilizado || ''} onChange={(e) => handleChange('esterilizado', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
        </div>

        {formData.esterilizado === 'SI' && (
          <div className="form-group">
            <label>Fecha de esterilización</label>
            <input
              type="text"
              value={formData.esterilizado_fecha || ''}
              onChange={(e) => handleChange('esterilizado_fecha', e.target.value)}
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Peso Actual (g) *</label>
            <input type="text" required value={formData.peso || ''} onChange={(e) => handleChange('peso', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Índice de Condición Corporal *</label>
            <select required value={formData.condicion_corporal || ''} onChange={(e) => handleChange('condicion_corporal', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="1-3">1-3 (Emaciado)</option>
              <option value="4-5">4-5 (Delgado)</option>
              <option value="6-7">6-7 (Ideal)</option>
              <option value="8-9">8-9 (Sobrepeso)</option>
            </select>
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
              <option value="hiperactivo">Hiperactivo</option>
            </select>
          </div>
        </div>

        <div className="form-row">
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

      <div id="hamsters-desparasitacion" className="form-section">
        <h3>Desparasitación</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Desparasitación Interna *</label>
            <YesNoChips
              value={formData.desparasitacion_interna}
              onChange={(val) => handleChange('desparasitacion_interna', val)}
            />
          </div>
          {formData.desparasitacion_interna === 'SI' && (
            <div className="form-group">
              <label>Producto/Fecha</label>
              <input type="text" value={formData.despara_interna_producto || ''} onChange={(e) => handleChange('despara_interna_producto', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Desparasitación Externa *</label>
            <YesNoChips
              value={formData.desparasitacion_externa}
              onChange={(val) => handleChange('desparasitacion_externa', val)}
            />
          </div>
          {formData.desparasitacion_externa === 'SI' && (
            <div className="form-group">
              <label>Producto/Fecha</label>
              <input type="text" value={formData.despara_externa_producto || ''} onChange={(e) => handleChange('despara_externa_producto', e.target.value)} />
            </div>
          )}
        </div>
      </div>

      <div id="hamsters-alimentacion" className="form-section">
        <h3>Alimentación</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Dieta *</label>
            <select required value={formData.tipo_dieta || ''} onChange={(e) => handleChange('tipo_dieta', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="balanceado">Balanceado comercial</option>
              <option value="mezcla_semillas">Mezcla de semillas</option>
              <option value="casera">Casera</option>
            </select>
          </div>
          <div className="form-group">
            <label>Marca y Composición</label>
            <input type="text" value={formData.marca_alimento || ''} onChange={(e) => handleChange('marca_alimento', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Suplementos</label>
            <input type="text" value={formData.suplementos || ''} onChange={(e) => handleChange('suplementos', e.target.value)} placeholder="Vitaminas, Calcio, Frutas/verduras" />
          </div>
          <div className="form-group">
            <label>Agua Fresca Diaria *</label>
            <YesNoChips
              value={formData.agua_fresca}
              onChange={(val) => handleChange('agua_fresca', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Alimentos ricos en azúcar</label>
            <YesNoChips
              value={formData.alimentos_azucar}
              onChange={(val) => handleChange('alimentos_azucar', val)}
            />
          </div>
          {formData.alimentos_azucar === 'SI' && (
            <div className="form-group">
              <label>Ejemplos</label>
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
              <label>Tipo de bebedero</label>
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
        <h3>Ambiente</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Hábitat *</label>
            <select required value={formData.habitat || ''} onChange={(e) => handleChange('habitat', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="jaula_alambre">Jaula de alambre</option>
              <option value="acuario">Acuario</option>
              <option value="tunel_modular">Túnel modular</option>
            </select>
          </div>
          <div className="form-group">
            <label>Tamaño de Espacio (cm²)</label>
            <input type="text" value={formData.tamano_espacio || ''} onChange={(e) => handleChange('tamano_espacio', e.target.value)} placeholder="Mínimo: 38x60 cm" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Temperatura Ambiente (°C)</label>
            <input type="text" value={formData.temperatura_ambiente || ''} onChange={(e) => handleChange('temperatura_ambiente', e.target.value)} placeholder="Ideal: 18-24°C" />
          </div>
          <div className="form-group">
            <label>Humedad (%)</label>
            <input type="text" value={formData.humedad || ''} onChange={(e) => handleChange('humedad', e.target.value)} placeholder="Ideal: 40-60%" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Piso/Sustrato *</label>
            <select required value={formData.piso || ''} onChange={(e) => handleChange('piso', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="aserrin">Aserrín</option>
              <option value="papel">Papel reciclado</option>
              <option value="viruta">Viruta aromática</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="form-group">
            <label>Rueda de Ejercicio *</label>
            <YesNoChips
              value={formData.rueda_ejercicio}
              onChange={(val) => handleChange('rueda_ejercicio', val)}
            />
          </div>
        </div>

        {formData.rueda_ejercicio === 'SI' && (
          <div className="form-group">
            <label>Tamaño de la rueda</label>
            <input
              type="text"
              value={formData.tamano_rueda || ''}
              onChange={(e) => handleChange('tamano_rueda', e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label>Tiempo de Ejercicio Diario (minutos)</label>
          <input type="text" value={formData.tiempo_ejercicio || ''} onChange={(e) => handleChange('tiempo_ejercicio', e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tipo de ejercicio principal</label>
            <select
              value={formData.tipo_ejercicio || ''}
              onChange={(e) => handleChange('tipo_ejercicio', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="rueda">Rueda</option>
              <option value="tuneles">Túneles</option>
              <option value="libre_habitacion">Libre en habitación</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Limpieza de Jaula *</label>
          <select required value={formData.limpieza_jaula || ''} onChange={(e) => handleChange('limpieza_jaula', e.target.value)}>
            <option value="">Seleccionar</option>
            <option value="diaria">Diaria</option>
            <option value="cada_2_dias">Cada 2 días</option>
            <option value="semanal">Semanal</option>
          </select>
        </div>
      </div>

      <div id="hamsters-examen" className="form-section">
        <h3>Examen Físico</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Temperatura (°C)</label>
            <input type="text" value={formData.temperatura || ''} onChange={(e) => handleChange('temperatura', e.target.value)} placeholder="Normal: 38.5-39.5°C" />
          </div>
          <div className="form-group">
            <label>Frecuencia Cardíaca (lpm)</label>
            <input type="text" value={formData.frecuencia_cardiaca || ''} onChange={(e) => handleChange('frecuencia_cardiaca', e.target.value)} placeholder="Normal: 180-250" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Frecuencia Respiratoria (rpm)</label>
            <input type="text" value={formData.frecuencia_respiratoria || ''} onChange={(e) => handleChange('frecuencia_respiratoria', e.target.value)} placeholder="Normal: 30-60" />
          </div>
          <div className="form-group">
            <label>Hidratación</label>
            <select value={formData.hidratacion || ''} onChange={(e) => handleChange('hidratacion', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="5">5% (piel vuelve rápido)</option>
              <option value="6-8">6-8% (piel lenta)</option>
              <option value=">10">&gt;10% (piel no vuelve)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
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
      </div>

      <div id="hamsters-digestivo" className="form-section">
        <h3>Sistema Digestivo</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Apetito *</label>
            <select required value={formData.apetito || 'normal'} onChange={(e) => handleChange('apetito', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="anorexia_total">Totalmente anoréxico (&gt;12h)</option>
              <option value="anorexia_parcial">Parcialmente anoréxico</option>
            </select>
          </div>
          {(formData.apetito === 'anorexia_total' || formData.apetito === 'anorexia_parcial') && (
            <div className="form-group">
              <label>Tiempo sin comer (horas)</label>
              <input type="text" value={formData.tiempo_sin_comer || ''} onChange={(e) => handleChange('tiempo_sin_comer', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Come Semillas *</label>
            <YesNoChips
              value={formData.come_semillas}
              onChange={(val) => handleChange('come_semillas', val)}
            />
          </div>
          <div className="form-group">
            <label>Come Verduras *</label>
            <YesNoChips
              value={formData.come_verduras}
              onChange={(val) => handleChange('come_verduras', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Almacenamiento de comida en mejillas con mal olor?</label>
            <YesNoChips
              value={formData.almacen_mejillas_mal_olor}
              onChange={(val) => handleChange('almacen_mejillas_mal_olor', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Heces *</label>
            <select required value={formData.heces || 'normal'} onChange={(e) => handleChange('heces', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="ausentes">Ausentes (&gt;24h)</option>
              <option value="blandas">Blandas/pastosas</option>
              <option value="liquidas">Líquidas/húmedas</option>
            </select>
          </div>
          <div className="form-group">
            <label>Frecuencia (veces/día)</label>
            <input type="text" value={formData.heces_frecuencia || ''} onChange={(e) => handleChange('heces_frecuencia', e.target.value)} placeholder="Normal: 10-20 veces/día" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Color de Heces</label>
            <select value={formData.heces_color || ''} onChange={(e) => handleChange('heces_color', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="marron_oscuro">Marrón oscuro</option>
              <option value="amarillo">Amarillo</option>
              <option value="verde">Verde</option>
              <option value="rojizo">Rojizo (sangre)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Localización de heces</label>
            <select
              value={formData.heces_localizacion || ''}
              onChange={(e) => handleChange('heces_localizacion', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="en_jaula">En jaula</option>
              <option value="pegadas_ano">Pegadas al ano</option>
              <option value="en_cola">En cola</option>
            </select>
          </div>
          <div className="form-group">
            <label>¿Presencia de moco?</label>
            <YesNoChips
              value={formData.heces_moco}
              onChange={(val) => handleChange('heces_moco', val)}
            />
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
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Deshidratación visible</label>
            <YesNoChips
              value={formData.deshidratacion_visible}
              onChange={(val) => handleChange('deshidratacion_visible', val)}
            />
          </div>
        </div>
      </div>

      <div id="hamsters-respiratorio" className="form-section">
        <h3>Sistema Respiratorio</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Secreción Nasal *</label>
            <select required value={formData.secrecion_nasal || 'NO'} onChange={(e) => handleChange('secrecion_nasal', e.target.value)}>
              <option value="NO">No</option>
              <option value="clara">Clara (moco)</option>
              <option value="purulenta">Purulenta (amarilla/verde)</option>
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
            <label>Respiración *</label>
            <select required value={formData.respiracion || 'normal'} onChange={(e) => handleChange('respiracion', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="ruidosa">Ruidosa</option>
              <option value="dificultad_inhalar">Dificultad para inhalar</option>
              <option value="dificultad_exhalar">Dificultad para exhalar</option>
            </select>
          </div>
        </div>
      </div>

      <div id="hamsters-neurologico" className="form-section">
        <h3>Sistema Neurológico</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Temblor/Convulsiones *</label>
            <select required value={formData.convulsiones || 'NO'} onChange={(e) => handleChange('convulsiones', e.target.value)}>
              <option value="NO">No</option>
              <option value="temblor_generalizado">Temblor generalizado</option>
              <option value="focales">Convulsiones focales</option>
              <option value="generalizadas">Convulsiones generalizadas</option>
            </select>
          </div>
          {formData.convulsiones !== 'NO' && (
            <div className="form-group">
              <label>Duración (seg/min)</label>
              <input type="text" value={formData.convulsiones_duracion || ''} onChange={(e) => handleChange('convulsiones_duracion', e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Incoordinación *</label>
            <select required value={formData.incoordinacion || 'NO'} onChange={(e) => handleChange('incoordinacion', e.target.value)}>
              <option value="NO">No</option>
              <option value="caidas">Caídas laterales</option>
              <option value="rodar">Rodar sin control</option>
              <option value="no_mantiene">No puede mantenerse derecho</option>
            </select>
          </div>
        </div>
      </div>

      <div id="hamsters-cutaneo" className="form-section">
        <h3>Sistema Cutáneo</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Pelo/Piel *</label>
            <select required value={formData.pelo_piel || 'normal'} onChange={(e) => handleChange('pelo_piel', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="alopecia_simetrica">Alopecia simétrica</option>
              <option value="costras">Costras en cabeza/orejas</option>
              <option value="ulceras">Úlceras faciales</option>
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
            <label>Orejas *</label>
            <select required value={formData.orejas || 'normales'} onChange={(e) => handleChange('orejas', e.target.value)}>
              <option value="normales">Normales</option>
              <option value="costras">Costras en interior</option>
              <option value="secrecion">Secreción marrón</option>
              <option value="mal_olor">Mal olor</option>
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
      </div>

      <div id="hamsters-dental" className="form-section">
        <h3>Sistema Dental</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Dientes Frontales *</label>
            <select required value={formData.dientes || 'normales'} onChange={(e) => handleChange('dientes', e.target.value)}>
              <option value="normales">Normales</option>
              <option value="amarillentos">Amarillentos</option>
              <option value="curvados">Curvados</option>
              <option value="rotos">Rotos</option>
              <option value="sangrantes">Sangrantes</option>
            </select>
          </div>
          <div className="form-group">
            <label>Dificultad para Comer *</label>
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
