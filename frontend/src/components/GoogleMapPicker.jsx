import { useMemo, useRef, useState } from 'react'
import { Autocomplete, GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api'

const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 }
const LIBRARIES = ['places']

export default function GoogleMapPicker({
  label = 'Location',
  address,
  onAddressChange,
  value,
  onChange,
  height = 280,
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const [map, setMap] = useState(null)
  const autocompleteRef = useRef(null)

  const center = useMemo(() => {
    if (value && Number.isFinite(value.lat) && Number.isFinite(value.lng)) {
      return value
    }
    return DEFAULT_CENTER
  }, [value])

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'biterush-google-maps',
    googleMapsApiKey: apiKey || '',
    libraries: LIBRARIES,
  })

  function updatePoint(next) {
    if (!next) return
    onChange?.({ lat: next.lat, lng: next.lng })
  }

  function handleMapClick(event) {
    const lat = event.latLng?.lat()
    const lng = event.latLng?.lng()
    if (typeof lat !== 'number' || typeof lng !== 'number') return
    updatePoint({ lat, lng })
  }

  function handlePlaceChanged() {
    const place = autocompleteRef.current?.getPlace()
    const lat = place?.geometry?.location?.lat?.()
    const lng = place?.geometry?.location?.lng?.()
    if (place?.formatted_address) {
      onAddressChange?.(place.formatted_address)
    }
    if (typeof lat === 'number' && typeof lng === 'number') {
      const next = { lat, lng }
      updatePoint(next)
      map?.panTo(next)
      map?.setZoom(16)
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = {
          lat: coords.latitude,
          lng: coords.longitude,
        }
        updatePoint(next)
        map?.panTo(next)
        map?.setZoom(16)
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    )
  }

  if (!apiKey) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-on-surface-variant">
        Add `VITE_GOOGLE_MAPS_API_KEY` to enable live Google Maps location picking.
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error">
        Google Maps failed to load.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <button
          type="button"
          onClick={useCurrentLocation}
          className="rounded-xl border border-outline-variant/40 px-3 py-2 text-xs font-semibold"
        >
          Use current location
        </button>
      </div>

      <div className="rounded-xl border border-outline-variant/40 bg-white p-3">
        {isLoaded ? (
          <Autocomplete
            onLoad={(instance) => {
              autocompleteRef.current = instance
            }}
            onPlaceChanged={handlePlaceChanged}
          >
            <input
              value={address}
              onChange={(event) => onAddressChange?.(event.target.value)}
              placeholder="Search address or pin the map"
              className="w-full rounded-xl border border-outline-variant/40 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Autocomplete>
        ) : (
          <input
            value={address}
            onChange={(event) => onAddressChange?.(event.target.value)}
            placeholder="Loading map..."
            className="w-full rounded-xl border border-outline-variant/40 px-4 py-3"
            disabled
          />
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline-variant/30">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height }}
            center={center}
            zoom={value ? 16 : 12}
            onLoad={setMap}
            onUnmount={() => setMap(null)}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {value ? <MarkerF position={value} draggable onDragEnd={handleMapClick} /> : null}
          </GoogleMap>
        ) : (
          <div
            className="grid place-items-center bg-surface-container text-sm text-on-surface-variant"
            style={{ height }}
          >
            Loading Google Maps...
          </div>
        )}
      </div>

      {value ? (
        <p className="text-xs text-on-surface-variant">
          Saved coordinates: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      ) : null}
    </div>
  )
}
