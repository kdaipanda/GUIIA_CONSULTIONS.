import React from 'react';
import { useForm } from 'react-hook-form';

const BirdForm = ({ onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="bg-sky-50 p-4 rounded-lg mb-6">
        <h3 className="text-xl font-bold text-sky-900">Formulario de Consulta - AVES (Psitácidos/Ornamentales)</h3>
      </div>

      {/* DATOS DEL PACIENTE */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">DATOS DEL PACIENTE</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del paciente *</label>
            <input type="text" {...register('nombre_paciente', { required: true })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500" />
            {errors.nombre_paciente && <span className="text-red-500 text-xs">Este campo es requerido</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especie exacta</label>
            <input type="text" {...register('especie_exacta')} placeholder="Ej: Amazona amazonica, Melopsittacus undulatus" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subespecie/variante</label>
            <input type="text" {...register('subespecie')} placeholder="Ej: Lutino, Cinnamon, Albino" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edad exacta</label>
            <input type="text" {...register('edad')} placeholder="años/meses" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center"><input type="radio" value="macho" {...register('sexo')} className="mr-2" />Macho</label>
              <label className="flex items-center"><input type="radio" value="hembra" {...register('sexo')} className="mr-2" />Hembra</label>
              <label className="flex items-center"><input type="radio" value="desconocido" {...register('sexo')} className="mr-2" />Desconocido</label>
            </div>
            <input type="text" {...register('sexo_confirmado')} placeholder="¿Confirmado?: Visual, ADN, Laparoscopia" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Anilla identificatoria</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <label className="flex items-center text-sm"><input type="checkbox" value="nacional" {...register('anilla_tipo')} className="mr-1" />Nacional</label>
              <label className="flex items-center text-sm"><input type="checkbox" value="cites" {...register('anilla_tipo')} className="mr-1" />CITES</label>
              <label className="flex items-center text-sm"><input type="checkbox" value="sin_anilla" {...register('anilla_tipo')} className="mr-1" />Sin anilla</label>
            </div>
            <input type="text" {...register('numero_anilla')} placeholder="Número de anilla" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso actual (g)</label>
            <input type="text" {...register('peso')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condición corporal</label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center text-sm"><input type="radio" value="emaciado" {...register('condicion_corporal')} className="mr-2" />Emaciado</label>
              <label className="flex items-center text-sm"><input type="radio" value="delgado" {...register('condicion_corporal')} className="mr-2" />Delgado</label>
              <label className="flex items-center text-sm"><input type="radio" value="ideal" {...register('condicion_corporal')} className="mr-2" />Ideal</label>
              <label className="flex items-center text-sm"><input type="radio" value="sobrepeso" {...register('condicion_corporal')} className="mr-2" />Sobrepeso</label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Temperamento</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="radio" value="tranquilo" {...register('temperamento')} className="mr-2" />Tranquilo</label>
            <label className="flex items-center"><input type="radio" value="nervioso" {...register('temperamento')} className="mr-2" />Nervioso</label>
            <label className="flex items-center"><input type="radio" value="agresivo" {...register('temperamento')} className="mr-2" />Agresivo</label>
            <label className="flex items-center"><input type="radio" value="timido" {...register('temperamento')} className="mr-2" />Tímido</label>
            <label className="flex items-center"><input type="radio" value="afectuoso" {...register('temperamento')} className="mr-2" />Afectuoso</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duración exacta del problema</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="radio" value="<12h" {...register('duracion_problema')} className="mr-2" />&lt;12 horas</label>
            <label className="flex items-center"><input type="radio" value="12-24h" {...register('duracion_problema')} className="mr-2" />12-24 h</label>
            <label className="flex items-center"><input type="radio" value="2-3dias" {...register('duracion_problema')} className="mr-2" />2-3 días</label>
            <label className="flex items-center"><input type="radio" value="4-7dias" {...register('duracion_problema')} className="mr-2" />4-7 días</label>
            <label className="flex items-center"><input type="radio" value=">1semana" {...register('duracion_problema')} className="mr-2" />&gt;1 semana</label>
          </div>
        </div>
      </div>

      {/* SISTEMA RESPIRATORIO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">SISTEMA RESPIRATORIO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad respiratoria</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="checkbox" value="abdomen_moviendo" {...register('dificultad_respiratoria')} className="mr-1" />Abdomen moviéndose exageradamente</label>
            <label className="flex items-center"><input type="checkbox" value="boca_abierta" {...register('dificultad_respiratoria')} className="mr-1" />Boca abierta</label>
            <label className="flex items-center"><input type="checkbox" value="aleteo" {...register('dificultad_respiratoria')} className="mr-1" />Aleteo rápido</label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia respiratoria en reposo (rpm)</label>
            <input type="text" {...register('frecuencia_respiratoria')} placeholder="Contar 1 minuto" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Inspiratoria o espiratoria predominante?</label>
            <div className="flex gap-4">
              <label className="flex items-center"><input type="radio" value="inspiratoria" {...register('predominante')} className="mr-2" />Inspiratoria</label>
              <label className="flex items-center"><input type="radio" value="espiratoria" {...register('predominante')} className="mr-2" />Espiratoria</label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">¿Ruidos respiratorios?</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="checkbox" value="silbidos" {...register('ruidos_respiratorios')} className="mr-1" />Silbidos</label>
            <label className="flex items-center"><input type="checkbox" value="ronquidos" {...register('ruidos_respiratorios')} className="mr-1" />Ronquidos</label>
            <label className="flex items-center"><input type="checkbox" value="estertores" {...register('ruidos_respiratorios')} className="mr-1" />Estertores</label>
            <label className="flex items-center"><input type="checkbox" value="estridor" {...register('ruidos_respiratorios')} className="mr-1" />Estridor</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Secreciones nasales/orales</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center"><input type="checkbox" value="clara" {...register('secreciones_tipo')} className="mr-1" />Clara</label>
            <label className="flex items-center"><input type="checkbox" value="mucosa" {...register('secreciones_tipo')} className="mr-1" />Mucosa</label>
            <label className="flex items-center"><input type="checkbox" value="purulenta" {...register('secreciones_tipo')} className="mr-1" />Purulenta</label>
            <label className="flex items-center"><input type="checkbox" value="sangre" {...register('secreciones_tipo')} className="mr-1" />Sangre</label>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center"><input type="radio" value="unilateral" {...register('secreciones_loc')} className="mr-2" />Unilateral</label>
            <label className="flex items-center"><input type="radio" value="bilateral" {...register('secreciones_loc')} className="mr-2" />Bilateral</label>
            <label className="flex items-center"><input type="radio" value="solo_boca" {...register('secreciones_loc')} className="mr-2" />Solo en boca</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">¿Cambio en el canto/vocalización?</label>
          <div className="flex gap-4"><label className="flex items-center"><input type="radio" value="si" {...register('cambio_canto')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('cambio_canto')} className="mr-2" />No</label></div>
        </div>
      </div>

      {/* SISTEMA DIGESTIVO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">SISTEMA DIGESTIVO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Buche</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="checkbox" value="distendido" {...register('buche_estado')} className="mr-1" />Distendido por &gt;4 horas</label>
            <label className="flex items-center"><input type="checkbox" value="liquido" {...register('buche_estado')} className="mr-1" />Líquido</label>
            <label className="flex items-center"><input type="checkbox" value="alimento_rancio" {...register('buche_estado')} className="mr-1" />Alimento rancio</label>
            <label className="flex items-center"><input type="checkbox" value="vacio" {...register('buche_estado')} className="mr-1" />Vacío cuando debería estar lleno</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">¿Regurgitación o vómito?</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center"><input type="radio" value="regurgitacion" {...register('vomito_tipo')} className="mr-2" />Regurgitación (suave, sin esfuerzo)</label>
            <label className="flex items-center"><input type="radio" value="vomito" {...register('vomito_tipo')} className="mr-2" />Vómito (violento, con contracciones)</label>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Contenido</label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center text-sm"><input type="checkbox" value="no_digerido" {...register('vomito_contenido')} className="mr-1" />Alimento sin digerir</label>
              <label className="flex items-center text-sm"><input type="checkbox" value="liquido_amarillo" {...register('vomito_contenido')} className="mr-1" />Líquido amarillo</label>
              <label className="flex items-center text-sm"><input type="checkbox" value="sangre" {...register('vomito_contenido')} className="mr-1" />Sangre</label>
              <label className="flex items-center text-sm"><input type="checkbox" value="fecaloide" {...register('vomito_contenido')} className="mr-1" />Material fecaloide</label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heces</label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Cambio en color</label>
              <select {...register('heces_color')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Seleccionar...</option>
                <option value="verde_oscuro">Verde oscuro</option>
                <option value="amarillo">Amarillo</option>
                <option value="rojo">Rojo</option>
                <option value="blanco">Blanco</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Cambio en consistencia</label>
              <select {...register('heces_consistencia')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Seleccionar...</option>
                <option value="liquidas">Líquidas</option>
                <option value="formadas">Formadas</option>
                <option value="sin_formar">Sin formar</option>
                <option value="con_moco">Con moco</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Frecuencia (veces/día)</label>
              <input type="text" {...register('heces_frecuencia')} placeholder="Normal varía por tamaño" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* SISTEMA REPRODUCTIVO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">SISTEMA REPRODUCTIVO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hembras</label>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">¿Está poniendo huevos?</label>
              <div className="flex gap-4"><label className="flex items-center"><input type="radio" value="si" {...register('poniendo_huevos')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('poniendo_huevos')} className="mr-2" />No</label></div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">¿Dificultad para poner?</label>
              <div className="flex gap-4"><label className="flex items-center"><input type="radio" value="si" {...register('dificultad_poner')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('dificultad_poner')} className="mr-2" />No</label></div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Huevos</label>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center text-sm"><input type="checkbox" value="deformes" {...register('huevos_estado')} className="mr-1" />Deformes</label>
                <label className="flex items-center text-sm"><input type="checkbox" value="sin_cascara" {...register('huevos_estado')} className="mr-1" />Sin cáscara</label>
                <label className="flex items-center text-sm"><input type="checkbox" value="pegajosos" {...register('huevos_estado')} className="mr-1" />Pegajosos</label>
                <label className="flex items-center text-sm"><input type="checkbox" value="rotos_internamente" {...register('huevos_estado')} className="mr-1" />Rotos internamente</label>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Machos</label>
          <div className="space-y-2">
            <label className="flex items-center"><input type="checkbox" value="territorial" {...register('machos_comportamiento')} className="mr-2" />Comportamiento territorial excesivo</label>
            <label className="flex items-center"><input type="checkbox" value="agresividad" {...register('machos_comportamiento')} className="mr-2" />Agresividad repentina</label>
            <label className="flex items-center"><input type="checkbox" value="cortejo" {...register('machos_comportamiento')} className="mr-2" />Postura de cortejo constante</label>
          </div>
        </div>
      </div>

      {/* SISTEMA TEGUMENTARIO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">SISTEMA TEGUMENTARIO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plumas</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center"><input type="checkbox" value="arrancamiento_simetrico" {...register('plumas_estado')} className="mr-1" />Arrancamiento simétrico (alas, pecho)</label>
            <label className="flex items-center"><input type="checkbox" value="arrancamiento_asimetrico" {...register('plumas_estado')} className="mr-1" />Arrancamiento asimétrico</label>
            <label className="flex items-center"><input type="checkbox" value="plumas_vaina" {...register('plumas_estado')} className="mr-1" />Plumas en vaina sangrante</label>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">¿Nuevas plumas en crecimiento?</label>
            <div className="flex gap-4"><label className="flex items-center"><input type="radio" value="si" {...register('nuevas_plumas')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('nuevas_plumas')} className="mr-2" />No</label></div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Piel</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="checkbox" value="descamacion" {...register('piel_estado')} className="mr-1" />Descamación excesiva</label>
            <label className="flex items-center"><input type="checkbox" value="costras" {...register('piel_estado')} className="mr-1" />Costras en cabeza</label>
            <label className="flex items-center"><input type="checkbox" value="inflamacion" {...register('piel_estado')} className="mr-1" />Inflamación periorbital</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Uñas/pico</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="checkbox" value="crecimiento_excesivo" {...register('unas_pico_estado')} className="mr-1" />Crecimiento excesivo</label>
            <label className="flex items-center"><input type="checkbox" value="grietas" {...register('unas_pico_estado')} className="mr-1" />Grietas</label>
            <label className="flex items-center"><input type="checkbox" value="deformidades" {...register('unas_pico_estado')} className="mr-1" />Deformidades</label>
            <label className="flex items-center"><input type="checkbox" value="sangrado" {...register('unas_pico_estado')} className="mr-1" />Sangrado</label>
          </div>
        </div>
      </div>

      {/* COMPORTAMIENTO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">COMPORTAMIENTO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cambio en vocalización</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="checkbox" value="silencio_total" {...register('cambio_vocalizacion')} className="mr-1" />Silencio total</label>
            <label className="flex items-center"><input type="checkbox" value="cambio_tono" {...register('cambio_vocalizacion')} className="mr-1" />Cambio en tono</label>
            <label className="flex items-center"><input type="checkbox" value="gritos_dolor" {...register('cambio_vocalizacion')} className="mr-1" />Gritos de dolor</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Interacción social</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="checkbox" value="aislamiento" {...register('interaccion_social')} className="mr-1" />Aislamiento</label>
            <label className="flex items-center"><input type="checkbox" value="agresividad" {...register('interaccion_social')} className="mr-1" />Agresividad repentina</label>
            <label className="flex items-center"><input type="checkbox" value="apegamiento" {...register('interaccion_social')} className="mr-1" />Apegamiento excesivo</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patrones de sueño</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center"><input type="checkbox" value="parado_una_pata" {...register('patron_sueno')} className="mr-1" />Dormir parado en una pata</label>
            <label className="flex items-center"><input type="checkbox" value="acostado_fondo" {...register('patron_sueno')} className="mr-1" />Acostado en el fondo</label>
            <label className="flex items-center"><input type="checkbox" value="cabeza_girada" {...register('patron_sueno')} className="mr-1" />Con cabeza girada</label>
          </div>
          <input type="text" {...register('horas_sueno')} placeholder="Horas de sueño (horas/día) Normal: 10-12 horas" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
      </div>

      {/* ALIMENTACIÓN */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">ALIMENTACIÓN</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo exacto</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="checkbox" value="semillas" {...register('tipo_dieta')} className="mr-1" />Semillas</label>
            <label className="flex items-center"><input type="checkbox" value="pellets" {...register('tipo_dieta')} className="mr-1" />Pellets</label>
            <label className="flex items-center"><input type="checkbox" value="mixta" {...register('tipo_dieta')} className="mr-1" />Mixta</label>
            <label className="flex items-center"><input type="checkbox" value="casera" {...register('tipo_dieta')} className="mr-1" />Casera</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">¿Suplementos?</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="checkbox" value="calcio" {...register('suplementos')} className="mr-1" />Calcio</label>
            <label className="flex items-center"><input type="checkbox" value="vitaminas" {...register('suplementos')} className="mr-1" />Vitaminas</label>
            <label className="flex items-center"><input type="checkbox" value="aceite_higado" {...register('suplementos')} className="mr-1" />Aceite de hígado de bacalao</label>
          </div>
        </div>
      </div>

      {/* AMBIENTE */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">AMBIENTE</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jaula - Tamaño (cm x cm x cm)</label>
          <input type="text" {...register('tamano_jaula')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center text-sm"><input type="checkbox" value="interior" {...register('ubicacion')} className="mr-1" />Interior</label>
              <label className="flex items-center text-sm"><input type="checkbox" value="exterior" {...register('ubicacion')} className="mr-1" />Exterior</label>
              <label className="flex items-center text-sm"><input type="checkbox" value="ventana" {...register('ubicacion')} className="mr-1" />Ventana</label>
              <label className="flex items-center text-sm"><input type="checkbox" value="cocina" {...register('ubicacion')} className="mr-1" />Cocina</label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura (°C)</label>
            <input type="text" {...register('temperatura')} placeholder="Ideal: 20-24°C" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Iluminación</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="checkbox" value="luz_natural" {...register('iluminacion')} className="mr-1" />Luz natural</label>
            <label className="flex items-center"><input type="checkbox" value="luz_uvb" {...register('iluminacion')} className="mr-1" />Luz UVB</label>
            <label className="flex items-center"><input type="checkbox" value="sin_luz_natural" {...register('iluminacion')} className="mr-1" />Sin luz natural</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">¿Contacto con aves silvestres?</label>
          <div className="flex gap-4"><label className="flex items-center"><input type="radio" value="si" {...register('contacto_aves_silvestres')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('contacto_aves_silvestres')} className="mr-2" />No</label></div>
        </div>
      </div>

      {/* EXAMEN FÍSICO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">EXAMEN FÍSICO CUANTIFICADO</h4>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura (°C)</label>
            <input type="text" {...register('temp_corporal')} placeholder="Normal: 40-42°C" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia cardíaca (lpm)</label>
            <input type="text" {...register('frecuencia_cardiaca')} placeholder="Normal: 200-400" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso corporal (g)</label>
            <input type="text" {...register('peso_corporal')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condición muscular pectoral</label>
            <select {...register('condicion_muscular')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Seleccionar...</option>
              <option value="excelente">Excelente</option>
              <option value="buena">Buena</option>
              <option value="regular">Regular</option>
              <option value="mala">Mala</option>
              <option value="ausente">Ausente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color de mucosas</label>
            <select {...register('color_mucosas')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Seleccionar...</option>
              <option value="rosado">Rosado</option>
              <option value="palido">Pálido</option>
              <option value="icterico">Ictérico</option>
              <option value="cianotico">Cianótico</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado de hidratación</label>
          <select {...register('hidratacion')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Seleccionar...</option>
            <option value="normal">Normal</option>
            <option value="leve">Leve</option>
            <option value="moderado">Moderado</option>
            <option value="severo">Severo</option>
          </select>
        </div>
      </div>

      {/* NOTAS ADICIONALES */}
      <div className="border-2 border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">NOTAS ADICIONALES</h4>
        <textarea {...register('notas_adicionales')} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500" placeholder="Información adicional relevante..."></textarea>
      </div>

      {/* BOTONES */}
      <div className="flex gap-4 justify-end">
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
        <button type="submit" className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">Guardar Consulta</button>
      </div>
    </form>
  );
};

export default BirdForm;