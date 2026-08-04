import { useMemo } from 'react'
import {
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material'
import {
  EMPTY_PLACE,
  getBarangaysByCity,
  getCitiesByProvince,
  getProvincesByRegion,
  getRegions,
  normalizePlace,
} from '../utils/philippinePlaces'

/**
 * Cascading Region → Province → City/Municipality → Barangay picker.
 */
export default function PlaceSelect({
  value,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  error = false,
  helperText = ' ',
  idPrefix = 'place',
}) {
  const place = normalizePlace(value)
  const regions = useMemo(() => getRegions(), [])
  const provinces = useMemo(
    () => getProvincesByRegion(place.regionCode),
    [place.regionCode],
  )
  const cities = useMemo(
    () => getCitiesByProvince(place.provinceCode),
    [place.provinceCode],
  )
  const barangays = useMemo(
    () => getBarangaysByCity(place.cityCode),
    [place.cityCode],
  )

  function emit(next) {
    onChange?.(normalizePlace(next))
  }

  function barangayValue(item) {
    return String(item.name || '')
  }

  return (
    <>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl fullWidth required={required} error={error} disabled={disabled}>
          <InputLabel id={`${idPrefix}-region-label`}>Region</InputLabel>
          <Select
            labelId={`${idPrefix}-region-label`}
            label="Region"
            value={place.regionCode}
            onChange={(event) => {
              const region = regions.find((item) => item.reg_code === event.target.value)
              emit({
                ...EMPTY_PLACE,
                regionCode: event.target.value,
                regionName: region?.name || '',
              })
            }}
            onBlur={onBlur}
          >
            {regions.map((region) => (
              <MenuItem key={region.reg_code} value={region.reg_code}>
                {region.name}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{error ? helperText : ' '}</FormHelperText>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl
          fullWidth
          required={required}
          error={error}
          disabled={disabled || !place.regionCode}
        >
          <InputLabel id={`${idPrefix}-province-label`}>Province</InputLabel>
          <Select
            labelId={`${idPrefix}-province-label`}
            label="Province"
            value={place.provinceCode}
            onChange={(event) => {
              const province = provinces.find(
                (item) => item.prov_code === event.target.value,
              )
              emit({
                ...place,
                provinceCode: event.target.value,
                provinceName: province?.name || '',
                cityCode: '',
                cityName: '',
                barangayCode: '',
                barangayName: '',
              })
            }}
            onBlur={onBlur}
          >
            {provinces.map((province) => (
              <MenuItem key={province.prov_code} value={province.prov_code}>
                {province.name}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText> </FormHelperText>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl
          fullWidth
          required={required}
          error={error}
          disabled={disabled || !place.provinceCode}
        >
          <InputLabel id={`${idPrefix}-city-label`}>City / Municipality</InputLabel>
          <Select
            labelId={`${idPrefix}-city-label`}
            label="City / Municipality"
            value={place.cityCode}
            onChange={(event) => {
              const city = cities.find((item) => item.mun_code === event.target.value)
              emit({
                ...place,
                cityCode: event.target.value,
                cityName: city?.name || '',
                barangayCode: '',
                barangayName: '',
              })
            }}
            onBlur={onBlur}
          >
            {cities.map((city) => (
              <MenuItem key={city.mun_code} value={city.mun_code}>
                {city.name}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText> </FormHelperText>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl
          fullWidth
          required={required}
          error={error}
          disabled={disabled || !place.cityCode}
        >
          <InputLabel id={`${idPrefix}-barangay-label`}>Barangay</InputLabel>
          <Select
            labelId={`${idPrefix}-barangay-label`}
            label="Barangay"
            value={place.barangayCode}
            onChange={(event) => {
              const barangay = barangays.find(
                (item) => barangayValue(item) === event.target.value,
              )
              emit({
                ...place,
                barangayCode: event.target.value,
                barangayName: barangay?.name || '',
              })
            }}
            onBlur={onBlur}
          >
            {barangays.map((barangay) => (
              <MenuItem key={barangayValue(barangay)} value={barangayValue(barangay)}>
                {barangay.name}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText> </FormHelperText>
        </FormControl>
      </Grid>
    </>
  )
}
