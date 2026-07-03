/**
 * StayFinder — Database Seed Script
 * Idempotent seed data for development and testing
 * 
 * Usage: node prisma/seed.js
 */

const { PrismaClient } = require('./generated/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Seed Data ───────────────────────────────────────────────────────────────

const PASSWORD_HASH = bcrypt.hashSync('Test@1234', 12);

const users = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Aarav Sharma',
    email: 'aarav@guest.com',
    passwordHash: PASSWORD_HASH,
    role: 'guest',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    phone: '+91-9876543210',
    emailVerified: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Priya Patel',
    email: 'priya@guest.com',
    passwordHash: PASSWORD_HASH,
    role: 'guest',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    phone: '+91-9876543211',
    emailVerified: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Rohan Verma',
    email: 'rohan@guest.com',
    passwordHash: PASSWORD_HASH,
    role: 'guest',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    phone: '+91-9876543212',
    emailVerified: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Meera Krishnan',
    email: 'meera@host.com',
    passwordHash: PASSWORD_HASH,
    role: 'host',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    phone: '+91-9876543213',
    emailVerified: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Vikram Singh',
    email: 'vikram@host.com',
    passwordHash: PASSWORD_HASH,
    role: 'host',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    phone: '+91-9876543214',
    emailVerified: true,
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'Admin User',
    email: 'admin@stayfinder.com',
    passwordHash: PASSWORD_HASH,
    role: 'admin',
    avatarUrl: null,
    phone: '+91-9876543200',
    emailVerified: true,
  },
];

