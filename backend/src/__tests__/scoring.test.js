const { computeCompositeScore, computeConfidenceScore } = require('../services/scoring');

describe('computeConfidenceScore', () => {
  test.each([
    [0, 1.0],
    [7, 1.0],
    [8, 0.7],
    [14, 0.7],
    [15, 0.4],
    [21, 0.4],
    [22, 0.2],
    [30, 0.2],
    [31, 0.0],
  ])('%d days → %f', (days, expected) => {
    expect(computeConfidenceScore(days)).toBe(expected);
  });
});

describe('computeCompositeScore', () => {
  const base = {
    intake_status: 'OPEN',
    wait_time_band: 'ONE_TWO_WEEKS',
    capacity_level: 'HIGH',
    confidence_score: 1.0,
  };

  it('scores OPEN HIGH UNDER_1_WEEK confidence=1 correctly', () => {
    const score = computeCompositeScore({ ...base, wait_time_band: 'UNDER_1_WEEK' });
    expect(score).toBeCloseTo(1.0);
  });

  it('returns 0 for CLOSED regardless of other values', () => {
    expect(computeCompositeScore({ ...base, intake_status: 'CLOSED' })).toBe(0);
  });

  it('returns 0 when confidence_score is 0.0', () => {
    expect(computeCompositeScore({ ...base, confidence_score: 0.0 })).toBe(0);
  });

  it('applies urgency bonus when urgency >= 7 and short wait', () => {
    const withBonus = computeCompositeScore({ ...base, wait_time_band: 'UNDER_1_WEEK', capacity_level: 'HIGH' }, 7);
    const withoutBonus = computeCompositeScore({ ...base, wait_time_band: 'UNDER_1_WEEK', capacity_level: 'HIGH' }, 6);
    expect(withBonus).toBeGreaterThan(withoutBonus);
  });

  it('does not apply urgency bonus for long wait even with high urgency', () => {
    const score = computeCompositeScore({ ...base, wait_time_band: 'EIGHT_PLUS_WEEKS' }, 10);
    const scoreNoUrgency = computeCompositeScore({ ...base, wait_time_band: 'EIGHT_PLUS_WEEKS' }, 0);
    expect(score).toBe(scoreNoUrgency);
  });

  it('caps composite score at 1.0', () => {
    const score = computeCompositeScore({ ...base, wait_time_band: 'UNDER_1_WEEK' }, 10);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it('LIMITED reduces score vs OPEN', () => {
    const open = computeCompositeScore(base);
    const limited = computeCompositeScore({ ...base, intake_status: 'LIMITED' });
    expect(open).toBeGreaterThan(limited);
  });

  it('LOW capacity reduces score vs HIGH', () => {
    const high = computeCompositeScore(base);
    const low = computeCompositeScore({ ...base, capacity_level: 'LOW' });
    expect(high).toBeGreaterThan(low);
  });

  it('lower confidence_score reduces score', () => {
    const full = computeCompositeScore(base);
    const half = computeCompositeScore({ ...base, confidence_score: 0.5 });
    expect(full).toBeGreaterThan(half);
  });
});
