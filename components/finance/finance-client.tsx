'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutDashboard, Target, Wallet, Users } from 'lucide-react'
import { OverviewTab } from './overview/overview-tab'
import { BudgetTab } from './budget/budget-tab'
import { PettyCashTab } from './petty-cash/petty-cash-tab'
import { PayrollTab } from './payroll/payroll-tab'

interface Transaction {
  id: string
  date: string
  type: string
  description: string
  amount: number
  category: string
  paymentStatus: string
}

interface Reservation {
  id: string
  checkIn: string
  checkOut: string
  status: string
  totalAmount: number
}

interface PosTransaction {
  id: string
  createdAt: string
  total: number
  business: { name: string }
}

interface PettyCash {
  id: string
  date: string
  description: string
  type: string
  amount: number
  note: string | null
  createdAt: string
}

interface Payroll {
  id: string
  staffId: string
  month: number
  year: number
  amount: number
  status: string
  paidAt: string | null
  note: string | null
  staff: { id: string; name: string; position: string }
}

interface StaffMember {
  id: string
  name: string
  position: string
}

interface Budget {
  id: string
  month: number
  year: number
  target: number
  villaId: string
}

interface Props {
  transactions: Transaction[]
  reservations: Reservation[]
  posTransactions: PosTransaction[]
  pettyCash: PettyCash[]
  payrolls: Payroll[]
  staffList: StaffMember[]
  budgets: Budget[]
  currentMonth: number
  currentYear: number
}

export default function FinanceClient({
  transactions,
  reservations,
  posTransactions,
  pettyCash,
  payrolls,
  staffList,
  budgets,
  currentMonth,
  currentYear,
}: Props) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finance & Account</h1>
        <p className="text-sm text-muted-foreground">Ringkasan keuangan dan pengelolaan kas villa</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="h-9">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="budget" className="gap-1.5 text-xs sm:text-sm">
            <Target className="h-3.5 w-3.5" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="petty-cash" className="gap-1.5 text-xs sm:text-sm">
            <Wallet className="h-3.5 w-3.5" />
            Petty Cash
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5" />
            Payroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab
            transactions={transactions}
            reservations={reservations}
            posTransactions={posTransactions}
            currentMonth={currentMonth}
            currentYear={currentYear}
          />
        </TabsContent>

        <TabsContent value="budget" className="mt-4">
          <BudgetTab
            transactions={transactions}
            reservations={reservations}
            posTransactions={posTransactions}
            budgets={budgets}
            currentMonth={currentMonth}
            currentYear={currentYear}
          />
        </TabsContent>

        <TabsContent value="petty-cash" className="mt-4">
          <PettyCashTab pettyCash={pettyCash} />
        </TabsContent>

        <TabsContent value="payroll" className="mt-4">
          <PayrollTab
            payrolls={payrolls}
            staffList={staffList}
            currentMonth={currentMonth}
            currentYear={currentYear}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
