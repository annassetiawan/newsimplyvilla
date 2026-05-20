export interface Employee {
  id: string
  name: string
  photo: string | null
  idNumber: string | null
  birthPlace: string | null
  birthDate: string | null
  gender: 'MALE' | 'FEMALE' | null
  phone: string | null
  address: string | null
  position: string
  department: string | null
  employmentType: 'PERMANENT' | 'CONTRACT' | 'FREELANCE'
  startDate: string
  endDate: string | null
  baseSalary: number | null
  staffId: string | null
  status: 'ACTIVE' | 'INACTIVE'
  villaId: string
  createdAt: string
  updatedAt: string
  staff: { id: string; name: string; email: string | null } | null
}

export interface Attendance {
  id: string
  employeeId: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'SICK' | 'LEAVE' | 'OFF'
  note: string | null
  villaId: string
  employee: { id: string; name: string }
}

export interface LeaveRequest {
  id: string
  employeeId: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedBy: string | null
  reviewNote: string | null
  villaId: string
  createdAt: string
  employee: { id: string; name: string }
}

export interface LeaveAllocation {
  id: string
  employeeId: string
  year: number
  totalDays: number
  usedDays: number
  villaId: string
}

export interface StaffMember {
  id: string
  name: string
  email: string | null
}
