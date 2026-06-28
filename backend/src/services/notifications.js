const { Resend } = require('resend');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

const resend = new Resend(process.env.RESEND_API_KEY);

const WAIT_TIME_LABELS = {
  UNDER_1_WEEK: 'Under 1 week',
  ONE_TWO_WEEKS: '1–2 weeks',
  TWO_FOUR_WEEKS: '2–4 weeks',
  FOUR_EIGHT_WEEKS: '4–8 weeks',
  EIGHT_PLUS_WEEKS: '8+ weeks',
};

async function sendReactivationNotifications(availabilityObjectId) {
  const ao = await prisma.availabilityObject.findUnique({
    where: { id: availabilityObjectId },
    include: { clinic: true },
  });
  if (!ao) return;

  const cap = ao.intake_status === 'LIMITED' ? ao.monthly_referral_cap : null;

  const entries = await prisma.waitlistEntry.findMany({
    where: { availability_object_id: availabilityObjectId, notified_at: null },
    include: { referral_request: { include: { referrer: true } } },
    orderBy: [
      { referral_request: { urgency_score: 'desc' } },
      { created_at: 'asc' },
    ],
    ...(cap ? { take: cap } : {}),
  });

  for (const entry of entries) {
    const referrer = entry.referral_request.referrer;
    const dateAdded = entry.created_at.toLocaleDateString('en-AU');

    try {
      await resend.emails.send({
        from: 'TherapyWaitlist <noreply@therapywaitlist.com.au>',
        to: referrer.email,
        subject: `${ao.clinic.name} now has ${ao.discipline} availability`,
        text: `Hi ${referrer.contact_name},\n\n${ao.clinic.name} in ${ao.clinic.suburb} is now accepting new ${ao.discipline} clients.\n\nCurrent availability:\n- Wait time: ${WAIT_TIME_LABELS[ao.wait_time_band]}\n- Status: ${ao.intake_status}\n\nContact clinic: ${ao.clinic.phone}\n\nThis notification was sent because you joined their waitlist on ${dateAdded}.\n\nTherapyWaitlist`,
      });

      await prisma.waitlistEntry.update({
        where: { id: entry.id },
        data: { notified_at: new Date() },
      });
    } catch (err) {
      logger.error('Failed to send reactivation notification', { entryId: entry.id, err });
    }
  }
}

async function sendStalenessAlert(availabilityObjectId) {
  const ao = await prisma.availabilityObject.findUnique({
    where: { id: availabilityObjectId },
    include: { clinic: true },
  });
  if (!ao) return;

  try {
    await resend.emails.send({
      from: 'TherapyWaitlist <noreply@therapywaitlist.com.au>',
      to: process.env.ADMIN_EMAIL,
      subject: `${ao.clinic.name} — ${ao.discipline} listing is at risk of being hidden`,
      text: `The ${ao.discipline} listing for ${ao.clinic.name} has reached confidence score 0.2.\n\nIt will be hidden from search results if not updated soon.\n\nClinic: ${ao.clinic.name}\nSuburb: ${ao.clinic.suburb}\nDiscipline: ${ao.discipline}\nLast updated: ${ao.last_updated.toLocaleDateString('en-AU')}\n\nLog in to the admin panel to follow up.`,
    });
  } catch (err) {
    logger.error('Failed to send staleness alert', { availabilityObjectId, err });
  }
}

module.exports = { sendReactivationNotifications, sendStalenessAlert };
