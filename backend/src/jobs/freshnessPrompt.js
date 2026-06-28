const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

const resend = new Resend(process.env.RESEND_API_KEY);

const WAIT_LABELS = {
  UNDER_1_WEEK: 'Under 1 week',
  ONE_TWO_WEEKS: '1–2 weeks',
  TWO_FOUR_WEEKS: '2–4 weeks',
  FOUR_EIGHT_WEEKS: '4–8 weeks',
  EIGHT_PLUS_WEEKS: '8+ weeks',
};

function makeToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
}

async function sendFreshnessPrompts() {
  const records = await prisma.availabilityObject.findMany({
    where: {
      intake_status: { not: 'CLOSED' },
      confidence_score: { gt: 0.0 },
    },
    include: {
      clinic: {
        include: {
          admins: { where: { is_primary_contact: true }, take: 1 },
        },
      },
    },
  });

  let sent = 0;
  for (const ao of records) {
    const admin = ao.clinic.admins[0];
    if (!admin) continue;

    const confirmToken = makeToken({ availabilityObjectId: ao.id, action: 'confirm' });
    const updateToken = makeToken({ availabilityObjectId: ao.id, action: 'update' });
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const confirmUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/freshness/confirm/${confirmToken}`;
    const updateUrl = `${baseUrl}/freshness/update/${updateToken}`;

    const body = `Hi ${admin.name},\n\nJust a quick weekly check for ${ao.clinic.name}.\n\nYour current ${ao.discipline} availability:\n- Status: ${ao.intake_status}\n- Wait time: ${WAIT_LABELS[ao.wait_time_band]}\n- Capacity: ${ao.capacity_level}\n\nConfirm — Still accurate: ${confirmUrl}\nUpdate — Something has changed: ${updateUrl}\n\nThis takes about 10 seconds. Your listing stays accurate and continues to appear in referral searches.\n\nTherapyWaitlist`;

    try {
      await resend.emails.send({
        from: 'TherapyWaitlist <noreply@therapywaitlist.com.au>',
        to: admin.email,
        subject: `Quick check — is your ${ao.discipline} availability still accurate?`,
        text: body,
      });

      await prisma.freshnessPrompt.create({
        data: { availability_object_id: ao.id },
      });

      sent++;
    } catch (err) {
      logger.error('Failed to send freshness prompt', { aoId: ao.id, err });
    }
  }

  logger.info('Freshness prompts sent', { sent });
}

async function runFollowUpJob() {
  const lastMonday = new Date();
  lastMonday.setDate(lastMonday.getDate() - ((lastMonday.getDay() + 6) % 7));
  lastMonday.setHours(0, 0, 0, 0);

  const noResponse = await prisma.freshnessPrompt.findMany({
    where: {
      sent_at: { gte: lastMonday },
      responded_at: null,
    },
    include: { availability_object: true },
  });

  for (const fp of noResponse) {
    const ao = fp.availability_object;
    const newScore = Math.max(ao.confidence_score - 0.1, 0);
    await prisma.availabilityObject.update({
      where: { id: ao.id },
      data: { confidence_score: newScore },
    });
    await prisma.freshnessPrompt.update({
      where: { id: fp.id },
      data: { response_type: 'NO_RESPONSE' },
    });
  }

  logger.info('Follow-up job complete', { processed: noResponse.length });
}

function scheduleCronJobs() {
  // Monday 8:00 AM AEST = Sunday 22:00 UTC
  cron.schedule('0 22 * * 0', () => {
    logger.info('Running weekly freshness prompt job');
    sendFreshnessPrompts().catch((err) => logger.error('Freshness prompt job failed', { err }));
  });

  // Wednesday 2:00 PM AEST = Wednesday 04:00 UTC
  cron.schedule('0 4 * * 3', () => {
    logger.info('Running freshness follow-up job');
    runFollowUpJob().catch((err) => logger.error('Follow-up job failed', { err }));
  });
}

module.exports = { sendFreshnessPrompts, runFollowUpJob, scheduleCronJobs };