const listings = [
  {
    id: 'aaaa1111-1111-1111-1111-111111111111',
    hostId: '44444444-4444-4444-4444-444444444444',
    title: 'Luxury Beachfront Villa in Goa',
    description: 'Wake up to the sound of waves in this stunning beachfront villa. Features a private pool, lush tropical garden, and direct beach access. Perfect for families or groups looking for a serene coastal escape with modern amenities and traditional Goan charm.',
    type: 'entire_place',
    address: '42 Calangute Beach Road, Bardez',
    city: 'Goa',
    country: 'India',
    latitude: 15.5449,
    longitude: 73.7554,
    pricePerNight: 12500,
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3,
    amenities: JSON.stringify(['wifi', 'pool', 'parking', 'kitchen', 'air_conditioning', 'beach_access', 'garden', 'bbq']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80',
      'https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=800&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    ]),
  },
  {
    id: 'aaaa2222-2222-2222-2222-222222222222',
    hostId: '44444444-4444-4444-4444-444444444444',
    title: 'Cozy Heritage Haveli Room in Jaipur',
    description: 'Step back in time in this beautifully restored haveli room in the heart of the Pink City. Featuring traditional Rajasthani decor, hand-painted walls, a courtyard view, and modern comforts. Walking distance to Hawa Mahal and the bustling bazaars.',
    type: 'private_room',
    address: '15 Johari Bazaar, Old City',
    city: 'Jaipur',
    country: 'India',
    latitude: 26.9124,
    longitude: 75.7873,
    pricePerNight: 3500,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: JSON.stringify(['wifi', 'air_conditioning', 'breakfast', 'courtyard', 'heritage']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
    ]),
  },
  {
    id: 'aaaa3333-3333-3333-3333-333333333333',
    hostId: '55555555-5555-5555-5555-555555555555',
    title: 'Modern Studio Apartment in Mumbai',
    description: 'Sleek, minimalist studio in the heart of Bandra West. Floor-to-ceiling windows with stunning sea-link views. Fully equipped kitchen, high-speed wifi perfect for remote work, and steps away from trendy cafes and nightlife.',
    type: 'entire_place',
    address: '88 Carter Road, Bandra West',
    city: 'Mumbai',
    country: 'India',
    latitude: 19.0596,
    longitude: 72.8295,
    pricePerNight: 5500,
    maxGuests: 3,
    bedrooms: 1,
    bathrooms: 1,
    amenities: JSON.stringify(['wifi', 'air_conditioning', 'kitchen', 'gym', 'elevator', 'washer', 'workspace']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80',
    ]),
  },
  {
    id: 'aaaa4444-4444-4444-4444-444444444444',
    hostId: '55555555-5555-5555-5555-555555555555',
    title: 'Treehouse Retreat in Wayanad',
    description: 'Escape to the canopy in this unique treehouse nestled in a spice plantation. Fall asleep to the sounds of the forest, wake up to misty mountain views. Includes a private sit-out, bamboo interiors, and authentic Kerala cuisine upon request.',
    type: 'entire_place',
    address: 'Vythiri Spice Plantation, Kalpetta Road',
    city: 'Wayanad',
    country: 'India',
    latitude: 11.6854,
    longitude: 76.1320,
    pricePerNight: 4500,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: JSON.stringify(['wifi', 'breakfast', 'parking', 'nature', 'treehouse', 'mountain_view']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
      'https://images.unsplash.com/photo-1618767689160-da3fb810aad7?w=800&q=80',
      'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80',
    ]),
  },
  {
    id: 'aaaa5555-5555-5555-5555-555555555555',
    hostId: '44444444-4444-4444-4444-444444444444',
    title: 'Houseboat Experience on Dal Lake',
    description: 'Live on the water in this beautifully carved traditional Kashmiri houseboat on Dal Lake. Enjoy shikara rides, floating markets, and breathtaking Himalayan sunsets. Includes a furnished living room, hand-carved walnut wood interiors, and home-cooked Kashmiri wazwan.',
    type: 'entire_place',
    address: 'Boulevard Road, Dal Lake',
    city: 'Srinagar',
    country: 'India',
    latitude: 34.0837,
    longitude: 74.7973,
    pricePerNight: 6000,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    amenities: JSON.stringify(['wifi', 'breakfast', 'lake_view', 'shikara', 'traditional', 'heating']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
    ]),
  },
  {
    id: 'aaaa6666-6666-6666-6666-666666666666',
    hostId: '55555555-5555-5555-5555-555555555555',
    title: 'Budget-Friendly Dorm Bed in Mumbai Hostel',
    description: 'Clean, modern shared dorm in South Mumbai backpacker hostel. Pod-style beds with privacy curtains, USB charging, reading lights, and personal lockers. Common area with rooftop views of the city. Great for solo travelers exploring the Gateway of India and Colaba.',
    type: 'shared_room',
    address: '5 Colaba Causeway, Near Gateway',
    city: 'Mumbai',
    country: 'India',
    latitude: 18.9220,
    longitude: 72.8347,
    pricePerNight: 1500,
    maxGuests: 1,
    bedrooms: 1,
    bathrooms: 1,
    amenities: JSON.stringify(['wifi', 'locker', 'common_area', 'rooftop', 'laundry']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    ]),
  },
  {
    id: 'aaaa7777-7777-7777-7777-777777777777',
    hostId: '44444444-4444-4444-4444-444444444444',
    title: 'Palatial Suite at Heritage Fort in Jaipur',
    description: 'Experience royal living in this opulent suite within a 300-year-old converted fort. Features antique furnishings, a marble bathroom with rain shower, private terrace overlooking the Aravalli hills, and access to the fort\'s pool, spa, and dining areas.',
    type: 'private_room',
    address: 'Nahargarh Fort Road, Amer',
    city: 'Jaipur',
    country: 'India',
    latitude: 26.9376,
    longitude: 75.8135,
    pricePerNight: 15000,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: JSON.stringify(['wifi', 'pool', 'spa', 'parking', 'air_conditioning', 'restaurant', 'room_service', 'heritage']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
    ]),
  },
  {
    id: 'aaaa8888-8888-8888-8888-888888888888',
    hostId: '55555555-5555-5555-5555-555555555555',
    title: 'Clifftop Beach Cottage in Goa',
    description: 'Charming Portuguese-style cottage perched on cliffs above Vagator Beach. Whitewashed walls, terracotta tiles, hammock-draped verandah, and unobstructed sunset views. Equipped with a kitchenette and surrounded by bougainvillea and frangipani.',
    type: 'entire_place',
    address: 'Cliff View Road, Vagator',
    city: 'Goa',
    country: 'India',
    latitude: 15.5963,
    longitude: 73.7350,
    pricePerNight: 7500,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    amenities: JSON.stringify(['wifi', 'parking', 'kitchen', 'garden', 'sea_view', 'hammock']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80',
    ]),
  },
  {
    id: 'aaaa9999-9999-9999-9999-999999999999',
    hostId: '44444444-4444-4444-4444-444444444444',
    title: 'Mountain Cabin in Manali',
    description: 'Cozy wooden cabin surrounded by cedar trees with panoramic views of the Kullu Valley. Stone fireplace, heated floors, and a sun-drenched deck for morning yoga. Minutes from Old Manali cafes and Solang Valley adventure sports.',
    type: 'entire_place',
    address: 'Log Huts Road, Old Manali',
    city: 'Manali',
    country: 'India',
    latitude: 32.2396,
    longitude: 77.1887,
    pricePerNight: 4000,
    maxGuests: 5,
    bedrooms: 2,
    bathrooms: 1,
    amenities: JSON.stringify(['wifi', 'fireplace', 'parking', 'kitchen', 'mountain_view', 'heating', 'deck']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80',
      'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&q=80',
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80',
      'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800&q=80',
    ]),
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    hostId: '55555555-5555-5555-5555-555555555555',
    title: 'Luxury Penthouse with City Views in Mumbai',
    description: 'Ultra-premium penthouse apartment in Worli with 270-degree views of the Arabian Sea and Mumbai skyline. Features designer interiors, smart home automation, a private home theatre, wine cellar, and access to building amenities including infinity pool and concierge.',
    type: 'entire_place',
    address: 'Worli Sea Face, Tower B, 42nd Floor',
    city: 'Mumbai',
    country: 'India',
    latitude: 19.0176,
    longitude: 72.8151,
    pricePerNight: 25000,
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 3,
    amenities: JSON.stringify(['wifi', 'pool', 'gym', 'parking', 'air_conditioning', 'kitchen', 'elevator', 'concierge', 'sea_view', 'smart_home']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    ]),
  },
];

