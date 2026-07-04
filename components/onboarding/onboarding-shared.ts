import { z } from 'zod'

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const villaSchema = z.object({
  name: z.string().min(2, 'Nama villa minimal 2 karakter'),
  address: z.string().min(5, 'Alamat wajib diisi'),
  city: z.string().min(2, 'Kota wajib diisi'),
  phone: z.string().min(6, 'Nomor telepon wajib diisi'),
  description: z.string().optional(),
})

const singleRoomSchema = z.object({
  code: z.string().min(1, 'Kode kamar wajib diisi'),
  name: z.string().min(1, 'Nama kamar wajib diisi'),
  capacity: z.number().min(1, 'Minimal 1 tamu'),
  bedType: z.string().min(1, 'Pilih tipe tempat tidur'),
  pricePerNight: z.number().min(1, 'Harga wajib diisi'),
  status: z.enum(['AVAILABLE', 'MAINTENANCE']),
})

export const roomsSchema = z.object({
  rooms: z.array(singleRoomSchema).min(1),
})

const staffMemberSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid'),
  position: z.string().min(1, 'Pilih posisi'),
  permissions: z.array(z.string()),
})

export const staffFormSchema = z.object({
  staffList: z.array(staffMemberSchema),
})

export type VillaValues = z.infer<typeof villaSchema>
export type RoomsValues = z.infer<typeof roomsSchema>
export type StaffValues = z.infer<typeof staffFormSchema>

// ─── Constants ────────────────────────────────────────────────────────────────

export const FACILITIES = ['Swimming Pool', 'WiFi', 'Parkir', 'AC', 'Dapur', 'Taman', 'Kolam Anak']
export const BED_TYPES = ['King', 'Queen', 'Twin', 'Single']
export const POSITIONS = ['Front Desk', 'Housekeeper', 'Maintenance', 'Other']

export const ALL_MODULES = [
  { key: 'dashboard',    label: 'Dashboard' },
  { key: 'front-desk',   label: 'Front Desk' },
  { key: 'rooms',        label: 'Rooms & Areas' },
  { key: 'inventory',    label: 'Inventory' },
  { key: 'maintenance',  label: 'Maintenance' },
  { key: 'schedule',     label: 'Schedule' },
  { key: 'reports',      label: 'Reports' },
  { key: 'sop',          label: 'SOP' },
  { key: 'users',        label: 'Users' },
  { key: 'settings',     label: 'Settings' },
]

export const DEFAULT_PERMISSIONS = ['dashboard', 'front-desk', 'rooms', 'maintenance', 'schedule', 'sop']

export const ROOM_DEFAULT = {
  code: '',
  name: '',
  capacity: 2,
  bedType: 'King',
  pricePerNight: 0,
  status: 'AVAILABLE' as const,
}

export const STAFF_DEFAULT = { name: '', email: '', position: 'Front Desk', permissions: DEFAULT_PERMISSIONS }
