/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: services.test.js
 * Descripción: Pruebas para los servicios de gestión de eventos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const Event = require('../../models/Event');
const Zaragoza = require('../../services/zaragoza.service');
const mapEvent = require('../../models/eventMapper');

jest.mock('../../models/Event', () => ({
  deleteMany: jest.fn(),
  updateMany: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn()
}));

jest.mock('../../services/zaragoza.service', () => ({
  getEvents: jest.fn()
}));

jest.mock('../../models/eventMapper', () => jest.fn());

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: () => ({
      generateContent: async () => ({
        response: { text: () => '{"summary":"Resumen IA","highlights":[{"text":"T","eventId":"e1"}]}' }
      })
    })
  }))
}));

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn()
  }))
}));

const generateSummary = require('../../services/aiSummary.service');
const deleteOldEvents = require('../../services/deleteOldEvents.service');
const updateExpiredEvents = require('../../services/eventStatus.service');
const importEvents = require('../../services/importEvents.service');
const axios = require('axios');

describe('services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aiSummary returns default message when no events', async () => {
    const result = await generateSummary([]);
    expect(result).toEqual({ summary: 'No hay eventos para este criterio.', highlights: [] });
  });

  it('aiSummary generates content', async () => {
    const result = await generateSummary([
      { _id: { toString: () => 'e1' }, title: 'T', category: 'C', startDate: new Date() }
    ]);
    expect(result).toEqual({
      summary: 'Resumen IA',
      highlights: [{ text: 'T', eventId: 'e1' }]
    });
  });

  it('deleteOldEvents returns deleted count', async () => {
    Event.deleteMany.mockResolvedValueOnce({ deletedCount: 3 });
    const count = await deleteOldEvents();
    expect(count).toBe(3);
  });

  it('updateExpiredEvents returns modified count', async () => {
    Event.updateMany.mockResolvedValueOnce({ modifiedCount: 2 });
    const count = await updateExpiredEvents();
    expect(count).toBe(2);
  });

  it('importEvents throws on invalid response', async () => {
    Zaragoza.getEvents.mockResolvedValueOnce({});

    await expect(importEvents()).rejects.toThrow('Invalid response from Zaragoza API');
  });

  it('importEvents imports and updates events', async () => {
    Zaragoza.getEvents
      .mockResolvedValueOnce({ totalCount: 1, result: [{ id: '1' }] })
      .mockResolvedValueOnce({ totalCount: 1, result: [] });

    mapEvent.mockReturnValueOnce({ externalId: '1', title: 'T' });
    Event.findOne.mockResolvedValueOnce(null);

    const result = await importEvents();
    expect(result.imported).toBe(1);
  });

  it('zaragoza.service getEvents returns data', async () => {
    axios.create.mockReturnValueOnce({
      get: jest.fn().mockResolvedValueOnce({ data: { result: [] } })
    });

    let data;
    jest.isolateModules(() => {
      jest.unmock('../../services/zaragoza.service');
      const freshService = require('../../services/zaragoza.service');
      data = freshService.getEvents(0, 10);
    });

    await expect(data).resolves.toEqual({ result: [] });
  });

  it('zaragoza.service getEventById returns data', async () => {
    axios.create.mockReturnValueOnce({
      get: jest.fn().mockResolvedValueOnce({ data: { id: 'e1' } })
    });

    let data;
    jest.isolateModules(() => {
      jest.unmock('../../services/zaragoza.service');
      const freshService = require('../../services/zaragoza.service');
      data = freshService.getEventById('e1');
    });

    await expect(data).resolves.toEqual({ id: 'e1' });
  });

  it('zaragoza.service getTodayEvents returns data', async () => {
    axios.create.mockReturnValueOnce({
      get: jest.fn().mockResolvedValueOnce({ data: { result: ['a'] } })
    });

    let data;
    jest.isolateModules(() => {
      jest.unmock('../../services/zaragoza.service');
      const freshService = require('../../services/zaragoza.service');
      data = freshService.getTodayEvents();
    });

    await expect(data).resolves.toEqual({ result: ['a'] });
  });

  it('zaragoza.service searchEvents returns data', async () => {
    axios.create.mockReturnValueOnce({
      get: jest.fn().mockResolvedValueOnce({ data: { result: ['b'] } })
    });

    let data;
    jest.isolateModules(() => {
      jest.unmock('../../services/zaragoza.service');
      const freshService = require('../../services/zaragoza.service');
      data = freshService.searchEvents('q');
    });

    await expect(data).resolves.toEqual({ result: ['b'] });
  });

  it('zaragoza.service getEvents throws on error', async () => {
    axios.create.mockReturnValueOnce({
      get: jest.fn().mockRejectedValueOnce(new Error('boom'))
    });

    let data;
    jest.isolateModules(() => {
      jest.unmock('../../services/zaragoza.service');
      const freshService = require('../../services/zaragoza.service');
      data = freshService.getEvents(0, 1);
    });

    await expect(data).rejects.toThrow('boom');
  });
});
