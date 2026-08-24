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
  const [fullMap, setFullMap] = useState(null)
  const [locating, setLocating] = useState(false)
  const [searching, setSearching] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Live Autocomplete Suggestions
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const searchContainerRef = useRef(null)
  const fullSearchContainerRef = useRef(null)

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

  // Smart reverse geocode (Google with Nominatim backup)
  const reverseGeocode = useCallback(
    async (lat, lng) => {
      let resolved = false
      if (window.google?.maps?.Geocoder) {
        try {
          const geocoder = new window.google.maps.Geocoder()
          await new Promise((resolve) => {
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === 'OK' && results?.[0]?.formatted_address) {
                onAddressChange?.(results[0].formatted_address)
                resolved = true
              }
              resolve()
            })
          })
        } catch {
          resolved = false
        }
      }

      if (!resolved) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          )
          const data = await res.json()
          if (data?.display_name) {
            onAddressChange?.(data.display_name)
          }
        } catch {
          // ignore
        }
      }
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

  // Live Debounced Autocomplete Search as user types
  useEffect(() => {
    const query = address?.trim()
    if (!query || query.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return undefined
    }

    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(
            query,
          )}`,
        )
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const parsed = data.map((item, idx) => {
            const parts = (item.display_name || '').split(',')
            const mainTitle = parts[0]?.trim() || item.name || query
            const secondary = parts.slice(1, 4).join(', ').trim()
            return {
              id: item.place_id || idx,
              title: mainTitle,
              subtitle: secondary || item.display_name,
              displayName: item.display_name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            }
          })
          setSuggestions(parsed)
          setShowDropdown(true)
        } else {
          setSuggestions([])
          setShowDropdown(false)
        }
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [address])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target) &&
        fullSearchContainerRef.current &&
        !fullSearchContainerRef.current.contains(e.target)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectSuggestion = useCallback(
    (suggestion) => {
      setShowDropdown(false)
      setSuggestions([])
      setGeoError('')
      onAddressChange?.(suggestion.displayName || suggestion.title)

      const next = { lat: suggestion.lat, lng: suggestion.lng }
      onChange?.(next)

      map?.panTo(next)
      map?.setZoom(16)
      fullMap?.panTo(next)
      fullMap?.setZoom(16)
    },
    [map, fullMap, onChange, onAddressChange],
  )

  // Geocode on Enter
  const handleGeocodeSearch = useCallback(
    async (queryText) => {
      const query = (queryText !== undefined ? queryText : address)?.trim()
      if (!query) return

      if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0])
        return
      }

      setSearching(true)
      setGeoError('')

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
            query,
          )}`,
        )
        const data = await res.json()
        if (data && data.length > 0 && data[0].lat && data[0].lon) {
          const next = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          }
          onChange?.(next)
          if (data[0].display_name) {
            onAddressChange?.(data[0].display_name)
          }
          map?.panTo(next)
          map?.setZoom(16)
          fullMap?.panTo(next)
          fullMap?.setZoom(16)
          setShowDropdown(false)
          setGeoError('')
        } else {
          setGeoError(`Location "${query}" not found. Click on the map to pin.`)
        }
      } catch {
        setGeoError(`Could not search location. Click on the map to pin.`)
      } finally {
        setSearching(false)
      }
    },
    [address, map, fullMap, suggestions, handleSelectSuggestion, onChange, onAddressChange],
  )

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
        fullMap?.panTo(next)
        fullMap?.setZoom(16)
      },
      (err) => {
        setLocating(false)
        if (err.code === 1) {
          setGeoError('Location permission denied. Please allow location access in browser.')
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
    setSuggestions([])
    setShowDropdown(false)
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
              Type to search or click map
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasValidPoint ? (
            <button
              type="button"
              onClick={handleClearLocation}
              className="rounded-lg px-2 py-1 text-xs font-medium text-on-surface-variant transition hover:bg-surface-container hover:text-error"
            >
              Clear pin
            </button>
          ) : null}

          <button
            type="button"
            disabled={locating}
            onClick={useCurrentLocation}
            className="flex items-center gap-1 rounded-xl border border-outline-variant/40 bg-white px-2.5 py-1 text-xs font-semibold text-on-surface shadow-sm transition hover:bg-surface-container disabled:opacity-50"
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
                <span>My Location</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsFullScreen(true)}
            className="flex items-center gap-1 rounded-xl border border-primary/40 bg-primary/5 px-2.5 py-1 text-xs font-bold text-primary transition hover:bg-primary/10"
            title="Open map in full screen for easy searching and pinning"
          >
            <span>⛶</span>
            <span>Full Screen</span>
          </button>
        </div>
      </div>

      {geoError ? (
        <div className="rounded-xl border border-error/20 bg-error/10 p-3 text-xs text-error">
          {geoError}
        </div>
      ) : null}

      {/* SEARCH INPUT BAR WITH LIVE AUTOCOMPLETE DROPDOWN */}
      <div ref={searchContainerRef} className="relative">
        <div className="relative flex items-center rounded-xl border border-outline-variant/50 bg-white shadow-sm ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="pl-3.5 text-sm text-on-surface-variant">
            {searching ? (
              <svg className="h-4 w-4 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              '🔍'
            )}
          </span>
          <input
            type="text"
            value={address}
            onChange={(event) => onAddressChange?.(event.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleGeocodeSearch(e.target.value)
              }
            }}
            placeholder="Type area, street, city (e.g. Rawalpindi, Gulberg)…"
            className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-on-surface-variant/50"
            autoComplete="off"
          />

          {address ? (
            <button
              type="button"
              onClick={() => {
                onAddressChange?.('')
                setSuggestions([])
                setShowDropdown(false)
              }}
              className="px-3 text-xs text-on-surface-variant hover:text-on-surface"
              title="Clear input"
            >
              ✕
            </button>
          ) : null}
        </div>

        {/* FLOATING LIVE SUGGESTIONS DROPDOWN */}
        {showDropdown && suggestions.length > 0 ? (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-outline-variant/40 bg-white p-1.5 shadow-xl">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left transition hover:bg-primary/5"
              >
                <span className="mt-0.5 text-sm text-primary">📍</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs text-on-surface truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-on-surface-variant truncate">
                    {item.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : null}
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
            Click anywhere on the map to place pin
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

      {/* FULL SCREEN MAP MODAL */}
      {isFullScreen ? (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-black/70 p-3 sm:p-6 backdrop-blur-md animate-fade-in">
          <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-on-surface">Select Pin Location</h3>
                <p className="text-xs text-on-surface-variant">
                  Search an area or click and drag the pin to your exact spot
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={locating}
                  onClick={useCurrentLocation}
                  className="flex items-center gap-1.5 rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-xs font-bold text-on-surface shadow-sm hover:bg-surface-container"
                >
                  📍 My Location
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullScreen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container text-on-surface hover:bg-outline-variant/30"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* MODAL SEARCH BAR */}
            <div className="px-6 pt-4 pb-2">
              <div ref={fullSearchContainerRef} className="relative">
                <div className="flex items-center rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2.5 shadow-sm ring-1 ring-black/5 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20">
                  <span className="pr-2 text-sm text-on-surface-variant">🔍</span>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => onAddressChange?.(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowDropdown(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleGeocodeSearch(e.target.value)
                      }
                    }}
                    placeholder="Type area, city, road (e.g. Rawalpindi Saddar, DHA, Gulberg)…"
                    className="w-full bg-transparent text-sm outline-none"
                    autoComplete="off"
                  />
                  {address ? (
                    <button
                      type="button"
                      onClick={() => {
                        onAddressChange?.('')
                        setSuggestions([])
                        setShowDropdown(false)
                      }}
                      className="px-2 text-xs text-on-surface-variant hover:text-on-surface"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>

                {/* MODAL AUTOCOMPLETE DROPDOWN */}
                {showDropdown && suggestions.length > 0 ? (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-outline-variant/40 bg-white p-2 shadow-2xl">
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-primary/5"
                      >
                        <span className="mt-0.5 text-sm text-primary">📍</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-on-surface truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-on-surface-variant truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* FULL MAP CANVAS */}
            <div className="relative flex-1 min-h-0">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={center}
                  zoom={hasValidPoint ? 16 : 12}
                  onLoad={setFullMap}
                  onUnmount={() => setFullMap(null)}
                  onClick={handleMapClick}
                  options={{
                    streetViewControl: true,
                    mapTypeControl: true,
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
              ) : null}

              {!hasValidPoint ? (
                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-4 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
                  Click anywhere on the map to place pin
                </div>
              ) : null}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 bg-white px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Selected Location
                </p>
                <p className="text-sm font-semibold text-on-surface truncate">
                  {address || 'No address pinned yet'}
                </p>
                {hasValidPoint ? (
                  <p className="text-xs text-emerald-600 font-medium">
                    ● Coordinates: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFullScreen(false)}
                  className="rounded-xl border border-outline-variant/40 px-5 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullScreen(false)}
                  disabled={!hasValidPoint}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 hover:opacity-95 disabled:opacity-40"
                >
                  ✓ Confirm & Pin Location
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

