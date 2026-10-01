import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../prisma/prisma.service';
import { InquiryModule } from './inquiry.module';

// ============= Public Guest Inquiry API =============
describe('Inquiry API', () => {
  let app: INestApplication<App>;
  const create = jest.fn();
  const payload = {
    title: 'Delivery area',
    message: 'Do you deliver to Colombo?',
    sender_email: 'guest@example.com',
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [InquiryModule] })
      .overrideProvider(PrismaService)
      .useValue({ inquiry: { create } })
      .compile();
    app = module.createNestApplication<App>();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  beforeEach(() => create.mockReset());
  afterAll(async () => app.close());

  it('accepts guests, trims input and stores only validated fields', async () => {
    const saved = {
      inquiry_id: 1,
      ...payload,
      date_submitted: new Date('2026-10-02T00:00:00Z'),
    };
    create.mockResolvedValue(saved);
    await request(app.getHttpServer())
      .post('/inquiries')
      .send({
        title: `  ${payload.title}  `,
        message: `  ${payload.message}  `,
        sender_email: ` ${payload.sender_email} `,
        inquiry_id: 99,
        date_submitted: '2000-01-01',
      })
      .expect(201)
      .expect({ ...saved, date_submitted: saved.date_submitted.toISOString() });
    expect(create).toHaveBeenCalledWith({ data: payload });
  });

  it.each([
    ['missing title', { title: undefined }],
    ['blank title', { title: '   ' }],
    ['long title', { title: 'a'.repeat(201) }],
    ['missing message', { message: undefined }],
    ['blank message', { message: '\n  ' }],
    ['long message', { message: 'a'.repeat(5001) }],
    ['non-string message', { message: { text: 'Hello' } }],
    ['missing email', { sender_email: undefined }],
    ['invalid email', { sender_email: 'invalid-email' }],
    ['null email', { sender_email: null }],
    ['long email', { sender_email: `${'a'.repeat(243)}@example.com` }],
  ])('rejects %s before storage', async (_label, invalidFields) => {
    await request(app.getHttpServer())
      .post('/inquiries')
      .send({ ...payload, ...invalidFields })
      .expect(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('returns a generic error when storage fails', async () => {
    create.mockRejectedValue(new Error('Private database details'));
    await request(app.getHttpServer())
      .post('/inquiries')
      .send(payload)
      .expect(500)
      .expect({
        statusCode: 500,
        message: 'Failed to submit inquiry',
        error: 'Internal Server Error',
      });
  });
});
