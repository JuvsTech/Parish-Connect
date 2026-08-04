import phil from 'phil-reg-prov-mun-brgy'

export const EMPTY_PLACE = {
  regionCode: '',
  regionName: '',
  provinceCode: '',
  provinceName: '',
  cityCode: '',
  cityName: '',
  barangayCode: '',
  barangayName: '',
}

function getApi() {
  return phil?.default && typeof phil.default === 'object' ? phil.default : phil
}

export function getRegions() {
  const list = Array.isArray(getApi().regions) ? getApi().regions : []
  return [...list].sort((a, b) => a.name.localeCompare(b.name))
}

export function getProvincesByRegion(regionCode) {
  if (!regionCode) return []
  const list = getApi().getProvincesByRegion?.(regionCode) ?? []
  return [...list].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * All Philippine provinces (PSGC), sorted by name.
 * @returns {Array<{ prov_code: string, name: string, reg_code?: string }>}
 */
export function getAllProvinces() {
  const list = Array.isArray(getApi().provinces) ? getApi().provinces : []
  return [...list].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || '')),
  )
}

export function getCitiesByProvince(provinceCode) {
  if (!provinceCode) return []
  const list = getApi().getCityMunByProvince?.(provinceCode) ?? []
  return [...list].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * All cities/municipalities for searchable Place of Birth dropdowns.
 * @returns {Array<{ code: string, name: string, provinceName: string }>}
 */
export function getAllCities() {
  const api = getApi()
  const cities = Array.isArray(api.city_mun) ? api.city_mun : []
  const provinces = Array.isArray(api.provinces) ? api.provinces : []
  const provinceByCode = new Map(
    provinces.map((item) => [item.prov_code, item.name]),
  )

  return cities
    .map((city) => ({
      code: String(city.mun_code || ''),
      name: String(city.name || '').trim(),
      provinceName: String(provinceByCode.get(city.prov_code) || '').trim(),
    }))
    .filter((city) => city.code && city.name)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function getBarangaysByCity(cityCode) {
  if (!cityCode) return []
  const list = getApi().getBarangayByMun?.(cityCode) ?? []
  return [...list].sort((a, b) => a.name.localeCompare(b.name))
}

export function formatPlace(place) {
  if (!place || typeof place !== 'object') return ''
  const parts = [
    place.barangayName,
    place.cityName,
    place.provinceName,
    place.regionName,
  ]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
  return parts.join(', ')
}

export function isPlaceComplete(place) {
  return Boolean(
    place?.regionCode &&
      place?.provinceCode &&
      place?.cityCode &&
      (place?.barangayCode || place?.barangayName),
  )
}

/**
 * Residence completeness without Region (Province → City → Barangay).
 */
export function isResidencePlaceComplete(place) {
  return Boolean(
    place?.provinceCode &&
      place?.cityCode &&
      (place?.barangayCode || place?.barangayName),
  )
}

export function normalizePlace(value) {
  if (!value || typeof value !== 'object') return { ...EMPTY_PLACE }
  return {
    regionCode: String(value.regionCode || ''),
    regionName: String(value.regionName || ''),
    provinceCode: String(value.provinceCode || ''),
    provinceName: String(value.provinceName || ''),
    cityCode: String(value.cityCode || ''),
    cityName: String(value.cityName || ''),
    barangayCode: String(value.barangayCode || value.brgy_code || ''),
    barangayName: String(value.barangayName || ''),
  }
}

export function parsePlace(value) {
  if (!value) return { ...EMPTY_PLACE }
  if (typeof value === 'object') {
    const normalized = normalizePlace(value)
    if (isPlaceComplete(normalized)) return normalized
  }

  const text = String(value).trim()
  if (!text) return { ...EMPTY_PLACE }

  const parts = text.split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length < 3) return { ...EMPTY_PLACE }

  const api = getApi()
  const barangays = Array.isArray(api.barangays) ? api.barangays : []
  const cities = Array.isArray(api.city_mun) ? api.city_mun : []
  const provinces = Array.isArray(api.provinces) ? api.provinces : []
  const regions = Array.isArray(api.regions) ? api.regions : []

  const barangayName = parts[0].toUpperCase()
  const cityName = parts[1].toUpperCase()
  const provinceName = parts[2]?.toUpperCase() || ''

  const barangay = barangays.find(
    (item) => String(item.name || '').toUpperCase() === barangayName,
  )
  const city =
    cities.find((item) => {
      if (String(item.name || '').toUpperCase() !== cityName) return false
      if (barangay && item.mun_code !== barangay.mun_code) return false
      return true
    }) || cities.find((item) => String(item.name || '').toUpperCase() === cityName)

  if (!city) return { ...EMPTY_PLACE }

  const province = provinces.find((item) => item.prov_code === city.prov_code)
  if (!province) return { ...EMPTY_PLACE }
  if (
    provinceName &&
    String(province.name || '').toUpperCase() !== provinceName &&
    parts.length >= 3
  ) {
    // Prefer matching province when provided.
  }

  const region = regions.find((item) => item.reg_code === province.reg_code)
  if (!region) return { ...EMPTY_PLACE }

  const matchedBarangay =
    barangay ||
    barangays.find(
      (item) =>
        item.mun_code === city.mun_code &&
        String(item.name || '').toUpperCase() === barangayName,
    )

  return {
    regionCode: region.reg_code,
    regionName: region.name,
    provinceCode: province.prov_code,
    provinceName: province.name,
    cityCode: city.mun_code,
    cityName: city.name,
    barangayCode: matchedBarangay?.brgy_code || matchedBarangay?.name || '',
    barangayName: matchedBarangay?.name || parts[0],
  }
}

/**
 * Resolves stored residence name fields back into a cascading place object.
 *
 * @param {{ province?: string, municipality?: string, barangay?: string, residencePlace?: object }} input
 * @returns {typeof EMPTY_PLACE}
 */
export function resolveResidencePlace(input = {}) {
  if (input.residencePlace && typeof input.residencePlace === 'object') {
    const fromObject = normalizePlace(input.residencePlace)
    if (isResidencePlaceComplete(fromObject)) return fromObject
  }

  const provinceName = String(input.province || '').trim()
  const cityName = String(input.municipality || '').trim()
  const barangayName = String(input.barangay || '').trim()
  if (!provinceName || !cityName || !barangayName) return { ...EMPTY_PLACE }

  const api = getApi()
  const provinces = Array.isArray(api.provinces) ? api.provinces : []
  const cities = Array.isArray(api.city_mun) ? api.city_mun : []
  const barangays = Array.isArray(api.barangays) ? api.barangays : []
  const regions = Array.isArray(api.regions) ? api.regions : []

  const province = provinces.find(
    (item) =>
      String(item.name || '').toUpperCase() === provinceName.toUpperCase(),
  )
  if (!province) return { ...EMPTY_PLACE }

  const city = cities.find(
    (item) =>
      item.prov_code === province.prov_code &&
      String(item.name || '').toUpperCase() === cityName.toUpperCase(),
  )
  if (!city) return { ...EMPTY_PLACE }

  const barangay = barangays.find(
    (item) =>
      item.mun_code === city.mun_code &&
      String(item.name || '').toUpperCase() === barangayName.toUpperCase(),
  )
  if (!barangay) return { ...EMPTY_PLACE }

  const region = regions.find((item) => item.reg_code === province.reg_code)

  return {
    regionCode: region?.reg_code || '',
    regionName: region?.name || '',
    provinceCode: province.prov_code,
    provinceName: province.name,
    cityCode: city.mun_code,
    cityName: city.name,
    barangayCode: barangay.brgy_code || barangay.name || '',
    barangayName: barangay.name || barangayName,
  }
}
