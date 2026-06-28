const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const prisma = require('../lib/prisma');

const SECRET = 'test-secret';
const AO_ID = 'ao-test-1';

function makeToken(payload, options = {}) {
  return jwt.sign(payload, SECRET, { expiresIn: '24h', ...options });
}

describe('GET /api/freshness/confirm/:token', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resets confidence_score to 1.0 on valid token', async () => {
    const token = makeToken({ availabilityObjectId: AO_ID, action: 'confirm' });
    prisma.freshnessPrompt.findFirst.mockResolvedValue({ id: 'fp-1' });
    prisma.availabilityObject.update.mockResolvedValue({});
    prisma.freshnessPrompt.update.mockResolvedValue({});

    const res = await request(app).get(`/api/freshness/confirm/${token}`);
    expect(res.status).toBe(302);
    expect(prisma.availabilityObject.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: AO_ID },
        data: expect.objectContaining({ confidence_score: 1.0 }),
      })
    );
  });

  it('returns 401 for expired token', async () => {
    const token = makeToken({ availabilityObjectId: AO_ID, action: 'confirm' }, { expiresIn: '0s' });
    await new Promise((r) => setTimeout(r, 100));
    const res = await request(app).get(`/api/freshness/confirm/${token}`);
    expect(res.status).toBe(401);
  });
});
