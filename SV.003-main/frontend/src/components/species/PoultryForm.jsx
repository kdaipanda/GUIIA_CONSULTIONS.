import React from 'react';
import { useForm } from 'react-hook-form';

const PoultryForm = ({ onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="bg-amber-50 p-4 rounded-lg mb-6">
        <h3 className="text-xl font-bold text-amber-900">Formulario de Consulta - PATOS Y POLLOS</h3>
      </div>

      {/* DATOS DEL PACIENTE */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">DATOS DEL PACIENTE</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del paciente *</label>
            <input type="text" {...register('nombre_paciente', { required: true })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500" />
            {errors.nombre_paciente && <span className="text-red-500 text-xs">Este campo es requerido</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especie exacta</label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center text-sm"><input type="checkbox" value="pollo" {...register('especie_exacta')} className="mr-1" />Pollo doméstico</label>
              <label className="flex items-center text-sm"><input type="checkbox" value="pato" {...register('especie_exacta')} className="mr-1" />Pato</label>
              <label className="flex items-center text-sm"><input type="checkbox" value="guinea" {...register('especie_exacta')} className="mr-1" />Gallina de Guinea</label>
              <label className="flex items-center text-sm"><input type="checkbox" value="pavo" {...register('especie_exacta')} className="mr-1" />Pavo</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edad exacta</label>
            <input type="text" {...register('edad')} placeholder="semanas/meses/años" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
            <div className="flex gap-4">
              <label className="flex items-center"><input type="radio" value="hembra" {...register('sexo')} className="mr-2" />Hembra</label>
              <label className="flex items-center"><input type="radio" value="macho" {...register('sexo')} className="mr-2" />Macho</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Propósito</label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center text-sm"><input type="checkbox" value="huevos" {...register('proposito')} className="mr-1" />Producción de huevos</label>
              <label className="flex items-center text-sm"><input type="checkbox" value="carne" {...register('proposito')} className="mr-1" />Producción de carne</label>
              <label className="flex items-center text-sm"><input type="checkbox" value="mascota" {...register('proposito')} className="mr-1" />Mascota</label>
              <label className="flex items-center text-sm"><input type="checkbox" value="exhibicion" {...register('proposito')} className="mr-1" />Exhibición</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso actual (g/kg)</label>
            <input type="text" {...register('peso')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Condición corporal</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="radio" value="emaciado" {...register('condicion_corporal')} className="mr-2" />Emaciado</label>
            <label className="flex items-center"><input type="radio" value="delgado" {...register('condicion_corporal')} className="mr-2" />Delgado</label>
            <label className="flex items-center"><input type="radio" value="ideal" {...register('condicion_corporal')} className="mr-2" />Ideal</label>
            <label className="flex items-center"><input type="radio" value="sobrepeso" {...register('condicion_corporal')} className="mr-2" />Sobrepeso</label>
            <label className="flex items-center"><input type="radio" value="obeso" {...register('condicion_corporal')} className="mr-2" />Obeso</label>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Progresión</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="radio" value="mejora" {...register('progresion')} className="mr-2" />Mejora</label>
            <label className="flex items-center"><input type="radio" value="estable" {...register('progresion')} className="mr-2" />Estable</label>
            <label className="flex items-center"><input type="radio" value="empeora" {...register('progresion')} className="mr-2" />Empeora rápidamente</label>
            <label className="flex items-center"><input type="radio" value="intermitente" {...register('progresion')} className="mr-2" />Intermitente</label>
          </div>
        </div>
      </div>

      {/* SISTEMA RESPIRATORIO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">SISTEMA RESPIRATORIO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Secreción nasal/oral</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center"><input type="checkbox" value="clara" {...register('secrecion_tipo')} className="mr-1" />Clara</label>
            <label className="flex items-center"><input type="checkbox" value="mucosa" {...register('secrecion_tipo')} className="mr-1" />Mucosa</label>
            <label className="flex items-center"><input type="checkbox" value="purulenta" {...register('secrecion_tipo')} className="mr-1" />Purulenta</label>
            <label className="flex items-center"><input type="checkbox" value="caseosa" {...register('secrecion_tipo')} className="mr-1" />Caseosa</label>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center"><input type="radio" value="unilateral" {...register('secrecion_loc')} className="mr-2" />Unilateral</label>
            <label className="flex items-center"><input type="radio" value="bilateral" {...register('secrecion_loc')} className="mr-2" />Bilateral</label>
            <label className="flex items-center"><input type="radio" value="solo_boca" {...register('secrecion_loc')} className="mr-2" />Solo en boca</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad respiratoria</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="checkbox" value="abdomen_movimiento" {...register('dificultad_respiratoria')} className="mr-1" />Abdomen moviéndose exageradamente</label>
            <label className="flex items-center"><input type="checkbox" value="boca_abierta" {...register('dificultad_respiratoria')} className="mr-1" />Boca abierta</label>
            <label className="flex items-center"><input type="checkbox" value="aleteo" {...register('dificultad_respiratoria')} className="mr-1" />Aleteo rápido</label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia respiratoria en reposo (rpm)</label>
            <input type="text" {...register('frecuencia_respiratoria')} placeholder="Normal: 15-30" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Inspiratoria o espiratoria predominante?</label>
            <div className="flex gap-4">
              <label className="flex items-center"><input type="radio" value="inspiratoria" {...register('predominante')} className="mr-2" />Inspiratoria</label>
              <label className="flex items-center"><input type="radio" value="espiratoria" {...register('predominante')} className="mr-2" />Espiratoria</label>
            </div>
          </div>
        </div>
      </div>

      {/* SISTEMA REPRODUCTIVO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">SISTEMA REPRODUCTIVO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hembras</label>
          <div className="space-y-3">
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
            <div>
              <label className="block text-xs text-gray-600 mb-1">¿Prolapso cloacal?</label>
              <div className="flex gap-4"><label className="flex items-center"><input type="radio" value="si" {...register('prolapso_cloacal')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('prolapso_cloacal')} className="mr-2" />No</label></div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">¿Secreción cloacal?</label>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center text-sm"><input type="checkbox" value="sanguinolenta" {...register('secrecion_cloacal')} className="mr-1" />Sanguinolenta</label>
                <label className="flex items-center text-sm"><input type="checkbox" value="purulenta" {...register('secrecion_cloacal')} className="mr-1" />Purulenta</label>
                <label className="flex items-center text-sm"><input type="checkbox" value="mucosa" {...register('secrecion_cloacal')} className="mr-1" />Mucosa</label>
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
              <label className="block text-xs text-gray-600 mb-1">¿Presencia de parásitos?</label>
              <div className="flex gap-4"><label className="flex items-center"><input type="radio" value="si" {...register('heces_parasitos')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('heces_parasitos')} className="mr-2" />No</label></div>
            </div>
          </div>
        </div>
      </div>

      {/* ALIMENTACIÓN */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">ALIMENTACIÓN</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo exacto</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="checkbox" value="pellets" {...register('tipo_dieta')} className="mr-1" />Pellets comerciales</label>
            <label className="flex items-center"><input type="checkbox" value="semillas" {...register('tipo_dieta')} className="mr-1" />Mezcla de semillas</label>
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
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño de jaula/galpón (m²)</label>
            <input type="text" {...register('tamano_jaula')} placeholder="Mínimo: 0.1-0.25 m²/ave" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center"><input type="checkbox" value="interior" {...register('ubicacion')} className="mr-1" />Interior</label>
              <label className="flex items-center"><input type="checkbox" value="exterior" {...register('ubicacion')} className="mr-1" />Exterior</label>
              <label className="flex items-center"><input type="checkbox" value="mixto" {...register('ubicacion')} className="mr-1" />Mixto</label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura (°C)</label>
            <input type="text" {...register('temperatura')} placeholder="Ideal: 15-25°C" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ventilación</label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center text-sm"><input type="radio" value="buena" {...register('ventilacion')} className="mr-2" />Buena</label>
              <label className="flex items-center text-sm"><input type="radio" value="con_corrientes" {...register('ventilacion')} className="mr-2" />Con corrientes de aire</label>
              <label className="flex items-center text-sm"><input type="radio" value="estancada" {...register('ventilacion')} className="mr-2" />Estancada</label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">¿Contacto con aves silvestres?</label>
          <div className="flex gap-4"><label className="flex items-center"><input type="radio" value="si" {...register('contacto_aves_silvestres')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('contacto_aves_silvestres')} className="mr-2" />No</label></div>
        </div>
      </div>

      {/* HISTORIA MÉDICA PREVIA */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">HISTORIA MÉDICA PREVIA - VACUNACIÓN</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Enfermedad de Newcastle</label>
            <div className="flex gap-4"><label className="flex items-center"><input type="radio" value="si" {...register('vacuna_newcastle')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('vacuna_newcastle')} className="mr-2" />No</label></div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Gumboro</label>
            <div className="flex gap-4"><label className="flex items-center"><input type="radio" value="si" {...register('vacuna_gumboro')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('vacuna_gumboro')} className="mr-2" />No</label></div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Bronquitis infecciosa</label>
            <div className="flex gap-4"><label className="flex items-center"><input type="radio" value="si" {...register('vacuna_bronquitis')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('vacuna_bronquitis')} className="mr-2" />No</label></div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Marek</label>
            <div className="flex gap-4"><label className="flex items-center"><input type="radio" value="si" {...register('vacuna_marek')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('vacuna_marek')} className="mr-2" />No</label></div>
          </div>
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
            <input type="text" {...register('frecuencia_cardiaca')} placeholder="Normal: 250-350" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso corporal (g/kg)</label>
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
        <textarea {...register('notas_adicionales')} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500" placeholder="Información adicional relevante..."></textarea>
      </div>

      {/* BOTONES */}
      <div className="flex gap-4 justify-end">
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
        <button type="submit" className="px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700">Guardar Consulta</button>
      </div>
    </form>
  );
};

export default PoultryForm;