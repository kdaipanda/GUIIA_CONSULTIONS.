import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Importar formularios específicos por especie
import DogForm from './species/DogForm';
import CatForm from './species/CatForm';
import TurtleForm from './species/TurtleForm';
import HedgehogForm from './species/HedgehogForm';
import FerretForm from './species/FerretForm';
import IguanaForm from './species/IguanaForm';
import HamsterForm from './species/HamsterForm';
import PoultryForm from './species/PoultryForm';
import BirdForm from './species/BirdForm';
import RabbitForm from './species/RabbitForm';

const AnimalConsultForm = ({ veterinarianId, onSuccess }) => {
  const [species, setSpecies] = useState('');
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const backendURL = process.env.REACT_APP_BACKEND_URL || '';

  // Lista por defecto de especies
  const defaultSpecies = [
    { id: 'perro', name: 'Perro' },
    { id: 'gato', name: 'Gato' },
    { id: 'tortuga', name: 'Tortuga' },
    { id: 'erizo', name: 'Erizo Africano' },
    { id: 'huron', name: 'Hurón' },
    { id: 'iguana', name: 'Iguana' },
    { id: 'hamster', name: 'Hámster' },
    { id: 'patos_pollos', name: 'Patos y Pollos' },
    { id: 'aves', name: 'Aves (Psitácidos/Ornamentales)' },
    { id: 'conejo', name: 'Conejo' }
  ];

  useEffect(() => {
    loadSpecies();
  }, []);

  const loadSpecies = async () => {
    try {
      const response = await axios.get(`${backendURL}/api/species`);
      setSpeciesList(response.data || defaultSpecies);
    } catch (err) {
      console.warn('No se pudo cargar la lista de especies desde el API, usando lista por defecto');
      setSpeciesList(defaultSpecies);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (consultationData) => {
    setError('');
    setSuccess('');
    
    try {
      const payload = {
        veterinarian_id: veterinarianId,
        species: species,
        consultation_data: consultationData
      };

      const response = await axios.post(`${backendURL}/api/animal-consults`, payload);
      
      setSuccess('¡Consulta guardada exitosamente!');
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Limpiar formulario después de 2 segundos
      setTimeout(() => {
        setSpecies('');
        setSuccess('');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar la consulta');
      console.error('Error:', err);
    }
  };

  const renderSpeciesForm = () => {
    const formProps = {
      veterinarianId,
      onSubmit: handleSubmit,
      onCancel: () => setSpecies('')
    };

    switch (species) {
      case 'perro':
        return <DogForm {...formProps} />;
      case 'gato':
        return <CatForm {...formProps} />;
      case 'tortuga':
        return <TurtleForm {...formProps} />;
      case 'erizo':
        return <HedgehogForm {...formProps} />;
      case 'huron':
        return <FerretForm {...formProps} />;
      case 'iguana':
        return <IguanaForm {...formProps} />;
      case 'hamster':
        return <HamsterForm {...formProps} />;
      case 'patos_pollos':
        return <PoultryForm {...formProps} />;
      case 'aves':
        return <BirdForm {...formProps} />;
      case 'conejo':
        return <RabbitForm {...formProps} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Consulta Veterinaria por Especie
        </h2>

        {/* Mensajes de éxito/error */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Selector de especie */}
        {!species && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Selecciona la especie del paciente:
            </label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Selecciona una especie --</option>
              {speciesList.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Renderizar formulario específico */}
        {species && renderSpeciesForm()}
      </div>
    </div>
  );
};

export default AnimalConsultForm;
