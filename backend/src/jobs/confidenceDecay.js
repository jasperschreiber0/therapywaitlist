const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { computeConfidenceScore } = require('../services/scoring');
const logger = require('../lib/logger');

async function runConfidenceDecay() {
  const records = await prisma.availabilityObject.findMany({
    select: { id: true, last_updated: true, confidence_score: true, intake_status: true },
  });

  const now = new Date();
  let updated = 0;
  let hidden = 0;

  const updates = [];

  for (const record of records) {
    const daysSince = Math.floor((now - new Date(record.last_updated)) / (1000 * 60 * 60 * 24));
    const newScore = computeConfidenceScore(daysSince);

    if (newScore === record.confidence_score && !(newScore === 0.0 && record.intake_status !== 'CLOSED')) {
      continue;
    }

    const data = { confidence_score: newScore };
    if (newScore === 0.0) {
      data.intake_status = 'CLOSED';
      hidden++;
    }

    updates.push(prisma.availabilityObject.update({ where: { id: record.id }, data }));
    updated++;
  }

  if (updates.length > 0) {
    await Promise.all(updates);
  }

  logger.info('Confidence decay job complete', { total: records.length, updated, hidden });
  return { total: records.length, updated, hidden };
}

function scheduleCronJob() {
  // 2:00 AM AEST = UTC+10, so 16:00 UTC
  cron.schedule('0 16 * * *', () => {
    logger.info('Running scheduled confidence decay job');
    runConfidenceDecay().catch((err) => logger.error('Confidence decay job failed', { err }));
  });
}

module.exports = { runConfidenceDecay, scheduleCronJob };
