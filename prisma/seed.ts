import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding SimplyVilla database...')

  // ── Villa ──────────────────────────────────────────────────────────────────
  const villa = await prisma.villa.upsert({
    where: { id: 'villa-senja-ubud' },
    update: {},
    create: {
      id: 'villa-senja-ubud',
      name: 'Villa Senja Ubud',
      address: 'Jl. Suweta No. 12, Ubud, Gianyar, Bali 80571',
      description:
        'A boutique villa nestled in the heart of Ubud, surrounded by lush rice terraces and tropical gardens.',
      contact: '+62 361 978 456',
    },
  })
  console.log('✅ Villa created:', villa.name)

  // ── Rooms ──────────────────────────────────────────────────────────────────
  const roomsData = [
    { code: 'FR-01', name: 'Frangipani Suite', type: 'Suite', capacity: 2, pricePerNight: 2400000, status: 'OCCUPIED' as const },
    { code: 'FR-02', name: 'Bougainvillea Room', type: 'Deluxe', capacity: 2, pricePerNight: 1900000, status: 'AVAILABLE' as const },
    { code: 'FR-03', name: 'Heliconia Room', type: 'Family', capacity: 3, pricePerNight: 2100000, status: 'CLEANING' as const },
    { code: 'FR-04', name: 'Plumeria Villa', type: 'Private Villa', capacity: 4, pricePerNight: 3200000, status: 'OCCUPIED' as const },
    { code: 'FR-05', name: 'Hibiscus Room', type: 'Deluxe', capacity: 2, pricePerNight: 1900000, status: 'MAINTENANCE' as const },
    { code: 'FR-06', name: 'Anggrek Suite', type: 'Suite', capacity: 2, pricePerNight: 2400000, status: 'AVAILABLE' as const },
  ]

  const rooms: Record<string, { id: string }> = {}
  for (const r of roomsData) {
    const room = await prisma.room.upsert({
      where: { id: `room-${r.code.toLowerCase()}` },
      update: { status: r.status },
      create: { id: `room-${r.code.toLowerCase()}`, ...r, photos: [], villaId: villa.id },
    })
    rooms[r.code] = room
  }
  console.log('✅ Rooms created:', Object.keys(rooms).length)

  // ── Areas ──────────────────────────────────────────────────────────────────
  const areasData = [
    { name: 'Main Pool', description: 'Infinity pool with rice terrace views' },
    { name: 'Restaurant & Bar', description: 'Open-air dining area serving Balinese cuisine' },
    { name: 'Spa Pavilion', description: 'Traditional Balinese spa treatments' },
    { name: 'Garden Lounge', description: 'Outdoor seating surrounded by tropical gardens' },
    { name: 'Reception Lobby', description: 'Main entrance and concierge area' },
  ]
  for (const a of areasData) {
    await prisma.area.upsert({
      where: { id: `area-${a.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: { id: `area-${a.name.toLowerCase().replace(/\s+/g, '-')}`, ...a, villaId: villa.id },
    })
  }
  console.log('✅ Areas created:', areasData.length)

  // ── Staff ──────────────────────────────────────────────────────────────────
  const staffData = [
    { id: 'staff-wayan', name: 'Wayan Surata', role: 'STAFF' as const, position: 'Housekeeper', email: 'wayan@villasenja.com' },
    { id: 'staff-komang', name: 'Komang Darma', role: 'STAFF' as const, position: 'Maintenance', email: 'komang@villasenja.com' },
    { id: 'staff-sari', name: 'Sari Dewi', role: 'STAFF' as const, position: 'Front Desk', email: 'sari@villasenja.com' },
    { id: 'staff-putu', name: 'Putu Adiasa', role: 'STAFF' as const, position: 'Housekeeper', email: 'putu@villasenja.com' },
  ]
  for (const s of staffData) {
    await prisma.staff.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, villaId: villa.id },
    })
  }
  console.log('✅ Staff created:', staffData.length)

  // ── Guests ─────────────────────────────────────────────────────────────────
  const guestsData = [
    { id: 'guest-01', name: 'Budi Santoso', idNumber: '3271010101800001', phone: '+6281234567890', email: 'budi.santoso@gmail.com' },
    { id: 'guest-02', name: 'Dewi Rahayu', idNumber: '3273015501900002', phone: '+6281234567891', email: 'dewi.rahayu@gmail.com' },
    { id: 'guest-03', name: 'Made Suartana', idNumber: '5171011201850003', phone: '+6281234567892', email: 'made.suartana@gmail.com' },
    { id: 'guest-04', name: 'Ketut Wijaya', idNumber: '5171012302880004', phone: '+6281234567893', email: 'ketut.wijaya@gmail.com' },
    { id: 'guest-05', name: 'Nyoman Sari', idNumber: '5172011501920005', phone: '+6281234567894', email: 'nyoman.sari@gmail.com' },
    { id: 'guest-06', name: 'Ayu Puspita', idNumber: '5171041504950006', phone: '+6281234567895', email: 'ayu.puspita@gmail.com' },
    { id: 'guest-07', name: 'Gede Mahendra', idNumber: '5171022103880007', phone: '+6281234567896', email: 'gede.mahendra@gmail.com' },
    { id: 'guest-08', name: 'Luh Putu Ari', idNumber: '5172032801960008', phone: '+6281234567897', email: 'luh.ari@gmail.com' },
    { id: 'guest-09', name: 'Wayan Sudiarta', idNumber: '5171031201870009', phone: '+6281234567898', email: 'wayan.sudiarta@gmail.com' },
    { id: 'guest-10', name: 'Ni Made Krisna', idNumber: '5172031003900010', phone: '+6281234567899', email: 'nimade.krisna@gmail.com' },
    { id: 'guest-11', name: 'Komang Aditya', idNumber: '5171041201910011', phone: '+6281234567900', email: 'komang.aditya@gmail.com' },
  ]
  for (const g of guestsData) {
    await prisma.guest.upsert({
      where: { id: g.id },
      update: {},
      create: g,
    })
  }
  console.log('✅ Guests created:', guestsData.length)

  // ── Reservations ───────────────────────────────────────────────────────────
  const reservationsData = [
    { id: 'res-01', guestId: 'guest-01', roomCode: 'FR-01', checkIn: new Date('2026-04-24'), checkOut: new Date('2026-04-27'), status: 'CHECKEDIN' as const, paymentStatus: 'PAID' as const, nights: 3, price: 2400000 },
    { id: 'res-02', guestId: 'guest-04', roomCode: 'FR-01', checkIn: new Date('2026-05-05'), checkOut: new Date('2026-05-08'), status: 'CONFIRMED' as const, paymentStatus: 'PAID' as const, nights: 3, price: 2400000 },
    { id: 'res-03', guestId: 'guest-02', roomCode: 'FR-02', checkIn: new Date('2026-04-20'), checkOut: new Date('2026-04-23'), status: 'CHECKEDOUT' as const, paymentStatus: 'PAID' as const, nights: 3, price: 1900000 },
    { id: 'res-04', guestId: 'guest-06', roomCode: 'FR-02', checkIn: new Date('2026-05-02'), checkOut: new Date('2026-05-05'), status: 'CONFIRMED' as const, paymentStatus: 'UNPAID' as const, nights: 3, price: 1900000 },
    { id: 'res-05', guestId: 'guest-03', roomCode: 'FR-03', checkIn: new Date('2026-04-22'), checkOut: new Date('2026-04-25'), status: 'CHECKEDOUT' as const, paymentStatus: 'PAID' as const, nights: 3, price: 2100000 },
    { id: 'res-06', guestId: 'guest-07', roomCode: 'FR-03', checkIn: new Date('2026-04-28'), checkOut: new Date('2026-04-30'), status: 'CHECKEDOUT' as const, paymentStatus: 'PAID' as const, nights: 2, price: 2100000 },
    { id: 'res-07', guestId: 'guest-05', roomCode: 'FR-04', checkIn: new Date('2026-04-23'), checkOut: new Date('2026-04-27'), status: 'CHECKEDIN' as const, paymentStatus: 'PAID' as const, nights: 4, price: 3200000 },
    { id: 'res-08', guestId: 'guest-08', roomCode: 'FR-04', checkIn: new Date('2026-05-06'), checkOut: new Date('2026-05-10'), status: 'CONFIRMED' as const, paymentStatus: 'UNPAID' as const, nights: 4, price: 3200000 },
    { id: 'res-09', guestId: 'guest-09', roomCode: 'FR-05', checkIn: new Date('2026-04-18'), checkOut: new Date('2026-04-21'), status: 'CHECKEDOUT' as const, paymentStatus: 'PAID' as const, nights: 3, price: 1900000 },
    { id: 'res-10', guestId: 'guest-11', roomCode: 'FR-05', checkIn: new Date('2026-04-25'), checkOut: new Date('2026-04-28'), status: 'CANCELLED' as const, paymentStatus: 'UNPAID' as const, nights: 3, price: 1900000 },
    { id: 'res-11', guestId: 'guest-10', roomCode: 'FR-06', checkIn: new Date('2026-04-19'), checkOut: new Date('2026-04-22'), status: 'CHECKEDOUT' as const, paymentStatus: 'PAID' as const, nights: 3, price: 2400000 },
    { id: 'res-12', guestId: 'guest-04', roomCode: 'FR-06', checkIn: new Date('2026-05-03'), checkOut: new Date('2026-05-06'), status: 'CONFIRMED' as const, paymentStatus: 'PAID' as const, nights: 3, price: 2400000 },
  ]

  for (const r of reservationsData) {
    const totalAmount = r.nights * r.price
    await prisma.reservation.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        guestId: r.guestId,
        roomId: rooms[r.roomCode].id,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        status: r.status,
        paymentStatus: r.paymentStatus,
        totalAmount,
      },
    })
  }
  console.log('✅ Reservations created:', reservationsData.length)

  // ── Inventory ──────────────────────────────────────────────────────────────
  const inventoryData = [
    // LINEN
    { id: 'inv-ln-001', sku: 'LN-001', name: 'Bed Sheet Double', category: 'LINEN' as const, onHand: 24, minLevel: 20, unit: 'pcs' },
    { id: 'inv-ln-002', sku: 'LN-002', name: 'Pillow Case', category: 'LINEN' as const, onHand: 48, minLevel: 40, unit: 'pcs' },
    { id: 'inv-ln-003', sku: 'LN-003', name: 'Duvet Cover', category: 'LINEN' as const, onHand: 18, minLevel: 15, unit: 'pcs' },
    { id: 'inv-ln-004', sku: 'LN-004', name: 'Bath Towel', category: 'LINEN' as const, onHand: 36, minLevel: 30, unit: 'pcs' },
    { id: 'inv-ln-005', sku: 'LN-005', name: 'Face Towel', category: 'LINEN' as const, onHand: 48, minLevel: 36, unit: 'pcs' },
    { id: 'inv-ln-006', sku: 'LN-006', name: 'Pool Towel', category: 'LINEN' as const, onHand: 20, minLevel: 18, unit: 'pcs' },
    { id: 'inv-ln-007', sku: 'LN-007', name: 'Bath Mat', category: 'LINEN' as const, onHand: 8, minLevel: 10, unit: 'pcs' }, // BELOW MIN
    // AMENITY
    { id: 'inv-am-001', sku: 'AM-001', name: 'Shampoo 300ml', category: 'AMENITY' as const, onHand: 60, minLevel: 40, unit: 'btl' },
    { id: 'inv-am-002', sku: 'AM-002', name: 'Conditioner 300ml', category: 'AMENITY' as const, onHand: 55, minLevel: 40, unit: 'btl' },
    { id: 'inv-am-003', sku: 'AM-003', name: 'Body Wash 300ml', category: 'AMENITY' as const, onHand: 58, minLevel: 40, unit: 'btl' },
    { id: 'inv-am-004', sku: 'AM-004', name: 'Hand Soap Bar', category: 'AMENITY' as const, onHand: 72, minLevel: 50, unit: 'pcs' },
    { id: 'inv-am-005', sku: 'AM-005', name: 'Toothbrush Set', category: 'AMENITY' as const, onHand: 30, minLevel: 25, unit: 'set' },
    { id: 'inv-am-006', sku: 'AM-006', name: 'Dental Kit', category: 'AMENITY' as const, onHand: 28, minLevel: 25, unit: 'set' },
    { id: 'inv-am-007', sku: 'AM-007', name: 'Razor Set', category: 'AMENITY' as const, onHand: 20, minLevel: 18, unit: 'set' },
    { id: 'inv-am-008', sku: 'AM-008', name: 'Cotton Buds', category: 'AMENITY' as const, onHand: 40, minLevel: 30, unit: 'pck' },
    { id: 'inv-am-009', sku: 'AM-009', name: 'Sewing Kit', category: 'AMENITY' as const, onHand: 15, minLevel: 12, unit: 'set' },
    // FNB
    { id: 'inv-fb-001', sku: 'FB-001', name: 'Mineral Water 600ml', category: 'FNB' as const, onHand: 144, minLevel: 100, unit: 'btl' },
    { id: 'inv-fb-002', sku: 'FB-002', name: 'Mineral Water 1500ml', category: 'FNB' as const, onHand: 48, minLevel: 36, unit: 'btl' },
    { id: 'inv-fb-003', sku: 'FB-003', name: 'Instant Coffee Sachet', category: 'FNB' as const, onHand: 120, minLevel: 80, unit: 'pcs' },
    { id: 'inv-fb-004', sku: 'FB-004', name: 'Tea Bag Assorted', category: 'FNB' as const, onHand: 96, minLevel: 60, unit: 'pcs' },
    { id: 'inv-fb-005', sku: 'FB-005', name: 'Sugar Sachet', category: 'FNB' as const, onHand: 200, minLevel: 150, unit: 'pcs' },
    { id: 'inv-fb-006', sku: 'FB-006', name: 'Creamer Sachet', category: 'FNB' as const, onHand: 180, minLevel: 120, unit: 'pcs' },
    { id: 'inv-fb-007', sku: 'FB-007', name: 'Snack Bar', category: 'FNB' as const, onHand: 12, minLevel: 20, unit: 'pcs' }, // BELOW MIN
    { id: 'inv-fb-008', sku: 'FB-008', name: 'Candy Assorted', category: 'FNB' as const, onHand: 60, minLevel: 48, unit: 'pcs' },
    // MAINTENANCE
    { id: 'inv-mt-001', sku: 'MT-001', name: 'LED Bulb E27 9W', category: 'MAINTENANCE' as const, onHand: 6, minLevel: 10, unit: 'pcs' }, // BELOW MIN
    { id: 'inv-mt-002', sku: 'MT-002', name: 'Toilet Bowl Cleaner', category: 'MAINTENANCE' as const, onHand: 8, minLevel: 6, unit: 'btl' },
    { id: 'inv-mt-003', sku: 'MT-003', name: 'Multipurpose Cleaner', category: 'MAINTENANCE' as const, onHand: 10, minLevel: 8, unit: 'btl' },
    { id: 'inv-mt-004', sku: 'MT-004', name: 'Mosquito Coil', category: 'MAINTENANCE' as const, onHand: 20, minLevel: 15, unit: 'box' },
    { id: 'inv-mt-005', sku: 'MT-005', name: 'Silicone Sealant', category: 'MAINTENANCE' as const, onHand: 4, minLevel: 3, unit: 'tube' },
    { id: 'inv-mt-006', sku: 'MT-006', name: 'Touch-Up Paint (White)', category: 'MAINTENANCE' as const, onHand: 3, minLevel: 2, unit: 'can' },
  ]

  for (const item of inventoryData) {
    await prisma.inventoryItem.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, villaId: villa.id },
    })
  }
  console.log('✅ Inventory items created:', inventoryData.length, '(3 below minimum)')

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const tasksData = [
    { id: 'task-01', title: 'Fix leaking faucet in FR-03 bathroom', type: 'MAINTENANCE' as const, location: 'Heliconia Room – Bathroom', priority: 'HIGH' as const, status: 'IN_PROGRESS' as const, assignedTo: 'Komang Darma', dueDate: new Date('2026-05-06') },
    { id: 'task-02', title: 'Deep clean FR-03 after checkout', type: 'CLEANING' as const, location: 'Heliconia Room', priority: 'HIGH' as const, status: 'PENDING' as const, assignedTo: 'Wayan Surata', dueDate: new Date('2026-05-05') },
    { id: 'task-03', title: 'Replace AC filter in FR-05', type: 'MAINTENANCE' as const, location: 'Hibiscus Room', priority: 'MED' as const, status: 'IN_PROGRESS' as const, assignedTo: 'Komang Darma', dueDate: new Date('2026-05-07') },
    { id: 'task-04', title: 'Weekly pool maintenance – backwash and chemical balance', type: 'MAINTENANCE' as const, location: 'Main Pool', priority: 'MED' as const, status: 'DONE' as const, assignedTo: 'Komang Darma', dueDate: new Date('2026-05-04') },
    { id: 'task-05', title: 'Turndown service – FR-01 & FR-04', type: 'CLEANING' as const, location: 'Frangipani Suite & Plumeria Villa', priority: 'LOW' as const, status: 'DONE' as const, assignedTo: 'Putu Adiasa', dueDate: new Date('2026-05-05') },
    { id: 'task-06', title: 'Repaint garden fence near spa pavilion', type: 'MAINTENANCE' as const, location: 'Garden / Spa Pavilion', priority: 'LOW' as const, status: 'PENDING' as const, assignedTo: 'Komang Darma', dueDate: new Date('2026-05-10') },
  ]

  for (const t of tasksData) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t, villaId: villa.id },
    })
  }
  console.log('✅ Tasks created:', tasksData.length)

  // ── SOPs ───────────────────────────────────────────────────────────────────
  const sopsData = [
    {
      id: 'sop-01',
      title: 'Daily Room Cleaning',
      category: 'HOUSEKEEPING' as const,
      estimatedMinutes: 60,
      steps: [
        { step: 1, action: 'Knock and announce before entering the room' },
        { step: 2, action: 'Strip and replace all bed linen and pillow cases' },
        { step: 3, action: 'Dust all surfaces, furniture, and fixtures' },
        { step: 4, action: 'Clean and sanitize bathroom — toilet, sink, shower, and floor' },
        { step: 5, action: 'Replace used amenities and restock minibar items' },
        { step: 6, action: 'Vacuum carpet or mop hard floor' },
        { step: 7, action: 'Take out trash and replace bin liner' },
        { step: 8, action: 'Final inspection: check A/C temp, lights, and TV remote' },
      ],
    },
    {
      id: 'sop-02',
      title: 'Standard Check-In Procedure',
      category: 'FRONT_DESK' as const,
      estimatedMinutes: 20,
      steps: [
        { step: 1, action: 'Greet guest with welcome drink and warm towel' },
        { step: 2, action: 'Verify booking reference and guest ID (KTP/Passport)' },
        { step: 3, action: 'Explain villa facilities, breakfast hours, and emergency contacts' },
        { step: 4, action: 'Collect payment or confirm payment status' },
        { step: 5, action: 'Escort guest to room and demonstrate key card, A/C, and safe' },
        { step: 6, action: 'Update reservation status to CHECKEDIN in the system' },
      ],
    },
    {
      id: 'sop-03',
      title: 'Pool Maintenance Weekly',
      category: 'MAINTENANCE' as const,
      estimatedMinutes: 90,
      steps: [
        { step: 1, action: 'Test water pH (target 7.2–7.6) and chlorine levels (1–3 ppm)' },
        { step: 2, action: 'Backwash the filter for 3–5 minutes' },
        { step: 3, action: 'Brush pool walls, steps, and floor' },
        { step: 4, action: 'Vacuum pool floor using pool vacuum head' },
        { step: 5, action: 'Shock treat with pool chlorine shock if cloudy' },
        { step: 6, action: 'Add algaecide and balancing chemicals as needed' },
        { step: 7, action: 'Log water test results in the maintenance logbook' },
      ],
    },
    {
      id: 'sop-04',
      title: 'Lost & Found Handling',
      category: 'FRONT_DESK' as const,
      estimatedMinutes: 15,
      steps: [
        { step: 1, action: 'Record item details: description, location found, date, and finder name' },
        { step: 2, action: 'Log item in the Lost & Found register in the system' },
        { step: 3, action: 'Store item in the designated L&F secure cabinet (front desk)' },
        { step: 4, action: 'If guest is still checked in, notify them immediately' },
        { step: 5, action: 'If guest has checked out, contact via phone or email within 24 hours' },
        { step: 6, action: 'Update status to CLAIMED once item is returned; document with signature' },
      ],
    },
    {
      id: 'sop-05',
      title: 'Inventory Stock Take',
      category: 'INVENTORY' as const,
      estimatedMinutes: 120,
      steps: [
        { step: 1, action: 'Print or open stock take sheet for all four categories' },
        { step: 2, action: 'Count physical stock in storage room — linen, amenities, F&B, maintenance' },
        { step: 3, action: 'Record actual count against system quantity' },
        { step: 4, action: 'Identify and flag items below minimum stock level' },
        { step: 5, action: 'Update system quantities via Stock Movement (IN/OUT adjustments)' },
        { step: 6, action: 'Submit restock request to manager for items below minimum' },
      ],
    },
    {
      id: 'sop-06',
      title: 'Emergency Response',
      category: 'SAFETY' as const,
      estimatedMinutes: 10,
      steps: [
        { step: 1, action: 'Stay calm and assess the situation before acting' },
        { step: 2, action: 'Contact the Emergency Response Team leader immediately' },
        { step: 3, action: 'Call emergency services if required: Police 110, Ambulance 118, Fire 113' },
        { step: 4, action: 'Evacuate guests to the designated muster point (main parking area)' },
        { step: 5, action: 'Account for all guests and staff using the guest register' },
        { step: 6, action: 'Do not re-enter building until cleared by emergency services' },
        { step: 7, action: 'File incident report with management within 2 hours of incident' },
      ],
    },
  ]

  for (const sop of sopsData) {
    await prisma.sOP.upsert({
      where: { id: sop.id },
      update: {},
      create: { ...sop, villaId: villa.id },
    })
  }
  console.log('✅ SOPs created:', sopsData.length)

  // ── April 2026 Transactions ─────────────────────────────────────────────────
  // Revenue target: 84,200,000 IDR  /  Expense target: 31,600,000 IDR
  const transactionsData = [
    // INCOME — Room Revenue (from paid checkouts/checkins in April)
    { id: 'txn-r-01', date: new Date('2026-04-22'), type: 'INCOME' as const, description: 'Room Revenue – Dewi Rahayu, FR-02 (3 nights)', amount: 5700000, category: 'Room Revenue', paymentStatus: 'PAID' as const, reservationId: 'res-03' },
    { id: 'txn-r-02', date: new Date('2026-04-25'), type: 'INCOME' as const, description: 'Room Revenue – Made Suartana, FR-03 (3 nights)', amount: 6300000, category: 'Room Revenue', paymentStatus: 'PAID' as const, reservationId: 'res-05' },
    { id: 'txn-r-03', date: new Date('2026-04-30'), type: 'INCOME' as const, description: 'Room Revenue – Gede Mahendra, FR-03 (2 nights)', amount: 4200000, category: 'Room Revenue', paymentStatus: 'PAID' as const, reservationId: 'res-06' },
    { id: 'txn-r-04', date: new Date('2026-04-21'), type: 'INCOME' as const, description: 'Room Revenue – Wayan Sudiarta, FR-05 (3 nights)', amount: 5700000, category: 'Room Revenue', paymentStatus: 'PAID' as const, reservationId: 'res-09' },
    { id: 'txn-r-05', date: new Date('2026-04-22'), type: 'INCOME' as const, description: 'Room Revenue – Ni Made Krisna, FR-06 (3 nights)', amount: 7200000, category: 'Room Revenue', paymentStatus: 'PAID' as const, reservationId: 'res-11' },
    { id: 'txn-r-06', date: new Date('2026-04-24'), type: 'INCOME' as const, description: 'Room Revenue – Budi Santoso, FR-01 (3 nights)', amount: 7200000, category: 'Room Revenue', paymentStatus: 'PAID' as const, reservationId: 'res-01' },
    { id: 'txn-r-07', date: new Date('2026-04-23'), type: 'INCOME' as const, description: 'Room Revenue – Nyoman Sari, FR-04 (4 nights)', amount: 12800000, category: 'Room Revenue', paymentStatus: 'PAID' as const, reservationId: 'res-07' },
    // INCOME — F&B
    { id: 'txn-fb-01', date: new Date('2026-04-15'), type: 'INCOME' as const, description: 'Restaurant & Bar Revenue – Week 1', amount: 4200000, category: 'F&B', paymentStatus: 'PAID' as const },
    { id: 'txn-fb-02', date: new Date('2026-04-22'), type: 'INCOME' as const, description: 'Restaurant & Bar Revenue – Week 2', amount: 3900000, category: 'F&B', paymentStatus: 'PAID' as const },
    { id: 'txn-fb-03', date: new Date('2026-04-29'), type: 'INCOME' as const, description: 'Restaurant & Bar Revenue – Week 3&4', amount: 5500000, category: 'F&B', paymentStatus: 'PAID' as const },
    // INCOME — Spa & Services
    { id: 'txn-sp-01', date: new Date('2026-04-10'), type: 'INCOME' as const, description: 'Spa Treatment Revenue – Week 1–2', amount: 6800000, category: 'Spa & Services', paymentStatus: 'PAID' as const },
    { id: 'txn-sp-02', date: new Date('2026-04-25'), type: 'INCOME' as const, description: 'Spa Treatment Revenue – Week 3–4', amount: 7400000, category: 'Spa & Services', paymentStatus: 'PAID' as const },
    // INCOME — Other
    { id: 'txn-ot-01', date: new Date('2026-04-30'), type: 'INCOME' as const, description: 'Event & Function Hire – April', amount: 7200000, category: 'Events', paymentStatus: 'PAID' as const },

    // EXPENSES — Staff Salaries
    { id: 'txn-ex-01', date: new Date('2026-04-30'), type: 'EXPENSE' as const, description: 'Staff Salaries – April 2026 (4 staff)', amount: 14400000, category: 'Salaries', paymentStatus: 'PAID' as const },
    // EXPENSES — Utilities
    { id: 'txn-ex-02', date: new Date('2026-04-30'), type: 'EXPENSE' as const, description: 'Electricity Bill – April', amount: 3200000, category: 'Utilities', paymentStatus: 'PAID' as const },
    { id: 'txn-ex-03', date: new Date('2026-04-30'), type: 'EXPENSE' as const, description: 'Water Bill – April', amount: 850000, category: 'Utilities', paymentStatus: 'PAID' as const },
    { id: 'txn-ex-04', date: new Date('2026-04-30'), type: 'EXPENSE' as const, description: 'Internet & Phone – April', amount: 450000, category: 'Utilities', paymentStatus: 'PAID' as const },
    // EXPENSES — Supplies
    { id: 'txn-ex-05', date: new Date('2026-04-05'), type: 'EXPENSE' as const, description: 'Amenity Restock – Shampoo, Conditioner, Bath Wash', amount: 2800000, category: 'Supplies', paymentStatus: 'PAID' as const },
    { id: 'txn-ex-06', date: new Date('2026-04-12'), type: 'EXPENSE' as const, description: 'Linen Replacement – Towels & Bed Sheets', amount: 3100000, category: 'Supplies', paymentStatus: 'PAID' as const },
    // EXPENSES — F&B Cost
    { id: 'txn-ex-07', date: new Date('2026-04-30'), type: 'EXPENSE' as const, description: 'F&B Ingredients & Beverages – April', amount: 4200000, category: 'F&B Cost', paymentStatus: 'PAID' as const },
    // EXPENSES — Maintenance
    { id: 'txn-ex-08', date: new Date('2026-04-18'), type: 'EXPENSE' as const, description: 'Pool Chemicals & Supplies – April', amount: 1200000, category: 'Maintenance', paymentStatus: 'PAID' as const },
    { id: 'txn-ex-09', date: new Date('2026-04-22'), type: 'EXPENSE' as const, description: 'AC Filter Replacement – FR-05', amount: 750000, category: 'Maintenance', paymentStatus: 'PAID' as const },
    { id: 'txn-ex-10', date: new Date('2026-04-30'), type: 'EXPENSE' as const, description: 'General Maintenance Parts & Repairs', amount: 650000, category: 'Maintenance', paymentStatus: 'UNPAID' as const },
  ]

  for (const t of transactionsData) {
    const { reservationId, ...rest } = t
    await prisma.transaction.upsert({
      where: { id: t.id },
      update: {},
      create: {
        ...rest,
        villaId: villa.id,
        ...(reservationId ? { reservationId } : {}),
      },
    })
  }

  const totalRevenue = transactionsData.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactionsData.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
  console.log(
    `✅ Transactions created: ${transactionsData.length} | Revenue: Rp${(totalRevenue / 1e6).toFixed(1)}M | Expenses: Rp${(totalExpenses / 1e6).toFixed(1)}M`
  )

  // ── Subscription ───────────────────────────────────────────────────────────
  await prisma.subscription.upsert({
    where: { villaId: villa.id },
    update: {},
    create: {
      villaId: villa.id,
      plan: 'FREE',
      status: 'ACTIVE',
      startDate: new Date('2026-01-01'),
    },
  })
  console.log('✅ Subscription created: FREE plan, ACTIVE')

  console.log('\n🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
