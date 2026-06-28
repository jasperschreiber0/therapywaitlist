const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clinics = [
    {
      name: 'Eastern Suburbs Therapy Group',
      address: '12 Oxford St, Bondi Junction NSW 2022',
      suburb: 'Bondi Junction',
      lat: -33.8914, lng: 151.2512,
      phone: '(02) 9300 1111',
      ndis_registered: true, bulk_billing: false, private_health: true,
      availability: [
        { discipline: 'OT', intake_status: 'OPEN', age_bands_served: ['4-7', '8-12'], wait_time_band: 'ONE_TWO_WEEKS', capacity_level: 'HIGH', confidence_score: 1.0 },
        { discipline: 'SPEECH', intake_status: 'LIMITED', age_bands_served: ['0-3', '4-7'], wait_time_band: 'TWO_FOUR_WEEKS', capacity_level: 'MEDIUM', confidence_score: 0.9, monthly_referral_cap: 3 },
      ],
      admin: { name: 'Sarah Mitchell', email: 'admin@estg.com.au', phone: '0411 222 333', is_primary_contact: true },
    },
    {
      name: 'Randwick Children\'s Allied Health',
      address: '88 Belmore Rd, Randwick NSW 2031',
      suburb: 'Randwick',
      lat: -33.9145, lng: 151.2410,
      phone: '(02) 9300 2222',
      ndis_registered: true, bulk_billing: true, private_health: true,
      availability: [
        { discipline: 'PSYCHOLOGY', intake_status: 'OPEN', age_bands_served: ['8-12', '13-18'], wait_time_band: 'UNDER_1_WEEK', capacity_level: 'HIGH', confidence_score: 1.0 },
        { discipline: 'OT', intake_status: 'CLOSED', age_bands_served: ['4-7', '8-12', '13-18'], wait_time_band: 'EIGHT_PLUS_WEEKS', capacity_level: 'LOW', confidence_score: 0.8 },
      ],
      admin: { name: 'James Patel', email: 'admin@rcah.com.au', phone: '0422 333 444', is_primary_contact: true },
    },
    {
      name: 'Maroubra Kids Therapy',
      address: '201 Maroubra Rd, Maroubra NSW 2035',
      suburb: 'Maroubra',
      lat: -33.9496, lng: 151.2432,
      phone: '(02) 9300 3333',
      ndis_registered: false, bulk_billing: false, private_health: true,
      availability: [
        { discipline: 'SPEECH', intake_status: 'OPEN', age_bands_served: ['0-3', '4-7', '8-12'], wait_time_band: 'TWO_FOUR_WEEKS', capacity_level: 'MEDIUM', confidence_score: 0.7 },
      ],
      admin: { name: 'Lisa Chen', email: 'admin@mkt.com.au', phone: '0433 444 555', is_primary_contact: true },
    },
    {
      name: 'Coogee Paediatric Centre',
      address: '45 Coogee Bay Rd, Coogee NSW 2034',
      suburb: 'Coogee',
      lat: -33.9226, lng: 151.2571,
      phone: '(02) 9300 4444',
      ndis_registered: true, bulk_billing: false, private_health: false,
      availability: [
        { discipline: 'OT', intake_status: 'OPEN', age_bands_served: ['0-3', '4-7', '8-12', '13-18'], wait_time_band: 'FOUR_EIGHT_WEEKS', capacity_level: 'LOW', confidence_score: 0.4 },
        { discipline: 'PSYCHOLOGY', intake_status: 'LIMITED', age_bands_served: ['13-18'], wait_time_band: 'TWO_FOUR_WEEKS', capacity_level: 'MEDIUM', confidence_score: 0.7, monthly_referral_cap: 2 },
      ],
      admin: { name: 'Tom Reynolds', email: 'admin@cpc.com.au', phone: '0444 555 666', is_primary_contact: true },
    },
    {
      name: 'Paddington Allied Health Hub',
      address: '320 Oxford St, Paddington NSW 2021',
      suburb: 'Paddington',
      lat: -33.8843, lng: 151.2266,
      phone: '(02) 9300 5555',
      ndis_registered: true, bulk_billing: true, private_health: true,
      availability: [
        { discipline: 'OT', intake_status: 'OPEN', age_bands_served: ['4-7', '8-12'], wait_time_band: 'UNDER_1_WEEK', capacity_level: 'HIGH', confidence_score: 1.0 },
        { discipline: 'SPEECH', intake_status: 'OPEN', age_bands_served: ['0-3', '4-7'], wait_time_band: 'ONE_TWO_WEEKS', capacity_level: 'HIGH', confidence_score: 0.9 },
        { discipline: 'PSYCHOLOGY', intake_status: 'CLOSED', age_bands_served: ['8-12', '13-18'], wait_time_band: 'EIGHT_PLUS_WEEKS', capacity_level: 'LOW', confidence_score: 0.0 },
      ],
      admin: { name: 'Anna Walsh', email: 'admin@pahh.com.au', phone: '0455 666 777', is_primary_contact: true },
    },
  ];

  for (const { admin, availability, ...clinicData } of clinics) {
    const clinic = await prisma.clinic.create({
      data: {
        ...clinicData,
        admins: { create: admin },
        availability: { create: availability.map((a) => ({ ...a, updated_by: 'ADMIN' })) },
      },
    });
    console.log(`Created clinic: ${clinic.name}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
