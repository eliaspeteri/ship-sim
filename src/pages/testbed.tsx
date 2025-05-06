import React, { useState } from 'react';
import { MachineGauge } from '../components/MachineGauge';
import { CircularGauge } from '../components/CircularGauge';
import { CompassRose } from '../components/CompassRose';
import { AlarmIndicator } from '../components/AlarmIndicator';
import MemoryMonitor from '../components/MemoryMonitor';
import { Tank } from '../components/Tank';
import { Pump } from '../components/Pump';
import { EnhancedPump } from '../components/EnhancedPump';
import { TelegraphLever } from '../components/TelegraphLever';
import Thermometer from '../components/Thermometer';
import Inclinometer from '../components/Inclinometer';
import DepthSounder from '../components/DepthSounder';
import Barometer from '../components/Barometer';
import { BallValve } from '../components/BallValve';
import { RotaryValve } from '../components/RotaryValve';
import { HelmControl } from '../components/HelmControl';
import { RudderLever } from '../components/RudderLever';
import WindIndicator from '../components/WindIndicator';
import RudderAngleIndicator from '../components/RudderAngleIndicator';
import { PushButton } from '../components/PushButton';
import { Telex } from '../components/communication/Telex';
import {
  PushSwitch,
  RockerSwitch,
  ToggleSwitch,
  ChangeoverSwitch,
} from '../components/switches';
import { RotaryDial } from '../components/dials';
import { MarineRadio } from '../components/radio';

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
  const [rudderLeverAngle, setRudderLeverAngle] = useState<number>(0);
  const [windDirection, setWindDirection] = useState<number>(0);
  const [windSpeed, setWindSpeed] = useState<number>(10);
  const [buttonClicks, setButtonClicks] = useState(0);

  // States for the switch components
  const [pushSwitchActive, setPushSwitchActive] = useState(false);
  const [rockerSwitchActive, setRockerSwitchActive] = useState(false);
  const [toggleSwitchOn, setToggleSwitchOn] = useState(false);

  // States for the changeover switch
  const [twoWaySwitchPosition, setTwoWaySwitchPosition] = useState<number>(1);
  const [threeWaySwitchPosition, setThreeWaySwitchPosition] =
    useState<string>('auto');

  // States for the dial components
  const [dialValue, setDialValue] = useState(50);

  // States for enhanced pump components
  const [pumpIsRunning, setPumpIsRunning] = useState(false);
  const [pumpSpeed, setPumpSpeed] = useState(0.7);
  const [pumpMode, setPumpMode] = useState<'manual' | 'auto'>('manual');
  const [pumpTemperature, setPumpTemperature] = useState(45);
  const [pumpHealth, setPumpHealth] = useState(1.0);
  const [pumpInletPressure, setPumpInletPressure] = useState(1.0);

  // States for the Telex component
  const [telexConnected] = useState(true);
  const [telexMessages, setTelexMessages] = useState([
    {
      id: 'msg-1',
      sender: 'HARBOR-OPS',
      recipient: 'SHIP-SIM1',
      content: 'Requesting your ETA at Rotterdam port. Please advise.',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      isOutgoing: false,
      isRead: true,
    },
    {
      id: 'msg-2',
      sender: 'SHIP-SIM1',
      recipient: 'HARBOR-OPS',
      content:
        'ETA Rotterdam 17:30 local time. Requesting pilot boarding arrangements.',
      timestamp: new Date(Date.now() - 2700000), // 45 minutes ago
      isOutgoing: true,
      isRead: true,
    },
    {
      id: 'msg-3',
      sender: 'COAST-GUARD',
      recipient: 'SHIP-SIM1',
      content:
        'Weather advisory: Strong winds expected in your vicinity. Reduce speed and maintain vigilance.',
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      isOutgoing: false,
      isRead: false,
    },
  ]);

  // Sample contacts for Telex
  const telexContacts = [
    { id: 'HARBOR-OPS', name: 'Harbor Operations', isStation: true },
    { id: 'COAST-GUARD', name: 'Coast Guard Station', isStation: true },
    { id: 'WEATHER-SVC', name: 'Weather Service', isStation: true },
    { id: 'SHIP-OWNER', name: 'Ship Owner Office', isStation: true },
    { id: 'SHIP-MARU', name: 'M/V Tokyo Maru', isStation: false },
    { id: 'SHIP-STAR', name: 'M/V North Star', isStation: false },
  ];

  // Sample position data for the radio (ship's current location)
  const shipPosition = {
    latitude: 38.889248,
    longitude: -77.050636,
  };

  // States for the marine radio
  const [radioChannel, setRadioChannel] = useState(16);
  const [radioFrequency, setRadioFrequency] = useState(156.8);
  const [radioTransmitting] = useState(false);
  const [radioReceiving, setRadioReceiving] = useState(false);

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
          <h2 className="font-semibold">AlarmIndicator</h2>
          <div className="space-y-2">
            <AlarmIndicator
              active={isBooleanOn}
              label={'Engine Overheat'}
              severity="critical"
              size={24}
            />
            <AlarmIndicator
              active={isBooleanOn}
              label={'Low Fuel'}
              severity="warning"
              size={20}
            />
            <AlarmIndicator
              active={!isBooleanOn}
              label={'System Normal'}
              severity="warning"
              size={16}
            />
          </div>
          <button
            onClick={() => setBooleanOn(a => !a)}
            className="mt-2 px-2 py-1 bg-gray-200 rounded text-black"
          >
            Toggle Alarms
          </button>
        </div>
        <div className="relative h-24">
          <h2 className="font-semibold">Tank</h2>
          <Tank size={100} level={gaugeValue / 100} x={100} y={100} />
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
        <div>
          <h2 className="font-semibold">Helm Control</h2>
          <HelmControl
            value={rudderLeverAngle}
            onChange={setRudderLeverAngle}
            minAngle={-35}
            maxAngle={35}
            numTicks={9}
            size={220}
          />
        </div>
        <div>
          <h2 className="font-semibold">Rudder Lever</h2>
          <RudderLever
            value={rudderLeverAngle}
            onChange={setRudderLeverAngle}
            min={-35}
            max={35}
            label={'Rudder'}
            scale={[
              {
                label: '-35',
                value: -35,
              },
              {
                label: '-25',
                value: -25,
              },
              {
                label: '-15',
                value: -15,
              },
              {
                label: '-5',
                value: -5,
              },
              {
                label: '0',
                value: 0,
                major: true,
              },
              {
                label: '5',
                value: 5,
              },
              {
                label: '15',
                value: 15,
              },
              {
                label: '25',
                value: 25,
              },
              {
                label: '35',
                value: 35,
              },
            ]}
          />
        </div>
        <div>
          <h2 className="font-semibold">Rudder Angle Indicator</h2>
          <RudderAngleIndicator
            angle={rudderLeverAngle}
            maxAngle={35}
            size={240}
          />
          <p className="text-sm mt-2">
            Use the Rudder Lever to control rudder angle
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Wind Indicator</h2>
          <WindIndicator direction={windDirection} speedKnots={windSpeed} />
          <label className="block text-xs mt-2">Wind Direction:</label>
          <input
            type="range"
            min={0}
            max={360}
            value={windDirection}
            onChange={e => setWindDirection(Number(e.target.value))}
            className="w-full"
          />
          <label className="block text-xs mt-2">Wind Speed (knots):</label>
          <input
            type="range"
            min={0}
            max={100}
            value={windSpeed}
            onChange={e => setWindSpeed(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <h2 className="font-semibold">PushButton</h2>
          <div className="space-y-2 flex flex-col items-start">
            <PushButton
              label={`Clicked ${buttonClicks} times`}
              onClick={() => setButtonClicks(c => c + 1)}
              color="primary"
              size="medium"
            />
            <PushButton
              label="Secondary Small"
              onClick={() => alert('Secondary clicked!')}
              color="secondary"
              size="small"
            />
            <PushButton
              label="Danger Large"
              onClick={() => alert('Danger clicked!')}
              color="danger"
              size="large"
            />
            <PushButton
              label="Disabled Button"
              onClick={() => alert('Should not happen!')}
              disabled={true}
              color="primary"
            />
          </div>
        </div>
        <div>
          <h2 className="font-semibold">Push Switch</h2>
          <div className="space-y-6 flex flex-col items-center">
            <PushSwitch
              isActive={pushSwitchActive}
              onToggle={setPushSwitchActive}
              activeColor="#10B981" // Green color
              size={60}
              label="Engine Start"
            >
              <span>ON</span>
            </PushSwitch>

            <PushSwitch
              isActive={pushSwitchActive}
              onToggle={setPushSwitchActive}
              activeColor="#EF4444" // Red color
              size={50}
              label="Emergency Stop"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M13 3h-2v10h2V3zm0 18h-2v-2h2v2z" />
              </svg>
            </PushSwitch>

            <PushSwitch
              isActive={!pushSwitchActive}
              onToggle={val => setPushSwitchActive(!val)}
              activeColor="#F59E0B" // Amber color
              size={40}
              disabled={true}
              label="Disabled"
            >
              <span>X</span>
            </PushSwitch>
          </div>
        </div>

        <div>
          <h2 className="font-semibold">Rocker Switch</h2>
          <div className="space-y-6 flex flex-col items-center">
            <RockerSwitch
              isActive={rockerSwitchActive}
              onToggle={setRockerSwitchActive}
              activeColor="#3B82F6" // Blue color
              width={60}
              height={30}
              label="Lights"
            >
              <span>ON</span>
            </RockerSwitch>

            <RockerSwitch
              isActive={rockerSwitchActive}
              onToggle={setRockerSwitchActive}
              activeColor="#10B981" // Green color
              width={70}
              height={35}
              useBarIndicator={true}
              label="Navigation"
            >
              <span>NAV</span>
            </RockerSwitch>

            <RockerSwitch
              isActive={!rockerSwitchActive}
              onToggle={val => setRockerSwitchActive(!val)}
              activeColor="#F59E0B" // Amber color
              width={80}
              height={40}
              disabled={true}
              label="Disabled"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="currentColor"
              >
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </RockerSwitch>
          </div>
        </div>

        <div>
          <h2 className="font-semibold">Toggle Switch</h2>
          <div className="space-y-6 flex flex-col items-center">
            <ToggleSwitch
              isOn={toggleSwitchOn}
              onToggle={setToggleSwitchOn}
              width={60}
              height={40}
              label="Power"
              labelPosition="right"
            />

            <ToggleSwitch
              isOn={toggleSwitchOn}
              onToggle={setToggleSwitchOn}
              width={80}
              height={50}
              baseColor="#1F2937" // Darker base
              leverColor="#E5E7EB" // Lighter handle
              label="Fuel Pump"
              labelPosition="left"
            />

            <ToggleSwitch
              isOn={!toggleSwitchOn}
              onToggle={val => setToggleSwitchOn(!val)}
              width={70}
              height={45}
              disabled={true}
              label="Disabled"
              labelPosition="bottom"
            />
          </div>
        </div>

        <div>
          <h2 className="font-semibold">Changeover Switch</h2>
          <div className="space-y-6 flex flex-col items-center">
            <ChangeoverSwitch
              position={twoWaySwitchPosition}
              onPositionChange={setTwoWaySwitchPosition}
              positions={[
                { value: 1, label: 'INPUT 1' },
                { value: 2, label: 'INPUT 2' },
              ]}
              label="Two-Way Switch"
              size={80}
            />

            <ChangeoverSwitch
              position={threeWaySwitchPosition}
              onPositionChange={setThreeWaySwitchPosition}
              positions={[
                { value: 'manual', label: 'MANUAL' },
                { value: 'auto', label: 'AUTO' },
                { value: 'off', label: 'OFF' },
              ]}
              label="Three-Way Switch"
              size={100}
            />
          </div>
        </div>

        <div>
          <h2 className="font-semibold">Rotary Dial</h2>
          <div className="flex flex-col items-center space-y-4">
            <RotaryDial
              value={dialValue}
              onChange={setDialValue}
              min={0}
              max={100}
              label="Power"
              unit="%"
              size={120}
            />
            <div className="text-white text-sm">
              Value: {dialValue.toFixed(0)}%
            </div>
          </div>
        </div>
        <div className="col-span-2">
          <h2 className="font-semibold">Marine Radio</h2>
          <div className="mt-4 flex flex-col items-center">
            <MarineRadio
              initialChannel={radioChannel}
              onChannelChange={(channel, frequency) => {
                setRadioChannel(channel);
                setRadioFrequency(frequency);
              }}
              position={shipPosition}
            />

            {/* Radio test controls */}
            <div className="mt-4 bg-gray-800 p-3 rounded-lg w-full">
              <h3 className="text-sm font-semibold text-gray-200 mb-2">
                Test Radio Reception
              </h3>
              <div className="flex justify-between items-center">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Receiving Signal:
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={radioReceiving}
                      onChange={e => setRadioReceiving(e.target.checked)}
                    />
                    <span className="text-xs text-gray-300">
                      {radioReceiving ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-300">
                  Current Channel: {radioChannel} ({radioFrequency.toFixed(3)}{' '}
                  MHz)
                  {radioTransmitting ? ' • TRANSMITTING' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-span-5 mt-8">
        <h2 className="font-semibold text-xl mb-6">Enhanced Pumps</h2>
        <div className="grid grid-cols-3 gap-12 items-start">
          {/* Centrifugal Pump */}
          <div className="flex flex-col items-center">
            <h3 className="font-semibold mb-2">Centrifugal Pump</h3>
            <div className="relative h-[240px] w-[240px]">
              <EnhancedPump
                x={120}
                y={120}
                isRunning={pumpIsRunning}
                onChange={setPumpIsRunning}
                speed={pumpSpeed}
                onSpeedChange={setPumpSpeed}
                health={pumpHealth}
                mode={pumpMode}
                onModeChange={setPumpMode}
                temperature={pumpTemperature}
                inletPressure={pumpInletPressure}
                outletPressure={pumpInletPressure + pumpSpeed * 3.5}
                label="Cooling Water Pump"
                pumpType="centrifugal"
                size={180}
              />
            </div>
            <div className="w-full mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Health:</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={pumpHealth}
                  onChange={e => setPumpHealth(Number(e.target.value))}
                  className="ml-2 flex-grow"
                />
                <span className="text-sm ml-2 w-10 text-right">
                  {(pumpHealth * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Temperature:</span>
                <input
                  type="range"
                  min={25}
                  max={95}
                  step={1}
                  value={pumpTemperature}
                  onChange={e => setPumpTemperature(Number(e.target.value))}
                  className="ml-2 flex-grow"
                />
                <span className="text-sm ml-2 w-10 text-right">
                  {pumpTemperature}°C
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Inlet Pressure:</span>
                <input
                  type="range"
                  min={0.1}
                  max={3}
                  step={0.1}
                  value={pumpInletPressure}
                  onChange={e => setPumpInletPressure(Number(e.target.value))}
                  className="ml-2 flex-grow"
                />
                <span className="text-sm ml-2 w-10 text-right">
                  {pumpInletPressure.toFixed(1)} bar
                </span>
              </div>
            </div>
          </div>

          {/* Gear Pump */}
          <div className="flex flex-col items-center">
            <h3 className="font-semibold mb-2">Gear Pump</h3>
            <div className="relative h-[240px] w-[240px]">
              <EnhancedPump
                x={120}
                y={120}
                isRunning={pumpIsRunning}
                onChange={setPumpIsRunning}
                speed={pumpSpeed}
                onSpeedChange={setPumpSpeed}
                health={Math.min(0.9, pumpHealth)} // Slightly worse health for demo
                temperature={pumpTemperature * 1.1} // Slightly higher temp for demo
                inletPressure={pumpInletPressure}
                outletPressure={pumpInletPressure + pumpSpeed * 5} // Higher pressure differential
                label="Lube Oil Pump"
                pumpType="gear"
                size={180}
              />
            </div>
            <div className="mt-4 text-sm space-y-1">
              <p>Click the pump to see detailed stats</p>
              <p>Click the control buttons to interact</p>
              <p>Adjust speed with the speed control</p>
            </div>
          </div>

          {/* Screw Pump */}
          <div className="flex flex-col items-center">
            <h3 className="font-semibold mb-2">Screw Pump</h3>
            <div className="relative h-[240px] w-[240px]">
              <EnhancedPump
                x={120}
                y={120}
                isRunning={pumpIsRunning}
                onChange={setPumpIsRunning}
                speed={pumpSpeed}
                onSpeedChange={setPumpSpeed}
                health={pumpHealth < 0.3 ? 0.2 : 0.95} // Either very good or very bad
                temperature={pumpHealth < 0.3 ? 85 : 42} // Overheating when health is poor
                inletPressure={
                  pumpInletPressure < 0.5 ? 0.2 : pumpInletPressure
                } // Show cavitation condition
                outletPressure={
                  (pumpInletPressure < 0.5 ? 0.2 : pumpInletPressure) +
                  pumpSpeed * 4
                }
                label="Fuel Transfer Pump"
                pumpType="screw"
                size={180}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <MemoryMonitor />
      </div>

      {/* Telex Section */}
      <div className="col-span-5 mt-12 p-6 bg-gray-800 rounded-lg">
        <h2 className="font-semibold text-xl mb-4">Ship Telex System</h2>

        <Telex
          shipIdentification="SHIP-SIM1"
          contacts={telexContacts}
          initialMessages={telexMessages}
          initialConnected={telexConnected}
          onSendMessage={message => {
            const newMessage = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              timestamp: new Date(),
              isRead: true,
              ...message,
            };
            setTelexMessages(prev => [...prev, newMessage]);
          }}
          onPrintMessage={messageId => {
            console.log(`Message ${messageId} printed`);
            // In a real implementation, this could trigger actual printing or logging
          }}
        />
      </div>
    </div>
  );
};

export default TestbedPage;
