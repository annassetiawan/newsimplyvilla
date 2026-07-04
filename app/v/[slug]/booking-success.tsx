import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatRp } from './booking-shared'

interface BookingSuccessProps {
  guestName: string
  guestPhone: string
  roomName: string | undefined
  nights: number
  totalAmount: number
  onReset: () => void
}

export function BookingSuccess({
  guestName,
  guestPhone,
  roomName,
  nights,
  totalAmount,
  onReset,
}: BookingSuccessProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="space-y-4 pt-8">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
          <h2 className="text-xl font-semibold">Booking Terkirim!</h2>
          <p className="text-muted-foreground">
            Terima kasih <strong>{guestName}</strong>! Booking Anda untuk{' '}
            <strong>{roomName}</strong> telah kami terima.
            {guestPhone && (
              <>
                {' '}Kami akan menghubungi Anda di{' '}
                <strong>{guestPhone}</strong>.
              </>
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {nights} malam · {formatRp(totalAmount)}
          </p>
          <Button variant="outline" onClick={onReset}>
            Booking lagi
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
