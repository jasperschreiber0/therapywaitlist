const request = require('supertest');
const app = require('../index');
const prisma = require('../lib/prisma');

const makeAO = (overrides = {}) => ({
  id: 'ao-1',
  discipline: 'OT',
  intake_status: 'OPEN',
  age_bands_served: ['4-7', '8-12'],
  wait_time_band: 'ONE_TWO_WEEKS',
  capacity_level: 'HIGH',
  confidence_score: 1.0,
  last_updated: new Date(),
  clinic: {
    id: 'clinic-1',
    name: 'Test Clinic',
    suburb: 'Bondi Junction',
    lat: -33.8914,
    lng: 151.2512,
    ndis_registered: true,
  },
  ...overrides,
});

const validBody = {
  disciplines: ['OT'],
  child_age: 7,
  urgency_score: 5,
  suburb: 'Bondi Junction',
  radius_km: 10,
};

describe('POST /api/search', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty results when no clinics in range', async () => {
    prisma.availabilityObject.findMany.mockResolvedValue([]);
    const res = await request(app).post('/api/search').send(validBody);
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(0);
  });

  it('excludes records with confidence_score = 0.0', async () => {
    prisma.availabilityObject.findMany.mockResolvedValue([makeAO({ confidence_score: 0.0 })]);
    const res = await request(app).post('/api/search').send(validBody);
    expect(res.body.results).toHaveLength(0);
  });

  it('excludes records where child age is outside age_bands_served', async () => {
    prisma.availabilityObject.findMany.mockResolvedValue([makeAO({ age_bands_served: ['13-18'] })]);
    const res = await request(app).post('/api/search').send({ ...validBody, child_age: 7 });
    expect(res.body.results).toHaveLength(0);
  });

  it('ranks by composite_score descending', async () => {
    prisma.availabilityObject.findMany.mockResolvedValue([
      makeAO({ id: 'ao-1', capacity_level: 'LOW' }),
      makeAO({ id: 'ao-2', capacity_level: 'HIGH' }),
    ]);
    const res = await request(app).post('/api/search').send(validBody);
    expect(res.body.results[0].composite_score).toBeGreaterThanOrEqual(res.body.results[1].composite_score);
  });

  it('returns waitlist_options when include_waitlist is true', async () => {
    prisma.availabilityObject.findMany.mockResolvedValue([
      makeAO({ intake_status: 'CLOSED' }),
    ]);
    const res = await request(app)
      .post('/api/search')
      .send({ ...validBody, include_waitlist: true });
    expect(res.body.waitlist_options).toHaveLength(1);
    expect(res.body.results).toHaveLength(0);
  });

  it('returns 400 for unknown suburb', async () => {
    const res = await request(app).post('/api/search').send({ ...validBody, suburb: 'Atlantis' });
    expect(res.status).toBe(400);
  });
});
