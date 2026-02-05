(module
 (type $0 (func (param i32) (result f64)))
 (type $1 (func (param i32 f64)))
 (type $2 (func (param i32 i32)))
 (type $3 (func (param f64) (result f64)))
 (type $4 (func (param i32) (result i32)))
 (type $5 (func (result i32)))
 (type $6 (func (param i32)))
 (type $7 (func))
 (type $8 (func (param f64 f64) (result f64)))
 (type $9 (func (param i32 i32 i32 i32)))
 (type $10 (func (param i32 i32) (result i32)))
 (type $11 (func (param f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64) (result i32)))
 (type $12 (func (param i32 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64) (result i32)))
 (type $13 (func (param i32 i32) (result f64)))
 (type $14 (func (param i32 i32 i32 f64) (result f64)))
 (type $15 (func (param f64 i64) (result i32)))
 (type $16 (func (param i32 f64 f64 f64 f64 f64 f64 f64 f64 f64) (result i32)))
 (import "env" "memory" (memory $0 16 100))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (global $assembly/index/WATER_DENSITY f64 (f64.const 1025))
 (global $assembly/index/DEFAULT_DRAG_COEFFICIENT f64 (f64.const 0.8))
 (global $assembly/index/DEFAULT_RUDDER_FORCE_COEFFICIENT f64 (f64.const 2e5))
 (global $assembly/index/DEFAULT_RUDDER_STALL_ANGLE f64 (f64.const 0.5))
 (global $assembly/index/DEFAULT_RUDDER_MAX_ANGLE f64 (f64.const 0.6))
 (global $assembly/index/DEFAULT_MAX_THRUST f64 (f64.const 8e5))
 (global $assembly/index/DEFAULT_MASS f64 (f64.const 5e6))
 (global $assembly/index/DEFAULT_LENGTH f64 (f64.const 120))
 (global $assembly/index/DEFAULT_BEAM f64 (f64.const 20))
 (global $assembly/index/DEFAULT_DRAFT f64 (f64.const 6))
 (global $assembly/index/DEFAULT_BLOCK_COEFFICIENT f64 (f64.const 0.75))
 (global $assembly/index/GRAVITY f64 (f64.const 9.81))
 (global $assembly/index/DEFAULT_YAW_DAMPING f64 (f64.const 0.5))
 (global $assembly/index/DEFAULT_YAW_DAMPING_QUAD f64 (f64.const 1.2))
 (global $assembly/index/DEFAULT_SWAY_DAMPING f64 (f64.const 0.6))
 (global $assembly/index/MAX_YAW_RATE f64 (f64.const 0.8))
 (global $assembly/index/DEFAULT_MAX_SPEED f64 (f64.const 15))
 (global $assembly/index/PIVOT_AFT_RATIO f64 (f64.const 0.25))
 (global $assembly/index/DEFAULT_HEAVE_STIFFNESS f64 (f64.const 2))
 (global $assembly/index/DEFAULT_HEAVE_DAMPING f64 (f64.const 1.6))
 (global $assembly/index/WAVE_HEIGHT_PER_WIND f64 (f64.const 0.05))
 (global $assembly/index/MAX_WAVE_HEIGHT f64 (f64.const 3))
 (global $assembly/index/DEFAULT_ROLL_DAMPING f64 (f64.const 0.8))
 (global $assembly/index/DEFAULT_PITCH_DAMPING f64 (f64.const 0.6))
 (global $assembly/index/DEFAULT_FUEL_CONSUMPTION_RATE f64 (f64.const 0.000015))
 (global $assembly/index/DEFAULT_RUDDER_AREA_RATIO f64 (f64.const 0.02))
 (global $assembly/index/DEFAULT_RUDDER_ARM_RATIO f64 (f64.const 0.45))
 (global $assembly/index/DEFAULT_RUDDER_LIFT_SLOPE f64 (f64.const 6))
 (global $assembly/index/DEFAULT_PROP_WASH f64 (f64.const 0.6))
 (global $assembly/index/DEFAULT_ENGINE_TIME_CONSTANT f64 (f64.const 2.5))
 (global $assembly/index/DEFAULT_RUDDER_RATE f64 (f64.const 0.25))
 (global $assembly/index/DEFAULT_ADDED_MASS_X_COEFF f64 (f64.const 0.05))
 (global $assembly/index/DEFAULT_ADDED_MASS_Y_COEFF f64 (f64.const 0.2))
 (global $assembly/index/DEFAULT_ADDED_MASS_YAW_COEFF f64 (f64.const 0.02))
 (global $assembly/index/DEFAULT_HULL_YV f64 (f64.const 0))
 (global $assembly/index/DEFAULT_HULL_YR f64 (f64.const 0))
 (global $assembly/index/DEFAULT_HULL_NV f64 (f64.const 0))
 (global $assembly/index/DEFAULT_HULL_NR f64 (f64.const 0))
 (global $assembly/index/DEFAULT_CD_SURGE f64 (f64.const 0.7))
 (global $assembly/index/DEFAULT_CD_SWAY f64 (f64.const 1.1))
 (global $assembly/index/DEFAULT_CD_YAW f64 (f64.const 0.2))
 (global $assembly/index/DEFAULT_SHALLOW_WATER_FACTOR f64 (f64.const 1.5))
 (global $assembly/index/DEFAULT_SHALLOW_WATER_YAW_FACTOR f64 (f64.const 1.4))
 (global $assembly/index/DEFAULT_SHALLOW_WATER_RUDDER_FACTOR f64 (f64.const 0.7))
 (global $assembly/index/SHALLOW_WATER_MIN_RATIO f64 (f64.const 1.1))
 (global $assembly/index/SHALLOW_WATER_MAX_RATIO f64 (f64.const 3))
 (global $assembly/index/MAX_SPEED_MULTIPLIER f64 (f64.const 1.2))
 (global $assembly/index/MAX_YAW_MULTIPLIER f64 (f64.const 1.5))
 (global $assembly/index/MODEL_DISPLACEMENT i32 (i32.const 0))
 (global $assembly/index/VESSEL_PARAM_BUFFER_CAPACITY i32 (i32.const 64))
 (global $assembly/index/ENVIRONMENT_BUFFER_CAPACITY i32 (i32.const 16))
 (global $assembly/index/PARAM_MASS i32 (i32.const 0))
 (global $assembly/index/PARAM_LENGTH i32 (i32.const 1))
 (global $assembly/index/PARAM_BEAM i32 (i32.const 2))
 (global $assembly/index/PARAM_DRAFT i32 (i32.const 3))
 (global $assembly/index/PARAM_BLOCK_COEFFICIENT i32 (i32.const 4))
 (global $assembly/index/PARAM_RUDDER_FORCE_COEFFICIENT i32 (i32.const 5))
 (global $assembly/index/PARAM_RUDDER_STALL_ANGLE i32 (i32.const 6))
 (global $assembly/index/PARAM_RUDDER_MAX_ANGLE i32 (i32.const 7))
 (global $assembly/index/PARAM_DRAG_COEFFICIENT i32 (i32.const 8))
 (global $assembly/index/PARAM_YAW_DAMPING i32 (i32.const 9))
 (global $assembly/index/PARAM_YAW_DAMPING_QUAD i32 (i32.const 10))
 (global $assembly/index/PARAM_SWAY_DAMPING i32 (i32.const 11))
 (global $assembly/index/PARAM_MAX_THRUST i32 (i32.const 12))
 (global $assembly/index/PARAM_MAX_SPEED i32 (i32.const 13))
 (global $assembly/index/PARAM_ROLL_DAMPING i32 (i32.const 14))
 (global $assembly/index/PARAM_PITCH_DAMPING i32 (i32.const 15))
 (global $assembly/index/PARAM_HEAVE_STIFFNESS i32 (i32.const 16))
 (global $assembly/index/PARAM_HEAVE_DAMPING i32 (i32.const 17))
 (global $assembly/index/PARAM_RUDDER_AREA i32 (i32.const 18))
 (global $assembly/index/PARAM_RUDDER_ARM i32 (i32.const 19))
 (global $assembly/index/PARAM_RUDDER_LIFT_SLOPE i32 (i32.const 20))
 (global $assembly/index/PARAM_PROP_WASH i32 (i32.const 21))
 (global $assembly/index/PARAM_ENGINE_TIME_CONSTANT i32 (i32.const 22))
 (global $assembly/index/PARAM_RUDDER_RATE i32 (i32.const 23))
 (global $assembly/index/PARAM_ADDED_MASS_X i32 (i32.const 24))
 (global $assembly/index/PARAM_ADDED_MASS_Y i32 (i32.const 25))
 (global $assembly/index/PARAM_ADDED_MASS_YAW i32 (i32.const 26))
 (global $assembly/index/PARAM_HULL_YV i32 (i32.const 27))
 (global $assembly/index/PARAM_HULL_YR i32 (i32.const 28))
 (global $assembly/index/PARAM_HULL_NV i32 (i32.const 29))
 (global $assembly/index/PARAM_HULL_NR i32 (i32.const 30))
 (global $assembly/index/PARAM_CD_SURGE i32 (i32.const 31))
 (global $assembly/index/PARAM_CD_SWAY i32 (i32.const 32))
 (global $assembly/index/PARAM_CD_YAW i32 (i32.const 33))
 (global $assembly/index/PARAM_SHALLOW_WATER_FACTOR i32 (i32.const 34))
 (global $assembly/index/PARAM_SHALLOW_WATER_YAW_FACTOR i32 (i32.const 35))
 (global $assembly/index/PARAM_SHALLOW_WATER_RUDDER_FACTOR i32 (i32.const 36))
 (global $assembly/index/ENV_WIND_SPEED i32 (i32.const 0))
 (global $assembly/index/ENV_WIND_DIRECTION i32 (i32.const 1))
 (global $assembly/index/ENV_CURRENT_SPEED i32 (i32.const 2))
 (global $assembly/index/ENV_CURRENT_DIRECTION i32 (i32.const 3))
 (global $assembly/index/ENV_WAVE_HEIGHT i32 (i32.const 4))
 (global $assembly/index/ENV_WAVE_LENGTH i32 (i32.const 5))
 (global $assembly/index/ENV_WAVE_DIRECTION i32 (i32.const 6))
 (global $assembly/index/ENV_WAVE_STEEPNESS i32 (i32.const 7))
 (global $assembly/index/ENV_WATER_DEPTH i32 (i32.const 8))
 (global $assembly/index/globalVessel (mut i32) (i32.const 0))
 (global $~lib/rt/stub/startOffset (mut i32) (i32.const 0))
 (global $~lib/rt/stub/offset (mut i32) (i32.const 0))
 (global $assembly/index/globalEnvironment (mut i32) (i32.const 0))
 (global $~lib/shared/runtime/Runtime.Stub i32 (i32.const 0))
 (global $~lib/shared/runtime/Runtime.Minimal i32 (i32.const 1))
 (global $~lib/shared/runtime/Runtime.Incremental i32 (i32.const 2))
 (global $~lib/native/ASC_RUNTIME i32 (i32.const 0))
 (global $assembly/index/vesselParamsBuffer (mut i32) (i32.const 0))
 (global $assembly/index/environmentBuffer (mut i32) (i32.const 0))
 (global $~argumentsLength (mut i32) (i32.const 0))
 (global $~lib/native/ASC_SHRINK_LEVEL i32 (i32.const 0))
 (global $~lib/math/rempio2_y0 (mut f64) (f64.const 0))
 (global $~lib/math/rempio2_y1 (mut f64) (f64.const 0))
 (global $~lib/math/res128_hi (mut i64) (i64.const 0))
 (global $~lib/math/NativeMath.PI f64 (f64.const 3.141592653589793))
 (global $~lib/memory/__heap_base i32 (i32.const 576))
 (data $0 (i32.const 12) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00(\00\00\00A\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e\00\00\00\00\00")
 (data $1 (i32.const 76) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00s\00t\00u\00b\00.\00t\00s\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $2 (i32.const 140) ",\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\1c\00\00\00I\00n\00v\00a\00l\00i\00d\00 \00l\00e\00n\00g\00t\00h\00")
 (data $3 (i32.const 188) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00&\00\00\00~\00l\00i\00b\00/\00s\00t\00a\00t\00i\00c\00a\00r\00r\00a\00y\00.\00t\00s\00\00\00\00\00\00\00")
 (data $4 (i32.const 252) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00,\00\00\00V\00e\00s\00s\00e\00l\00 \00p\00o\00i\00n\00t\00e\00r\00 \00i\00s\00 \00n\00u\00l\00l\00")
 (data $5 (i32.const 316) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\"\00\00\00a\00s\00s\00e\00m\00b\00l\00y\00/\00i\00n\00d\00e\00x\00.\00t\00s\00\00\00\00\00\00\00\00\00\00\00")
 (data $6 (i32.const 384) "n\83\f9\a2\00\00\00\00\d1W\'\fc)\15DN\99\95b\db\c0\dd4\f5\abcQ\feA\90C<:n$\b7a\c5\bb\de\ea.I\06\e0\d2MB\1c\eb\1d\fe\1c\92\d1\t\f55\82\e8>\a7)\b1&p\9c\e9\84D\bb.9\d6\919A~_\b4\8b_\84\9c\f49S\83\ff\97\f8\1f;(\f9\bd\8b\11/\ef\0f\98\05\de\cf~6m\1fm\nZf?FO\b7\t\cb\'\c7\ba\'u-\ea_\9e\f79\07={\f1\e5\eb\b1_\fbk\ea\92R\8aF0\03V\08]\8d\1f \bc\cf\f0\abk{\fca\91\e3\a9\1d6\f4\9a_\85\99e\08\1b\e6^\80\d8\ff\8d@h\a0\14W\15\06\061\'sM")
 (table $0 1 funcref)
 (elem $0 (i32.const 1))
 (export "createVessel" (func $assembly/index/createVessel@varargs))
 (export "destroyVessel" (func $assembly/index/destroyVessel))
 (export "getVesselParamsBufferPtr" (func $assembly/index/getVesselParamsBufferPtr))
 (export "getVesselParamsBufferCapacity" (func $assembly/index/getVesselParamsBufferCapacity))
 (export "setVesselParams" (func $assembly/index/setVesselParams))
 (export "getEnvironmentBufferPtr" (func $assembly/index/getEnvironmentBufferPtr))
 (export "getEnvironmentBufferCapacity" (func $assembly/index/getEnvironmentBufferCapacity))
 (export "setEnvironment" (func $assembly/index/setEnvironment))
 (export "updateVesselState" (func $assembly/index/updateVesselState))
 (export "setThrottle" (func $assembly/index/setThrottle))
 (export "setRudderAngle" (func $assembly/index/setRudderAngle))
 (export "setBallast" (func $assembly/index/setBallast))
 (export "getVesselX" (func $assembly/index/getVesselX))
 (export "getVesselY" (func $assembly/index/getVesselY))
 (export "getVesselZ" (func $assembly/index/getVesselZ))
 (export "getVesselHeading" (func $assembly/index/getVesselHeading))
 (export "getVesselSpeed" (func $assembly/index/getVesselSpeed))
 (export "getVesselSurgeVelocity" (func $assembly/index/getVesselSurgeVelocity))
 (export "getVesselSwayVelocity" (func $assembly/index/getVesselSwayVelocity))
 (export "getVesselHeaveVelocity" (func $assembly/index/getVesselHeaveVelocity))
 (export "getVesselRollAngle" (func $assembly/index/getVesselRollAngle))
 (export "getVesselPitchAngle" (func $assembly/index/getVesselPitchAngle))
 (export "getVesselRudderAngle" (func $assembly/index/getVesselRudderAngle))
 (export "getVesselEngineRPM" (func $assembly/index/getVesselEngineRPM))
 (export "getVesselFuelLevel" (func $assembly/index/getVesselFuelLevel))
 (export "getVesselFuelConsumption" (func $assembly/index/getVesselFuelConsumption))
 (export "getVesselGM" (func $assembly/index/getVesselGM))
 (export "getVesselCenterOfGravityY" (func $assembly/index/getVesselCenterOfGravityY))
 (export "getVesselBallastLevel" (func $assembly/index/getVesselBallastLevel))
 (export "getVesselRollRate" (func $assembly/index/getVesselRollRate))
 (export "getVesselPitchRate" (func $assembly/index/getVesselPitchRate))
 (export "getVesselYawRate" (func $assembly/index/getVesselYawRate))
 (export "calculateSeaState" (func $assembly/index/calculateSeaState))
 (export "getWaveHeightForSeaState" (func $assembly/index/getWaveHeightForSeaState))
 (export "resetGlobalVessel" (func $assembly/index/resetGlobalVessel))
 (export "memory" (memory $0))
 (export "table" (table $0))
 (export "__setArgumentsLength" (func $~setArgumentsLength))
 (start $~start)
 (func $~lib/rt/stub/maybeGrowMemory (param $newOffset i32)
  (local $pagesBefore i32)
  (local $maxOffset i32)
  (local $pagesNeeded i32)
  (local $4 i32)
  (local $5 i32)
  (local $pagesWanted i32)
  memory.size
  local.set $pagesBefore
  local.get $pagesBefore
  i32.const 16
  i32.shl
  i32.const 15
  i32.add
  i32.const 15
  i32.const -1
  i32.xor
  i32.and
  local.set $maxOffset
  local.get $newOffset
  local.get $maxOffset
  i32.gt_u
  if
   local.get $newOffset
   local.get $maxOffset
   i32.sub
   i32.const 65535
   i32.add
   i32.const 65535
   i32.const -1
   i32.xor
   i32.and
   i32.const 16
   i32.shr_u
   local.set $pagesNeeded
   local.get $pagesBefore
   local.tee $4
   local.get $pagesNeeded
   local.tee $5
   local.get $4
   local.get $5
   i32.gt_s
   select
   local.set $pagesWanted
   local.get $pagesWanted
   memory.grow
   i32.const 0
   i32.lt_s
   if
    local.get $pagesNeeded
    memory.grow
    i32.const 0
    i32.lt_s
    if
     unreachable
    end
   end
  end
  local.get $newOffset
  global.set $~lib/rt/stub/offset
 )
 (func $~lib/rt/common/BLOCK#set:mmInfo (param $this i32) (param $mmInfo i32)
  local.get $this
  local.get $mmInfo
  i32.store
 )
 (func $~lib/rt/stub/__alloc (param $size i32) (result i32)
  (local $block i32)
  (local $ptr i32)
  (local $size|3 i32)
  (local $payloadSize i32)
  local.get $size
  i32.const 1073741820
  i32.gt_u
  if
   i32.const 32
   i32.const 96
   i32.const 33
   i32.const 29
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/rt/stub/offset
  local.set $block
  global.get $~lib/rt/stub/offset
  i32.const 4
  i32.add
  local.set $ptr
  block $~lib/rt/stub/computeSize|inlined.0 (result i32)
   local.get $size
   local.set $size|3
   local.get $size|3
   i32.const 4
   i32.add
   i32.const 15
   i32.add
   i32.const 15
   i32.const -1
   i32.xor
   i32.and
   i32.const 4
   i32.sub
   br $~lib/rt/stub/computeSize|inlined.0
  end
  local.set $payloadSize
  local.get $ptr
  local.get $payloadSize
  i32.add
  call $~lib/rt/stub/maybeGrowMemory
  local.get $block
  local.get $payloadSize
  call $~lib/rt/common/BLOCK#set:mmInfo
  local.get $ptr
  return
 )
 (func $~lib/rt/common/OBJECT#set:gcInfo (param $this i32) (param $gcInfo i32)
  local.get $this
  local.get $gcInfo
  i32.store offset=4
 )
 (func $~lib/rt/common/OBJECT#set:gcInfo2 (param $this i32) (param $gcInfo2 i32)
  local.get $this
  local.get $gcInfo2
  i32.store offset=8
 )
 (func $~lib/rt/common/OBJECT#set:rtId (param $this i32) (param $rtId i32)
  local.get $this
  local.get $rtId
  i32.store offset=12
 )
 (func $~lib/rt/common/OBJECT#set:rtSize (param $this i32) (param $rtSize i32)
  local.get $this
  local.get $rtSize
  i32.store offset=16
 )
 (func $~lib/rt/stub/__new (param $size i32) (param $id i32) (result i32)
  (local $ptr i32)
  (local $object i32)
  local.get $size
  i32.const 1073741804
  i32.gt_u
  if
   i32.const 32
   i32.const 96
   i32.const 86
   i32.const 30
   call $~lib/builtins/abort
   unreachable
  end
  i32.const 16
  local.get $size
  i32.add
  call $~lib/rt/stub/__alloc
  local.set $ptr
  local.get $ptr
  i32.const 4
  i32.sub
  local.set $object
  local.get $object
  i32.const 0
  call $~lib/rt/common/OBJECT#set:gcInfo
  local.get $object
  i32.const 0
  call $~lib/rt/common/OBJECT#set:gcInfo2
  local.get $object
  local.get $id
  call $~lib/rt/common/OBJECT#set:rtId
  local.get $object
  local.get $size
  call $~lib/rt/common/OBJECT#set:rtSize
  local.get $ptr
  i32.const 16
  i32.add
  return
 )
 (func $~lib/object/Object#constructor (param $this i32) (result i32)
  local.get $this
  i32.eqz
  if
   i32.const 0
   i32.const 0
   call $~lib/rt/stub/__new
   local.set $this
  end
  local.get $this
 )
 (func $assembly/index/EnvironmentState#set:windSpeed (param $this i32) (param $windSpeed f64)
  local.get $this
  local.get $windSpeed
  f64.store
 )
 (func $assembly/index/EnvironmentState#set:windDirection (param $this i32) (param $windDirection f64)
  local.get $this
  local.get $windDirection
  f64.store offset=8
 )
 (func $assembly/index/EnvironmentState#set:currentSpeed (param $this i32) (param $currentSpeed f64)
  local.get $this
  local.get $currentSpeed
  f64.store offset=16
 )
 (func $assembly/index/EnvironmentState#set:currentDirection (param $this i32) (param $currentDirection f64)
  local.get $this
  local.get $currentDirection
  f64.store offset=24
 )
 (func $assembly/index/EnvironmentState#set:waveHeight (param $this i32) (param $waveHeight f64)
  local.get $this
  local.get $waveHeight
  f64.store offset=32
 )
 (func $assembly/index/EnvironmentState#set:waveLength (param $this i32) (param $waveLength f64)
  local.get $this
  local.get $waveLength
  f64.store offset=40
 )
 (func $assembly/index/EnvironmentState#set:waveDirection (param $this i32) (param $waveDirection f64)
  local.get $this
  local.get $waveDirection
  f64.store offset=48
 )
 (func $assembly/index/EnvironmentState#set:waveSteepness (param $this i32) (param $waveSteepness f64)
  local.get $this
  local.get $waveSteepness
  f64.store offset=56
 )
 (func $assembly/index/EnvironmentState#set:waterDepth (param $this i32) (param $waterDepth f64)
  local.get $this
  local.get $waterDepth
  f64.store offset=64
 )
 (func $assembly/index/EnvironmentState#constructor (param $this i32) (result i32)
  local.get $this
  i32.eqz
  if
   i32.const 72
   i32.const 5
   call $~lib/rt/stub/__new
   local.set $this
  end
  local.get $this
  call $~lib/object/Object#constructor
  local.set $this
  local.get $this
  f64.const 0
  call $assembly/index/EnvironmentState#set:windSpeed
  local.get $this
  f64.const 0
  call $assembly/index/EnvironmentState#set:windDirection
  local.get $this
  f64.const 0
  call $assembly/index/EnvironmentState#set:currentSpeed
  local.get $this
  f64.const 0
  call $assembly/index/EnvironmentState#set:currentDirection
  local.get $this
  f64.const 0
  call $assembly/index/EnvironmentState#set:waveHeight
  local.get $this
  f64.const 0
  call $assembly/index/EnvironmentState#set:waveLength
  local.get $this
  f64.const 0
  call $assembly/index/EnvironmentState#set:waveDirection
  local.get $this
  f64.const 0
  call $assembly/index/EnvironmentState#set:waveSteepness
  local.get $this
  f64.const 0
  call $assembly/index/EnvironmentState#set:waterDepth
  local.get $this
 )
 (func $~lib/staticarray/StaticArray<f64>#constructor (param $this i32) (param $length i32) (result i32)
  (local $outSize i32)
  (local $out i32)
  local.get $length
  i32.const 1073741820
  i32.const 3
  i32.shr_u
  i32.gt_u
  if
   i32.const 160
   i32.const 208
   i32.const 51
   i32.const 60
   call $~lib/builtins/abort
   unreachable
  end
  local.get $length
  i32.const 3
  i32.shl
  local.set $outSize
  local.get $outSize
  i32.const 6
  call $~lib/rt/stub/__new
  local.set $out
  i32.const 0
  global.get $~lib/shared/runtime/Runtime.Incremental
  i32.ne
  drop
  local.get $out
  i32.const 0
  local.get $outSize
  memory.fill
  local.get $out
  return
 )
 (func $start:assembly/index
  global.get $~lib/memory/__heap_base
  i32.const 4
  i32.add
  i32.const 15
  i32.add
  i32.const 15
  i32.const -1
  i32.xor
  i32.and
  i32.const 4
  i32.sub
  global.set $~lib/rt/stub/startOffset
  global.get $~lib/rt/stub/startOffset
  global.set $~lib/rt/stub/offset
  i32.const 0
  call $assembly/index/EnvironmentState#constructor
  global.set $assembly/index/globalEnvironment
  i32.const 0
  global.get $assembly/index/VESSEL_PARAM_BUFFER_CAPACITY
  call $~lib/staticarray/StaticArray<f64>#constructor
  global.set $assembly/index/vesselParamsBuffer
  i32.const 0
  global.get $assembly/index/ENVIRONMENT_BUFFER_CAPACITY
  call $~lib/staticarray/StaticArray<f64>#constructor
  global.set $assembly/index/environmentBuffer
 )
 (func $assembly/index/VesselState#set:x (param $this i32) (param $x f64)
  local.get $this
  local.get $x
  f64.store
 )
 (func $assembly/index/VesselState#set:y (param $this i32) (param $y f64)
  local.get $this
  local.get $y
  f64.store offset=8
 )
 (func $assembly/index/VesselState#set:z (param $this i32) (param $z f64)
  local.get $this
  local.get $z
  f64.store offset=16
 )
 (func $assembly/index/VesselState#set:psi (param $this i32) (param $psi f64)
  local.get $this
  local.get $psi
  f64.store offset=40
 )
 (func $assembly/index/VesselState#set:rollAngle (param $this i32) (param $rollAngle f64)
  local.get $this
  local.get $rollAngle
  f64.store offset=24
 )
 (func $assembly/index/VesselState#set:pitchAngle (param $this i32) (param $pitchAngle f64)
  local.get $this
  local.get $pitchAngle
  f64.store offset=32
 )
 (func $assembly/index/VesselState#set:u (param $this i32) (param $u f64)
  local.get $this
  local.get $u
  f64.store offset=48
 )
 (func $assembly/index/VesselState#set:v (param $this i32) (param $v f64)
  local.get $this
  local.get $v
  f64.store offset=56
 )
 (func $assembly/index/VesselState#set:w (param $this i32) (param $w f64)
  local.get $this
  local.get $w
  f64.store offset=64
 )
 (func $assembly/index/VesselState#set:r (param $this i32) (param $r f64)
  local.get $this
  local.get $r
  f64.store offset=72
 )
 (func $assembly/index/VesselState#set:p (param $this i32) (param $p f64)
  local.get $this
  local.get $p
  f64.store offset=80
 )
 (func $assembly/index/VesselState#set:q (param $this i32) (param $q f64)
  local.get $this
  local.get $q
  f64.store offset=88
 )
 (func $assembly/index/clampSigned (param $value f64) (param $limit f64) (result f64)
  local.get $value
  local.get $limit
  f64.gt
  if
   local.get $limit
   return
  end
  local.get $value
  local.get $limit
  f64.neg
  f64.lt
  if
   local.get $limit
   f64.neg
   return
  end
  local.get $value
  return
 )
 (func $assembly/index/VesselState#set:throttle (param $this i32) (param $throttle f64)
  local.get $this
  local.get $throttle
  f64.store offset=96
 )
 (func $assembly/index/VesselState#set:throttleCommand (param $this i32) (param $throttleCommand f64)
  local.get $this
  local.get $throttleCommand
  f64.store offset=104
 )
 (func $assembly/index/VesselState#set:mass (param $this i32) (param $mass f64)
  local.get $this
  local.get $mass
  f64.store offset=128
 )
 (func $assembly/index/VesselState#set:length (param $this i32) (param $length f64)
  local.get $this
  local.get $length
  f64.store offset=136
 )
 (func $assembly/index/VesselState#set:beam (param $this i32) (param $beam f64)
  local.get $this
  local.get $beam
  f64.store offset=144
 )
 (func $assembly/index/VesselState#set:draft (param $this i32) (param $draft f64)
  local.get $this
  local.get $draft
  f64.store offset=152
 )
 (func $assembly/index/VesselState#set:ballast (param $this i32) (param $ballast f64)
  local.get $this
  local.get $ballast
  f64.store offset=160
 )
 (func $assembly/index/VesselState#set:blockCoefficient (param $this i32) (param $blockCoefficient f64)
  local.get $this
  local.get $blockCoefficient
  f64.store offset=168
 )
 (func $assembly/index/VesselState#set:rudderForceCoefficient (param $this i32) (param $rudderForceCoefficient f64)
  local.get $this
  local.get $rudderForceCoefficient
  f64.store offset=176
 )
 (func $assembly/index/VesselState#set:rudderStallAngle (param $this i32) (param $rudderStallAngle f64)
  local.get $this
  local.get $rudderStallAngle
  f64.store offset=184
 )
 (func $assembly/index/VesselState#set:rudderMaxAngle (param $this i32) (param $rudderMaxAngle f64)
  local.get $this
  local.get $rudderMaxAngle
  f64.store offset=192
 )
 (func $assembly/index/VesselState#get:rudderMaxAngle (param $this i32) (result f64)
  local.get $this
  f64.load offset=192
 )
 (func $assembly/index/VesselState#set:rudderCommand (param $this i32) (param $rudderCommand f64)
  local.get $this
  local.get $rudderCommand
  f64.store offset=120
 )
 (func $assembly/index/VesselState#get:rudderCommand (param $this i32) (result f64)
  local.get $this
  f64.load offset=120
 )
 (func $assembly/index/VesselState#set:rudderAngle (param $this i32) (param $rudderAngle f64)
  local.get $this
  local.get $rudderAngle
  f64.store offset=112
 )
 (func $assembly/index/VesselState#set:dragCoefficient (param $this i32) (param $dragCoefficient f64)
  local.get $this
  local.get $dragCoefficient
  f64.store offset=200
 )
 (func $assembly/index/VesselState#set:yawDamping (param $this i32) (param $yawDamping f64)
  local.get $this
  local.get $yawDamping
  f64.store offset=208
 )
 (func $assembly/index/VesselState#set:yawDampingQuad (param $this i32) (param $yawDampingQuad f64)
  local.get $this
  local.get $yawDampingQuad
  f64.store offset=216
 )
 (func $assembly/index/VesselState#set:swayDamping (param $this i32) (param $swayDamping f64)
  local.get $this
  local.get $swayDamping
  f64.store offset=224
 )
 (func $assembly/index/VesselState#set:maxThrust (param $this i32) (param $maxThrust f64)
  local.get $this
  local.get $maxThrust
  f64.store offset=232
 )
 (func $assembly/index/VesselState#set:maxSpeed (param $this i32) (param $maxSpeed f64)
  local.get $this
  local.get $maxSpeed
  f64.store offset=240
 )
 (func $assembly/index/VesselState#set:rollDamping (param $this i32) (param $rollDamping f64)
  local.get $this
  local.get $rollDamping
  f64.store offset=248
 )
 (func $assembly/index/VesselState#set:pitchDamping (param $this i32) (param $pitchDamping f64)
  local.get $this
  local.get $pitchDamping
  f64.store offset=256
 )
 (func $assembly/index/VesselState#set:heaveStiffness (param $this i32) (param $heaveStiffness f64)
  local.get $this
  local.get $heaveStiffness
  f64.store offset=264
 )
 (func $assembly/index/VesselState#set:heaveDamping (param $this i32) (param $heaveDamping f64)
  local.get $this
  local.get $heaveDamping
  f64.store offset=272
 )
 (func $assembly/index/VesselState#get:length (param $this i32) (result f64)
  local.get $this
  f64.load offset=136
 )
 (func $assembly/index/VesselState#get:draft (param $this i32) (result f64)
  local.get $this
  f64.load offset=152
 )
 (func $assembly/index/VesselState#set:rudderArea (param $this i32) (param $rudderArea f64)
  local.get $this
  local.get $rudderArea
  f64.store offset=280
 )
 (func $assembly/index/VesselState#set:rudderArm (param $this i32) (param $rudderArm f64)
  local.get $this
  local.get $rudderArm
  f64.store offset=288
 )
 (func $assembly/index/VesselState#set:rudderLiftSlope (param $this i32) (param $rudderLiftSlope f64)
  local.get $this
  local.get $rudderLiftSlope
  f64.store offset=296
 )
 (func $assembly/index/VesselState#set:propWashFactor (param $this i32) (param $propWashFactor f64)
  local.get $this
  local.get $propWashFactor
  f64.store offset=304
 )
 (func $assembly/index/VesselState#set:engineTimeConstant (param $this i32) (param $engineTimeConstant f64)
  local.get $this
  local.get $engineTimeConstant
  f64.store offset=312
 )
 (func $assembly/index/VesselState#set:rudderRateLimit (param $this i32) (param $rudderRateLimit f64)
  local.get $this
  local.get $rudderRateLimit
  f64.store offset=320
 )
 (func $assembly/index/VesselState#get:mass (param $this i32) (result f64)
  local.get $this
  f64.load offset=128
 )
 (func $assembly/index/VesselState#set:addedMassX (param $this i32) (param $addedMassX f64)
  local.get $this
  local.get $addedMassX
  f64.store offset=328
 )
 (func $assembly/index/VesselState#set:addedMassY (param $this i32) (param $addedMassY f64)
  local.get $this
  local.get $addedMassY
  f64.store offset=336
 )
 (func $assembly/index/VesselState#set:addedMassYaw (param $this i32) (param $addedMassYaw f64)
  local.get $this
  local.get $addedMassYaw
  f64.store offset=344
 )
 (func $assembly/index/VesselState#set:hullYv (param $this i32) (param $hullYv f64)
  local.get $this
  local.get $hullYv
  f64.store offset=352
 )
 (func $assembly/index/VesselState#set:hullYr (param $this i32) (param $hullYr f64)
  local.get $this
  local.get $hullYr
  f64.store offset=360
 )
 (func $assembly/index/VesselState#set:hullNv (param $this i32) (param $hullNv f64)
  local.get $this
  local.get $hullNv
  f64.store offset=368
 )
 (func $assembly/index/VesselState#set:hullNr (param $this i32) (param $hullNr f64)
  local.get $this
  local.get $hullNr
  f64.store offset=376
 )
 (func $assembly/index/VesselState#get:dragCoefficient (param $this i32) (result f64)
  local.get $this
  f64.load offset=200
 )
 (func $assembly/index/VesselState#set:cdSurge (param $this i32) (param $cdSurge f64)
  local.get $this
  local.get $cdSurge
  f64.store offset=384
 )
 (func $assembly/index/VesselState#set:cdSway (param $this i32) (param $cdSway f64)
  local.get $this
  local.get $cdSway
  f64.store offset=392
 )
 (func $assembly/index/VesselState#set:cdYaw (param $this i32) (param $cdYaw f64)
  local.get $this
  local.get $cdYaw
  f64.store offset=400
 )
 (func $assembly/index/VesselState#set:shallowWaterFactor (param $this i32) (param $shallowWaterFactor f64)
  local.get $this
  local.get $shallowWaterFactor
  f64.store offset=408
 )
 (func $assembly/index/VesselState#set:shallowWaterYawFactor (param $this i32) (param $shallowWaterYawFactor f64)
  local.get $this
  local.get $shallowWaterYawFactor
  f64.store offset=416
 )
 (func $assembly/index/VesselState#set:shallowWaterRudderFactor (param $this i32) (param $shallowWaterRudderFactor f64)
  local.get $this
  local.get $shallowWaterRudderFactor
  f64.store offset=424
 )
 (func $assembly/index/VesselState#set:waveAmplitude (param $this i32) (param $waveAmplitude f64)
  local.get $this
  local.get $waveAmplitude
  f64.store offset=432
 )
 (func $assembly/index/VesselState#set:waveLength (param $this i32) (param $waveLength f64)
  local.get $this
  local.get $waveLength
  f64.store offset=440
 )
 (func $assembly/index/VesselState#set:waveDirection (param $this i32) (param $waveDirection f64)
  local.get $this
  local.get $waveDirection
  f64.store offset=448
 )
 (func $assembly/index/VesselState#set:waveSteepness (param $this i32) (param $waveSteepness f64)
  local.get $this
  local.get $waveSteepness
  f64.store offset=456
 )
 (func $assembly/index/VesselState#set:waveTime (param $this i32) (param $waveTime f64)
  local.get $this
  local.get $waveTime
  f64.store offset=464
 )
 (func $assembly/index/VesselState#set:fuelLevel (param $this i32) (param $fuelLevel f64)
  local.get $this
  local.get $fuelLevel
  f64.store offset=472
 )
 (func $assembly/index/VesselState#set:fuelConsumptionRate (param $this i32) (param $fuelConsumptionRate f64)
  local.get $this
  local.get $fuelConsumptionRate
  f64.store offset=480
 )
 (func $assembly/index/VesselState#set:lastFuelConsumption (param $this i32) (param $lastFuelConsumption f64)
  local.get $this
  local.get $lastFuelConsumption
  f64.store offset=488
 )
 (func $assembly/index/VesselState#set:modelId (param $this i32) (param $modelId i32)
  local.get $this
  local.get $modelId
  i32.store offset=496
 )
 (func $assembly/index/VesselState#constructor (param $this i32) (param $x f64) (param $y f64) (param $z f64) (param $psi f64) (param $roll f64) (param $pitch f64) (param $u f64) (param $v f64) (param $w f64) (param $r f64) (param $p f64) (param $q f64) (param $throttle f64) (param $rudderAngle f64) (param $mass f64) (param $length f64) (param $beam f64) (param $draft f64) (param $blockCoefficient f64) (param $rudderForceCoefficient f64) (param $rudderStallAngle f64) (param $rudderMaxAngle f64) (param $dragCoefficient f64) (param $yawDamping f64) (param $yawDampingQuad f64) (param $swayDamping f64) (param $maxThrust f64) (param $maxSpeed f64) (param $rollDamping f64) (param $pitchDamping f64) (param $heaveStiffness f64) (param $heaveDamping f64) (result i32)
  (local $initialThrottle f64)
  (local $value1 f64)
  (local $value2 f64)
  (local $baseCd f64)
  local.get $this
  i32.eqz
  if
   i32.const 500
   i32.const 4
   call $~lib/rt/stub/__new
   local.set $this
  end
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:x
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:y
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:z
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:rollAngle
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:pitchAngle
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:psi
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:u
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:v
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:w
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:r
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:p
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:q
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:throttle
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:throttleCommand
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:rudderAngle
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:rudderCommand
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:mass
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:length
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:beam
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:draft
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:ballast
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:blockCoefficient
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:rudderForceCoefficient
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:rudderStallAngle
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:rudderMaxAngle
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:dragCoefficient
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:yawDamping
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:yawDampingQuad
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:swayDamping
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:maxThrust
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:maxSpeed
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:rollDamping
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:pitchDamping
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:heaveStiffness
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:heaveDamping
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:rudderArea
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:rudderArm
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:rudderLiftSlope
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:propWashFactor
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:engineTimeConstant
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:rudderRateLimit
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:addedMassX
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:addedMassY
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:addedMassYaw
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:hullYv
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:hullYr
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:hullNv
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:hullNr
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:cdSurge
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:cdSway
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:cdYaw
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:shallowWaterFactor
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:shallowWaterYawFactor
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:shallowWaterRudderFactor
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waveAmplitude
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waveLength
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waveDirection
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waveSteepness
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waveTime
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:fuelLevel
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:fuelConsumptionRate
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:lastFuelConsumption
  local.get $this
  i32.const 0
  call $assembly/index/VesselState#set:modelId
  local.get $this
  local.get $x
  call $assembly/index/VesselState#set:x
  local.get $this
  local.get $y
  call $assembly/index/VesselState#set:y
  local.get $this
  local.get $z
  call $assembly/index/VesselState#set:z
  local.get $this
  local.get $psi
  call $assembly/index/VesselState#set:psi
  local.get $this
  local.get $roll
  call $assembly/index/VesselState#set:rollAngle
  local.get $this
  local.get $pitch
  call $assembly/index/VesselState#set:pitchAngle
  local.get $this
  local.get $u
  call $assembly/index/VesselState#set:u
  local.get $this
  local.get $v
  call $assembly/index/VesselState#set:v
  local.get $this
  local.get $w
  call $assembly/index/VesselState#set:w
  local.get $this
  local.get $r
  call $assembly/index/VesselState#set:r
  local.get $this
  local.get $p
  call $assembly/index/VesselState#set:p
  local.get $this
  local.get $q
  call $assembly/index/VesselState#set:q
  local.get $throttle
  f64.const 1
  call $assembly/index/clampSigned
  local.set $initialThrottle
  local.get $this
  local.get $initialThrottle
  call $assembly/index/VesselState#set:throttle
  local.get $this
  local.get $initialThrottle
  call $assembly/index/VesselState#set:throttleCommand
  local.get $this
  local.get $mass
  f64.const 0
  f64.gt
  if (result f64)
   local.get $mass
  else
   global.get $assembly/index/DEFAULT_MASS
  end
  call $assembly/index/VesselState#set:mass
  local.get $this
  local.get $length
  f64.const 0
  f64.gt
  if (result f64)
   local.get $length
  else
   global.get $assembly/index/DEFAULT_LENGTH
  end
  call $assembly/index/VesselState#set:length
  local.get $this
  local.get $beam
  f64.const 0
  f64.gt
  if (result f64)
   local.get $beam
  else
   global.get $assembly/index/DEFAULT_BEAM
  end
  call $assembly/index/VesselState#set:beam
  local.get $this
  local.get $draft
  f64.const 0
  f64.gt
  if (result f64)
   local.get $draft
  else
   global.get $assembly/index/DEFAULT_DRAFT
  end
  call $assembly/index/VesselState#set:draft
  local.get $this
  f64.const 0.5
  call $assembly/index/VesselState#set:ballast
  local.get $this
  local.get $blockCoefficient
  f64.const 0
  f64.gt
  if (result f64)
   local.get $blockCoefficient
  else
   global.get $assembly/index/DEFAULT_BLOCK_COEFFICIENT
  end
  call $assembly/index/VesselState#set:blockCoefficient
  local.get $this
  local.get $rudderForceCoefficient
  f64.const 0
  f64.gt
  if (result f64)
   local.get $rudderForceCoefficient
  else
   global.get $assembly/index/DEFAULT_RUDDER_FORCE_COEFFICIENT
  end
  call $assembly/index/VesselState#set:rudderForceCoefficient
  local.get $this
  local.get $rudderStallAngle
  f64.const 0
  f64.gt
  if (result f64)
   local.get $rudderStallAngle
  else
   global.get $assembly/index/DEFAULT_RUDDER_STALL_ANGLE
  end
  call $assembly/index/VesselState#set:rudderStallAngle
  local.get $this
  local.get $rudderMaxAngle
  f64.const 0
  f64.gt
  if (result f64)
   local.get $rudderMaxAngle
  else
   global.get $assembly/index/DEFAULT_RUDDER_MAX_ANGLE
  end
  call $assembly/index/VesselState#set:rudderMaxAngle
  local.get $this
  local.get $rudderAngle
  local.get $this
  call $assembly/index/VesselState#get:rudderMaxAngle
  call $assembly/index/clampSigned
  call $assembly/index/VesselState#set:rudderCommand
  local.get $this
  local.get $this
  call $assembly/index/VesselState#get:rudderCommand
  call $assembly/index/VesselState#set:rudderAngle
  local.get $this
  local.get $dragCoefficient
  f64.const 0
  f64.gt
  if (result f64)
   local.get $dragCoefficient
  else
   global.get $assembly/index/DEFAULT_DRAG_COEFFICIENT
  end
  call $assembly/index/VesselState#set:dragCoefficient
  local.get $this
  local.get $yawDamping
  f64.const 0
  f64.gt
  if (result f64)
   local.get $yawDamping
  else
   global.get $assembly/index/DEFAULT_YAW_DAMPING
  end
  call $assembly/index/VesselState#set:yawDamping
  local.get $this
  local.get $yawDampingQuad
  f64.const 0
  f64.gt
  if (result f64)
   local.get $yawDampingQuad
  else
   global.get $assembly/index/DEFAULT_YAW_DAMPING_QUAD
  end
  call $assembly/index/VesselState#set:yawDampingQuad
  local.get $this
  local.get $swayDamping
  f64.const 0
  f64.gt
  if (result f64)
   local.get $swayDamping
  else
   global.get $assembly/index/DEFAULT_SWAY_DAMPING
  end
  call $assembly/index/VesselState#set:swayDamping
  local.get $this
  local.get $maxThrust
  f64.const 0
  f64.gt
  if (result f64)
   local.get $maxThrust
  else
   global.get $assembly/index/DEFAULT_MAX_THRUST
  end
  call $assembly/index/VesselState#set:maxThrust
  local.get $this
  local.get $maxSpeed
  f64.const 0
  f64.gt
  if (result f64)
   local.get $maxSpeed
  else
   global.get $assembly/index/DEFAULT_MAX_SPEED
  end
  call $assembly/index/VesselState#set:maxSpeed
  local.get $this
  local.get $rollDamping
  f64.const 0
  f64.gt
  if (result f64)
   local.get $rollDamping
  else
   global.get $assembly/index/DEFAULT_ROLL_DAMPING
  end
  call $assembly/index/VesselState#set:rollDamping
  local.get $this
  local.get $pitchDamping
  f64.const 0
  f64.gt
  if (result f64)
   local.get $pitchDamping
  else
   global.get $assembly/index/DEFAULT_PITCH_DAMPING
  end
  call $assembly/index/VesselState#set:pitchDamping
  local.get $this
  local.get $heaveStiffness
  f64.const 0
  f64.gt
  if (result f64)
   local.get $heaveStiffness
  else
   global.get $assembly/index/DEFAULT_HEAVE_STIFFNESS
  end
  call $assembly/index/VesselState#set:heaveStiffness
  local.get $this
  local.get $heaveDamping
  f64.const 0
  f64.gt
  if (result f64)
   local.get $heaveDamping
  else
   global.get $assembly/index/DEFAULT_HEAVE_DAMPING
  end
  call $assembly/index/VesselState#set:heaveDamping
  local.get $this
  block $~lib/math/NativeMath.max|inlined.0 (result f64)
   f64.const 0.1
   local.set $value1
   global.get $assembly/index/DEFAULT_RUDDER_AREA_RATIO
   local.get $this
   call $assembly/index/VesselState#get:length
   f64.mul
   local.get $this
   call $assembly/index/VesselState#get:draft
   f64.mul
   local.set $value2
   local.get $value1
   local.get $value2
   f64.max
   br $~lib/math/NativeMath.max|inlined.0
  end
  call $assembly/index/VesselState#set:rudderArea
  local.get $this
  global.get $assembly/index/DEFAULT_RUDDER_ARM_RATIO
  local.get $this
  call $assembly/index/VesselState#get:length
  f64.mul
  call $assembly/index/VesselState#set:rudderArm
  local.get $this
  global.get $assembly/index/DEFAULT_RUDDER_LIFT_SLOPE
  call $assembly/index/VesselState#set:rudderLiftSlope
  local.get $this
  global.get $assembly/index/DEFAULT_PROP_WASH
  call $assembly/index/VesselState#set:propWashFactor
  local.get $this
  global.get $assembly/index/DEFAULT_ENGINE_TIME_CONSTANT
  call $assembly/index/VesselState#set:engineTimeConstant
  local.get $this
  global.get $assembly/index/DEFAULT_RUDDER_RATE
  call $assembly/index/VesselState#set:rudderRateLimit
  local.get $this
  local.get $this
  call $assembly/index/VesselState#get:mass
  global.get $assembly/index/DEFAULT_ADDED_MASS_X_COEFF
  f64.mul
  call $assembly/index/VesselState#set:addedMassX
  local.get $this
  local.get $this
  call $assembly/index/VesselState#get:mass
  global.get $assembly/index/DEFAULT_ADDED_MASS_Y_COEFF
  f64.mul
  call $assembly/index/VesselState#set:addedMassY
  local.get $this
  local.get $this
  call $assembly/index/VesselState#get:mass
  local.get $this
  call $assembly/index/VesselState#get:length
  f64.mul
  local.get $this
  call $assembly/index/VesselState#get:length
  f64.mul
  f64.const 0.1
  f64.mul
  global.get $assembly/index/DEFAULT_ADDED_MASS_YAW_COEFF
  f64.mul
  call $assembly/index/VesselState#set:addedMassYaw
  local.get $this
  global.get $assembly/index/DEFAULT_HULL_YV
  call $assembly/index/VesselState#set:hullYv
  local.get $this
  global.get $assembly/index/DEFAULT_HULL_YR
  call $assembly/index/VesselState#set:hullYr
  local.get $this
  global.get $assembly/index/DEFAULT_HULL_NV
  call $assembly/index/VesselState#set:hullNv
  local.get $this
  global.get $assembly/index/DEFAULT_HULL_NR
  call $assembly/index/VesselState#set:hullNr
  local.get $this
  call $assembly/index/VesselState#get:dragCoefficient
  f64.const 0
  f64.gt
  if (result f64)
   local.get $this
   call $assembly/index/VesselState#get:dragCoefficient
  else
   global.get $assembly/index/DEFAULT_DRAG_COEFFICIENT
  end
  local.set $baseCd
  local.get $this
  local.get $baseCd
  f64.const 0
  f64.gt
  if (result f64)
   local.get $baseCd
  else
   global.get $assembly/index/DEFAULT_CD_SURGE
  end
  call $assembly/index/VesselState#set:cdSurge
  local.get $this
  local.get $baseCd
  f64.const 0
  f64.gt
  if (result f64)
   local.get $baseCd
   f64.const 1.2
   f64.mul
  else
   global.get $assembly/index/DEFAULT_CD_SWAY
  end
  call $assembly/index/VesselState#set:cdSway
  local.get $this
  local.get $baseCd
  f64.const 0
  f64.gt
  if (result f64)
   local.get $baseCd
   f64.const 0.3
   f64.mul
  else
   global.get $assembly/index/DEFAULT_CD_YAW
  end
  call $assembly/index/VesselState#set:cdYaw
  local.get $this
  global.get $assembly/index/DEFAULT_SHALLOW_WATER_FACTOR
  call $assembly/index/VesselState#set:shallowWaterFactor
  local.get $this
  global.get $assembly/index/DEFAULT_SHALLOW_WATER_YAW_FACTOR
  call $assembly/index/VesselState#set:shallowWaterYawFactor
  local.get $this
  global.get $assembly/index/DEFAULT_SHALLOW_WATER_RUDDER_FACTOR
  call $assembly/index/VesselState#set:shallowWaterRudderFactor
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waveAmplitude
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waveLength
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waveDirection
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waveSteepness
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waveTime
  local.get $this
  f64.const 1
  call $assembly/index/VesselState#set:fuelLevel
  local.get $this
  global.get $assembly/index/DEFAULT_FUEL_CONSUMPTION_RATE
  call $assembly/index/VesselState#set:fuelConsumptionRate
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:lastFuelConsumption
  local.get $this
  global.get $assembly/index/MODEL_DISPLACEMENT
  call $assembly/index/VesselState#set:modelId
  local.get $this
 )
 (func $assembly/index/clamp01 (param $value f64) (result f64)
  local.get $value
  f64.const 0
  f64.lt
  if
   f64.const 0
   return
  end
  local.get $value
  f64.const 1
  f64.gt
  if
   f64.const 1
   return
  end
  local.get $value
  return
 )
 (func $assembly/index/createVessel (param $x f64) (param $y f64) (param $z f64) (param $psi f64) (param $_phi f64) (param $_theta f64) (param $u f64) (param $v f64) (param $w f64) (param $r f64) (param $_p f64) (param $_q f64) (param $throttle f64) (param $rudderAngle f64) (param $mass f64) (param $length f64) (param $beam f64) (param $draft f64) (param $blockCoefficient f64) (param $rudderForceCoefficient f64) (param $rudderStallAngle f64) (param $rudderMaxAngle f64) (param $dragCoefficient f64) (param $yawDamping f64) (param $yawDampingQuad f64) (param $swayDamping f64) (param $maxThrust f64) (param $maxSpeed f64) (param $rollDamping f64) (param $pitchDamping f64) (param $heaveStiffness f64) (param $heaveDamping f64) (result i32)
  global.get $assembly/index/globalVessel
  i32.const 0
  i32.eq
  if
   i32.const 0
   local.get $x
   local.get $y
   local.get $z
   local.get $psi
   local.get $_phi
   local.get $_theta
   local.get $u
   local.get $v
   local.get $w
   local.get $r
   local.get $_p
   local.get $_q
   local.get $throttle
   call $assembly/index/clamp01
   local.get $rudderAngle
   local.get $mass
   local.get $length
   local.get $beam
   local.get $draft
   local.get $blockCoefficient
   local.get $rudderForceCoefficient
   local.get $rudderStallAngle
   local.get $rudderMaxAngle
   local.get $dragCoefficient
   local.get $yawDamping
   local.get $yawDampingQuad
   local.get $swayDamping
   local.get $maxThrust
   local.get $maxSpeed
   local.get $rollDamping
   local.get $pitchDamping
   local.get $heaveStiffness
   local.get $heaveDamping
   call $assembly/index/VesselState#constructor
   global.set $assembly/index/globalVessel
  end
  global.get $assembly/index/globalVessel
  return
 )
 (func $assembly/index/createVessel@varargs (param $x f64) (param $y f64) (param $z f64) (param $psi f64) (param $_phi f64) (param $_theta f64) (param $u f64) (param $v f64) (param $w f64) (param $r f64) (param $_p f64) (param $_q f64) (param $throttle f64) (param $rudderAngle f64) (param $mass f64) (param $length f64) (param $beam f64) (param $draft f64) (param $blockCoefficient f64) (param $rudderForceCoefficient f64) (param $rudderStallAngle f64) (param $rudderMaxAngle f64) (param $dragCoefficient f64) (param $yawDamping f64) (param $yawDampingQuad f64) (param $swayDamping f64) (param $maxThrust f64) (param $maxSpeed f64) (param $rollDamping f64) (param $pitchDamping f64) (param $heaveStiffness f64) (param $heaveDamping f64) (result i32)
  block $14of14
   block $13of14
    block $12of14
     block $11of14
      block $10of14
       block $9of14
        block $8of14
         block $7of14
          block $6of14
           block $5of14
            block $4of14
             block $3of14
              block $2of14
               block $1of14
                block $0of14
                 block $outOfRange
                  global.get $~argumentsLength
                  i32.const 18
                  i32.sub
                  br_table $0of14 $1of14 $2of14 $3of14 $4of14 $5of14 $6of14 $7of14 $8of14 $9of14 $10of14 $11of14 $12of14 $13of14 $14of14 $outOfRange
                 end
                 unreachable
                end
                global.get $assembly/index/DEFAULT_BLOCK_COEFFICIENT
                local.set $blockCoefficient
               end
               global.get $assembly/index/DEFAULT_RUDDER_FORCE_COEFFICIENT
               local.set $rudderForceCoefficient
              end
              global.get $assembly/index/DEFAULT_RUDDER_STALL_ANGLE
              local.set $rudderStallAngle
             end
             global.get $assembly/index/DEFAULT_RUDDER_MAX_ANGLE
             local.set $rudderMaxAngle
            end
            global.get $assembly/index/DEFAULT_DRAG_COEFFICIENT
            local.set $dragCoefficient
           end
           global.get $assembly/index/DEFAULT_YAW_DAMPING
           local.set $yawDamping
          end
          global.get $assembly/index/DEFAULT_YAW_DAMPING_QUAD
          local.set $yawDampingQuad
         end
         global.get $assembly/index/DEFAULT_SWAY_DAMPING
         local.set $swayDamping
        end
        global.get $assembly/index/DEFAULT_MAX_THRUST
        local.set $maxThrust
       end
       global.get $assembly/index/DEFAULT_MAX_SPEED
       local.set $maxSpeed
      end
      global.get $assembly/index/DEFAULT_ROLL_DAMPING
      local.set $rollDamping
     end
     global.get $assembly/index/DEFAULT_PITCH_DAMPING
     local.set $pitchDamping
    end
    global.get $assembly/index/DEFAULT_HEAVE_STIFFNESS
    local.set $heaveStiffness
   end
   global.get $assembly/index/DEFAULT_HEAVE_DAMPING
   local.set $heaveDamping
  end
  local.get $x
  local.get $y
  local.get $z
  local.get $psi
  local.get $_phi
  local.get $_theta
  local.get $u
  local.get $v
  local.get $w
  local.get $r
  local.get $_p
  local.get $_q
  local.get $throttle
  local.get $rudderAngle
  local.get $mass
  local.get $length
  local.get $beam
  local.get $draft
  local.get $blockCoefficient
  local.get $rudderForceCoefficient
  local.get $rudderStallAngle
  local.get $rudderMaxAngle
  local.get $dragCoefficient
  local.get $yawDamping
  local.get $yawDampingQuad
  local.get $swayDamping
  local.get $maxThrust
  local.get $maxSpeed
  local.get $rollDamping
  local.get $pitchDamping
  local.get $heaveStiffness
  local.get $heaveDamping
  call $assembly/index/createVessel
 )
 (func $assembly/index/destroyVessel (param $_vesselPtr i32)
  i32.const 0
  global.set $assembly/index/globalVessel
 )
 (func $assembly/index/getVesselParamsBufferPtr (result i32)
  global.get $assembly/index/vesselParamsBuffer
  return
 )
 (func $assembly/index/getVesselParamsBufferCapacity (result i32)
  global.get $assembly/index/VESSEL_PARAM_BUFFER_CAPACITY
  return
 )
 (func $assembly/index/ensureVessel (param $vesselPtr i32) (result i32)
  local.get $vesselPtr
  i32.const 0
  i32.eq
  if
   i32.const 272
   i32.const 336
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $vesselPtr
  return
 )
 (func $~lib/staticarray/StaticArray<f64>#__uget (param $this i32) (param $index i32) (result f64)
  local.get $this
  local.get $index
  i32.const 3
  i32.shl
  i32.add
  f64.load
  return
 )
 (func $assembly/index/readParam (param $params i32) (param $len i32) (param $index i32) (param $fallback f64) (result f64)
  (local $value f64)
  local.get $index
  i32.const 0
  i32.lt_s
  if (result i32)
   i32.const 1
  else
   local.get $index
   local.get $len
   i32.ge_s
  end
  if
   local.get $fallback
   return
  end
  local.get $params
  local.get $index
  call $~lib/staticarray/StaticArray<f64>#__uget
  local.set $value
  local.get $value
  local.get $value
  f64.eq
  if (result f64)
   local.get $value
  else
   local.get $fallback
  end
  return
 )
 (func $assembly/index/VesselState#get:beam (param $this i32) (result f64)
  local.get $this
  f64.load offset=144
 )
 (func $assembly/index/VesselState#get:blockCoefficient (param $this i32) (result f64)
  local.get $this
  f64.load offset=168
 )
 (func $assembly/index/VesselState#get:rudderForceCoefficient (param $this i32) (result f64)
  local.get $this
  f64.load offset=176
 )
 (func $assembly/index/VesselState#get:rudderStallAngle (param $this i32) (result f64)
  local.get $this
  f64.load offset=184
 )
 (func $assembly/index/VesselState#get:yawDamping (param $this i32) (result f64)
  local.get $this
  f64.load offset=208
 )
 (func $assembly/index/VesselState#get:yawDampingQuad (param $this i32) (result f64)
  local.get $this
  f64.load offset=216
 )
 (func $assembly/index/VesselState#get:swayDamping (param $this i32) (result f64)
  local.get $this
  f64.load offset=224
 )
 (func $assembly/index/VesselState#get:maxThrust (param $this i32) (result f64)
  local.get $this
  f64.load offset=232
 )
 (func $assembly/index/VesselState#get:maxSpeed (param $this i32) (result f64)
  local.get $this
  f64.load offset=240
 )
 (func $assembly/index/VesselState#get:rollDamping (param $this i32) (result f64)
  local.get $this
  f64.load offset=248
 )
 (func $assembly/index/VesselState#get:pitchDamping (param $this i32) (result f64)
  local.get $this
  f64.load offset=256
 )
 (func $assembly/index/VesselState#get:heaveStiffness (param $this i32) (result f64)
  local.get $this
  f64.load offset=264
 )
 (func $assembly/index/VesselState#get:heaveDamping (param $this i32) (result f64)
  local.get $this
  f64.load offset=272
 )
 (func $assembly/index/VesselState#get:rudderArea (param $this i32) (result f64)
  local.get $this
  f64.load offset=280
 )
 (func $assembly/index/VesselState#get:rudderArm (param $this i32) (result f64)
  local.get $this
  f64.load offset=288
 )
 (func $assembly/index/VesselState#get:rudderLiftSlope (param $this i32) (result f64)
  local.get $this
  f64.load offset=296
 )
 (func $assembly/index/VesselState#get:propWashFactor (param $this i32) (result f64)
  local.get $this
  f64.load offset=304
 )
 (func $assembly/index/VesselState#get:engineTimeConstant (param $this i32) (result f64)
  local.get $this
  f64.load offset=312
 )
 (func $assembly/index/VesselState#get:rudderRateLimit (param $this i32) (result f64)
  local.get $this
  f64.load offset=320
 )
 (func $assembly/index/VesselState#get:addedMassX (param $this i32) (result f64)
  local.get $this
  f64.load offset=328
 )
 (func $assembly/index/VesselState#get:addedMassY (param $this i32) (result f64)
  local.get $this
  f64.load offset=336
 )
 (func $assembly/index/VesselState#get:addedMassYaw (param $this i32) (result f64)
  local.get $this
  f64.load offset=344
 )
 (func $assembly/index/VesselState#get:hullYv (param $this i32) (result f64)
  local.get $this
  f64.load offset=352
 )
 (func $assembly/index/VesselState#get:hullYr (param $this i32) (result f64)
  local.get $this
  f64.load offset=360
 )
 (func $assembly/index/VesselState#get:hullNv (param $this i32) (result f64)
  local.get $this
  f64.load offset=368
 )
 (func $assembly/index/VesselState#get:hullNr (param $this i32) (result f64)
  local.get $this
  f64.load offset=376
 )
 (func $assembly/index/VesselState#get:cdSurge (param $this i32) (result f64)
  local.get $this
  f64.load offset=384
 )
 (func $assembly/index/VesselState#get:cdSway (param $this i32) (result f64)
  local.get $this
  f64.load offset=392
 )
 (func $assembly/index/VesselState#get:cdYaw (param $this i32) (result f64)
  local.get $this
  f64.load offset=400
 )
 (func $assembly/index/VesselState#get:shallowWaterFactor (param $this i32) (result f64)
  local.get $this
  f64.load offset=408
 )
 (func $assembly/index/VesselState#get:shallowWaterYawFactor (param $this i32) (result f64)
  local.get $this
  f64.load offset=416
 )
 (func $assembly/index/VesselState#get:shallowWaterRudderFactor (param $this i32) (result f64)
  local.get $this
  f64.load offset=424
 )
 (func $assembly/index/VesselState#get:rudderAngle (param $this i32) (result f64)
  local.get $this
  f64.load offset=112
 )
 (func $assembly/index/setVesselParams (param $vesselPtr i32) (param $modelId i32) (param $paramsPtr i32) (param $paramsLen i32)
  (local $vessel i32)
  (local $params i32)
  (local $len i32)
  (local $mass f64)
  (local $length f64)
  (local $beam f64)
  (local $draft f64)
  (local $blockCoefficient f64)
  (local $rudderForceCoefficient f64)
  (local $rudderStallAngle f64)
  (local $rudderMaxAngle f64)
  (local $dragCoefficient f64)
  (local $yawDamping f64)
  (local $yawDampingQuad f64)
  (local $swayDamping f64)
  (local $maxThrust f64)
  (local $maxSpeed f64)
  (local $rollDamping f64)
  (local $pitchDamping f64)
  (local $heaveStiffness f64)
  (local $heaveDamping f64)
  (local $rudderArea f64)
  (local $rudderArm f64)
  (local $rudderLiftSlope f64)
  (local $propWashFactor f64)
  (local $engineTimeConstant f64)
  (local $rudderRateLimit f64)
  (local $addedMassX f64)
  (local $addedMassY f64)
  (local $addedMassYaw f64)
  (local $cdSurge f64)
  (local $cdSway f64)
  (local $cdYaw f64)
  (local $shallowWaterFactor f64)
  (local $shallowWaterYawFactor f64)
  (local $shallowWaterRudderFactor f64)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  local.set $vessel
  local.get $vessel
  local.get $modelId
  call $assembly/index/VesselState#set:modelId
  local.get $paramsPtr
  i32.const 0
  i32.eq
  if (result i32)
   i32.const 1
  else
   local.get $paramsLen
   i32.const 0
   i32.le_s
  end
  if
   return
  end
  local.get $paramsPtr
  local.set $params
  local.get $paramsLen
  i32.const 0
  i32.gt_s
  if (result i32)
   local.get $paramsLen
  else
   i32.const 0
  end
  local.set $len
  local.get $modelId
  global.get $assembly/index/MODEL_DISPLACEMENT
  i32.ne
  if
   return
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_MASS
  local.get $vessel
  call $assembly/index/VesselState#get:mass
  call $assembly/index/readParam
  local.set $mass
  local.get $mass
  f64.const 0
  f64.gt
  if
   local.get $vessel
   local.get $mass
   call $assembly/index/VesselState#set:mass
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_LENGTH
  local.get $vessel
  call $assembly/index/VesselState#get:length
  call $assembly/index/readParam
  local.set $length
  local.get $length
  f64.const 0
  f64.gt
  if
   local.get $vessel
   local.get $length
   call $assembly/index/VesselState#set:length
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_BEAM
  local.get $vessel
  call $assembly/index/VesselState#get:beam
  call $assembly/index/readParam
  local.set $beam
  local.get $beam
  f64.const 0
  f64.gt
  if
   local.get $vessel
   local.get $beam
   call $assembly/index/VesselState#set:beam
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_DRAFT
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  call $assembly/index/readParam
  local.set $draft
  local.get $draft
  f64.const 0
  f64.gt
  if
   local.get $vessel
   local.get $draft
   call $assembly/index/VesselState#set:draft
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_BLOCK_COEFFICIENT
  local.get $vessel
  call $assembly/index/VesselState#get:blockCoefficient
  call $assembly/index/readParam
  local.set $blockCoefficient
  local.get $blockCoefficient
  f64.const 0
  f64.gt
  if
   local.get $vessel
   local.get $blockCoefficient
   call $assembly/index/VesselState#set:blockCoefficient
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_RUDDER_FORCE_COEFFICIENT
  local.get $vessel
  call $assembly/index/VesselState#get:rudderForceCoefficient
  call $assembly/index/readParam
  local.set $rudderForceCoefficient
  local.get $rudderForceCoefficient
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $rudderForceCoefficient
   call $assembly/index/VesselState#set:rudderForceCoefficient
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_RUDDER_STALL_ANGLE
  local.get $vessel
  call $assembly/index/VesselState#get:rudderStallAngle
  call $assembly/index/readParam
  local.set $rudderStallAngle
  local.get $rudderStallAngle
  f64.const 0
  f64.gt
  if
   local.get $vessel
   local.get $rudderStallAngle
   call $assembly/index/VesselState#set:rudderStallAngle
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_RUDDER_MAX_ANGLE
  local.get $vessel
  call $assembly/index/VesselState#get:rudderMaxAngle
  call $assembly/index/readParam
  local.set $rudderMaxAngle
  local.get $rudderMaxAngle
  f64.const 0
  f64.gt
  if
   local.get $vessel
   local.get $rudderMaxAngle
   call $assembly/index/VesselState#set:rudderMaxAngle
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_DRAG_COEFFICIENT
  local.get $vessel
  call $assembly/index/VesselState#get:dragCoefficient
  call $assembly/index/readParam
  local.set $dragCoefficient
  local.get $dragCoefficient
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $dragCoefficient
   call $assembly/index/VesselState#set:dragCoefficient
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_YAW_DAMPING
  local.get $vessel
  call $assembly/index/VesselState#get:yawDamping
  call $assembly/index/readParam
  local.set $yawDamping
  local.get $yawDamping
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $yawDamping
   call $assembly/index/VesselState#set:yawDamping
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_YAW_DAMPING_QUAD
  local.get $vessel
  call $assembly/index/VesselState#get:yawDampingQuad
  call $assembly/index/readParam
  local.set $yawDampingQuad
  local.get $yawDampingQuad
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $yawDampingQuad
   call $assembly/index/VesselState#set:yawDampingQuad
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_SWAY_DAMPING
  local.get $vessel
  call $assembly/index/VesselState#get:swayDamping
  call $assembly/index/readParam
  local.set $swayDamping
  local.get $swayDamping
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $swayDamping
   call $assembly/index/VesselState#set:swayDamping
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_MAX_THRUST
  local.get $vessel
  call $assembly/index/VesselState#get:maxThrust
  call $assembly/index/readParam
  local.set $maxThrust
  local.get $maxThrust
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $maxThrust
   call $assembly/index/VesselState#set:maxThrust
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_MAX_SPEED
  local.get $vessel
  call $assembly/index/VesselState#get:maxSpeed
  call $assembly/index/readParam
  local.set $maxSpeed
  local.get $maxSpeed
  f64.const 0
  f64.gt
  if
   local.get $vessel
   local.get $maxSpeed
   call $assembly/index/VesselState#set:maxSpeed
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_ROLL_DAMPING
  local.get $vessel
  call $assembly/index/VesselState#get:rollDamping
  call $assembly/index/readParam
  local.set $rollDamping
  local.get $rollDamping
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $rollDamping
   call $assembly/index/VesselState#set:rollDamping
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_PITCH_DAMPING
  local.get $vessel
  call $assembly/index/VesselState#get:pitchDamping
  call $assembly/index/readParam
  local.set $pitchDamping
  local.get $pitchDamping
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $pitchDamping
   call $assembly/index/VesselState#set:pitchDamping
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_HEAVE_STIFFNESS
  local.get $vessel
  call $assembly/index/VesselState#get:heaveStiffness
  call $assembly/index/readParam
  local.set $heaveStiffness
  local.get $heaveStiffness
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $heaveStiffness
   call $assembly/index/VesselState#set:heaveStiffness
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_HEAVE_DAMPING
  local.get $vessel
  call $assembly/index/VesselState#get:heaveDamping
  call $assembly/index/readParam
  local.set $heaveDamping
  local.get $heaveDamping
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $heaveDamping
   call $assembly/index/VesselState#set:heaveDamping
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_RUDDER_AREA
  local.get $vessel
  call $assembly/index/VesselState#get:rudderArea
  call $assembly/index/readParam
  local.set $rudderArea
  local.get $rudderArea
  f64.const 0
  f64.gt
  if
   local.get $vessel
   local.get $rudderArea
   call $assembly/index/VesselState#set:rudderArea
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_RUDDER_ARM
  local.get $vessel
  call $assembly/index/VesselState#get:rudderArm
  call $assembly/index/readParam
  local.set $rudderArm
  local.get $rudderArm
  f64.const 0
  f64.gt
  if
   local.get $vessel
   local.get $rudderArm
   call $assembly/index/VesselState#set:rudderArm
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_RUDDER_LIFT_SLOPE
  local.get $vessel
  call $assembly/index/VesselState#get:rudderLiftSlope
  call $assembly/index/readParam
  local.set $rudderLiftSlope
  local.get $rudderLiftSlope
  f64.const 0
  f64.gt
  if
   local.get $vessel
   local.get $rudderLiftSlope
   call $assembly/index/VesselState#set:rudderLiftSlope
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_PROP_WASH
  local.get $vessel
  call $assembly/index/VesselState#get:propWashFactor
  call $assembly/index/readParam
  local.set $propWashFactor
  local.get $propWashFactor
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $propWashFactor
   call $assembly/index/VesselState#set:propWashFactor
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_ENGINE_TIME_CONSTANT
  local.get $vessel
  call $assembly/index/VesselState#get:engineTimeConstant
  call $assembly/index/readParam
  local.set $engineTimeConstant
  local.get $engineTimeConstant
  f64.const 0
  f64.gt
  if
   local.get $vessel
   local.get $engineTimeConstant
   call $assembly/index/VesselState#set:engineTimeConstant
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_RUDDER_RATE
  local.get $vessel
  call $assembly/index/VesselState#get:rudderRateLimit
  call $assembly/index/readParam
  local.set $rudderRateLimit
  local.get $rudderRateLimit
  f64.const 0
  f64.gt
  if
   local.get $vessel
   local.get $rudderRateLimit
   call $assembly/index/VesselState#set:rudderRateLimit
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_ADDED_MASS_X
  local.get $vessel
  call $assembly/index/VesselState#get:addedMassX
  call $assembly/index/readParam
  local.set $addedMassX
  local.get $addedMassX
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $addedMassX
   call $assembly/index/VesselState#set:addedMassX
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_ADDED_MASS_Y
  local.get $vessel
  call $assembly/index/VesselState#get:addedMassY
  call $assembly/index/readParam
  local.set $addedMassY
  local.get $addedMassY
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $addedMassY
   call $assembly/index/VesselState#set:addedMassY
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_ADDED_MASS_YAW
  local.get $vessel
  call $assembly/index/VesselState#get:addedMassYaw
  call $assembly/index/readParam
  local.set $addedMassYaw
  local.get $addedMassYaw
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $addedMassYaw
   call $assembly/index/VesselState#set:addedMassYaw
  end
  local.get $vessel
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_HULL_YV
  local.get $vessel
  call $assembly/index/VesselState#get:hullYv
  call $assembly/index/readParam
  call $assembly/index/VesselState#set:hullYv
  local.get $vessel
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_HULL_YR
  local.get $vessel
  call $assembly/index/VesselState#get:hullYr
  call $assembly/index/readParam
  call $assembly/index/VesselState#set:hullYr
  local.get $vessel
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_HULL_NV
  local.get $vessel
  call $assembly/index/VesselState#get:hullNv
  call $assembly/index/readParam
  call $assembly/index/VesselState#set:hullNv
  local.get $vessel
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_HULL_NR
  local.get $vessel
  call $assembly/index/VesselState#get:hullNr
  call $assembly/index/readParam
  call $assembly/index/VesselState#set:hullNr
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_CD_SURGE
  local.get $vessel
  call $assembly/index/VesselState#get:cdSurge
  call $assembly/index/readParam
  local.set $cdSurge
  local.get $cdSurge
  f64.const 0
  f64.gt
  if
   local.get $vessel
   local.get $cdSurge
   call $assembly/index/VesselState#set:cdSurge
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_CD_SWAY
  local.get $vessel
  call $assembly/index/VesselState#get:cdSway
  call $assembly/index/readParam
  local.set $cdSway
  local.get $cdSway
  f64.const 0
  f64.gt
  if
   local.get $vessel
   local.get $cdSway
   call $assembly/index/VesselState#set:cdSway
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_CD_YAW
  local.get $vessel
  call $assembly/index/VesselState#get:cdYaw
  call $assembly/index/readParam
  local.set $cdYaw
  local.get $cdYaw
  f64.const 0
  f64.gt
  if
   local.get $vessel
   local.get $cdYaw
   call $assembly/index/VesselState#set:cdYaw
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_SHALLOW_WATER_FACTOR
  local.get $vessel
  call $assembly/index/VesselState#get:shallowWaterFactor
  call $assembly/index/readParam
  local.set $shallowWaterFactor
  local.get $shallowWaterFactor
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $shallowWaterFactor
   call $assembly/index/VesselState#set:shallowWaterFactor
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_SHALLOW_WATER_YAW_FACTOR
  local.get $vessel
  call $assembly/index/VesselState#get:shallowWaterYawFactor
  call $assembly/index/readParam
  local.set $shallowWaterYawFactor
  local.get $shallowWaterYawFactor
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $shallowWaterYawFactor
   call $assembly/index/VesselState#set:shallowWaterYawFactor
  end
  local.get $params
  local.get $len
  global.get $assembly/index/PARAM_SHALLOW_WATER_RUDDER_FACTOR
  local.get $vessel
  call $assembly/index/VesselState#get:shallowWaterRudderFactor
  call $assembly/index/readParam
  local.set $shallowWaterRudderFactor
  local.get $shallowWaterRudderFactor
  f64.const 0
  f64.ge
  if
   local.get $vessel
   local.get $shallowWaterRudderFactor
   call $assembly/index/VesselState#set:shallowWaterRudderFactor
  end
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:rudderCommand
  local.get $vessel
  call $assembly/index/VesselState#get:rudderMaxAngle
  call $assembly/index/clampSigned
  call $assembly/index/VesselState#set:rudderCommand
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:rudderAngle
  local.get $vessel
  call $assembly/index/VesselState#get:rudderMaxAngle
  call $assembly/index/clampSigned
  call $assembly/index/VesselState#set:rudderAngle
 )
 (func $assembly/index/getEnvironmentBufferPtr (result i32)
  global.get $assembly/index/environmentBuffer
  return
 )
 (func $assembly/index/getEnvironmentBufferCapacity (result i32)
  global.get $assembly/index/ENVIRONMENT_BUFFER_CAPACITY
  return
 )
 (func $assembly/index/EnvironmentState#get:windSpeed (param $this i32) (result f64)
  local.get $this
  f64.load
 )
 (func $assembly/index/EnvironmentState#get:windDirection (param $this i32) (result f64)
  local.get $this
  f64.load offset=8
 )
 (func $assembly/index/EnvironmentState#get:currentSpeed (param $this i32) (result f64)
  local.get $this
  f64.load offset=16
 )
 (func $assembly/index/EnvironmentState#get:currentDirection (param $this i32) (result f64)
  local.get $this
  f64.load offset=24
 )
 (func $assembly/index/EnvironmentState#get:waveHeight (param $this i32) (result f64)
  local.get $this
  f64.load offset=32
 )
 (func $assembly/index/EnvironmentState#get:waveLength (param $this i32) (result f64)
  local.get $this
  f64.load offset=40
 )
 (func $assembly/index/EnvironmentState#get:waveDirection (param $this i32) (result f64)
  local.get $this
  f64.load offset=48
 )
 (func $assembly/index/EnvironmentState#get:waveSteepness (param $this i32) (result f64)
  local.get $this
  f64.load offset=56
 )
 (func $assembly/index/EnvironmentState#get:waterDepth (param $this i32) (result f64)
  local.get $this
  f64.load offset=64
 )
 (func $assembly/index/setEnvironment (param $paramsPtr i32) (param $paramsLen i32)
  (local $params i32)
  (local $len i32)
  local.get $paramsPtr
  i32.const 0
  i32.eq
  if (result i32)
   i32.const 1
  else
   local.get $paramsLen
   i32.const 0
   i32.le_s
  end
  if
   return
  end
  local.get $paramsPtr
  local.set $params
  local.get $paramsLen
  i32.const 0
  i32.gt_s
  if (result i32)
   local.get $paramsLen
  else
   i32.const 0
  end
  local.set $len
  global.get $assembly/index/globalEnvironment
  local.get $params
  local.get $len
  global.get $assembly/index/ENV_WIND_SPEED
  global.get $assembly/index/globalEnvironment
  call $assembly/index/EnvironmentState#get:windSpeed
  call $assembly/index/readParam
  call $assembly/index/EnvironmentState#set:windSpeed
  global.get $assembly/index/globalEnvironment
  local.get $params
  local.get $len
  global.get $assembly/index/ENV_WIND_DIRECTION
  global.get $assembly/index/globalEnvironment
  call $assembly/index/EnvironmentState#get:windDirection
  call $assembly/index/readParam
  call $assembly/index/EnvironmentState#set:windDirection
  global.get $assembly/index/globalEnvironment
  local.get $params
  local.get $len
  global.get $assembly/index/ENV_CURRENT_SPEED
  global.get $assembly/index/globalEnvironment
  call $assembly/index/EnvironmentState#get:currentSpeed
  call $assembly/index/readParam
  call $assembly/index/EnvironmentState#set:currentSpeed
  global.get $assembly/index/globalEnvironment
  local.get $params
  local.get $len
  global.get $assembly/index/ENV_CURRENT_DIRECTION
  global.get $assembly/index/globalEnvironment
  call $assembly/index/EnvironmentState#get:currentDirection
  call $assembly/index/readParam
  call $assembly/index/EnvironmentState#set:currentDirection
  global.get $assembly/index/globalEnvironment
  local.get $params
  local.get $len
  global.get $assembly/index/ENV_WAVE_HEIGHT
  global.get $assembly/index/globalEnvironment
  call $assembly/index/EnvironmentState#get:waveHeight
  call $assembly/index/readParam
  call $assembly/index/EnvironmentState#set:waveHeight
  global.get $assembly/index/globalEnvironment
  local.get $params
  local.get $len
  global.get $assembly/index/ENV_WAVE_LENGTH
  global.get $assembly/index/globalEnvironment
  call $assembly/index/EnvironmentState#get:waveLength
  call $assembly/index/readParam
  call $assembly/index/EnvironmentState#set:waveLength
  global.get $assembly/index/globalEnvironment
  local.get $params
  local.get $len
  global.get $assembly/index/ENV_WAVE_DIRECTION
  global.get $assembly/index/globalEnvironment
  call $assembly/index/EnvironmentState#get:waveDirection
  call $assembly/index/readParam
  call $assembly/index/EnvironmentState#set:waveDirection
  global.get $assembly/index/globalEnvironment
  local.get $params
  local.get $len
  global.get $assembly/index/ENV_WAVE_STEEPNESS
  global.get $assembly/index/globalEnvironment
  call $assembly/index/EnvironmentState#get:waveSteepness
  call $assembly/index/readParam
  call $assembly/index/EnvironmentState#set:waveSteepness
  global.get $assembly/index/globalEnvironment
  local.get $params
  local.get $len
  global.get $assembly/index/ENV_WATER_DEPTH
  global.get $assembly/index/globalEnvironment
  call $assembly/index/EnvironmentState#get:waterDepth
  call $assembly/index/readParam
  call $assembly/index/EnvironmentState#set:waterDepth
 )
 (func $assembly/index/VesselState#get:ballast (param $this i32) (result f64)
  local.get $this
  f64.load offset=160
 )
 (func $assembly/index/VesselState#get:throttleCommand (param $this i32) (result f64)
  local.get $this
  f64.load offset=104
 )
 (func $assembly/index/VesselState#get:throttle (param $this i32) (result f64)
  local.get $this
  f64.load offset=96
 )
 (func $assembly/index/VesselState#get:fuelLevel (param $this i32) (result f64)
  local.get $this
  f64.load offset=472
 )
 (func $assembly/index/VesselState#get:fuelConsumptionRate (param $this i32) (result f64)
  local.get $this
  f64.load offset=480
 )
 (func $assembly/index/VesselState#get:psi (param $this i32) (result f64)
  local.get $this
  f64.load offset=40
 )
 (func $~lib/math/pio2_large_quot (param $x f64) (param $u i64) (result i32)
  (local $magnitude i64)
  (local $offset i64)
  (local $shift i64)
  (local $tblPtr i32)
  (local $s0 i64)
  (local $s1 i64)
  (local $s2 i64)
  (local $b0 i64)
  (local $b1 i64)
  (local $b2 i64)
  (local $rshift i64)
  (local $b3 i64)
  (local $significand i64)
  (local $u|15 i64)
  (local $v i64)
  (local $u1 i64)
  (local $v1 i64)
  (local $w0 i64)
  (local $w1 i64)
  (local $t i64)
  (local $blo i64)
  (local $bhi i64)
  (local $ahi i64)
  (local $clo i64)
  (local $plo i64)
  (local $phi i64)
  (local $rlo i64)
  (local $rhi i64)
  (local $slo i64)
  (local $shi i64)
  (local $q i64)
  (local $q0 i64)
  (local $q1 i64)
  (local $shift|35 i64)
  (local $u|36 i64)
  (local $v|37 i64)
  (local $u1|38 i64)
  (local $v1|39 i64)
  (local $w0|40 i64)
  (local $w1|41 i64)
  (local $t|42 i64)
  (local $lo i64)
  (local $hi i64)
  (local $ahi|45 i64)
  (local $alo i64)
  (local $blo|47 i64)
  (local $shifter i64)
  (local $signbit i64)
  (local $coeff f64)
  local.get $u
  i64.const 9223372036854775807
  i64.and
  local.set $magnitude
  local.get $magnitude
  i64.const 52
  i64.shr_s
  i64.const 1045
  i64.sub
  local.set $offset
  local.get $offset
  i64.const 63
  i64.and
  local.set $shift
  i32.const 384
  local.get $offset
  i64.const 6
  i64.shr_s
  i32.wrap_i64
  i32.const 3
  i32.shl
  i32.add
  local.set $tblPtr
  local.get $tblPtr
  i64.load
  local.set $b0
  local.get $tblPtr
  i64.load offset=8
  local.set $b1
  local.get $tblPtr
  i64.load offset=16
  local.set $b2
  local.get $shift
  i64.const 0
  i64.ne
  if
   i32.const 64
   i64.extend_i32_s
   local.get $shift
   i64.sub
   local.set $rshift
   local.get $tblPtr
   i64.load offset=24
   local.set $b3
   local.get $b1
   local.get $rshift
   i64.shr_u
   local.get $b0
   local.get $shift
   i64.shl
   i64.or
   local.set $s0
   local.get $b2
   local.get $rshift
   i64.shr_u
   local.get $b1
   local.get $shift
   i64.shl
   i64.or
   local.set $s1
   local.get $b3
   local.get $rshift
   i64.shr_u
   local.get $b2
   local.get $shift
   i64.shl
   i64.or
   local.set $s2
  else
   local.get $b0
   local.set $s0
   local.get $b1
   local.set $s1
   local.get $b2
   local.set $s2
  end
  local.get $u
  i64.const 4503599627370495
  i64.and
  i64.const 4503599627370496
  i64.or
  local.set $significand
  block $~lib/math/umuldi|inlined.0 (result i64)
   local.get $s1
   local.set $u|15
   local.get $significand
   local.set $v
   local.get $u|15
   i64.const 4294967295
   i64.and
   local.set $u1
   local.get $v
   i64.const 4294967295
   i64.and
   local.set $v1
   local.get $u|15
   i64.const 32
   i64.shr_u
   local.set $u|15
   local.get $v
   i64.const 32
   i64.shr_u
   local.set $v
   local.get $u1
   local.get $v1
   i64.mul
   local.set $t
   local.get $t
   i64.const 4294967295
   i64.and
   local.set $w0
   local.get $u|15
   local.get $v1
   i64.mul
   local.get $t
   i64.const 32
   i64.shr_u
   i64.add
   local.set $t
   local.get $t
   i64.const 32
   i64.shr_u
   local.set $w1
   local.get $u1
   local.get $v
   i64.mul
   local.get $t
   i64.const 4294967295
   i64.and
   i64.add
   local.set $t
   local.get $u|15
   local.get $v
   i64.mul
   local.get $w1
   i64.add
   local.get $t
   i64.const 32
   i64.shr_u
   i64.add
   global.set $~lib/math/res128_hi
   local.get $t
   i64.const 32
   i64.shl
   local.get $w0
   i64.add
   br $~lib/math/umuldi|inlined.0
  end
  local.set $blo
  global.get $~lib/math/res128_hi
  local.set $bhi
  local.get $s0
  local.get $significand
  i64.mul
  local.set $ahi
  local.get $s2
  i64.const 32
  i64.shr_u
  local.get $significand
  i64.const 32
  i64.shr_s
  i64.mul
  local.set $clo
  local.get $blo
  local.get $clo
  i64.add
  local.set $plo
  local.get $ahi
  local.get $bhi
  i64.add
  local.get $plo
  local.get $clo
  i64.lt_u
  i64.extend_i32_u
  i64.add
  local.set $phi
  local.get $plo
  i64.const 2
  i64.shl
  local.set $rlo
  local.get $phi
  i64.const 2
  i64.shl
  local.get $plo
  i64.const 62
  i64.shr_u
  i64.or
  local.set $rhi
  local.get $rhi
  i64.const 63
  i64.shr_s
  local.set $slo
  local.get $slo
  i64.const 1
  i64.shr_s
  local.set $shi
  local.get $phi
  i64.const 62
  i64.shr_s
  local.get $slo
  i64.sub
  local.set $q
  i64.const 4372995238176751616
  block $~lib/math/pio2_right|inlined.0 (result i64)
   local.get $rlo
   local.get $slo
   i64.xor
   local.set $q0
   local.get $rhi
   local.get $shi
   i64.xor
   local.set $q1
   local.get $q1
   i64.clz
   local.set $shift|35
   local.get $q1
   local.get $shift|35
   i64.shl
   local.get $q0
   i64.const 64
   local.get $shift|35
   i64.sub
   i64.shr_u
   i64.or
   local.set $q1
   local.get $q0
   local.get $shift|35
   i64.shl
   local.set $q0
   block $~lib/math/umuldi|inlined.1 (result i64)
    i64.const -3958705157555305932
    local.set $u|36
    local.get $q1
    local.set $v|37
    local.get $u|36
    i64.const 4294967295
    i64.and
    local.set $u1|38
    local.get $v|37
    i64.const 4294967295
    i64.and
    local.set $v1|39
    local.get $u|36
    i64.const 32
    i64.shr_u
    local.set $u|36
    local.get $v|37
    i64.const 32
    i64.shr_u
    local.set $v|37
    local.get $u1|38
    local.get $v1|39
    i64.mul
    local.set $t|42
    local.get $t|42
    i64.const 4294967295
    i64.and
    local.set $w0|40
    local.get $u|36
    local.get $v1|39
    i64.mul
    local.get $t|42
    i64.const 32
    i64.shr_u
    i64.add
    local.set $t|42
    local.get $t|42
    i64.const 32
    i64.shr_u
    local.set $w1|41
    local.get $u1|38
    local.get $v|37
    i64.mul
    local.get $t|42
    i64.const 4294967295
    i64.and
    i64.add
    local.set $t|42
    local.get $u|36
    local.get $v|37
    i64.mul
    local.get $w1|41
    i64.add
    local.get $t|42
    i64.const 32
    i64.shr_u
    i64.add
    global.set $~lib/math/res128_hi
    local.get $t|42
    i64.const 32
    i64.shl
    local.get $w0|40
    i64.add
    br $~lib/math/umuldi|inlined.1
   end
   local.set $lo
   global.get $~lib/math/res128_hi
   local.set $hi
   local.get $hi
   i64.const 11
   i64.shr_u
   local.set $ahi|45
   local.get $lo
   i64.const 11
   i64.shr_u
   local.get $hi
   i64.const 53
   i64.shl
   i64.or
   local.set $alo
   f64.const 2.6469779601696886e-23
   i64.const -4267615245585081135
   f64.convert_i64_u
   f64.mul
   local.get $q1
   f64.convert_i64_u
   f64.mul
   f64.const 2.6469779601696886e-23
   i64.const -3958705157555305932
   f64.convert_i64_u
   f64.mul
   local.get $q0
   f64.convert_i64_u
   f64.mul
   f64.add
   i64.trunc_sat_f64_u
   local.set $blo|47
   local.get $ahi|45
   local.get $lo
   local.get $blo|47
   i64.lt_u
   i64.extend_i32_u
   i64.add
   f64.convert_i64_u
   global.set $~lib/math/rempio2_y0
   f64.const 5.421010862427522e-20
   local.get $alo
   local.get $blo|47
   i64.add
   f64.convert_i64_u
   f64.mul
   global.set $~lib/math/rempio2_y1
   local.get $shift|35
   br $~lib/math/pio2_right|inlined.0
  end
  i64.const 52
  i64.shl
  i64.sub
  local.set $shifter
  local.get $u
  local.get $rhi
  i64.xor
  i64.const -9223372036854775808
  i64.and
  local.set $signbit
  local.get $shifter
  local.get $signbit
  i64.or
  f64.reinterpret_i64
  local.set $coeff
  global.get $~lib/math/rempio2_y0
  local.get $coeff
  f64.mul
  global.set $~lib/math/rempio2_y0
  global.get $~lib/math/rempio2_y1
  local.get $coeff
  f64.mul
  global.set $~lib/math/rempio2_y1
  local.get $q
  i32.wrap_i64
  return
 )
 (func $~lib/math/NativeMath.cos (param $x f64) (result f64)
  (local $u i64)
  (local $ux i32)
  (local $sign i32)
  (local $x|4 f64)
  (local $y f64)
  (local $z f64)
  (local $w f64)
  (local $r f64)
  (local $hz f64)
  (local $x|10 f64)
  (local $u|11 i64)
  (local $sign|12 i32)
  (local $ix i32)
  (local $q i32)
  (local $z|15 f64)
  (local $y0 f64)
  (local $y1 f64)
  (local $q|18 f64)
  (local $r|19 f64)
  (local $w|20 f64)
  (local $j i32)
  (local $y0|22 f64)
  (local $hi i32)
  (local $i i32)
  (local $t f64)
  (local $t|26 f64)
  (local $y1|27 f64)
  (local $q|28 i32)
  (local $n i32)
  (local $y0|30 f64)
  (local $y1|31 f64)
  (local $x|32 f64)
  (local $y|33 f64)
  (local $iy i32)
  (local $z|35 f64)
  (local $w|36 f64)
  (local $r|37 f64)
  (local $v f64)
  (local $x|39 f64)
  (local $y|40 f64)
  (local $z|41 f64)
  (local $w|42 f64)
  (local $r|43 f64)
  (local $hz|44 f64)
  local.get $x
  i64.reinterpret_f64
  local.set $u
  local.get $u
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.set $ux
  local.get $ux
  i32.const 31
  i32.shr_u
  local.set $sign
  local.get $ux
  i32.const 2147483647
  i32.and
  local.set $ux
  local.get $ux
  i32.const 1072243195
  i32.le_u
  if
   local.get $ux
   i32.const 1044816030
   i32.lt_u
   if
    f64.const 1
    return
   end
   block $~lib/math/cos_kern|inlined.0 (result f64)
    local.get $x
    local.set $x|4
    f64.const 0
    local.set $y
    local.get $x|4
    local.get $x|4
    f64.mul
    local.set $z
    local.get $z
    local.get $z
    f64.mul
    local.set $w
    local.get $z
    f64.const 0.0416666666666666
    local.get $z
    f64.const -0.001388888888887411
    local.get $z
    f64.const 2.480158728947673e-05
    f64.mul
    f64.add
    f64.mul
    f64.add
    f64.mul
    local.get $w
    local.get $w
    f64.mul
    f64.const -2.7557314351390663e-07
    local.get $z
    f64.const 2.087572321298175e-09
    local.get $z
    f64.const -1.1359647557788195e-11
    f64.mul
    f64.add
    f64.mul
    f64.add
    f64.mul
    f64.add
    local.set $r
    f64.const 0.5
    local.get $z
    f64.mul
    local.set $hz
    f64.const 1
    local.get $hz
    f64.sub
    local.set $w
    local.get $w
    f64.const 1
    local.get $w
    f64.sub
    local.get $hz
    f64.sub
    local.get $z
    local.get $r
    f64.mul
    local.get $x|4
    local.get $y
    f64.mul
    f64.sub
    f64.add
    f64.add
    br $~lib/math/cos_kern|inlined.0
   end
   return
  end
  local.get $ux
  i32.const 2146435072
  i32.ge_u
  if
   local.get $x
   local.get $x
   f64.sub
   return
  end
  block $~lib/math/rempio2|inlined.0 (result i32)
   local.get $x
   local.set $x|10
   local.get $u
   local.set $u|11
   local.get $sign
   local.set $sign|12
   local.get $u|11
   i64.const 32
   i64.shr_u
   i32.wrap_i64
   i32.const 2147483647
   i32.and
   local.set $ix
   i32.const 0
   i32.const 1
   i32.lt_s
   drop
   local.get $ix
   i32.const 1073928572
   i32.lt_u
   if
    i32.const 1
    local.set $q
    local.get $sign|12
    i32.eqz
    if
     local.get $x|10
     f64.const 1.5707963267341256
     f64.sub
     local.set $z|15
     local.get $ix
     i32.const 1073291771
     i32.ne
     if
      local.get $z|15
      f64.const 6.077100506506192e-11
      f64.sub
      local.set $y0
      local.get $z|15
      local.get $y0
      f64.sub
      f64.const 6.077100506506192e-11
      f64.sub
      local.set $y1
     else
      local.get $z|15
      f64.const 6.077100506303966e-11
      f64.sub
      local.set $z|15
      local.get $z|15
      f64.const 2.0222662487959506e-21
      f64.sub
      local.set $y0
      local.get $z|15
      local.get $y0
      f64.sub
      f64.const 2.0222662487959506e-21
      f64.sub
      local.set $y1
     end
    else
     local.get $x|10
     f64.const 1.5707963267341256
     f64.add
     local.set $z|15
     local.get $ix
     i32.const 1073291771
     i32.ne
     if
      local.get $z|15
      f64.const 6.077100506506192e-11
      f64.add
      local.set $y0
      local.get $z|15
      local.get $y0
      f64.sub
      f64.const 6.077100506506192e-11
      f64.add
      local.set $y1
     else
      local.get $z|15
      f64.const 6.077100506303966e-11
      f64.add
      local.set $z|15
      local.get $z|15
      f64.const 2.0222662487959506e-21
      f64.add
      local.set $y0
      local.get $z|15
      local.get $y0
      f64.sub
      f64.const 2.0222662487959506e-21
      f64.add
      local.set $y1
     end
     i32.const -1
     local.set $q
    end
    local.get $y0
    global.set $~lib/math/rempio2_y0
    local.get $y1
    global.set $~lib/math/rempio2_y1
    local.get $q
    br $~lib/math/rempio2|inlined.0
   end
   local.get $ix
   i32.const 1094263291
   i32.lt_u
   if
    local.get $x|10
    f64.const 0.6366197723675814
    f64.mul
    f64.nearest
    local.set $q|18
    local.get $x|10
    local.get $q|18
    f64.const 1.5707963267341256
    f64.mul
    f64.sub
    local.set $r|19
    local.get $q|18
    f64.const 6.077100506506192e-11
    f64.mul
    local.set $w|20
    local.get $ix
    i32.const 20
    i32.shr_u
    local.set $j
    local.get $r|19
    local.get $w|20
    f64.sub
    local.set $y0|22
    local.get $y0|22
    i64.reinterpret_f64
    i64.const 32
    i64.shr_u
    i32.wrap_i64
    local.set $hi
    local.get $j
    local.get $hi
    i32.const 20
    i32.shr_u
    i32.const 2047
    i32.and
    i32.sub
    local.set $i
    local.get $i
    i32.const 16
    i32.gt_u
    if
     local.get $r|19
     local.set $t
     local.get $q|18
     f64.const 6.077100506303966e-11
     f64.mul
     local.set $w|20
     local.get $t
     local.get $w|20
     f64.sub
     local.set $r|19
     local.get $q|18
     f64.const 2.0222662487959506e-21
     f64.mul
     local.get $t
     local.get $r|19
     f64.sub
     local.get $w|20
     f64.sub
     f64.sub
     local.set $w|20
     local.get $r|19
     local.get $w|20
     f64.sub
     local.set $y0|22
     local.get $y0|22
     i64.reinterpret_f64
     i64.const 32
     i64.shr_u
     i32.wrap_i64
     local.set $hi
     local.get $j
     local.get $hi
     i32.const 20
     i32.shr_u
     i32.const 2047
     i32.and
     i32.sub
     local.set $i
     local.get $i
     i32.const 49
     i32.gt_u
     if
      local.get $r|19
      local.set $t|26
      local.get $q|18
      f64.const 2.0222662487111665e-21
      f64.mul
      local.set $w|20
      local.get $t|26
      local.get $w|20
      f64.sub
      local.set $r|19
      local.get $q|18
      f64.const 8.4784276603689e-32
      f64.mul
      local.get $t|26
      local.get $r|19
      f64.sub
      local.get $w|20
      f64.sub
      f64.sub
      local.set $w|20
      local.get $r|19
      local.get $w|20
      f64.sub
      local.set $y0|22
     end
    end
    local.get $r|19
    local.get $y0|22
    f64.sub
    local.get $w|20
    f64.sub
    local.set $y1|27
    local.get $y0|22
    global.set $~lib/math/rempio2_y0
    local.get $y1|27
    global.set $~lib/math/rempio2_y1
    local.get $q|18
    i32.trunc_sat_f64_s
    br $~lib/math/rempio2|inlined.0
   end
   local.get $x|10
   local.get $u|11
   call $~lib/math/pio2_large_quot
   local.set $q|28
   i32.const 0
   local.get $q|28
   i32.sub
   local.get $q|28
   local.get $sign|12
   select
   br $~lib/math/rempio2|inlined.0
  end
  local.set $n
  global.get $~lib/math/rempio2_y0
  local.set $y0|30
  global.get $~lib/math/rempio2_y1
  local.set $y1|31
  local.get $n
  i32.const 1
  i32.and
  if (result f64)
   block $~lib/math/sin_kern|inlined.0 (result f64)
    local.get $y0|30
    local.set $x|32
    local.get $y1|31
    local.set $y|33
    i32.const 1
    local.set $iy
    local.get $x|32
    local.get $x|32
    f64.mul
    local.set $z|35
    local.get $z|35
    local.get $z|35
    f64.mul
    local.set $w|36
    f64.const 0.00833333333332249
    local.get $z|35
    f64.const -1.984126982985795e-04
    local.get $z|35
    f64.const 2.7557313707070068e-06
    f64.mul
    f64.add
    f64.mul
    f64.add
    local.get $z|35
    local.get $w|36
    f64.mul
    f64.const -2.5050760253406863e-08
    local.get $z|35
    f64.const 1.58969099521155e-10
    f64.mul
    f64.add
    f64.mul
    f64.add
    local.set $r|37
    local.get $z|35
    local.get $x|32
    f64.mul
    local.set $v
    local.get $iy
    i32.eqz
    if
     local.get $x|32
     local.get $v
     f64.const -0.16666666666666632
     local.get $z|35
     local.get $r|37
     f64.mul
     f64.add
     f64.mul
     f64.add
     br $~lib/math/sin_kern|inlined.0
    else
     local.get $x|32
     local.get $z|35
     f64.const 0.5
     local.get $y|33
     f64.mul
     local.get $v
     local.get $r|37
     f64.mul
     f64.sub
     f64.mul
     local.get $y|33
     f64.sub
     local.get $v
     f64.const -0.16666666666666632
     f64.mul
     f64.sub
     f64.sub
     br $~lib/math/sin_kern|inlined.0
    end
    unreachable
   end
  else
   block $~lib/math/cos_kern|inlined.1 (result f64)
    local.get $y0|30
    local.set $x|39
    local.get $y1|31
    local.set $y|40
    local.get $x|39
    local.get $x|39
    f64.mul
    local.set $z|41
    local.get $z|41
    local.get $z|41
    f64.mul
    local.set $w|42
    local.get $z|41
    f64.const 0.0416666666666666
    local.get $z|41
    f64.const -0.001388888888887411
    local.get $z|41
    f64.const 2.480158728947673e-05
    f64.mul
    f64.add
    f64.mul
    f64.add
    f64.mul
    local.get $w|42
    local.get $w|42
    f64.mul
    f64.const -2.7557314351390663e-07
    local.get $z|41
    f64.const 2.087572321298175e-09
    local.get $z|41
    f64.const -1.1359647557788195e-11
    f64.mul
    f64.add
    f64.mul
    f64.add
    f64.mul
    f64.add
    local.set $r|43
    f64.const 0.5
    local.get $z|41
    f64.mul
    local.set $hz|44
    f64.const 1
    local.get $hz|44
    f64.sub
    local.set $w|42
    local.get $w|42
    f64.const 1
    local.get $w|42
    f64.sub
    local.get $hz|44
    f64.sub
    local.get $z|41
    local.get $r|43
    f64.mul
    local.get $x|39
    local.get $y|40
    f64.mul
    f64.sub
    f64.add
    f64.add
    br $~lib/math/cos_kern|inlined.1
   end
  end
  local.set $x
  local.get $n
  i32.const 1
  i32.add
  i32.const 2
  i32.and
  if (result f64)
   local.get $x
   f64.neg
  else
   local.get $x
  end
  return
 )
 (func $~lib/math/NativeMath.sin (param $x f64) (result f64)
  (local $u i64)
  (local $ux i32)
  (local $sign i32)
  (local $x|4 f64)
  (local $y f64)
  (local $iy i32)
  (local $z f64)
  (local $w f64)
  (local $r f64)
  (local $v f64)
  (local $x|11 f64)
  (local $u|12 i64)
  (local $sign|13 i32)
  (local $ix i32)
  (local $q i32)
  (local $z|16 f64)
  (local $y0 f64)
  (local $y1 f64)
  (local $q|19 f64)
  (local $r|20 f64)
  (local $w|21 f64)
  (local $j i32)
  (local $y0|23 f64)
  (local $hi i32)
  (local $i i32)
  (local $t f64)
  (local $t|27 f64)
  (local $y1|28 f64)
  (local $q|29 i32)
  (local $n i32)
  (local $y0|31 f64)
  (local $y1|32 f64)
  (local $x|33 f64)
  (local $y|34 f64)
  (local $z|35 f64)
  (local $w|36 f64)
  (local $r|37 f64)
  (local $hz f64)
  (local $x|39 f64)
  (local $y|40 f64)
  (local $iy|41 i32)
  (local $z|42 f64)
  (local $w|43 f64)
  (local $r|44 f64)
  (local $v|45 f64)
  local.get $x
  i64.reinterpret_f64
  local.set $u
  local.get $u
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.set $ux
  local.get $ux
  i32.const 31
  i32.shr_u
  local.set $sign
  local.get $ux
  i32.const 2147483647
  i32.and
  local.set $ux
  local.get $ux
  i32.const 1072243195
  i32.le_u
  if
   local.get $ux
   i32.const 1045430272
   i32.lt_u
   if
    local.get $x
    return
   end
   block $~lib/math/sin_kern|inlined.1 (result f64)
    local.get $x
    local.set $x|4
    f64.const 0
    local.set $y
    i32.const 0
    local.set $iy
    local.get $x|4
    local.get $x|4
    f64.mul
    local.set $z
    local.get $z
    local.get $z
    f64.mul
    local.set $w
    f64.const 0.00833333333332249
    local.get $z
    f64.const -1.984126982985795e-04
    local.get $z
    f64.const 2.7557313707070068e-06
    f64.mul
    f64.add
    f64.mul
    f64.add
    local.get $z
    local.get $w
    f64.mul
    f64.const -2.5050760253406863e-08
    local.get $z
    f64.const 1.58969099521155e-10
    f64.mul
    f64.add
    f64.mul
    f64.add
    local.set $r
    local.get $z
    local.get $x|4
    f64.mul
    local.set $v
    local.get $iy
    i32.eqz
    if
     local.get $x|4
     local.get $v
     f64.const -0.16666666666666632
     local.get $z
     local.get $r
     f64.mul
     f64.add
     f64.mul
     f64.add
     br $~lib/math/sin_kern|inlined.1
    else
     local.get $x|4
     local.get $z
     f64.const 0.5
     local.get $y
     f64.mul
     local.get $v
     local.get $r
     f64.mul
     f64.sub
     f64.mul
     local.get $y
     f64.sub
     local.get $v
     f64.const -0.16666666666666632
     f64.mul
     f64.sub
     f64.sub
     br $~lib/math/sin_kern|inlined.1
    end
    unreachable
   end
   return
  end
  local.get $ux
  i32.const 2146435072
  i32.ge_u
  if
   local.get $x
   local.get $x
   f64.sub
   return
  end
  block $~lib/math/rempio2|inlined.1 (result i32)
   local.get $x
   local.set $x|11
   local.get $u
   local.set $u|12
   local.get $sign
   local.set $sign|13
   local.get $u|12
   i64.const 32
   i64.shr_u
   i32.wrap_i64
   i32.const 2147483647
   i32.and
   local.set $ix
   i32.const 0
   i32.const 1
   i32.lt_s
   drop
   local.get $ix
   i32.const 1073928572
   i32.lt_u
   if
    i32.const 1
    local.set $q
    local.get $sign|13
    i32.eqz
    if
     local.get $x|11
     f64.const 1.5707963267341256
     f64.sub
     local.set $z|16
     local.get $ix
     i32.const 1073291771
     i32.ne
     if
      local.get $z|16
      f64.const 6.077100506506192e-11
      f64.sub
      local.set $y0
      local.get $z|16
      local.get $y0
      f64.sub
      f64.const 6.077100506506192e-11
      f64.sub
      local.set $y1
     else
      local.get $z|16
      f64.const 6.077100506303966e-11
      f64.sub
      local.set $z|16
      local.get $z|16
      f64.const 2.0222662487959506e-21
      f64.sub
      local.set $y0
      local.get $z|16
      local.get $y0
      f64.sub
      f64.const 2.0222662487959506e-21
      f64.sub
      local.set $y1
     end
    else
     local.get $x|11
     f64.const 1.5707963267341256
     f64.add
     local.set $z|16
     local.get $ix
     i32.const 1073291771
     i32.ne
     if
      local.get $z|16
      f64.const 6.077100506506192e-11
      f64.add
      local.set $y0
      local.get $z|16
      local.get $y0
      f64.sub
      f64.const 6.077100506506192e-11
      f64.add
      local.set $y1
     else
      local.get $z|16
      f64.const 6.077100506303966e-11
      f64.add
      local.set $z|16
      local.get $z|16
      f64.const 2.0222662487959506e-21
      f64.add
      local.set $y0
      local.get $z|16
      local.get $y0
      f64.sub
      f64.const 2.0222662487959506e-21
      f64.add
      local.set $y1
     end
     i32.const -1
     local.set $q
    end
    local.get $y0
    global.set $~lib/math/rempio2_y0
    local.get $y1
    global.set $~lib/math/rempio2_y1
    local.get $q
    br $~lib/math/rempio2|inlined.1
   end
   local.get $ix
   i32.const 1094263291
   i32.lt_u
   if
    local.get $x|11
    f64.const 0.6366197723675814
    f64.mul
    f64.nearest
    local.set $q|19
    local.get $x|11
    local.get $q|19
    f64.const 1.5707963267341256
    f64.mul
    f64.sub
    local.set $r|20
    local.get $q|19
    f64.const 6.077100506506192e-11
    f64.mul
    local.set $w|21
    local.get $ix
    i32.const 20
    i32.shr_u
    local.set $j
    local.get $r|20
    local.get $w|21
    f64.sub
    local.set $y0|23
    local.get $y0|23
    i64.reinterpret_f64
    i64.const 32
    i64.shr_u
    i32.wrap_i64
    local.set $hi
    local.get $j
    local.get $hi
    i32.const 20
    i32.shr_u
    i32.const 2047
    i32.and
    i32.sub
    local.set $i
    local.get $i
    i32.const 16
    i32.gt_u
    if
     local.get $r|20
     local.set $t
     local.get $q|19
     f64.const 6.077100506303966e-11
     f64.mul
     local.set $w|21
     local.get $t
     local.get $w|21
     f64.sub
     local.set $r|20
     local.get $q|19
     f64.const 2.0222662487959506e-21
     f64.mul
     local.get $t
     local.get $r|20
     f64.sub
     local.get $w|21
     f64.sub
     f64.sub
     local.set $w|21
     local.get $r|20
     local.get $w|21
     f64.sub
     local.set $y0|23
     local.get $y0|23
     i64.reinterpret_f64
     i64.const 32
     i64.shr_u
     i32.wrap_i64
     local.set $hi
     local.get $j
     local.get $hi
     i32.const 20
     i32.shr_u
     i32.const 2047
     i32.and
     i32.sub
     local.set $i
     local.get $i
     i32.const 49
     i32.gt_u
     if
      local.get $r|20
      local.set $t|27
      local.get $q|19
      f64.const 2.0222662487111665e-21
      f64.mul
      local.set $w|21
      local.get $t|27
      local.get $w|21
      f64.sub
      local.set $r|20
      local.get $q|19
      f64.const 8.4784276603689e-32
      f64.mul
      local.get $t|27
      local.get $r|20
      f64.sub
      local.get $w|21
      f64.sub
      f64.sub
      local.set $w|21
      local.get $r|20
      local.get $w|21
      f64.sub
      local.set $y0|23
     end
    end
    local.get $r|20
    local.get $y0|23
    f64.sub
    local.get $w|21
    f64.sub
    local.set $y1|28
    local.get $y0|23
    global.set $~lib/math/rempio2_y0
    local.get $y1|28
    global.set $~lib/math/rempio2_y1
    local.get $q|19
    i32.trunc_sat_f64_s
    br $~lib/math/rempio2|inlined.1
   end
   local.get $x|11
   local.get $u|12
   call $~lib/math/pio2_large_quot
   local.set $q|29
   i32.const 0
   local.get $q|29
   i32.sub
   local.get $q|29
   local.get $sign|13
   select
   br $~lib/math/rempio2|inlined.1
  end
  local.set $n
  global.get $~lib/math/rempio2_y0
  local.set $y0|31
  global.get $~lib/math/rempio2_y1
  local.set $y1|32
  local.get $n
  i32.const 1
  i32.and
  if (result f64)
   block $~lib/math/cos_kern|inlined.2 (result f64)
    local.get $y0|31
    local.set $x|33
    local.get $y1|32
    local.set $y|34
    local.get $x|33
    local.get $x|33
    f64.mul
    local.set $z|35
    local.get $z|35
    local.get $z|35
    f64.mul
    local.set $w|36
    local.get $z|35
    f64.const 0.0416666666666666
    local.get $z|35
    f64.const -0.001388888888887411
    local.get $z|35
    f64.const 2.480158728947673e-05
    f64.mul
    f64.add
    f64.mul
    f64.add
    f64.mul
    local.get $w|36
    local.get $w|36
    f64.mul
    f64.const -2.7557314351390663e-07
    local.get $z|35
    f64.const 2.087572321298175e-09
    local.get $z|35
    f64.const -1.1359647557788195e-11
    f64.mul
    f64.add
    f64.mul
    f64.add
    f64.mul
    f64.add
    local.set $r|37
    f64.const 0.5
    local.get $z|35
    f64.mul
    local.set $hz
    f64.const 1
    local.get $hz
    f64.sub
    local.set $w|36
    local.get $w|36
    f64.const 1
    local.get $w|36
    f64.sub
    local.get $hz
    f64.sub
    local.get $z|35
    local.get $r|37
    f64.mul
    local.get $x|33
    local.get $y|34
    f64.mul
    f64.sub
    f64.add
    f64.add
    br $~lib/math/cos_kern|inlined.2
   end
  else
   block $~lib/math/sin_kern|inlined.2 (result f64)
    local.get $y0|31
    local.set $x|39
    local.get $y1|32
    local.set $y|40
    i32.const 1
    local.set $iy|41
    local.get $x|39
    local.get $x|39
    f64.mul
    local.set $z|42
    local.get $z|42
    local.get $z|42
    f64.mul
    local.set $w|43
    f64.const 0.00833333333332249
    local.get $z|42
    f64.const -1.984126982985795e-04
    local.get $z|42
    f64.const 2.7557313707070068e-06
    f64.mul
    f64.add
    f64.mul
    f64.add
    local.get $z|42
    local.get $w|43
    f64.mul
    f64.const -2.5050760253406863e-08
    local.get $z|42
    f64.const 1.58969099521155e-10
    f64.mul
    f64.add
    f64.mul
    f64.add
    local.set $r|44
    local.get $z|42
    local.get $x|39
    f64.mul
    local.set $v|45
    local.get $iy|41
    i32.eqz
    if
     local.get $x|39
     local.get $v|45
     f64.const -0.16666666666666632
     local.get $z|42
     local.get $r|44
     f64.mul
     f64.add
     f64.mul
     f64.add
     br $~lib/math/sin_kern|inlined.2
    else
     local.get $x|39
     local.get $z|42
     f64.const 0.5
     local.get $y|40
     f64.mul
     local.get $v|45
     local.get $r|44
     f64.mul
     f64.sub
     f64.mul
     local.get $y|40
     f64.sub
     local.get $v|45
     f64.const -0.16666666666666632
     f64.mul
     f64.sub
     f64.sub
     br $~lib/math/sin_kern|inlined.2
    end
    unreachable
   end
  end
  local.set $x
  local.get $n
  i32.const 2
  i32.and
  if (result f64)
   local.get $x
   f64.neg
  else
   local.get $x
  end
  return
 )
 (func $assembly/index/VesselState#get:u (param $this i32) (result f64)
  local.get $this
  f64.load offset=48
 )
 (func $assembly/index/VesselState#get:v (param $this i32) (result f64)
  local.get $this
  f64.load offset=56
 )
 (func $~lib/math/NativeMath.atan (param $x f64) (result f64)
  (local $ix i32)
  (local $sx f64)
  (local $z f64)
  (local $id i32)
  (local $w f64)
  (local $s1 f64)
  (local $s2 f64)
  (local $s3 f64)
  (local $9 i32)
  local.get $x
  i64.reinterpret_f64
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.set $ix
  local.get $x
  local.set $sx
  local.get $ix
  i32.const 2147483647
  i32.and
  local.set $ix
  local.get $ix
  i32.const 1141899264
  i32.ge_u
  if
   local.get $x
   local.get $x
   f64.ne
   if
    local.get $x
    return
   end
   f64.const 1.5707963267948966
   f32.const 7.52316384526264e-37
   f64.promote_f32
   f64.add
   local.set $z
   local.get $z
   local.get $sx
   f64.copysign
   return
  end
  local.get $ix
  i32.const 1071382528
  i32.lt_u
  if
   local.get $ix
   i32.const 1044381696
   i32.lt_u
   if
    local.get $x
    return
   end
   i32.const -1
   local.set $id
  else
   local.get $x
   f64.abs
   local.set $x
   local.get $ix
   i32.const 1072889856
   i32.lt_u
   if
    local.get $ix
    i32.const 1072037888
    i32.lt_u
    if
     i32.const 0
     local.set $id
     f64.const 2
     local.get $x
     f64.mul
     f64.const 1
     f64.sub
     f64.const 2
     local.get $x
     f64.add
     f64.div
     local.set $x
    else
     i32.const 1
     local.set $id
     local.get $x
     f64.const 1
     f64.sub
     local.get $x
     f64.const 1
     f64.add
     f64.div
     local.set $x
    end
   else
    local.get $ix
    i32.const 1073971200
    i32.lt_u
    if
     i32.const 2
     local.set $id
     local.get $x
     f64.const 1.5
     f64.sub
     f64.const 1
     f64.const 1.5
     local.get $x
     f64.mul
     f64.add
     f64.div
     local.set $x
    else
     i32.const 3
     local.set $id
     f64.const -1
     local.get $x
     f64.div
     local.set $x
    end
   end
  end
  local.get $x
  local.get $x
  f64.mul
  local.set $z
  local.get $z
  local.get $z
  f64.mul
  local.set $w
  local.get $z
  f64.const 0.3333333333333293
  local.get $w
  f64.const 0.14285714272503466
  local.get $w
  f64.const 0.09090887133436507
  local.get $w
  f64.const 0.06661073137387531
  local.get $w
  f64.const 0.049768779946159324
  local.get $w
  f64.const 0.016285820115365782
  f64.mul
  f64.add
  f64.mul
  f64.add
  f64.mul
  f64.add
  f64.mul
  f64.add
  f64.mul
  f64.add
  f64.mul
  local.set $s1
  local.get $w
  f64.const -0.19999999999876483
  local.get $w
  f64.const -0.11111110405462356
  local.get $w
  f64.const -0.0769187620504483
  local.get $w
  f64.const -0.058335701337905735
  local.get $w
  f64.const -0.036531572744216916
  f64.mul
  f64.add
  f64.mul
  f64.add
  f64.mul
  f64.add
  f64.mul
  f64.add
  f64.mul
  local.set $s2
  local.get $x
  local.get $s1
  local.get $s2
  f64.add
  f64.mul
  local.set $s3
  local.get $id
  i32.const 0
  i32.lt_s
  if
   local.get $x
   local.get $s3
   f64.sub
   return
  end
  block $break|0
   block $case4|0
    block $case3|0
     block $case2|0
      block $case1|0
       block $case0|0
        local.get $id
        local.set $9
        local.get $9
        i32.const 0
        i32.eq
        br_if $case0|0
        local.get $9
        i32.const 1
        i32.eq
        br_if $case1|0
        local.get $9
        i32.const 2
        i32.eq
        br_if $case2|0
        local.get $9
        i32.const 3
        i32.eq
        br_if $case3|0
        br $case4|0
       end
       f64.const 0.4636476090008061
       local.get $s3
       f64.const 2.2698777452961687e-17
       f64.sub
       local.get $x
       f64.sub
       f64.sub
       local.set $z
       br $break|0
      end
      f64.const 0.7853981633974483
      local.get $s3
      f64.const 3.061616997868383e-17
      f64.sub
      local.get $x
      f64.sub
      f64.sub
      local.set $z
      br $break|0
     end
     f64.const 0.982793723247329
     local.get $s3
     f64.const 1.3903311031230998e-17
     f64.sub
     local.get $x
     f64.sub
     f64.sub
     local.set $z
     br $break|0
    end
    f64.const 1.5707963267948966
    local.get $s3
    f64.const 6.123233995736766e-17
    f64.sub
    local.get $x
    f64.sub
    f64.sub
    local.set $z
    br $break|0
   end
   unreachable
  end
  local.get $z
  local.get $sx
  f64.copysign
  return
 )
 (func $~lib/math/NativeMath.atan2 (param $y f64) (param $x f64) (result f64)
  (local $u i64)
  (local $ix i32)
  (local $lx i32)
  (local $iy i32)
  (local $ly i32)
  (local $m i32)
  (local $8 i32)
  (local $t f64)
  (local $t|10 f64)
  (local $z f64)
  (local $12 i32)
  local.get $x
  local.get $x
  f64.ne
  if (result i32)
   i32.const 1
  else
   local.get $y
   local.get $y
   f64.ne
  end
  if
   local.get $x
   local.get $y
   f64.add
   return
  end
  local.get $x
  i64.reinterpret_f64
  local.set $u
  local.get $u
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.set $ix
  local.get $u
  i32.wrap_i64
  local.set $lx
  local.get $y
  i64.reinterpret_f64
  local.set $u
  local.get $u
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.set $iy
  local.get $u
  i32.wrap_i64
  local.set $ly
  local.get $ix
  i32.const 1072693248
  i32.sub
  local.get $lx
  i32.or
  i32.const 0
  i32.eq
  if
   local.get $y
   call $~lib/math/NativeMath.atan
   return
  end
  local.get $iy
  i32.const 31
  i32.shr_u
  i32.const 1
  i32.and
  local.get $ix
  i32.const 30
  i32.shr_u
  i32.const 2
  i32.and
  i32.or
  local.set $m
  local.get $ix
  i32.const 2147483647
  i32.and
  local.set $ix
  local.get $iy
  i32.const 2147483647
  i32.and
  local.set $iy
  local.get $iy
  local.get $ly
  i32.or
  i32.const 0
  i32.eq
  if
   block $break|0
    block $case3|0
     block $case2|0
      block $case1|0
       block $case0|0
        local.get $m
        local.set $8
        local.get $8
        i32.const 0
        i32.eq
        br_if $case0|0
        local.get $8
        i32.const 1
        i32.eq
        br_if $case1|0
        local.get $8
        i32.const 2
        i32.eq
        br_if $case2|0
        local.get $8
        i32.const 3
        i32.eq
        br_if $case3|0
        br $break|0
       end
      end
      local.get $y
      return
     end
     global.get $~lib/math/NativeMath.PI
     return
    end
    global.get $~lib/math/NativeMath.PI
    f64.neg
    return
   end
  end
  local.get $ix
  local.get $lx
  i32.or
  i32.const 0
  i32.eq
  if
   local.get $m
   i32.const 1
   i32.and
   if (result f64)
    global.get $~lib/math/NativeMath.PI
    f64.neg
    f64.const 2
    f64.div
   else
    global.get $~lib/math/NativeMath.PI
    f64.const 2
    f64.div
   end
   return
  end
  local.get $ix
  i32.const 2146435072
  i32.eq
  if
   local.get $iy
   i32.const 2146435072
   i32.eq
   if
    local.get $m
    i32.const 2
    i32.and
    if (result f64)
     i32.const 3
     f64.convert_i32_s
     global.get $~lib/math/NativeMath.PI
     f64.mul
     f64.const 4
     f64.div
    else
     global.get $~lib/math/NativeMath.PI
     f64.const 4
     f64.div
    end
    local.set $t
    local.get $m
    i32.const 1
    i32.and
    if (result f64)
     local.get $t
     f64.neg
    else
     local.get $t
    end
    return
   else
    local.get $m
    i32.const 2
    i32.and
    if (result f64)
     global.get $~lib/math/NativeMath.PI
    else
     f64.const 0
    end
    local.set $t|10
    local.get $m
    i32.const 1
    i32.and
    if (result f64)
     local.get $t|10
     f64.neg
    else
     local.get $t|10
    end
    return
   end
   unreachable
  end
  local.get $ix
  i32.const 64
  i32.const 20
  i32.shl
  i32.add
  local.get $iy
  i32.lt_u
  if (result i32)
   i32.const 1
  else
   local.get $iy
   i32.const 2146435072
   i32.eq
  end
  if
   local.get $m
   i32.const 1
   i32.and
   if (result f64)
    global.get $~lib/math/NativeMath.PI
    f64.neg
    f64.const 2
    f64.div
   else
    global.get $~lib/math/NativeMath.PI
    f64.const 2
    f64.div
   end
   return
  end
  local.get $m
  i32.const 2
  i32.and
  if (result i32)
   local.get $iy
   i32.const 64
   i32.const 20
   i32.shl
   i32.add
   local.get $ix
   i32.lt_u
  else
   i32.const 0
  end
  if
   f64.const 0
   local.set $z
  else
   local.get $y
   local.get $x
   f64.div
   f64.abs
   call $~lib/math/NativeMath.atan
   local.set $z
  end
  block $break|1
   block $case3|1
    block $case2|1
     block $case1|1
      block $case0|1
       local.get $m
       local.set $12
       local.get $12
       i32.const 0
       i32.eq
       br_if $case0|1
       local.get $12
       i32.const 1
       i32.eq
       br_if $case1|1
       local.get $12
       i32.const 2
       i32.eq
       br_if $case2|1
       local.get $12
       i32.const 3
       i32.eq
       br_if $case3|1
       br $break|1
      end
      local.get $z
      return
     end
     local.get $z
     f64.neg
     return
    end
    global.get $~lib/math/NativeMath.PI
    local.get $z
    f64.const 1.2246467991473532e-16
    f64.sub
    f64.sub
    return
   end
   local.get $z
   f64.const 1.2246467991473532e-16
   f64.sub
   global.get $~lib/math/NativeMath.PI
   f64.sub
   return
  end
  unreachable
 )
 (func $assembly/index/VesselState#get:r (param $this i32) (result f64)
  local.get $this
  f64.load offset=72
 )
 (func $assembly/index/VesselState#get:waveTime (param $this i32) (result f64)
  local.get $this
  f64.load offset=464
 )
 (func $assembly/index/VesselState#get:x (param $this i32) (result f64)
  local.get $this
  f64.load
 )
 (func $assembly/index/VesselState#get:y (param $this i32) (result f64)
  local.get $this
  f64.load offset=8
 )
 (func $assembly/index/VesselState#get:z (param $this i32) (result f64)
  local.get $this
  f64.load offset=16
 )
 (func $assembly/index/VesselState#get:w (param $this i32) (result f64)
  local.get $this
  f64.load offset=64
 )
 (func $assembly/index/VesselState#get:rollAngle (param $this i32) (result f64)
  local.get $this
  f64.load offset=24
 )
 (func $assembly/index/VesselState#get:pitchAngle (param $this i32) (result f64)
  local.get $this
  f64.load offset=32
 )
 (func $assembly/index/VesselState#get:p (param $this i32) (result f64)
  local.get $this
  f64.load offset=80
 )
 (func $assembly/index/VesselState#get:q (param $this i32) (result f64)
  local.get $this
  f64.load offset=88
 )
 (func $~lib/math/NativeMath.mod (param $x f64) (param $y f64) (result f64)
  (local $ux i64)
  (local $uy i64)
  (local $ex i64)
  (local $ey i64)
  (local $sx i64)
  (local $uy1 i64)
  (local $m f64)
  (local $ux1 i64)
  (local $shift i64)
  local.get $y
  f64.abs
  f64.const 1
  f64.eq
  if
   local.get $x
   local.get $x
   f64.trunc
   f64.sub
   local.get $x
   f64.copysign
   return
  end
  local.get $x
  i64.reinterpret_f64
  local.set $ux
  local.get $y
  i64.reinterpret_f64
  local.set $uy
  local.get $ux
  i64.const 52
  i64.shr_u
  i64.const 2047
  i64.and
  local.set $ex
  local.get $uy
  i64.const 52
  i64.shr_u
  i64.const 2047
  i64.and
  local.set $ey
  local.get $ux
  i64.const 63
  i64.shr_u
  local.set $sx
  local.get $uy
  i64.const 1
  i64.shl
  local.set $uy1
  local.get $uy1
  i64.const 0
  i64.eq
  if (result i32)
   i32.const 1
  else
   local.get $ex
   i64.const 2047
   i64.eq
  end
  if (result i32)
   i32.const 1
  else
   local.get $y
   local.get $y
   f64.ne
  end
  if
   local.get $x
   local.get $y
   f64.mul
   local.set $m
   local.get $m
   local.get $m
   f64.div
   return
  end
  local.get $ux
  i64.const 1
  i64.shl
  local.set $ux1
  local.get $ux1
  local.get $uy1
  i64.le_u
  if
   local.get $x
   local.get $ux1
   local.get $uy1
   i64.ne
   f64.convert_i32_u
   f64.mul
   return
  end
  local.get $ex
  i64.const 0
  i64.ne
  i32.eqz
  if
   local.get $ex
   local.get $ux
   i64.const 12
   i64.shl
   i64.clz
   i64.sub
   local.set $ex
   local.get $ux
   i64.const 1
   local.get $ex
   i64.sub
   i64.shl
   local.set $ux
  else
   local.get $ux
   i64.const -1
   i64.const 12
   i64.shr_u
   i64.and
   local.set $ux
   local.get $ux
   i64.const 1
   i64.const 52
   i64.shl
   i64.or
   local.set $ux
  end
  local.get $ey
  i64.const 0
  i64.ne
  i32.eqz
  if
   local.get $ey
   local.get $uy
   i64.const 12
   i64.shl
   i64.clz
   i64.sub
   local.set $ey
   local.get $uy
   i64.const 1
   local.get $ey
   i64.sub
   i64.shl
   local.set $uy
  else
   local.get $uy
   i64.const -1
   i64.const 12
   i64.shr_u
   i64.and
   local.set $uy
   local.get $uy
   i64.const 1
   i64.const 52
   i64.shl
   i64.or
   local.set $uy
  end
  loop $while-continue|0
   local.get $ex
   local.get $ey
   i64.gt_s
   if
    local.get $ux
    local.get $uy
    i64.ge_u
    if
     local.get $ux
     local.get $uy
     i64.eq
     if
      f64.const 0
      local.get $x
      f64.mul
      return
     end
     local.get $ux
     local.get $uy
     i64.sub
     local.set $ux
    end
    local.get $ux
    i64.const 1
    i64.shl
    local.set $ux
    local.get $ex
    i64.const 1
    i64.sub
    local.set $ex
    br $while-continue|0
   end
  end
  local.get $ux
  local.get $uy
  i64.ge_u
  if
   local.get $ux
   local.get $uy
   i64.eq
   if
    f64.const 0
    local.get $x
    f64.mul
    return
   end
   local.get $ux
   local.get $uy
   i64.sub
   local.set $ux
  end
  local.get $ux
  i64.const 11
  i64.shl
  i64.clz
  local.set $shift
  local.get $ex
  local.get $shift
  i64.sub
  local.set $ex
  local.get $ux
  local.get $shift
  i64.shl
  local.set $ux
  local.get $ex
  i64.const 0
  i64.gt_s
  if
   local.get $ux
   i64.const 1
   i64.const 52
   i64.shl
   i64.sub
   local.set $ux
   local.get $ux
   local.get $ex
   i64.const 52
   i64.shl
   i64.or
   local.set $ux
  else
   local.get $ux
   i64.const 0
   local.get $ex
   i64.sub
   i64.const 1
   i64.add
   i64.shr_u
   local.set $ux
  end
  local.get $ux
  local.get $sx
  i64.const 63
  i64.shl
  i64.or
  f64.reinterpret_i64
  return
 )
 (func $assembly/index/normalizeAngle (param $angle f64) (result f64)
  (local $a f64)
  local.get $angle
  f64.const 2
  global.get $~lib/math/NativeMath.PI
  f64.mul
  call $~lib/math/NativeMath.mod
  local.set $a
  local.get $a
  f64.const 0
  f64.lt
  if
   local.get $a
   f64.const 2
   global.get $~lib/math/NativeMath.PI
   f64.mul
   f64.add
   local.set $a
  end
  local.get $a
  return
 )
 (func $assembly/index/updateVesselState (param $vesselPtr i32) (param $dt f64) (param $windSpeed f64) (param $windDirection f64) (param $currentSpeed f64) (param $currentDirection f64) (param $waveHeight f64) (param $waveLength f64) (param $waveDirection f64) (param $waveSteepness f64) (result i32)
  (local $vessel i32)
  (local $safeDt f64)
  (local $ballastFactor f64)
  (local $effectiveMass f64)
  (local $throttleCommand f64)
  (local $engineTau f64)
  (local $rudderDelta f64)
  (local $x f64)
  (local $maxRudderStep f64)
  (local $x|19 f64)
  (local $hasFuel i32)
  (local $throttle f64)
  (local $thrust f64)
  (local $x|23 f64)
  (local $fuelBurn f64)
  (local $relCurrentDir f64)
  (local $currentSurge f64)
  (local $currentSway f64)
  (local $uRel f64)
  (local $vRel f64)
  (local $waterDepth f64)
  (local $depthRatio f64)
  (local $shallowT f64)
  (local $clampedRatio f64)
  (local $shallowFactor f64)
  (local $shallowYawFactor f64)
  (local $shallowRudderFactor f64)
  (local $hullFactor f64)
  (local $value1 f64)
  (local $value2 f64)
  (local $areaX f64)
  (local $value1|41 f64)
  (local $value2|42 f64)
  (local $areaY f64)
  (local $x|44 f64)
  (local $dragSurge f64)
  (local $x|46 f64)
  (local $dragSway f64)
  (local $swayLinear f64)
  (local $x|49 f64)
  (local $flowSpeed f64)
  (local $x|51 f64)
  (local $x|52 f64)
  (local $washSpeed f64)
  (local $x|54 f64)
  (local $inflowSpeed f64)
  (local $value1|56 f64)
  (local $value2|57 f64)
  (local $inflowAngle f64)
  (local $alpha f64)
  (local $x|60 f64)
  (local $absAlpha f64)
  (local $stallRatio f64)
  (local $stallFactor f64)
  (local $value1|64 f64)
  (local $value2|65 f64)
  (local $liftCoeff f64)
  (local $rudderForce f64)
  (local $rudderSway f64)
  (local $rudderMoment f64)
  (local $hullSway f64)
  (local $hullYaw f64)
  (local $windYaw f64)
  (local $mass f64)
  (local $value1|74 f64)
  (local $value2|75 f64)
  (local $massX f64)
  (local $value1|77 f64)
  (local $value2|78 f64)
  (local $massY f64)
  (local $value1|80 f64)
  (local $value2|81 f64)
  (local $Izz f64)
  (local $Ixx f64)
  (local $Iyy f64)
  (local $X f64)
  (local $Y f64)
  (local $x|87 f64)
  (local $N f64)
  (local $uDot f64)
  (local $vDot f64)
  (local $rDot f64)
  (local $value1|92 f64)
  (local $value2|93 f64)
  (local $fallbackWaveHeight f64)
  (local $waveH f64)
  (local $waveAmp f64)
  (local $value1|97 f64)
  (local $value2|98 f64)
  (local $waveLen f64)
  (local $waveDir f64)
  (local $k f64)
  (local $x|102 f64)
  (local $omega f64)
  (local $value1|104 f64)
  (local $value2|105 f64)
  (local $steep f64)
  (local $dirX f64)
  (local $dirY f64)
  (local $phase f64)
  (local $sinPhase f64)
  (local $cosPhase f64)
  (local $waveElevation f64)
  (local $slope f64)
  (local $waveSlopeX f64)
  (local $waveSlopeY f64)
  (local $neutralDraft f64)
  (local $targetDraft f64)
  (local $targetZ f64)
  (local $heaveAccel f64)
  (local $waveSlopeRoll f64)
  (local $waveSlopePitch f64)
  (local $gmRoll f64)
  (local $gmPitch f64)
  (local $rollRestoring f64)
  (local $pitchRestoring f64)
  (local $pDot f64)
  (local $qDot f64)
  (local $speedCap f64)
  (local $cosPsi f64)
  (local $sinPsi f64)
  (local $worldU f64)
  (local $worldV f64)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  local.set $vessel
  local.get $dt
  f64.const 0
  f64.lt
  if (result f64)
   f64.const 0
  else
   local.get $dt
   f64.const 0.25
   f64.gt
   if (result f64)
    f64.const 0.25
   else
    local.get $dt
   end
  end
  local.set $safeDt
  local.get $vessel
  call $assembly/index/VesselState#get:ballast
  call $assembly/index/clamp01
  local.set $ballastFactor
  local.get $vessel
  call $assembly/index/VesselState#get:mass
  f64.const 0.9
  local.get $ballastFactor
  f64.const 0.4
  f64.mul
  f64.add
  f64.mul
  local.set $effectiveMass
  local.get $vessel
  call $assembly/index/VesselState#get:throttleCommand
  f64.const 1
  call $assembly/index/clampSigned
  local.set $throttleCommand
  local.get $vessel
  call $assembly/index/VesselState#get:engineTimeConstant
  f64.const 0.05
  f64.gt
  if (result f64)
   local.get $vessel
   call $assembly/index/VesselState#get:engineTimeConstant
  else
   f64.const 0.05
  end
  local.set $engineTau
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:throttle
  local.get $throttleCommand
  local.get $vessel
  call $assembly/index/VesselState#get:throttle
  f64.sub
  local.get $engineTau
  f64.div
  local.get $safeDt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:throttle
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:throttle
  f64.const 1
  call $assembly/index/clampSigned
  call $assembly/index/VesselState#set:throttle
  local.get $vessel
  call $assembly/index/VesselState#get:rudderCommand
  local.get $vessel
  call $assembly/index/VesselState#get:rudderAngle
  f64.sub
  local.set $rudderDelta
  local.get $vessel
  call $assembly/index/VesselState#get:rudderRateLimit
  f64.const 0
  f64.gt
  if (result f64)
   local.get $vessel
   call $assembly/index/VesselState#get:rudderRateLimit
   local.get $safeDt
   f64.mul
  else
   block $~lib/math/NativeMath.abs|inlined.0 (result f64)
    local.get $rudderDelta
    local.set $x
    local.get $x
    f64.abs
    br $~lib/math/NativeMath.abs|inlined.0
   end
  end
  local.set $maxRudderStep
  block $~lib/math/NativeMath.abs|inlined.1 (result f64)
   local.get $rudderDelta
   local.set $x|19
   local.get $x|19
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.1
  end
  local.get $maxRudderStep
  f64.le
  if
   local.get $vessel
   local.get $vessel
   call $assembly/index/VesselState#get:rudderCommand
   call $assembly/index/VesselState#set:rudderAngle
  else
   local.get $vessel
   local.get $vessel
   call $assembly/index/VesselState#get:rudderAngle
   local.get $rudderDelta
   f64.const 0
   f64.gt
   if (result f64)
    local.get $maxRudderStep
   else
    local.get $maxRudderStep
    f64.neg
   end
   f64.add
   call $assembly/index/VesselState#set:rudderAngle
  end
  local.get $vessel
  call $assembly/index/VesselState#get:fuelLevel
  f64.const 0
  f64.gt
  local.set $hasFuel
  local.get $hasFuel
  if (result f64)
   local.get $vessel
   call $assembly/index/VesselState#get:throttle
  else
   f64.const 0
  end
  local.set $throttle
  local.get $vessel
  call $assembly/index/VesselState#get:maxThrust
  local.get $throttle
  f64.mul
  local.set $thrust
  block $~lib/math/NativeMath.abs|inlined.2 (result f64)
   local.get $throttle
   local.set $x|23
   local.get $x|23
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.2
  end
  local.get $vessel
  call $assembly/index/VesselState#get:fuelConsumptionRate
  f64.mul
  local.get $safeDt
  f64.mul
  local.set $fuelBurn
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:fuelLevel
  local.get $fuelBurn
  f64.sub
  call $assembly/index/clamp01
  call $assembly/index/VesselState#set:fuelLevel
  local.get $vessel
  local.get $safeDt
  f64.const 0
  f64.gt
  if (result f64)
   local.get $fuelBurn
   local.get $safeDt
   f64.div
   f64.const 3600
   f64.mul
  else
   f64.const 0
  end
  call $assembly/index/VesselState#set:lastFuelConsumption
  local.get $currentDirection
  local.get $vessel
  call $assembly/index/VesselState#get:psi
  f64.sub
  local.set $relCurrentDir
  local.get $currentSpeed
  local.get $relCurrentDir
  call $~lib/math/NativeMath.cos
  f64.mul
  local.set $currentSurge
  local.get $currentSpeed
  local.get $relCurrentDir
  call $~lib/math/NativeMath.sin
  f64.mul
  local.set $currentSway
  local.get $vessel
  call $assembly/index/VesselState#get:u
  local.get $currentSurge
  f64.sub
  local.set $uRel
  local.get $vessel
  call $assembly/index/VesselState#get:v
  local.get $currentSway
  f64.sub
  local.set $vRel
  global.get $assembly/index/globalEnvironment
  call $assembly/index/EnvironmentState#get:waterDepth
  local.set $waterDepth
  local.get $waterDepth
  f64.const 0
  f64.gt
  if (result f64)
   local.get $waterDepth
   local.get $vessel
   call $assembly/index/VesselState#get:draft
   f64.const 0.01
   f64.add
   f64.div
  else
   global.get $assembly/index/SHALLOW_WATER_MAX_RATIO
   f64.const 1
   f64.add
  end
  local.set $depthRatio
  f64.const 0
  local.set $shallowT
  local.get $depthRatio
  f64.const 0
  f64.gt
  if (result i32)
   local.get $depthRatio
   global.get $assembly/index/SHALLOW_WATER_MAX_RATIO
   f64.lt
  else
   i32.const 0
  end
  if
   local.get $depthRatio
   global.get $assembly/index/SHALLOW_WATER_MIN_RATIO
   f64.lt
   if (result f64)
    global.get $assembly/index/SHALLOW_WATER_MIN_RATIO
   else
    local.get $depthRatio
   end
   local.set $clampedRatio
   global.get $assembly/index/SHALLOW_WATER_MAX_RATIO
   local.get $clampedRatio
   f64.sub
   global.get $assembly/index/SHALLOW_WATER_MAX_RATIO
   global.get $assembly/index/SHALLOW_WATER_MIN_RATIO
   f64.sub
   f64.div
   local.set $shallowT
  end
  f64.const 1
  local.get $vessel
  call $assembly/index/VesselState#get:shallowWaterFactor
  local.get $shallowT
  f64.mul
  f64.add
  local.set $shallowFactor
  f64.const 1
  local.get $vessel
  call $assembly/index/VesselState#get:shallowWaterYawFactor
  local.get $shallowT
  f64.mul
  f64.add
  local.set $shallowYawFactor
  f64.const 1
  f64.const 1
  local.get $vessel
  call $assembly/index/VesselState#get:shallowWaterRudderFactor
  f64.sub
  local.get $shallowT
  f64.mul
  f64.sub
  local.set $shallowRudderFactor
  f64.const 0.7
  local.get $vessel
  call $assembly/index/VesselState#get:blockCoefficient
  f64.const 0.6
  f64.mul
  f64.add
  local.set $hullFactor
  block $~lib/math/NativeMath.max|inlined.1 (result f64)
   f64.const 1
   local.set $value1
   local.get $vessel
   call $assembly/index/VesselState#get:length
   local.get $vessel
   call $assembly/index/VesselState#get:draft
   f64.mul
   local.get $hullFactor
   f64.mul
   local.set $value2
   local.get $value1
   local.get $value2
   f64.max
   br $~lib/math/NativeMath.max|inlined.1
  end
  local.set $areaX
  block $~lib/math/NativeMath.max|inlined.2 (result f64)
   f64.const 1
   local.set $value1|41
   local.get $vessel
   call $assembly/index/VesselState#get:beam
   local.get $vessel
   call $assembly/index/VesselState#get:draft
   f64.mul
   f64.const 0.7
   local.get $vessel
   call $assembly/index/VesselState#get:blockCoefficient
   f64.const 0.3
   f64.mul
   f64.add
   f64.mul
   local.set $value2|42
   local.get $value1|41
   local.get $value2|42
   f64.max
   br $~lib/math/NativeMath.max|inlined.2
  end
  local.set $areaY
  f64.const 0.5
  global.get $assembly/index/WATER_DENSITY
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:cdSurge
  f64.mul
  local.get $areaX
  f64.mul
  local.get $uRel
  f64.mul
  block $~lib/math/NativeMath.abs|inlined.3 (result f64)
   local.get $uRel
   local.set $x|44
   local.get $x|44
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.3
  end
  f64.mul
  local.get $shallowFactor
  f64.mul
  local.set $dragSurge
  f64.const 0.5
  global.get $assembly/index/WATER_DENSITY
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:cdSway
  f64.mul
  local.get $areaY
  f64.mul
  local.get $vRel
  f64.mul
  block $~lib/math/NativeMath.abs|inlined.4 (result f64)
   local.get $vRel
   local.set $x|46
   local.get $x|46
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.4
  end
  f64.mul
  local.get $shallowFactor
  f64.mul
  local.set $dragSway
  local.get $vessel
  call $assembly/index/VesselState#get:swayDamping
  local.get $vRel
  f64.mul
  local.set $swayLinear
  block $~lib/math/NativeMath.sqrt|inlined.0 (result f64)
   local.get $uRel
   local.get $uRel
   f64.mul
   local.get $vRel
   local.get $vRel
   f64.mul
   f64.add
   local.set $x|49
   local.get $x|49
   f64.sqrt
   br $~lib/math/NativeMath.sqrt|inlined.0
  end
  local.set $flowSpeed
  local.get $vessel
  call $assembly/index/VesselState#get:propWashFactor
  f64.const 0
  f64.gt
  if (result f64)
   block $~lib/math/NativeMath.sqrt|inlined.1 (result f64)
    block $~lib/math/NativeMath.abs|inlined.5 (result f64)
     local.get $thrust
     local.set $x|51
     local.get $x|51
     f64.abs
     br $~lib/math/NativeMath.abs|inlined.5
    end
    f64.const 0.5
    global.get $assembly/index/WATER_DENSITY
    f64.mul
    local.get $vessel
    call $assembly/index/VesselState#get:rudderArea
    f64.mul
    f64.const 1e-06
    f64.add
    f64.div
    local.set $x|52
    local.get $x|52
    f64.sqrt
    br $~lib/math/NativeMath.sqrt|inlined.1
   end
   local.get $vessel
   call $assembly/index/VesselState#get:propWashFactor
   f64.mul
  else
   f64.const 0
  end
  local.set $washSpeed
  block $~lib/math/NativeMath.sqrt|inlined.2 (result f64)
   local.get $flowSpeed
   local.get $flowSpeed
   f64.mul
   local.get $washSpeed
   local.get $washSpeed
   f64.mul
   f64.add
   local.set $x|54
   local.get $x|54
   f64.sqrt
   br $~lib/math/NativeMath.sqrt|inlined.2
  end
  local.set $inflowSpeed
  local.get $vRel
  block $~lib/math/NativeMath.max|inlined.3 (result f64)
   f64.const 0.1
   local.set $value1|56
   local.get $uRel
   local.set $value2|57
   local.get $value1|56
   local.get $value2|57
   f64.max
   br $~lib/math/NativeMath.max|inlined.3
  end
  call $~lib/math/NativeMath.atan2
  local.set $inflowAngle
  local.get $vessel
  call $assembly/index/VesselState#get:rudderAngle
  local.get $inflowAngle
  f64.sub
  local.set $alpha
  block $~lib/math/NativeMath.abs|inlined.6 (result f64)
   local.get $alpha
   local.set $x|60
   local.get $x|60
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.6
  end
  local.set $absAlpha
  local.get $vessel
  call $assembly/index/VesselState#get:rudderStallAngle
  f64.const 0
  f64.gt
  if (result f64)
   local.get $absAlpha
   local.get $vessel
   call $assembly/index/VesselState#get:rudderStallAngle
   f64.div
  else
   f64.const 1
  end
  local.set $stallRatio
  local.get $stallRatio
  f64.const 1
  f64.ge
  if (result f64)
   f64.const 0
  else
   f64.const 1
   local.get $stallRatio
   local.get $stallRatio
   f64.mul
   f64.sub
  end
  local.set $stallFactor
  local.get $vessel
  call $assembly/index/VesselState#get:rudderLiftSlope
  local.get $alpha
  f64.mul
  block $~lib/math/NativeMath.max|inlined.4 (result f64)
   f64.const 0
   local.set $value1|64
   local.get $stallFactor
   local.set $value2|65
   local.get $value1|64
   local.get $value2|65
   f64.max
   br $~lib/math/NativeMath.max|inlined.4
  end
  f64.mul
  local.set $liftCoeff
  f64.const 0.5
  global.get $assembly/index/WATER_DENSITY
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:rudderArea
  f64.mul
  local.get $inflowSpeed
  f64.mul
  local.get $inflowSpeed
  f64.mul
  local.get $liftCoeff
  f64.mul
  local.set $rudderForce
  local.get $rudderForce
  local.get $shallowRudderFactor
  f64.mul
  local.set $rudderSway
  local.get $rudderSway
  local.get $vessel
  call $assembly/index/VesselState#get:rudderArm
  f64.mul
  local.set $rudderMoment
  local.get $vessel
  call $assembly/index/VesselState#get:hullYv
  local.get $vRel
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:hullYr
  local.get $vessel
  call $assembly/index/VesselState#get:r
  f64.mul
  f64.add
  f64.neg
  local.set $hullSway
  local.get $vessel
  call $assembly/index/VesselState#get:hullNv
  local.get $vRel
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:hullNr
  local.get $vessel
  call $assembly/index/VesselState#get:r
  f64.mul
  f64.add
  f64.neg
  local.set $hullYaw
  local.get $windSpeed
  local.get $windSpeed
  f64.mul
  f64.const 0.01
  f64.mul
  local.get $windDirection
  local.get $vessel
  call $assembly/index/VesselState#get:psi
  f64.sub
  call $~lib/math/NativeMath.sin
  f64.mul
  local.set $windYaw
  local.get $effectiveMass
  local.set $mass
  block $~lib/math/NativeMath.max|inlined.5 (result f64)
   f64.const 1
   local.set $value1|74
   local.get $mass
   local.get $vessel
   call $assembly/index/VesselState#get:addedMassX
   f64.add
   local.set $value2|75
   local.get $value1|74
   local.get $value2|75
   f64.max
   br $~lib/math/NativeMath.max|inlined.5
  end
  local.set $massX
  block $~lib/math/NativeMath.max|inlined.6 (result f64)
   f64.const 1
   local.set $value1|77
   local.get $mass
   local.get $vessel
   call $assembly/index/VesselState#get:addedMassY
   f64.add
   local.set $value2|78
   local.get $value1|77
   local.get $value2|78
   f64.max
   br $~lib/math/NativeMath.max|inlined.6
  end
  local.set $massY
  block $~lib/math/NativeMath.max|inlined.7 (result f64)
   f64.const 1
   local.set $value1|80
   local.get $mass
   local.get $vessel
   call $assembly/index/VesselState#get:length
   f64.mul
   local.get $vessel
   call $assembly/index/VesselState#get:length
   f64.mul
   f64.const 0.1
   f64.mul
   local.get $vessel
   call $assembly/index/VesselState#get:addedMassYaw
   f64.add
   local.set $value2|81
   local.get $value1|80
   local.get $value2|81
   f64.max
   br $~lib/math/NativeMath.max|inlined.7
  end
  local.set $Izz
  local.get $mass
  local.get $vessel
  call $assembly/index/VesselState#get:beam
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:beam
  f64.mul
  f64.const 0.08
  f64.mul
  local.set $Ixx
  local.get $mass
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.mul
  f64.const 0.08
  f64.mul
  local.set $Iyy
  local.get $thrust
  local.get $dragSurge
  f64.sub
  local.set $X
  local.get $dragSway
  f64.neg
  local.get $swayLinear
  f64.sub
  local.get $rudderSway
  f64.add
  local.get $hullSway
  f64.add
  local.set $Y
  local.get $rudderMoment
  local.get $hullYaw
  f64.add
  local.get $windYaw
  f64.sub
  local.get $vessel
  call $assembly/index/VesselState#get:yawDamping
  local.get $vessel
  call $assembly/index/VesselState#get:r
  f64.mul
  local.get $shallowYawFactor
  f64.mul
  f64.sub
  local.get $vessel
  call $assembly/index/VesselState#get:yawDampingQuad
  local.get $vessel
  call $assembly/index/VesselState#get:r
  f64.mul
  block $~lib/math/NativeMath.abs|inlined.7 (result f64)
   local.get $vessel
   call $assembly/index/VesselState#get:r
   local.set $x|87
   local.get $x|87
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.7
  end
  f64.mul
  local.get $shallowYawFactor
  f64.mul
  f64.sub
  local.set $N
  local.get $X
  local.get $massX
  f64.div
  local.get $vessel
  call $assembly/index/VesselState#get:v
  local.get $vessel
  call $assembly/index/VesselState#get:r
  f64.mul
  f64.add
  local.set $uDot
  local.get $Y
  local.get $massY
  f64.div
  local.get $vessel
  call $assembly/index/VesselState#get:u
  local.get $vessel
  call $assembly/index/VesselState#get:r
  f64.mul
  f64.sub
  local.set $vDot
  local.get $N
  local.get $Izz
  f64.div
  local.set $rDot
  block $~lib/math/NativeMath.min|inlined.0 (result f64)
   global.get $assembly/index/MAX_WAVE_HEIGHT
   local.set $value1|92
   local.get $windSpeed
   global.get $assembly/index/WAVE_HEIGHT_PER_WIND
   f64.mul
   local.set $value2|93
   local.get $value1|92
   local.get $value2|93
   f64.min
   br $~lib/math/NativeMath.min|inlined.0
  end
  local.set $fallbackWaveHeight
  local.get $waveHeight
  f64.const 0
  f64.gt
  if (result f64)
   local.get $waveHeight
  else
   local.get $fallbackWaveHeight
  end
  local.set $waveH
  local.get $waveH
  f64.const 0.5
  f64.mul
  local.set $waveAmp
  local.get $waveLength
  f64.const 1
  f64.gt
  if (result f64)
   local.get $waveLength
  else
   block $~lib/math/NativeMath.max|inlined.8 (result f64)
    f64.const 20
    local.set $value1|97
    local.get $vessel
    call $assembly/index/VesselState#get:length
    f64.const 2
    f64.mul
    local.set $value2|98
    local.get $value1|97
    local.get $value2|98
    f64.max
    br $~lib/math/NativeMath.max|inlined.8
   end
  end
  local.set $waveLen
  local.get $waveDirection
  local.get $waveDirection
  f64.eq
  if (result f64)
   local.get $waveDirection
  else
   local.get $windDirection
  end
  local.set $waveDir
  f64.const 2
  global.get $~lib/math/NativeMath.PI
  f64.mul
  local.get $waveLen
  f64.div
  local.set $k
  block $~lib/math/NativeMath.sqrt|inlined.3 (result f64)
   global.get $assembly/index/GRAVITY
   local.get $k
   f64.mul
   local.set $x|102
   local.get $x|102
   f64.sqrt
   br $~lib/math/NativeMath.sqrt|inlined.3
  end
  local.set $omega
  local.get $waveSteepness
  f64.const 0
  f64.gt
  if (result f64)
   local.get $waveSteepness
  else
   block $~lib/math/NativeMath.min|inlined.1 (result f64)
    f64.const 0.7
    local.set $value1|104
    local.get $waveAmp
    local.get $k
    f64.mul
    local.set $value2|105
    local.get $value1|104
    local.get $value2|105
    f64.min
    br $~lib/math/NativeMath.min|inlined.1
   end
  end
  local.set $steep
  local.get $vessel
  local.get $waveAmp
  call $assembly/index/VesselState#set:waveAmplitude
  local.get $vessel
  local.get $waveLen
  call $assembly/index/VesselState#set:waveLength
  local.get $vessel
  local.get $waveDir
  call $assembly/index/VesselState#set:waveDirection
  local.get $vessel
  local.get $steep
  call $assembly/index/VesselState#set:waveSteepness
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:waveTime
  local.get $safeDt
  f64.add
  call $assembly/index/VesselState#set:waveTime
  local.get $waveDir
  call $~lib/math/NativeMath.cos
  local.set $dirX
  local.get $waveDir
  call $~lib/math/NativeMath.sin
  local.set $dirY
  local.get $k
  local.get $dirX
  local.get $vessel
  call $assembly/index/VesselState#get:x
  f64.mul
  local.get $dirY
  local.get $vessel
  call $assembly/index/VesselState#get:y
  f64.mul
  f64.add
  f64.mul
  local.get $omega
  local.get $vessel
  call $assembly/index/VesselState#get:waveTime
  f64.mul
  f64.sub
  local.set $phase
  local.get $phase
  call $~lib/math/NativeMath.sin
  local.set $sinPhase
  local.get $phase
  call $~lib/math/NativeMath.cos
  local.set $cosPhase
  local.get $waveAmp
  local.get $sinPhase
  f64.mul
  local.set $waveElevation
  local.get $steep
  local.get $cosPhase
  f64.mul
  local.set $slope
  local.get $slope
  local.get $dirX
  f64.mul
  local.set $waveSlopeX
  local.get $slope
  local.get $dirY
  f64.mul
  local.set $waveSlopeY
  local.get $effectiveMass
  global.get $assembly/index/WATER_DENSITY
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:beam
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:blockCoefficient
  f64.mul
  f64.const 1e-06
  f64.add
  f64.div
  local.set $neutralDraft
  local.get $neutralDraft
  f64.const 0.7
  local.get $ballastFactor
  f64.const 0.5
  f64.mul
  f64.add
  f64.mul
  local.set $targetDraft
  local.get $targetDraft
  local.get $waveElevation
  f64.add
  f64.neg
  local.set $targetZ
  local.get $targetZ
  local.get $vessel
  call $assembly/index/VesselState#get:z
  f64.sub
  local.get $vessel
  call $assembly/index/VesselState#get:heaveStiffness
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:heaveDamping
  local.get $vessel
  call $assembly/index/VesselState#get:w
  f64.mul
  f64.sub
  local.set $heaveAccel
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:w
  local.get $heaveAccel
  local.get $safeDt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:w
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:z
  local.get $vessel
  call $assembly/index/VesselState#get:w
  local.get $safeDt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:z
  local.get $waveSlopeY
  local.set $waveSlopeRoll
  local.get $waveSlopeX
  local.set $waveSlopePitch
  local.get $vessel
  call $assembly/index/VesselState#get:beam
  local.get $vessel
  call $assembly/index/VesselState#get:beam
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:blockCoefficient
  f64.mul
  f64.const 12
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  f64.const 0.1
  f64.add
  f64.mul
  f64.div
  local.set $gmRoll
  local.get $vessel
  call $assembly/index/VesselState#get:length
  local.get $vessel
  call $assembly/index/VesselState#get:blockCoefficient
  f64.mul
  f64.const 12
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  f64.const 0.1
  f64.add
  f64.mul
  f64.div
  local.set $gmPitch
  global.get $assembly/index/GRAVITY
  f64.neg
  local.get $gmRoll
  f64.mul
  local.get $mass
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:rollAngle
  local.get $waveSlopeRoll
  f64.sub
  f64.mul
  local.set $rollRestoring
  global.get $assembly/index/GRAVITY
  f64.neg
  local.get $gmPitch
  f64.mul
  local.get $mass
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:pitchAngle
  local.get $waveSlopePitch
  f64.sub
  f64.mul
  local.set $pitchRestoring
  local.get $rollRestoring
  local.get $vessel
  call $assembly/index/VesselState#get:rollDamping
  local.get $vessel
  call $assembly/index/VesselState#get:p
  f64.mul
  f64.sub
  local.get $Ixx
  f64.div
  local.set $pDot
  local.get $pitchRestoring
  local.get $vessel
  call $assembly/index/VesselState#get:pitchDamping
  local.get $vessel
  call $assembly/index/VesselState#get:q
  f64.mul
  f64.sub
  local.get $Iyy
  f64.div
  local.set $qDot
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:p
  local.get $pDot
  local.get $safeDt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:p
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:q
  local.get $qDot
  local.get $safeDt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:q
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:rollAngle
  local.get $vessel
  call $assembly/index/VesselState#get:p
  local.get $safeDt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:rollAngle
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:pitchAngle
  local.get $vessel
  call $assembly/index/VesselState#get:q
  local.get $safeDt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:pitchAngle
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:u
  local.get $uDot
  local.get $safeDt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:u
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:v
  local.get $vDot
  local.get $safeDt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:v
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:r
  local.get $rDot
  local.get $safeDt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:r
  local.get $vessel
  call $assembly/index/VesselState#get:maxSpeed
  global.get $assembly/index/MAX_SPEED_MULTIPLIER
  f64.mul
  local.set $speedCap
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:u
  local.get $speedCap
  call $assembly/index/clampSigned
  call $assembly/index/VesselState#set:u
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:v
  local.get $speedCap
  f64.const 0.6
  f64.mul
  call $assembly/index/clampSigned
  call $assembly/index/VesselState#set:v
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:r
  global.get $assembly/index/MAX_YAW_RATE
  global.get $assembly/index/MAX_YAW_MULTIPLIER
  f64.mul
  call $assembly/index/clampSigned
  call $assembly/index/VesselState#set:r
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:psi
  local.get $vessel
  call $assembly/index/VesselState#get:r
  local.get $safeDt
  f64.mul
  f64.add
  call $assembly/index/normalizeAngle
  call $assembly/index/VesselState#set:psi
  local.get $vessel
  call $assembly/index/VesselState#get:psi
  call $~lib/math/NativeMath.cos
  local.set $cosPsi
  local.get $vessel
  call $assembly/index/VesselState#get:psi
  call $~lib/math/NativeMath.sin
  local.set $sinPsi
  local.get $vessel
  call $assembly/index/VesselState#get:u
  local.get $cosPsi
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:v
  local.get $sinPsi
  f64.mul
  f64.sub
  local.set $worldU
  local.get $vessel
  call $assembly/index/VesselState#get:u
  local.get $sinPsi
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:v
  local.get $cosPsi
  f64.mul
  f64.add
  local.set $worldV
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:x
  local.get $worldU
  local.get $safeDt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:x
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:y
  local.get $worldV
  local.get $safeDt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:y
  local.get $vesselPtr
  return
 )
 (func $assembly/index/setThrottle (param $vesselPtr i32) (param $throttle f64)
  (local $vessel i32)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  local.set $vessel
  local.get $vessel
  local.get $throttle
  f64.const 1
  call $assembly/index/clampSigned
  call $assembly/index/VesselState#set:throttleCommand
 )
 (func $assembly/index/setRudderAngle (param $vesselPtr i32) (param $angle f64)
  (local $vessel i32)
  (local $clamped f64)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  local.set $vessel
  local.get $angle
  local.get $angle
  f64.sub
  f64.const 0
  f64.eq
  i32.eqz
  if
   return
  end
  local.get $angle
  local.set $clamped
  local.get $clamped
  local.get $vessel
  call $assembly/index/VesselState#get:rudderMaxAngle
  f64.gt
  if
   local.get $vessel
   call $assembly/index/VesselState#get:rudderMaxAngle
   local.set $clamped
  end
  local.get $clamped
  local.get $vessel
  call $assembly/index/VesselState#get:rudderMaxAngle
  f64.neg
  f64.lt
  if
   local.get $vessel
   call $assembly/index/VesselState#get:rudderMaxAngle
   f64.neg
   local.set $clamped
  end
  local.get $vessel
  local.get $clamped
  call $assembly/index/VesselState#set:rudderCommand
 )
 (func $assembly/index/setBallast (param $vesselPtr i32) (param $_level f64)
  (local $vessel i32)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  local.set $vessel
  local.get $vessel
  local.get $_level
  call $assembly/index/clamp01
  call $assembly/index/VesselState#set:ballast
 )
 (func $assembly/index/getVesselX (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:x
  return
 )
 (func $assembly/index/getVesselY (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:y
  return
 )
 (func $assembly/index/getVesselZ (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:z
  return
 )
 (func $assembly/index/getVesselHeading (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:psi
  return
 )
 (func $assembly/index/getVesselSpeed (param $vesselPtr i32) (result f64)
  (local $vessel i32)
  (local $x f64)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  local.set $vessel
  block $~lib/math/NativeMath.sqrt|inlined.4 (result f64)
   local.get $vessel
   call $assembly/index/VesselState#get:u
   local.get $vessel
   call $assembly/index/VesselState#get:u
   f64.mul
   local.get $vessel
   call $assembly/index/VesselState#get:v
   local.get $vessel
   call $assembly/index/VesselState#get:v
   f64.mul
   f64.add
   local.set $x
   local.get $x
   f64.sqrt
   br $~lib/math/NativeMath.sqrt|inlined.4
  end
  return
 )
 (func $assembly/index/getVesselSurgeVelocity (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:u
  return
 )
 (func $assembly/index/getVesselSwayVelocity (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:v
  return
 )
 (func $assembly/index/getVesselHeaveVelocity (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:w
  return
 )
 (func $assembly/index/getVesselRollAngle (param $_vesselPtr i32) (result f64)
  local.get $_vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:rollAngle
  return
 )
 (func $assembly/index/getVesselPitchAngle (param $_vesselPtr i32) (result f64)
  local.get $_vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:pitchAngle
  return
 )
 (func $assembly/index/getVesselRudderAngle (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:rudderAngle
  return
 )
 (func $assembly/index/getVesselEngineRPM (param $vesselPtr i32) (result f64)
  (local $x f64)
  block $~lib/math/NativeMath.abs|inlined.8 (result f64)
   local.get $vesselPtr
   call $assembly/index/ensureVessel
   call $assembly/index/VesselState#get:throttle
   local.set $x
   local.get $x
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.8
  end
  f64.const 1200
  f64.mul
  return
 )
 (func $assembly/index/getVesselFuelLevel (param $_vesselPtr i32) (result f64)
  local.get $_vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:fuelLevel
  return
 )
 (func $assembly/index/VesselState#get:lastFuelConsumption (param $this i32) (result f64)
  local.get $this
  f64.load offset=488
 )
 (func $assembly/index/getVesselFuelConsumption (param $_vesselPtr i32) (result f64)
  local.get $_vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:lastFuelConsumption
  return
 )
 (func $assembly/index/getVesselGM (param $_vesselPtr i32) (result f64)
  (local $vessel i32)
  local.get $_vesselPtr
  call $assembly/index/ensureVessel
  local.set $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:beam
  local.get $vessel
  call $assembly/index/VesselState#get:blockCoefficient
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  f64.const 0.1
  f64.add
  f64.div
  return
 )
 (func $assembly/index/getVesselCenterOfGravityY (param $_vesselPtr i32) (result f64)
  (local $vessel i32)
  local.get $_vesselPtr
  call $assembly/index/ensureVessel
  local.set $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  f64.const 0.4
  local.get $vessel
  call $assembly/index/VesselState#get:ballast
  f64.const 0.2
  f64.mul
  f64.add
  f64.mul
  return
 )
 (func $assembly/index/getVesselBallastLevel (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:ballast
  return
 )
 (func $assembly/index/getVesselRollRate (param $_vesselPtr i32) (result f64)
  local.get $_vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:p
  return
 )
 (func $assembly/index/getVesselPitchRate (param $_vesselPtr i32) (result f64)
  local.get $_vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:q
  return
 )
 (func $assembly/index/getVesselYawRate (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:r
  return
 )
 (func $assembly/index/calculateSeaState (param $windSpeed f64) (result f64)
  (local $beaufort f64)
  local.get $windSpeed
  f64.const 1.5
  f64.div
  local.set $beaufort
  local.get $beaufort
  f64.const 0
  f64.lt
  if
   f64.const 0
   return
  end
  local.get $beaufort
  f64.const 12
  f64.gt
  if
   f64.const 12
   return
  end
  local.get $beaufort
  return
 )
 (func $assembly/index/getWaveHeightForSeaState (param $seaState f64) (result f64)
  local.get $seaState
  f64.const 0.5
  f64.mul
  return
 )
 (func $assembly/index/resetGlobalVessel
  i32.const 0
  global.set $assembly/index/globalVessel
 )
 (func $~setArgumentsLength (param $0 i32)
  local.get $0
  global.set $~argumentsLength
 )
 (func $~start
  call $start:assembly/index
 )
)
