import { useState, useEffect } from 'react'

interface LocationInfo {
  latitude: number | null
  longitude: number | null
  error: string | null
  loading: boolean
}

// Office tower coordinates (replace with your actual coordinates)
const OFFICE_TOWER_LAT = 40.7589 // Example: Empire State Building
const OFFICE_TOWER_LNG = -73.9851
const ALLOWED_RADIUS_KM = 0.1 // 100 meters

export function useLocation() {
  const [location, setLocation] = useState<LocationInfo>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  })

  const [isInOffice, setIsInOffice] = useState<boolean | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({
        latitude: null,
        longitude: null,
        error: 'Geolocation is not supported',
        loading: false,
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocation({
          latitude,
          longitude,
          error: null,
          loading: false,
        })

        // Check if user is within office radius
        const distance = calculateDistance(
          latitude,
          longitude,
          OFFICE_TOWER_LAT,
          OFFICE_TOWER_LNG
        )

        setIsInOffice(distance <= ALLOWED_RADIUS_KM)
      },
      (error) => {
        setLocation({
          latitude: null,
          longitude: null,
          error: error.message,
          loading: false,
        })
        setIsInOffice(null)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    )
  }, [])

  return { ...location, isInOffice }
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// For development/demo purposes, you can override location check
export function isDevelopmentMode(): boolean {
  return import.meta.env.DEV
}