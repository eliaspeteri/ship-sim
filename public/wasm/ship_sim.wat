(module
 (type $0 (func (param i32) (result f64)))
 (type $1 (func (param f64) (result f64)))
 (type $2 (func (param i32 f64)))
 (type $3 (func))
 (type $4 (func (param i32 i32 i32 i32)))
 (type $5 (func (param f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64) (result i32)))
 (type $6 (func (param i64) (result i32)))
 (type $7 (func (param i32 f64 f64 f64 f64 f64) (result i32)))
 (import "env" "memory" (memory $0 16 100))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (global $assembly/index/globalVessel (mut i32) (i32.const 0))
 (global $~lib/rt/stub/offset (mut i32) (i32.const 0))
 (global $~lib/math/rempio2_y0 (mut f64) (f64.const 0))
 (global $~lib/math/rempio2_y1 (mut f64) (f64.const 0))
 (global $~lib/math/res128_hi (mut i64) (i64.const 0))
 (data $0 (i32.const 1036) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00(\00\00\00A\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e\00\00\00\00\00")
 (data $1 (i32.const 1100) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00s\00t\00u\00b\00.\00t\00s\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $2 (i32.const 1164) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00,\00\00\00V\00e\00s\00s\00e\00l\00 \00p\00o\00i\00n\00t\00e\00r\00 \00i\00s\00 \00n\00u\00l\00l\00")
 (data $3 (i32.const 1228) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\"\00\00\00a\00s\00s\00e\00m\00b\00l\00y\00/\00i\00n\00d\00e\00x\00.\00t\00s\00\00\00\00\00\00\00\00\00\00\00")
 (data $4 (i32.const 1296) "n\83\f9\a2\00\00\00\00\d1W\'\fc)\15DN\99\95b\db\c0\dd4\f5\abcQ\feA\90C<:n$\b7a\c5\bb\de\ea.I\06\e0\d2MB\1c\eb\1d\fe\1c\92\d1\t\f55\82\e8>\a7)\b1&p\9c\e9\84D\bb.9\d6\919A~_\b4\8b_\84\9c\f49S\83\ff\97\f8\1f;(\f9\bd\8b\11/\ef\0f\98\05\de\cf~6m\1fm\nZf?FO\b7\t\cb\'\c7\ba\'u-\ea_\9e\f79\07={\f1\e5\eb\b1_\fbk\ea\92R\8aF0\03V\08]\8d\1f \bc\cf\f0\abk{\fca\91\e3\a9\1d6\f4\9a_\85\99e\08\1b\e6^\80\d8\ff\8d@h\a0\14W\15\06\061\'sM")
 (table $0 1 funcref)
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
 (export "getVesselPitchAngle" (func $assembly/index/getVesselRollAngle))
 (export "getVesselRudderAngle" (func $assembly/index/getVesselRudderAngle))
 (export "getVesselEngineRPM" (func $assembly/index/getVesselEngineRPM))
 (export "getVesselFuelLevel" (func $assembly/index/getVesselFuelLevel))
 (export "getVesselFuelConsumption" (func $assembly/index/getVesselRollAngle))
 (export "getVesselGM" (func $assembly/index/getVesselFuelLevel))
 (export "getVesselCenterOfGravityY" (func $assembly/index/getVesselRollAngle))
 (export "getVesselBallastLevel" (func $assembly/index/getVesselBallastLevel))
 (export "getVesselRollRate" (func $assembly/index/getVesselRollAngle))
 (export "getVesselPitchRate" (func $assembly/index/getVesselRollAngle))
 (export "getVesselYawRate" (func $assembly/index/getVesselYawRate))
 (export "calculateSeaState" (func $assembly/index/calculateSeaState))
 (export "getWaveHeightForSeaState" (func $assembly/index/getWaveHeightForSeaState))
 (export "resetGlobalVessel" (func $assembly/index/resetGlobalVessel))
 (export "memory" (memory $0))
 (export "table" (table $0))
 (start $~start)
 (func $assembly/index/createVessel (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (param $4 f64) (param $5 f64) (param $6 f64) (param $7 f64) (param $8 f64) (param $9 f64) (param $10 f64) (param $11 f64) (param $12 f64) (param $13 f64) (param $14 f64) (param $15 f64) (param $16 f64) (param $17 f64) (result i32)
  (local $18 i32)
  (local $19 i32)
  (local $20 i32)
  (local $21 i32)
  (local $22 i32)
  global.get $assembly/index/globalVessel
  i32.eqz
  if
   local.get $0
   local.set $4
   global.get $~lib/rt/stub/offset
   local.set $18
   global.get $~lib/rt/stub/offset
   i32.const 4
   i32.add
   local.tee $20
   i32.const 156
   i32.add
   local.tee $19
   memory.size
   local.tee $21
   i32.const 16
   i32.shl
   i32.const 15
   i32.add
   i32.const -16
   i32.and
   local.tee $22
   i32.gt_u
   if
    local.get $21
    local.get $19
    local.get $22
    i32.sub
    i32.const 65535
    i32.add
    i32.const -65536
    i32.and
    i32.const 16
    i32.shr_u
    local.tee $22
    local.get $21
    local.get $22
    i32.gt_s
    select
    memory.grow
    i32.const 0
    i32.lt_s
    if
     local.get $22
     memory.grow
     i32.const 0
     i32.lt_s
     if
      unreachable
     end
    end
   end
   local.get $19
   global.set $~lib/rt/stub/offset
   local.get $18
   i32.const 156
   i32.store
   local.get $20
   i32.const 4
   i32.sub
   local.tee $18
   i32.const 0
   i32.store offset=4
   local.get $18
   i32.const 0
   i32.store offset=8
   local.get $18
   i32.const 4
   i32.store offset=12
   local.get $18
   i32.const 136
   i32.store offset=16
   local.get $20
   i32.const 16
   i32.add
   local.tee $18
   f64.const 0
   f64.store
   local.get $18
   f64.const 0
   f64.store offset=8
   local.get $18
   f64.const 0
   f64.store offset=16
   local.get $18
   f64.const 0
   f64.store offset=24
   local.get $18
   f64.const 0
   f64.store offset=32
   local.get $18
   f64.const 0
   f64.store offset=40
   local.get $18
   f64.const 0
   f64.store offset=48
   local.get $18
   f64.const 0
   f64.store offset=56
   local.get $18
   f64.const 0
   f64.store offset=64
   local.get $18
   f64.const 0
   f64.store offset=72
   local.get $18
   f64.const 0
   f64.store offset=80
   local.get $18
   f64.const 0
   f64.store offset=88
   local.get $18
   f64.const 0
   f64.store offset=96
   local.get $18
   f64.const 0
   f64.store offset=104
   local.get $18
   f64.const 0
   f64.store offset=112
   local.get $18
   f64.const 0
   f64.store offset=120
   local.get $18
   f64.const 0
   f64.store offset=128
   local.get $18
   local.get $4
   f64.store
   local.get $18
   local.get $1
   f64.store offset=8
   local.get $18
   local.get $2
   f64.store offset=16
   local.get $18
   local.get $3
   f64.store offset=24
   local.get $18
   local.get $6
   f64.store offset=32
   local.get $18
   local.get $7
   f64.store offset=40
   local.get $18
   local.get $8
   f64.store offset=48
   local.get $18
   local.get $9
   f64.store offset=56
   local.get $18
   block $__inlined_func$assembly/index/clamp01$40 (result f64)
    f64.const 0
    local.get $12
    f64.const 0
    f64.lt
    br_if $__inlined_func$assembly/index/clamp01$40
    drop
    f64.const 1
    local.get $12
    f64.const 1
    f64.gt
    br_if $__inlined_func$assembly/index/clamp01$40
    drop
    local.get $12
   end
   f64.store offset=64
   local.get $18
   local.get $13
   f64.store offset=72
   local.get $18
   local.get $14
   f64.const 5e6
   local.get $14
   f64.const 0
   f64.gt
   select
   f64.store offset=80
   local.get $18
   local.get $15
   f64.const 120
   local.get $15
   f64.const 0
   f64.gt
   select
   f64.store offset=88
   local.get $18
   local.get $16
   f64.const 20
   local.get $16
   f64.const 0
   f64.gt
   select
   f64.store offset=96
   local.get $18
   local.get $17
   f64.const 6
   local.get $17
   f64.const 0
   f64.gt
   select
   f64.store offset=104
   local.get $18
   f64.const 0
   f64.store offset=112
   local.get $18
   f64.const 0
   f64.store offset=120
   local.get $18
   f64.const 1
   f64.store offset=128
   local.get $18
   global.set $assembly/index/globalVessel
  end
  global.get $assembly/index/globalVessel
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
  i32.const 1296
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
 (func $assembly/index/updateVesselState (param $0 i32) (param $1 f64) (param $2 f64) (param $3 f64) (param $4 f64) (param $5 f64) (result i32)
  (local $6 f64)
  (local $7 i64)
  (local $8 i64)
  (local $9 f64)
  (local $10 f64)
  (local $11 f64)
  (local $12 i64)
  (local $13 i64)
  local.get $0
  i32.eqz
  if
   i32.const 1184
   i32.const 1248
   i32.const 85
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
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
  local.set $9
  block $__inlined_func$assembly/index/clamp01$42
   local.get $0
   f64.load offset=64
   local.tee $1
   f64.const 0
   f64.lt
   br_if $__inlined_func$assembly/index/clamp01$42
   f64.const 1
   local.set $6
   local.get $1
   f64.const 1
   f64.gt
   br_if $__inlined_func$assembly/index/clamp01$42
   local.get $1
   local.set $6
  end
  local.get $6
  f64.const 1
  f64.const 0
  local.get $0
  f64.load offset=128
  f64.const 0
  f64.gt
  select
  f64.mul
  f64.const 8e5
  f64.mul
  local.set $6
  local.get $0
  f64.load offset=32
  local.set $1
  local.get $0
  f64.load offset=40
  local.set $10
  local.get $4
  local.get $5
  local.get $0
  f64.load offset=24
  f64.sub
  local.tee $11
  call $~lib/math/NativeMath.cos
  f64.mul
  local.get $0
  f64.load offset=80
  f64.mul
  f64.const 0.01
  f64.mul
  local.set $5
  local.get $4
  local.get $11
  call $~lib/math/NativeMath.sin
  f64.mul
  local.get $0
  f64.load offset=80
  f64.mul
  f64.const 0.01
  f64.mul
  local.set $4
  local.get $0
  f64.load offset=72
  f64.const 8e5
  f64.mul
  local.get $0
  f64.load offset=32
  local.get $0
  f64.load offset=32
  f64.mul
  local.get $0
  f64.load offset=40
  local.get $0
  f64.load offset=40
  f64.mul
  f64.add
  f64.sqrt
  local.tee $11
  f64.mul
  local.get $11
  f64.mul
  local.tee $11
  local.get $0
  f64.load offset=88
  f64.mul
  f64.const 0.4
  f64.mul
  local.get $2
  local.get $2
  f64.mul
  f64.const 0.01
  f64.mul
  local.get $3
  local.get $0
  f64.load offset=24
  f64.sub
  call $~lib/math/NativeMath.sin
  f64.mul
  f64.sub
  local.get $0
  f64.load offset=80
  local.tee $2
  local.get $0
  f64.load offset=88
  f64.mul
  local.get $0
  f64.load offset=88
  f64.mul
  f64.const 0.1
  f64.mul
  f64.div
  local.set $3
  local.get $0
  local.get $0
  f64.load offset=32
  local.get $6
  local.get $1
  f64.const 0.8
  f64.mul
  local.get $1
  f64.abs
  f64.mul
  f64.sub
  local.get $5
  f64.add
  local.get $2
  f64.div
  local.get $9
  f64.mul
  f64.add
  f64.store offset=32
  local.get $0
  local.get $0
  f64.load offset=40
  local.get $4
  local.get $10
  f64.const 0.8
  f64.mul
  local.get $10
  f64.abs
  f64.mul
  f64.sub
  local.get $11
  f64.add
  local.get $2
  f64.div
  local.get $9
  f64.mul
  f64.add
  f64.store offset=40
  local.get $0
  local.get $0
  f64.load offset=56
  local.get $3
  local.get $9
  f64.mul
  f64.add
  f64.store offset=56
  local.get $0
  block $__inlined_func$~lib/math/NativeMath.mod$2 (result f64)
   local.get $0
   f64.load offset=24
   local.get $0
   f64.load offset=56
   local.get $9
   f64.mul
   f64.add
   local.tee $1
   i64.reinterpret_f64
   local.tee $7
   i64.const 52
   i64.shr_u
   i64.const 2047
   i64.and
   local.tee $8
   i64.const 2047
   i64.eq
   if
    local.get $1
    f64.const 6.283185307179586
    f64.mul
    local.tee $1
    local.get $1
    f64.div
    br $__inlined_func$~lib/math/NativeMath.mod$2
   end
   local.get $7
   i64.const 1
   i64.shl
   local.tee $12
   i64.const -9209223561350718928
   i64.le_u
   if
    local.get $1
    local.get $12
    i64.const -9209223561350718928
    i64.ne
    f64.convert_i32_u
    f64.mul
    br $__inlined_func$~lib/math/NativeMath.mod$2
   end
   local.get $7
   i64.const 63
   i64.shr_u
   local.set $12
   local.get $8
   i64.eqz
   if (result i64)
    local.get $7
    i64.const 1
    local.get $8
    local.get $7
    i64.const 12
    i64.shl
    i64.clz
    i64.sub
    local.tee $8
    i64.sub
    i64.shl
   else
    local.get $7
    i64.const 4503599627370495
    i64.and
    i64.const 4503599627370496
    i64.or
   end
   local.set $7
   loop $while-continue|0
    local.get $8
    i64.const 1025
    i64.gt_s
    if
     local.get $7
     i64.const 7074237752028440
     i64.ge_u
     if (result i64)
      local.get $1
      f64.const 0
      f64.mul
      local.get $7
      i64.const 7074237752028440
      i64.eq
      br_if $__inlined_func$~lib/math/NativeMath.mod$2
      drop
      local.get $7
      i64.const 7074237752028440
      i64.sub
     else
      local.get $7
     end
     i64.const 1
     i64.shl
     local.set $7
     local.get $8
     i64.const 1
     i64.sub
     local.set $8
     br $while-continue|0
    end
   end
   local.get $7
   i64.const 7074237752028440
   i64.ge_u
   if
    local.get $1
    f64.const 0
    f64.mul
    local.get $7
    i64.const 7074237752028440
    i64.eq
    br_if $__inlined_func$~lib/math/NativeMath.mod$2
    drop
    local.get $7
    i64.const 7074237752028440
    i64.sub
    local.set $7
   end
   local.get $8
   local.get $7
   i64.const 11
   i64.shl
   i64.clz
   local.tee $13
   i64.sub
   local.set $8
   local.get $7
   local.get $13
   i64.shl
   local.set $7
   local.get $8
   i64.const 0
   i64.gt_s
   if (result i64)
    local.get $7
    i64.const 4503599627370496
    i64.sub
    local.get $8
    i64.const 52
    i64.shl
    i64.or
   else
    local.get $7
    i64.const 1
    local.get $8
    i64.sub
    i64.shr_u
   end
   local.get $12
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
  f64.store offset=24
  local.get $0
  f64.load offset=24
  call $~lib/math/NativeMath.cos
  local.set $1
  local.get $0
  f64.load offset=24
  call $~lib/math/NativeMath.sin
  local.set $2
  local.get $0
  local.get $0
  f64.load
  local.get $0
  f64.load offset=32
  local.tee $3
  local.get $1
  f64.mul
  local.get $0
  f64.load offset=40
  local.tee $4
  local.get $2
  f64.mul
  f64.sub
  local.get $9
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
  local.get $9
  f64.mul
  f64.add
  f64.store offset=8
  local.get $0
  f64.const 0
  f64.store offset=16
  local.get $0
 )
 (func $assembly/index/setThrottle (param $0 i32) (param $1 f64)
  local.get $0
  i32.eqz
  if
   i32.const 1184
   i32.const 1248
   i32.const 85
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  block $__inlined_func$assembly/index/clamp01$82 (result f64)
   f64.const 0
   local.get $1
   f64.const 0
   f64.lt
   br_if $__inlined_func$assembly/index/clamp01$82
   drop
   f64.const 1
   local.get $1
   f64.const 1
   f64.gt
   br_if $__inlined_func$assembly/index/clamp01$82
   drop
   local.get $1
  end
  f64.store offset=64
 )
 (func $assembly/index/setRudderAngle (param $0 i32) (param $1 f64)
  local.get $0
  i32.eqz
  if
   i32.const 1184
   i32.const 1248
   i32.const 85
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
  local.get $0
  f64.const -0.6
  f64.const 0.6
  local.get $1
  local.get $1
  f64.const 0.6
  f64.gt
  select
  local.tee $1
  local.get $1
  f64.const -0.6
  f64.lt
  select
  f64.store offset=72
 )
 (func $assembly/index/setBallast (param $0 i32) (param $1 f64)
  local.get $0
  i32.eqz
  if
   i32.const 1184
   i32.const 1248
   i32.const 85
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
 )
 (func $assembly/index/getVesselX (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1184
   i32.const 1248
   i32.const 85
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
   i32.const 1184
   i32.const 1248
   i32.const 85
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
   i32.const 1184
   i32.const 1248
   i32.const 85
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
   i32.const 1184
   i32.const 1248
   i32.const 85
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=24
 )
 (func $assembly/index/getVesselSpeed (param $0 i32) (result f64)
  (local $1 f64)
  local.get $0
  i32.eqz
  if
   i32.const 1184
   i32.const 1248
   i32.const 85
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=32
  local.tee $1
  local.get $1
  f64.mul
  local.get $0
  f64.load offset=40
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
   i32.const 1184
   i32.const 1248
   i32.const 85
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=32
 )
 (func $assembly/index/getVesselSwayVelocity (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1184
   i32.const 1248
   i32.const 85
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=40
 )
 (func $assembly/index/getVesselHeaveVelocity (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1184
   i32.const 1248
   i32.const 85
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=48
 )
 (func $assembly/index/getVesselRollAngle (param $0 i32) (result f64)
  f64.const 0
 )
 (func $assembly/index/getVesselRudderAngle (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1184
   i32.const 1248
   i32.const 85
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=72
 )
 (func $assembly/index/getVesselEngineRPM (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1184
   i32.const 1248
   i32.const 85
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=64
  f64.const 1200
  f64.mul
 )
 (func $assembly/index/getVesselFuelLevel (param $0 i32) (result f64)
  f64.const 1
 )
 (func $assembly/index/getVesselBallastLevel (param $0 i32) (result f64)
  f64.const 0.5
 )
 (func $assembly/index/getVesselYawRate (param $0 i32) (result f64)
  local.get $0
  i32.eqz
  if
   i32.const 1184
   i32.const 1248
   i32.const 85
   i32.const 24
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=56
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
 (func $~start
  i32.const 1500
  global.set $~lib/rt/stub/offset
 )
)
