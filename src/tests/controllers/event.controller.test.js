/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: event.controller.test.js
 * Descripción: Pruebas para el controlador de eventos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const Event = require('../../models/Event');
const User = require('../../models/User');

jest.mock('../../models/Event', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn()
}));

jest.mock('../../models/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));

const eventController = require('../../controllers/event.controller');

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('event.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getAllEvents returns paginated data', async () => {
    Event.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ _id: 'e1' }])
    });
    Event.countDocuments.mockResolvedValueOnce(1);

    const res = createRes();
    await eventController.getAllEvents({ query: { page: 1, limit: 10 } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getEventById returns 404 when missing', async () => {
    Event.findById.mockResolvedValueOnce(null);

    const res = createRes();
    await eventController.getEventById({ params: { id: 'e1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getEventById returns event', async () => {
    Event.findById.mockResolvedValueOnce({ _id: 'e1' });

    const res = createRes();
    await eventController.getEventById({ params: { id: 'e1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('createEvent rejects duplicate externalId', async () => {
    Event.findOne.mockResolvedValueOnce({ _id: 'e1' });

    const res = createRes();
    await eventController.createEvent({ body: { externalId: 'x' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('createEvent creates event', async () => {
    Event.findOne.mockResolvedValueOnce(null);
    Event.create.mockResolvedValueOnce({ _id: 'e1', title: 'T' });

    const res = createRes();
    await eventController.createEvent({ body: { externalId: 'x' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateEvent returns 404 when missing', async () => {
    Event.findByIdAndUpdate.mockResolvedValueOnce(null);

    const res = createRes();
    await eventController.updateEvent({ params: { id: 'e1' }, body: {} }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updateEvent returns updated event', async () => {
    Event.findByIdAndUpdate.mockResolvedValueOnce({ _id: 'e1' });

    const res = createRes();
    await eventController.updateEvent({ params: { id: 'e1' }, body: {} }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deleteEvent returns 404 when missing', async () => {
    Event.findByIdAndDelete.mockResolvedValueOnce(null);

    const res = createRes();
    await eventController.deleteEvent({ params: { id: 'e1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deleteEvent removes event', async () => {
    Event.findByIdAndDelete.mockResolvedValueOnce({ _id: 'e1' });

    const res = createRes();
    await eventController.deleteEvent({ params: { id: 'e1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('toggleAttendance returns 404 if user missing', async () => {
    User.findById.mockResolvedValueOnce(null);

    const res = createRes();
    await eventController.toggleAttendance(
      { params: { id: 'e1' }, user: { sub: 'u1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('toggleAttendance removes attendance when already attending', async () => {
    User.findById.mockResolvedValueOnce({ attendedEvents: [{ toString: () => 'e1' }] });

    const res = createRes();
    await eventController.toggleAttendance(
      { params: { id: 'e1' }, user: { sub: 'u1' } },
      res,
      jest.fn()
    );

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { $pull: { attendedEvents: 'e1' } });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('toggleAttendance adds attendance when not attending', async () => {
    User.findById.mockResolvedValueOnce({ attendedEvents: [] });

    const res = createRes();
    await eventController.toggleAttendance(
      { params: { id: 'e1' }, user: { sub: 'u1' } },
      res,
      jest.fn()
    );

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { $addToSet: { attendedEvents: 'e1' } });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
