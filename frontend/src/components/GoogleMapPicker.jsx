import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api'

const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 }
const LIBRARIES = ['places']

export default function GoogleMapPicker({
  label = 'Location',
  address = '',
  onAddressChange,
  value,
  onChange,
  height = 280,
  required = false,
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const [map, setMap] = useState(null)
  const [locating, setLocating] = useState(false)
  const [searching, setSearching] = useState(false)
  const [geoError, setGeoError] = useState('')
  const inputRef = useRef(null)
  const autocompleteInstanceRef = useRef(null)

  const center = useMemo(() => {
    if (value && Number.isFinite(value.lat) && Number.isFinite(value.lng)) {
      return value
    }
    return DEFAULT_CENTER
  }, [value])

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    libraries: LIBRARIES,
  })

  const reverseGeocode = useCallback(
    (lat, lng) => {
      if (!window.google?.maps?.Geocoder) return
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]?.formatted_address) {
          onAddressChange?.(results[0].formatted_address)
        }
      })
    },
    [onAddressChange],
  )

  function updatePoint(next, shouldReverseGeocode = true) {
    if (!next) return
    onChange?.({ lat: next.lat, lng: next.lng })
    if (shouldReverseGeocode) {
      reverseGeocode(next.lat, next.lng)
    }
  }

  function handleMapClick(event) {
    const lat = event.latLng?.lat()
    const lng = event.latLng?.lng()
    if (typeof lat !== 'number' || typeof lng !== 'number') return
    setGeoError('')
    updatePoint({ lat, lng }, true)
  }

  // Geocode search by query text (called on Enter or clicking Search button)
  const handleGeocodeSearch = useCallback(
    (queryText) => {
      const query = (queryText !== undefined ? queryText : address)?.trim()
      if (!query) return
      if (!window.google?.maps?.Geocoder) {
        setGeoError('Google Maps Geocoder is not loaded yet.')
        return
      }

      setSearching(true)
      setGeoError('')

      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ address: query }, (results, status) => {
        setSearching(false)
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location
          const lat = loc.lat()
          const lng = loc.lng()
          const next = { lat, lng }
          onChange?.(next)
          if (results[0].formatted_address) {
            onAddressChange?.(results[0].formatted_address)
          }
          map?.panTo(next)
          map?.setZoom(16)
        } else {
          setGeoError(
            `Could not find coordinates for "${query}". Try adding city name or click on the map.`,
          )
        }
      })
    },
    [address, map, onChange, onAddressChange],
  )

  // Attach Google Places Autocomplete directly to the input element
  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google?.maps?.places?.Autocomplete) {
      return undefined
    }

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          fields: ['geometry', 'formatted_address', 'name'],
        },
      )

      autocompleteInstanceRef.current = autocomplete

      const listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place?.geometry?.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          const next = { lat, lng }
          onChange?.(next)
          const formatted = place.formatted_address || place.name || ''
          if (formatted) {
            onAddressChange?.(formatted)
          }
          map?.panTo(next)
          map?.setZoom(16)
          setGeoError('')
        } else if (inputRef.current?.value) {
          handleGeocodeSearch(inputRef.current.value)
        }
      })

      return () => {
        if (window.google?.maps?.event && listener) {
          window.google.maps.event.removeListener(listener)
        }
      }
    } catch {
      return undefined
    }
  }, [isLoaded, map, onChange, onAddressChange, handleGeocodeSearch])

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false)
        const next = {
          lat: coords.latitude,
          lng: coords.longitude,
        }
        updatePoint(next, true)
        map?.panTo(next)
        map?.setZoom(16)
      },
      (err) => {
        setLocating(false)
        if (err.code === 1) {
          setGeoError('Location permission denied. Please allow location access in your browser.')
        } else {
          setGeoError('Could not retrieve current location. Please click on the map.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    )
  }

  function handleClearLocation() {
    onChange?.(null)
    onAddressChange?.('')
    setGeoError('')
  }

  if (!apiKey) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-on-surface-variant">
        <p className="font-semibold text-warning">Google Maps key missing</p>
        <p className="mt-1">Add `VITE_GOOGLE_MAPS_API_KEY` to enable live Google Maps location picking.</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error">
        Google Maps failed to load. Please check your internet connection and API key restrictions.
      </div>
    )
  }

  const hasValidPoint = Boolean(
    value &&
      Number.isFinite(value.lat) &&
      Number.isFinite(value.lng) &&
      (Math.abs(value.lat) > 1e-6 || Math.abs(value.lng) > 1e-6),
  )

  return (
    <div className="space-y-3">
      {/* HEADER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-on-surface">{label}</p>
          {required ? <span className="text-xs font-semibold text-error">*</span> : null}
          {hasValidPoint ? (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              ✓ Pinned ({value.lat.toFixed(3)}, {value.lng.toFixed(3)})
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">
              Click map or search area
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasValidPoint ? (
            <button
              type="button"
              onClick={handleClearLocation}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-on-surface-variant transition hover:bg-surface-container hover:text-error"
            >
              Clear pin
            </button>
          ) : null}
          <button
            type="button"
            disabled={locating}
            onClick={useCurrentLocation}
            className="flex items-center gap-1.5 rounded-xl border border-outline-variant/40 bg-white px-3 py-1.5 text-xs font-semibold text-on-surface shadow-sm transition hover:bg-surface-container disabled:opacity-50"
          >
            {locating ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Locating…</span>
              </>
            ) : (
              <>
                <span>📍</span>
                <span>Use my location</span>
              </>
            )}
          </button>
        </div>
      </div>

      {geoError ? (
        <div className="rounded-xl border border-error/20 bg-error/10 p-3 text-xs text-error">
          {geoError}
        </div>
      ) : null}

      {/* SEARCH INPUT BAR */}
      <div className="relative flex items-center rounded-xl border border-outline-variant/50 bg-white shadow-sm ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-primary/20">
        <span className="pl-3 text-sm text-on-surface-variant">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={address}
          onChange={(event) => onAddressChange?.(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleGeocodeSearch(e.target.value)
            }
          }}
          placeholder="Search address, area, city (e.g. Kahuta, DHA Phase 5)…"
          className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-on-surface-variant/50"
          autoComplete="off"
        />

        {address ? (
          <button
            type="button"
            onClick={() => onAddressChange?.('')}
            className="px-2 text-xs text-on-surface-variant hover:text-on-surface"
            title="Clear input"
          >
            ✕
          </button>
        ) : null}

        <button
          type="button"
          disabled={searching || !address?.trim()}
          onClick={() => handleGeocodeSearch(address)}
          className="mr-1.5 flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-40"
        >
          {searching ? 'Finding…' : 'Search & Pin'}
        </button>
      </div>

      {/* MAP CANVAS */}
      <div className="relative overflow-hidden rounded-2xl border border-outline-variant/30 shadow-inner">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height }}
            center={center}
            zoom={hasValidPoint ? 16 : 12}
            onLoad={setMap}
            onUnmount={() => setMap(null)}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              zoomControl: true,
            }}
          >
            {hasValidPoint ? (
              <MarkerF
                position={value}
                draggable
                onDragEnd={handleMapClick}
                animation={window.google?.maps?.Animation?.DROP}
              />
            ) : null}
          </GoogleMap>
        ) : (
          <div
            className="grid place-items-center bg-surface-container text-sm text-on-surface-variant"
            style={{ height }}
          >
            Loading Google Maps...
          </div>
        )}

        {!hasValidPoint && isLoaded ? (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow-md">
            Click anywhere on the map or type above to pin
          </div>
        ) : null}
      </div>

      {hasValidPoint ? (
        <div className="flex items-center justify-between text-xs text-on-surface-variant">
          <span>
            Coordinates: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </span>
          <span className="font-semibold text-emerald-600">● Pin position active</span>
        </div>
      ) : null}
    </div>
  )
}
