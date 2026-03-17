/**
 * Region definitions with bounding boxes for auto-detection.
 * Each region has a center, rough bounding box, and its town/neighborhood list.
 */

export const REGIONS = {
  mv: {
    key: 'mv',
    label: "Martha's Vineyard",
    shortLabel: 'MV',
    center: { lat: 41.43, lng: -70.56 },
    bounds: { minLat: 41.30, maxLat: 41.50, minLng: -70.80, maxLng: -70.44 },
    towns: [
      { value: null, label: 'All Island', shortLines: ['All', 'Island'] },
      { value: 'Oak Bluffs', label: 'Oak Bluffs', shortLines: ['Oak', 'Bluffs'] },
      { value: 'Edgartown', label: 'Edgartown', shortLines: ['Edgar-', 'town'] },
      { value: 'Vineyard Haven', label: 'Vineyard Haven', shortLines: ['Vine-', 'yard'] },
      { value: 'West Tisbury', label: 'West Tisbury', shortLines: ['West', 'Tisb.'] },
      { value: 'Chilmark', label: 'Chilmark', shortLines: ['Chil-', 'mark'] },
      { value: 'Aquinnah', label: 'Aquinnah', shortLines: ['Aquin-', 'nah'] },
    ],
  },
  nantucket: {
    key: 'nantucket',
    label: 'Nantucket',
    shortLabel: 'ACK',
    center: { lat: 41.28, lng: -70.10 },
    bounds: { minLat: 41.22, maxLat: 41.34, minLng: -70.25, maxLng: -69.93 },
    towns: [
      { value: null, label: 'All Nantucket', shortLines: ['All', 'Nantucket'] },
      { value: 'Nantucket', label: 'Nantucket', shortLines: ['Nan-', 'tucket'] },
      { value: 'Siasconset', label: 'Sconset', shortLines: ['Scon-', 'set'] },
      { value: 'Madaket', label: 'Madaket', shortLines: ['Mada-', 'ket'] },
      { value: 'Wauwinet', label: 'Wauwinet', shortLines: ['Wau-', 'winet'] },
    ],
  },
  cape: {
    key: 'cape',
    label: 'Cape Cod',
    shortLabel: 'Cape',
    center: { lat: 41.67, lng: -70.30 },
    bounds: { minLat: 41.50, maxLat: 42.10, minLng: -70.70, maxLng: -69.90 },
    towns: [
      { value: null, label: 'All Cape', shortLines: ['All', 'Cape'] },
      { value: 'Falmouth', label: 'Falmouth', shortLines: ['Fal-', 'mouth'] },
      { value: 'Woods Hole', label: 'Woods Hole', shortLines: ['Woods', 'Hole'] },
      { value: 'Hyannis', label: 'Hyannis', shortLines: ['Hyan-', 'nis'] },
      { value: 'Mashpee', label: 'Mashpee', shortLines: ['Mash-', 'pee'] },
      { value: 'Sandwich', label: 'Sandwich', shortLines: ['Sand-', 'wich'] },
      { value: 'Barnstable', label: 'Barnstable', shortLines: ['Barn-', 'stable'] },
      { value: 'Provincetown', label: 'P-town', shortLines: ['P-', 'town'] },
      { value: 'Chatham', label: 'Chatham', shortLines: ['Chat-', 'ham'] },
    ],
  },
  boston: {
    key: 'boston',
    label: 'Boston',
    shortLabel: 'Boston',
    center: { lat: 42.36, lng: -71.06 },
    bounds: { minLat: 42.22, maxLat: 42.50, minLng: -71.20, maxLng: -70.90 },
    towns: [
      { value: null, label: 'All Boston', shortLines: ['All', 'Boston'] },
      { value: 'Back Bay', label: 'Back Bay', shortLines: ['Back', 'Bay'] },
      { value: 'South End', label: 'South End', shortLines: ['South', 'End'] },
      { value: 'North End', label: 'North End', shortLines: ['North', 'End'] },
      { value: 'Seaport', label: 'Seaport', shortLines: ['Sea-', 'port'] },
      { value: 'Cambridge', label: 'Cambridge', shortLines: ['Cam-', 'bridge'] },
      { value: 'Somerville', label: 'Somerville', shortLines: ['Somer-', 'ville'] },
      { value: 'Brookline', label: 'Brookline', shortLines: ['Brook-', 'line'] },
      { value: 'Jamaica Plain', label: 'JP', shortLines: ['Jam.', 'Plain'] },
    ],
  },
}

/**
 * Detect which region a lat/lng falls in.
 * Returns the region key or null if not in any known region.
 */
export function detectRegion(lat, lng) {
  var keys = Object.keys(REGIONS)
  for (var i = 0; i < keys.length; i++) {
    var region = REGIONS[keys[i]]
    var b = region.bounds
    if (lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng) {
      return region.key
    }
  }
  return null
}

/**
 * Get towns list for a region. Returns a generic "Nearby" option if region is unknown.
 */
export function getTownsForRegion(regionKey) {
  if (regionKey && REGIONS[regionKey]) {
    return REGIONS[regionKey].towns
  }
  return [{ value: null, label: 'Nearby', shortLines: ['Near-', 'by'] }]
}

/**
 * Legacy exports for backward compatibility
 */
export const MV_TOWNS = REGIONS.mv.towns
export const NANTUCKET_TOWNS = REGIONS.nantucket.towns
export const CAPE_COD_TOWNS = REGIONS.cape.towns
export const BOSTON_TOWNS = REGIONS.boston.towns

export const ALL_TOWNS = [
  { value: null, label: 'All Areas', shortLines: ['All', 'Areas'] },
  ...MV_TOWNS.slice(1),
  ...NANTUCKET_TOWNS.slice(1),
  ...CAPE_COD_TOWNS.slice(1),
  ...BOSTON_TOWNS.slice(1),
]
