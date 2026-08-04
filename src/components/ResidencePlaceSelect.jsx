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
  getAllProvinces,
  getBarangaysByCity,
  getCitiesByProvince,
  normalizePlace,
} from '../utils/philippinePlaces'

/**
 * Cascading Province → Municipality/City → Barangay picker (PSGC dataset).
 * Used by Death Residence (no Region step).
 */
export default function ResidencePlaceSelect({
  value,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  error = false,
  helperText = ' ',
  idPrefix = 'residence-place',
}) {
  const place = normalizePlace(value)
  const provinces = useMemo(() => getAllProvinces(), [])
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
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <FormControl
          fullWidth
          required={required}
          error={error}
          disabled={disabled}
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
                ...EMPTY_PLACE,
                regionCode: province?.reg_code || '',
                regionName: '',
                provinceCode: event.target.value,
                provinceName: province?.name || '',
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
          <FormHelperText>{error ? helperText : ' '}</FormHelperText>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <FormControl
          fullWidth
          required={required}
          error={error}
          disabled={disabled || !place.provinceCode}
        >
          <InputLabel id={`${idPrefix}-city-label`}>
            Municipality / City
          </InputLabel>
          <Select
            labelId={`${idPrefix}-city-label`}
            label="Municipality / City"
            value={place.cityCode}
            onChange={(event) => {
              const city = cities.find(
                (item) => item.mun_code === event.target.value,
              )
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

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            value={place.barangayCode || place.barangayName}
            onChange={(event) => {
              const barangay = barangays.find(
                (item) => barangayValue(item) === event.target.value,
              )
              emit({
                ...place,
                barangayCode: event.target.value,
                barangayName: barangay?.name || event.target.value,
              })
            }}
            onBlur={onBlur}
          >
            {barangays.map((barangay) => (
              <MenuItem
                key={barangayValue(barangay)}
                value={barangayValue(barangay)}
              >
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
