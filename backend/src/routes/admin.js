const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { sendFreshnessPrompts } = require('../jobs/freshnessPrompt');

const router = express.Router();

// Clinic management
router.get('/clinics', async (req, res) => {
  const clinics = await prisma.clinic.findMany({
    include: { availability: true, admins: { where: { is_primary_contact: true } } },
    orderBy: { name: 'asc' },
  });
  return res.json(clinics);
});

const createClinicSchema = z.object({
  clinic: z.object({
    name: z.string(),
    address: z.string(),
    suburb: z.string(),
    lat: z.number(),
    lng: z.number(),
    phone: z.string(),
    website: z.string().optional(),
    ndis_registered: z.boolean().default(false),
    bulk_billing: z.boolean().default(false),
    private_health: z.boolean().default(false),
  }),
  admin: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
  }),
  availability: z.array(z.object({
    discipline: z.enum(['OT', 'SPEECH', 'PSYCHOLOGY']),
    intake_status: z.enum(['OPEN', 'LIMITED', 'CLOSED']),
    age_bands_served: z.array(z.string()),
    wait_time_band: z.enum(['UNDER_1_WEEK', 'ONE_TWO_WEEKS', 'TWO_FOUR_WEEKS', 'FOUR_EIGHT_WEEKS', 'EIGHT_PLUS_WEEKS']),
    capacity_level: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    monthly_referral_cap: z.number().int().positive().nullable().optional(),
  })),
});

router.post('/clinics', async (req, res) => {
  const parsed = createClinicSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { clinic: clinicData, admin: adminData, availability } = parsed.data;

  const clinic = await prisma.clinic.create({
    data: {
      ...clinicData,
      admins: { create: { ...adminData, is_primary_contact: true } },
      availability: { create: availability },
    },
    include: { admins: true, availability: true },
  });

  return res.status(201).json(clinic);
});

router.get('/clinics/:id', async (req, res) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: req.params.id },
    include: {
      availability: true,
      admins: true,
      _count: { select: { availability: true } },
    },
  });
  if (!clinic) return res.status(404).json({ error: 'Not found' });
  return res.json(clinic);
});

// Availability overview
router.get('/availability', async (req, res) => {
  const records = await prisma.availabilityObject.findMany({
    include: { clinic: { select: { name: true, suburb: true } } },
    orderBy: [{ confidence_score: 'asc' }, { last_updated: 'asc' }],
  });
  return res.json(records);
});

router.patch('/availability/:id', async (req, res) => {
  const { intake_status, wait_time_band, capacity_level, monthly_referral_cap, confidence_score, internal_notes } = req.body;
  const updated = await prisma.availabilityObject.update({
    where: { id: req.params.id },
    data: {
      ...(intake_status && { intake_status }),
      ...(wait_time_band && { wait_time_band }),
      ...(capacity_level && { capacity_level }),
      ...(monthly_referral_cap !== undefined && { monthly_referral_cap }),
      ...(confidence_score !== undefined && { confidence_score }),
      updated_by: 'ADMIN',
      last_updated: new Date(),
    },
  });
  return res.json(updated);
});

// Analytics
router.get('/analytics', async (req, res) => {
  const now = new Date();
  const day7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const day30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [searches7d, searches30d, conversions7d, waitlistCount, freshnessHealth] = await Promise.all([
    prisma.searchLog.count({ where: { created_at: { gte: day7 } } }),
    prisma.searchLog.count({ where: { created_at: { gte: day30 } } }),
    prisma.searchLog.count({ where: { created_at: { gte: day7 }, selected_at: { not: null } } }),
    prisma.waitlistEntry.groupBy({ by: ['availability_object_id'], _count: true }),
    prisma.availabilityObject.count({ where: { last_updated: { gte: day7 } } }),
  ]);

  const totalAo = await prisma.availabilityObject.count();

  return res.json({
    searches_7d: searches7d,
    searches_30d: searches30d,
    conversions_7d: conversions7d,
    conversion_rate: searches7d > 0 ? Math.round((conversions7d / searches7d) * 100) : 0,
    waitlist_entries: waitlistCount,
    freshness_health_pct: totalAo > 0 ? Math.round((freshnessHealth / totalAo) * 100) : 100,
  });
});

// Freshness log
router.get('/freshness', async (req, res) => {
  const prompts = await prisma.freshnessPrompt.findMany({
    include: {
      availability_object: { include: { clinic: { select: { name: true, suburb: true } } } },
    },
    orderBy: { sent_at: 'desc' },
    take: 200,
  });
  return res.json(prompts);
});

router.post('/freshness/:id/resend', async (req, res) => {
  await sendFreshnessPrompts().catch(() => {});
  return res.json({ ok: true });
});

router.patch('/clinics/:clinic_id/mark-contacted', async (req, res) => {
  return res.json({ ok: true });
});

module.exports = router;
