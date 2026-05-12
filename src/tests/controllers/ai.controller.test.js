/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: ai.controller.test.js
 * Descripción: Pruebas para el controlador de inteligencia artificial.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const Event = require('../../models/Event');
const generateSummary = require('../../services/aiSummary.service');

jest.mock('../../models/Event', () => ({
  find: jest.fn()
}));

jest.mock('../../services/aiSummary.service', () => jest.fn());

const { getSummary } = require('../../controllers/ai.controller');

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('ai.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getSummary returns summary and events', async () => {
    Event.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ _id: 'e1' }])
    });
    generateSummary.mockResolvedValueOnce({
      summary: 'Resumen',
      highlights: [{ text: 'T', eventId: 'e1' }]
    });

    const res = createRes();
    await getSummary({ body: { category: 'M' } }, res);

    expect(res.json).toHaveBeenCalledWith({
      summary: 'Resumen',
      highlights: [{ text: 'T', eventId: 'e1' }],
      events: [{ _id: 'e1' }]
    });
  });

  it('getSummary returns 500 on error', async () => {
    Event.find.mockImplementationOnce(() => {
      throw new Error('fail');
    });

    const res = createRes();
    await getSummary({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
