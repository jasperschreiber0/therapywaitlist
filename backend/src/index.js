require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { setupCronJobs } = require('./jobs');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/intake', require('./routes/intake'));
app.use('/api/search', require('./routes/search'));
app.use('/api/freshness', require('./routes/freshness'));
app.use('/api/clinic', require('./routes/clinic'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/waitlist', require('./routes/waitlist'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
  setupCronJobs();
}

module.exports = app;
