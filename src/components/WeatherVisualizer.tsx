import React from 'react';

// Weather visualization component
export const WeatherVisualizer: React.FC<{ weatherState: any }> = ({
  weatherState,
}) => {
  const { wind, seaState, precipitation, timeOfDay, visibility } = weatherState;

  // Convert time of day to an appropriate color scheme
  const getTimeColor = () => {
    // Night (deep blue)
    if (timeOfDay < 5 || timeOfDay > 21) {
      return '#1a365d';
    }
    // Dawn/Dusk (purple/orange)
    if (timeOfDay < 7 || timeOfDay > 19) {
      return timeOfDay < 7 ? '#553c9a' : '#dd6b20';
    }
    // Day (blue)
    return '#3182ce';
  };

  // Get weather icon based on conditions
  const getWeatherIcon = () => {
    if (precipitation === 'rain') {
      return '🌧️';
    } else if (precipitation === 'snow') {
      return '❄️';
    } else if (precipitation === 'fog') {
      return '🌫️';
    } else if (seaState > 6) {
      return '🌊';
    } else if (wind.speed > 15) {
      return '💨';
    } else if (visibility < 5) {
      return '🌫️';
    } else {
      return '☀️';
    }
  };

  // Get wind icon based on direction and speed
  const getWindArrow = () => {
    const directions = ['↑', '↗️', '→', '↘️', '↓', '↙️', '←', '↖️'];
    const index =
      Math.floor(((wind.direction * 180) / Math.PI + 22.5) / 45) % 8;
    const arrow = directions[index];

    return wind.speed < 2 ? '🔄' : arrow;
  };

  // Calculate sea state visual height
  const waveHeight = Math.min(90, (seaState / 12) * 100);

  return (
    <div
      className="relative w-full mb-4 overflow-hidden rounded-lg border border-gray-700"
      style={{ height: '100px' }}
    >
      {/* Sky */}
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          backgroundColor: getTimeColor(),
          opacity: visibility / 10,
        }}
      />

      {/* Precipitation overlay */}
      {precipitation !== 'none' && (
        <div
          className="absolute inset-0 bg-repeat"
          style={{
            backgroundImage:
              precipitation === 'rain'
                ? 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)'
                : precipitation === 'snow'
                  ? 'radial-gradient(circle, rgba(255,255,255,0.5) 2px, transparent 2px)'
                  : 'linear-gradient(rgba(200,200,200,0.2), rgba(200,200,200,0.2))',
            backgroundSize: precipitation === 'rain' ? '8px 8px' : '12px 12px',
            opacity: Math.min(
              1,
              Math.max(0.3, weatherState.precipitationIntensity),
            ),
          }}
        />
      )}

      {/* Sea */}
      <div
        className="absolute bottom-0 w-full transition-all duration-700"
        style={{
          height: `${waveHeight}%`,
          backgroundColor: '#2c5282',
          backgroundImage: 'linear-gradient(0deg, #2a4365 0%, #3182ce 100%)',
        }}
      >
        {/* Wave pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
            backgroundSize: `${20 + seaState * 5}px ${10 + seaState * 2}px`,
            backgroundRepeat: 'repeat',
            animation: `wave ${Math.max(1, 5 - seaState * 0.3)}s infinite linear`,
          }}
        />
      </div>

      {/* Weather and wind indicators */}
      <div className="absolute top-2 right-2 flex items-center space-x-2">
        <span className="text-2xl">{getWeatherIcon()}</span>
        <span className="text-2xl">{getWindArrow()}</span>
      </div>

      {/* Time indicator */}
      <div className="absolute top-2 left-2 text-white text-sm">
        {Math.floor(timeOfDay)}:
        {Math.floor((timeOfDay % 1) * 60)
          .toString()
          .padStart(2, '0')}
      </div>
    </div>
  );
};
