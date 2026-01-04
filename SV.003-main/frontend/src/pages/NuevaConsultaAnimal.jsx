import React from 'react';
import AnimalConsultForm from '../components/AnimalConsultForm';

const NuevaConsultaAnimal = () => {
  // Obtener el ID del veterinario desde el localStorage o contexto
  const veterinarianId = localStorage.getItem('veterinarianId') || 'demo-vet-id';

  const handleSuccess = (response) => {
    console.log('Consulta guardada:', response);
    // Aquí puedes redirigir o mostrar mensaje de éxito
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <AnimalConsultForm 
        veterinarianId={veterinarianId}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default NuevaConsultaAnimal;
