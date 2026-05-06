const nodemailer = require('nodemailer');
const mapZaragozaEvent = require('../../models/eventMapper');

jest.mock('nodemailer', () => ({
  createTransport: jest.fn()
}));

let sendEmail;

describe('utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sendEmail sends mail', async () => {
    const sendMail = jest.fn().mockResolvedValueOnce({ messageId: 'm1' });
    nodemailer.createTransport.mockReturnValueOnce({ sendMail });

    jest.isolateModules(() => {
      sendEmail = require('../../utils/email').sendEmail;
    });

    const result = await sendEmail({ to: 'a@b.com', subject: 'Hi', html: '<p>Ok</p>' });

    expect(sendMail).toHaveBeenCalled();
    expect(result.messageId).toBe('m1');
  });

  it('mapZaragozaEvent maps basic fields', () => {
    const event = {
      id: 1,
      title: 'Title',
      description: 'Desc',
      category: [{ title: 'C' }],
      geometry: { coordinates: [-0.9, 41.6] }
    };

    const result = mapZaragozaEvent(event);
    expect(result.externalId).toBe('1');
    expect(result.latitude).toBe(41.6);
    expect(result.longitude).toBe(-0.9);
  });

  it('mapZaragozaEvent handles missing coords', () => {
    const result = mapZaragozaEvent({ id: 2, geometry: { coordinates: [] } });
    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
  });

  it('mapZaragozaEvent returns nulls for out-of-range UTM', () => {
    const result = mapZaragozaEvent({
      id: 3,
      geometry: { coordinates: [5000000, 5000000] }
    });
    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
  });
});
