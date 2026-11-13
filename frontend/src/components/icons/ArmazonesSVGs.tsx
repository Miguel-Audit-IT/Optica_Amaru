import React from 'react';

interface FrameSVGProps {
  className?: string;
  size?: number;
}

/**
 * 1. EPP Titanio Pro: Silueta deportiva/envolvente con protecciones laterales y puente reforzado.
 */
export const TitanioProIcon: React.FC<FrameSVGProps> = ({ className = '', size = 56 }) => (
  <svg
    width={size * 2}
    height={size}
    viewBox="0 0 160 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    {/* Protecciones laterales aerodinámicas EPP */}
    <path
      d="M10 24C10 24 16 18 28 20L25 50C16 48 10 38 10 24Z"
      fill="currentColor"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M150 24C150 24 144 18 132 20L135 50C144 48 150 38 150 24Z"
      fill="currentColor"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />

    {/* Marco izquierdo envolvente */}
    <path
      d="M26 22H70C74 22 76 26 75 30L71 52C69 57 64 60 58 60H34C28 60 24 55 24 49L25 24C25 23 25.5 22 26 22Z"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Cristal izquierdo con tinte reflectivo UV */}
    <path
      d="M30 26H66C68 26 70 28 69 31L66 49C65 53 61 56 56 56H37C32 56 29 52 29 47L30 26Z"
      fill="currentColor"
      fillOpacity="0.12"
    />
    {/* Brillo aerodinámico */}
    <line x1="38" y1="30" x2="48" y2="52" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />

    {/* Puente industrial reforzado con perno */}
    <path
      d="M71 28C76 25 84 25 89 28"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <path
      d="M74 36H86"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle cx="80" cy="32" r="2" fill="currentColor" />

    {/* Marco derecho envolvente */}
    <path
      d="M134 22H90C86 22 84 26 85 30L89 52C91 57 96 60 102 60H126C132 60 136 55 136 49L135 24C135 23 134.5 22 134 22Z"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Cristal derecho */}
    <path
      d="M130 26H94C92 26 90 28 91 31L94 49C95 53 99 56 104 56H123C128 56 131 52 131 47L130 26Z"
      fill="currentColor"
      fillOpacity="0.12"
    />
    {/* Brillo aerodinámico derecho */}
    <line x1="102" y1="30" x2="112" y2="52" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />

    {/* Patillas industriales */}
    <path d="M12 25L2 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M148 25L158 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/**
 * 2. Acetato Vintage Lumière: Silueta clásica estilo Wayfarer/Clubmaster de marco grueso con biseles y brillo diagonal en el cristal.
 */
export const AcetatoLumiereIcon: React.FC<FrameSVGProps> = ({ className = '', size = 56 }) => (
  <svg
    width={size * 2}
    height={size}
    viewBox="0 0 160 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    {/* Bisagra italiana remaches laterales */}
    <ellipse cx="20" cy="23" rx="2" ry="1.5" fill="currentColor" />
    <ellipse cx="140" cy="23" rx="2" ry="1.5" fill="currentColor" />

    {/* Marco izquierdo grueso tipo acetato premium */}
    <path
      d="M18 20L72 23C75 23.5 76 27 74 31L70 54C68 60 62 64 54 64H36C26 64 20 57 20 48L18 20Z"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinejoin="round"
    />
    {/* Lente interior izquierdo */}
    <path
      d="M26 26L66 28C67 28 68 30 67 32L63 51C62 55 58 58 52 58H38C30 58 26 53 26 46L26 26Z"
      fill="currentColor"
      fillOpacity="0.15"
    />
    {/* Brillos diagonales Blue-Block en cristal */}
    <line x1="34" y1="28" x2="48" y2="56" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.5" strokeLinecap="round" />
    <line x1="42" y1="28" x2="54" y2="52" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" strokeLinecap="round" />

    {/* Puente curvo clásico de acetato tipo cerradura (Keyhole Bridge) */}
    <path
      d="M71 27C75 24 85 24 89 27C86 33 86 37 88 41C84 41 82 39 80 39C78 39 76 41 72 41C74 37 74 33 71 27Z"
      fill="currentColor"
    />

    {/* Marco derecho grueso tipo acetato */}
    <path
      d="M142 20L88 23C85 23.5 84 27 86 31L90 54C92 60 98 64 106 64H124C134 64 140 57 140 48L142 20Z"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinejoin="round"
    />
    {/* Lente interior derecho */}
    <path
      d="M134 26L94 28C93 28 92 30 93 32L97 51C98 55 102 58 108 58H122C130 58 134 53 134 46L134 26Z"
      fill="currentColor"
      fillOpacity="0.15"
    />
    {/* Brillos diagonales derechos */}
    <line x1="104" y1="28" x2="118" y2="56" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.5" strokeLinecap="round" />
    <line x1="112" y1="28" x2="124" y2="52" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" strokeLinecap="round" />
  </svg>
);

/**
 * 3. Ultralight Flex-Steel: Silueta minimalista geométrica de doble puente metálico fino y montura delgada al aire.
 */
export const UltralightFlexIcon: React.FC<FrameSVGProps> = ({ className = '', size = 56 }) => (
  <svg
    width={size * 2}
    height={size}
    viewBox="0 0 160 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    {/* Aro metálico ultrafino izquierdo redondeado geométrico */}
    <rect
      x="22"
      y="22"
      width="48"
      height="40"
      rx="20"
      stroke="currentColor"
      strokeWidth="2"
    />
    {/* Cristal izquierdo liviano */}
    <rect
      x="24"
      y="24"
      width="44"
      height="36"
      rx="18"
      fill="currentColor"
      fillOpacity="0.08"
    />
    {/* Reflejo lineal sutil */}
    <path d="M34 28L58 56" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" strokeLinecap="round" />

    {/* Doble puente aeroespacial superior e inferior ultra estilizado */}
    <line x1="70" y1="26" x2="90" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M70 34C75 32 85 32 90 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

    {/* Plaquetas de silicona médica ergonómicas */}
    <ellipse cx="69" cy="40" rx="1.5" ry="3" fill="currentColor" fillOpacity="0.6" />
    <ellipse cx="91" cy="40" rx="1.5" ry="3" fill="currentColor" fillOpacity="0.6" />

    {/* Aro metálico ultrafino derecho */}
    <rect
      x="90"
      y="22"
      width="48"
      height="40"
      rx="20"
      stroke="currentColor"
      strokeWidth="2"
    />
    {/* Cristal derecho */}
    <rect
      x="92"
      y="24"
      width="44"
      height="36"
      rx="18"
      fill="currentColor"
      fillOpacity="0.08"
    />
    {/* Reflejo lineal derecho */}
    <path d="M102 28L126 56" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" strokeLinecap="round" />

    {/* Patillas de titanio flexibles ultrafinas */}
    <line x1="22" y1="30" x2="6" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="138" y1="30" x2="154" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

