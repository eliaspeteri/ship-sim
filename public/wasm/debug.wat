(module
 (type $0 (func (param i32) (result f64)))
 (type $1 (func (param i32 f64)))
 (type $2 (func (param f64) (result f64)))
 (type $3 (func (param i32 i32)))
 (type $4 (func (param i32) (result i32)))
 (type $5 (func (param f64 f64) (result f64)))
 (type $6 (func))
 (type $7 (func (param i32 i32 i32 i32)))
 (type $8 (func (param i32)))
 (type $9 (func (param i32 i32) (result i32)))
 (type $10 (func (param i32 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64) (result i32)))
 (type $11 (func (param f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64) (result i32)))
 (type $12 (func (param f64 i64) (result i32)))
 (type $13 (func (param i32 f64 f64 f64 f64 f64) (result i32)))
 (import "env" "memory" (memory $0 16 100))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (global $assembly/index/WATER_DENSITY f64 (f64.const 1025))
 (global $assembly/index/DRAG_COEFFICIENT f64 (f64.const 0.8))
 (global $assembly/index/RUDDER_FORCE_COEFFICIENT f64 (f64.const 2e5))
 (global $assembly/index/RUDDER_MAX_ANGLE f64 (f64.const 0.6))
 (global $assembly/index/MAX_THRUST f64 (f64.const 8e5))
 (global $assembly/index/DEFAULT_MASS f64 (f64.const 5e6))
 (global $assembly/index/DEFAULT_LENGTH f64 (f64.const 120))
 (global $assembly/index/DEFAULT_BEAM f64 (f64.const 20))
 (global $assembly/index/DEFAULT_DRAFT f64 (f64.const 6))
 (global $assembly/index/YAW_DAMPING f64 (f64.const 0.5))
 (global $assembly/index/MAX_YAW_RATE f64 (f64.const 0.8))
 (global $assembly/index/MAX_SPEED f64 (f64.const 15))
 (global $assembly/index/globalVessel (mut i32) (i32.const 0))
 (global $~lib/rt/stub/startOffset (mut i32) (i32.const 0))
 (global $~lib/rt/stub/offset (mut i32) (i32.const 0))
 (global $~lib/native/ASC_SHRINK_LEVEL i32 (i32.const 0))
 (global $~lib/math/rempio2_y0 (mut f64) (f64.const 0))
 (global $~lib/math/rempio2_y1 (mut f64) (f64.const 0))
 (global $~lib/math/res128_hi (mut i64) (i64.const 0))
 (global $~lib/math/NativeMath.PI f64 (f64.const 3.141592653589793))
 (global $~lib/memory/__heap_base i32 (i32.const 464))
 (data $0 (i32.const 12) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00(\00\00\00A\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e\00\00\00\00\00")
 (data $1 (i32.const 76) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00s\00t\00u\00b\00.\00t\00s\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $2 (i32.const 140) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00,\00\00\00V\00e\00s\00s\00e\00l\00 \00p\00o\00i\00n\00t\00e\00r\00 \00i\00s\00 \00n\00u\00l\00l\00")
 (data $3 (i32.const 204) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\"\00\00\00a\00s\00s\00e\00m\00b\00l\00y\00/\00i\00n\00d\00e\00x\00.\00t\00s\00\00\00\00\00\00\00\00\00\00\00")
 (data $4 (i32.const 272) "n\83\f9\a2\00\00\00\00\d1W\'\fc)\15DN\99\95b\db\c0\dd4\f5\abcQ\feA\90C<:n$\b7a\c5\bb\de\ea.I\06\e0\d2MB\1c\eb\1d\fe\1c\92\d1\t\f55\82\e8>\a7)\b1&p\9c\e9\84D\bb.9\d6\919A~_\b4\8b_\84\9c\f49S\83\ff\97\f8\1f;(\f9\bd\8b\11/\ef\0f\98\05\de\cf~6m\1fm\nZf?FO\b7\t\cb\'\c7\ba\'u-\ea_\9e\f79\07={\f1\e5\eb\b1_\fbk\ea\92R\8aF0\03V\08]\8d\1f \bc\cf\f0\abk{\fca\91\e3\a9\1d6\f4\9a_\85\99e\08\1b\e6^\80\d8\ff\8d@h\a0\14W\15\06\061\'sM")
 (table $0 1 funcref)
 (elem $0 (i32.const 1))
 (export "createVessel" (func $assembly/index/createVessel))
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
 (start $~start)
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
  f64.store offset=24
 )
 (func $assembly/index/VesselState#set:u (param $this i32) (param $u f64)
  local.get $this
  local.get $u
  f64.store offset=32
 )
 (func $assembly/index/VesselState#set:v (param $this i32) (param $v f64)
  local.get $this
  local.get $v
  f64.store offset=40
 )
 (func $assembly/index/VesselState#set:w (param $this i32) (param $w f64)
  local.get $this
  local.get $w
  f64.store offset=48
 )
 (func $assembly/index/VesselState#set:r (param $this i32) (param $r f64)
  local.get $this
  local.get $r
  f64.store offset=56
 )
 (func $assembly/index/VesselState#set:throttle (param $this i32) (param $throttle f64)
  local.get $this
  local.get $throttle
  f64.store offset=64
 )
 (func $assembly/index/VesselState#set:rudderAngle (param $this i32) (param $rudderAngle f64)
  local.get $this
  local.get $rudderAngle
  f64.store offset=72
 )
 (func $assembly/index/VesselState#set:mass (param $this i32) (param $mass f64)
  local.get $this
  local.get $mass
  f64.store offset=80
 )
 (func $assembly/index/VesselState#set:length (param $this i32) (param $length f64)
  local.get $this
  local.get $length
  f64.store offset=88
 )
 (func $assembly/index/VesselState#set:beam (param $this i32) (param $beam f64)
  local.get $this
  local.get $beam
  f64.store offset=96
 )
 (func $assembly/index/VesselState#set:draft (param $this i32) (param $draft f64)
  local.get $this
  local.get $draft
  f64.store offset=104
 )
 (func $assembly/index/VesselState#set:waveHeight (param $this i32) (param $waveHeight f64)
  local.get $this
  local.get $waveHeight
  f64.store offset=112
 )
 (func $assembly/index/VesselState#set:wavePhase (param $this i32) (param $wavePhase f64)
  local.get $this
  local.get $wavePhase
  f64.store offset=120
 )
 (func $assembly/index/VesselState#set:fuelLevel (param $this i32) (param $fuelLevel f64)
  local.get $this
  local.get $fuelLevel
  f64.store offset=128
 )
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
 (func $assembly/index/VesselState#constructor (param $this i32) (param $x f64) (param $y f64) (param $z f64) (param $psi f64) (param $u f64) (param $v f64) (param $w f64) (param $r f64) (param $throttle f64) (param $rudderAngle f64) (param $mass f64) (param $length f64) (param $beam f64) (param $draft f64) (result i32)
  local.get $this
  i32.eqz
  if
   i32.const 136
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
  call $assembly/index/VesselState#set:throttle
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:rudderAngle
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
  call $assembly/index/VesselState#set:waveHeight
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:wavePhase
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:fuelLevel
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
  local.get $throttle
  call $assembly/index/VesselState#set:throttle
  local.get $this
  local.get $rudderAngle
  call $assembly/index/VesselState#set:rudderAngle
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
  f64.const 0
  call $assembly/index/VesselState#set:waveHeight
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:wavePhase
  local.get $this
  f64.const 1
  call $assembly/index/VesselState#set:fuelLevel
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
 (func $assembly/index/createVessel (param $x f64) (param $y f64) (param $z f64) (param $psi f64) (param $_phi f64) (param $_theta f64) (param $u f64) (param $v f64) (param $w f64) (param $r f64) (param $_p f64) (param $_q f64) (param $throttle f64) (param $rudderAngle f64) (param $mass f64) (param $length f64) (param $beam f64) (param $draft f64) (result i32)
  global.get $assembly/index/globalVessel
  i32.const 0
  i32.eq
  if
   i32.const 0
   local.get $x
   local.get $y
   local.get $z
   local.get $psi
   local.get $u
   local.get $v
   local.get $w
   local.get $r
   local.get $throttle
   call $assembly/index/clamp01
   local.get $rudderAngle
   local.get $mass
   local.get $length
   local.get $beam
   local.get $draft
   call $assembly/index/VesselState#constructor
   global.set $assembly/index/globalVessel
  end
  global.get $assembly/index/globalVessel
  return
 )
 (func $assembly/index/ensureVessel (param $vesselPtr i32) (result i32)
  local.get $vesselPtr
  i32.const 0
  i32.eq
  if
   i32.const 160
   i32.const 224
   i32.const 94
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $vesselPtr
  return
 )
 (func $assembly/index/VesselState#get:throttle (param $this i32) (result f64)
  local.get $this
  f64.load offset=64
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
 (func $assembly/index/VesselState#get:fuelLevel (param $this i32) (result f64)
  local.get $this
  f64.load offset=128
 )
 (func $assembly/index/VesselState#get:u (param $this i32) (result f64)
  local.get $this
  f64.load offset=32
 )
 (func $assembly/index/VesselState#get:v (param $this i32) (result f64)
  local.get $this
  f64.load offset=40
 )
 (func $assembly/index/VesselState#get:psi (param $this i32) (result f64)
  local.get $this
  f64.load offset=24
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
  i32.const 272
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
 (func $assembly/index/VesselState#get:mass (param $this i32) (result f64)
  local.get $this
  f64.load offset=80
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
 (func $assembly/index/VesselState#get:rudderAngle (param $this i32) (result f64)
  local.get $this
  f64.load offset=72
 )
 (func $assembly/index/VesselState#get:length (param $this i32) (result f64)
  local.get $this
  f64.load offset=88
 )
 (func $assembly/index/VesselState#get:r (param $this i32) (result f64)
  local.get $this
  f64.load offset=56
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
 (func $assembly/index/VesselState#get:x (param $this i32) (result f64)
  local.get $this
  f64.load
 )
 (func $assembly/index/VesselState#get:y (param $this i32) (result f64)
  local.get $this
  f64.load offset=8
 )
 (func $assembly/index/updateVesselState (param $vesselPtr i32) (param $dt f64) (param $windSpeed f64) (param $windDirection f64) (param $currentSpeed f64) (param $currentDirection f64) (result i32)
  (local $vessel i32)
  (local $safeDt f64)
  (local $throttle f64)
  (local $thrust f64)
  (local $x f64)
  (local $dragSurge f64)
  (local $x|12 f64)
  (local $dragSway f64)
  (local $relCurrentDir f64)
  (local $currentSurge f64)
  (local $currentSway f64)
  (local $x|17 f64)
  (local $speedMag f64)
  (local $rudderForce f64)
  (local $rudderMoment f64)
  (local $windYaw f64)
  (local $mass f64)
  (local $Izz f64)
  (local $uDot f64)
  (local $vDot f64)
  (local $rDot f64)
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
  call $assembly/index/VesselState#get:throttle
  f64.const 1
  call $assembly/index/clampSigned
  local.get $vessel
  call $assembly/index/VesselState#get:fuelLevel
  f64.const 0
  f64.gt
  if (result f64)
   f64.const 1
  else
   f64.const 0
  end
  f64.mul
  local.set $throttle
  global.get $assembly/index/MAX_THRUST
  local.get $throttle
  f64.mul
  local.set $thrust
  global.get $assembly/index/DRAG_COEFFICIENT
  local.get $vessel
  call $assembly/index/VesselState#get:u
  f64.mul
  block $~lib/math/NativeMath.abs|inlined.0 (result f64)
   local.get $vessel
   call $assembly/index/VesselState#get:u
   local.set $x
   local.get $x
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.0
  end
  f64.mul
  local.set $dragSurge
  global.get $assembly/index/DRAG_COEFFICIENT
  local.get $vessel
  call $assembly/index/VesselState#get:v
  f64.mul
  block $~lib/math/NativeMath.abs|inlined.1 (result f64)
   local.get $vessel
   call $assembly/index/VesselState#get:v
   local.set $x|12
   local.get $x|12
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.1
  end
  f64.mul
  local.set $dragSway
  local.get $currentDirection
  local.get $vessel
  call $assembly/index/VesselState#get:psi
  f64.sub
  local.set $relCurrentDir
  local.get $currentSpeed
  local.get $relCurrentDir
  call $~lib/math/NativeMath.cos
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:mass
  f64.mul
  f64.const 0.01
  f64.mul
  local.set $currentSurge
  local.get $currentSpeed
  local.get $relCurrentDir
  call $~lib/math/NativeMath.sin
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:mass
  f64.mul
  f64.const 0.01
  f64.mul
  local.set $currentSway
  block $~lib/math/NativeMath.sqrt|inlined.0 (result f64)
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
   local.set $x|17
   local.get $x|17
   f64.sqrt
   br $~lib/math/NativeMath.sqrt|inlined.0
  end
  local.set $speedMag
  global.get $assembly/index/RUDDER_FORCE_COEFFICIENT
  local.get $vessel
  call $assembly/index/VesselState#get:rudderAngle
  f64.mul
  local.get $speedMag
  f64.mul
  local.get $speedMag
  f64.mul
  local.set $rudderForce
  local.get $rudderForce
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.mul
  f64.const 0.4
  f64.mul
  local.set $rudderMoment
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
  local.get $vessel
  call $assembly/index/VesselState#get:mass
  local.set $mass
  local.get $mass
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.mul
  f64.const 0.1
  f64.mul
  local.set $Izz
  local.get $thrust
  local.get $dragSurge
  f64.sub
  local.get $currentSurge
  f64.add
  local.get $mass
  f64.div
  local.set $uDot
  local.get $dragSway
  f64.neg
  local.get $currentSway
  f64.add
  local.get $rudderForce
  f64.add
  local.get $mass
  f64.div
  local.set $vDot
  local.get $rudderMoment
  local.get $windYaw
  f64.sub
  global.get $assembly/index/YAW_DAMPING
  local.get $vessel
  call $assembly/index/VesselState#get:r
  f64.mul
  f64.sub
  local.get $Izz
  f64.div
  local.set $rDot
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
  local.get $vessel
  call $assembly/index/VesselState#get:u
  global.get $assembly/index/MAX_SPEED
  call $assembly/index/clampSigned
  call $assembly/index/VesselState#set:u
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:v
  global.get $assembly/index/MAX_SPEED
  f64.const 0.6
  f64.mul
  call $assembly/index/clampSigned
  call $assembly/index/VesselState#set:v
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:r
  global.get $assembly/index/MAX_YAW_RATE
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
  local.get $vessel
  f64.const 0
  call $assembly/index/VesselState#set:z
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
  call $assembly/index/VesselState#set:throttle
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
  global.get $assembly/index/RUDDER_MAX_ANGLE
  f64.gt
  if
   global.get $assembly/index/RUDDER_MAX_ANGLE
   local.set $clamped
  end
  local.get $clamped
  global.get $assembly/index/RUDDER_MAX_ANGLE
  f64.neg
  f64.lt
  if
   global.get $assembly/index/RUDDER_MAX_ANGLE
   f64.neg
   local.set $clamped
  end
  local.get $vessel
  local.get $clamped
  call $assembly/index/VesselState#set:rudderAngle
 )
 (func $assembly/index/setBallast (param $vesselPtr i32) (param $_level f64)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  drop
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
 (func $assembly/index/VesselState#get:z (param $this i32) (result f64)
  local.get $this
  f64.load offset=16
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
  block $~lib/math/NativeMath.sqrt|inlined.1 (result f64)
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
   br $~lib/math/NativeMath.sqrt|inlined.1
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
 (func $assembly/index/VesselState#get:w (param $this i32) (result f64)
  local.get $this
  f64.load offset=48
 )
 (func $assembly/index/getVesselHeaveVelocity (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/ensureVessel
  call $assembly/index/VesselState#get:w
  return
 )
 (func $assembly/index/getVesselRollAngle (param $_vesselPtr i32) (result f64)
  f64.const 0
  return
 )
 (func $assembly/index/getVesselPitchAngle (param $_vesselPtr i32) (result f64)
  f64.const 0
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
  block $~lib/math/NativeMath.abs|inlined.2 (result f64)
   local.get $vesselPtr
   call $assembly/index/ensureVessel
   call $assembly/index/VesselState#get:throttle
   local.set $x
   local.get $x
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.2
  end
  f64.const 1200
  f64.mul
  return
 )
 (func $assembly/index/getVesselFuelLevel (param $_vesselPtr i32) (result f64)
  f64.const 1
  return
 )
 (func $assembly/index/getVesselFuelConsumption (param $_vesselPtr i32) (result f64)
  f64.const 0
  return
 )
 (func $assembly/index/getVesselGM (param $_vesselPtr i32) (result f64)
  f64.const 1
  return
 )
 (func $assembly/index/getVesselCenterOfGravityY (param $_vesselPtr i32) (result f64)
  f64.const 0
  return
 )
 (func $assembly/index/getVesselBallastLevel (param $_vesselPtr i32) (result f64)
  f64.const 0.5
  return
 )
 (func $assembly/index/getVesselRollRate (param $_vesselPtr i32) (result f64)
  f64.const 0
  return
 )
 (func $assembly/index/getVesselPitchRate (param $_vesselPtr i32) (result f64)
  f64.const 0
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
 (func $~start
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
 )
)
