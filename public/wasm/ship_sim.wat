(module
 (type $0 (func (param i32) (result f64)))
 (type $1 (func (param f64) (result f64)))
 (type $2 (func (result i32)))
 (type $3 (func (param i32 f64)))
 (type $4 (func (param i32 i32 i32 i32)))
 (type $5 (func (param f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64) (result i32)))
 (type $6 (func (param i32)))
 (type $7 (func))
 (type $8 (func (param i32 i32) (result i32)))
 (type $9 (func (param i32) (result i32)))
 (type $10 (func (param i32 i32)))
 (type $11 (func (param i64) (result i32)))
 (type $12 (func (param i32 f64 f64 f64 f64 f64 f64 f64 f64 f64) (result i32)))
 (import "env" "memory" (memory $0 16 100))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (global $assembly/index/globalVessel (mut i32) (i32.const 0))
 (global $~lib/rt/stub/offset (mut i32) (i32.const 0))
 (global $assembly/index/globalEnvironment (mut i32) (i32.const 0))
 (global $assembly/index/vesselParamsBuffer (mut i32) (i32.const 0))
 (global $assembly/index/environmentBuffer (mut i32) (i32.const 0))
 (global $~argumentsLength (mut i32) (i32.const 0))
 (global $~lib/math/rempio2_y0 (mut f64) (f64.const 0))
 (global $~lib/math/rempio2_y1 (mut f64) (f64.const 0))
 (global $~lib/math/res128_hi (mut i64) (i64.const 0))
 (data $0 (i32.const 1036) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00(\00\00\00A\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e\00\00\00\00\00")
 (data $1 (i32.const 1100) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00s\00t\00u\00b\00.\00t\00s\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $2 (i32.const 1164) ",\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\1c\00\00\00I\00n\00v\00a\00l\00i\00d\00 \00l\00e\00n\00g\00t\00h\00")
 (data $3 (i32.const 1212) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00&\00\00\00~\00l\00i\00b\00/\00s\00t\00a\00t\00i\00c\00a\00r\00r\00a\00y\00.\00t\00s\00\00\00\00\00\00\00")
 (data $4 (i32.const 1276) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00,\00\00\00V\00e\00s\00s\00e\00l\00 \00p\00o\00i\00n\00t\00e\00r\00 \00i\00s\00 \00n\00u\00l\00l\00")
 (data $5 (i32.const 1340) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\"\00\00\00a\00s\00s\00e\00m\00b\00l\00y\00/\00i\00n\00d\00e\00x\00.\00t\00s\00\00\00\00\00\00\00\00\00\00\00")
 (data $6 (i32.const 1408) "n\83\f9\a2\00\00\00\00\d1W\'\fc)\15DN\99\95b\db\c0\dd4\f5\abcQ\feA\90C<:n$\b7a\c5\bb\de\ea.I\06\e0\d2MB\1c\eb\1d\fe\1c\92\d1\t\f55\82\e8>\a7)\b1&p\9c\e9\84D\bb.9\d6\919A~_\b4\8b_\84\9c\f49S\83\ff\97\f8\1f;(\f9\bd\8b\11/\ef\0f\98\05\de\cf~6m\1fm\nZf?FO\b7\t\cb\'\c7\ba\'u-\ea_\9e\f79\07={\f1\e5\eb\b1_\fbk\ea\92R\8aF0\03V\08]\8d\1f \bc\cf\f0\abk{\fca\91\e3\a9\1d6\f4\9a_\85\99e\08\1b\e6^\80\d8\ff\8d@h\a0\14W\15\06\061\'sM")
 (table $0 1 funcref)
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
 (func $~lib/rt/stub/__new (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  local.get $0
  i32.const 1073741804
  i32.gt_u
  if
   i32.const 1056
   i32.const 1120
   i32.const 86
   i32.const 30
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.const 16
  i32.add
  local.tee $4
  i32.const 1073741820
  i32.gt_u
  if
   i32.const 1056
   i32.const 1120
   i32.const 33
   i32.const 29
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/rt/stub/offset
  local.set $3
  global.get $~lib/rt/stub/offset
  i32.const 4
  i32.add
  local.tee $2
  local.get $4
  i32.const 19
  i32.add
  i32.const -16
  i32.and
  i32.const 4
  i32.sub
  local.tee $4
  i32.add
  local.tee $5
  memory.size
  local.tee $6
  i32.const 16
  i32.shl
  i32.const 15
  i32.add
  i32.const -16
  i32.and
  local.tee $7
  i32.gt_u
  if
   local.get $6
   local.get $5
   local.get $7
   i32.sub
   i32.const 65535
   i32.add
   i32.const -65536
   i32.and
   i32.const 16
   i32.shr_u
   local.tee $7
   local.get $6
   local.get $7
   i32.gt_s
   select
   memory.grow
   i32.const 0
   i32.lt_s
   if
    local.get $7
    memory.grow
    i32.const 0
    i32.lt_s
    if
     unreachable
    end
   end
  end
  local.get $5
  global.set $~lib/rt/stub/offset
  local.get $3
  local.get $4
  i32.store
  local.get $2
  i32.const 4
  i32.sub
  local.tee $3
  i32.const 0
  i32.store offset=4
  local.get $3
  i32.const 0
  i32.store offset=8
  local.get $3
  local.get $1
  i32.store offset=12
  local.get $3
  local.get $0
  i32.store offset=16
  local.get $2
  i32.const 16
  i32.add
 )
 (func $~lib/staticarray/StaticArray<f64>#constructor (param $0 i32) (result i32)
  (local $1 i32)
  local.get $0
  i32.const 134217727
  i32.gt_u
  if
   i32.const 1184
   i32.const 1232
   i32.const 51
   i32.const 60
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.const 3
  i32.shl
  local.tee $0
  i32.const 6
  call $~lib/rt/stub/__new
  local.tee $1
  i32.const 0
  local.get $0
  memory.fill
  local.get $1
 )
 (func $assembly/index/VesselState#constructor (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (param $4 f64) (param $5 f64) (param $6 f64) (param $7 f64) (param $8 f64) (param $9 f64) (param $10 f64) (param $11 f64) (param $12 f64) (param $13 f64) (param $14 f64) (param $15 f64) (param $16 f64) (param $17 f64) (param $18 f64) (param $19 f64) (param $20 f64) (param $21 f64) (param $22 f64) (param $23 f64) (param $24 f64) (param $25 f64) (param $26 f64) (param $27 f64) (param $28 f64) (param $29 f64) (param $30 f64) (param $31 f64) (result i32)
  (local $32 i32)
  (local $33 i32)
  i32.const 500
  i32.const 4
  call $~lib/rt/stub/__new
  local.tee $32
  f64.const 0
  f64.store
  local.get $32
  f64.const 0
  f64.store offset=8
  local.get $32
  f64.const 0
  f64.store offset=16
  local.get $32
  f64.const 0
  f64.store offset=24
  local.get $32
  f64.const 0
  f64.store offset=32
  local.get $32
  f64.const 0
  f64.store offset=40
  local.get $32
  f64.const 0
  f64.store offset=48
  local.get $32
  f64.const 0
  f64.store offset=56
  local.get $32
  f64.const 0
  f64.store offset=64
  local.get $32
  f64.const 0
  f64.store offset=72
  local.get $32
  f64.const 0
  f64.store offset=80
  local.get $32
  f64.const 0
  f64.store offset=88
  local.get $32
  f64.const 0
  f64.store offset=96
  local.get $32
  f64.const 0
  f64.store offset=104
  local.get $32
  f64.const 0
  f64.store offset=112
  local.get $32
  f64.const 0
  f64.store offset=120
  local.get $32
  f64.const 0
  f64.store offset=128
  local.get $32
  f64.const 0
  f64.store offset=136
  local.get $32
  f64.const 0
  f64.store offset=144
  local.get $32
  f64.const 0
  f64.store offset=152
  local.get $32
  f64.const 0
  f64.store offset=160
  local.get $32
  f64.const 0
  f64.store offset=168
  local.get $32
  f64.const 0
  f64.store offset=176
  local.get $32
  f64.const 0
  f64.store offset=184
  local.get $32
  f64.const 0
  f64.store offset=192
  local.get $32
  f64.const 0
  f64.store offset=200
  local.get $32
  f64.const 0
  f64.store offset=208
  local.get $32
  f64.const 0
  f64.store offset=216
  local.get $32
  f64.const 0
  f64.store offset=224
  local.get $32
  f64.const 0
  f64.store offset=232
  local.get $32
  f64.const 0
  f64.store offset=240
  local.get $32
  f64.const 0
  f64.store offset=248
  local.get $32
  f64.const 0
  f64.store offset=256
  local.get $32
  f64.const 0
  f64.store offset=264
  local.get $32
  f64.const 0
  f64.store offset=272
  local.get $32
  f64.const 0
  f64.store offset=280
  local.get $32
  f64.const 0
  f64.store offset=288
  local.get $32
  f64.const 0
  f64.store offset=296
  local.get $32
  f64.const 0
  f64.store offset=304
  local.get $32
  f64.const 0
  f64.store offset=312
  local.get $32
  f64.const 0
  f64.store offset=320
  local.get $32
  f64.const 0
  f64.store offset=328
  local.get $32
  f64.const 0
  f64.store offset=336
  local.get $32
  f64.const 0
  f64.store offset=344
  local.get $32
  f64.const 0
  f64.store offset=352
  local.get $32
  f64.const 0
  f64.store offset=360
  local.get $32
  f64.const 0
  f64.store offset=368
  local.get $32
  f64.const 0
  f64.store offset=376
  local.get $32
  f64.const 0
  f64.store offset=384
  local.get $32
  f64.const 0
  f64.store offset=392
  local.get $32
  f64.const 0
  f64.store offset=400
  local.get $32
  f64.const 0
  f64.store offset=408
  local.get $32
  f64.const 0
  f64.store offset=416
  local.get $32
  f64.const 0
  f64.store offset=424
  local.get $32
  f64.const 0
  f64.store offset=432
  local.get $32
  f64.const 0
  f64.store offset=440
  local.get $32
  f64.const 0
  f64.store offset=448
  local.get $32
  f64.const 0
  f64.store offset=456
  local.get $32
  f64.const 0
  f64.store offset=464
  local.get $32
  f64.const 0
  f64.store offset=472
  local.get $32
  f64.const 0
  f64.store offset=480
  local.get $32
  f64.const 0
  f64.store offset=488
  local.get $32
  i32.const 0
  i32.store offset=496
  local.get $32
  local.get $0
  f64.store
  local.get $32
  local.get $1
  f64.store offset=8
  local.get $32
  local.get $2
  f64.store offset=16
  local.get $32
  local.get $3
  f64.store offset=40
  local.get $32
  local.get $4
  f64.store offset=24
  local.get $32
  local.get $5
  f64.store offset=32
  local.get $32
  local.get $6
  f64.store offset=48
  local.get $32
  local.get $7
  f64.store offset=56
  local.get $32
  local.get $8
  f64.store offset=64
  local.get $32
  local.get $9
  f64.store offset=72
  local.get $32
  local.get $10
  f64.store offset=80
  local.get $32
  local.get $11
  f64.store offset=88
  local.get $32
  block $__inlined_func$assembly/index/clampSigned$91 (result f64)
   f64.const 1
   local.get $12
   f64.const 1
   f64.gt
   br_if $__inlined_func$assembly/index/clampSigned$91
   drop
   f64.const -1
   local.get $12
   f64.const -1
   f64.lt
   br_if $__inlined_func$assembly/index/clampSigned$91
   drop
   local.get $12
  end
  local.tee $0
  f64.store offset=96
  local.get $32
  local.get $0
  f64.store offset=104
  local.get $32
  local.get $14
  f64.const 5e6
  local.get $14
  f64.const 0
  f64.gt
  select
  f64.store offset=128
  local.get $32
  local.get $15
  f64.const 120
  local.get $15
  f64.const 0
  f64.gt
  select
  f64.store offset=136
  local.get $32
  local.get $16
  f64.const 20
  local.get $16
  f64.const 0
  f64.gt
  select
  f64.store offset=144
  local.get $32
  local.get $17
  f64.const 6
  local.get $17
  f64.const 0
  f64.gt
  select
  f64.store offset=152
  local.get $32
  f64.const 0.5
  f64.store offset=160
  local.get $32
  local.get $18
  f64.const 0.75
  local.get $18
  f64.const 0
  f64.gt
  select
  f64.store offset=168
  local.get $32
  local.get $19
  f64.const 2e5
  local.get $19
  f64.const 0
  f64.gt
  select
  f64.store offset=176
  local.get $32
  local.get $20
  f64.const 0.5
  local.get $20
  f64.const 0
  f64.gt
  select
  f64.store offset=184
  local.get $32
  local.get $21
  f64.const 0.6
  local.get $21
  f64.const 0
  f64.gt
  select
  f64.store offset=192
  block $__inlined_func$assembly/index/clampSigned$104
   local.get $13
   local.get $32
   f64.load offset=192
   local.tee $0
   f64.gt
   br_if $__inlined_func$assembly/index/clampSigned$104
   local.get $13
   local.get $0
   f64.neg
   local.tee $0
   f64.lt
   br_if $__inlined_func$assembly/index/clampSigned$104
   local.get $13
   local.set $0
  end
  local.get $32
  local.get $0
  f64.store offset=120
  local.get $32
  local.get $32
  f64.load offset=120
  f64.store offset=112
  local.get $32
  local.get $22
  f64.const 0.8
  local.get $22
  f64.const 0
  f64.gt
  select
  f64.store offset=200
  local.get $32
  local.get $23
  f64.const 0.5
  local.get $23
  f64.const 0
  f64.gt
  select
  f64.store offset=208
  local.get $32
  local.get $24
  f64.const 1.2
  local.get $24
  f64.const 0
  f64.gt
  select
  f64.store offset=216
  local.get $32
  local.get $25
  f64.const 0.6
  local.get $25
  f64.const 0
  f64.gt
  select
  f64.store offset=224
  local.get $32
  local.get $26
  f64.const 8e5
  local.get $26
  f64.const 0
  f64.gt
  select
  f64.store offset=232
  local.get $32
  local.get $27
  f64.const 15
  local.get $27
  f64.const 0
  f64.gt
  select
  f64.store offset=240
  local.get $32
  local.get $28
  f64.const 0.8
  local.get $28
  f64.const 0
  f64.gt
  select
  f64.store offset=248
  local.get $32
  local.get $29
  f64.const 0.6
  local.get $29
  f64.const 0
  f64.gt
  select
  f64.store offset=256
  local.get $32
  local.get $30
  f64.const 2
  local.get $30
  f64.const 0
  f64.gt
  select
  f64.store offset=264
  local.get $32
  local.get $31
  f64.const 1.6
  local.get $31
  f64.const 0
  f64.gt
  select
  f64.store offset=272
  local.get $32
  local.get $32
  f64.load offset=136
  f64.const 0.02
  f64.mul
  local.get $32
  f64.load offset=152
  f64.mul
  f64.const 0.1
  f64.max
  f64.store offset=280
  local.get $32
  local.get $32
  f64.load offset=136
  f64.const 0.45
  f64.mul
  f64.store offset=288
  local.get $32
  f64.const 6
  f64.store offset=296
  local.get $32
  f64.const 0.6
  f64.store offset=304
  local.get $32
  f64.const 2.5
  f64.store offset=312
  local.get $32
  f64.const 0.25
  f64.store offset=320
  local.get $32
  local.get $32
  f64.load offset=128
  f64.const 0.05
  f64.mul
  f64.store offset=328
  local.get $32
  local.get $32
  f64.load offset=128
  f64.const 0.2
  f64.mul
  f64.store offset=336
  local.get $32
  local.get $32
  f64.load offset=128
  local.get $32
  f64.load offset=136
  f64.mul
  local.get $32
  f64.load offset=136
  f64.mul
  f64.const 0.1
  f64.mul
  f64.const 0.02
  f64.mul
  f64.store offset=344
  local.get $32
  f64.const 0
  f64.store offset=352
  local.get $32
  f64.const 0
  f64.store offset=360
  local.get $32
  f64.const 0
  f64.store offset=368
  local.get $32
  f64.const 0
  f64.store offset=376
  local.get $32
  f64.load offset=200
  local.tee $0
  f64.const 0
  f64.gt
  i32.eqz
  if
   f64.const 0.8
   local.set $0
  end
  local.get $32
  local.get $0
  f64.const 0.7
  local.get $0
  f64.const 0
  f64.gt
  local.tee $33
  select
  f64.store offset=384
  local.get $32
  local.get $0
  f64.const 1.2
  f64.mul
  f64.const 1.1
  local.get $33
  select
  f64.store offset=392
  local.get $32
  local.get $0
  f64.const 0.3
  f64.mul
  f64.const 0.2
  local.get $33
  select
  f64.store offset=400
  local.get $32
  f64.const 1.5
  f64.store offset=408
  local.get $32
  f64.const 1.4
  f64.store offset=416
  local.get $32
  f64.const 0.7
  f64.store offset=424
  local.get $32
  f64.const 0
  f64.store offset=432
  local.get $32
  f64.const 0
  f64.store offset=440
  local.get $32
  f64.const 0
  f64.store offset=448
  local.get $32
  f64.const 0
  f64.store offset=456
  local.get $32
  f64.const 0
  f64.store offset=464
  local.get $32
  f64.const 1
  f64.store offset=472
  local.get $32
  f64.const 0.000015
  f64.store offset=480
  local.get $32
  f64.const 0
  f64.store offset=488
  local.get $32
  i32.const 0
  i32.store offset=496
  local.get $32
 )
 (func $assembly/index/createVessel@varargs (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (param $4 f64) (param $5 f64) (param $6 f64) (param $7 f64) (param $8 f64) (param $9 f64) (param $10 f64) (param $11 f64) (param $12 f64) (param $13 f64) (param $14 f64) (param $15 f64) (param $16 f64) (param $17 f64) (param $18 f64) (param $19 f64) (param $20 f64) (param $21 f64) (param $22 f64) (param $23 f64) (param $24 f64) (param $25 f64) (param $26 f64) (param $27 f64) (param $28 f64) (param $29 f64) (param $30 f64) (param $31 f64) (result i32)
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
                f64.const 0.75
                local.set $18
               end
               f64.const 2e5
               local.set $19
              end
              f64.const 0.5
              local.set $20
             end
             f64.const 0.6
             local.set $21
            end
            f64.const 0.8
            local.set $22
           end
           f64.const 0.5
           local.set $23
          end
          f64.const 1.2
          local.set $24
         end
         f64.const 0.6
         local.set $25
        end
        f64.const 8e5
        local.set $26
       end
       f64.const 15
       local.set $27
      end
      f64.const 0.8
      local.set $28
     end
     f64.const 0.6
     local.set $29
    end
    f64.const 2
    local.set $30
   end
   f64.const 1.6
   local.set $31
  end
  global.get $assembly/index/globalVessel
  i32.eqz
  if
   local.get $0
   local.get $1
   local.get $2
   local.get $3
   local.get $4
   local.get $5
   local.get $6
   local.get $7
   local.get $8
   local.get $9
   local.get $10
   local.get $11
   block $__inlined_func$assembly/index/clamp01$156 (result f64)
    f64.const 0
    local.get $12
    f64.const 0
    f64.lt
    br_if $__inlined_func$assembly/index/clamp01$156
    drop
    f64.const 1
    local.get $12
    f64.const 1
    f64.gt
    br_if $__inlined_func$assembly/index/clamp01$156
    drop
    local.get $12
   end
   local.get $13
   local.get $14
   local.get $15
   local.get $16
   local.get $17
   local.get $18
   local.get $19
   local.get $20
   local.get $21
   local.get $22
   local.get $23
   local.get $24
   local.get $25
   local.get $26
   local.get $27
   local.get $28
   local.get $29
   local.get $30
   local.get $31
   call $assembly/index/VesselState#constructor
   global.set $assembly/index/globalVessel
  end
  global.get $assembly/index/globalVessel
 )
 (func $assembly/index/destroyVessel (param $0 i32)
  i32.const 0
  global.set $assembly/index/globalVessel
 )
 (func $assembly/index/getVesselParamsBufferPtr (result i32)
  global.get $assembly/index/vesselParamsBuffer
 )
 (func $assembly/index/getVesselParamsBufferCapacity (result i32)
  i32.const 64
 )
 (func $assembly/index/setVesselParams (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32)
  (local $4 f64)
  (local $5 f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  local.get $1
  i32.store offset=496
  local.get $2
  i32.eqz
  local.get $3
  i32.const 0
  i32.le_s
  i32.or
  if
   return
  end
  local.get $1
  if
   return
  end
  block $__inlined_func$assembly/index/readParam$452 (result f64)
   local.get $0
   f64.load offset=128
   local.tee $4
   local.get $3
   i32.const 0
   local.get $3
   i32.const 0
   i32.gt_s
   select
   local.tee $1
   i32.const 0
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$452
   drop
   local.get $2
   f64.load
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $4
   f64.store offset=128
  end
  block $__inlined_func$assembly/index/readParam$453 (result f64)
   local.get $0
   f64.load offset=136
   local.tee $4
   local.get $1
   i32.const 1
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$453
   drop
   local.get $2
   f64.load offset=8
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $4
   f64.store offset=136
  end
  block $__inlined_func$assembly/index/readParam$454 (result f64)
   local.get $0
   f64.load offset=144
   local.tee $4
   local.get $1
   i32.const 2
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$454
   drop
   local.get $2
   f64.load offset=16
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $4
   f64.store offset=144
  end
  block $__inlined_func$assembly/index/readParam$455 (result f64)
   local.get $0
   f64.load offset=152
   local.tee $4
   local.get $1
   i32.const 3
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$455
   drop
   local.get $2
   f64.load offset=24
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $4
   f64.store offset=152
  end
  block $__inlined_func$assembly/index/readParam$456 (result f64)
   local.get $0
   f64.load offset=168
   local.tee $4
   local.get $1
   i32.const 4
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$456
   drop
   local.get $2
   f64.load offset=32
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $4
   f64.store offset=168
  end
  block $__inlined_func$assembly/index/readParam$457 (result f64)
   local.get $0
   f64.load offset=176
   local.tee $4
   local.get $1
   i32.const 5
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$457
   drop
   local.get $2
   f64.load offset=40
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=176
  end
  block $__inlined_func$assembly/index/readParam$458 (result f64)
   local.get $0
   f64.load offset=184
   local.tee $4
   local.get $1
   i32.const 6
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$458
   drop
   local.get $2
   f64.load offset=48
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $4
   f64.store offset=184
  end
  block $__inlined_func$assembly/index/readParam$459 (result f64)
   local.get $0
   f64.load offset=192
   local.tee $4
   local.get $1
   i32.const 7
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$459
   drop
   local.get $2
   f64.load offset=56
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $4
   f64.store offset=192
  end
  block $__inlined_func$assembly/index/readParam$460 (result f64)
   local.get $0
   f64.load offset=200
   local.tee $4
   local.get $1
   i32.const 8
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$460
   drop
   local.get $2
   i32.const -64
   i32.sub
   f64.load
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=200
  end
  block $__inlined_func$assembly/index/readParam$461 (result f64)
   local.get $0
   f64.load offset=208
   local.tee $4
   local.get $1
   i32.const 9
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$461
   drop
   local.get $2
   f64.load offset=72
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=208
  end
  block $__inlined_func$assembly/index/readParam$462 (result f64)
   local.get $0
   f64.load offset=216
   local.tee $4
   local.get $1
   i32.const 10
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$462
   drop
   local.get $2
   f64.load offset=80
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=216
  end
  block $__inlined_func$assembly/index/readParam$463 (result f64)
   local.get $0
   f64.load offset=224
   local.tee $4
   local.get $1
   i32.const 11
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$463
   drop
   local.get $2
   f64.load offset=88
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=224
  end
  block $__inlined_func$assembly/index/readParam$464 (result f64)
   local.get $0
   f64.load offset=232
   local.tee $4
   local.get $1
   i32.const 12
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$464
   drop
   local.get $2
   f64.load offset=96
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=232
  end
  block $__inlined_func$assembly/index/readParam$465 (result f64)
   local.get $0
   f64.load offset=240
   local.tee $4
   local.get $1
   i32.const 13
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$465
   drop
   local.get $2
   f64.load offset=104
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $4
   f64.store offset=240
  end
  block $__inlined_func$assembly/index/readParam$466 (result f64)
   local.get $0
   f64.load offset=248
   local.tee $4
   local.get $1
   i32.const 14
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$466
   drop
   local.get $2
   f64.load offset=112
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=248
  end
  block $__inlined_func$assembly/index/readParam$467 (result f64)
   local.get $0
   f64.load offset=256
   local.tee $4
   local.get $1
   i32.const 15
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$467
   drop
   local.get $2
   f64.load offset=120
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=256
  end
  block $__inlined_func$assembly/index/readParam$468 (result f64)
   local.get $0
   f64.load offset=264
   local.tee $4
   local.get $1
   i32.const 16
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$468
   drop
   local.get $2
   f64.load offset=128
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=264
  end
  block $__inlined_func$assembly/index/readParam$469 (result f64)
   local.get $0
   f64.load offset=272
   local.tee $4
   local.get $1
   i32.const 17
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$469
   drop
   local.get $2
   f64.load offset=136
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=272
  end
  block $__inlined_func$assembly/index/readParam$470 (result f64)
   local.get $0
   f64.load offset=280
   local.tee $4
   local.get $1
   i32.const 18
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$470
   drop
   local.get $2
   f64.load offset=144
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $4
   f64.store offset=280
  end
  block $__inlined_func$assembly/index/readParam$471 (result f64)
   local.get $0
   f64.load offset=288
   local.tee $4
   local.get $1
   i32.const 19
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$471
   drop
   local.get $2
   f64.load offset=152
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $4
   f64.store offset=288
  end
  block $__inlined_func$assembly/index/readParam$472 (result f64)
   local.get $0
   f64.load offset=296
   local.tee $4
   local.get $1
   i32.const 20
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$472
   drop
   local.get $2
   f64.load offset=160
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $4
   f64.store offset=296
  end
  block $__inlined_func$assembly/index/readParam$473 (result f64)
   local.get $0
   f64.load offset=304
   local.tee $4
   local.get $1
   i32.const 21
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$473
   drop
   local.get $2
   f64.load offset=168
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=304
  end
  block $__inlined_func$assembly/index/readParam$474 (result f64)
   local.get $0
   f64.load offset=312
   local.tee $4
   local.get $1
   i32.const 22
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$474
   drop
   local.get $2
   f64.load offset=176
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $4
   f64.store offset=312
  end
  block $__inlined_func$assembly/index/readParam$475 (result f64)
   local.get $0
   f64.load offset=320
   local.tee $4
   local.get $1
   i32.const 23
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$475
   drop
   local.get $2
   f64.load offset=184
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $4
   f64.store offset=320
  end
  block $__inlined_func$assembly/index/readParam$476 (result f64)
   local.get $0
   f64.load offset=328
   local.tee $4
   local.get $1
   i32.const 24
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$476
   drop
   local.get $2
   f64.load offset=192
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=328
  end
  block $__inlined_func$assembly/index/readParam$477 (result f64)
   local.get $0
   f64.load offset=336
   local.tee $4
   local.get $1
   i32.const 25
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$477
   drop
   local.get $2
   f64.load offset=200
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=336
  end
  block $__inlined_func$assembly/index/readParam$478 (result f64)
   local.get $0
   f64.load offset=344
   local.tee $4
   local.get $1
   i32.const 26
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$478
   drop
   local.get $2
   f64.load offset=208
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=344
  end
  local.get $0
  block $__inlined_func$assembly/index/readParam$479 (result f64)
   local.get $0
   f64.load offset=352
   local.tee $4
   local.get $1
   i32.const 27
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$479
   drop
   local.get $2
   f64.load offset=216
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  f64.store offset=352
  local.get $0
  block $__inlined_func$assembly/index/readParam$480 (result f64)
   local.get $0
   f64.load offset=360
   local.tee $4
   local.get $1
   i32.const 28
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$480
   drop
   local.get $2
   f64.load offset=224
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  f64.store offset=360
  local.get $0
  block $__inlined_func$assembly/index/readParam$481 (result f64)
   local.get $0
   f64.load offset=368
   local.tee $4
   local.get $1
   i32.const 29
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$481
   drop
   local.get $2
   f64.load offset=232
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  f64.store offset=368
  local.get $0
  block $__inlined_func$assembly/index/readParam$482 (result f64)
   local.get $0
   f64.load offset=376
   local.tee $4
   local.get $1
   i32.const 30
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$482
   drop
   local.get $2
   f64.load offset=240
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  f64.store offset=376
  block $__inlined_func$assembly/index/readParam$483 (result f64)
   local.get $0
   f64.load offset=384
   local.tee $4
   local.get $1
   i32.const 31
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$483
   drop
   local.get $2
   f64.load offset=248
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $4
   f64.store offset=384
  end
  block $__inlined_func$assembly/index/readParam$484 (result f64)
   local.get $0
   f64.load offset=392
   local.tee $4
   local.get $1
   i32.const 32
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$484
   drop
   local.get $2
   f64.load offset=256
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $4
   f64.store offset=392
  end
  block $__inlined_func$assembly/index/readParam$485 (result f64)
   local.get $0
   f64.load offset=400
   local.tee $4
   local.get $1
   i32.const 33
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$485
   drop
   local.get $2
   f64.load offset=264
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $4
   f64.store offset=400
  end
  block $__inlined_func$assembly/index/readParam$486 (result f64)
   local.get $0
   f64.load offset=408
   local.tee $4
   local.get $1
   i32.const 34
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$486
   drop
   local.get $2
   f64.load offset=272
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=408
  end
  block $__inlined_func$assembly/index/readParam$487 (result f64)
   local.get $0
   f64.load offset=416
   local.tee $4
   local.get $1
   i32.const 35
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$487
   drop
   local.get $2
   f64.load offset=280
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=416
  end
  block $__inlined_func$assembly/index/readParam$488 (result f64)
   local.get $0
   f64.load offset=424
   local.tee $4
   local.get $1
   i32.const 36
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$488
   drop
   local.get $2
   f64.load offset=288
   local.tee $5
   local.get $4
   local.get $5
   local.get $5
   f64.eq
   select
  end
  local.tee $4
  f64.const 0
  f64.ge
  if
   local.get $0
   local.get $4
   f64.store offset=424
  end
  block $__inlined_func$assembly/index/clampSigned$235
   local.get $0
   f64.load offset=192
   local.tee $4
   local.get $0
   f64.load offset=120
   local.tee $5
   f64.lt
   br_if $__inlined_func$assembly/index/clampSigned$235
   local.get $5
   local.get $4
   f64.neg
   local.tee $4
   f64.lt
   br_if $__inlined_func$assembly/index/clampSigned$235
   local.get $5
   local.set $4
  end
  local.get $0
  local.get $4
  f64.store offset=120
  block $__inlined_func$assembly/index/clampSigned$239
   local.get $0
   f64.load offset=192
   local.tee $4
   local.get $0
   f64.load offset=112
   local.tee $5
   f64.lt
   br_if $__inlined_func$assembly/index/clampSigned$239
   local.get $5
   local.get $4
   f64.neg
   local.tee $4
   f64.lt
   br_if $__inlined_func$assembly/index/clampSigned$239
   local.get $5
   local.set $4
  end
  local.get $0
  local.get $4
  f64.store offset=112
 )
 (func $assembly/index/getEnvironmentBufferPtr (result i32)
  global.get $assembly/index/environmentBuffer
 )
 (func $assembly/index/getEnvironmentBufferCapacity (result i32)
  i32.const 16
 )
 (func $assembly/index/setEnvironment (param $0 i32) (param $1 i32)
  (local $2 f64)
  (local $3 f64)
  local.get $0
  i32.eqz
  local.get $1
  i32.const 0
  i32.le_s
  i32.or
  if
   return
  end
  global.get $assembly/index/globalEnvironment
  block $__inlined_func$assembly/index/readParam$489 (result f64)
   global.get $assembly/index/globalEnvironment
   f64.load
   local.tee $2
   local.get $1
   i32.const 0
   local.get $1
   i32.const 0
   i32.gt_s
   select
   local.tee $1
   i32.const 0
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$489
   drop
   local.get $0
   f64.load
   local.tee $3
   local.get $2
   local.get $3
   local.get $3
   f64.eq
   select
  end
  f64.store
  global.get $assembly/index/globalEnvironment
  block $__inlined_func$assembly/index/readParam$490 (result f64)
   global.get $assembly/index/globalEnvironment
   f64.load offset=8
   local.tee $2
   local.get $1
   i32.const 1
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$490
   drop
   local.get $0
   f64.load offset=8
   local.tee $3
   local.get $2
   local.get $3
   local.get $3
   f64.eq
   select
  end
  f64.store offset=8
  global.get $assembly/index/globalEnvironment
  block $__inlined_func$assembly/index/readParam$491 (result f64)
   global.get $assembly/index/globalEnvironment
   f64.load offset=16
   local.tee $2
   local.get $1
   i32.const 2
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$491
   drop
   local.get $0
   f64.load offset=16
   local.tee $3
   local.get $2
   local.get $3
   local.get $3
   f64.eq
   select
  end
  f64.store offset=16
  global.get $assembly/index/globalEnvironment
  block $__inlined_func$assembly/index/readParam$492 (result f64)
   global.get $assembly/index/globalEnvironment
   f64.load offset=24
   local.tee $2
   local.get $1
   i32.const 3
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$492
   drop
   local.get $0
   f64.load offset=24
   local.tee $3
   local.get $2
   local.get $3
   local.get $3
   f64.eq
   select
  end
  f64.store offset=24
  global.get $assembly/index/globalEnvironment
  block $__inlined_func$assembly/index/readParam$493 (result f64)
   global.get $assembly/index/globalEnvironment
   f64.load offset=32
   local.tee $2
   local.get $1
   i32.const 4
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$493
   drop
   local.get $0
   f64.load offset=32
   local.tee $3
   local.get $2
   local.get $3
   local.get $3
   f64.eq
   select
  end
  f64.store offset=32
  global.get $assembly/index/globalEnvironment
  block $__inlined_func$assembly/index/readParam$494 (result f64)
   global.get $assembly/index/globalEnvironment
   f64.load offset=40
   local.tee $2
   local.get $1
   i32.const 5
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$494
   drop
   local.get $0
   f64.load offset=40
   local.tee $3
   local.get $2
   local.get $3
   local.get $3
   f64.eq
   select
  end
  f64.store offset=40
  global.get $assembly/index/globalEnvironment
  block $__inlined_func$assembly/index/readParam$495 (result f64)
   global.get $assembly/index/globalEnvironment
   f64.load offset=48
   local.tee $2
   local.get $1
   i32.const 6
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$495
   drop
   local.get $0
   f64.load offset=48
   local.tee $3
   local.get $2
   local.get $3
   local.get $3
   f64.eq
   select
  end
  f64.store offset=48
  global.get $assembly/index/globalEnvironment
  block $__inlined_func$assembly/index/readParam$496 (result f64)
   global.get $assembly/index/globalEnvironment
   f64.load offset=56
   local.tee $2
   local.get $1
   i32.const 7
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$496
   drop
   local.get $0
   f64.load offset=56
   local.tee $3
   local.get $2
   local.get $3
   local.get $3
   f64.eq
   select
  end
  f64.store offset=56
  global.get $assembly/index/globalEnvironment
  block $__inlined_func$assembly/index/readParam$497 (result f64)
   global.get $assembly/index/globalEnvironment
   f64.load offset=64
   local.tee $2
   local.get $1
   i32.const 8
   i32.le_s
   br_if $__inlined_func$assembly/index/readParam$497
   drop
   local.get $0
   i32.const -64
   i32.sub
   f64.load
   local.tee $3
   local.get $2
   local.get $3
   local.get $3
   f64.eq
   select
  end
  f64.store offset=64
 )
 (func $~lib/math/pio2_large_quot (param $0 i64) (result i32)
  (local $1 i64)
  (local $2 i64)
  (local $3 i64)
  (local $4 i32)
  (local $5 f64)
  (local $6 i64)
  (local $7 i64)
  (local $8 i64)
  (local $9 i64)
  (local $10 i64)
  (local $11 i64)
  (local $12 i64)
  local.get $0
  i64.const 9223372036854775807
  i64.and
  i64.const 52
  i64.shr_u
  i64.const 1045
  i64.sub
  local.tee $1
  i64.const 63
  i64.and
  local.set $6
  local.get $1
  i64.const 6
  i64.shr_s
  i32.wrap_i64
  i32.const 3
  i32.shl
  i32.const 1408
  i32.add
  local.tee $4
  i64.load
  local.set $3
  local.get $4
  i64.load offset=8
  local.set $2
  local.get $4
  i64.load offset=16
  local.set $1
  local.get $6
  i64.const 0
  i64.ne
  if
   local.get $3
   local.get $6
   i64.shl
   local.get $2
   i64.const 64
   local.get $6
   i64.sub
   local.tee $7
   i64.shr_u
   i64.or
   local.set $3
   local.get $2
   local.get $6
   i64.shl
   local.get $1
   local.get $7
   i64.shr_u
   i64.or
   local.set $2
   local.get $1
   local.get $6
   i64.shl
   local.get $4
   i64.load offset=24
   local.get $7
   i64.shr_u
   i64.or
   local.set $1
  end
  local.get $0
  i64.const 4503599627370495
  i64.and
  i64.const 4503599627370496
  i64.or
  local.tee $6
  i64.const 4294967295
  i64.and
  local.set $7
  local.get $2
  i64.const 4294967295
  i64.and
  local.tee $8
  local.get $6
  i64.const 32
  i64.shr_u
  local.tee $9
  i64.mul
  local.get $2
  i64.const 32
  i64.shr_u
  local.tee $2
  local.get $7
  i64.mul
  local.get $7
  local.get $8
  i64.mul
  local.tee $7
  i64.const 32
  i64.shr_u
  i64.add
  local.tee $8
  i64.const 4294967295
  i64.and
  i64.add
  local.set $10
  local.get $2
  local.get $9
  i64.mul
  local.get $8
  i64.const 32
  i64.shr_u
  i64.add
  local.get $10
  i64.const 32
  i64.shr_u
  i64.add
  global.set $~lib/math/res128_hi
  local.get $9
  local.get $1
  i64.const 32
  i64.shr_u
  i64.mul
  local.tee $1
  local.get $7
  i64.const 4294967295
  i64.and
  local.get $10
  i64.const 32
  i64.shl
  i64.add
  i64.add
  local.tee $2
  local.get $1
  i64.lt_u
  i64.extend_i32_u
  global.get $~lib/math/res128_hi
  local.get $3
  local.get $6
  i64.mul
  i64.add
  i64.add
  local.tee $3
  i64.const 2
  i64.shl
  local.get $2
  i64.const 62
  i64.shr_u
  i64.or
  local.tee $6
  i64.const 63
  i64.shr_s
  local.tee $7
  local.get $2
  i64.const 2
  i64.shl
  i64.xor
  local.set $2
  local.get $6
  local.get $7
  i64.const 1
  i64.shr_s
  i64.xor
  local.tee $1
  i64.clz
  local.set $8
  local.get $1
  local.get $8
  i64.shl
  local.get $2
  i64.const 64
  local.get $8
  i64.sub
  i64.shr_u
  i64.or
  local.tee $9
  i64.const 4294967295
  i64.and
  local.set $1
  local.get $9
  i64.const 32
  i64.shr_u
  local.tee $10
  i64.const 560513588
  i64.mul
  local.get $1
  i64.const 3373259426
  i64.mul
  local.get $1
  i64.const 560513588
  i64.mul
  local.tee $11
  i64.const 32
  i64.shr_u
  i64.add
  local.tee $12
  i64.const 4294967295
  i64.and
  i64.add
  local.set $1
  local.get $10
  i64.const 3373259426
  i64.mul
  local.get $12
  i64.const 32
  i64.shr_u
  i64.add
  local.get $1
  i64.const 32
  i64.shr_u
  i64.add
  global.set $~lib/math/res128_hi
  local.get $9
  f64.convert_i64_u
  f64.const 3.753184150245214e-04
  f64.mul
  local.get $2
  local.get $8
  i64.shl
  f64.convert_i64_u
  f64.const 3.834951969714103e-04
  f64.mul
  f64.add
  i64.trunc_sat_f64_u
  local.tee $2
  local.get $11
  i64.const 4294967295
  i64.and
  local.get $1
  i64.const 32
  i64.shl
  i64.add
  local.tee $1
  i64.gt_u
  i64.extend_i32_u
  global.get $~lib/math/res128_hi
  local.tee $9
  i64.const 11
  i64.shr_u
  i64.add
  f64.convert_i64_u
  global.set $~lib/math/rempio2_y0
  local.get $9
  i64.const 53
  i64.shl
  local.get $1
  i64.const 11
  i64.shr_u
  i64.or
  local.get $2
  i64.add
  f64.convert_i64_u
  f64.const 5.421010862427522e-20
  f64.mul
  global.set $~lib/math/rempio2_y1
  global.get $~lib/math/rempio2_y0
  i64.const 4372995238176751616
  local.get $8
  i64.const 52
  i64.shl
  i64.sub
  local.get $0
  local.get $6
  i64.xor
  i64.const -9223372036854775808
  i64.and
  i64.or
  f64.reinterpret_i64
  local.tee $5
  f64.mul
  global.set $~lib/math/rempio2_y0
  global.get $~lib/math/rempio2_y1
  local.get $5
  f64.mul
  global.set $~lib/math/rempio2_y1
  local.get $3
  i64.const 62
  i64.shr_s
  local.get $7
  i64.sub
  i32.wrap_i64
 )
 (func $~lib/math/NativeMath.cos (param $0 f64) (result f64)
  (local $1 f64)
  (local $2 f64)
  (local $3 i32)
  (local $4 i32)
  (local $5 i64)
  (local $6 i32)
  (local $7 f64)
  (local $8 f64)
  (local $9 f64)
  local.get $0
  i64.reinterpret_f64
  local.tee $5
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.tee $3
  i32.const 31
  i32.shr_u
  local.set $6
  local.get $3
  i32.const 2147483647
  i32.and
  local.tee $3
  i32.const 1072243195
  i32.le_u
  if
   local.get $3
   i32.const 1044816030
   i32.lt_u
   if
    f64.const 1
    return
   end
   local.get $0
   local.get $0
   f64.mul
   local.tee $1
   local.get $1
   f64.mul
   local.set $2
   f64.const 1
   local.get $1
   f64.const 0.5
   f64.mul
   local.tee $7
   f64.sub
   local.tee $8
   f64.const 1
   local.get $8
   f64.sub
   local.get $7
   f64.sub
   local.get $1
   local.get $1
   local.get $1
   local.get $1
   f64.const 2.480158728947673e-05
   f64.mul
   f64.const -0.001388888888887411
   f64.add
   f64.mul
   f64.const 0.0416666666666666
   f64.add
   f64.mul
   local.get $2
   local.get $2
   f64.mul
   local.get $1
   local.get $1
   f64.const -1.1359647557788195e-11
   f64.mul
   f64.const 2.087572321298175e-09
   f64.add
   f64.mul
   f64.const -2.7557314351390663e-07
   f64.add
   f64.mul
   f64.add
   f64.mul
   local.get $0
   f64.const 0
   f64.mul
   f64.sub
   f64.add
   f64.add
   return
  end
  local.get $3
  i32.const 2146435072
  i32.ge_u
  if
   local.get $0
   local.get $0
   f64.sub
   return
  end
  block $~lib/math/rempio2|inlined.0 (result i32)
   local.get $5
   i64.const 32
   i64.shr_u
   i32.wrap_i64
   i32.const 2147483647
   i32.and
   local.tee $4
   i32.const 1073928572
   i32.lt_u
   if
    i32.const 1
    local.set $3
    local.get $6
    if (result f64)
     local.get $0
     f64.const 1.5707963267341256
     f64.add
     local.set $0
     i32.const -1
     local.set $3
     local.get $4
     i32.const 1073291771
     i32.ne
     if (result f64)
      local.get $0
      local.get $0
      f64.const 6.077100506506192e-11
      f64.add
      local.tee $0
      f64.sub
      f64.const 6.077100506506192e-11
      f64.add
     else
      local.get $0
      f64.const 6.077100506303966e-11
      f64.add
      local.tee $1
      f64.const 2.0222662487959506e-21
      f64.add
      local.set $0
      local.get $1
      local.get $0
      f64.sub
      f64.const 2.0222662487959506e-21
      f64.add
     end
    else
     local.get $0
     f64.const -1.5707963267341256
     f64.add
     local.set $0
     local.get $4
     i32.const 1073291771
     i32.ne
     if (result f64)
      local.get $0
      local.get $0
      f64.const -6.077100506506192e-11
      f64.add
      local.tee $0
      f64.sub
      f64.const -6.077100506506192e-11
      f64.add
     else
      local.get $0
      f64.const -6.077100506303966e-11
      f64.add
      local.tee $1
      f64.const -2.0222662487959506e-21
      f64.add
      local.set $0
      local.get $1
      local.get $0
      f64.sub
      f64.const -2.0222662487959506e-21
      f64.add
     end
    end
    local.set $1
    local.get $0
    global.set $~lib/math/rempio2_y0
    local.get $1
    global.set $~lib/math/rempio2_y1
    local.get $3
    br $~lib/math/rempio2|inlined.0
   end
   local.get $4
   i32.const 1094263291
   i32.lt_u
   if
    local.get $4
    i32.const 20
    i32.shr_u
    local.tee $3
    local.get $0
    local.get $0
    f64.const 0.6366197723675814
    f64.mul
    f64.nearest
    local.tee $7
    f64.const 1.5707963267341256
    f64.mul
    f64.sub
    local.tee $0
    local.get $7
    f64.const 6.077100506506192e-11
    f64.mul
    local.tee $2
    f64.sub
    local.tee $1
    i64.reinterpret_f64
    i64.const 32
    i64.shr_u
    i32.wrap_i64
    i32.const 20
    i32.shr_u
    i32.const 2047
    i32.and
    i32.sub
    i32.const 16
    i32.gt_u
    if
     local.get $7
     f64.const 2.0222662487959506e-21
     f64.mul
     local.get $0
     local.get $0
     local.get $7
     f64.const 6.077100506303966e-11
     f64.mul
     local.tee $1
     f64.sub
     local.tee $0
     f64.sub
     local.get $1
     f64.sub
     f64.sub
     local.set $2
     local.get $3
     local.get $0
     local.get $2
     f64.sub
     local.tee $1
     i64.reinterpret_f64
     i64.const 32
     i64.shr_u
     i32.wrap_i64
     i32.const 20
     i32.shr_u
     i32.const 2047
     i32.and
     i32.sub
     i32.const 49
     i32.gt_u
     if
      local.get $7
      f64.const 8.4784276603689e-32
      f64.mul
      local.get $0
      local.get $0
      local.get $7
      f64.const 2.0222662487111665e-21
      f64.mul
      local.tee $1
      f64.sub
      local.tee $0
      f64.sub
      local.get $1
      f64.sub
      f64.sub
      local.set $2
      local.get $0
      local.get $2
      f64.sub
      local.set $1
     end
    end
    local.get $1
    global.set $~lib/math/rempio2_y0
    local.get $0
    local.get $1
    f64.sub
    local.get $2
    f64.sub
    global.set $~lib/math/rempio2_y1
    local.get $7
    i32.trunc_sat_f64_s
    br $~lib/math/rempio2|inlined.0
   end
   i32.const 0
   local.get $5
   call $~lib/math/pio2_large_quot
   local.tee $3
   i32.sub
   local.get $3
   local.get $6
   select
  end
  local.set $3
  global.get $~lib/math/rempio2_y0
  local.set $1
  global.get $~lib/math/rempio2_y1
  local.set $2
  local.get $3
  i32.const 1
  i32.and
  if (result f64)
   local.get $1
   local.get $1
   f64.mul
   local.tee $0
   local.get $1
   f64.mul
   local.set $7
   local.get $1
   local.get $0
   local.get $2
   f64.const 0.5
   f64.mul
   local.get $7
   local.get $0
   local.get $0
   f64.const 2.7557313707070068e-06
   f64.mul
   f64.const -1.984126982985795e-04
   f64.add
   f64.mul
   f64.const 0.00833333333332249
   f64.add
   local.get $0
   local.get $0
   local.get $0
   f64.mul
   f64.mul
   local.get $0
   f64.const 1.58969099521155e-10
   f64.mul
   f64.const -2.5050760253406863e-08
   f64.add
   f64.mul
   f64.add
   f64.mul
   f64.sub
   f64.mul
   local.get $2
   f64.sub
   local.get $7
   f64.const -0.16666666666666632
   f64.mul
   f64.sub
   f64.sub
  else
   local.get $1
   local.get $1
   f64.mul
   local.tee $7
   local.get $7
   f64.mul
   local.set $8
   f64.const 1
   local.get $7
   f64.const 0.5
   f64.mul
   local.tee $0
   f64.sub
   local.tee $9
   f64.const 1
   local.get $9
   f64.sub
   local.get $0
   f64.sub
   local.get $7
   local.get $7
   local.get $7
   local.get $7
   f64.const 2.480158728947673e-05
   f64.mul
   f64.const -0.001388888888887411
   f64.add
   f64.mul
   f64.const 0.0416666666666666
   f64.add
   f64.mul
   local.get $8
   local.get $8
   f64.mul
   local.get $7
   local.get $7
   f64.const -1.1359647557788195e-11
   f64.mul
   f64.const 2.087572321298175e-09
   f64.add
   f64.mul
   f64.const -2.7557314351390663e-07
   f64.add
   f64.mul
   f64.add
   f64.mul
   local.get $1
   local.get $2
   f64.mul
   f64.sub
   f64.add
   f64.add
  end
  local.tee $0
  f64.neg
  local.get $0
  local.get $3
  i32.const 1
  i32.add
  i32.const 2
  i32.and
  select
 )
 (func $~lib/math/NativeMath.sin (param $0 f64) (result f64)
  (local $1 f64)
  (local $2 f64)
  (local $3 i32)
  (local $4 i32)
  (local $5 i64)
  (local $6 i32)
  (local $7 f64)
  (local $8 f64)
  (local $9 f64)
  local.get $0
  i64.reinterpret_f64
  local.tee $5
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.tee $3
  i32.const 31
  i32.shr_u
  local.set $6
  local.get $3
  i32.const 2147483647
  i32.and
  local.tee $3
  i32.const 1072243195
  i32.le_u
  if
   local.get $3
   i32.const 1045430272
   i32.lt_u
   if
    local.get $0
    return
   end
   local.get $0
   local.get $0
   local.get $0
   f64.mul
   local.tee $1
   local.get $0
   f64.mul
   local.get $1
   local.get $1
   local.get $1
   f64.const 2.7557313707070068e-06
   f64.mul
   f64.const -1.984126982985795e-04
   f64.add
   f64.mul
   f64.const 0.00833333333332249
   f64.add
   local.get $1
   local.get $1
   local.get $1
   f64.mul
   f64.mul
   local.get $1
   f64.const 1.58969099521155e-10
   f64.mul
   f64.const -2.5050760253406863e-08
   f64.add
   f64.mul
   f64.add
   f64.mul
   f64.const -0.16666666666666632
   f64.add
   f64.mul
   f64.add
   return
  end
  local.get $3
  i32.const 2146435072
  i32.ge_u
  if
   local.get $0
   local.get $0
   f64.sub
   return
  end
  block $~lib/math/rempio2|inlined.1 (result i32)
   local.get $5
   i64.const 32
   i64.shr_u
   i32.wrap_i64
   i32.const 2147483647
   i32.and
   local.tee $4
   i32.const 1073928572
   i32.lt_u
   if
    i32.const 1
    local.set $3
    local.get $6
    if (result f64)
     local.get $0
     f64.const 1.5707963267341256
     f64.add
     local.set $0
     i32.const -1
     local.set $3
     local.get $4
     i32.const 1073291771
     i32.ne
     if (result f64)
      local.get $0
      local.get $0
      f64.const 6.077100506506192e-11
      f64.add
      local.tee $0
      f64.sub
      f64.const 6.077100506506192e-11
      f64.add
     else
      local.get $0
      f64.const 6.077100506303966e-11
      f64.add
      local.tee $1
      f64.const 2.0222662487959506e-21
      f64.add
      local.set $0
      local.get $1
      local.get $0
      f64.sub
      f64.const 2.0222662487959506e-21
      f64.add
     end
    else
     local.get $0
     f64.const -1.5707963267341256
     f64.add
     local.set $0
     local.get $4
     i32.const 1073291771
     i32.ne
     if (result f64)
      local.get $0
      local.get $0
      f64.const -6.077100506506192e-11
      f64.add
      local.tee $0
      f64.sub
      f64.const -6.077100506506192e-11
      f64.add
     else
      local.get $0
      f64.const -6.077100506303966e-11
      f64.add
      local.tee $1
      f64.const -2.0222662487959506e-21
      f64.add
      local.set $0
      local.get $1
      local.get $0
      f64.sub
      f64.const -2.0222662487959506e-21
      f64.add
     end
    end
    local.set $1
    local.get $0
    global.set $~lib/math/rempio2_y0
    local.get $1
    global.set $~lib/math/rempio2_y1
    local.get $3
    br $~lib/math/rempio2|inlined.1
   end
   local.get $4
   i32.const 1094263291
   i32.lt_u
   if
    local.get $4
    i32.const 20
    i32.shr_u
    local.tee $3
    local.get $0
    local.get $0
    f64.const 0.6366197723675814
    f64.mul
    f64.nearest
    local.tee $7
    f64.const 1.5707963267341256
    f64.mul
    f64.sub
    local.tee $0
    local.get $7
    f64.const 6.077100506506192e-11
    f64.mul
    local.tee $2
    f64.sub
    local.tee $1
    i64.reinterpret_f64
    i64.const 32
    i64.shr_u
    i32.wrap_i64
    i32.const 20
    i32.shr_u
    i32.const 2047
    i32.and
    i32.sub
    i32.const 16
    i32.gt_u
    if
     local.get $7
     f64.const 2.0222662487959506e-21
     f64.mul
     local.get $0
     local.get $0
     local.get $7
     f64.const 6.077100506303966e-11
     f64.mul
     local.tee $1
     f64.sub
     local.tee $0
     f64.sub
     local.get $1
     f64.sub
     f64.sub
     local.set $2
     local.get $3
     local.get $0
     local.get $2
     f64.sub
     local.tee $1
     i64.reinterpret_f64
     i64.const 32
     i64.shr_u
     i32.wrap_i64
     i32.const 20
     i32.shr_u
     i32.const 2047
     i32.and
     i32.sub
     i32.const 49
     i32.gt_u
     if
      local.get $7
      f64.const 8.4784276603689e-32
      f64.mul
      local.get $0
      local.get $0
      local.get $7
      f64.const 2.0222662487111665e-21
      f64.mul
      local.tee $1
      f64.sub
      local.tee $0
      f64.sub
      local.get $1
      f64.sub
      f64.sub
      local.set $2
      local.get $0
      local.get $2
      f64.sub
      local.set $1
     end
    end
    local.get $1
    global.set $~lib/math/rempio2_y0
    local.get $0
    local.get $1
    f64.sub
    local.get $2
    f64.sub
    global.set $~lib/math/rempio2_y1
    local.get $7
    i32.trunc_sat_f64_s
    br $~lib/math/rempio2|inlined.1
   end
   i32.const 0
   local.get $5
   call $~lib/math/pio2_large_quot
   local.tee $3
   i32.sub
   local.get $3
   local.get $6
   select
  end
  local.set $3
  global.get $~lib/math/rempio2_y0
  local.set $2
  global.get $~lib/math/rempio2_y1
  local.set $7
  local.get $3
  i32.const 1
  i32.and
  if (result f64)
   local.get $2
   local.get $2
   f64.mul
   local.tee $0
   local.get $0
   f64.mul
   local.set $1
   f64.const 1
   local.get $0
   f64.const 0.5
   f64.mul
   local.tee $8
   f64.sub
   local.tee $9
   f64.const 1
   local.get $9
   f64.sub
   local.get $8
   f64.sub
   local.get $0
   local.get $0
   local.get $0
   local.get $0
   f64.const 2.480158728947673e-05
   f64.mul
   f64.const -0.001388888888887411
   f64.add
   f64.mul
   f64.const 0.0416666666666666
   f64.add
   f64.mul
   local.get $1
   local.get $1
   f64.mul
   local.get $0
   local.get $0
   f64.const -1.1359647557788195e-11
   f64.mul
   f64.const 2.087572321298175e-09
   f64.add
   f64.mul
   f64.const -2.7557314351390663e-07
   f64.add
   f64.mul
   f64.add
   f64.mul
   local.get $2
   local.get $7
   f64.mul
   f64.sub
   f64.add
   f64.add
  else
   local.get $2
   local.get $2
   f64.mul
   local.tee $0
   local.get $2
   f64.mul
   local.set $1
   local.get $2
   local.get $0
   local.get $7
   f64.const 0.5
   f64.mul
   local.get $1
   local.get $0
   local.get $0
   f64.const 2.7557313707070068e-06
   f64.mul
   f64.const -1.984126982985795e-04
   f64.add
   f64.mul
   f64.const 0.00833333333332249
   f64.add
   local.get $0
   local.get $0
   local.get $0
   f64.mul
   f64.mul
   local.get $0
   f64.const 1.58969099521155e-10
   f64.mul
   f64.const -2.5050760253406863e-08
   f64.add
   f64.mul
   f64.add
   f64.mul
   f64.sub
   f64.mul
   local.get $7
   f64.sub
   local.get $1
   f64.const -0.16666666666666632
   f64.mul
   f64.sub
   f64.sub
  end
  local.tee $0
  f64.neg
  local.get $0
  local.get $3
  i32.const 2
  i32.and
  select
 )
 (func $~lib/math/NativeMath.atan (param $0 f64) (result f64)
  (local $1 f64)
  (local $2 i32)
  (local $3 i32)
  (local $4 f64)
  (local $5 f64)
  local.get $0
  local.set $1
  local.get $0
  i64.reinterpret_f64
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  i32.const 2147483647
  i32.and
  local.tee $2
  i32.const 1141899264
  i32.ge_u
  if
   local.get $0
   local.get $0
   f64.ne
   if
    local.get $0
    return
   end
   f64.const 1.5707963267948966
   local.get $1
   f64.copysign
   return
  end
  local.get $2
  i32.const 1071382528
  i32.lt_u
  if
   local.get $2
   i32.const 1044381696
   i32.lt_u
   if
    local.get $0
    return
   end
   i32.const -1
   local.set $3
  else
   local.get $0
   f64.abs
   local.set $0
   local.get $2
   i32.const 1072889856
   i32.lt_u
   if (result f64)
    local.get $2
    i32.const 1072037888
    i32.lt_u
    if (result f64)
     local.get $0
     local.get $0
     f64.add
     f64.const -1
     f64.add
     local.get $0
     f64.const 2
     f64.add
     f64.div
    else
     i32.const 1
     local.set $3
     local.get $0
     f64.const -1
     f64.add
     local.get $0
     f64.const 1
     f64.add
     f64.div
    end
   else
    local.get $2
    i32.const 1073971200
    i32.lt_u
    if (result f64)
     i32.const 2
     local.set $3
     local.get $0
     f64.const -1.5
     f64.add
     local.get $0
     f64.const 1.5
     f64.mul
     f64.const 1
     f64.add
     f64.div
    else
     i32.const 3
     local.set $3
     f64.const -1
     local.get $0
     f64.div
    end
   end
   local.set $0
  end
  local.get $0
  local.get $0
  f64.mul
  local.tee $5
  local.get $5
  f64.mul
  local.set $4
  local.get $0
  local.get $5
  local.get $4
  local.get $4
  local.get $4
  local.get $4
  local.get $4
  f64.const 0.016285820115365782
  f64.mul
  f64.const 0.049768779946159324
  f64.add
  f64.mul
  f64.const 0.06661073137387531
  f64.add
  f64.mul
  f64.const 0.09090887133436507
  f64.add
  f64.mul
  f64.const 0.14285714272503466
  f64.add
  f64.mul
  f64.const 0.3333333333333293
  f64.add
  f64.mul
  local.get $4
  local.get $4
  local.get $4
  local.get $4
  local.get $4
  f64.const -0.036531572744216916
  f64.mul
  f64.const -0.058335701337905735
  f64.add
  f64.mul
  f64.const -0.0769187620504483
  f64.add
  f64.mul
  f64.const -0.11111110405462356
  f64.add
  f64.mul
  f64.const -0.19999999999876483
  f64.add
  f64.mul
  f64.add
  f64.mul
  local.set $4
  local.get $3
  i32.const 0
  i32.lt_s
  if
   local.get $0
   local.get $4
   f64.sub
   return
  end
  block $break|0
   block $case4|0
    block $case3|0
     block $case2|0
      block $case1|0
       block $case0|0
        local.get $3
        br_table $case0|0 $case1|0 $case2|0 $case3|0 $case4|0
       end
       f64.const 0.4636476090008061
       local.get $4
       f64.const -2.2698777452961687e-17
       f64.add
       local.get $0
       f64.sub
       f64.sub
       local.set $0
       br $break|0
      end
      f64.const 0.7853981633974483
      local.get $4
      f64.const -3.061616997868383e-17
      f64.add
      local.get $0
      f64.sub
      f64.sub
      local.set $0
      br $break|0
     end
     f64.const 0.982793723247329
     local.get $4
     f64.const -1.3903311031230998e-17
     f64.add
     local.get $0
     f64.sub
     f64.sub
     local.set $0
     br $break|0
    end
    f64.const 1.5707963267948966
    local.get $4
    f64.const -6.123233995736766e-17
    f64.add
    local.get $0
    f64.sub
    f64.sub
    local.set $0
    br $break|0
   end
   unreachable
  end
  local.get $0
  local.get $1
  f64.copysign
 )
 (func $assembly/index/updateVesselState (param $0 i32) (param $1 f64) (param $2 f64) (param $3 f64) (param $4 f64) (param $5 f64) (param $6 f64) (param $7 f64) (param $8 f64) (param $9 f64) (result i32)
  (local $10 i64)
  (local $11 f64)
  (local $12 f64)
  (local $13 i64)
  (local $14 i32)
  (local $15 i32)
  (local $16 i32)
  (local $17 f64)
  (local $18 f64)
  (local $19 f64)
  (local $20 f64)
  (local $21 f64)
  (local $22 f64)
  (local $23 f64)
  (local $24 f64)
  (local $25 i32)
  (local $26 f64)
  (local $27 f64)
  (local $28 f64)
  (local $29 f64)
  (local $30 i64)
  (local $31 i64)
  f64.const 0
  f64.const 0.25
  local.get $1
  local.get $1
  f64.const 0.25
  f64.gt
  select
  local.get $1
  f64.const 0
  f64.lt
  select
  local.set $12
  f64.const 0
  local.set $1
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  block $__inlined_func$assembly/index/clamp01$260
   local.get $0
   f64.load offset=160
   local.tee $11
   f64.const 0
   f64.lt
   br_if $__inlined_func$assembly/index/clamp01$260
   f64.const 1
   local.set $1
   local.get $11
   f64.const 1
   f64.gt
   br_if $__inlined_func$assembly/index/clamp01$260
   local.get $11
   local.set $1
  end
  local.get $0
  f64.load offset=128
  local.get $1
  f64.const 0.4
  f64.mul
  f64.const 0.9
  f64.add
  f64.mul
  local.set $20
  local.get $0
  local.get $0
  f64.load offset=96
  block $__inlined_func$assembly/index/clampSigned$263 (result f64)
   f64.const 1
   local.get $0
   f64.load offset=104
   local.tee $11
   f64.const 1
   f64.gt
   br_if $__inlined_func$assembly/index/clampSigned$263
   drop
   f64.const -1
   local.get $11
   f64.const -1
   f64.lt
   br_if $__inlined_func$assembly/index/clampSigned$263
   drop
   local.get $11
  end
  local.get $0
  f64.load offset=96
  f64.sub
  local.get $0
  f64.load offset=312
  local.tee $11
  f64.const 0.05
  local.get $11
  f64.const 0.05
  f64.gt
  select
  f64.div
  local.get $12
  f64.mul
  f64.add
  f64.store offset=96
  local.get $0
  block $__inlined_func$assembly/index/clampSigned$270 (result f64)
   f64.const 1
   local.get $0
   f64.load offset=96
   local.tee $11
   f64.const 1
   f64.gt
   br_if $__inlined_func$assembly/index/clampSigned$270
   drop
   f64.const -1
   local.get $11
   f64.const -1
   f64.lt
   br_if $__inlined_func$assembly/index/clampSigned$270
   drop
   local.get $11
  end
  f64.store offset=96
  local.get $0
  f64.load offset=320
  local.tee $11
  local.get $12
  f64.mul
  local.get $0
  f64.load offset=120
  local.tee $17
  local.get $0
  f64.load offset=112
  f64.sub
  local.tee $18
  f64.abs
  local.tee $19
  local.get $11
  f64.const 0
  f64.gt
  select
  local.tee $11
  local.get $19
  f64.ge
  if
   local.get $0
   local.get $17
   f64.store offset=112
  else
   local.get $0
   local.get $0
   f64.load offset=112
   local.get $11
   local.get $11
   f64.neg
   local.get $18
   f64.const 0
   f64.gt
   select
   f64.add
   f64.store offset=112
  end
  local.get $0
  f64.load offset=232
  local.get $0
  f64.load offset=472
  f64.const 0
  f64.gt
  if (result f64)
   local.get $0
   f64.load offset=96
  else
   f64.const 0
  end
  local.tee $11
  f64.mul
  local.set $21
  local.get $0
  block $__inlined_func$assembly/index/clamp01$285 (result f64)
   f64.const 0
   local.get $0
   f64.load offset=472
   local.get $11
   f64.abs
   local.get $0
   f64.load offset=480
   f64.mul
   local.get $12
   f64.mul
   local.tee $11
   f64.sub
   local.tee $17
   f64.const 0
   f64.lt
   br_if $__inlined_func$assembly/index/clamp01$285
   drop
   f64.const 1
   local.get $17
   f64.const 1
   f64.gt
   br_if $__inlined_func$assembly/index/clamp01$285
   drop
   local.get $17
  end
  f64.store offset=472
  local.get $0
  local.get $12
  f64.const 0
  f64.gt
  if (result f64)
   local.get $11
   local.get $12
   f64.div
   f64.const 3600
   f64.mul
  else
   f64.const 0
  end
  f64.store offset=488
  local.get $4
  local.get $5
  local.get $0
  f64.load offset=40
  f64.sub
  local.tee $5
  call $~lib/math/NativeMath.cos
  f64.mul
  local.set $11
  local.get $4
  local.get $5
  call $~lib/math/NativeMath.sin
  f64.mul
  local.set $4
  local.get $0
  f64.load offset=48
  local.get $11
  f64.sub
  local.set $5
  local.get $0
  f64.load offset=56
  local.get $4
  f64.sub
  local.set $11
  local.get $0
  f64.load offset=416
  global.get $assembly/index/globalEnvironment
  f64.load offset=64
  local.tee $4
  f64.const 0
  f64.gt
  if (result f64)
   local.get $4
   local.get $0
   f64.load offset=152
   f64.const 0.01
   f64.add
   f64.div
  else
   f64.const 4
  end
  local.tee $4
  f64.const 3
  f64.lt
  local.get $4
  f64.const 0
  f64.gt
  i32.and
  if (result f64)
   f64.const 3
   f64.const 1.1
   local.get $4
   local.get $4
   f64.const 1.1
   f64.lt
   select
   f64.sub
   f64.const 1.9
   f64.div
  else
   f64.const 0
  end
  local.tee $4
  f64.mul
  f64.const 1
  f64.add
  local.set $22
  f64.const 1
  f64.const 1
  local.get $0
  f64.load offset=424
  f64.sub
  local.get $4
  f64.mul
  f64.sub
  local.set $17
  local.get $0
  f64.load offset=384
  f64.const 512.5
  f64.mul
  local.get $0
  f64.load offset=136
  local.get $0
  f64.load offset=152
  local.tee $18
  f64.mul
  local.get $0
  f64.load offset=168
  local.tee $19
  f64.const 0.6
  f64.mul
  f64.const 0.7
  f64.add
  f64.mul
  f64.const 1
  f64.max
  f64.mul
  local.get $5
  f64.mul
  local.get $5
  f64.abs
  f64.mul
  local.get $0
  f64.load offset=408
  local.get $4
  f64.mul
  f64.const 1
  f64.add
  local.tee $23
  f64.mul
  local.set $4
  local.get $0
  f64.load offset=392
  f64.const 512.5
  f64.mul
  local.get $0
  f64.load offset=144
  local.get $18
  f64.mul
  local.get $19
  f64.const 0.3
  f64.mul
  f64.const 0.7
  f64.add
  f64.mul
  f64.const 1
  f64.max
  f64.mul
  local.get $11
  f64.mul
  local.get $11
  f64.abs
  f64.mul
  local.get $23
  f64.mul
  local.set $23
  local.get $0
  f64.load offset=224
  local.get $11
  f64.mul
  local.set $24
  local.get $5
  local.get $5
  f64.mul
  local.get $11
  local.get $11
  f64.mul
  f64.add
  f64.sqrt
  local.tee $18
  local.get $18
  f64.mul
  local.get $0
  f64.load offset=304
  local.tee $18
  f64.const 0
  f64.gt
  if (result f64)
   local.get $21
   f64.abs
   local.get $0
   f64.load offset=280
   f64.const 512.5
   f64.mul
   f64.const 1e-06
   f64.add
   f64.div
   f64.sqrt
   local.get $18
   f64.mul
  else
   f64.const 0
  end
  local.tee $18
  local.get $18
  f64.mul
  f64.add
  f64.sqrt
  local.set $18
  block $__inlined_func$~lib/math/NativeMath.atan2$2 (result f64)
   local.get $11
   local.get $11
   f64.ne
   local.get $5
   f64.const 0.1
   f64.max
   local.tee $5
   local.get $5
   f64.ne
   i32.or
   if
    local.get $5
    local.get $11
    f64.add
    br $__inlined_func$~lib/math/NativeMath.atan2$2
   end
   local.get $11
   i64.reinterpret_f64
   local.tee $10
   i64.const 32
   i64.shr_u
   i32.wrap_i64
   local.set $25
   local.get $5
   i64.reinterpret_f64
   local.tee $13
   i64.const 32
   i64.shr_u
   i32.wrap_i64
   local.set $16
   local.get $13
   i32.wrap_i64
   local.tee $15
   local.get $16
   i32.const 1072693248
   i32.sub
   i32.or
   i32.eqz
   if
    local.get $11
    call $~lib/math/NativeMath.atan
    br $__inlined_func$~lib/math/NativeMath.atan2$2
   end
   local.get $16
   i32.const 30
   i32.shr_u
   i32.const 2
   i32.and
   local.get $25
   i32.const 31
   i32.shr_u
   i32.or
   local.set $14
   local.get $25
   i32.const 2147483647
   i32.and
   local.tee $25
   local.get $10
   i32.wrap_i64
   i32.or
   i32.eqz
   if
    block $break|0
     block $case3|0
      block $case2|0
       block $case0|0
        local.get $14
        br_table $case0|0 $case0|0 $case2|0 $case3|0 $break|0
       end
       local.get $11
       br $__inlined_func$~lib/math/NativeMath.atan2$2
      end
      f64.const 3.141592653589793
      br $__inlined_func$~lib/math/NativeMath.atan2$2
     end
     f64.const -3.141592653589793
     br $__inlined_func$~lib/math/NativeMath.atan2$2
    end
   end
   block $folding-inner0
    local.get $16
    i32.const 2147483647
    i32.and
    local.tee $16
    local.get $15
    i32.or
    i32.eqz
    br_if $folding-inner0
    local.get $16
    i32.const 2146435072
    i32.eq
    if
     local.get $25
     i32.const 2146435072
     i32.eq
     if (result f64)
      f64.const 2.356194490192345
      f64.const 0.7853981633974483
      local.get $14
      i32.const 2
      i32.and
      select
      local.tee $5
      f64.neg
      local.get $5
      local.get $14
      i32.const 1
      i32.and
      select
     else
      f64.const 3.141592653589793
      f64.const 0
      local.get $14
      i32.const 2
      i32.and
      select
      local.tee $5
      f64.neg
      local.get $5
      local.get $14
      i32.const 1
      i32.and
      select
     end
     br $__inlined_func$~lib/math/NativeMath.atan2$2
    end
    local.get $25
    i32.const 2146435072
    i32.eq
    local.get $16
    i32.const 67108864
    i32.add
    local.get $25
    i32.lt_u
    i32.or
    br_if $folding-inner0
    local.get $25
    i32.const 67108864
    i32.add
    local.get $16
    i32.lt_u
    i32.const 0
    local.get $14
    i32.const 2
    i32.and
    select
    if (result f64)
     f64.const 0
    else
     local.get $11
     local.get $5
     f64.div
     f64.abs
     call $~lib/math/NativeMath.atan
    end
    local.set $5
    block $break|1
     block $case3|1
      block $case2|1
       block $case1|1
        block $case0|1
         local.get $14
         br_table $case0|1 $case1|1 $case2|1 $case3|1 $break|1
        end
        local.get $5
        br $__inlined_func$~lib/math/NativeMath.atan2$2
       end
       local.get $5
       f64.neg
       br $__inlined_func$~lib/math/NativeMath.atan2$2
      end
      f64.const 3.141592653589793
      local.get $5
      f64.const -1.2246467991473532e-16
      f64.add
      f64.sub
      br $__inlined_func$~lib/math/NativeMath.atan2$2
     end
     local.get $5
     f64.const -1.2246467991473532e-16
     f64.add
     f64.const -3.141592653589793
     f64.add
     br $__inlined_func$~lib/math/NativeMath.atan2$2
    end
    unreachable
   end
   f64.const -1.5707963267948966
   f64.const 1.5707963267948966
   local.get $14
   i32.const 1
   i32.and
   select
  end
  local.set $5
  local.get $0
  f64.load offset=280
  f64.const 512.5
  f64.mul
  local.get $18
  f64.mul
  local.get $18
  f64.mul
  local.get $0
  f64.load offset=296
  local.get $0
  f64.load offset=112
  local.get $5
  f64.sub
  local.tee $5
  f64.mul
  f64.const 0
  f64.const 1
  local.get $5
  f64.abs
  local.get $0
  f64.load offset=184
  local.tee $5
  f64.div
  f64.const 1
  local.get $5
  f64.const 0
  f64.gt
  select
  local.tee $5
  local.get $5
  f64.mul
  f64.sub
  local.get $5
  f64.const 1
  f64.ge
  select
  f64.const 0
  f64.max
  f64.mul
  f64.mul
  local.get $17
  f64.mul
  local.tee $26
  local.get $0
  f64.load offset=288
  f64.mul
  local.set $27
  local.get $0
  f64.load offset=352
  local.get $11
  f64.mul
  local.get $0
  f64.load offset=360
  local.get $0
  f64.load offset=72
  local.tee $17
  f64.mul
  f64.add
  f64.neg
  local.set $5
  local.get $0
  f64.load offset=368
  local.get $11
  f64.mul
  local.get $0
  f64.load offset=376
  local.get $17
  f64.mul
  f64.add
  f64.neg
  local.set $11
  local.get $2
  local.get $2
  f64.mul
  f64.const 0.01
  f64.mul
  local.get $3
  local.get $0
  f64.load offset=40
  f64.sub
  call $~lib/math/NativeMath.sin
  f64.mul
  local.set $17
  local.get $20
  local.get $0
  f64.load offset=144
  local.tee $18
  f64.mul
  local.get $18
  f64.mul
  f64.const 0.08
  f64.mul
  local.set $18
  local.get $20
  local.get $0
  f64.load offset=136
  local.tee $28
  f64.mul
  local.get $28
  f64.mul
  local.tee $29
  f64.const 0.08
  f64.mul
  local.set $19
  local.get $21
  local.get $4
  f64.sub
  local.get $20
  local.get $0
  f64.load offset=328
  f64.add
  f64.const 1
  f64.max
  f64.div
  local.get $0
  f64.load offset=56
  local.get $0
  f64.load offset=72
  f64.mul
  f64.add
  local.set $4
  local.get $23
  f64.neg
  local.get $24
  f64.sub
  local.get $26
  f64.add
  local.get $5
  f64.add
  local.get $20
  local.get $0
  f64.load offset=336
  f64.add
  f64.const 1
  f64.max
  f64.div
  local.get $0
  f64.load offset=48
  local.get $0
  f64.load offset=72
  f64.mul
  f64.sub
  local.set $5
  local.get $27
  local.get $11
  f64.add
  local.get $17
  f64.sub
  local.get $0
  f64.load offset=208
  local.get $0
  f64.load offset=72
  f64.mul
  local.get $22
  f64.mul
  f64.sub
  local.get $0
  f64.load offset=216
  local.get $0
  f64.load offset=72
  f64.mul
  local.get $0
  f64.load offset=72
  f64.abs
  f64.mul
  local.get $22
  f64.mul
  f64.sub
  local.get $29
  f64.const 0.1
  f64.mul
  local.get $0
  f64.load offset=344
  f64.add
  f64.const 1
  f64.max
  f64.div
  local.set $11
  local.get $0
  local.get $6
  local.get $2
  f64.const 0.05
  f64.mul
  f64.const 3
  f64.min
  local.get $6
  f64.const 0
  f64.gt
  select
  f64.const 0.5
  f64.mul
  local.tee $2
  f64.store offset=432
  local.get $0
  local.get $7
  local.get $28
  local.get $28
  f64.add
  f64.const 20
  f64.max
  local.get $7
  f64.const 1
  f64.gt
  select
  local.tee $6
  f64.store offset=440
  local.get $0
  local.get $8
  local.get $3
  local.get $8
  local.get $8
  f64.eq
  select
  local.tee $3
  f64.store offset=448
  local.get $0
  local.get $9
  local.get $2
  f64.const 6.283185307179586
  local.get $6
  f64.div
  local.tee $6
  f64.mul
  f64.const 0.7
  f64.min
  local.get $9
  f64.const 0
  f64.gt
  select
  local.tee $7
  f64.store offset=456
  local.get $0
  local.get $0
  f64.load offset=464
  local.get $12
  f64.add
  f64.store offset=464
  local.get $3
  call $~lib/math/NativeMath.cos
  local.set $8
  local.get $3
  call $~lib/math/NativeMath.sin
  local.set $3
  local.get $6
  local.get $8
  local.get $0
  f64.load
  f64.mul
  local.get $3
  local.get $0
  f64.load offset=8
  f64.mul
  f64.add
  f64.mul
  local.get $6
  f64.const 9.81
  f64.mul
  f64.sqrt
  local.get $0
  f64.load offset=464
  f64.mul
  f64.sub
  local.tee $6
  call $~lib/math/NativeMath.sin
  local.set $9
  local.get $7
  local.get $6
  call $~lib/math/NativeMath.cos
  f64.mul
  local.set $6
  local.get $0
  local.get $0
  f64.load offset=64
  local.tee $7
  local.get $20
  local.get $0
  f64.load offset=136
  f64.const 1025
  f64.mul
  local.get $0
  f64.load offset=144
  f64.mul
  local.get $0
  f64.load offset=168
  f64.mul
  f64.const 1e-06
  f64.add
  f64.div
  local.get $1
  f64.const 0.5
  f64.mul
  f64.const 0.7
  f64.add
  f64.mul
  local.get $2
  local.get $9
  f64.mul
  f64.add
  f64.neg
  local.get $0
  f64.load offset=16
  f64.sub
  local.get $0
  f64.load offset=264
  f64.mul
  local.get $0
  f64.load offset=272
  local.get $7
  f64.mul
  f64.sub
  local.get $12
  f64.mul
  f64.add
  f64.store offset=64
  local.get $0
  local.get $0
  f64.load offset=16
  local.get $0
  f64.load offset=64
  local.get $12
  f64.mul
  f64.add
  f64.store offset=16
  local.get $0
  f64.load offset=136
  local.get $0
  f64.load offset=168
  f64.mul
  local.get $0
  f64.load offset=152
  f64.const 0.1
  f64.add
  f64.const 12
  f64.mul
  local.tee $1
  f64.div
  f64.const -9.81
  f64.mul
  local.get $20
  f64.mul
  local.get $0
  f64.load offset=32
  local.get $6
  local.get $8
  f64.mul
  f64.sub
  f64.mul
  local.get $19
  f64.div
  local.get $0
  f64.load offset=256
  local.get $0
  f64.load offset=88
  f64.mul
  f64.sub
  local.set $2
  local.get $0
  local.get $0
  f64.load offset=80
  local.tee $7
  local.get $0
  f64.load offset=144
  local.get $0
  f64.load offset=144
  f64.mul
  local.get $0
  f64.load offset=168
  f64.mul
  local.get $1
  f64.div
  f64.const -9.81
  f64.mul
  local.get $20
  f64.mul
  local.get $0
  f64.load offset=24
  local.get $6
  local.get $3
  f64.mul
  f64.sub
  f64.mul
  local.get $18
  f64.div
  local.get $0
  f64.load offset=248
  local.get $7
  f64.mul
  f64.sub
  local.get $12
  f64.mul
  f64.add
  f64.store offset=80
  local.get $0
  local.get $0
  f64.load offset=88
  local.get $2
  local.get $12
  f64.mul
  f64.add
  f64.store offset=88
  local.get $0
  local.get $0
  f64.load offset=24
  local.get $0
  f64.load offset=80
  local.get $12
  f64.mul
  f64.add
  f64.store offset=24
  local.get $0
  local.get $0
  f64.load offset=32
  local.get $0
  f64.load offset=88
  local.get $12
  f64.mul
  f64.add
  f64.store offset=32
  local.get $0
  local.get $0
  f64.load offset=48
  local.get $4
  local.get $12
  f64.mul
  f64.add
  f64.store offset=48
  local.get $0
  local.get $0
  f64.load offset=56
  local.get $5
  local.get $12
  f64.mul
  f64.add
  f64.store offset=56
  local.get $0
  local.get $0
  f64.load offset=72
  local.get $11
  local.get $12
  f64.mul
  f64.add
  f64.store offset=72
  local.get $0
  f64.load offset=240
  f64.const 1.2
  f64.mul
  local.tee $3
  local.set $1
  block $__inlined_func$assembly/index/clampSigned$392
   local.get $0
   f64.load offset=48
   local.tee $2
   local.get $3
   f64.gt
   br_if $__inlined_func$assembly/index/clampSigned$392
   local.get $2
   local.get $3
   f64.neg
   local.tee $1
   f64.lt
   br_if $__inlined_func$assembly/index/clampSigned$392
   local.get $2
   local.set $1
  end
  local.get $0
  local.get $1
  f64.store offset=48
  block $__inlined_func$assembly/index/clampSigned$395
   local.get $3
   f64.const 0.6
   f64.mul
   local.tee $2
   local.get $0
   f64.load offset=56
   local.tee $1
   f64.lt
   br_if $__inlined_func$assembly/index/clampSigned$395
   local.get $1
   local.get $2
   f64.neg
   local.tee $2
   f64.lt
   br_if $__inlined_func$assembly/index/clampSigned$395
   local.get $1
   local.set $2
  end
  local.get $0
  local.get $2
  f64.store offset=56
  local.get $0
  block $__inlined_func$assembly/index/clampSigned$398 (result f64)
   f64.const 1.2000000000000002
   local.get $0
   f64.load offset=72
   local.tee $1
   f64.const 1.2000000000000002
   f64.gt
   br_if $__inlined_func$assembly/index/clampSigned$398
   drop
   f64.const -1.2000000000000002
   local.get $1
   f64.const -1.2000000000000002
   f64.lt
   br_if $__inlined_func$assembly/index/clampSigned$398
   drop
   local.get $1
  end
  f64.store offset=72
  local.get $0
  block $__inlined_func$~lib/math/NativeMath.mod$3 (result f64)
   local.get $0
   f64.load offset=40
   local.get $0
   f64.load offset=72
   local.get $12
   f64.mul
   f64.add
   local.tee $1
   i64.reinterpret_f64
   local.tee $10
   i64.const 52
   i64.shr_u
   i64.const 2047
   i64.and
   local.tee $13
   i64.const 2047
   i64.eq
   if
    local.get $1
    f64.const 6.283185307179586
    f64.mul
    local.tee $1
    local.get $1
    f64.div
    br $__inlined_func$~lib/math/NativeMath.mod$3
   end
   local.get $10
   i64.const 1
   i64.shl
   local.tee $30
   i64.const -9209223561350718928
   i64.le_u
   if
    local.get $1
    local.get $30
    i64.const -9209223561350718928
    i64.ne
    f64.convert_i32_u
    f64.mul
    br $__inlined_func$~lib/math/NativeMath.mod$3
   end
   local.get $10
   i64.const 63
   i64.shr_u
   local.set $30
   local.get $13
   i64.eqz
   if (result i64)
    local.get $10
    i64.const 1
    local.get $13
    local.get $10
    i64.const 12
    i64.shl
    i64.clz
    i64.sub
    local.tee $13
    i64.sub
    i64.shl
   else
    local.get $10
    i64.const 4503599627370495
    i64.and
    i64.const 4503599627370496
    i64.or
   end
   local.set $10
   loop $while-continue|0
    local.get $13
    i64.const 1025
    i64.gt_s
    if
     local.get $10
     i64.const 7074237752028440
     i64.ge_u
     if (result i64)
      local.get $1
      f64.const 0
      f64.mul
      local.get $10
      i64.const 7074237752028440
      i64.eq
      br_if $__inlined_func$~lib/math/NativeMath.mod$3
      drop
      local.get $10
      i64.const 7074237752028440
      i64.sub
     else
      local.get $10
     end
     i64.const 1
     i64.shl
     local.set $10
     local.get $13
     i64.const 1
     i64.sub
     local.set $13
     br $while-continue|0
    end
   end
   local.get $10
   i64.const 7074237752028440
   i64.ge_u
   if
    local.get $1
    f64.const 0
    f64.mul
    local.get $10
    i64.const 7074237752028440
    i64.eq
    br_if $__inlined_func$~lib/math/NativeMath.mod$3
    drop
    local.get $10
    i64.const 7074237752028440
    i64.sub
    local.set $10
   end
   local.get $13
   local.get $10
   i64.const 11
   i64.shl
   i64.clz
   local.tee $31
   i64.sub
   local.set $13
   local.get $10
   local.get $31
   i64.shl
   local.set $10
   local.get $13
   i64.const 0
   i64.gt_s
   if (result i64)
    local.get $10
    i64.const 4503599627370496
    i64.sub
    local.get $13
    i64.const 52
    i64.shl
    i64.or
   else
    local.get $10
    i64.const 1
    local.get $13
    i64.sub
    i64.shr_u
   end
   local.get $30
   i64.const 63
   i64.shl
   i64.or
   f64.reinterpret_i64
  end
  local.tee $1
  f64.const 6.283185307179586
  f64.add
  local.get $1
  local.get $1
  f64.const 0
  f64.lt
  select
  f64.store offset=40
  local.get $0
  f64.load offset=40
  call $~lib/math/NativeMath.cos
  local.set $1
  local.get $0
  f64.load offset=40
  call $~lib/math/NativeMath.sin
  local.set $2
  local.get $0
  local.get $0
  f64.load
  local.get $0
  f64.load offset=48
  local.tee $3
  local.get $1
  f64.mul
  local.get $0
  f64.load offset=56
  local.tee $4
  local.get $2
  f64.mul
  f64.sub
  local.get $12
  f64.mul
  f64.add
  f64.store
  local.get $0
  local.get $0
  f64.load offset=8
  local.get $3
  local.get $2
  f64.mul
  local.get $4
  local.get $1
  f64.mul
  f64.add
  local.get $12
  f64.mul
  f64.add
  f64.store offset=8
  local.get $0
 )
 (func $assembly/index/setThrottle (param $0 i32) (param $1 f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  block $__inlined_func$assembly/index/clampSigned$414 (result f64)
   f64.const 1
   local.get $1
   f64.const 1
   f64.gt
   br_if $__inlined_func$assembly/index/clampSigned$414
   drop
   f64.const -1
   local.get $1
   f64.const -1
   f64.lt
   br_if $__inlined_func$assembly/index/clampSigned$414
   drop
   local.get $1
  end
  f64.store offset=104
 )
 (func $assembly/index/setRudderAngle (param $0 i32) (param $1 f64)
  (local $2 f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  local.get $1
  f64.sub
  f64.const 0
  f64.ne
  if
   return
  end
  local.get $1
  local.get $0
  f64.load offset=192
  local.tee $2
  f64.gt
  i32.eqz
  if
   local.get $1
   local.set $2
  end
  local.get $0
  local.get $0
  f64.load offset=192
  f64.neg
  local.tee $1
  local.get $2
  f64.gt
  if (result f64)
   local.get $1
  else
   local.get $2
  end
  f64.store offset=120
 )
 (func $assembly/index/setBallast (param $0 i32) (param $1 f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  block $__inlined_func$assembly/index/clamp01$421 (result f64)
   f64.const 0
   local.get $1
   f64.const 0
   f64.lt
   br_if $__inlined_func$assembly/index/clamp01$421
   drop
   f64.const 1
   local.get $1
   f64.const 1
   f64.gt
   br_if $__inlined_func$assembly/index/clamp01$421
   drop
   local.get $1
  end
  f64.store offset=160
 )
 (func $assembly/index/getVesselX (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load
 )
 (func $assembly/index/getVesselY (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=8
 )
 (func $assembly/index/getVesselZ (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=16
 )
 (func $assembly/index/getVesselHeading (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=40
 )
 (func $assembly/index/getVesselSpeed (param $0 i32) (result f64)
  (local $1 f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=48
  local.tee $1
  local.get $1
  f64.mul
  local.get $0
  f64.load offset=56
  local.tee $1
  local.get $1
  f64.mul
  f64.add
  f64.sqrt
 )
 (func $assembly/index/getVesselSurgeVelocity (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=48
 )
 (func $assembly/index/getVesselSwayVelocity (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=56
 )
 (func $assembly/index/getVesselHeaveVelocity (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=64
 )
 (func $assembly/index/getVesselRollAngle (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=24
 )
 (func $assembly/index/getVesselPitchAngle (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=32
 )
 (func $assembly/index/getVesselRudderAngle (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=112
 )
 (func $assembly/index/getVesselEngineRPM (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=96
  f64.abs
  f64.const 1200
  f64.mul
 )
 (func $assembly/index/getVesselFuelLevel (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=472
 )
 (func $assembly/index/getVesselFuelConsumption (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=488
 )
 (func $assembly/index/getVesselGM (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=144
  local.get $0
  f64.load offset=168
  f64.mul
  local.get $0
  f64.load offset=152
  f64.const 0.1
  f64.add
  f64.div
 )
 (func $assembly/index/getVesselCenterOfGravityY (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=152
  local.get $0
  f64.load offset=160
  f64.const 0.2
  f64.mul
  f64.const 0.4
  f64.add
  f64.mul
 )
 (func $assembly/index/getVesselBallastLevel (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=160
 )
 (func $assembly/index/getVesselRollRate (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=80
 )
 (func $assembly/index/getVesselPitchRate (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=88
 )
 (func $assembly/index/getVesselYawRate (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1296
   i32.const 1360
   i32.const 328
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=72
 )
 (func $assembly/index/calculateSeaState (param $0 f64) (result f64)
  local.get $0
  f64.const 1.5
  f64.div
  local.tee $0
  f64.const 0
  f64.lt
  if
   f64.const 0
   return
  end
  local.get $0
  f64.const 12
  f64.gt
  if
   f64.const 12
   return
  end
  local.get $0
 )
 (func $assembly/index/getWaveHeightForSeaState (param $0 f64) (result f64)
  local.get $0
  f64.const 0.5
  f64.mul
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
  (local $0 i32)
  i32.const 1612
  global.set $~lib/rt/stub/offset
  i32.const 72
  i32.const 5
  call $~lib/rt/stub/__new
  local.tee $0
  i32.eqz
  if
   i32.const 0
   i32.const 0
   call $~lib/rt/stub/__new
   local.set $0
  end
  local.get $0
  f64.const 0
  f64.store
  local.get $0
  f64.const 0
  f64.store offset=8
  local.get $0
  f64.const 0
  f64.store offset=16
  local.get $0
  f64.const 0
  f64.store offset=24
  local.get $0
  f64.const 0
  f64.store offset=32
  local.get $0
  f64.const 0
  f64.store offset=40
  local.get $0
  f64.const 0
  f64.store offset=48
  local.get $0
  f64.const 0
  f64.store offset=56
  local.get $0
  f64.const 0
  f64.store offset=64
  local.get $0
  global.set $assembly/index/globalEnvironment
  i32.const 64
  call $~lib/staticarray/StaticArray<f64>#constructor
  global.set $assembly/index/vesselParamsBuffer
  i32.const 16
  call $~lib/staticarray/StaticArray<f64>#constructor
  global.set $assembly/index/environmentBuffer
 )
)
