/**
 * Coordenadas geográficas de los países usados por el mapa de ciberataques.
 *
 * Fuente única de verdad: `COUNTRY_BY_ISO` (código ISO-3166-1 alpha-2).
 * A partir de ahí se derivan el resto de exportaciones, de modo que el
 * nombre, las coordenadas y el código ISO nunca pueden desincronizarse.
 *
 * CONVENCIÓN DE COORDENADAS: `[latitud, longitud]` en grados decimales.
 * Es la misma firma que usa `latLngToVector3(lat, lng, radius)`.
 */

export interface CountryInfo {
  /** Nombre en inglés. Es la clave de `COUNTRY_COORDS`. */
  name: string
  /** Latitud en grados decimales (-90..90). */
  lat: number
  /** Longitud en grados decimales (-180..180). */
  lng: number
}

/**
 * Centro geográfico aproximado de cada país. No es un punto exacto de la
 * ciudad del atacante: representa el país del ASN que reporta la actividad.
 */
export const COUNTRY_BY_ISO: Record<string, CountryInfo> = {
  // --- América del Norte ---
  US: { name: 'United States', lat: 37.0902, lng: -95.7129 },
  CA: { name: 'Canada', lat: 56.1304, lng: -106.3468 },
  MX: { name: 'Mexico', lat: 23.6345, lng: -102.5528 },
  GT: { name: 'Guatemala', lat: 15.7835, lng: -90.2308 },
  CR: { name: 'Costa Rica', lat: 9.7489, lng: -83.7534 },
  PA: { name: 'Panama', lat: 8.538, lng: -80.7821 },
  CU: { name: 'Cuba', lat: 21.5218, lng: -77.7812 },
  DO: { name: 'Dominican Republic', lat: 18.7357, lng: -70.1627 },
  HN: { name: 'Honduras', lat: 15.1999, lng: -86.2419 },
  SV: { name: 'El Salvador', lat: 13.7942, lng: -88.8965 },
  NI: { name: 'Nicaragua', lat: 12.8654, lng: -85.2072 },
  PR: { name: 'Puerto Rico', lat: 18.2208, lng: -66.5901 },
  JM: { name: 'Jamaica', lat: 18.1096, lng: -77.2975 },
  TT: { name: 'Trinidad and Tobago', lat: 10.6918, lng: -61.2225 },
  BS: { name: 'Bahamas', lat: 25.0343, lng: -77.3963 },

  // --- América del Sur ---
  BR: { name: 'Brazil', lat: -14.235, lng: -51.9253 },
  AR: { name: 'Argentina', lat: -38.4161, lng: -63.6167 },
  CL: { name: 'Chile', lat: -35.6751, lng: -71.543 },
  CO: { name: 'Colombia', lat: 4.5709, lng: -74.2973 },
  PE: { name: 'Peru', lat: -9.19, lng: -75.0152 },
  VE: { name: 'Venezuela', lat: 6.4238, lng: -66.5897 },
  EC: { name: 'Ecuador', lat: -1.8312, lng: -78.1834 },
  UY: { name: 'Uruguay', lat: -32.5228, lng: -55.7658 },
  PY: { name: 'Paraguay', lat: -23.4425, lng: -58.4438 },
  BO: { name: 'Bolivia', lat: -16.2902, lng: -63.5887 },
  GY: { name: 'Guyana', lat: 4.8604, lng: -58.9302 },
  SR: { name: 'Suriname', lat: 3.9193, lng: -56.0278 },

  // --- Europa Occidental ---
  GB: { name: 'United Kingdom', lat: 55.3781, lng: -3.436 },
  DE: { name: 'Germany', lat: 51.1657, lng: 10.4515 },
  FR: { name: 'France', lat: 46.2276, lng: 2.2137 },
  ES: { name: 'Spain', lat: 40.4637, lng: -3.7492 },
  IT: { name: 'Italy', lat: 41.8719, lng: 12.5674 },
  NL: { name: 'Netherlands', lat: 52.1326, lng: 5.2913 },
  BE: { name: 'Belgium', lat: 50.5039, lng: 4.4699 },
  CH: { name: 'Switzerland', lat: 46.8182, lng: 8.2275 },
  AT: { name: 'Austria', lat: 47.5162, lng: 14.5501 },
  PT: { name: 'Portugal', lat: 39.3999, lng: -8.2245 },
  IE: { name: 'Ireland', lat: 53.4129, lng: -8.2439 },
  LU: { name: 'Luxembourg', lat: 49.8153, lng: 6.1296 },
  IS: { name: 'Iceland', lat: 64.9631, lng: -19.0208 },
  MT: { name: 'Malta', lat: 35.9375, lng: 14.3754 },
  CY: { name: 'Cyprus', lat: 35.1264, lng: 33.4299 },

  // --- Europa Nórdica y del Este ---
  SE: { name: 'Sweden', lat: 60.1282, lng: 18.6435 },
  NO: { name: 'Norway', lat: 60.472, lng: 8.4689 },
  DK: { name: 'Denmark', lat: 56.2639, lng: 9.5018 },
  FI: { name: 'Finland', lat: 61.9241, lng: 25.7482 },
  PL: { name: 'Poland', lat: 51.9194, lng: 19.1451 },
  CZ: { name: 'Czechia', lat: 49.8175, lng: 15.473 },
  SK: { name: 'Slovakia', lat: 48.669, lng: 19.699 },
  HU: { name: 'Hungary', lat: 47.1625, lng: 19.5033 },
  RO: { name: 'Romania', lat: 45.9432, lng: 24.9668 },
  BG: { name: 'Bulgaria', lat: 42.7339, lng: 25.4858 },
  GR: { name: 'Greece', lat: 39.0742, lng: 21.8243 },
  SI: { name: 'Slovenia', lat: 46.1512, lng: 14.9955 },
  HR: { name: 'Croatia', lat: 45.1, lng: 15.2 },
  RS: { name: 'Serbia', lat: 44.0165, lng: 21.0059 },
  LT: { name: 'Lithuania', lat: 55.1694, lng: 23.8813 },
  LV: { name: 'Latvia', lat: 56.8796, lng: 24.6032 },
  EE: { name: 'Estonia', lat: 58.5953, lng: 25.0136 },
  RU: { name: 'Russia', lat: 61.5241, lng: 105.3188 },
  UA: { name: 'Ukraine', lat: 48.3794, lng: 31.1656 },
  BY: { name: 'Belarus', lat: 53.7098, lng: 27.9534 },
  MD: { name: 'Moldova', lat: 47.4116, lng: 28.3699 },
  GE: { name: 'Georgia', lat: 42.3154, lng: 43.3569 },
  AM: { name: 'Armenia', lat: 40.0691, lng: 45.0382 },
  AZ: { name: 'Azerbaijan', lat: 40.1431, lng: 47.5769 },
  KZ: { name: 'Kazakhstan', lat: 48.0196, lng: 66.9237 },
  UZ: { name: 'Uzbekistan', lat: 41.3775, lng: 64.5853 },
  KG: { name: 'Kyrgyzstan', lat: 41.2044, lng: 74.7661 },
  TJ: { name: 'Tajikistan', lat: 38.861, lng: 71.2761 },
  TM: { name: 'Turkmenistan', lat: 38.9697, lng: 59.5563 },
  MN: { name: 'Mongolia', lat: 46.8625, lng: 103.8467 },

  // --- Asia Oriental ---
  CN: { name: 'China', lat: 35.8617, lng: 104.1954 },
  JP: { name: 'Japan', lat: 36.2048, lng: 138.2529 },
  KR: { name: 'South Korea', lat: 35.9078, lng: 127.7669 },
  KP: { name: 'North Korea', lat: 40.3399, lng: 127.5101 },
  TW: { name: 'Taiwan', lat: 23.6978, lng: 120.9605 },
  HK: { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  MO: { name: 'Macao', lat: 22.1987, lng: 113.5439 },

  // --- Sur y Sudeste Asiático ---
  IN: { name: 'India', lat: 20.5937, lng: 78.9629 },
  SG: { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  MY: { name: 'Malaysia', lat: 4.2105, lng: 101.9758 },
  ID: { name: 'Indonesia', lat: -0.7893, lng: 113.9213 },
  TH: { name: 'Thailand', lat: 15.87, lng: 100.9925 },
  VN: { name: 'Vietnam', lat: 14.0583, lng: 108.2772 },
  PH: { name: 'Philippines', lat: 12.8797, lng: 121.774 },
  BD: { name: 'Bangladesh', lat: 23.685, lng: 90.3563 },
  LK: { name: 'Sri Lanka', lat: 7.8731, lng: 80.7718 },
  NP: { name: 'Nepal', lat: 28.3949, lng: 84.124 },
  PK: { name: 'Pakistan', lat: 30.3753, lng: 69.3451 },
  KH: { name: 'Cambodia', lat: 12.5657, lng: 104.991 },
  LA: { name: 'Laos', lat: 19.8563, lng: 102.4956 },
  MM: { name: 'Myanmar', lat: 21.9162, lng: 95.956 },
  BN: { name: 'Brunei', lat: 4.5353, lng: 114.7277 },

  // --- Oriente Medio ---
  IL: { name: 'Israel', lat: 31.0461, lng: 34.8516 },
  IR: { name: 'Iran', lat: 32.4279, lng: 53.688 },
  SA: { name: 'Saudi Arabia', lat: 23.8859, lng: 45.0792 },
  AE: { name: 'United Arab Emirates', lat: 23.4241, lng: 53.8478 },
  TR: { name: 'Turkey', lat: 38.9637, lng: 35.2433 },
  IQ: { name: 'Iraq', lat: 33.2232, lng: 43.6793 },
  JO: { name: 'Jordan', lat: 30.5852, lng: 36.2384 },
  LB: { name: 'Lebanon', lat: 33.8547, lng: 35.8623 },
  SY: { name: 'Syria', lat: 34.8021, lng: 38.9968 },
  YE: { name: 'Yemen', lat: 15.5527, lng: 48.5164 },
  QA: { name: 'Qatar', lat: 25.3548, lng: 51.1839 },
  KW: { name: 'Kuwait', lat: 29.3117, lng: 47.4818 },
  OM: { name: 'Oman', lat: 21.4735, lng: 55.9754 },
  PS: { name: 'Palestine', lat: 31.9522, lng: 35.2332 },

  // --- África ---
  ZA: { name: 'South Africa', lat: -30.5595, lng: 22.9375 },
  EG: { name: 'Egypt', lat: 26.8206, lng: 30.8025 },
  NG: { name: 'Nigeria', lat: 9.082, lng: 8.6753 },
  KE: { name: 'Kenya', lat: -0.0236, lng: 37.9062 },
  MA: { name: 'Morocco', lat: 31.7917, lng: -7.0926 },
  SC: { name: 'Seychelles', lat: -4.6796, lng: 55.492 },
  GH: { name: 'Ghana', lat: 7.9465, lng: -1.0232 },
  TN: { name: 'Tunisia', lat: 33.8869, lng: 9.5375 },
  DZ: { name: 'Algeria', lat: 28.0339, lng: 1.6596 },
  AO: { name: 'Angola', lat: -11.2027, lng: 17.8739 },
  MZ: { name: 'Mozambique', lat: -18.6657, lng: 35.5296 },
  TZ: { name: 'Tanzania', lat: -6.369, lng: 34.8888 },
  UG: { name: 'Uganda', lat: 1.3733, lng: 32.2903 },
  ZM: { name: 'Zambia', lat: -13.1339, lng: 27.8493 },
  ZW: { name: 'Zimbabwe', lat: -19.0154, lng: 29.1549 },
  ET: { name: 'Ethiopia', lat: 9.145, lng: 40.4897 },
  SD: { name: 'Sudan', lat: 12.8628, lng: 30.2176 },
  SN: { name: 'Senegal', lat: 14.4974, lng: -14.4524 },
  CI: { name: "Cote d'Ivoire", lat: 7.54, lng: -5.5471 },
  CM: { name: 'Cameroon', lat: 7.3697, lng: 12.3547 },
  MG: { name: 'Madagascar', lat: -18.7669, lng: 46.8691 },
  MU: { name: 'Mauritius', lat: -20.3484, lng: 57.5522 },
  BW: { name: 'Botswana', lat: -22.3285, lng: 24.6849 },
  NA: { name: 'Namibia', lat: -22.9576, lng: 18.4904 },
  SL: { name: 'Sierra Leone', lat: 8.4606, lng: -11.7799 },
  LR: { name: 'Liberia', lat: 6.4281, lng: -9.4295 },
  SO: { name: 'Somalia', lat: 5.1521, lng: 46.1996 },
  HT: { name: 'Haiti', lat: 18.9712, lng: -72.2852 },

  // --- Oceanía ---
  AU: { name: 'Australia', lat: -25.2744, lng: 133.7751 },
  NZ: { name: 'New Zealand', lat: -40.9006, lng: 174.886 },
  PG: { name: 'Papua New Guinea', lat: -6.315, lng: 143.9556 },
  FJ: { name: 'Fiji', lat: -17.7134, lng: 178.065 },
  GU: { name: 'Guam', lat: 13.4443, lng: 144.7937 },
}

/** Código ISO-3166-1 alpha-2 → nombre de país. */
export const ISO_BY_COUNTRY_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_BY_ISO).map(([iso, info]) => [info.name, iso]),
)

