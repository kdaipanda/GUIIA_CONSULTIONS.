import React from 'react';
import { useForm } from 'react-hook-form';

const DogForm = ({ onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-xl font-bold text-blue-900">Formulario de Consulta - PERRO</h3>
      </div>

      {/* DATOS GENERALES DEL PERRO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">DATOS GENERALES DEL PERRO</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">FECHA *</label>
            <input
              type="date"
              {...register('fecha', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            {errors.fecha && <span className="text-red-500 text-xs">Este campo es requerido</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NOMBRE DE LA MASCOTA *</label>
            <input
              type="text"
              {...register('nombre_mascota', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            {errors.nombre_mascota && <span className="text-red-500 text-xs">Este campo es requerido</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NOMBRE DEL DUEÑO *</label>
            <input
              type="text"
              {...register('nombre_dueno', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            {errors.nombre_dueno && <span className="text-red-500 text-xs">Este campo es requerido</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RAZA</label>
            <input
              type="text"
              {...register('raza')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MIX</label>
            <input
              type="text"
              {...register('mix')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">EDAD</label>
            <input
              type="text"
              {...register('edad')}
              placeholder="Ej: 5 años"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PESO</label>
            <input
              type="text"
              {...register('peso')}
              placeholder="Ej: 15 kg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CONDICIÓN CORPORAL (1-5)</label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map(num => (
                <label key={num} className="flex items-center">
                  <input type="radio" value={num} {...register('condicion_corporal')} className="mr-1" />
                  {num}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SEXO</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="hembra" {...register('sexo')} className="mr-2" />
                Hembra
              </label>
              <label className="flex items-center">
                <input type="radio" value="macho" {...register('sexo')} className="mr-2" />
                Macho
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ESTADO REPRODUCTIVO</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="entero" {...register('estado_reproductivo')} className="mr-2" />
                Entero
              </label>
              <label className="flex items-center">
                <input type="radio" value="castrado" {...register('estado_reproductivo')} className="mr-2" />
                Castrado
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VACUNAS VIGENTES</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="SI" {...register('vacunas_vigentes')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="NO" {...register('vacunas_vigentes')} className="mr-2" />
                No
              </label>
            </div>
            <input
              type="text"
              {...register('vacunas_cual')}
              placeholder="¿Cuál?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DESPARASITACIÓN INTERNA</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="SI" {...register('desparasitacion_interna')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="NO" {...register('desparasitacion_interna')} className="mr-2" />
                No
              </label>
            </div>
            <input
              type="text"
              {...register('desparasitacion_interna_cual')}
              placeholder="¿Cuál?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DESPARASITACIÓN EXTERNA</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="SI" {...register('desparasitacion_externa')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="NO" {...register('desparasitacion_externa')} className="mr-2" />
                No
              </label>
            </div>
            <input
              type="text"
              {...register('desparasitacion_externa_producto')}
              placeholder="Producto"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <input
              type="text"
              {...register('desparasitacion_externa_fecha')}
              placeholder="Fecha"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HABITAT DE LA MASCOTA</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="INTERIOR" {...register('habitat')} className="mr-2" />
                Interior
              </label>
              <label className="flex items-center">
                <input type="radio" value="EXTERIOR" {...register('habitat')} className="mr-2" />
                Exterior
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ZONA GEOGRÁFICA DE RESIDENCIA</label>
          <input
            type="text"
            {...register('zona_geografica')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ALIMENTACIÓN (SECO)</label>
            <input
              type="text"
              {...register('alimentacion_seco')}
              placeholder="Marca"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ALIMENTACIÓN (HÚMEDO)</label>
            <input
              type="text"
              {...register('alimentacion_humedo')}
              placeholder="Marca"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ALIMENTACIÓN (CASERO)</label>
            <input
              type="text"
              {...register('alimentacion_casero')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">FRECUENCIA DE ALIMENTACIÓN</label>
          <input
            type="text"
            {...register('alimentacion_frecuencia')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PASEOS</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="SI" {...register('paseos')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="NO" {...register('paseos')} className="mr-2" />
                No
              </label>
            </div>
            <input
              type="text"
              {...register('paseos_frecuencia')}
              placeholder="Frecuencia"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">BAÑOS O SERVICIO DE ESTÉTICA RECIENTE</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="SI" {...register('banos_estetica')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="NO" {...register('banos_estetica')} className="mr-2" />
                No
              </label>
            </div>
            <input
              type="text"
              {...register('banos_fecha')}
              placeholder="Fecha"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CIRUGÍAS PREVIAS</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center">
              <input type="radio" value="SI" {...register('cirugias_previas')} className="mr-2" />
              Sí
            </label>
            <label className="flex items-center">
              <input type="radio" value="NO" {...register('cirugias_previas')} className="mr-2" />
              No
            </label>
          </div>
          <input
            type="text"
            {...register('cirugias_cual')}
            placeholder="¿Cuál?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ASPECTO GENERAL DE LA MASCOTA</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">PELAJE</label>
              <input type="text" {...register('aspecto_pelaje')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">PIEL</label>
              <input type="text" {...register('aspecto_piel')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">OÍDOS</label>
              <input type="text" {...register('aspecto_oidos')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">OJOS</label>
              <input type="text" {...register('aspecto_ojos')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
          <div className="mt-2">
            <label className="block text-xs text-gray-600 mb-1">OTROS</label>
            <input type="text" {...register('aspecto_otros')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>
      </div>

      {/* HISTORIAL REPORTADO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">HISTORIAL REPORTADO</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VÓMITO</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="SI" {...register('vomito')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="NO" {...register('vomito')} className="mr-2" />
                No
              </label>
            </div>
            <input type="text" {...register('vomito_color')} placeholder="Color" className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2" />
            <input type="text" {...register('vomito_aspecto')} placeholder="Aspecto" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DIARREA</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="SI" {...register('diarrea')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="NO" {...register('diarrea')} className="mr-2" />
                No
              </label>
            </div>
            <input type="text" {...register('diarrea_color')} placeholder="Color" className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2" />
            <input type="text" {...register('diarrea_aspecto')} placeholder="Aspecto" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ORINA</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="SI" {...register('orina')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="NO" {...register('orina')} className="mr-2" />
                No
              </label>
            </div>
            <input type="text" {...register('orina_color')} placeholder="Color" className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2" />
            <input type="text" {...register('orina_olor')} placeholder="Olor" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SECRECIÓN NASAL</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="SI" {...register('secrecion_nasal')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="NO" {...register('secrecion_nasal')} className="mr-2" />
                No
              </label>
            </div>
            <input type="text" {...register('secrecion_nasal_color')} placeholder="Color" className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2" />
            <input type="text" {...register('secrecion_nasal_aspecto')} placeholder="Aspecto" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SECRECIÓN OCULAR</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="SI" {...register('secrecion_ocular')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="NO" {...register('secrecion_ocular')} className="mr-2" />
                No
              </label>
            </div>
            <input type="text" {...register('secrecion_ocular_color')} placeholder="Color" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DIENTES</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <label className="flex items-center">
                <input type="checkbox" value="limpios" {...register('dientes')} className="mr-1" />
                Limpios
              </label>
              <label className="flex items-center">
                <input type="checkbox" value="placas" {...register('dientes')} className="mr-1" />
                Placas
              </label>
              <label className="flex items-center">
                <input type="checkbox" value="gingivitis" {...register('dientes')} className="mr-1" />
                Gingivitis
              </label>
              <label className="flex items-center">
                <input type="checkbox" value="periodontitis" {...register('dientes')} className="mr-1" />
                Periodontitis
              </label>
            </div>
            <input type="text" {...register('dientes_otros')} placeholder="Otros" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PIEL</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="checkbox" value="dermatitis" {...register('piel_condicion')} className="mr-1" />
              Dermatitis
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="pulgas" {...register('piel_condicion')} className="mr-1" />
              Pulgas
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="tumores" {...register('piel_condicion')} className="mr-1" />
              Tumores
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="abscesos" {...register('piel_condicion')} className="mr-1" />
              Abscesos
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ÚLTIMA COMIDA</label>
            <input type="text" {...register('ultima_comida')} className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2" />
            <input type="text" {...register('ultima_comida_fecha')} placeholder="Fecha" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LÍQUIDOS</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input type="radio" value="SI" {...register('liquidos')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="NO" {...register('liquidos')} className="mr-2" />
                No
              </label>
            </div>
            <input type="text" {...register('liquidos_cantidad')} placeholder="Cantidad" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ACTIVIDAD GENERAL</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="radio" value="ACTIVO" {...register('actividad_general')} className="mr-2" />
              Activo
            </label>
            <label className="flex items-center">
              <input type="radio" value="PASIVO" {...register('actividad_general')} className="mr-2" />
              Pasivo
            </label>
            <label className="flex items-center">
              <input type="radio" value="DECAIDO" {...register('actividad_general')} className="mr-2" />
              Decaído
            </label>
            <label className="flex items-center">
              <input type="radio" value="ALETARGADO" {...register('actividad_general')} className="mr-2" />
              Aletargado
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">MEDICAMENTOS ADMINISTRADOS</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center">
              <input type="radio" value="SI" {...register('medicamentos')} className="mr-2" />
              Sí
            </label>
            <label className="flex items-center">
              <input type="radio" value="NO" {...register('medicamentos')} className="mr-2" />
              No
            </label>
          </div>
          <input type="text" {...register('medicamentos_cual')} placeholder="¿Cuál?" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
      </div>

      {/* EXAMEN FÍSICO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">EXAMEN FÍSICO</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TEMPERATURA</label>
            <input type="text" {...register('temperatura')} placeholder="°C" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PUPILAS</label>
            <input type="text" {...register('pupilas')} placeholder="Normal" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GANGLIOS</label>
            <div className="flex gap-2 mb-1">
              <label className="flex items-center text-sm">
                <input type="radio" value="normal" {...register('ganglios')} className="mr-1" />
                Normal
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="inflamados" {...register('ganglios')} className="mr-1" />
                Inflamados
              </label>
            </div>
            <input type="text" {...register('ganglios_region')} placeholder="Región" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RETORNO VENOSO</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(num => (
                <label key={num} className="flex items-center">
                  <input type="radio" value={num} {...register('retorno_venoso')} className="mr-1" />
                  {num}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HIDRATACIÓN</label>
            <div className="flex gap-2">
              <label className="flex items-center text-sm">
                <input type="radio" value="buena" {...register('hidratacion')} className="mr-1" />
                Buena
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="media" {...register('hidratacion')} className="mr-1" />
                Media
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="mala" {...register('hidratacion')} className="mr-1" />
                Mala
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MUCOSAS</label>
            <select {...register('mucosas')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Seleccionar...</option>
              <option value="ROSADA">Rosada</option>
              <option value="PALIDA">Pálida</option>
              <option value="AMARILLA">Amarilla</option>
              <option value="AZUL">Azul</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">FRECUENCIA CARDÍACA</label>
            <input type="text" {...register('frecuencia_cardiaca')} placeholder="lpm" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">FRECUENCIA RESPIRATORIA</label>
            <input type="text" {...register('frecuencia_respiratoria')} placeholder="rpm" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">TOS</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input type="radio" value="NO" {...register('tos')} className="mr-2" />
              No
            </label>
            <label className="flex items-center">
              <input type="radio" value="SECA" {...register('tos')} className="mr-2" />
              Sí - Seca
            </label>
            <label className="flex items-center">
              <input type="radio" value="PRODUCTIVA" {...register('tos')} className="mr-2" />
              Sí - Productiva
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">MOTILIDAD INTESTINAL</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input type="radio" value="NORMAL" {...register('motilidad_intestinal')} className="mr-2" />
              Normal
            </label>
            <label className="flex items-center">
              <input type="radio" value="AUSENTE" {...register('motilidad_intestinal')} className="mr-2" />
              Ausente
            </label>
            <label className="flex items-center">
              <input type="radio" value="AUMENTADA" {...register('motilidad_intestinal')} className="mr-2" />
              Aumentada
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">EXAMEN DE SENSIBILIDAD CUTÁNEA (test pinchazo)</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="checkbox" value="gira_cabeza" {...register('sensibilidad_cutanea')} className="mr-1" />
              Gira la cabeza
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="vocalizacion" {...register('sensibilidad_cutanea')} className="mr-1" />
              Vocalización
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="aparta_extremidad" {...register('sensibilidad_cutanea')} className="mr-1" />
              Aparta extremidad
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="hipersensibilidad" {...register('sensibilidad_cutanea')} className="mr-1" />
              Hipersensibilidad
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="hiposensibilidad" {...register('sensibilidad_cutanea')} className="mr-1" />
              Hiposensibilidad
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">EXAMEN DE SENSIBILIDAD PROFUNDA (propiocepción)</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input type="radio" value="positiva" {...register('sensibilidad_profunda')} className="mr-2" />
              Positiva
            </label>
            <label className="flex items-center">
              <input type="radio" value="tardia" {...register('sensibilidad_profunda')} className="mr-2" />
              Tardía
            </label>
            <label className="flex items-center">
              <input type="radio" value="sin_respuesta" {...register('sensibilidad_profunda')} className="mr-2" />
              Sin respuesta
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Guardar Consulta
        </button>
      </div>
    </form>
  );
};

export default DogForm;