const bookings = [
  {
    id: 'bbbb1111-1111-1111-1111-111111111111',
    guestId: '11111111-1111-1111-1111-111111111111',
    listingId: 'aaaa1111-1111-1111-1111-111111111111',
    checkIn: new Date('2026-07-01'),
    checkOut: new Date('2026-07-05'),
    guests: 4,
    totalPrice: 50000, // 4 nights × ₹12,500
    status: 'confirmed',
  },
  {
    id: 'bbbb2222-2222-2222-2222-222222222222',
    guestId: '22222222-2222-2222-2222-222222222222',
    listingId: 'aaaa3333-3333-3333-3333-333333333333',
    checkIn: new Date('2026-06-20'),
    checkOut: new Date('2026-06-25'),
    guests: 2,
    totalPrice: 27500, // 5 nights × ₹5,500
    status: 'pending',
  },
  {
    id: 'bbbb3333-3333-3333-3333-333333333333',
    guestId: '33333333-3333-3333-3333-333333333333',
    listingId: 'aaaa2222-2222-2222-2222-222222222222',
    checkIn: new Date('2026-05-10'),
    checkOut: new Date('2026-05-14'),
    guests: 2,
    totalPrice: 14000, // 4 nights × ₹3,500
    status: 'completed',
  },
  {
    id: 'bbbb4444-4444-4444-4444-444444444444',
    guestId: '11111111-1111-1111-1111-111111111111',
    listingId: 'aaaa4444-4444-4444-4444-444444444444',
    checkIn: new Date('2026-08-15'),
    checkOut: new Date('2026-08-18'),
    guests: 2,
    totalPrice: 13500, // 3 nights × ₹4,500
    status: 'confirmed',
  },
  {
    id: 'bbbb5555-5555-5555-5555-555555555555',
    guestId: '22222222-2222-2222-2222-222222222222',
    listingId: 'aaaa5555-5555-5555-5555-555555555555',
    checkIn: new Date('2026-04-01'),
    checkOut: new Date('2026-04-04'),
    guests: 3,
    totalPrice: 18000, // 3 nights × ₹6,000
    status: 'completed',
  },
  {
    id: 'bbbb6666-6666-6666-6666-666666666666',
    guestId: '33333333-3333-3333-3333-333333333333',
    listingId: 'aaaa9999-9999-9999-9999-999999999999',
    checkIn: new Date('2026-07-10'),
    checkOut: new Date('2026-07-15'),
    guests: 3,
    totalPrice: 20000, // 5 nights × ₹4,000
    status: 'cancelled',
  },
];

