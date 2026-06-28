const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { sendReactivationNotifications } = require('../services/notifications');

const router = express.Router();

router.get('/:clinic_id/dashboard', async (req, res) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: req.params.clinic_id },
    include: {
      availability: { orderBy: { discipline: 'asc' } },
      admins: true,
    },
  });
  if (!clinic) return res.status(404).json({ error: 'Clinic not found' });

  const searchCount = await prisma.searchLog.count({
    where: {
      disciplines: { hasSome: clinic.availability.map((a) => a.discipline) },
      created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  return res.json({ clinic, search_count_this_week: searchCount });
});

const availabilityUpdateSchema = z.object({
  intake_status: z.enum(['OPEN', 'LIMITED', 'CLOSED']),
  wait_time_band: z.enum(['UNDER_1_WEEK', 'ONE_TWO_WEEKS', 'TWO_FOUR_WEEKS', 'FOUR_EIGHT_WEEKS', 'EIGHT_PLUS_WEEKS']),
  capacity_level: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  monthly_referral_cap: z.number().int().positive().nullable().optional(),
});

router.put('/:clinic_id/availability/:id', async (req, res) => {
  const existing = await prisma.availabilityObject.findFirst({
    where: { id: req.params.id, clinic_id: req.params.clinic_id },
  });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const parsed = availabilityUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { intake_status, wait_time_band, capacity_level, monthly_referral_cap } = parsed.data;
  const wasClosedNowOpen = existing.intake_status === 'CLOSED' && intake_status !== 'CLOSED';

  const updated = await prisma.availabilityObject.update({
    where: { id: req.params.id },
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

  if (wasClosedNowOpen) {
    sendReactivationNotifications(req.params.id).catch(() => {});
  }

  return res.json(updated);
});

router.get('/:clinic_id/waitlist', async (req, res) => {
  const entries = await prisma.waitlistEntry.findMany({
    where: {
      availability_object: { clinic_id: req.params.clinic_id },
    },
    include: {
      availability_object: { select: { discipline: true, intake_status: true } },
      referral_request: {
        select: {
          child_age: true,
          urgency_score: true,
          created_at: true,
          referrer: { select: { type: true, contact_name: true, email: true, phone: true } },
        },
      },
    },
    orderBy: [
      { referral_request: { urgency_score: 'desc' } },
      { created_at: 'asc' },
    ],
  });

  const ao = await prisma.availabilityObject.findFirst({
    where: { clinic_id: req.params.clinic_id, intake_status: 'CLOSED' },
    select: { intake_status: true },
  });

  const showPii = ao?.intake_status !== 'CLOSED';

  return res.json({
    entries: entries.map((e) => ({
      id: e.id,
      discipline: e.availability_object.discipline,
      child_age: e.referral_request.child_age,
      urgency_score: e.referral_request.urgency_score,
      referrer_type: e.referral_request.referrer.type,
      date_added: e.created_at,
      ...(showPii
        ? { referrer_contact: e.referral_request.referrer.contact_name, referrer_email: e.referral_request.referrer.email }
        : {}),
    })),
  });
});

router.get('/:clinic_id/profile', async (req, res) => {
  const clinic = await prisma.clinic.findUnique({ where: { id: req.params.clinic_id } });
  if (!clinic) return res.status(404).json({ error: 'Clinic not found' });
  return res.json(clinic);
});

module.exports = router;
