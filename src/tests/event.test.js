/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: event.test.js
 * Descripción: Pruebas para el controlador de eventos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
require("dotenv").config();
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const Event = require("../models/Event");

const testEvent = {
  externalId: "test-001",
  title: "Evento de prueba",
  description: "Descripción del evento de prueba",
  category: "Música",
  locationName: "Auditorio de Zaragoza",
  status: "active",
  startDate: "2026-06-01T10:00:00.000Z",
  endDate: "2026-06-01T12:00:00.000Z"
};

beforeAll(async () => {
  // Si mongoose no está conectado, conecta usando la URI del setup file
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  await Event.deleteMany({ externalId: "test-001" });
});

afterAll(async () => {
  await Event.deleteMany({ externalId: "test-001" });
  // No cierra la conexión aquí; la cierra el teardown global
});

describe("GET /api/events", () => {
  it("debe devolver 200 y estructura correcta", async () => {
    const res = await request(app).get("/api/events");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("debe soportar paginación", async () => {
    const res = await request(app).get("/api/events?page=1&limit=5");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });
});

describe("POST /api/events", () => {
  it("debe crear un evento y devolver 201", async () => {
    const res = await request(app).post("/api/events").send(testEvent);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(testEvent.title);
  });

  it("debe devolver 409 si el externalId ya existe", async () => {
    const res = await request(app).post("/api/events").send(testEvent);
    expect(res.status).toBe(409);
  });
});

describe("GET /api/events/:id", () => {
  let eventId;

  beforeAll(async () => {
    const event = await Event.findOne({ externalId: "test-001" });
    eventId = event._id.toString();
  }, 30000);

  it("debe devolver el evento por id", async () => {
    const res = await request(app).get(`/api/events/${eventId}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(eventId);
  });

  it("debe devolver 404 si no existe", async () => {
    const res = await request(app).get("/api/events/000000000000000000000000");
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/events/:id", () => {
  let eventId;

  beforeAll(async () => {
    const event = await Event.findOne({ externalId: "test-001" });
    eventId = event._id.toString();
  }, 30000);

  it("debe actualizar el evento y devolver 200", async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .send({ title: "Título actualizado" });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Título actualizado");
  });
});

describe("DELETE /api/events/:id", () => {
  let eventId;

  beforeAll(async () => {
    const event = await Event.findOne({ externalId: "test-001" });
    eventId = event._id.toString();
  }, 30000);

  it("debe eliminar el evento y devolver 200", async () => {
    const res = await request(app).delete(`/api/events/${eventId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("debe devolver 404 si ya fue eliminado", async () => {
    const res = await request(app).delete(`/api/events/${eventId}`);
    expect(res.status).toBe(404);
  });
});