const reviews = [
  {
    id: 'cccc1111-1111-1111-1111-111111111111',
    bookingId: 'bbbb3333-3333-3333-3333-333333333333',
    guestId: '33333333-3333-3333-3333-333333333333',
    listingId: 'aaaa2222-2222-2222-2222-222222222222',
    rating: 5,
    comment: 'Absolutely magical stay! The haveli room was like stepping into a Rajasthani fairytale. The hand-painted walls, courtyard breakfast, and proximity to Hawa Mahal made it unforgettable. Meera was an incredible host.',
  },
  {
    id: 'cccc2222-2222-2222-2222-222222222222',
    bookingId: 'bbbb5555-5555-5555-5555-555555555555',
    guestId: '22222222-2222-2222-2222-222222222222',
    listingId: 'aaaa5555-5555-5555-5555-555555555555',
    rating: 4,
    comment: 'Living on the houseboat was a dream come true. The shikara ride to the floating market was the highlight. The only minor issue was spotty wifi, but honestly, it forced us to disconnect and enjoy the stunning views. Would definitely return!',
  },
  {
    id: 'cccc3333-3333-3333-3333-333333333333',
    bookingId: 'bbbb1111-1111-1111-1111-111111111111',
    guestId: '11111111-1111-1111-1111-111111111111',
    listingId: 'aaaa1111-1111-1111-1111-111111111111',
    rating: 4,
    comment: 'The heritage experience was wonderful. Beautifully preserved architecture with thoughtful modern touches. The morning chai in the courtyard with pigeons was picture-perfect. Location is unbeatable for exploring the old city.',
  },
  {
    id: 'cccc4444-4444-4444-4444-444444444444',
    bookingId: 'bbbb4444-4444-4444-4444-444444444444',
    guestId: '11111111-1111-1111-1111-111111111111',
    listingId: 'aaaa4444-4444-4444-4444-444444444444',
    rating: 3,
    comment: 'Good overall experience. The treehouse is charming and the forest views are mesmerizing. However, the water supply was inconsistent on one day and the heating could have been stronger in the evenings. Still a worthwhile experience.',
  },
];

// ─── Seed Function ───────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting StayFinder database seed...\n');

  // Clean existing data (in dependency order)
  console.log('  🗑️  Cleaning existing data...');
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();
  console.log('  ✅ Cleaned.\n');

  // Seed users
  console.log('  👤 Seeding users...');
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
  }
  console.log(`  ✅ ${users.length} users seeded.\n`);

  // Seed listings
  console.log('  🏠 Seeding listings...');
  for (const listing of listings) {
    await prisma.listing.upsert({
      where: { id: listing.id },
      update: listing,
      create: listing,
    });
  }
  console.log(`  ✅ ${listings.length} listings seeded.\n`);

  // Seed bookings
  console.log('  📅 Seeding bookings...');
  for (const booking of bookings) {
    await prisma.booking.upsert({
      where: { id: booking.id },
      update: booking,
      create: booking,
    });
  }
  console.log(`  ✅ ${bookings.length} bookings seeded.\n`);

  // Seed reviews
  console.log('  ⭐ Seeding reviews...');
  for (const review of reviews) {
    await prisma.review.upsert({
      where: { id: review.id },
      update: review,
      create: review,
    });
  }
  console.log(`  ✅ ${reviews.length} reviews seeded.\n`);

  console.log('🎉 Seed completed successfully!\n');
  console.log('  Test Credentials:');
  console.log('  ────────────────');
  console.log('  Guest:  aarav@guest.com  / Test@1234');
  console.log('  Guest:  priya@guest.com  / Test@1234');
  console.log('  Host:   meera@host.com   / Test@1234');
  console.log('  Host:   vikram@host.com  / Test@1234');
  console.log('  Admin:  admin@stayfinder.com / Test@1234\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
