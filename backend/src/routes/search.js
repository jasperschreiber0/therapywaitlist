const express = require('express');
const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const { computeCompositeScore } = require('../services/scoring');
const { haversineKm } = require('../services/haversine');
const { getSuburbCoords } = require('../data/suburbCoords');
const logger = require('../lib/logger');

const router = express.Router();

const searchSchema = z.object({
  disciplines: z.array(z.enum(['OT', 'SPEECH', 'PSYCHOLOGY'])).min(1),
  child_age: z.number().int().min(0).max(18),
  urgency_score: z.number().int().min(0).max(10).optional().default(0),
  suburb: z.string().min(1),
  radius_km: z.number().positive().optional().default(10),
  include_waitlist: z.boolean().optional().default(false),
});

router.post('/', async (req, res) => {
  const parsed = searchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { disciplines, child_age, urgency_score, suburb, radius_km, include_waitlist } = parsed.data;

  const coords = getSuburbCoords(suburb);
  if (!coords) {
    return res.status(400).json({ error: `Unknown suburb: "${suburb}". Please check the spelling.` });
  }

  const records = await prisma.availabilityObject.findMany({
    where: {
      discipline: { in: disciplines },
      confidence_score: { gt: 0.0 },
    },
    include: { clinic: true },
  });

  const ageBandKey = (age) => {
    if (age <= 3) return '0-3';
    if (age <= 7) return '4-7';
    if (age <= 12) return '8-12';
    return '13-18';
  };
  const childBand = ageBandKey(child_age);

  const scored = [];
  const waitlistOptions = [];

  for (const ao of records) {
    if (!ao.age_bands_served.includes(childBand)) continue;

    const distance = haversineKm(
      coords.lat, coords.lng,
      parseFloat(ao.clinic.lat), parseFloat(ao.clinic.lng)
    );
    if (distance > radius_km) continue;

    const composite_score = computeCompositeScore(ao, urgency_score);

    const result = {
      clinic_id: ao.clinic.id,
      clinic_name: ao.clinic.name,
      suburb: ao.clinic.suburb,
      distance_km: Math.round(distance * 10) / 10,
      discipline: ao.discipline,
      intake_status: ao.intake_status,
      wait_time_band: ao.wait_time_band,
      capacity_level: ao.capacity_level,
      confidence_score: ao.confidence_score,
      composite_score: Math.round(composite_score * 100) / 100,
      last_updated: ao.last_updated,
      ndis_registered: ao.clinic.ndis_registered,
      age_served: true,
      availability_object_id: ao.id,
    };

    if (ao.intake_status === 'CLOSED') {
      if (include_waitlist) waitlistOptions.push(result);
    } else {
      scored.push(result);
    }
  }

  scored.sort((a, b) => b.composite_score - a.composite_score);

  const search_id = uuidv4();
  await prisma.searchLog.create({
    data: {
      search_id,
      disciplines,
      child_age,
      urgency_score,
      suburb,
      radius_km,
    },
  }).catch((err) => logger.error('Failed to log search', { err }));

  return res.json({
    results: scored,
    waitlist_options: include_waitlist ? waitlistOptions : undefined,
    result_count: scored.length,
    search_id,
  });
});

router.get('/:search_id/select', async (req, res) => {
  const { search_id } = req.params;
  const { clinic_id } = req.query;

  await prisma.searchLog.updateMany({
    where: { search_id },
    data: { selected_clinic_id: clinic_id || null, selected_at: new Date() },
  }).catch(() => {});

  return res.json({ ok: true });
});

module.exports = router;
