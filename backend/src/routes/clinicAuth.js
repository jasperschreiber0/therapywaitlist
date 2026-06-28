const express = require('express');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../lib/prisma');

const router = express.Router();

// POST /api/clinic/auth/token
// Generates a clinic session token for dashboard access.
// For MVP: admin creates the password manually (hashed with bcrypt in production).
// Here we use a simple shared clinic PIN stored in ClinicAdmin or a magic-link flow.
// For Phase 1: accept clinic_id + email, issue 7-day JWT — admin controls who gets access.
const tokenSchema = z.object({
  clinic_id: z.string().uuid(),
  email: z.string().email(),
  admin_key: z.string(), // clinic admin must provide the ADMIN_API_KEY to generate tokens (admin-issued)
});

router.post('/token', async (req, res) => {
  const parsed = tokenSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { clinic_id, email, admin_key } = parsed.data;

  if (admin_key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }

  const admin = await prisma.clinicAdmin.findFirst({
    where: { clinic_id, email },
  });

  if (!admin) {
    return res.status(404).json({ error: 'No clinic admin found with that email' });
  }

  const token = jwt.sign(
    { type: 'clinic_session', clinic_id, admin_id: admin.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({ token, clinic_id, admin_name: admin.name });
});

module.exports = router;
