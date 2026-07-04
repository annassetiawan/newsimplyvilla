import { MapPin, Phone, Mail } from 'lucide-react'
import type { VillaData } from './booking-shared'

export function VillaHero({ villa }: { villa: VillaData }) {
  return (
    <section className="bg-background border-b">
      <div className="mx-auto max-w-5xl px-4 py-12 lg:py-16">
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
          {villa.name}
        </h1>
        {villa.description && (
          <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
            {villa.description}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {villa.address && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0" />
              {villa.address}
            </span>
          )}
          {villa.contact && (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-4 w-4 shrink-0" />
              {villa.contact}
            </span>
          )}
          {villa.email && (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-4 w-4 shrink-0" />
              {villa.email}
            </span>
          )}
        </div>
        {villa.facilities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {villa.facilities.map((f) => (
              <span
                key={f}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
