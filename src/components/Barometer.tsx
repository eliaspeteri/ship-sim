import type { JSX } from 'react';
import React from 'react';

interface BarometerProps {
  pressureHpa: number; // Current pressure in hectopascals
  referencePressureHpa: number; // Manually set reference pressure
  temperatureCelsius: number; // Current temperature in Celsius
  size?: number;
}

// Conversion constants
const HPA_TO_INHG = 0.02953;
const CELSIUS_TO_FAHRENHEIT = (c: number) => (c * 9) / 5 + 32;

// Scale ranges
const PRESSURE_HPA_MIN = 960; // Updated range
const PRESSURE_HPA_MAX = 1040; // Updated range
const PRESSURE_INHG_MIN = PRESSURE_HPA_MIN * HPA_TO_INHG; // ~28.35
const PRESSURE_INHG_MAX = PRESSURE_HPA_MAX * HPA_TO_INHG; // ~30.71
const TEMP_CELSIUS_MIN = -10; // Keeping this range as it matches image better
const TEMP_CELSIUS_MAX = 50;
const TEMP_FAHRENHEIT_MIN = CELSIUS_TO_FAHRENHEIT(TEMP_CELSIUS_MIN); // ~14
const TEMP_FAHRENHEIT_MAX = CELSIUS_TO_FAHRENHEIT(TEMP_CELSIUS_MAX); // ~122

// Angle ranges
const PRESSURE_ANGLE_START = -90;
const PRESSURE_ANGLE_END = 90;
const TEMP_ANGLE_START = 135; // Bottom-left
const TEMP_ANGLE_END = 225; // Bottom-right

// Helper function to get point on circle
const getPointOnCircle = (
  ...args: [cx: number, cy: number, r: number, angleDeg: number]
) => {
  const [cx, cy, r, angleDeg] = args;
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
};

// Updated TickOptions to include label placement adjustment
interface TickOptions {
  radius: number;
  tickLength: number;
  labelOffset: number;
  fontSize: number;
  majorTickEvery?: number;
  labelEvery?: number;
  skipLabels?: number[];
  tickColor?: string;
  labelColor?: string;
  labelRotation?: number;
  placeLabelBetweenTicks?: boolean; // New option
}

// Updated generateScaleTicks helper
const generateScaleTicks = (
  ...args: [
    minVal: number,
    maxVal: number,
    numTicks: number,
    startAngle: number,
    endAngle: number,
    center: number,
    options: TickOptions,
    valueToLabel: (value: number, index: number, totalTicks: number) => string,
  ]
): JSX.Element[] => {
  const [
    minVal,
    maxVal,
    numTicks,
    startAngle,
    endAngle,
    center,
    options,
    valueToLabel,
  ] = args;
  const ticks: JSX.Element[] = [];
  const valueRange = maxVal - minVal;
  const angleRange = endAngle - startAngle;
  const {
    radius,
    tickLength,
    labelOffset,
    fontSize,
    majorTickEvery = 5, // Interval between major ticks
    labelEvery = 10, // Interval between labels
    skipLabels = [],
    tickColor = 'black',
    labelColor = 'black',
    labelRotation = 0,
    placeLabelBetweenTicks = false, // Default to placing on tick
  } = options;

  const valuePerTick = valueRange / numTicks;
  const anglePerTick = angleRange / numTicks;

  for (let i = 0; i <= numTicks; i++) {
    const value = minVal + valuePerTick * i;
    const angle = startAngle + anglePerTick * i;
    const isMajor = i % majorTickEvery === 0;
    // Determine if this tick index should have a label based on labelEvery setting
    const shouldAttemptLabel = i % labelEvery === 0;
    const currentTickLength = isMajor ? tickLength * 1.5 : tickLength;

    const startPoint = getPointOnCircle(center, center, radius, angle);
    const endPoint = getPointOnCircle(
      center,
      center,
      radius - currentTickLength,
      angle,
    );

    // Draw Tick Mark
    ticks.push(
      <line
        key={`tick-${i}-${radius}`}
        x1={startPoint.x}
        y1={startPoint.y}
        x2={endPoint.x}
        y2={endPoint.y}
        stroke={tickColor}
        strokeWidth={isMajor ? 1.5 : 1}
      />,
    );

    // Draw Label if this index is designated for labeling
    if (shouldAttemptLabel) {
      // Calculate angle for label: either on the tick or halfway to the next one
      const labelAngle = placeLabelBetweenTicks
        ? angle - anglePerTick / 2 // Place *before* the current tick (between previous and current)
        : angle;

      // Ensure label angle doesn't go before the start angle if placing between ticks
      if (labelAngle < startAngle && placeLabelBetweenTicks) continue;
      // Skip label if value is in skipLabels list
      if (skipLabels.includes(value)) continue;

      const labelPoint = getPointOnCircle(
        center,
        center,
        radius - labelOffset,
        labelAngle,
      );
      // Get the label text using the provided function
      const labelText = valueToLabel(value, i, numTicks);

      if (labelText) {
        // Only render if label text is not empty
        ticks.push(
          <text
            key={`label-${i}-${radius}`}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fontSize}
            fill={labelColor}
            transform={`rotate(${labelAngle + labelRotation} ${labelPoint.x} ${labelPoint.y})`}
          >
            {labelText}
          </text>,
        );
      }
    }
  }
  return ticks;
};

