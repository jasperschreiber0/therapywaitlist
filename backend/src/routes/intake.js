const express = require('express');
const { z } = require('zod');
const Anthropic = require('@anthropic-ai/sdk');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const logger = require('../lib/logger');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const bodySchema = z.object({
  text: z.string().min(1, 'Text is required').max(2000, 'Text must be 2000 characters or less'),
});

const SYSTEM_PROMPT = `You are an intake triage assistant for a paediatric allied health referral system operating in Australia.
Your job is to convert a referral description into a structured assessment.
The services available are: Occupational Therapy (OT), Speech Pathology, and Psychology.
The age range served is 0–18 years.

Return ONLY valid JSON with these exact fields:
{
  "likely_disciplines": array of one or more from ["OT", "Speech", "Psychology"], ranked by likelihood,
  "urgency_score": integer 0–10 where 0 = routine long-term and 10 = requires immediate placement,
  "urgency_reasoning": string of one sentence explaining the urgency score,
  "age_appropriate": boolean,
  "referral_notes": string of maximum two sentences summarising key flags for the receiving clinic,
  "safeguarding_flag": boolean — true if there are any indicators of risk to the child
}

Do not provide clinical diagnoses. Do not provide treatment recommendations.
Do not suggest specific clinicians or organisations.
If there are any indicators of risk to the child's safety or wellbeing, set safeguarding_flag to true and begin referral_notes with [URGENT].
If the referral is outside the 0–18 age range, set age_appropriate to false.`;

router.post('/interpret', limiter, async (req, res) => {
  const request_id = uuidv4();

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { text } = parsed.data;
  logger.info('Intake interpret request', { request_id, textLength: text.length });

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    });

    const raw = message.content[0].text;
    let parsed_response;

    try {
      parsed_response = JSON.parse(raw);
    } catch {
      logger.error('Failed to parse AI response', { request_id, raw });
      return res.status(503).json({
        error: 'Unable to interpret referral at this time. Please try again or use the manual search.',
      });
    }

    logger.info('Intake interpret success', { request_id });

    return res.json({
      ...parsed_response,
      _request_id: request_id,
      _raw: raw,
    });
  } catch (err) {
    logger.error('Anthropic API error', { request_id, err: err.message });
    return res.status(503).json({
      error: 'Unable to interpret referral at this time. Please try again or use the manual search.',
    });
  }
});

module.exports = router;
