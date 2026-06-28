// Sydney Eastern Suburbs lat/lng lookup (approximate centroids)
const SUBURB_COORDS = {
  'bondi junction': { lat: -33.8914, lng: 151.2512 },
  'bondi': { lat: -33.8915, lng: 151.2767 },
  'bondi beach': { lat: -33.8915, lng: 151.2767 },
  'randwick': { lat: -33.9145, lng: 151.2410 },
  'maroubra': { lat: -33.9496, lng: 151.2432 },
  'coogee': { lat: -33.9226, lng: 151.2571 },
  'paddington': { lat: -33.8843, lng: 151.2266 },
  'surry hills': { lat: -33.8852, lng: 151.2099 },
  'darlinghurst': { lat: -33.8769, lng: 151.2197 },
  'woollahra': { lat: -33.8862, lng: 151.2430 },
  'double bay': { lat: -33.8779, lng: 151.2451 },
  'rose bay': { lat: -33.8710, lng: 151.2660 },
  'vaucluse': { lat: -33.8571, lng: 151.2803 },
  'edgecliff': { lat: -33.8784, lng: 151.2359 },
  'kingsford': { lat: -33.9227, lng: 151.2275 },
  'kensington': { lat: -33.9060, lng: 151.2234 },
  'zetland': { lat: -33.9053, lng: 151.2100 },
  'waterloo': { lat: -33.9011, lng: 151.2056 },
  'alexandria': { lat: -33.9065, lng: 151.1978 },
  'moore park': { lat: -33.8967, lng: 151.2179 },
  'centennial park': { lat: -33.9007, lng: 151.2320 },
  'bronte': { lat: -33.9043, lng: 151.2672 },
  'tamarama': { lat: -33.8988, lng: 151.2694 },
  'waverley': { lat: -33.9022, lng: 151.2531 },
};

function getSuburbCoords(suburb) {
  return SUBURB_COORDS[suburb.toLowerCase().trim()] || null;
}

module.exports = { getSuburbCoords, SUBURB_COORDS };
