import React, { useState, useEffect, useMemo, useCallback } from 'react';
import YesNoChips from '../ui/yes-no-chips';

const ErizosForm = ({ formData, setFormData }) => {
  const [activeSection, setActiveSection] = useState('erizos-info-basica');

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
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
    { id: 'erizos-info-basica', label: 'Información Básica', icon: '📋' },
    { id: 'erizos-historial', label: 'Historial Médico', icon: '📁' },
    { id: 'erizos-alimentacion', label: 'Alimentación', icon: '🥗' },
    { id: 'erizos-ambiente', label: 'Ambiente', icon: '🏠' },
    { id: 'erizos-ejercicio', label: 'Ejercicio', icon: '🏃' },
    { id: 'erizos-socializacion', label: 'Socialización', icon: '🤝' },
    { id: 'erizos-higiene', label: 'Higiene', icon: '🚿' },
    { id: 'erizos-respiratorio', label: 'Sistema Respiratorio', icon: '🫁' },
    { id: 'erizos-digestivo', label: 'Sistema Digestivo', icon: '🫃' },
    { id: 'erizos-tegumentario', label: 'Sistema Tegumentario', icon: '🦔' },
    { id: 'erizos-examen', label: 'Examen Físico', icon: '🩺' },
    { id: 'erizos-neurologico', label: 'Sistema Neurológico', icon: '🧠' },
    { id: 'erizos-dental', label: 'Sistema Dental', icon: '🦷' },
    { id: 'erizos-reproductivo', label: 'Sistema Reproductivo', icon: '🔬' },
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
      <h2>Datos del Paciente - Erizo Africano</h2>

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
      
      <div id="erizos-info-basica" className="form-section">
        <h3>Información Básica</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Nombre del Paciente *</label>
            <input type="text" required value={formData.nombre_mascota || ''} onChange={(e) => handleChange('nombre_mascota', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Nombre del Dueño *</label>
            <input type="text" required value={formData.nombre_dueño || ''} onChange={(e) => handleChange('nombre_dueño', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Edad (años/meses) *</label>
            <input type="text" required value={formData.edad || ''} onChange={(e) => handleChange('edad', e.target.value)} placeholder="Adulto &gt;6 meses, Senior &gt;3 años" />
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
            <label>Esterilizado *</label>
            <select required value={formData.esterilizado || ''} onChange={(e) => handleChange('esterilizado', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div className="form-group">
            <label>Peso Actual (g) *</label>
            <input type="text" required value={formData.peso || ''} onChange={(e) => handleChange('peso', e.target.value)} placeholder="Normal: 300-600g" />
          </div>
        </div>

        <div className="form-row">
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
          <div className="form-group">
            <label>Temperamento</label>
            <select value={formData.temperamento || 'tranquilo'} onChange={(e) => handleChange('temperamento', e.target.value)}>
              <option value="activo">Activo</option>
              <option value="letargico">Letárgico</option>
              <option value="agresivo">Agresivo</option>
              <option value="timido">Tímido</option>
              <option value="hiperactivo">Hiperactivo</option>
            </select>
          </div>
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

      <div id="erizos-historial" className="form-section">
        <h3>Historial Médico</h3>
        
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

        <div className="form-row">
          <div className="form-group">
            <label>Tratamiento para Sarna</label>
            <YesNoChips
              value={formData.tratamiento_sarna}
              onChange={(val) => handleChange('tratamiento_sarna', val)}
            />
          </div>
        </div>
      </div>

      <div id="erizos-alimentacion" className="form-section">
        <h3>Alimentación</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Dieta *</label>
            <select required value={formData.tipo_dieta || ''} onChange={(e) => handleChange('tipo_dieta', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="comercial">Comercial específica</option>
              <option value="casera">Casera</option>
              <option value="mixta">Mixta</option>
            </select>
          </div>
          <div className="form-group">
            <label>Marca y Composición</label>
            <input type="text" value={formData.marca_alimento || ''} onChange={(e) => handleChange('marca_alimento', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Come Insectos *</label>
            <YesNoChips
              value={formData.come_insectos}
              onChange={(val) => handleChange('come_insectos', val)}
            />
          </div>
          <div className="form-group">
            <label>Come Pellets *</label>
            <YesNoChips
              value={formData.come_pellets}
              onChange={(val) => handleChange('come_pellets', val)}
            />
          </div>
        </div>
      </div>

      <div id="erizos-ambiente" className="form-section">
        <h3>Ambiente</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Hábitat *</label>
            <select required value={formData.habitat || ''} onChange={(e) => handleChange('habitat', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="jaula">Jaula</option>
              <option value="corral">Corral</option>
              <option value="pecera">Pecera</option>
            </select>
          </div>
          <div className="form-group">
            <label>Ubicación *</label>
            <select required value={formData.ubicacion || ''} onChange={(e) => handleChange('ubicacion', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Uso de Placa Térmica *</label>
            <YesNoChips
              value={formData.placa_termica}
              onChange={(val) => handleChange('placa_termica', val)}
            />
          </div>
          <div className="form-group">
            <label>Superficie donde vive *</label>
            <select required value={formData.superficie || ''} onChange={(e) => handleChange('superficie', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="alfombra">Alfombra</option>
              <option value="piso_duro">Piso duro</option>
              <option value="sustrato">Sustrato/Aserrín</option>
              <option value="jaula_barrotes">Jaula con barrotes</option>
              <option value="otro">Otro</option>
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

      <div id="erizos-ejercicio" className="form-section">
        <h3>Ejercicio</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Tiempo de actividad nocturna (horas)</label>
            <input
              type="text"
              value={formData.actividad_nocturna_horas || ''}
              onChange={(e) => handleChange('actividad_nocturna_horas', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Tipo de ejercicio</label>
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
      </div>

      <div id="erizos-socializacion" className="form-section">
        <h3>Socialización</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Vive</label>
            <select
              value={formData.socializacion_tipo || ''}
              onChange={(e) => handleChange('socializacion_tipo', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="solo">Solo</option>
              <option value="pareja">Pareja</option>
            </select>
          </div>
          <div className="form-group">
            <label>Peleas recientes</label>
            <YesNoChips
              value={formData.peleas_recientes}
              onChange={(val) => handleChange('peleas_recientes', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Compatible con compañeros</label>
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
            <label>Lavado de comederos/bebederos</label>
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
            <label>Uso de desinfectantes</label>
            <YesNoChips
              value={formData.uso_desinfectantes}
              onChange={(val) => handleChange('uso_desinfectantes', val)}
            />
          </div>
        </div>
      </div>

      <div id="erizos-respiratorio" className="form-section">
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
          <div className="form-group">
            <label>Frecuencia Respiratoria (rpm)</label>
            <input type="text" value={formData.frecuencia_respiratoria || ''} onChange={(e) => handleChange('frecuencia_respiratoria', e.target.value)} placeholder="Normal: 40-60" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Costras en nariz/orejas?</label>
            <YesNoChips
              value={formData.costras_nariz_orejas}
              onChange={(val) => handleChange('costras_nariz_orejas', val)}
            />
          </div>
          <div className="form-group">
            <label>Ronquidos o estertores</label>
            <YesNoChips
              value={formData.ronquidos_estertores}
              onChange={(val) => handleChange('ronquidos_estertores', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Estornudos</label>
            <select
              value={formData.estornudos || ''}
              onChange={(e) => handleChange('estornudos', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="aislados">Aislados</option>
              <option value="frecuentes">Frecuentes</option>
              <option value="con_secrecion">Con secreción</option>
              <option value="sin_secrecion">Sin secreción</option>
            </select>
          </div>
        </div>
      </div>

      <div id="erizos-digestivo" className="form-section">
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
            <label>Rechaza comida húmeda</label>
            <YesNoChips
              value={formData.rechaza_comida_humeda}
              onChange={(val) => handleChange('rechaza_comida_humeda', val)}
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
              <option value="liquidas">Líquidas</option>
              <option value="con_sangre">Con sangre</option>
            </select>
          </div>
          <div className="form-group">
            <label>Frecuencia (veces/día)</label>
            <input type="text" value={formData.heces_frecuencia || ''} onChange={(e) => handleChange('heces_frecuencia', e.target.value)} placeholder="Normal: 1-3 veces/día" />
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
              <option value="marron_oscuro">Marrón oscuro</option>
              <option value="amarillo">Amarillo</option>
              <option value="verde">Verde</option>
              <option value="rojizo">Rojizo (sangre)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Presencia de moco</label>
            <YesNoChips
              value={formData.heces_moco}
              onChange={(val) => handleChange('heces_moco', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Presencia de parásitos</label>
            <YesNoChips
              value={formData.heces_parasitos}
              onChange={(val) => handleChange('heces_parasitos', val)}
            />
          </div>
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

      <div id="erizos-tegumentario" className="form-section">
        <h3>Sistema Tegumentario</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Púas *</label>
            <select required value={formData.puas || 'normales'} onChange={(e) => handleChange('puas', e.target.value)}>
              <option value="normales">Normales</option>
              <option value="caida_simetrica">Caída simétrica</option>
              <option value="caida_localizada">Caída localizada</option>
              <option value="rotas">Púas rotas</option>
              <option value="con_costras">Con costras</option>
            </select>
          </div>
          <div className="form-group">
            <label>Prurito Intenso *</label>
            <select required value={formData.prurito || 'ausente'} onChange={(e) => handleChange('prurito', e.target.value)}>
              <option value="ausente">Ausente</option>
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
              <option value="ulceras">Úlceras faciales</option>
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
            <label>Piel seca/grasa</label>
            <YesNoChips
              value={formData.piel_seca_grasa}
              onChange={(val) => handleChange('piel_seca_grasa', val)}
            />
          </div>
          <div className="form-group">
            <label>Pies</label>
            <select
              value={formData.pies || ''}
              onChange={(e) => handleChange('pies', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="ulceras_almohadillas">Úlceras en almohadillas</option>
              <option value="hinchazon">Hinchazón</option>
              <option value="sangrado">Sangrado</option>
            </select>
          </div>
        </div>
      </div>

      <div id="erizos-examen" className="form-section">
        <h3>Examen Físico</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Temperatura (°C)</label>
            <input type="text" value={formData.temperatura || ''} onChange={(e) => handleChange('temperatura', e.target.value)} placeholder="Normal: 32-35°C" />
          </div>
          <div className="form-group">
            <label>Peso Corporal (g)</label>
            <input type="text" value={formData.peso_corporal || ''} onChange={(e) => handleChange('peso_corporal', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Color de Mucosas</label>
            <select value={formData.mucosas || 'rosado'} onChange={(e) => handleChange('mucosas', e.target.value)}>
              <option value="rosado">Rosado</option>
              <option value="palido">Pálido</option>
              <option value="icterico">Ictérico</option>
              <option value="cianotico">Cianótico</option>
            </select>
          </div>
          <div className="form-group">
            <label>Estado de Hidratación</label>
            <select value={formData.hidratacion || 'normal'} onChange={(e) => handleChange('hidratacion', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="leve">Leve</option>
              <option value="moderado">Moderado</option>
              <option value="severo">Severo</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Tiempo de relleno capilar (TRC) (segundos)</label>
            <input
              type="text"
              value={formData.trc_segundos || ''}
              onChange={(e) => handleChange('trc_segundos', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Condición muscular</label>
            <select
              value={formData.condicion_muscular || ''}
              onChange={(e) => handleChange('condicion_muscular', e.target.value)}
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

        <div className="form-row">
          <div className="form-group">
            <label>Estado de las púas</label>
            <select
              value={formData.estado_puas || ''}
              onChange={(e) => handleChange('estado_puas', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="completo">Completo</option>
              <option value="perdida_parcial">Pérdida parcial</option>
              <option value="perdida_total">Pérdida total</option>
            </select>
          </div>
        </div>
      </div>

      <div id="erizos-neurologico" className="form-section">
        <h3>Sistema Neurológico</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Inestabilidad</label>
            <select
              value={formData.inestabilidad || ''}
              onChange={(e) => handleChange('inestabilidad', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="temblor_patas_traseras">Temblor en patas traseras</option>
              <option value="caidas_laterales">Caídas laterales</option>
              <option value="no_mantiene_derecho">No puede mantenerse derecho</option>
            </select>
          </div>
          <div className="form-group">
            <label>Progresión</label>
            <select
              value={formData.progresion || ''}
              onChange={(e) => handleChange('progresion', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="lenta">Lenta (meses)</option>
              <option value="rapida">Rápida (semanas)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Convulsiones</label>
            <select
              value={formData.convulsiones || ''}
              onChange={(e) => handleChange('convulsiones', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="temblor_generalizado">Temblor generalizado</option>
              <option value="focales">Convulsiones focales</option>
              <option value="generalizadas">Convulsiones generalizadas</option>
            </select>
          </div>
          <div className="form-group">
            <label>Letargo extremo</label>
            <select
              value={formData.letargo_extremo || ''}
              onChange={(e) => handleChange('letargo_extremo', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="duerme_todo_dia">Duerme todo el día</option>
              <option value="no_responde_estimulos">No responde a estímulos</option>
              <option value="hipotermia">Hipotermia</option>
            </select>
          </div>
        </div>
      </div>

      <div id="erizos-dental" className="form-section">
        <h3>Sistema Dental</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Dientes</label>
            <select
              value={formData.dientes_estado || ''}
              onChange={(e) => handleChange('dientes_estado', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="amarillentos">Amarillentos</option>
              <option value="caries">Caries</option>
              <option value="rotos">Rotos</option>
              <option value="sangrantes">Sangrantes</option>
            </select>
          </div>
          <div className="form-group">
            <label>Dificultad para comer</label>
            <YesNoChips
              value={formData.dificultad_comer}
              onChange={(val) => handleChange('dificultad_comer', val)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Secreción bucal</label>
            <YesNoChips
              value={formData.secrecion_bucal}
              onChange={(val) => handleChange('secrecion_bucal', val)}
            />
          </div>
          <div className="form-group">
            <label>Comportamiento alimenticio</label>
            <select
              value={formData.comportamiento_alimenticio || ''}
              onChange={(e) => handleChange('comportamiento_alimenticio', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="mordisquea_lentamente">Mordisquea lentamente</option>
              <option value="deja_sin_masticar">Deja comida sin masticar</option>
              <option value="rechaza_comida_dura">Rechaza comida dura</option>
              <option value="prefiere_blanda">Preferencia por comida blanda</option>
            </select>
          </div>
        </div>
      </div>

      <div id="erizos-reproductivo" className="form-section">
        <h3>Sistema Reproductivo</h3>
        
        {formData.sexo === 'hembra' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Último celo (días atrás)</label>
                <input
                  type="text"
                  value={formData.ultimo_celo_dias || ''}
                  onChange={(e) => handleChange('ultimo_celo_dias', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Secreción vaginal</label>
                <select
                  value={formData.secrecion_vaginal || 'NO'}
                  onChange={(e) => handleChange('secrecion_vaginal', e.target.value)}
                >
                  <option value="NO">No</option>
                  <option value="sanguinolenta">Sanguinolenta</option>
                  <option value="purulenta">Purulenta</option>
                  <option value="mucosa">Mucosa</option>
                </select>
              </div>
              {formData.secrecion_vaginal !== 'NO' && (
                <div className="form-group">
                  <label>Frecuencia</label>
                  <select
                    value={formData.secrecion_vaginal_frecuencia || ''}
                    onChange={(e) => handleChange('secrecion_vaginal_frecuencia', e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    <option value="intermitente">Intermitente</option>
                    <option value="continua">Continua</option>
                  </select>
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hinchazón abdominal</label>
                <YesNoChips
                  value={formData.hinchazon_abdominal}
                  onChange={(val) => handleChange('hinchazon_abdominal', val)}
                />
              </div>
            </div>
          </>
        )}

        {formData.sexo === 'macho' && (
          <div className="form-row">
            <div className="form-group">
              <label>Testículos descendidos</label>
              <YesNoChips
                value={formData.testiculos_descendidos}
                onChange={(val) => handleChange('testiculos_descendidos', val)}
              />
            </div>
            <div className="form-group">
              <label>Hinchazón escrotal</label>
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