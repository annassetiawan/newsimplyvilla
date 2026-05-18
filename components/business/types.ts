export interface BusinessItemType {
  id: string
  businessId: string
  name: string
  price: number
  category: string
  photo: string | null
  stock: number
  villaId: string
}

export interface BusinessType {
  id: string
  name: string
  type: string
  description: string | null
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  items: BusinessItemType[]
}
