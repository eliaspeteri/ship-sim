// This file contains the physics simulation logic, including hydrodynamics and propulsion calculations.
// These implementations mirror those in the WebAssembly module but are used for non-critical physics calculations
// and for physics model verification.

interface HydrodynamicsParams {
  hullResistance: number;
  waveInteraction: number;
  maneuveringForces: number;
  addedMass: number;
}

interface PropulsionParams {
  engineRPM: number;
  engineTorque: number;
  propellerThrust: number;
  fuelConsumption: number;
}

interface EnvironmentalParams {
  windSpeed: number;
  windDirection: number;
  currentSpeed: number;
  currentDirection: number;
  seaState: number;
}

interface StabilityParams {
  centerOfGravity: { x: number; y: number; z: number };
  metacentricHeight: number;
  trim: number; // positive = bow up
  list: number; // positive = starboard list
}

interface VesselProperties {
  mass: number;
  length: number;
  beam: number;
  draft: number;
  blockCoefficient: number;
}

export class PhysicsEngine {
  // Constants for physical calculations
  private readonly WATER_DENSITY = 1025.0; // kg/m³
  private readonly AIR_DENSITY = 1.225; // kg/m³
  private readonly GRAVITY = 9.81; // m/s²

  // Holtrop-Mennen model constants
  private readonly HM_C1 = 2223105.0;
  private readonly HM_C2 = 4.0;
  private readonly HM_C3 = 0.5;
  private readonly HM_C4 = 0.15;

  constructor() {
    // Initialize properties for the physics engine
  }

  /**
   * Calculate hydrodynamic forces acting on the vessel
   */
  calculateHydrodynamics(
    vessel: VesselProperties,
    speed: number,
    rudderAngle: number,
    seaState: number,
  ): HydrodynamicsParams {
    // Calculate hull resistance using Holtrop-Mennen method
    const hullResistance = this.calculateHullResistance(vessel, speed);

    // Calculate wave resistance
    const waveResistance = this.calculateWaveResistance(vessel, seaState);

    // Calculate maneuvering forces
    const maneuveringForces = this.calculateManeuveringForces(
      vessel,
      speed,
      rudderAngle,
    );

    // Calculate added mass effects
    const addedMass = vessel.mass * 0.05; // Simplified added mass calculation

    return {
      hullResistance: hullResistance,
      waveInteraction: waveResistance,
      maneuveringForces: maneuveringForces,
      addedMass: addedMass,
    };
  }

  /**
   * Calculate hull resistance using a simplified Holtrop-Mennen method
   */
  private calculateHullResistance(
    vessel: VesselProperties,
    speed: number,
  ): number {
    if (speed < 0.01) return 0.0;

    // Calculate wetted surface area (approximation)
    const wettedArea =
      vessel.length *
      (2.0 * vessel.draft + vessel.beam) *
      Math.sqrt(vessel.blockCoefficient) *
      0.8;

    // Calculate Froude number
    const froudeNum = speed / Math.sqrt(this.GRAVITY * vessel.length);

    // Calculate Reynolds number
    const kineViscosity = 0.000001187; // m²/s at 20°C
    const reynoldsNum = (speed * vessel.length) / kineViscosity;

    // Friction resistance coefficient (ITTC-57)
    const Cf = 0.075 / Math.pow(Math.log10(reynoldsNum) - 2.0, 2.0);

    // Friction resistance
    const Rf = 0.5 * this.WATER_DENSITY * speed * speed * wettedArea * Cf;

    // Residual resistance (simplified from Holtrop-Mennen)
    const displacement =
      vessel.length * vessel.beam * vessel.draft * vessel.blockCoefficient;
    const Rr =
      this.HM_C1 *
      displacement *
      Math.pow(froudeNum, this.HM_C2) *
      Math.exp(-this.HM_C3 / Math.pow(froudeNum, this.HM_C4));

    // Total resistance
    return Rf + Rr;
  }

