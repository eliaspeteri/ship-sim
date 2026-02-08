describe('constants/vessel', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_MAX_CREW;
    jest.resetModules();
  });

  it('clamps rudder angle to max range', async () => {
    const vessel = await import('../../../src/constants/vessel');

    expect(vessel.clampRudderAngle(0)).toBe(0);
    expect(vessel.clampRudderAngle(vessel.RUDDER_MAX_ANGLE_RAD * 2)).toBe(
      vessel.RUDDER_MAX_ANGLE_RAD,
    );
    expect(vessel.clampRudderAngle(-vessel.RUDDER_MAX_ANGLE_RAD * 2)).toBe(
      -vessel.RUDDER_MAX_ANGLE_RAD,
    );
  });

  it('derives crew limit from env and exposes default hydro values', async () => {
    process.env.NEXT_PUBLIC_MAX_CREW = '7';
    const vessel = await import('../../../src/constants/vessel');

    expect(vessel.MAX_CREW).toBe(7);
    expect(vessel.DEFAULT_HYDRO.rudderStallAngle).toBe(
      vessel.RUDDER_STALL_ANGLE_RAD,
    );
    expect(vessel.DEFAULT_HYDRO.rudderMaxAngle).toBe(
      vessel.RUDDER_MAX_ANGLE_RAD,
    );
    expect(vessel.DEFAULT_HYDRO.maxThrust).toBeGreaterThan(0);
  });
});
