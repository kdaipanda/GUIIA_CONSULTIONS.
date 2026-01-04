import React from 'react';
import { useForm } from 'react-hook-form';

const HedgehogForm = ({ onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="bg-orange-50 p-4 rounded-lg mb-6">
        <h3 className="text-xl font-bold text-orange-900">Formulario de Consulta - ERIZO AFRICANO</h3>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
            />
            {errors.nombre_paciente && <span className="text-red-500 text-xs">Este campo es requerido</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del dueño</label>
            <input
              type="text"
              {...register('nombre_dueno')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especie exacta</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="atelerix_albiventris" {...register('especie_exacta')} className="mr-2" />
                Atelerix albiventris
              </label>
            </div>
            <input type="text" {...register('otra_especie')} placeholder="Otra especie" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edad exacta</label>
            <input
              type="text"
              {...register('edad')}
              placeholder="años/meses (Adulto: >6 meses, Senior: >3 años)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
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
              placeholder="Normal: 300-600g; obesidad >700g"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
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
              <input type="radio" value="activo" {...register('temperamento')} className="mr-2" />
              Activo
            </label>
            <label className="flex items-center">
              <input type="radio" value="letargico" {...register('temperamento')} className="mr-2" />
              Letárgico
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Color/púas</label>
          <input
            type="text"
            {...register('color_puas')}
            placeholder="Blanco, Negro, Albino, Pintado, Otro"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
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

      {/* DESPARASITACIÓN */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">DESPARASITACIÓN</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <input type="text" {...register('desparasitacion_interna_producto')} placeholder="Producto y fecha" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
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
            <input type="text" {...register('desparasitacion_externa_producto')} placeholder="Producto y fecha" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tratamiento para sarna</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center">
              <input type="radio" value="si" {...register('tratamiento_sarna')} className="mr-2" />
              Sí
            </label>
            <label className="flex items-center">
              <input type="radio" value="no" {...register('tratamiento_sarna')} className="mr-2" />
              No
            </label>
          </div>
          <input type="text" {...register('tratamiento_sarna_duracion')} placeholder="Duración" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
      </div>

      {/* HÁBITOS Y FACTORES DE RIESGO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">HÁBITOS Y FACTORES DE RIESGO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alimentación</label>
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
          <input type="text" {...register('marca_composicion')} placeholder="Marca y composición" className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2" />
          
          <label className="block text-sm text-gray-600 mb-1">Suplementos</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center">
              <input type="checkbox" value="vitaminas" {...register('suplementos')} className="mr-1" />
              Vitaminas
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="calcio" {...register('suplementos')} className="mr-1" />
              Calcio
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="insectos_vivos" {...register('suplementos')} className="mr-1" />
              Insectos vivos
            </label>
          </div>

          <label className="block text-sm text-gray-600 mb-1">Acceso a basura/comida humana</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center">
              <input type="radio" value="si" {...register('acceso_basura')} className="mr-2" />
              Sí
            </label>
            <label className="flex items-center">
              <input type="radio" value="no" {...register('acceso_basura')} className="mr-2" />
              No
            </label>
          </div>
          <input type="text" {...register('acceso_basura_especificar')} placeholder="Especificar" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hábitat</label>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center text-sm">
                  <input type="checkbox" value="jaula" {...register('habitat')} className="mr-1" />
                  Jaula
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" value="corral" {...register('habitat')} className="mr-1" />
                  Corral
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" value="pecera" {...register('habitat')} className="mr-1" />
                  Pecera
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ubicación</label>
              <div className="flex gap-3">
                <label className="flex items-center">
                  <input type="radio" value="interior" {...register('ubicacion')} className="mr-2" />
                  Interior
                </label>
                <label className="flex items-center">
                  <input type="radio" value="exterior" {...register('ubicacion')} className="mr-2" />
                  Exterior
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Uso de placa térmica</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input type="radio" value="si" {...register('placa_termica')} className="mr-2" />
                  Sí
                </label>
                <label className="flex items-center">
                  <input type="radio" value="no" {...register('placa_termica')} className="mr-2" />
                  No
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Superficie</label>
              <input type="text" {...register('superficie')} placeholder="Alfombra, Piso duro, sustrato/aserrín" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ejercicio</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tiempo de actividad nocturna</label>
              <input type="text" {...register('tiempo_actividad')} placeholder="horas" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Vive</label>
              <div className="flex gap-3">
                <label className="flex items-center">
                  <input type="radio" value="solo" {...register('socializacion')} className="mr-2" />
                  Solo
                </label>
                <label className="flex items-center">
                  <input type="radio" value="pareja" {...register('socializacion')} className="mr-2" />
                  Pareja
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Peleas recientes</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input type="radio" value="si" {...register('peleas_recientes')} className="mr-2" />
                  Sí
                </label>
                <label className="flex items-center">
                  <input type="radio" value="no" {...register('peleas_recientes')} className="mr-2" />
                  No
                </label>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Higiene</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-xs text-gray-600 mb-1">Uso de desinfectantes</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input type="radio" value="si" {...register('uso_desinfectantes')} className="mr-2" />
                  Sí
                </label>
                <label className="flex items-center">
                  <input type="radio" value="no" {...register('uso_desinfectantes')} className="mr-2" />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura corporal (°C)</label>
            <input type="text" {...register('temperatura_corporal')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso corporal (g)</label>
            <input type="text" {...register('peso_corporal')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado de las púas</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="radio" value="completo" {...register('estado_puas')} className="mr-2" />
              Completo
            </label>
            <label className="flex items-center">
              <input type="radio" value="perdida_parcial" {...register('estado_puas')} className="mr-2" />
              Pérdida parcial
            </label>
            <label className="flex items-center">
              <input type="radio" value="perdida_total" {...register('estado_puas')} className="mr-2" />
              Pérdida total
            </label>
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
            <input
              type="text"
              {...register('frecuencia_respiratoria')}
              placeholder="Normal: 40-60"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ronquidos o estertores</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="si" {...register('ronquidos')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="no" {...register('ronquidos')} className="mr-2" />
                No
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estornudos</label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center text-sm">
                <input type="checkbox" value="aislados" {...register('estornudos')} className="mr-1" />
                Aislados
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" value="frecuentes" {...register('estornudos')} className="mr-1" />
                Frecuentes
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" value="con_secrecion" {...register('estornudos')} className="mr-1" />
                Con secreción
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" value="sin_secrecion" {...register('estornudos')} className="mr-1" />
                Sin secreción
              </label>
            </div>
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
                <input type="checkbox" value="insectos" {...register('come_tipo')} className="mr-1" />
                Insectos
              </label>
              <label className="flex items-center">
                <input type="checkbox" value="comida_humeda" {...register('come_tipo')} className="mr-1" />
                Comida húmeda
              </label>
              <label className="flex items-center">
                <input type="checkbox" value="pellets" {...register('come_tipo')} className="mr-1" />
                Pellets
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
              Líquidas
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="sangre" {...register('heces_estado')} className="mr-1" />
              Con sangre
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
            <div>
              <label className="flex items-center text-sm">
                <input type="checkbox" value="si" {...register('heces_moco')} className="mr-2" />
                Presencia de moco
              </label>
            </div>
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

      {/* NOTAS ADICIONALES */}
      <div className="border-2 border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">NOTAS ADICIONALES</h4>
        <textarea
          {...register('notas_adicionales')}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
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
          className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          Guardar Consulta
        </button>
      </div>
    </form>
  );
};

export default HedgehogForm;