/**
 * Coordenadas de cada país indexadas por su nombre en inglés.
 * Formato: `[latitud, longitud]` en grados decimales.
 */
export const COUNTRY_COORDS: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(COUNTRY_BY_ISO).map(([, info]) => [info.name, [info.lat, info.lng]]),
)

/** Nombres de todos los países con coordenadas conocidas, en orden alfabético. */
export const COUNTRY_NAMES: string[] = Object.keys(COUNTRY_COORDS).sort()

/**
 * Hub protegido: destino fijo de los arcos del mapa de ciberataques.
 *
 * Vaca Muerta (Neuquén, Argentina). Son las mismas coordenadas que usa el
 * sistema de diseño Strata Protocol de este repositorio, de modo que la
 * infraestructura que se "protege" en la visualización es la real.
 *
 * NO forma parte de `COUNTRY_COORDS` a propósito: esa tabla se usa para elegir
 * países de origen al azar y el hub no es un país atacante.
 */
export const PROTECTED_HUB = {
  name: 'Vaca Muerta',
  region: 'Argentina',
  lat: -38.9516,
  lng: -68.0591,
} as const

/**
 * Resuelve un código ISO-3166-1 alpha-2 al nombre de país con coordenadas.
 * Devuelve `undefined` si el país no está en la tabla.
 */
export function countryNameFromIso(iso: string | undefined | null): string | undefined {
  if (!iso) return undefined
  return COUNTRY_BY_ISO[iso.trim().toUpperCase()]?.name
}

/** Coordenadas `[latitud, longitud]` de un país por nombre. */
export function coordsForCountry(name: string): [number, number] | undefined {
  return COUNTRY_COORDS[name]
}

/**
 * Convierte coordenadas geográficas (latitud, longitud) a coordenadas 3D cartesianas.
 * @param lat Latitud en grados decimales (-90 a 90)
 * @param lng Longitud en grados decimales (-180 a 180)
 * @param radius Radio de la esfera
 * @returns Array [x, y, z] en coordenadas cartesianas 3D
 */
export function latLngToVector3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)

  return [x, y, z]
}