  /**
   * Calculate added resistance due to waves
   */
  private calculateWaveResistance(
    vessel: VesselProperties,
    seaState: number,
  ): number {
    // Simplified calculation based on sea state (Beaufort scale 0-12)
    const waveHeight = Math.pow(seaState, 2.0) * 0.05; // Approximate wave height in meters

    // Added resistance increases with square of wave height and is proportional to vessel size
    return (
      (500.0 * waveHeight * waveHeight * vessel.length * vessel.beam) / 100.0
    );
  }

  /**
   * Calculate maneuvering forces based on rudder angle and speed
   */
  private calculateManeuveringForces(
    vessel: VesselProperties,
    speed: number,
    rudderAngle: number,
  ): number {
    if (speed < 0.01) return 0;

    // Rudder characteristics
    const aspectRatio = 1.5;
    const rudderArea = 0.02 * vessel.length * vessel.draft;
    const rudderLift =
      ((Math.PI * aspectRatio) / (1.0 + aspectRatio)) *
      rudderAngle *
      rudderArea *
      0.5 *
      this.WATER_DENSITY *
      speed *
      speed;

    // Return rudder force magnitude
    return Math.abs(rudderLift);
  }

  /**
   * Calculate propulsion forces and engine parameters
   */
  calculatePropulsion(
    vessel: VesselProperties,
    throttle: number,
    engineRPM: number,
    speed: number,
  ): PropulsionParams {
    // Calculate engine torque
    const maxPower = 2000.0; // kW
    const engineTorque = this.calculateEngineTorque(
      engineRPM,
      throttle,
      maxPower,
    );

    // Calculate propeller thrust
    const propellerDiameter = 3.0; // m
    const thrust = this.calculatePropellerThrust(
      vessel,
      engineRPM,
      engineTorque,
      speed,
      propellerDiameter,
    );

    // Calculate fuel consumption
    const fuelConsumption = this.calculateFuelConsumption(
      engineTorque,
      engineRPM,
      maxPower,
    );

    return {
      engineRPM: engineRPM,
      engineTorque: engineTorque,
      propellerThrust: thrust,
      fuelConsumption: fuelConsumption,
    };
  }

  /**
   * Calculate diesel engine torque based on RPM
   */
  private calculateEngineTorque(
    rpm: number,
    throttle: number,
    maxPower: number,
  ): number {
    if (rpm < 1) return 0;

    // Simplified diesel engine torque curve characteristics
    const maxTorque = (maxPower * 9550.0) / 0.8 / rpm; // Nm at peak torque RPM
    const rpmRatio = rpm / (maxPower / 5.0); // Normalized RPM

    // Simplified torque curve, peaking at around 80% of max RPM
    let torqueFactor: number;
    if (rpmRatio < 0.1) {
      torqueFactor = rpmRatio * 5.0; // Linear increase at very low RPM
    } else if (rpmRatio < 0.8) {
      torqueFactor = 0.5 + rpmRatio / 1.6; // Increasing to peak
    } else {
      torqueFactor = 1.0 - (rpmRatio - 0.8) / 2.0; // Decreasing after peak
    }

    return maxTorque * torqueFactor * throttle;
  }

  /**
   * Calculate propeller thrust from engine torque and ship speed
   */
  private calculatePropellerThrust(
    vessel: VesselProperties,
    rpm: number,
    torque: number,
    speed: number,
    diameter: number,
  ): number {
    // Calculate wake fraction (simplified)
    const wakeFraction = 0.3 * vessel.blockCoefficient;

    // Speed of advance to the propeller
    const speedAdvance = speed * (1.0 - wakeFraction);

    // Calculate propeller advance coefficient J
    const propRPS = rpm / 60.0 / 3.0; // Assuming 3:1 gear ratio
    const J = Math.abs(speedAdvance) / (propRPS * diameter + 0.001);

    // Simplified thrust coefficient based on advance coefficient
    const KT = Math.max(0.0, 0.5 - 0.4 * J); // Approximation of thrust coefficient

    // Calculate propeller thrust
    return (
      KT * this.WATER_DENSITY * propRPS * propRPS * Math.pow(diameter, 4.0)
    );
  }