const Barometer: React.FC<BarometerProps> = ({
  pressureHpa,
  referencePressureHpa,
  temperatureCelsius,
  size = 200,
}) => {
  const radius = size / 2;
  const center = size / 2;
  const frameWidth = size * 0.05;
  const innerRadius = radius - frameWidth;

  // --- Define Radii --- (Adjusted slightly)
  const weatherScaleRadius = innerRadius * 0.95;
  const inHgScaleRadius = innerRadius * 0.85;
  const hpaScaleRadius = innerRadius * 0.7;
  const tempCRadius = innerRadius * 0.85;
  const tempFRadius = innerRadius * 0.7;
  const thermometerTubeRadius = innerRadius * 0.6;

  // Helper to map value to angle
  const mapValueToAngle = (
    ...args: [
      value: number,
      minVal: number,
      maxVal: number,
      startAngle: number,
      endAngle: number,
    ]
  ): number => {
    const [value, minVal, maxVal, startAngle, endAngle] = args;
    const range = maxVal - minVal;
    const angleRange = endAngle - startAngle;
    const normalized = Math.max(0, Math.min(1, (value - minVal) / range));
    return startAngle + normalized * angleRange;
  };

  // Calculate pressure needle angles
  const pressureAngle = mapValueToAngle(
    pressureHpa,
    PRESSURE_HPA_MIN,
    PRESSURE_HPA_MAX,
    PRESSURE_ANGLE_START, // -90
    PRESSURE_ANGLE_END, // +90
  );
  const referenceAngle = mapValueToAngle(
    referencePressureHpa,
    PRESSURE_HPA_MIN,
    PRESSURE_HPA_MAX,
    PRESSURE_ANGLE_START, // -90
    PRESSURE_ANGLE_END, // +90
  );

  // --- Generate Scale Elements ---

  // Pressure Scales (Rotated Left: labelRotation = 0)
  const inHgTicks = generateScaleTicks(
    // Imperial (Outer) - Range 28.35 to 30.71
    PRESSURE_INHG_MIN,
    PRESSURE_INHG_MAX,
    24, // Approx 2.4 range / 0.1 per tick = 24 ticks
    PRESSURE_ANGLE_START,
    PRESSURE_ANGLE_END,
    center,
    {
      radius: inHgScaleRadius,
      tickLength: 5,
      labelOffset: 18,
      fontSize: 7, // Increased labelOffset
      majorTickEvery: 5, // Major tick every 0.5 inHg
      labelEvery: 5, // Label every 0.5 inHg
      tickColor: 'black',
      labelColor: 'black',
      labelRotation: 0,
      placeLabelBetweenTicks: true, // Place labels between ticks
    },
    (value, i, totalTicks) => {
      // Custom label logic for inHg
      const valueAtLabelPos =
        value - (PRESSURE_INHG_MAX - PRESSURE_INHG_MIN) / totalTicks / 2;
      const roundedTen = Math.round(valueAtLabelPos * 10); // e.g., 285, 290, 295, 300, 305

      // Label '.5' values with '5'
      if (roundedTen % 10 === 5) {
        // Check bounds roughly - avoid labeling too close to ends if needed
        if (valueAtLabelPos > 28.4 && valueAtLabelPos < 30.6) return '5';
      }
      // Label whole numbers (except potentially the very first/last if they fall on label interval)
      else if (roundedTen % 10 === 0) {
        // Check bounds roughly
        if (valueAtLabelPos > 28.8 && valueAtLabelPos < 30.2)
          return (roundedTen / 10).toString(); // Show 29, 30
      }
      return ''; // Don't label other ticks
    },
  );

  const hpaTicks = generateScaleTicks(
    // Metric (Inner) - Range 960 to 1040
    PRESSURE_HPA_MIN,
    PRESSURE_HPA_MAX,
    16, // 80 hPa range / 5 hPa per tick = 16 ticks
    PRESSURE_ANGLE_START,
    PRESSURE_ANGLE_END,
    center,
    {
      radius: hpaScaleRadius,
      tickLength: 4,
      labelOffset: 12,
      fontSize: 6, // Reduced fontSize
      majorTickEvery: 1,
      labelEvery: 2, // Label every 10 hPa
      tickColor: '#444',
      labelColor: '#333',
      labelRotation: 0,
    },
    v => v.toFixed(0), // Pass index, though not used here
  );

  // Weather words (Outermost, Curved Text Path)
  const weatherWords = [
    { label: 'Stormy', hpa: 970 },
    { label: 'Rain', hpa: 985 },
    { label: 'Change', hpa: 1000 },
    { label: 'Fair', hpa: 1015 },
    { label: 'Very Dry', hpa: 1030 },
  ];

  // Create an invisible arc path for the weather words to follow
  const weatherPathRadius = weatherScaleRadius * 1.02; // Slightly larger radius for text path
  const weatherArcStart = getPointOnCircle(
    center,
    center,
    weatherPathRadius,
    PRESSURE_ANGLE_START,
  );
  const weatherArcEnd = getPointOnCircle(
    center,
    center,
    weatherPathRadius,
    PRESSURE_ANGLE_END,
  );
  const weatherArcPath = `M ${weatherArcStart.x} ${weatherArcStart.y} A ${weatherPathRadius} ${weatherPathRadius} 0 1 1 ${weatherArcEnd.x} ${weatherArcEnd.y}`;

  // Generate text path elements for each weather word
  const weatherLabels = weatherWords
    .map(word => {
      // Only include words within the hPa range
      if (word.hpa < PRESSURE_HPA_MIN || word.hpa > PRESSURE_HPA_MAX)
        return null;

      // Calculate percentage position along the path based on pressure value
      const percentage =
        ((word.hpa - PRESSURE_HPA_MIN) /
          (PRESSURE_HPA_MAX - PRESSURE_HPA_MIN)) *
        100;

      return (
        <text key={word.label} fontSize="9" fontWeight="bold" fill="#222">
          <textPath
            href="#weather-path"
            startOffset={`${percentage}%`}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {word.label.toUpperCase()}
          </textPath>
        </text>
      );
    })
    .filter(Boolean);

  // Temperature Scales (Rotated Right: labelRotation = 180)
  const tempCTicks = generateScaleTicks(
    // Celsius (Outer) - Inverted scale direction
    TEMP_CELSIUS_MAX, // Start from max value
    TEMP_CELSIUS_MIN, // End at min value
    12, // 60 C range / 5 C per tick = 12 ticks
    TEMP_ANGLE_START,
    TEMP_ANGLE_END,
    center,
    {
      radius: tempCRadius,
      tickLength: 5,
      labelOffset: 15,
      fontSize: 8,
      majorTickEvery: 1,
      labelEvery: 2, // Label every 10 C
      tickColor: 'black',
      labelColor: 'black',
      labelRotation: 180,
    },
    v => v.toFixed(0),
  );

  const tempFTicks = generateScaleTicks(
    // Fahrenheit (Inner) - Inverted scale direction
    TEMP_FAHRENHEIT_MAX, // Start from max value
    TEMP_FAHRENHEIT_MIN, // End at min value
    11, // ~108 F range / ~10 F per tick = 11 ticks
    TEMP_ANGLE_START,
    TEMP_ANGLE_END,
    center,
    {
      radius: tempFRadius,
      tickLength: 4,
      labelOffset: 12,
      fontSize: 7,
      majorTickEvery: 1,
      labelEvery: 2, // Label every ~20 F
      tickColor: '#444',
      labelColor: '#333',
      labelRotation: 180,
    },
    v => v.toFixed(0),
  );

  // --- Generate Thermometer Fill --- (Corrected Logic)
  const tempValueNormalized = Math.max(
    0,
    Math.min(
      1,
      (temperatureCelsius - TEMP_CELSIUS_MIN) /
        (TEMP_CELSIUS_MAX - TEMP_CELSIUS_MIN),
    ),
  );
  // Invert the normalized value to flip the scale direction
  const invertedTempValueNormalized = 1 - tempValueNormalized;

  // Map normalized value to angle range (now mapping high temps to 135° and low temps to 225°)
  const tempFillAngle =
    TEMP_ANGLE_START +
    invertedTempValueNormalized * (TEMP_ANGLE_END - TEMP_ANGLE_START);

  const tempTubeStart = getPointOnCircle(
    center,
    center,
    thermometerTubeRadius,
    TEMP_ANGLE_START,
  ); // Left point (135 deg)
  const tempTubeEnd = getPointOnCircle(
    center,
    center,
    thermometerTubeRadius,
    TEMP_ANGLE_END,
  ); // Right point (225 deg)
  const tempFillStart = tempTubeEnd; // Fill starts from the right point (225°)
  const tempFillCurrentEnd = getPointOnCircle(
    center,
    center,
    thermometerTubeRadius,
    tempFillAngle,
  ); // Point corresponding to current temp

  // Arc flags for both tube and fill paths - consistent direction
  const largeArcFlagFill = 0; // Always < 180 degrees
  const sweepFlagFill = 0; // Sweep counterclockwise

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <path id="weather-path" d={weatherArcPath} fill="none" />
          {/* Shiny gold gradient for the golden background and frame */}
          <linearGradient
            id="goldenBezelGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#fff8dc" />
            <stop offset="30%" stopColor="#ffe066" />
            <stop offset="50%" stopColor="#daa520" />
            <stop offset="70%" stopColor="#fff8dc" />
            <stop offset="100%" stopColor="#b8860b" />
          </linearGradient>
          {/* Drop shadow for depth */}
          <filter
            id="goldDropShadow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="1" dy="1" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Frame */}
        <circle cx={center} cy={center} r={radius} fill="#8b4513" />
        {/* Inner Golden Background */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="url(#goldenBezelGradient)"
          filter="url(#goldDropShadow)"
          stroke="#b8860b"
          strokeWidth="1"
        />

        {/* Scales */}
        <g id="weather-labels">
          {/* Weather words follow the curved path */}
          {weatherLabels}
        </g>
        <g id="inhg-scale">{inHgTicks}</g>
        <g id="hpa-scale">{hpaTicks}</g>
        <g id="temp-c-scale">{tempCTicks}</g>
        <g id="temp-f-scale">{tempFTicks}</g>

        {/* Curved Thermometer Tube */}
        <path
          // Draw the tube arc from end (225°) to start (135°) for complete 180° flip
          d={`M ${tempTubeEnd.x} ${tempTubeEnd.y} A ${thermometerTubeRadius} ${thermometerTubeRadius} 0 ${largeArcFlagFill} ${sweepFlagFill} ${tempTubeStart.x} ${tempTubeStart.y}`}
          stroke="gray"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        {/* Thermometer Fill */}
        <path
          // Draw the fill arc from the maximum temp point to the current temp angle
          d={`M ${tempFillStart.x} ${tempFillStart.y} A ${thermometerTubeRadius} ${thermometerTubeRadius} 0 ${largeArcFlagFill} ${sweepFlagFill} ${tempFillCurrentEnd.x} ${tempFillCurrentEnd.y}`}
          stroke="red"
          strokeWidth="4"
          fill="none"
          strokeLinecap="butt" // Use butt cap for fill
        />

        {/* Needles Group */}
        <g transform={`translate(${center} ${center})`}>
          {/* Reference Pressure Needle (Gold/Brass) */}
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={-innerRadius * 0.9} // Points up
            stroke="#b8860b" // Dark gold
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${referenceAngle})`}
          />
          {/* Main Pressure Needle (Black) */}
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={-innerRadius * 0.9} // Points up
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${pressureAngle})`}
          />
          {/* Center Pivot */}
          <circle cx={0} cy={0} r="4" fill="black" />
        </g>
      </svg>
    </div>
  );
};

export default Barometer;
