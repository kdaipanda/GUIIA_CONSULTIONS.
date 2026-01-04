import React from 'react';
import { useForm } from 'react-hook-form';

const RabbitForm = ({ onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="bg-rose-50 p-4 rounded-lg mb-6">
        <h3 className="text-xl font-bold text-rose-900">Formulario de Consulta - CONEJO</h3>
      </div>

      {/* DATOS DEL PACIENTE */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">DATOS DEL PACIENTE</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del paciente *</label>
            <input type="text" {...register('nombre_paciente', { required: true })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500" />
            {errors.nombre_paciente && <span className="text-red-500 text-xs">Este campo es requerido</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de dueño</label>
            <input type="text" {...register('nombre_dueno')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Raza exacta</label>
            <input type="text" {...register('raza')} placeholder="Holandés, Lionhead, Flemish Giant, Mixto, Enano" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edad exacta</label>
            <input type="text" {...register('edad')} placeholder="años/meses" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
            <div className="flex gap-4">
              <label className="flex items-center"><input type="radio" value="macho" {...register('sexo')} className="mr-2" />Macho</label>
              <label className="flex items-center"><input type="radio" value="hembra" {...register('sexo')} className="mr-2" />Hembra</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Esterilizado</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center"><input type="radio" value="si" {...register('esterilizado')} className="mr-2" />Sí</label>
              <label className="flex items-center"><input type="radio" value="no" {...register('esterilizado')} className="mr-2" />No</label>
            </div>
            <input type="text" {...register('esterilizado_fecha')} placeholder="Fecha" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso actual (g/kg)</label>
            <input type="text" {...register('peso')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Índice de Condición Corporal (ICC)</label>
            <select {...register('icc')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Seleccionar...</option>
              <option value="1-3">1-3 (Emaciado)</option>
              <option value="4-5">4-5 (Delgado)</option>
              <option value="6-7">6-7 (Ideal)</option>
              <option value="8-9">8-9 (Sobrepeso)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Temperamento</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="radio" value="tranquilo" {...register('temperamento')} className="mr-2" />Tranquilo</label>
            <label className="flex items-center"><input type="radio" value="nervioso" {...register('temperamento')} className="mr-2" />Nervioso</label>
            <label className="flex items-center"><input type="radio" value="agresivo" {...register('temperamento')} className="mr-2" />Agresivo</label>
            <label className="flex items-center"><input type="radio" value="timido" {...register('temperamento')} className="mr-2" />Tímido</label>
            <label className="flex items-center"><input type="radio" value="destructivo" {...register('temperamento')} className="mr-2" />Destructivo</label>
          </div>
        </div>
      </div>

      {/* VACUNACIÓN Y DESPARASITACIÓN */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">VACUNACIÓN Y DESPARASITACIÓN</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mixomatosis</label>
            <div className="flex gap-4 mb-2"><label className="flex items-center"><input type="radio" value="si" {...register('vacuna_mixomatosis')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('vacuna_mixomatosis')} className="mr-2" />No</label></div>
            <input type="text" {...register('vacuna_mixomatosis_fecha')} placeholder="Fecha" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VHS (Virus Hemorrágico)</label>
            <div className="flex gap-4 mb-2"><label className="flex items-center"><input type="radio" value="si" {...register('vacuna_vhs')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('vacuna_vhs')} className="mr-2" />No</label></div>
            <input type="text" {...register('vacuna_vhs_fecha')} placeholder="Fecha" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desparasitación Interna</label>
            <div className="flex gap-4 mb-2"><label className="flex items-center"><input type="radio" value="si" {...register('desparasitacion_interna')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('desparasitacion_interna')} className="mr-2" />No</label></div>
            <input type="text" {...register('desparasitacion_interna_producto')} placeholder="Última y producto" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desparasitación Externa</label>
            <div className="flex gap-4 mb-2"><label className="flex items-center"><input type="radio" value="si" {...register('desparasitacion_externa')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('desparasitacion_externa')} className="mr-2" />No</label></div>
            <input type="text" {...register('desparasitacion_externa_producto')} placeholder="Última y producto" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>
      </div>

      {/* HÁBITOS Y FACTORES DE RIESGO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">HÁBITOS Y FACTORES DE RIESGO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alimentación</label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Heno</label>
              <input type="text" {...register('heno_tipo')} placeholder="Avena, Alfalfa, Otro" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Frecuencia de heno</label>
              <select {...register('heno_frecuencia')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Seleccionar...</option>
                <option value="ilimitado">Ilimitado</option>
                <option value="limitado">Limitado</option>
                <option value="intermitente">Intermitente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Pellets</label>
              <input type="text" {...register('pellets_marca')} placeholder="Marca" className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2" />
              <input type="text" {...register('pellets_cantidad')} placeholder="Cantidad (g/día)" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs text-gray-600 mb-1">Verduras frescas</label>
            <div className="flex gap-4 mb-2"><label className="flex items-center"><input type="radio" value="si" {...register('verduras_frescas')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('verduras_frescas')} className="mr-2" />No</label></div>
            <input type="text" {...register('verduras_cuales')} placeholder="¿Cuáles?" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Jaula/vivienda</label>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center text-sm"><input type="checkbox" value="interior" {...register('jaula_vivienda')} className="mr-1" />Interior</label>
                <label className="flex items-center text-sm"><input type="checkbox" value="exterior" {...register('jaula_vivienda')} className="mr-1" />Exterior</label>
                <label className="flex items-center text-sm"><input type="checkbox" value="mixto" {...register('jaula_vivienda')} className="mr-1" />Mixto</label>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tamaño de espacio (m²)</label>
              <input type="text" {...register('tamano_espacio')} placeholder="Mínimo: 2.5 m² + área de ejercicio" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Temperatura (°C)</label>
              <input type="text" {...register('temperatura')} placeholder="Ideal: 16-21°C" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Humedad (%)</label>
              <input type="text" {...register('humedad')} placeholder="Ideal: 40-60%" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs text-gray-600 mb-1">Superficie del piso</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center"><input type="checkbox" value="alambre" {...register('superficie_piso')} className="mr-1" />Alambre</label>
              <label className="flex items-center"><input type="checkbox" value="madera" {...register('superficie_piso')} className="mr-1" />Madera</label>
              <label className="flex items-center"><input type="checkbox" value="felpa" {...register('superficie_piso')} className="mr-1" />Felpa</label>
              <label className="flex items-center"><input type="checkbox" value="cemento" {...register('superficie_piso')} className="mr-1" />Cemento</label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ejercicio</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tiempo de ejercicio diario (horas)</label>
              <input type="text" {...register('tiempo_ejercicio')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo de ejercicio</label>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center text-sm"><input type="checkbox" value="libre_habitacion" {...register('tipo_ejercicio')} className="mr-1" />Libre en habitación</label>
                <label className="flex items-center text-sm"><input type="checkbox" value="correa" {...register('tipo_ejercicio')} className="mr-1" />Correa</label>
                <label className="flex items-center text-sm"><input type="checkbox" value="ninguno" {...register('tipo_ejercicio')} className="mr-1" />Ninguno</label>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Socialización</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Vive</label>
              <div className="flex gap-3">
                <label className="flex items-center"><input type="radio" value="solo" {...register('socializacion')} className="mr-2" />Solo</label>
                <label className="flex items-center"><input type="radio" value="pareja" {...register('socializacion')} className="mr-2" />Pareja</label>
                <label className="flex items-center"><input type="radio" value="grupo" {...register('socializacion')} className="mr-2" />Grupo</label>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Peleas recientes</label>
              <div className="flex gap-4 mb-2"><label className="flex items-center"><input type="radio" value="si" {...register('peleas_recientes')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('peleas_recientes')} className="mr-2" />No</label></div>
              <input type="text" {...register('lesiones')} placeholder="Lesiones" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* EXAMEN FÍSICO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">EXAMEN FÍSICO</h4>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura (°C)</label>
            <input type="text" {...register('temp_corporal')} placeholder="Normal: 38.5-39.5°C" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia cardíaca (lpm)</label>
            <input type="text" {...register('frecuencia_cardiaca')} placeholder="Normal: 180-250" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia respiratoria (rpm)</label>
            <input type="text" {...register('frecuencia_respiratoria')} placeholder="Normal: 30-60" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hidratación</label>
            <select {...register('hidratacion')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Seleccionar...</option>
              <option value="5%">5% (piel vuelve rápido)</option>
              <option value="6-8%">6-8% (piel lenta)</option>
              <option value=">10%">&gt;10% (piel no vuelve)</option>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TRC (segundos)</label>
            <input type="text" {...register('trc')} placeholder="Normal: <2 seg" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condición muscular</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado dental</label>
            <select {...register('estado_dental')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Seleccionar...</option>
              <option value="normal">Normal</option>
              <option value="sobrecrecimiento">Sobrecrecimiento</option>
              <option value="abscesos">Abscesos</option>
              <option value="dientes_rotos">Dientes rotos</option>
            </select>
          </div>
        </div>
      </div>

      {/* SISTEMA DIGESTIVO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">SISTEMA DIGESTIVO</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apetito</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <label className="flex items-center text-sm"><input type="radio" value="anorexia_total" {...register('apetito')} className="mr-2" />Totalmente anoréxico (&gt;12h)</label>
              <label className="flex items-center text-sm"><input type="radio" value="anorexia_parcial" {...register('apetito')} className="mr-2" />Parcialmente anoréxico</label>
              <label className="flex items-center text-sm"><input type="radio" value="normal" {...register('apetito')} className="mr-2" />Normal</label>
            </div>
            <input type="text" {...register('tiempo_sin_comer')} placeholder="Tiempo sin comer (horas)" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de alimentación</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center"><input type="checkbox" value="heno" {...register('come_tipo')} className="mr-1" />Heno</label>
              <label className="flex items-center"><input type="checkbox" value="pellets" {...register('come_tipo')} className="mr-1" />Pellets</label>
              <label className="flex items-center"><input type="checkbox" value="frutas_verduras" {...register('come_tipo')} className="mr-1" />Frutas y verduras</label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heces</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center"><input type="checkbox" value="ausentes" {...register('heces_estado')} className="mr-1" />Ausentes (&gt;12h)</label>
            <label className="flex items-center"><input type="checkbox" value="pequenas_duras" {...register('heces_estado')} className="mr-1" />Pequeñas y duras</label>
            <label className="flex items-center"><input type="checkbox" value="blandas" {...register('heces_estado')} className="mr-1" />Blandas/pastosas</label>
            <label className="flex items-center"><input type="checkbox" value="en_racimo" {...register('heces_estado')} className="mr-1" />En racimo</label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <input type="text" {...register('heces_frecuencia')} placeholder="Frecuencia (veces/día)" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            <select {...register('heces_tamano')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Tamaño...</option>
              <option value="normal">Normal</option>
              <option value="pequenas">Pequeñas</option>
              <option value="ausentes">Ausentes</option>
            </select>
            <select {...register('heces_color')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Color...</option>
              <option value="marron_oscuro">Marrón oscuro</option>
              <option value="verde">Verde</option>
              <option value="amarillento">Amarillento</option>
              <option value="blanco">Blanco (moho)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estómago/abdomen</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center"><input type="checkbox" value="distendido" {...register('abdomen')} className="mr-1" />Distendido</label>
              <label className="flex items-center"><input type="checkbox" value="doloroso" {...register('abdomen')} className="mr-1" />Doloroso al tacto</label>
              <label className="flex items-center"><input type="checkbox" value="ruidos_ausentes" {...register('abdomen')} className="mr-1" />Ruidos intestinales ausentes</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Regurgitación</label>
            <div className="flex gap-4"><label className="flex items-center"><input type="radio" value="si" {...register('regurgitacion')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('regurgitacion')} className="mr-2" />No</label></div>
          </div>
        </div>
      </div>

      {/* SISTEMA RESPIRATORIO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">SISTEMA RESPIRATORIO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Secreción nasal</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center"><input type="checkbox" value="clara" {...register('secrecion_nasal_tipo')} className="mr-1" />Clara (moco)</label>
            <label className="flex items-center"><input type="checkbox" value="purulenta" {...register('secrecion_nasal_tipo')} className="mr-1" />Purulenta (amarilla/verde)</label>
            <label className="flex items-center"><input type="checkbox" value="sangre" {...register('secrecion_nasal_tipo')} className="mr-1" />Sangre</label>
            <label className="flex items-center"><input type="checkbox" value="caseosa" {...register('secrecion_nasal_tipo')} className="mr-1" />Caseosa</label>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center"><input type="radio" value="unilateral" {...register('secrecion_nasal_loc')} className="mr-2" />Unilateral</label>
            <label className="flex items-center"><input type="radio" value="bilateral" {...register('secrecion_nasal_loc')} className="mr-2" />Bilateral</label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Presencia de costras en nariz</label>
            <div className="flex gap-4"><label className="flex items-center"><input type="radio" value="si" {...register('costras_nariz')} className="mr-2" />Sí</label><label className="flex items-center"><input type="radio" value="no" {...register('costras_nariz')} className="mr-2" />No</label></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia respiratoria (rpm)</label>
            <input type="text" {...register('frecuencia_resp_reposo')} placeholder="Normal: 30-60" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Respiración</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="checkbox" value="normal" {...register('respiracion')} className="mr-1" />Normal</label>
            <label className="flex items-center"><input type="checkbox" value="ruidosa" {...register('respiracion')} className="mr-1" />Ruidosa</label>
            <label className="flex items-center"><input type="checkbox" value="dificultad_inhalar" {...register('respiracion')} className="mr-1" />Dificultad para inhalar</label>
            <label className="flex items-center"><input type="checkbox" value="dificultad_exhalar" {...register('respiracion')} className="mr-1" />Dificultad para exhalar</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estornudos</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="checkbox" value="aislados" {...register('estornudos')} className="mr-1" />Aislados</label>
            <label className="flex items-center"><input type="checkbox" value="frecuentes" {...register('estornudos')} className="mr-1" />Frecuentes</label>
            <label className="flex items-center"><input type="checkbox" value="con_secrecion" {...register('estornudos')} className="mr-1" />Con secreción</label>
            <label className="flex items-center"><input type="checkbox" value="sin_secrecion" {...register('estornudos')} className="mr-1" />Sin secreción</label>
          </div>
        </div>
      </div>

      {/* MOTIVO DE CONSULTA */}
      <div className="border-2 border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">MOTIVO DE CONSULTA</h4>
        <textarea {...register('motivo_consulta')} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="En sus propias palabras, ¿qué lo trae hoy?"></textarea>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Duración exacta del problema</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="radio" value="<12h" {...register('duracion_problema')} className="mr-2" />&lt;12 horas</label>
            <label className="flex items-center"><input type="radio" value="12-24h" {...register('duracion_problema')} className="mr-2" />12-24 h</label>
            <label className="flex items-center"><input type="radio" value="2-3dias" {...register('duracion_problema')} className="mr-2" />2-3 días</label>
            <label className="flex items-center"><input type="radio" value="4-7dias" {...register('duracion_problema')} className="mr-2" />4-7 días</label>
            <label className="flex items-center"><input type="radio" value=">1semana" {...register('duracion_problema')} className="mr-2" />&gt;1 semana</label>
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Progresión</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center"><input type="radio" value="mejora" {...register('progresion')} className="mr-2" />Mejora</label>
            <label className="flex items-center"><input type="radio" value="estable" {...register('progresion')} className="mr-2" />Estable</label>
            <label className="flex items-center"><input type="radio" value="empeora" {...register('progresion')} className="mr-2" />Empeora rápidamente</label>
            <label className="flex items-center"><input type="radio" value="intermitente" {...register('progresion')} className="mr-2" />Intermitente</label>
          </div>
        </div>
      </div>

      {/* NOTAS ADICIONALES */}
      <div className="border-2 border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">NOTAS ADICIONALES</h4>
        <textarea {...register('notas_adicionales')} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500" placeholder="Información adicional relevante..."></textarea>
      </div>

      {/* BOTONES */}
      <div className="flex gap-4 justify-end">
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
        <button type="submit" className="px-6 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700">Guardar Consulta</button>
      </div>
    </form>
  );
};

export default RabbitForm;