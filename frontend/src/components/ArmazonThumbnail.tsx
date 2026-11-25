import React, { useState, useEffect } from 'react';
import {
  TitanioProIcon,
  AcetatoLumiereIcon,
  UltralightFlexIcon,
} from './icons/ArmazonesSVGs';
import type { CategoriaArmazon } from '../services/inventarioService';

interface ArmazonThumbnailProps {
  imagenUrl?: string;
  nombre: string;
  categoria?: CategoriaArmazon;
  size?: number;
  className?: string;
}

export const ArmazonThumbnail: React.FC<ArmazonThumbnailProps> = ({
  imagenUrl,
  nombre,
  categoria,
  size = 40,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [imagenUrl]);

  if (imagenUrl && !imgError) {
    return (
      <img
        src={imagenUrl}
        alt={nombre}
        onError={() => setImgError(true)}
        className={`object-contain rounded-xl max-h-28 w-full bg-white p-1 mx-auto shadow-2xs ${className}`}
      />
    );
  }

  const n = nombre.toLowerCase();
  if (categoria === 'Boutique & Urbano' || n.includes('lumière') || n.includes('acetato') || n.includes('vintage')) {
    return <AcetatoLumiereIcon size={size} className={`text-amaru-copper ${className}`} />;
  }
  if (categoria === 'Ultralivianos & Titanio' || n.includes('flex') || n.includes('steel') || n.includes('aero')) {
    return <UltralightFlexIcon size={size} className={`text-amaru-copper ${className}`} />;
  }
  return <TitanioProIcon size={size} className={`text-amaru-copper ${className}`} />;
};

export default ArmazonThumbnail;
