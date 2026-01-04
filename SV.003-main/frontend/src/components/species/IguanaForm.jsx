import React from 'react';
import { useForm } from 'react-hook-form';

const IguanaForm = ({ onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="bg-lime-50 p-4 rounded-lg mb-6">
        <h3 className="text-xl font-bold text-lime-900">Formulario de Consulta - IGUANA</h3>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lime-500"
            />
            {errors.nombre_paciente && <span className="text-red-500 text-xs">Este campo es requerido</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especie exacta</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center text-sm">
                <input type="radio" value="iguana_iguana" {...register('especie_exacta')} className="mr-2" />
                Iguana verde (Iguana iguana)
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="ctenosaura" {...register('especie_exacta')} className="mr-2" />
                Iguana riñonada (Ctenosaura similis)
              </label>
            </div>
            <input type="text" {...register('otra_especie')} placeholder="Otra especie" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edad estimada (años)</label>
            <input type="text" {...register('edad')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso actual (g/kg)</label>
            <input type="text" {...register('peso')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño del cuerpo</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" {...register('largo_total')} placeholder="Largo total (cm)" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              <input type="text" {...register('largo_snout_vent')} placeholder="Largo snout-vent (cm)" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Condición corporal</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="radio" value="emaciado" {...register('condicion_corporal')} className="mr-2" />
              Emaciado
            </label>
            <label className="flex items-center">
              <input type="radio" value="delgado" {...register('condicion_corporal')} className="mr-2" />
              Delgado
            </label>
            <label className="flex items-center">
              <input type="radio" value="ideal" {...register('condicion_corporal')} className="mr-2" />
              Ideal
            </label>
            <label className="flex items-center">
              <input type="radio" value="sobrepeso" {...register('condicion_corporal')} className="mr-2" />
              Sobrepeso
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="checkbox" value="silvestre" {...register('origen')} className="mr-1" />
              Silvestre
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="criadero" {...register('origen')} className="mr-1" />
              Criadero
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="comercial" {...register('origen')} className="mr-1" />
              Comercial
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="regalo" {...register('origen')} className="mr-1" />
              Regalo
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

      {/* SISTEMA RESPIRATORIO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">SISTEMA RESPIRATORIO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Secreción nasal/oral</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center">
              <input type="checkbox" value="clara" {...register('secrecion_tipo')} className="mr-1" />
              Clara
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="mucosa" {...register('secrecion_tipo')} className="mr-1" />
              Mucosa
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="purulenta" {...register('secrecion_tipo')} className="mr-1" />
              Purulenta
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="sangre" {...register('secrecion_tipo')} className="mr-1" />
              Sangre
            </label>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input type="radio" value="unilateral" {...register('secrecion_loc')} className="mr-2" />
              Unilateral
            </label>
            <label className="flex items-center">
              <input type="radio" value="bilateral" {...register('secrecion_loc')} className="mr-2" />
              Bilateral
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Burbujas en boca/nariz?</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="si" {...register('burbujas')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="no" {...register('burbujas')} className="mr-2" />
                No
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia respiratoria (rpm)</label>
            <input type="text" {...register('frecuencia_respiratoria')} placeholder="Normal: 4-10" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad respiratoria</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="checkbox" value="boca_abierta" {...register('dificultad_respiratoria')} className="mr-1" />
              Boca abierta
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="mov_cuello" {...register('dificultad_respiratoria')} className="mr-1" />
              Movimiento del cuello exagerado
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="aleteo" {...register('dificultad_respiratoria')} className="mr-1" />
              Aleteo rápido
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura ambiente (°C)</label>
            <input type="text" {...register('temp_ambiente')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Humedad (%)</label>
            <input type="text" {...register('humedad')} placeholder="Ideal: 70-80%" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>
      </div>

      {/* SISTEMA TEGUMENTARIO */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">SISTEMA TEGUMENTARIO</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Piel</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="checkbox" value="descamacion" {...register('piel_estado')} className="mr-1" />
              Descamación excesiva
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="costras" {...register('piel_estado')} className="mr-1" />
              Costras
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="ulceras" {...register('piel_estado')} className="mr-1" />
              Úlceras
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="hinchazon" {...register('piel_estado')} className="mr-1" />
              Hinchazón
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Edema en párpados?</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="si" {...register('edema_parpados')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="no" {...register('edema_parpados')} className="mr-2" />
                No
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coloración anormal</label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center text-sm">
                <input type="checkbox" value="amarillenta" {...register('coloracion')} className="mr-1" />
                Amarillenta
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" value="oscura" {...register('coloracion')} className="mr-1" />
                Oscura
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" value="palida" {...register('coloracion')} className="mr-1" />
                Pálida
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ojos</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="checkbox" value="cerrados" {...register('ojos_estado')} className="mr-1" />
              Cerrados
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="hinchados" {...register('ojos_estado')} className="mr-1" />
              Hinchados
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="secrecion" {...register('ojos_estado')} className="mr-1" />
              Secreción
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="opacidad" {...register('ojos_estado')} className="mr-1" />
              Opacidad corneal
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Uñas</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center">
              <input type="checkbox" value="crecimiento_excesivo" {...register('unas_estado')} className="mr-1" />
              Crecimiento excesivo
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="grietas" {...register('unas_estado')} className="mr-1" />
              Grietas
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="deformidades" {...register('unas_estado')} className="mr-1" />
              Deformidades
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="sangrado" {...register('unas_estado')} className="mr-1" />
              Sangrado
            </label>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">¿Dificultad para caminar?</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="si" {...register('dificultad_caminar')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="no" {...register('dificultad_caminar')} className="mr-2" />
                No
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
                Anorexia total (&gt;48h)
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="anorexia_parcial" {...register('apetito')} className="mr-2" />
                Anorexia parcial
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" value="normal" {...register('apetito')} className="mr-2" />
                Normal
              </label>
            </div>
            <input type="text" {...register('tiempo_sin_comer')} placeholder="Tiempo sin comer (horas/días)" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dieta</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <label className="flex items-center text-sm">
                <input type="checkbox" value="come_vegetales" {...register('dieta')} className="mr-1" />
                Come vegetales
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" value="come_fruta" {...register('dieta')} className="mr-1" />
                Come fruta
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" value="calcio" {...register('dieta')} className="mr-1" />
                Calcio suplementado
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heces</label>
          <div className="flex flex-wrap gap-3 mb-2">
            <label className="flex items-center">
              <input type="checkbox" value="ausentes" {...register('heces_estado')} className="mr-1" />
              Ausentes (&gt;72h)
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="blandas" {...register('heces_estado')} className="mr-1" />
              Blandas
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="liquidas" {...register('heces_estado')} className="mr-1" />
              Líquidas
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="sangre" {...register('heces_estado')} className="mr-1" />
              Con sangre
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="parasitos" {...register('heces_estado')} className="mr-1" />
              Con parásitos
            </label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <input type="text" {...register('heces_frecuencia')} placeholder="Frecuencia (veces/semana)" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            <select {...register('heces_color')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Color...</option>
              <option value="verde_oscuro">Verde oscuro</option>
              <option value="amarillo">Amarillo</option>
              <option value="rojizo">Rojizo (sangre)</option>
              <option value="blanco">Blanco (moho)</option>
            </select>
            <select {...register('heces_consistencia')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Consistencia...</option>
              <option value="formadas">Formadas</option>
              <option value="pastosas">Pastosas</option>
              <option value="liquidas">Líquidas</option>
              <option value="con_moco">Con moco</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Palpación de cuerpo extraño?</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="si" {...register('cuerpo_extrano')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="no" {...register('cuerpo_extrano')} className="mr-2" />
                No
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Deshidratación?</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="si" {...register('deshidratacion')} className="mr-2" />
                Sí
              </label>
              <label className="flex items-center">
                <input type="radio" value="no" {...register('deshidratacion')} className="mr-2" />
                No
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* AMBIENTE */}
      <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">AMBIENTE</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño del recinto (cm x cm x cm)</label>
          <input type="text" {...register('tamano_recinto')} placeholder="Mínimo: 1.8x tamaño iguana" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura</label>
            <input type="text" {...register('temp_zona_fria')} placeholder="Zona fría (°C)" className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2" />
            <input type="text" {...register('temp_zona_caliente')} placeholder="Zona caliente (°C)" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Humedad (%)</label>
            <input type="text" {...register('humedad_ambiente')} placeholder="Ideal: 70-80%" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Iluminación UVB</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center">
              <input type="radio" value="si" {...register('iluminacion_uvb')} className="mr-2" />
              Sí
            </label>
            <label className="flex items-center">
              <input type="radio" value="no" {...register('iluminacion_uvb')} className="mr-2" />
              No
            </label>
          </div>
          <input type="text" {...register('distancia_lampara')} placeholder="Distancia de la lámpara (cm)" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Superficie del sustrato</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input type="checkbox" value="tierra" {...register('sustrato')} className="mr-1" />
              Tierra
            </label>
            <label className="flex items-center">
              <input type="checkbox" value="alfombra" {...register('sustrato')} className="mr-1" />
              Alfombra
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">¿Bañera para hidratación?</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input type="radio" value="si" {...register('banera_hidratacion')} className="mr-2" />
              Sí
            </label>
            <label className="flex items-center">
              <input type="radio" value="no" {...register('banera_hidratacion')} className="mr-2" />
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lime-500"
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
          className="px-6 py-2 bg-lime-600 text-white rounded-md hover:bg-lime-700"
        >
          Guardar Consulta
        </button>
      </div>
    </form>
  );
};

export default IguanaForm;