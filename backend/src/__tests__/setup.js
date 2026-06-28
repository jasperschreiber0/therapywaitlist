process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.RESEND_API_KEY = 're_test_placeholder';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ id: 'mock-email-id' }) },
  })),
}));

// Mock prisma
jest.mock('../lib/prisma', () => ({
  availabilityObject: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  searchLog: {
    create: jest.fn().mockResolvedValue({}),
    count: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({}),
  },
  freshnessPrompt: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
}));
