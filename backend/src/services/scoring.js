const INTAKE_WEIGHT = { OPEN: 1.0, LIMITED: 0.6, CLOSED: 0 };
const WAIT_WEIGHT = {
  UNDER_1_WEEK: 1.0,
  ONE_TWO_WEEKS: 0.8,
  TWO_FOUR_WEEKS: 0.6,
  FOUR_EIGHT_WEEKS: 0.4,
  EIGHT_PLUS_WEEKS: 0.2,
};
const CAPACITY_WEIGHT = { HIGH: 1.0, MEDIUM: 0.75, LOW: 0.5 };

function computeCompositeScore(availability, urgencyScore = 0) {
  if (availability.confidence_score === 0.0) return 0;
  if (availability.intake_status === 'CLOSED') return 0;

  const intake = INTAKE_WEIGHT[availability.intake_status] ?? 0;
  const wait = WAIT_WEIGHT[availability.wait_time_band] ?? 0;
  const capacity = CAPACITY_WEIGHT[availability.capacity_level] ?? 0;
  const confidence = availability.confidence_score;

  let score = intake * wait * capacity * confidence;

  const shortWait = ['UNDER_1_WEEK', 'ONE_TWO_WEEKS'].includes(availability.wait_time_band);
  if (urgencyScore >= 7 && shortWait) score += 0.2;

  return Math.min(score, 1.0);
}

function computeConfidenceScore(daysSinceUpdate) {
  if (daysSinceUpdate <= 7) return 1.0;
  if (daysSinceUpdate <= 14) return 0.7;
  if (daysSinceUpdate <= 21) return 0.4;
  if (daysSinceUpdate <= 30) return 0.2;
  return 0.0;
}

module.exports = { computeCompositeScore, computeConfidenceScore, INTAKE_WEIGHT, WAIT_WEIGHT, CAPACITY_WEIGHT };
