import { ProGate } from '@/components/ProGate'

export default function ChangeManagementPage() {
  return (
    <ProGate
      feature="Change Management"
      description="Audit trail lengkap dan approval workflow untuk setiap perubahan data penting di sistem."
    >
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Change Management</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Full audit trail and approval workflows for every important system change.
          </p>
        </div>
        <div className="rounded-xl border-2 border-dashed border-border p-16 text-center text-sm text-muted-foreground">
          Change Management — coming soon
        </div>
      </div>
    </ProGate>
  )
}
