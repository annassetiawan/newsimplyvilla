import { ProGate } from '@/components/ProGate'

export default function EmployeePage() {
  return (
    <ProGate
      feature="Employee Management"
      description="Kelola data karyawan, absensi, dan payroll dalam satu sistem terintegrasi."
    >
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Management</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Staff records, attendance tracking, and payroll management.
          </p>
        </div>
        <div className="rounded-xl border-2 border-dashed border-border p-16 text-center text-sm text-muted-foreground">
          Employee Management — coming soon
        </div>
      </div>
    </ProGate>
  )
}
