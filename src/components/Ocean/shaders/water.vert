precision highp float;

uniform float uTime;
uniform vec3 uMeshPosition; // Add uniform for mesh's world position

uniform float uWavesAmplitude;
uniform float uWavesSpeed;
uniform float uWavesFrequency;
uniform float uWavesPersistence;
uniform float uWavesLacunarity;
uniform float uWavesIterations;

varying vec3 vNormal;
varying vec3 vWorldPosition;

//	Simplex 3D Noise 
//	by Ian McEwan, Stefan Gustavson (https://github.com/stegu/webgl-noise)
//
vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}
vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

// Simplex 2D noise
//
vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Function to safely normalize a vector, avoiding division by zero
vec3 safeNormalize(vec3 v) {
  float len = length(v);
  // Use a small epsilon to check against zero length
  if (len < 0.00001) {
    // Return a default up vector if length is near zero
    return vec3(0.0, 1.0, 0.0);
  }
  return v / len;
}

// Helper function to calculate elevation at any point
float getElevation(float x, float z) {
  // Calculate world-space consistent position by compensating for mesh movement
  // This creates a fixed reference frame for the waves independent of mesh position
  vec2 worldPos = vec2(x - uMeshPosition.x, z - uMeshPosition.z);
  
  // Apply a scaling factor to the input position
  float posScale = 0.05;
  vec2 scaledPos = worldPos * posScale;
  
  float elevation = 0.0;
  float amplitude = 1.0;
  float frequency = uWavesFrequency;
  
  // Apply multi-octave noise with stronger amplitude
  for(float i = 0.0; i < uWavesIterations; i++) {
    // Use fixed world position for sampling noise, ensuring consistent animation
    float noiseValue = snoise(vec2(
      scaledPos.x * frequency + uTime * uWavesSpeed * 0.3,
      scaledPos.y * frequency + uTime * uWavesSpeed * 0.2
    ));
    
    elevation += amplitude * noiseValue;
    
    // Prepare for next octave
    amplitude *= uWavesPersistence;
    frequency *= uWavesLacunarity;
  }

  // Apply amplitude multiplier
  elevation *= uWavesAmplitude * 2.5;
  
  // Add larger-scale undulation using world-space position
  elevation += sin(scaledPos.x * 0.1 + uTime * 0.05) * cos(scaledPos.y * 0.1) * uWavesAmplitude * 0.5;

  return elevation;
}

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  float elevation = getElevation(modelPosition.x, modelPosition.z);
  modelPosition.y += elevation;

  // Calculate normal using partial derivatives
  float eps = 0.001;
  // Calculate elevation at slightly offset points for derivatives
  float elevationX = getElevation(modelPosition.x - eps, modelPosition.z);
  float elevationZ = getElevation(modelPosition.x, modelPosition.z - eps);

  // Calculate tangent and bitangent based on elevation differences
  vec3 tangent = vec3(eps, elevationX - elevation, 0.0);
  vec3 bitangent = vec3(0.0, elevationZ - elevation, eps);

  // Calculate the cross product for the normal
  vec3 crossNormal = cross(tangent, bitangent);

  // Use safeNormalize instead of normalize
  vec3 objectNormal = safeNormalize(crossNormal);

  vNormal = objectNormal;
  vWorldPosition = modelPosition.xyz;

  gl_Position = projectionMatrix * viewMatrix * modelPosition;
}
