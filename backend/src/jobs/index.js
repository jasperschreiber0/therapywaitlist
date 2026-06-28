const { scheduleCronJob: scheduleDecay } = require('./confidenceDecay');
const { scheduleCronJobs: scheduleFreshness } = require('./freshnessPrompt');

function setupCronJobs() {
  scheduleDecay();
  scheduleFreshness();
}

module.exports = { setupCronJobs };