  /**
   * Calculate fuel consumption based on engine power and RPM
   */
  private calculateFuelConsumption(
    torque: number,
    rpm: number,
    maxPower: number,
  ): number {
    // Simple model: consumption proportional to torque and RPM
    const powerFactor = (torque * rpm) / 9550.0; // Power in kW

    // Specific fuel consumption (g/kWh) - lower at optimal load
    let sfc: number;
    const loadFactor = powerFactor / maxPower;

    // SFC curve with minimum around 80% load
    if (loadFactor < 0.2) {
      sfc = 220.0 + (0.2 - loadFactor) * 400.0; // Higher at very low loads
    } else if (loadFactor < 0.8) {
      sfc = 220.0 - (loadFactor - 0.2) * 20.0; // Decreasing to optimal
    } else {
      sfc = 200.0 + (loadFactor - 0.8) * 50.0; // Increasing after optimal
    }

    // Calculate consumption in kg/h
    return (powerFactor * sfc) / 1000.0;
  }

  /**
   * Calculate vessel stability parameters
   */
  calculateStability(
    vessel: VesselProperties,
    fuelLevel: number,
    ballastLevel: number,
  ): StabilityParams {
    // Calculate center of gravity
    const cg = this.calculateCenterOfGravity(vessel, fuelLevel, ballastLevel);

    // Calculate metacentric height
    const gm = this.calculateGM(vessel, cg);

    // Calculate trim and list (simplified for now)
    const trim = (cg.x / vessel.length) * 2.0; // Rough approximation
    const list = (cg.y / vessel.beam) * 3.0; // Rough approximation

    return {
      centerOfGravity: cg,
      metacentricHeight: gm,
      trim: trim,
      list: list,
    };
  }

  /**
   * Calculate center of gravity based on fuel, ballast, and cargo
   */
  private calculateCenterOfGravity(
    vessel: VesselProperties,
    fuelLevel: number,
    ballastLevel: number,
  ): { x: number; y: number; z: number } {
    // Base CG position without variable weights
    const baseCGX = 0.0;
    const baseCGY = 0.0;
    const baseCGZ = vessel.draft * 0.5;

    // Mass of base vessel (empty)
    const emptyMass = vessel.mass * 0.7;

    // Fuel tank properties (simplified)
    const fuelTankMaxMass = vessel.mass * 0.1;
    const fuelMass = fuelTankMaxMass * fuelLevel;
    const fuelCGX = -0.2 * vessel.length; // Fuel tanks typically aft
    const fuelCGZ = vessel.draft * 0.3; // Low in the vessel

    // Ballast tank properties
    const ballastTankMaxMass = vessel.mass * 0.2;
    const ballastMass = ballastTankMaxMass * ballastLevel;
    const ballastCGZ = vessel.draft * 0.1; // Very low in the vessel

    // Calculate combined center of gravity
    const totalMass = emptyMass + fuelMass + ballastMass;

    const cgX = (emptyMass * baseCGX + fuelMass * fuelCGX) / totalMass;
    const cgY = (emptyMass * baseCGY) / totalMass; // Assuming symmetry in Y
    const cgZ =
      (emptyMass * baseCGZ + fuelMass * fuelCGZ + ballastMass * ballastCGZ) /
      totalMass;

    return { x: cgX, y: cgY, z: cgZ };
  }

  /**
   * Calculate metacentric height (GM) - a measure of stability
   */
  private calculateGM(
    vessel: VesselProperties,
    cg: { x: number; y: number; z: number },
  ): number {
    // Calculate second moment of area of the waterplane
    const waterplaneArea = vessel.length * vessel.beam;
    const Iyy_waterplane = (waterplaneArea * vessel.beam * vessel.beam) / 12.0;

    // Calculate metacenter height above keel
    const volume =
      vessel.length * vessel.beam * vessel.draft * vessel.blockCoefficient;
    const KM = vessel.draft + Iyy_waterplane / (this.WATER_DENSITY * volume);

    // GM = KM - KG
    return KM - cg.z;
  }

