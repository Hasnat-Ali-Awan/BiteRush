import {
  DirectionsRenderer,
  DirectionsService,
  GoogleMap,
  MarkerF,
  PolylineF,
  useJsApiLoader,
} from '@react-google-maps/api'
import { useEffect, useMemo, useState } from 'react'

const LIBRARIES = ['places']
const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 }
function isValidPoint(point) {
  if (!point) return false
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return false
  // Treat (0,0) as "not set" for this app.
  if (Math.abs(point.lat) < 1e-9 && Math.abs(point.lng) < 1e-9) return false
  if (point.lat < -90 || point.lat > 90) return false
  if (point.lng < -180 || point.lng > 180) return false
  return true
}

export default function TrackingMap({ restaurant, customer, rider, status }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const [routeEta, setRouteEta] = useState(null)
  const [routeDistance, setRouteDistance] = useState(null)
  const [directions, setDirections] = useState(null)

  const riderValid = isValidPoint(rider)
  const restaurantValid = isValidPoint(restaurant)
  const customerValid = isValidPoint(customer)

  const origin = riderValid ? rider : restaurantValid ? restaurant : null
  const destination = customerValid ? customer : null

  const originKey = origin
    ? `${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}`
    : 'none'
  const destinationKey = destination
    ? `${destination.lat.toFixed(3)},${destination.lng.toFixed(3)}`
    : 'none'

  const points = useMemo(() => {
    const list = []
    if (restaurantValid) list.push(restaurant)
    if (riderValid) list.push(rider)
    if (customerValid) list.push(customer)
    return list
  }, [restaurantValid, riderValid, customerValid, restaurant, rider, customer])

  const center = points[0] || DEFAULT_CENTER

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    libraries: LIBRARIES,
  })

  const shouldShowRoute = Boolean(origin && destination)

  const directionsOptions = useMemo(() => {
    if (!shouldShowRoute || !origin || !destination) return null
    // Only show directions after rider is assigned/active, so users aren't confused.
    const activeEnough =
      status === 'assigned' ||
      status === 'picked_up' ||
      status === 'on_the_way' ||
      status === 'delivered'
    const allowRoute = activeEnough || status === 'ready'
    if (!allowRoute) return null
    return {
      origin,
      destination,
      travelMode: 'DRIVING',
    }
  }, [shouldShowRoute, origin, destination, status])

  useEffect(() => {
    if (!directionsOptions) {
      setDirections(null)
      setRouteEta(null)
      setRouteDistance(null)
    }
  }, [directionsOptions])

  if (!apiKey) {
    return (
      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm text-on-surface-variant">
        Add `VITE_GOOGLE_MAPS_API_KEY` to show live tracking.
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-error/30 bg-error/5 p-4 text-sm text-error">
        Google Maps failed to load.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/30">
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: 320 }}
          center={center}
          zoom={13}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {restaurant ? (
            <MarkerF
              position={restaurant}
              label={{ text: 'R', color: '#fff' }}
              title="Restaurant"
            />
          ) : null}
          {customer ? (
            <MarkerF
              position={customer}
              label={{ text: 'C', color: '#fff' }}
              title="Customer"
            />
          ) : null}
          {rider ? (
            <MarkerF
              position={rider}
              label={{ text: 'D', color: '#fff' }}
              title="Rider"
            />
          ) : null}

          {directionsOptions ? (
            <>
              <DirectionsService
                key={`${originKey}-${destinationKey}`}
                options={directionsOptions}
                callback={(response) => {
                  if (!response) return
                  if (response.status !== 'OK') return
                  setDirections(response)
                  const leg = response.routes?.[0]?.legs?.[0]
                  if (leg?.duration?.text) setRouteEta(leg.duration.text)
                  if (leg?.distance?.text) setRouteDistance(leg.distance.text)
                }}
              />
              {directions ? (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    suppressMarkers: true,
                    polylineOptions: {
                      strokeColor: '#e85d04',
                      strokeOpacity: 0.95,
                      strokeWeight: 5,
                    },
                  }}
                />
              ) : null}
            </>
          ) : points.length >= 2 ? (
            <PolylineF
              path={points}
              options={{
                strokeColor: '#e85d04',
                strokeOpacity: 0.9,
                strokeWeight: 4,
              }}
            />
          ) : null}
        </GoogleMap>
      ) : (
        <div className="grid h-80 place-items-center bg-surface-container text-sm text-on-surface-variant">
          Loading map...
        </div>
      )}

      {shouldShowRoute && routeEta ? (
        <div className="border-t border-outline-variant/30 bg-white px-4 py-3 text-sm">
          <p className="font-semibold text-on-surface">
            ETA: {routeEta}
            {routeDistance ? ` · ${routeDistance}` : ''}
          </p>
          <p className="mt-1 text-on-surface-variant">
            Updated from your latest GPS location.
          </p>
        </div>
      ) : null}
    </div>
  )
}
