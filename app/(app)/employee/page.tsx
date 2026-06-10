import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/getSession'
import { db } from '@/lib/db'
import { ProGate } from '@/components/ProGate'
import EmployeeClient from '@/components/employee/employee-client'

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

export default async function EmployeePage() {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [employees, attendances, leaveRequests, leaveAllocations, staffList] =
    await Promise.all([
      db.employee.findMany({
        where: { villaId: user.villaId! },
        include: { staff: { select: { id: true, name: true, email: true } } },
        orderBy: { name: 'asc' },
      }),
      db.attendance.findMany({
        where: {
          villaId: user.villaId!,
          date: { gte: monthStart, lte: monthEnd },
        },
        include: { employee: { select: { id: true, name: true } } },
      }),
      db.leaveRequest.findMany({
        where: { villaId: user.villaId! },
        include: { employee: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.leaveAllocation.findMany({
        where: { villaId: user.villaId!, year: now.getFullYear() },
      }),
      db.staff.findMany({
        where: { villaId: user.villaId!, isActive: true },
        select: { id: true, name: true, email: true },
      }),
    ])

  return (
    <ProGate
      feature="Employee Management"
      description="Kelola data karyawan, absensi, dan pengajuan cuti dalam satu sistem terintegrasi."
    >
      <EmployeeClient
        employees={employees.map((e) => ({
          ...e,
          birthDate: e.birthDate?.toISOString() ?? null,
          startDate: e.startDate.toISOString(),
          endDate: e.endDate?.toISOString() ?? null,
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        }))}
        attendances={attendances.map((a) => ({
          ...a,
          date: a.date.toISOString(),
        }))}
        leaveRequests={leaveRequests.map((l) => ({
          ...l,
          startDate: l.startDate.toISOString(),
          endDate: l.endDate.toISOString(),
          createdAt: l.createdAt.toISOString(),
        }))}
        leaveAllocations={leaveAllocations}
        staffList={staffList}
        currentMonth={now.getMonth() + 1}
        currentYear={now.getFullYear()}
      />
    </ProGate>
  )
}
