precision highp float;

uniform float uOpacity;

uniform vec3 uTroughColor;
uniform vec3 uSurfaceColor;
uniform vec3 uPeakColor;

uniform float uPeakThreshold;
uniform float uPeakTransition;
uniform float uTroughThreshold;
uniform float uTroughTransition;

uniform float uFresnelScale;
uniform float uFresnelPower;

varying vec3 vNormal;
varying vec3 vWorldPosition;

uniform samplerCube uEnvironmentMap;

// Simple hash function for foam pattern noise
float hash(vec2 p) {
  p = 50.0 * fract(p * 0.3183099);
  return fract(p.x * p.y * (p.x + p.y));
}

// Value noise for foam texture
float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Multi-octave foam noise
float foamNoise(vec2 p) {
  float result = 0.0;
  float amp = 1.0;
  float freq = 1.0;
  
  for(int i = 0; i < 3; i++) {
    result += valueNoise(p * freq) * amp;
    amp *= 0.5;
    freq *= 2.0;
  }
  
  return result;
}

void main() {
  // Calculate vector from camera to the vertex
  vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
  vec3 reflectedDirection = reflect(viewDirection, vNormal);
  reflectedDirection.x = -reflectedDirection.x;

  // Sample environment map to get the reflected color
  vec4 reflectionColor = textureCube(uEnvironmentMap, reflectedDirection);

  // Calculate fresnel effect with stronger power for more pronounced reflection at grazing angles
  float fresnel = uFresnelScale * pow(1.0 - clamp(dot(-viewDirection, vNormal), 0.0, 1.0), uFresnelPower * 1.5);

  // Calculate elevation-based color
  float elevation = vWorldPosition.y;

  // More pronounced color transitions at wave peaks and troughs
  float peakFactor = smoothstep(uPeakThreshold - uPeakTransition, uPeakThreshold + uPeakTransition, elevation);
  float troughFactor = smoothstep(uTroughThreshold - uTroughTransition, uTroughThreshold + uTroughTransition, elevation);

  // Mix between trough and surface colors based on trough transition
  vec3 mixedColor1 = mix(uTroughColor, uSurfaceColor, troughFactor);

  // Generate foam noise pattern using world position for stability
  vec2 foamUV = vWorldPosition.xz * 0.1;
  float foamPattern = foamNoise(foamUV);
  
  // Create more pronounced whitecaps/foam at wave peaks
  float foamIntensity = 0.0;
  if (elevation > uPeakThreshold * 0.5) {
    // Scale foam intensity by how high above threshold the point is
    foamIntensity = smoothstep(uPeakThreshold * 0.5, uPeakThreshold + uPeakTransition * 2.0, elevation);
    // Multiply by noise pattern for natural variation
    foamIntensity *= foamPattern;
  }
  
  // Add foam to the peak color (brighten it)
  vec3 peakWithFoam = mix(uPeakColor, vec3(1.0), foamIntensity * 0.7);
  
  // Mix between surface and peak colors (with foam) based on peak transition
  vec3 mixedColor2 = mix(mixedColor1, peakWithFoam, peakFactor);

  // Add subtle wave highlights based on normal orientation
  float highlight = pow(max(0.0, dot(normalize(vec3(0.1, 1.0, 0.1)), vNormal)), 5.0) * 0.2;
  mixedColor2 += vec3(highlight);

  // Mix the final color with the reflection color using fresnel effect
  vec3 finalColor = mix(mixedColor2, reflectionColor.rgb, fresnel);
  
  gl_FragColor = vec4(finalColor, uOpacity);
}