  /**
   * Calculate environmental forces on the vessel
   */
  calculateEnvironmentalForces(
    vessel: VesselProperties,
    heading: number,
    params: EnvironmentalParams,
  ): { forceX: number; forceY: number; momentZ: number } {
    // Calculate wind forces
    const windForces = this.calculateWindForce(
      vessel,
      heading,
      params.windSpeed,
      params.windDirection,
    );

    // Calculate current forces
    const currentForces = this.calculateCurrentForce(
      vessel,
      heading,
      params.currentSpeed,
      params.currentDirection,
    );

    return {
      forceX: windForces.forceX + currentForces.forceX,
      forceY: windForces.forceY + currentForces.forceY,
      momentZ: windForces.momentZ + currentForces.momentZ,
    };
  }

  /**
   * Calculate wind forces on the vessel
   */
  private calculateWindForce(
    vessel: VesselProperties,
    heading: number,
    windSpeed: number,
    windDirection: number,
  ): { forceX: number; forceY: number; momentZ: number } {
    // Relative wind direction (0 = head wind, PI = following wind)
    const relativeDirection = windDirection - heading;

    // Projected areas (simplified)
    const projectedAreaFront = vessel.beam * vessel.draft * 1.5; // Include superstructure
    const projectedAreaSide = vessel.length * vessel.draft * 1.5; // Include superstructure

    // Wind coefficients
    const windCoefficientX = 0.5 + 0.4 * Math.abs(Math.cos(relativeDirection));
    const windCoefficientY = 0.7 * Math.abs(Math.sin(relativeDirection));
    const windCoefficientN = 0.1 * Math.sin(2.0 * relativeDirection);

    // Calculate wind forces
    const forceX =
      0.5 *
      this.AIR_DENSITY *
      windSpeed *
      windSpeed *
      projectedAreaFront *
      windCoefficientX *
      Math.cos(relativeDirection);

    const forceY =
      0.5 *
      this.AIR_DENSITY *
      windSpeed *
      windSpeed *
      projectedAreaSide *
      windCoefficientY *
      Math.sin(relativeDirection);

    const momentZ =
      0.5 *
      this.AIR_DENSITY *
      windSpeed *
      windSpeed *
      projectedAreaSide *
      vessel.length *
      windCoefficientN;

    return { forceX, forceY, momentZ };
  }

  /**
   * Calculate current forces on the vessel
   */
  private calculateCurrentForce(
    vessel: VesselProperties,
    heading: number,
    currentSpeed: number,
    currentDirection: number,
  ): { forceX: number; forceY: number; momentZ: number } {
    // Relative current direction
    const relativeDirection = currentDirection - heading;

    // Wetted area (simplified)
    const wettedAreaSide = vessel.length * vessel.draft * 0.7;
    const wettedAreaBottom =
      vessel.length * vessel.beam * vessel.blockCoefficient;

    // Current coefficients
    const currentCoefficientX =
      0.5 + 0.3 * Math.abs(Math.cos(relativeDirection));
    const currentCoefficientY = 0.8 * Math.abs(Math.sin(relativeDirection));
    const currentCoefficientN = 0.1 * Math.sin(2.0 * relativeDirection);

    // Calculate current forces
    const forceX =
      0.5 *
      this.WATER_DENSITY *
      currentSpeed *
      currentSpeed *
      wettedAreaBottom *
      currentCoefficientX *
      Math.cos(relativeDirection);

    const forceY =
      0.5 *
      this.WATER_DENSITY *
      currentSpeed *
      currentSpeed *
      wettedAreaSide *
      currentCoefficientY *
      Math.sin(relativeDirection);

    const momentZ =
      0.5 *
      this.WATER_DENSITY *
      currentSpeed *
      currentSpeed *
      wettedAreaSide *
      vessel.length *
      currentCoefficientN;

    return { forceX, forceY, momentZ };
  }
}
