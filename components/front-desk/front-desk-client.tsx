'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarTab } from './calendar-tab'
import { ListTab, type ListReservation } from './list-tab'
import { GuestsTab, type GuestData } from './guests-tab'
import { LostFoundTab, type LostFoundItem } from './lost-found-tab'
import { ReservationModal } from './reservation-modal'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ProGate } from '@/components/ProGate'

interface RoomData {
  id: string
  code: string
  name: string
  type: string
  capacity: number
  pricePerNight: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE'
  villaId: string
}

interface Props {
  rooms: RoomData[]
  reservations: ListReservation[]
  guests: GuestData[]
  lostAndFound: LostFoundItem[]
}

export function FrontDeskClient({ rooms, reservations, guests, lostAndFound }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking')
  const defaultTab = bookingId ? 'list' : (isMobile ? 'list' : 'calendar')

  return (
    <>
      <Tabs key={bookingId ?? 'default'} defaultValue={defaultTab}>
        <TabsList className="scrollbar-hide mb-4 h-9 w-full overflow-x-auto justify-start">
          <TabsTrigger value="calendar" className="shrink-0">Calendar</TabsTrigger>
          <TabsTrigger value="list" className="shrink-0">List</TabsTrigger>
          <TabsTrigger value="guests" className="shrink-0">Guests</TabsTrigger>
          <TabsTrigger value="lost-found" className="shrink-0">Lost &amp; Found</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <ProGate feature="Reservation Calendar" description="Lihat seluruh reservasi dalam tampilan kalender interaktif.">
            <CalendarTab
              rooms={rooms}
              reservations={reservations}
              onNewReservation={() => setModalOpen(true)}
            />
          </ProGate>
        </TabsContent>

        <TabsContent value="list">
          <ListTab
            reservations={reservations}
            onNewReservation={() => setModalOpen(true)}
            initialBookingId={bookingId}
          />
        </TabsContent>

        <TabsContent value="guests">
          <GuestsTab guests={guests} />
        </TabsContent>

        <TabsContent value="lost-found">
          <ProGate feature="Lost & Found" description="Kelola barang temuan tamu dan histori laporan kehilangan.">
            <LostFoundTab items={lostAndFound} />
          </ProGate>
        </TabsContent>
      </Tabs>

      <ReservationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        allRooms={rooms}
        existingGuests={guests}
        existingReservations={reservations}
      />
    </>
  )
}
