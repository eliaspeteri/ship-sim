import {
  normalizeChatHistoryPayload,
  normalizeVesselHistoryChannel,
} from '../../../src/networking/socket/chatProjection';

describe('chatProjection', () => {
  it('normalizes vessel channels and message channels', () => {
    expect(normalizeVesselHistoryChannel('vessel:alpha_123')).toBe(
      'vessel:alpha',
    );

    const payload = normalizeChatHistoryPayload(
      {
        channel: 'vessel:alpha_123',
        reset: true,
        hasMore: false,
        messages: [
          {
            id: 'm-1',
            userId: 'u-1',
            username: 'Crew',
            message: 'hello',
            timestamp: 0,
          },
        ],
      },
      () => 123,
    );

    expect(payload.channel).toBe('vessel:alpha');
    expect(payload.messages[0]).toEqual(
      expect.objectContaining({
        channel: 'vessel:alpha',
        timestamp: 123,
      }),
    );
    expect(payload.reset).toBe(true);
  });
});
