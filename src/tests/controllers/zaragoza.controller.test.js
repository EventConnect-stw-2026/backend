/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: zaragoza.controller.test.js
 * Descripción: Pruebas para el controlador de Zaragoza.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const Zaragoza = require('../../services/zaragoza.service');
const importEvents = require('../../services/importEvents.service');
const { runSync } = require('../../jobs/syncEvents.job');

jest.mock('../../services/zaragoza.service', () => ({
  getEvents: jest.fn(),
  getEventById: jest.fn(),
  getTodayEvents: jest.fn(),
  searchEvents: jest.fn()
}));

jest.mock('../../services/importEvents.service', () => jest.fn());

jest.mock('../../jobs/syncEvents.job', () => ({
  runSync: jest.fn()
}));

const controller = require('../../controllers/zaragoza.controller');

function createRes() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('zaragoza.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getEvents uses getEventById when id is provided', async () => {
    Zaragoza.getEventById.mockResolvedValueOnce({ id: '1' });

    const res = createRes();
    await controller.getEvents({ query: { id: '1' } }, res, jest.fn());

    expect(Zaragoza.getEventById).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith({ id: '1' });
  });

  it('getEvents uses today when today=true', async () => {
    Zaragoza.getTodayEvents.mockResolvedValueOnce({ result: [] });

    const res = createRes();
    await controller.getEvents({ query: { today: 'true' } }, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({ result: [] });
  });

  it('importFromZaragoza returns success', async () => {
    importEvents.mockResolvedValueOnce({ imported: 1, updated: 2 });

    const res = createRes();
    await controller.importFromZaragoza({}, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({ success: true, imported: 1, updated: 2 });
  });

  it('manualSync triggers runSync', async () => {
    const res = createRes();
    await controller.manualSync({}, res, jest.fn());

    expect(runSync).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Sync executed' });
  });
});
