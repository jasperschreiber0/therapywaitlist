const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');

const router = express.Router();

const joinSchema = z.object({
  availability_object_id: z.string().uuid(),
  referrer_type: z.enum(['GP', 'SCHOOL', 'SUPPORT_COORDINATOR', 'PAEDIATRICIAN', 'FAMILY']),
  contact_name: z.string().min(1),
  organisation_name: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  suburb: z.string().min(1),
  child_age: z.number().int().min(0).max(18),
  notes: z.string().optional(),
});

router.post('/join', async (req, res) => {
  const parsed = joinSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { availability_object_id, referrer_type, contact_name, organisation_name, email, phone, suburb, child_age, notes } = parsed.data;

  const ao = await prisma.availabilityObject.findUnique({
    where: { id: availability_object_id },
    include: { clinic: true },
  });
  if (!ao) return res.status(404).json({ error: 'Availability record not found' });

  const referrer = await prisma.referrer.create({
    data: { type: referrer_type, contact_name, organisation_name, email, phone, suburb },
  });

  const referralRequest = await prisma.referralRequest.create({
    data: {
      referrer_id: referrer.id,
      child_age,
      disciplines_requested: [ao.discipline],
      urgency_score: 0,
      notes,
      status: 'WAITLISTED',
    },
  });

  const entry = await prisma.waitlistEntry.create({
    data: {
      referral_request_id: referralRequest.id,
      availability_object_id,
    },
  });

  return res.status(201).json({
    ok: true,
    entry_id: entry.id,
    clinic_name: ao.clinic.name,
    discipline: ao.discipline,
  });
});

module.exports = router;
