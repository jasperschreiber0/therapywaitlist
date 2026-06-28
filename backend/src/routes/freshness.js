const express = require('express');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

const router = express.Router();

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
}

router.get('/confirm/:token', async (req, res) => {
  let payload;
  try {
    payload = verifyToken(req.params.token);
  } catch (err) {
    return res.status(401).send('<h1>Link expired</h1><p>This confirmation link has expired. Please wait for the next weekly check.</p>');
  }

  if (payload.action !== 'confirm') {
    return res.status(400).send('<h1>Invalid link</h1>');
  }

  const fp = await prisma.freshnessPrompt.findFirst({
    where: { availability_object_id: payload.availabilityObjectId, responded_at: null },
    orderBy: { sent_at: 'desc' },
  });

  if (!fp) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/freshness/confirmed`);
  }

  await prisma.availabilityObject.update({
    where: { id: payload.availabilityObjectId },
    data: { confidence_score: 1.0, last_updated: new Date() },
  });

  await prisma.freshnessPrompt.update({
    where: { id: fp.id },
    data: { responded_at: new Date(), response_type: 'CONFIRMED' },
  });

  logger.info('Freshness confirmed', { availabilityObjectId: payload.availabilityObjectId });
  return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/freshness/confirmed`);
});

router.get('/update/:token', async (req, res) => {
  let payload;
  try {
    payload = verifyToken(req.params.token);
  } catch {
    return res.status(401).send('<h1>Link expired</h1><p>This update link has expired.</p>');
  }

  if (payload.action !== 'update') return res.status(400).send('<h1>Invalid link</h1>');

  return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/freshness/update/${req.params.token}`);
});

const updateSchema = z.object({
  intake_status: z.enum(['OPEN', 'LIMITED', 'CLOSED']),
  wait_time_band: z.enum(['UNDER_1_WEEK', 'ONE_TWO_WEEKS', 'TWO_FOUR_WEEKS', 'FOUR_EIGHT_WEEKS', 'EIGHT_PLUS_WEEKS']),
  capacity_level: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  monthly_referral_cap: z.number().int().positive().nullable().optional(),
});

router.post('/update/:token', async (req, res) => {
  let payload;
  try {
    payload = verifyToken(req.params.token);
  } catch {
    return res.status(401).json({ error: 'Link expired' });
  }

  if (payload.action !== 'update') return res.status(400).json({ error: 'Invalid token' });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { intake_status, wait_time_band, capacity_level, monthly_referral_cap } = parsed.data;

  await prisma.availabilityObject.update({
    where: { id: payload.availabilityObjectId },
    data: {
      intake_status,
      wait_time_band,
      capacity_level,
      monthly_referral_cap: intake_status === 'LIMITED' ? monthly_referral_cap : null,
      confidence_score: 1.0,
      last_updated: new Date(),
      updated_by: 'CLINIC',
    },
  });

  const fp = await prisma.freshnessPrompt.findFirst({
    where: { availability_object_id: payload.availabilityObjectId, responded_at: null },
    orderBy: { sent_at: 'desc' },
  });

  if (fp) {
    await prisma.freshnessPrompt.update({
      where: { id: fp.id },
      data: { responded_at: new Date(), response_type: 'UPDATED' },
    });
  }

  logger.info('Availability updated via freshness token', { availabilityObjectId: payload.availabilityObjectId });
  return res.json({ ok: true });
});

module.exports = router;
