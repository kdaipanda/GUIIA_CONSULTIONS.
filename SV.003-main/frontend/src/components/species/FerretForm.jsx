import React from 'react';
import { useForm } from 'react-hook-form';

const FerretForm = ({ onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="bg-pink-50 p-4 rounded-lg mb-6">
        <h3 className="text-xl font-bold text-pink-900">Formulario de Consulta - HURÓN</h3>
      </div>

      {/* DATOS DEL PACIENTE */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">DATOS DEL PACIENTE</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del paciente *</label>
            <input
              type="text"
              {...register('nombre_paciente', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
            />
            {errors.nombre_paciente && <span className="text-red-500 text-xs">Este campo es requerido</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del dueño</label>
            <input
              type="text"
              {...register('nombre_dueno')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="macho" {...register('sexo')} className="mr-2" />
                Macho
              </label>
              <label className="flex items-center">
                <input type="radio" value="hembra" {...register('sexo')} className="mr-2" />
                Hembra
              </label>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="intacta" {...register('estado_reproductivo')} className="mr-2" />
                Intacta
              </label>
              <label className="flex items-center">
                <input type="radio" value="esterilizado" {...register('estado_reproductivo')} className="mr-2" />
                Esterilizado
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edad exacta</label>
            <input
              type="text"
              {...register('edad')}
              placeholder="años/meses"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso actual (g)</label>
            <input
              type="text"
              {...register('peso')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
            />
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperamento</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center text-sm">
                <input type="radio" value="jugueton" {...register('temperamento')} className="mr-2" />
                Juguetón
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="letargico" {...register('temperamento')} className="mr-2" />
                Letárgico
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="agresivo" {...register('temperamento')} className="mr-2" />
                Agresivo
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="timido" {...register('temperamento')} className="mr-2" />
                Tímido
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="hiperactivo" {...register('temperamento')} className="mr-2" />
                Hiperactivo
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color/pelaje</label>
            <input
              type="text"
              {...register('color_pelaje')}
              placeholder="Sable, Blanco, Albino, Marta, Panda, Otro"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Se extrajeron glándulas anales</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input type="radio" value="si" {...register('glandulas_anales')} className="mr-2" />
              Sí
            </label>
            <label className="flex items-center">
              <input type="radio" value="no" {...register('glandulas_anales')} className="mr-2" />
              No
            </label>
          </div>
        </div>
      </div>

      {/* VACUNACIÓN Y DESPARASITACIÓN */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">VACUNACIÓN Y DESPARASITACIÓN</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moquillo</label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center text-sm">
                <input type="radio" value="completa" {...register('vacuna_moquillo')} className="mr-2" />
                Completa
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="incompleta" {...register('vacuna_moquillo')} className="mr-2" />
                Incompleta
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="nunca" {...register('vacuna_moquillo')} className="mr-2" />
                Nunca
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rabia</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="si" {...register('vacuna_rabia')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="no" {...register('vacuna_rabia')} className="mr-2" />
                No
              </label>
            </div>
            <input type="text" {...register('vacuna_rabia_fecha')} placeholder="Fecha" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desparasitación Interna</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="si" {...register('desparasitacion_interna')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="no" {...register('desparasitacion_interna')} className="mr-2" />
                No
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desparasitación Externa</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="si" {...register('desparasitacion_externa')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="no" {...register('desparasitacion_externa')} className="mr-2" />
                No
              </label>
            </div>
            <input type="text" {...register('desparasitacion_externa_producto')} placeholder="Última fecha y producto" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tratamiento para Giardia</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center">
              <input type="radio" value="si" {...register('tratamiento_giardia')} className="mr-2" />
              Sí
            </label>
            <label className="flex items-center">
              <input type="radio" value="no" {...register('tratamiento_giardia')} className="mr-2" />
              No
            </label>
          </div>
          <input type="text" {...register('tratamiento_giardia_duracion')} placeholder="Duración" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
      </div>

      {/* EXAMEN FÍSICO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">EXAMEN FÍSICO</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura (°C)</label>
            <input type="text" {...register('temperatura')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia cardíaca (lpm)</label>
            <input type="text" {...register('frecuencia_cardiaca')} placeholder="Normal: 80-120; <60 = hipoglucemia" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia respiratoria (rpm)</label>
            <input type="text" {...register('frecuencia_respiratoria')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <input type="text" {...register('trc')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado de hidratación</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="radio" value="normal" {...register('hidratacion')} className="mr-2" />
              Normal
            </label>
            <label className="flex items-center">
              <input type="radio" value="leve" {...register('hidratacion')} className="mr-2" />
              Leve
            </label>
            <label className="flex items-center">
              <input type="radio" value="moderado" {...register('hidratacion')} className="mr-2" />
              Moderado
            </label>
            <label className="flex items-center">
              <input type="radio" value="severo" {...register('hidratacion')} className="mr-2" />
              Severo
            </label>
          </div>
        </div>
      </div>

      {/* SISTEMA ENDOCRINO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">SISTEMA ENDOCRINO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pérdida de pelo</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center">
              <input type="checkbox" value="cola_base" {...register('perdida_pelo')} className="mr-1" />
              Solo en cola/base
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="lateralmente_simetrico" {...register('perdida_pelo')} className="mr-1" />
              Lateralmente simétrico
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="total" {...register('perdida_pelo')} className="mr-1" />
              Total (excepto cabeza)
            </label>
          </div>
          <div className="mt-2">
            <label className="block text-xs text-gray-600 mb-1">Progresión</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="lenta" {...register('progresion_pelo')} className="mr-2" />
                Lenta (meses)
              </label>
              <label className="flex items-center">
                <input type="radio" value="rapida" {...register('progresion_pelo')} className="mr-2" />
                Rápida (semanas)
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hembra en celo permanente</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="si" {...register('celo_permanente')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="no" {...register('celo_permanente')} className="mr-2" />
                No
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Debilidad/colapso</label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center text-sm">
                <input type="checkbox" value="mananas" {...register('debilidad_tipo')} className="mr-1" />
                Mañanas en ayunas
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" value="post_ejercicio" {...register('debilidad_tipo')} className="mr-1" />
                Post-ejercicio
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" value="aleatorio" {...register('debilidad_tipo')} className="mr-1" />
                Aleatorio
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mejora con azúcar/miel</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input type="radio" value="si" {...register('mejora_azucar')} className="mr-2" />
              Sí
            </label>
            <label className="flex items-center">
              <input type="radio" value="no" {...register('mejora_azucar')} className="mr-2" />
              No
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hinchazón abdominal</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center">
              <input type="radio" value="difusa" {...register('hinchazon_abdominal')} className="mr-2" />
              Difusa
            </label>
            <label className="flex items-center">
              <input type="radio" value="localizada" {...register('hinchazon_abdominal')} className="mr-2" />
              Localizada
            </label>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Palpación de masa</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="si" {...register('palpacion_masa')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="no" {...register('palpacion_masa')} className="mr-2" />
                No
              </label>
            </div>
            <input type="text" {...register('tamano_masa')} placeholder="Tamaño" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>
      </div>

      {/* SISTEMA DIGESTIVO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">SISTEMA DIGESTIVO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apetito</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center">
              <input type="radio" value="hiperfagia" {...register('apetito')} className="mr-2" />
              Hiperfagia (come más)
            </label>
            <label className="flex items-center">
              <input type="radio" value="hipofagia" {...register('apetito')} className="mr-2" />
              Hipofagia (come menos)
            </label>
            <label className="flex items-center">
              <input type="radio" value="anorexia" {...register('apetito')} className="mr-2" />
              Anorexia
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm mb-2">
                <input type="checkbox" {...register('come_pierde_peso')} className="mr-2" />
                Come, pero pierde peso
              </label>
            </div>
            <div>
              <label className="flex items-center text-sm mb-2">
                <input type="checkbox" {...register('rechaza_seco')} className="mr-2" />
                Rechaza comida seca pero come húmeda
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vómitos/Regurgitación</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center">
              <input type="checkbox" value="no_digeridos" {...register('vomito_tipo')} className="mr-1" />
              Alimentos no digeridos
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="bilis" {...register('vomito_tipo')} className="mr-1" />
              Bilis
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="sangre" {...register('vomito_tipo')} className="mr-1" />
              Sangre
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="material_oscuro" {...register('vomito_tipo')} className="mr-1" />
              Material oscuro (heces)
            </label>
          </div>
          <input type="text" {...register('vomito_frecuencia')} placeholder="Frecuencia (veces/horas)" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heces</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center">
              <input type="checkbox" value="diarrea_aguda" {...register('heces_tipo')} className="mr-1" />
              Diarrea aguda (&lt;3 días)
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="diarrea_cronica" {...register('heces_tipo')} className="mr-1" />
              Diarrea crónica (&gt;1 semana)
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="estrenimiento" {...register('heces_tipo')} className="mr-1" />
              Estreñimiento
            </label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <select {...register('heces_color')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Color...</option>
              <option value="normal">Normal</option>
              <option value="negras">Negras</option>
              <option value="rojas">Rojas</option>
              <option value="palidas">Pálidas</option>
            </select>
            <select {...register('heces_consistencia')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Consistencia...</option>
              <option value="liquidas">Líquidas</option>
              <option value="pastosas">Pastosas</option>
              <option value="formadas">Formadas</option>
              <option value="con_moco">Con moco</option>
            </select>
            <div>
              <label className="flex items-center text-sm">
                <input type="checkbox" {...register('heces_parasitos')} className="mr-2" />
                Presencia de parásitos
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ALIMENTACIÓN */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">HÁBITOS Y FACTORES DE RIESGO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de dieta</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center">
              <input type="checkbox" value="comercial" {...register('tipo_dieta')} className="mr-1" />
              Comercial específica
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="casera" {...register('tipo_dieta')} className="mr-1" />
              Casera
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="mixta" {...register('tipo_dieta')} className="mr-1" />
              Mixta
            </label>
          </div>
          <input type="text" {...register('marca_dieta')} placeholder="Marca" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Suplementos</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="checkbox" value="vitaminas" {...register('suplementos')} className="mr-1" />
              Vitaminas
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="enzimas" {...register('suplementos')} className="mr-1" />
              Enzimas
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="aceite_pescado" {...register('suplementos')} className="mr-1" />
              Aceite de pescado
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente - Casa</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="checkbox" value="jaula" {...register('casa')} className="mr-1" />
              Jaula
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="corral" {...register('casa')} className="mr-1" />
              Corral
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="libre" {...register('casa')} className="mr-1" />
              Libre
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura (°C)</label>
            <input
              type="text"
              {...register('temp_ambiente')}
              placeholder="Ideal: 18-24°C"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de juego diario</label>
            <input
              type="text"
              {...register('tiempo_juego')}
              placeholder="horas"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supervisión durante juego</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input type="radio" value="si" {...register('supervision_juego')} className="mr-2" />
              Sí
            </label>
            <label className="flex items-center">
              <input type="radio" value="no" {...register('supervision_juego')} className="mr-2" />
              No
            </label>
          </div>
        </div>
      </div>

      {/* NOTAS ADICIONALES */}
      <div className="border-2 border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">NOTAS ADICIONALES</h4>
        <textarea
          {...register('notas_adicionales')}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
          placeholder="Información adicional relevante..."
        ></textarea>
      </div>

      {/* BOTONES */}
      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
        >
          Guardar Consulta
        </button>
      </div>
    </form>
  );
};

export default FerretForm;
