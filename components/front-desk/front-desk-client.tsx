'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarTab } from './calendar-tab'
import { ListTab, type ListReservation } from './list-tab'
import { GuestsTab, type GuestData } from './guests-tab'
import { LostFoundTab, type LostFoundItem } from './lost-found-tab'
import { ReservationModal } from './reservation-modal'

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

  return (
    <>
      <Tabs defaultValue="calendar">
        <TabsList className="mb-4 h-9">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="guests">Guests</TabsTrigger>
          <TabsTrigger value="lost-found">Lost &amp; Found</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <CalendarTab
            rooms={rooms}
            reservations={reservations}
            onNewReservation={() => setModalOpen(true)}
          />
        </TabsContent>

        <TabsContent value="list">
          <ListTab
            reservations={reservations}
            onNewReservation={() => setModalOpen(true)}
          />
        </TabsContent>

        <TabsContent value="guests">
          <GuestsTab guests={guests} />
        </TabsContent>

        <TabsContent value="lost-found">
          <LostFoundTab items={lostAndFound} />
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
