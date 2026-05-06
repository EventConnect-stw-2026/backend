const express = require('express');
const request = require('supertest');
const Event = require('../../models/Event');

jest.mock('../../models/Event', () => ({
  find: jest.fn()
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: () => ({
      generateContent: async () => ({
        response: { text: () => 'musica' }
      })
    })
  }))
}));

const recommendRoutes = require('../../routes/recommend.routes');

describe('recommend.routes', () => {
  it('returns 400 when missing params', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/recommend', recommendRoutes);

    const res = await request(app).post('/api/recommend').send({});
    expect(res.status).toBe(400);
  });

  it('returns events and category', async () => {
    Event.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ _id: 'e1' }])
    });

    const app = express();
    app.use(express.json());
    app.use('/api/recommend', recommendRoutes);

    const res = await request(app)
      .post('/api/recommend')
      .send({ companion: 'solo', vibe: 'cultural' });

    expect(res.status).toBe(200);
    expect(res.body.category).toBe('musica');
  });
});
