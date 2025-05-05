import React, { useState } from 'react';
import { MachineGauge } from '../components/MachineGauge';
import { CircularGauge } from '../components/CircularGauge';
import { CompassRose } from '../components/CompassRose';
import { ControlLever } from '../components/ControlLever';
import { AlarmIndicator } from '../components/AlarmIndicator';
import MemoryMonitor from '../components/MemoryMonitor';
import { Tank } from '../components/Tank';
import { Pump } from '../components/Pump';
import { TelegraphLever } from '../components/TelegraphLever';
import Thermometer from '../components/Thermometer';
import Inclinometer from '../components/Inclinometer';
import DepthSounder from '../components/DepthSounder';
import Barometer from '../components/Barometer';
import { BallValve } from '../components/BallValve';
import { RotaryValve } from '../components/RotaryValve';

const TestbedPage = () => {
  const [gaugeValue, setGaugeValue] = useState(50);
  const [leverValue, setLeverValue] = useState(0);
  const [isBooleanOn, setBooleanOn] = useState(false);
  const [tempValue, setTempValue] = useState(25);
  const [rollAngle, setRollAngle] = useState(0);
  const [depthValue, setDepthValue] = useState(50);
  const [depthHistoryLength, setDepthHistoryLength] = useState(50);
  const [pressure, setPressure] = useState(1013);
  const [refPressure, setRefPressure] = useState(1013);
  const [temperature, setTemperature] = useState(20);
  const [ballValveOpenness, setBallValveOpenness] = useState<number>(1);
  const [rotaryValveOpenness, setRotaryValveOpenness] = useState<number>(0.5);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">UI Testbed</h1>
      <div className="grid grid-cols-5 gap-8">
        <div>
          <h2 className="font-semibold">MachineGauge</h2>
          <MachineGauge
            value={gaugeValue}
            min={0}
            max={100}
            unit="RPM"
            label="RPM"
          />
          <input
            type="range"
            min={0}
            max={100}
            value={gaugeValue}
            onChange={e => setGaugeValue(Number(e.target.value))}
          />
        </div>
        <div>
          <h2 className="font-semibold">CircularGauge</h2>
          <CircularGauge
            value={gaugeValue}
            min={0}
            max={100}
            label="Pressure"
            unit="bar"
          />
        </div>
        <div>
          <h2 className="font-semibold">CompassRose</h2>
          <CompassRose heading={gaugeValue * 3.6} />
        </div>
        <div>
          <h2 className="font-semibold">ControlLever</h2>
          <ControlLever
            value={leverValue}
            onChange={setLeverValue}
            min={-1}
            max={1}
            label="Throttle"
          />
        </div>
        <div>
          <h2 className="font-semibold">AlarmIndicator</h2>
          <AlarmIndicator active={isBooleanOn} label={''} />
          <button
            onClick={() => setBooleanOn(a => !a)}
            className="ml-2 px-2 py-1 bg-gray-200 rounded"
          >
            Toggle Alarm
          </button>
        </div>
        <div>
          <h2 className="font-semibold">Tank</h2>
          <Tank level={gaugeValue / 100} x={0} y={0} />
        </div>
        <div>
          <h2 className="font-semibold">Pump</h2>
          <Pump
            x={0}
            y={0}
            isRunning={isBooleanOn}
            onChange={function (running: boolean): void {
              console.log(`Pump is now ${running ? 'running' : 'stopped'}`);
            }}
          />
        </div>
        <div>
          <h2 className="font-semibold">TelegraphLever</h2>
          <TelegraphLever
            value={leverValue}
            onChange={setLeverValue}
            min={-1}
            max={1}
            label="Throttle"
            scale={[
              { label: 'F.Astern', value: -1, major: true },
              { label: 'H.Astern', value: -0.5 },
              { label: 'S.Astern', value: -0.25 },
              { label: 'Stop', value: 0, major: true },
              { label: 'S.Ahead', value: 0.25 },
              { label: 'H.Ahead', value: 0.5 },
              { label: 'F.Ahead', value: 1, major: true },
            ]}
          />
        </div>
        <div>
          <h2 className="font-semibold">Thermometer</h2>
          <Thermometer
            value={tempValue}
            min={0}
            max={100}
            height={300}
            width={20}
            numTicks={10}
            labeledScale
            label="Ambient"
          />
          <input
            type="range"
            min={0}
            max={100}
            value={tempValue}
            onChange={e => setTempValue(Number(e.target.value))}
          />
        </div>
        <div>
          <h2 className="font-semibold">Inclinometer</h2>
          <Inclinometer roll={rollAngle} maxAngle={40} size={180} />
          <input
            type="range"
            min={-45}
            max={45}
            value={rollAngle}
            onChange={e => setRollAngle(Number(e.target.value))}
            className="w-full mt-2"
          />
        </div>
        <div>
          <h2 className="font-semibold">Depth Sounder</h2>
          <DepthSounder
            depth={depthValue}
            maxDepth={200}
            units="m"
            historyLength={depthHistoryLength}
          />
          <label className="block text-xs mt-2">Depth:</label>
          <input
            type="range"
            min={0}
            max={200}
            value={depthValue}
            onChange={e => setDepthValue(Number(e.target.value))}
            className="w-full"
          />
          <label className="block text-xs mt-2">History Length:</label>
          <input
            type="number"
            min={10}
            max={200}
            value={depthHistoryLength}
            onChange={e => setDepthHistoryLength(Number(e.target.value))}
            className="w-full p-1 border rounded"
          />
        </div>
        <div>
          <h2 className="font-semibold">Barometer</h2>
          <Barometer
            pressureHpa={pressure}
            referencePressureHpa={refPressure}
            temperatureCelsius={temperature}
            size={200}
          />
          <label className="block text-xs mt-2">Pressure (hPa):</label>
          <input
            type="range"
            min={960}
            max={1060}
            step={1}
            value={pressure}
            onChange={e => setPressure(Number(e.target.value))}
            className="w-full"
          />
          <label className="block text-xs mt-1">Ref Pressure (hPa):</label>
          <input
            type="range"
            min={960}
            max={1060}
            step={1}
            value={refPressure}
            onChange={e => setRefPressure(Number(e.target.value))}
            className="w-full"
          />
          <label className="block text-xs mt-1">Temperature (°C):</label>
          <input
            type="range"
            min={-10}
            max={50}
            step={1}
            value={temperature}
            onChange={e => setTemperature(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="relative h-24">
          <h2 className="font-semibold mb-2">Ball Valve</h2>
          <BallValve
            x={20}
            y={100}
            openness={ballValveOpenness}
            onChange={setBallValveOpenness}
            label="Cooling Inlet"
            size={40}
          />
          <div className="text-white text-xs mt-12 ml-5">
            Open: {(ballValveOpenness * 100).toFixed(0)}%
          </div>
        </div>
        <div className="relative h-28">
          <h2 className="font-semibold mb-2">Rotary Valve</h2>
          <RotaryValve
            x={20}
            y={100}
            openness={rotaryValveOpenness}
            onChange={setRotaryValveOpenness}
            label="Steam Throttle"
            size={60}
            maxTurns={8}
          />
          <div className="text-white text-xs mt-16 ml-5">
            Open: {(rotaryValveOpenness * 100).toFixed(0)}%
          </div>
        </div>
      </div>
      <div className="mt-8">
        <MemoryMonitor />
      </div>
    </div>
  );
};

export default TestbedPage;
