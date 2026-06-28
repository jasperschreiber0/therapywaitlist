const request = require('supertest');
const app = require('../index');

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: JSON.stringify({
          likely_disciplines: ['OT'],
          urgency_score: 5,
          urgency_reasoning: 'Moderate concern.',
          age_appropriate: true,
          referral_notes: 'Child presents with motor difficulties.',
          safeguarding_flag: false,
        }) }],
      }),
    },
  }));
});

describe('POST /api/intake/interpret', () => {
  it('returns 400 for empty text', async () => {
    const res = await request(app).post('/api/intake/interpret').send({ text: '' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for text > 2000 characters', async () => {
    const res = await request(app).post('/api/intake/interpret').send({ text: 'a'.repeat(2001) });
    expect(res.status).toBe(400);
  });

  it('returns structured response for valid input', async () => {
    const res = await request(app)
      .post('/api/intake/interpret')
      .send({ text: '7-year-old with handwriting difficulties, needs OT assessment' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('likely_disciplines');
    expect(res.body).toHaveProperty('urgency_score');
    expect(res.body).toHaveProperty('safeguarding_flag');
    expect(res.body).toHaveProperty('age_appropriate');
  });

  it('returns 503 when Anthropic API fails', async () => {
    const Anthropic = require('@anthropic-ai/sdk');
    Anthropic.mockImplementationOnce(() => ({
      messages: { create: jest.fn().mockRejectedValue(new Error('API error')) },
    }));

    const res = await request(app)
      .post('/api/intake/interpret')
      .send({ text: 'Valid referral text' });

    expect(res.status).toBe(503);
  });
});
