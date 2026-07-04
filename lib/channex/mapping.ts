import { db } from '@/lib/db'

export async function getMapping(villaId: string, kind: string, localId: string): Promise<string | null> {
  const m = await db.channexMapping.findUnique({
    where: { villaId_kind_localId: { villaId, kind, localId } },
  })
  return m?.channexId ?? null
}

export async function saveMapping(villaId: string, kind: string, localId: string, channexId: string) {
  await db.channexMapping.upsert({
    where: { villaId_kind_localId: { villaId, kind, localId } },
    create: { villaId, kind, localId, channexId },
    update: { channexId },
  })
}

export async function deleteMapping(villaId: string, kind: string, localId: string) {
  await db.channexMapping.deleteMany({ where: { villaId, kind, localId } })
}
