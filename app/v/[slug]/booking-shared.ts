export interface VillaData {
  id: string
  name: string
  address: string
  description: string | null
  email: string | null
  contact: string | null
  facilities: string[]
}

export interface RoomData {
  id: string
  code: string
  name: string
  type: string
  capacity: number
  pricePerNight: number
  status: string
  photos: string[]
}

export interface ReservationData {
  id: string
  roomId: string
  checkIn: string
  checkOut: string
  status: string
}

export function formatRp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

export function isConflicting(
  roomId: string,
  checkIn: string,
  checkOut: string,
  reservations: ReservationData[]
): boolean {
  if (!checkIn || !checkOut) return false
  const ci = new Date(checkIn).getTime()
  const co = new Date(checkOut).getTime()
  return reservations.some(
    (r) =>
      r.roomId === roomId &&
      new Date(r.checkIn).getTime() < co &&
      new Date(r.checkOut).getTime() > ci
  )
}
