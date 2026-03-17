/**
 * Martha's Vineyard towns for filtering
 * Used by TownPicker component and LocationContext
 */
export const MV_TOWNS = [
  { value: null, label: 'All Island', shortLines: ['All', 'Island'] },
  { value: 'Oak Bluffs', label: 'Oak Bluffs', shortLines: ['Oak', 'Bluffs'] },
  { value: 'Edgartown', label: 'Edgartown', shortLines: ['Edgar-', 'town'] },
  { value: 'Vineyard Haven', label: 'Vineyard Haven', shortLines: ['Vine-', 'yard'] },
  { value: 'West Tisbury', label: 'West Tisbury', shortLines: ['West', 'Tisb.'] },
  { value: 'Chilmark', label: 'Chilmark', shortLines: ['Chil-', 'mark'] },
  { value: 'Aquinnah', label: 'Aquinnah', shortLines: ['Aquin-', 'nah'] },
]

/**
 * Nantucket towns for filtering
 */
export const NANTUCKET_TOWNS = [
  { value: null, label: 'All Nantucket', shortLines: ['All', 'Nantucket'] },
  { value: 'Nantucket', label: 'Nantucket', shortLines: ['Nan-', 'tucket'] },
  { value: 'Siasconset', label: 'Sconset', shortLines: ['Scon-', 'set'] },
  { value: 'Madaket', label: 'Madaket', shortLines: ['Mada-', 'ket'] },
  { value: 'Wauwinet', label: 'Wauwinet', shortLines: ['Wau-', 'winet'] },
]

/**
 * Cape Cod towns (ferry-adjacent — natural expansion from the islands)
 */
export const CAPE_COD_TOWNS = [
  { value: null, label: 'All Cape', shortLines: ['All', 'Cape'] },
  { value: 'Falmouth', label: 'Falmouth', shortLines: ['Fal-', 'mouth'] },
  { value: 'Woods Hole', label: 'Woods Hole', shortLines: ['Woods', 'Hole'] },
  { value: 'Hyannis', label: 'Hyannis', shortLines: ['Hyan-', 'nis'] },
  { value: 'Mashpee', label: 'Mashpee', shortLines: ['Mash-', 'pee'] },
  { value: 'Sandwich', label: 'Sandwich', shortLines: ['Sand-', 'wich'] },
  { value: 'Barnstable', label: 'Barnstable', shortLines: ['Barn-', 'stable'] },
  { value: 'Provincetown', label: 'P-town', shortLines: ['P-', 'town'] },
  { value: 'Chatham', label: 'Chatham', shortLines: ['Chat-', 'ham'] },
]

/**
 * Boston neighborhoods
 */
export const BOSTON_TOWNS = [
  { value: null, label: 'All Boston', shortLines: ['All', 'Boston'] },
  { value: 'Back Bay', label: 'Back Bay', shortLines: ['Back', 'Bay'] },
  { value: 'South End', label: 'South End', shortLines: ['South', 'End'] },
  { value: 'North End', label: 'North End', shortLines: ['North', 'End'] },
  { value: 'Seaport', label: 'Seaport', shortLines: ['Sea-', 'port'] },
  { value: 'Cambridge', label: 'Cambridge', shortLines: ['Cam-', 'bridge'] },
  { value: 'Somerville', label: 'Somerville', shortLines: ['Somer-', 'ville'] },
  { value: 'Brookline', label: 'Brookline', shortLines: ['Brook-', 'line'] },
  { value: 'Jamaica Plain', label: 'JP', shortLines: ['Jam.', 'Plain'] },
]

/**
 * All towns across all regions
 */
export const ALL_TOWNS = [
  { value: null, label: 'All Areas', shortLines: ['All', 'Areas'] },
  ...MV_TOWNS.slice(1),
  ...NANTUCKET_TOWNS.slice(1),
  ...CAPE_COD_TOWNS.slice(1),
  ...BOSTON_TOWNS.slice(1),
]
