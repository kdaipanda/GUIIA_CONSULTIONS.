import React from 'react';
import { useForm } from 'react-hook-form';

const HamsterForm = ({ onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <h3 className="text-xl font-bold text-yellow-900">Formulario de Consulta - HÁMSTER</h3>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
            />
            {errors.nombre_paciente && <span className="text-red-500 text-xs">Este campo es requerido</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de dueño</label>
            <input
              type="text"
              {...register('nombre_dueno')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especie exacta</label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center text-sm">
                <input type="radio" value="sirio" {...register('especie_exacta')} className="mr-2" />
                Sirio
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="enano" {...register('especie_exacta')} className="mr-2" />
                Enano
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="roborovski" {...register('especie_exacta')} className="mr-2" />
                Roborovski
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="campbell" {...register('especie_exacta')} className="mr-2" />
                Campbell
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="chino" {...register('especie_exacta')} className="mr-2" />
                Chino
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="ruso" {...register('especie_exacta')} className="mr-2" />
                Ruso
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edad exacta (meses)</label>
            <input
              type="text"
              {...register('edad')}
              placeholder="Adulto: 3-12 meses, Senior: >18 meses"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="macho" {...register('sexo')} className="mr-2" />
                Macho
              </label>
              <label className="flex items-center">
                <input type="radio" value="hembra" {...register('sexo')} className="mr-2" />
                Hembra
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Esterilizado</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="si" {...register('esterilizado')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="no" {...register('esterilizado')} className="mr-2" />
                No
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso actual (g)</label>
            <input
              type="text"
              {...register('peso')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Temperamento</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="radio" value="tranquilo" {...register('temperamento')} className="mr-2" />
              Tranquilo
            </label>
            <label className="flex items-center">
              <input type="radio" value="nervioso" {...register('temperamento')} className="mr-2" />
              Nervioso
            </label>
            <label className="flex items-center">
              <input type="radio" value="agresivo" {...register('temperamento')} className="mr-2" />
              Agresivo
            </label>
            <label className="flex items-center">
              <input type="radio" value="timido" {...register('temperamento')} className="mr-2" />
              Tímido
            </label>
            <label className="flex items-center">
              <input type="radio" value="hiperactivo" {...register('temperamento')} className="mr-2" />
              Hiperactivo
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duración exacta del problema</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="radio" value="<12h" {...register('duracion_problema')} className="mr-2" />
              &lt;12 horas
            </label>
            <label className="flex items-center">
              <input type="radio" value="12-24h" {...register('duracion_problema')} className="mr-2" />
              12-24 h
            </label>
            <label className="flex items-center">
              <input type="radio" value="2-3dias" {...register('duracion_problema')} className="mr-2" />
              2-3 días
            </label>
            <label className="flex items-center">
              <input type="radio" value="4-7dias" {...register('duracion_problema')} className="mr-2" />
              4-7 días
            </label>
            <label className="flex items-center">
              <input type="radio" value=">1semana" {...register('duracion_problema')} className="mr-2" />
              &gt;1 semana
            </label>
          </div>
        </div>
      </div>

      {/* HÁBITOS Y FACTORES DE RIESGO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">HÁBITOS Y FACTORES DE RIESGO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Desparasitación</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Interna</label>
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
              <input type="text" {...register('desparasitacion_interna_fecha')} placeholder="Fecha y producto" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Externa</label>
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
              <input type="text" {...register('desparasitacion_externa_fecha')} placeholder="Fecha y producto" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alimentación</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center">
              <input type="checkbox" value="balanceado" {...register('tipo_dieta')} className="mr-1" />
              Balanceado comercial
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="semillas" {...register('tipo_dieta')} className="mr-1" />
              Mezcla de semillas
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="casera" {...register('tipo_dieta')} className="mr-1" />
              Casera
            </label>
          </div>
          <input type="text" {...register('marca_composicion')} placeholder="Marca y composición" className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2" />
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Suplementos</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center">
                <input type="checkbox" value="vitaminas" {...register('suplementos')} className="mr-1" />
                Vitaminas
              </label>
              <label className="flex items-center">
                <input type="checkbox" value="calcio" {...register('suplementos')} className="mr-1" />
                Calcio
              </label>
              <label className="flex items-center">
                <input type="checkbox" value="frutas_verduras" {...register('suplementos')} className="mr-1" />
                Frutas/verduras
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hábitat</label>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center text-sm">
                  <input type="checkbox" value="jaula_alambre" {...register('habitat')} className="mr-1" />
                  Jaula de alambre
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" value="acuario" {...register('habitat')} className="mr-1" />
                  Acuario
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" value="tunel_modular" {...register('habitat')} className="mr-1" />
                  Túnel modular
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tamaño de espacio (cm²)</label>
              <input type="text" {...register('tamano_espacio')} placeholder="Mínimo: 38x60 cm" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Temperatura (°C)</label>
              <input type="text" {...register('temperatura_ambiente')} placeholder="Ideal: 18-24°C" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Humedad (%)</label>
              <input type="text" {...register('humedad')} placeholder="Ideal: 40-60%" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs text-gray-600 mb-1">Piso</label>
            <input type="text" {...register('piso')} placeholder="Aserrín, Papel reciclado, Viruta aromática, Otro" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ejercicio</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tiempo de ejercicio diario (minutos)</label>
              <input type="text" {...register('tiempo_ejercicio')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo de ejercicio</label>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center text-sm">
                  <input type="checkbox" value="rueda" {...register('tipo_ejercicio')} className="mr-1" />
                  Rueda
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" value="tuneles" {...register('tipo_ejercicio')} className="mr-1" />
                  Túneles
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" value="libre" {...register('tipo_ejercicio')} className="mr-1" />
                  Libre en habitación
                </label>
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
                <label className="flex items-center">
                  <input type="radio" value="solo" {...register('socializacion')} className="mr-2" />
                  Solo (recomendado para sirios)
                </label>
                <label className="flex items-center">
                  <input type="radio" value="pareja" {...register('socializacion')} className="mr-2" />
                  Pareja
                </label>
                <label className="flex items-center">
                  <input type="radio" value="grupo" {...register('socializacion')} className="mr-2" />
                  Grupo
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Peleas recientes</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center">
                  <input type="radio" value="si" {...register('peleas_recientes')} className="mr-2" />
                  Sí
                </label>
                <label className="flex items-center">
                  <input type="radio" value="no" {...register('peleas_recientes')} className="mr-2" />
                  No
                </label>
              </div>
              <input type="text" {...register('lesiones')} placeholder="Lesiones" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Higiene</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Limpieza de jaula</label>
              <select {...register('limpieza_jaula')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Seleccionar...</option>
                <option value="diaria">Diaria</option>
                <option value="cada_2_dias">Cada 2 días</option>
                <option value="semanal">Semanal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Uso de productos químicos</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input type="radio" value="si" {...register('uso_quimicos')} className="mr-2" />
                  Sí
                </label>
                <label className="flex items-center">
                  <input type="radio" value="no" {...register('uso_quimicos')} className="mr-2" />
                  No
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXAMEN FÍSICO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">EXAMEN FÍSICO</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura (°C)</label>
            <input type="text" {...register('temperatura')} placeholder="Normal: 38.5-39.5°C" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apetito</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <label className="flex items-center text-sm">
                <input type="radio" value="anorexia_total" {...register('apetito')} className="mr-2" />
                Totalmente anoréxico (&gt;12h)
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="anorexia_parcial" {...register('apetito')} className="mr-2" />
                Parcialmente anoréxico
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="normal" {...register('apetito')} className="mr-2" />
                Normal
              </label>
            </div>
            <input type="text" {...register('tiempo_sin_comer')} placeholder="Tiempo sin comer (horas)" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Come</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center">
                <input type="checkbox" value="semillas" {...register('come_tipo')} className="mr-1" />
                Semillas
              </label>
              <label className="flex items-center">
                <input type="checkbox" value="verduras" {...register('come_tipo')} className="mr-1" />
                Verduras
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heces</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center">
              <input type="checkbox" value="ausentes" {...register('heces_estado')} className="mr-1" />
              Ausentes (&gt;24h)
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="blandas" {...register('heces_estado')} className="mr-1" />
              Blandas/pastosas
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="liquidas" {...register('heces_estado')} className="mr-1" />
              Líquidas/húmedas
            </label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <input type="text" {...register('heces_frecuencia')} placeholder="Frecuencia (veces/día)" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            <select {...register('heces_color')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Color...</option>
              <option value="marron_oscuro">Marrón oscuro</option>
              <option value="amarillo">Amarillo</option>
              <option value="verde">Verde</option>
              <option value="rojizo">Rojizo (sangre)</option>
            </select>
            <input type="text" {...register('heces_localizacion')} placeholder="Localización" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Abdomen</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center">
                <input type="checkbox" value="distendido" {...register('abdomen')} className="mr-1" />
                Distendido
              </label>
              <label className="flex items-center">
                <input type="checkbox" value="doloroso" {...register('abdomen')} className="mr-1" />
                Doloroso al tacto
              </label>
              <label className="flex items-center">
                <input type="checkbox" value="ruidos_ausentes" {...register('abdomen')} className="mr-1" />
                Ruidos intestinales ausentes
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deshidratación visible</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="si" {...register('deshidratacion_visible')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="no" {...register('deshidratacion_visible')} className="mr-2" />
                No
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* SISTEMA RESPIRATORIO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">SISTEMA RESPIRATORIO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Secreción nasal</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center">
              <input type="checkbox" value="clara" {...register('secrecion_nasal_tipo')} className="mr-1" />
              Clara (moco)
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="purulenta" {...register('secrecion_nasal_tipo')} className="mr-1" />
              Purulenta (amarilla/verde)
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="sangre" {...register('secrecion_nasal_tipo')} className="mr-1" />
              Sangre
            </label>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input type="radio" value="unilateral" {...register('secrecion_nasal_loc')} className="mr-2" />
              Unilateral
            </label>
            <label className="flex items-center">
              <input type="radio" value="bilateral" {...register('secrecion_nasal_loc')} className="mr-2" />
              Bilateral
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Costras en nariz/orejas?</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="si" {...register('costras_nariz')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="no" {...register('costras_nariz')} className="mr-2" />
                No
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia respiratoria (rpm)</label>
            <input type="text" {...register('frecuencia_resp_reposo')} placeholder="Normal: 60-150" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Respiración</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="checkbox" value="normal" {...register('respiracion')} className="mr-1" />
              Normal
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="ruidosa" {...register('respiracion')} className="mr-1" />
              Ruidosa
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="dificultad_inhalar" {...register('respiracion')} className="mr-1" />
              Dificultad para inhalar
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="dificultad_exhalar" {...register('respiracion')} className="mr-1" />
              Dificultad para exhalar
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estornudos</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="checkbox" value="aislados" {...register('estornudos')} className="mr-1" />
              Aislados
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="frecuentes" {...register('estornudos')} className="mr-1" />
              Frecuentes
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="con_secrecion" {...register('estornudos')} className="mr-1" />
              Con secreción
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="sin_secrecion" {...register('estornudos')} className="mr-1" />
              Sin secreción
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
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
          className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
        >
          Guardar Consulta
        </button>
      </div>
    </form>
  );
};

export default HamsterForm;