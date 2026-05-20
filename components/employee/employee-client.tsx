'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, CalendarCheck, Palmtree } from 'lucide-react'
import { EmployeeList } from './employees/employee-list'
import { AttendanceTab } from './attendance/attendance-tab'
import { LeaveTab } from './leave/leave-tab'
import type { Employee, Attendance, LeaveRequest, LeaveAllocation, StaffMember } from './types'

interface Props {
  employees: Employee[]
  attendances: Attendance[]
  leaveRequests: LeaveRequest[]
  leaveAllocations: LeaveAllocation[]
  staffList: StaffMember[]
  currentMonth: number
  currentYear: number
}

export default function EmployeeClient({
  employees,
  attendances,
  leaveRequests,
  leaveAllocations,
  staffList,
  currentMonth,
  currentYear,
}: Props) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Employee Management</h1>
        <p className="text-sm text-muted-foreground">Data karyawan, absensi, dan pengajuan cuti</p>
      </div>

      <Tabs defaultValue="employees">
        <TabsList className="mb-2">
          <TabsTrigger value="employees" className="gap-2">
            <Users className="w-4 h-4" /> Karyawan
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <CalendarCheck className="w-4 h-4" /> Absensi
          </TabsTrigger>
          <TabsTrigger value="leave" className="gap-2">
            <Palmtree className="w-4 h-4" /> Cuti
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <EmployeeList employees={employees} staffList={staffList} />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceTab
            employees={employees}
            attendances={attendances}
            currentMonth={currentMonth}
            currentYear={currentYear}
          />
        </TabsContent>

        <TabsContent value="leave">
          <LeaveTab
            employees={employees}
            leaveRequests={leaveRequests}
            leaveAllocations={leaveAllocations}
            currentYear={currentYear}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
