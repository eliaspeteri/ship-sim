(module
 (type $0 (func (param i32) (result f64)))
 (type $1 (func (param i32 f64)))
 (type $2 (func (param f64) (result f64)))
 (type $3 (func (param i32 i32)))
 (type $4 (func (param f64 f64) (result f64)))
 (type $5 (func (param i32) (result i32)))
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
 (global $assembly/index/RUDDER_STALL_ANGLE f64 (f64.const 0.5))
 (global $assembly/index/RUDDER_MAX_ANGLE f64 (f64.const 0.6))
 (global $assembly/index/MAX_THRUST f64 (f64.const 8e5))
 (global $assembly/index/DEFAULT_MASS f64 (f64.const 5e6))
 (global $assembly/index/DEFAULT_LENGTH f64 (f64.const 120))
 (global $assembly/index/DEFAULT_BEAM f64 (f64.const 20))
 (global $assembly/index/DEFAULT_DRAFT f64 (f64.const 6))
 (global $assembly/index/YAW_DAMPING f64 (f64.const 0.5))
 (global $assembly/index/YAW_DAMPING_QUAD f64 (f64.const 1.2))
 (global $assembly/index/SWAY_DAMPING f64 (f64.const 0.6))
 (global $assembly/index/MAX_YAW_RATE f64 (f64.const 0.8))
 (global $assembly/index/MAX_SPEED f64 (f64.const 15))
 (global $assembly/index/PIVOT_AFT_RATIO f64 (f64.const 0.25))
 (global $assembly/index/globalVessel (mut i32) (i32.const 0))
 (global $~lib/rt/stub/startOffset (mut i32) (i32.const 0))
 (global $~lib/rt/stub/offset (mut i32) (i32.const 0))
 (global $~lib/native/ASC_SHRINK_LEVEL i32 (i32.const 0))
 (global $~lib/math/rempio2_y0 (mut f64) (f64.const 0))
 (global $~lib/math/rempio2_y1 (mut f64) (f64.const 0))
 (global $~lib/math/res128_hi (mut i64) (i64.const 0))
 (global $~lib/util/math/log_tail (mut f64) (f64.const 0))
 (global $~lib/math/NativeMath.PI f64 (f64.const 3.141592653589793))
 (global $~lib/memory/__heap_base i32 (i32.const 6608))
 (data $0 (i32.const 12) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00(\00\00\00A\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e\00\00\00\00\00")
 (data $1 (i32.const 76) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00s\00t\00u\00b\00.\00t\00s\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $2 (i32.const 140) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00,\00\00\00V\00e\00s\00s\00e\00l\00 \00p\00o\00i\00n\00t\00e\00r\00 \00i\00s\00 \00n\00u\00l\00l\00")
 (data $3 (i32.const 204) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\"\00\00\00a\00s\00s\00e\00m\00b\00l\00y\00/\00i\00n\00d\00e\00x\00.\00t\00s\00\00\00\00\00\00\00\00\00\00\00")
 (data $4 (i32.const 272) "n\83\f9\a2\00\00\00\00\d1W\'\fc)\15DN\99\95b\db\c0\dd4\f5\abcQ\feA\90C<:n$\b7a\c5\bb\de\ea.I\06\e0\d2MB\1c\eb\1d\fe\1c\92\d1\t\f55\82\e8>\a7)\b1&p\9c\e9\84D\bb.9\d6\919A~_\b4\8b_\84\9c\f49S\83\ff\97\f8\1f;(\f9\bd\8b\11/\ef\0f\98\05\de\cf~6m\1fm\nZf?FO\b7\t\cb\'\c7\ba\'u-\ea_\9e\f79\07={\f1\e5\eb\b1_\fbk\ea\92R\8aF0\03V\08]\8d\1f \bc\cf\f0\abk{\fca\91\e3\a9\1d6\f4\9a_\85\99e\08\1b\e6^\80\d8\ff\8d@h\a0\14W\15\06\061\'sM")
 (data $5 (i32.const 464) "\00\00\00\00\00\a0\f6?\00\00\00\00\00\00\00\00\00\c8\b9\f2\82,\d6\bf\80V7($\b4\fa<\00\00\00\00\00\80\f6?\00\00\00\00\00\00\00\00\00\08X\bf\bd\d1\d5\bf \f7\e0\d8\08\a5\1c\bd\00\00\00\00\00`\f6?\00\00\00\00\00\00\00\00\00XE\17wv\d5\bfmP\b6\d5\a4b#\bd\00\00\00\00\00@\f6?\00\00\00\00\00\00\00\00\00\f8-\87\ad\1a\d5\bf\d5g\b0\9e\e4\84\e6\bc\00\00\00\00\00 \f6?\00\00\00\00\00\00\00\00\00xw\95_\be\d4\bf\e0>)\93i\1b\04\bd\00\00\00\00\00\00\f6?\00\00\00\00\00\00\00\00\00`\1c\c2\8ba\d4\bf\cc\84LH/\d8\13=\00\00\00\00\00\e0\f5?\00\00\00\00\00\00\00\00\00\a8\86\860\04\d4\bf:\0b\82\ed\f3B\dc<\00\00\00\00\00\c0\f5?\00\00\00\00\00\00\00\00\00HiUL\a6\d3\bf`\94Q\86\c6\b1 =\00\00\00\00\00\a0\f5?\00\00\00\00\00\00\00\00\00\80\98\9a\ddG\d3\bf\92\80\c5\d4MY%=\00\00\00\00\00\80\f5?\00\00\00\00\00\00\00\00\00 \e1\ba\e2\e8\d2\bf\d8+\b7\99\1e{&=\00\00\00\00\00`\f5?\00\00\00\00\00\00\00\00\00\88\de\13Z\89\d2\bf?\b0\cf\b6\14\ca\15=\00\00\00\00\00`\f5?\00\00\00\00\00\00\00\00\00\88\de\13Z\89\d2\bf?\b0\cf\b6\14\ca\15=\00\00\00\00\00@\f5?\00\00\00\00\00\00\00\00\00x\cf\fbA)\d2\bfv\daS($Z\16\bd\00\00\00\00\00 \f5?\00\00\00\00\00\00\00\00\00\98i\c1\98\c8\d1\bf\04T\e7h\bc\af\1f\bd\00\00\00\00\00\00\f5?\00\00\00\00\00\00\00\00\00\a8\ab\ab\\g\d1\bf\f0\a8\823\c6\1f\1f=\00\00\00\00\00\e0\f4?\00\00\00\00\00\00\00\00\00H\ae\f9\8b\05\d1\bffZ\05\fd\c4\a8&\bd\00\00\00\00\00\c0\f4?\00\00\00\00\00\00\00\00\00\90s\e2$\a3\d0\bf\0e\03\f4~\eek\0c\bd\00\00\00\00\00\a0\f4?\00\00\00\00\00\00\00\00\00\d0\b4\94%@\d0\bf\7f-\f4\9e\b86\f0\bc\00\00\00\00\00\a0\f4?\00\00\00\00\00\00\00\00\00\d0\b4\94%@\d0\bf\7f-\f4\9e\b86\f0\bc\00\00\00\00\00\80\f4?\00\00\00\00\00\00\00\00\00@^m\18\b9\cf\bf\87<\99\ab*W\r=\00\00\00\00\00`\f4?\00\00\00\00\00\00\00\00\00`\dc\cb\ad\f0\ce\bf$\af\86\9c\b7&+=\00\00\00\00\00@\f4?\00\00\00\00\00\00\00\00\00\f0*n\07\'\ce\bf\10\ff?TO/\17\bd\00\00\00\00\00 \f4?\00\00\00\00\00\00\00\00\00\c0Ok!\\\cd\bf\1bh\ca\bb\91\ba!=\00\00\00\00\00\00\f4?\00\00\00\00\00\00\00\00\00\a0\9a\c7\f7\8f\cc\bf4\84\9fhOy\'=\00\00\00\00\00\00\f4?\00\00\00\00\00\00\00\00\00\a0\9a\c7\f7\8f\cc\bf4\84\9fhOy\'=\00\00\00\00\00\e0\f3?\00\00\00\00\00\00\00\00\00\90-t\86\c2\cb\bf\8f\b7\8b1\b0N\19=\00\00\00\00\00\c0\f3?\00\00\00\00\00\00\00\00\00\c0\80N\c9\f3\ca\bff\90\cd?cN\ba<\00\00\00\00\00\a0\f3?\00\00\00\00\00\00\00\00\00\b0\e2\1f\bc#\ca\bf\ea\c1F\dcd\8c%\bd\00\00\00\00\00\a0\f3?\00\00\00\00\00\00\00\00\00\b0\e2\1f\bc#\ca\bf\ea\c1F\dcd\8c%\bd\00\00\00\00\00\80\f3?\00\00\00\00\00\00\00\00\00P\f4\9cZR\c9\bf\e3\d4\c1\04\d9\d1*\bd\00\00\00\00\00`\f3?\00\00\00\00\00\00\00\00\00\d0 e\a0\7f\c8\bf\t\fa\db\7f\bf\bd+=\00\00\00\00\00@\f3?\00\00\00\00\00\00\00\00\00\e0\10\02\89\ab\c7\bfXJSr\90\db+=\00\00\00\00\00@\f3?\00\00\00\00\00\00\00\00\00\e0\10\02\89\ab\c7\bfXJSr\90\db+=\00\00\00\00\00 \f3?\00\00\00\00\00\00\00\00\00\d0\19\e7\0f\d6\c6\bff\e2\b2\a3j\e4\10\bd\00\00\00\00\00\00\f3?\00\00\00\00\00\00\00\00\00\90\a7p0\ff\c5\bf9P\10\9fC\9e\1e\bd\00\00\00\00\00\00\f3?\00\00\00\00\00\00\00\00\00\90\a7p0\ff\c5\bf9P\10\9fC\9e\1e\bd\00\00\00\00\00\e0\f2?\00\00\00\00\00\00\00\00\00\b0\a1\e3\e5&\c5\bf\8f[\07\90\8b\de \bd\00\00\00\00\00\c0\f2?\00\00\00\00\00\00\00\00\00\80\cbl+M\c4\bf<x5a\c1\0c\17=\00\00\00\00\00\c0\f2?\00\00\00\00\00\00\00\00\00\80\cbl+M\c4\bf<x5a\c1\0c\17=\00\00\00\00\00\a0\f2?\00\00\00\00\00\00\00\00\00\90\1e \fcq\c3\bf:T\'M\86x\f1<\00\00\00\00\00\80\f2?\00\00\00\00\00\00\00\00\00\f0\1f\f8R\95\c2\bf\08\c4q\170\8d$\bd\00\00\00\00\00`\f2?\00\00\00\00\00\00\00\00\00`/\d5*\b7\c1\bf\96\a3\11\18\a4\80.\bd\00\00\00\00\00`\f2?\00\00\00\00\00\00\00\00\00`/\d5*\b7\c1\bf\96\a3\11\18\a4\80.\bd\00\00\00\00\00@\f2?\00\00\00\00\00\00\00\00\00\90\d0|~\d7\c0\bf\f4[\e8\88\96i\n=\00\00\00\00\00@\f2?\00\00\00\00\00\00\00\00\00\90\d0|~\d7\c0\bf\f4[\e8\88\96i\n=\00\00\00\00\00 \f2?\00\00\00\00\00\00\00\00\00\e0\db1\91\ec\bf\bf\f23\a3\\Tu%\bd\00\00\00\00\00\00\f2?\00\00\00\00\00\00\00\00\00\00+n\07\'\be\bf<\00\f0*,4*=\00\00\00\00\00\00\f2?\00\00\00\00\00\00\00\00\00\00+n\07\'\be\bf<\00\f0*,4*=\00\00\00\00\00\e0\f1?\00\00\00\00\00\00\00\00\00\c0[\8fT^\bc\bf\06\be_XW\0c\1d\bd\00\00\00\00\00\c0\f1?\00\00\00\00\00\00\00\00\00\e0J:m\92\ba\bf\c8\aa[\e859%=\00\00\00\00\00\c0\f1?\00\00\00\00\00\00\00\00\00\e0J:m\92\ba\bf\c8\aa[\e859%=\00\00\00\00\00\a0\f1?\00\00\00\00\00\00\00\00\00\a01\d6E\c3\b8\bfhV/M)|\13=\00\00\00\00\00\a0\f1?\00\00\00\00\00\00\00\00\00\a01\d6E\c3\b8\bfhV/M)|\13=\00\00\00\00\00\80\f1?\00\00\00\00\00\00\00\00\00`\e5\8a\d2\f0\b6\bf\das3\c97\97&\bd\00\00\00\00\00`\f1?\00\00\00\00\00\00\00\00\00 \06?\07\1b\b5\bfW^\c6a[\02\1f=\00\00\00\00\00`\f1?\00\00\00\00\00\00\00\00\00 \06?\07\1b\b5\bfW^\c6a[\02\1f=\00\00\00\00\00@\f1?\00\00\00\00\00\00\00\00\00\e0\1b\96\d7A\b3\bf\df\13\f9\cc\da^,=\00\00\00\00\00@\f1?\00\00\00\00\00\00\00\00\00\e0\1b\96\d7A\b3\bf\df\13\f9\cc\da^,=\00\00\00\00\00 \f1?\00\00\00\00\00\00\00\00\00\80\a3\ee6e\b1\bf\t\a3\8fv^|\14=\00\00\00\00\00\00\f1?\00\00\00\00\00\00\00\00\00\80\11\c00\n\af\bf\91\8e6\83\9eY-=\00\00\00\00\00\00\f1?\00\00\00\00\00\00\00\00\00\80\11\c00\n\af\bf\91\8e6\83\9eY-=\00\00\00\00\00\e0\f0?\00\00\00\00\00\00\00\00\00\80\19q\ddB\ab\bfLp\d6\e5z\82\1c=\00\00\00\00\00\e0\f0?\00\00\00\00\00\00\00\00\00\80\19q\ddB\ab\bfLp\d6\e5z\82\1c=\00\00\00\00\00\c0\f0?\00\00\00\00\00\00\00\00\00\c02\f6Xt\a7\bf\ee\a1\f24F\fc,\bd\00\00\00\00\00\c0\f0?\00\00\00\00\00\00\00\00\00\c02\f6Xt\a7\bf\ee\a1\f24F\fc,\bd\00\00\00\00\00\a0\f0?\00\00\00\00\00\00\00\00\00\c0\fe\b9\87\9e\a3\bf\aa\fe&\f5\b7\02\f5<\00\00\00\00\00\a0\f0?\00\00\00\00\00\00\00\00\00\c0\fe\b9\87\9e\a3\bf\aa\fe&\f5\b7\02\f5<\00\00\00\00\00\80\f0?\00\00\00\00\00\00\00\00\00\00x\0e\9b\82\9f\bf\e4\t~|&\80)\bd\00\00\00\00\00\80\f0?\00\00\00\00\00\00\00\00\00\00x\0e\9b\82\9f\bf\e4\t~|&\80)\bd\00\00\00\00\00`\f0?\00\00\00\00\00\00\00\00\00\80\d5\07\1b\b9\97\bf9\a6\fa\93T\8d(\bd\00\00\00\00\00@\f0?\00\00\00\00\00\00\00\00\00\00\fc\b0\a8\c0\8f\bf\9c\a6\d3\f6|\1e\df\bc\00\00\00\00\00@\f0?\00\00\00\00\00\00\00\00\00\00\fc\b0\a8\c0\8f\bf\9c\a6\d3\f6|\1e\df\bc\00\00\00\00\00 \f0?\00\00\00\00\00\00\00\00\00\00\10k*\e0\7f\bf\e4@\da\r?\e2\19\bd\00\00\00\00\00 \f0?\00\00\00\00\00\00\00\00\00\00\10k*\e0\7f\bf\e4@\da\r?\e2\19\bd\00\00\00\00\00\00\f0?\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\f0?\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\c0\ef?\00\00\00\00\00\00\00\00\00\00\89u\15\10\80?\e8+\9d\99k\c7\10\bd\00\00\00\00\00\80\ef?\00\00\00\00\00\00\00\00\00\80\93XV \90?\d2\f7\e2\06[\dc#\bd\00\00\00\00\00@\ef?\00\00\00\00\00\00\00\00\00\00\c9(%I\98?4\0cZ2\ba\a0*\bd\00\00\00\00\00\00\ef?\00\00\00\00\00\00\00\00\00@\e7\89]A\a0?S\d7\f1\\\c0\11\01=\00\00\00\00\00\c0\ee?\00\00\00\00\00\00\00\00\00\00.\d4\aef\a4?(\fd\bdus\16,\bd\00\00\00\00\00\80\ee?\00\00\00\00\00\00\00\00\00\c0\9f\14\aa\94\a8?}&Z\d0\95y\19\bd\00\00\00\00\00@\ee?\00\00\00\00\00\00\00\00\00\c0\dd\cds\cb\ac?\07(\d8G\f2h\1a\bd\00\00\00\00\00 \ee?\00\00\00\00\00\00\00\00\00\c0\06\c01\ea\ae?{;\c9O>\11\0e\bd\00\00\00\00\00\e0\ed?\00\00\00\00\00\00\00\00\00`F\d1;\97\b1?\9b\9e\rV]2%\bd\00\00\00\00\00\a0\ed?\00\00\00\00\00\00\00\00\00\e0\d1\a7\f5\bd\b3?\d7N\db\a5^\c8,=\00\00\00\00\00`\ed?\00\00\00\00\00\00\00\00\00\a0\97MZ\e9\b5?\1e\1d]<\06i,\bd\00\00\00\00\00@\ed?\00\00\00\00\00\00\00\00\00\c0\ea\n\d3\00\b7?2\ed\9d\a9\8d\1e\ec<\00\00\00\00\00\00\ed?\00\00\00\00\00\00\00\00\00@Y]^3\b9?\daG\bd:\\\11#=\00\00\00\00\00\c0\ec?\00\00\00\00\00\00\00\00\00`\ad\8d\c8j\bb?\e5h\f7+\80\90\13\bd\00\00\00\00\00\a0\ec?\00\00\00\00\00\00\00\00\00@\bc\01X\88\bc?\d3\acZ\c6\d1F&=\00\00\00\00\00`\ec?\00\00\00\00\00\00\00\00\00 \n\839\c7\be?\e0E\e6\afh\c0-\bd\00\00\00\00\00@\ec?\00\00\00\00\00\00\00\00\00\e0\db9\91\e8\bf?\fd\n\a1O\d64%\bd\00\00\00\00\00\00\ec?\00\00\00\00\00\00\00\00\00\e0\'\82\8e\17\c1?\f2\07-\cex\ef!=\00\00\00\00\00\e0\eb?\00\00\00\00\00\00\00\00\00\f0#~+\aa\c1?4\998D\8e\a7,=\00\00\00\00\00\a0\eb?\00\00\00\00\00\00\00\00\00\80\86\0ca\d1\c2?\a1\b4\81\cbl\9d\03=\00\00\00\00\00\80\eb?\00\00\00\00\00\00\00\00\00\90\15\b0\fce\c3?\89rK#\a8/\c6<\00\00\00\00\00@\eb?\00\00\00\00\00\00\00\00\00\b03\83=\91\c4?x\b6\fdTy\83%=\00\00\00\00\00 \eb?\00\00\00\00\00\00\00\00\00\b0\a1\e4\e5\'\c5?\c7}i\e5\e83&=\00\00\00\00\00\e0\ea?\00\00\00\00\00\00\00\00\00\10\8c\beNW\c6?x.<,\8b\cf\19=\00\00\00\00\00\c0\ea?\00\00\00\00\00\00\00\00\00pu\8b\12\f0\c6?\e1!\9c\e5\8d\11%\bd\00\00\00\00\00\a0\ea?\00\00\00\00\00\00\00\00\00PD\85\8d\89\c7?\05C\91p\10f\1c\bd\00\00\00\00\00`\ea?\00\00\00\00\00\00\00\00\00\009\eb\af\be\c8?\d1,\e9\aaT=\07\bd\00\00\00\00\00@\ea?\00\00\00\00\00\00\00\00\00\00\f7\dcZZ\c9?o\ff\a0X(\f2\07=\00\00\00\00\00\00\ea?\00\00\00\00\00\00\00\00\00\e0\8a<\ed\93\ca?i!VPCr(\bd\00\00\00\00\00\e0\e9?\00\00\00\00\00\00\00\00\00\d0[W\d81\cb?\aa\e1\acN\8d5\0c\bd\00\00\00\00\00\c0\e9?\00\00\00\00\00\00\00\00\00\e0;8\87\d0\cb?\b6\12TY\c4K-\bd\00\00\00\00\00\a0\e9?\00\00\00\00\00\00\00\00\00\10\f0\c6\fbo\cc?\d2+\96\c5r\ec\f1\bc\00\00\00\00\00`\e9?\00\00\00\00\00\00\00\00\00\90\d4\b0=\b1\cd?5\b0\15\f7*\ff*\bd\00\00\00\00\00@\e9?\00\00\00\00\00\00\00\00\00\10\e7\ff\0eS\ce?0\f4A`\'\12\c2<\00\00\00\00\00 \e9?\00\00\00\00\00\00\00\00\00\00\dd\e4\ad\f5\ce?\11\8e\bbe\15!\ca\bc\00\00\00\00\00\00\e9?\00\00\00\00\00\00\00\00\00\b0\b3l\1c\99\cf?0\df\0c\ca\ec\cb\1b=\00\00\00\00\00\c0\e8?\00\00\00\00\00\00\00\00\00XM`8q\d0?\91N\ed\16\db\9c\f8<\00\00\00\00\00\a0\e8?\00\00\00\00\00\00\00\00\00`ag-\c4\d0?\e9\ea<\16\8b\18\'=\00\00\00\00\00\80\e8?\00\00\00\00\00\00\00\00\00\e8\'\82\8e\17\d1?\1c\f0\a5c\0e!,\bd\00\00\00\00\00`\e8?\00\00\00\00\00\00\00\00\00\f8\ac\cb\\k\d1?\81\16\a5\f7\cd\9a+=\00\00\00\00\00@\e8?\00\00\00\00\00\00\00\00\00hZc\99\bf\d1?\b7\bdGQ\ed\a6,=\00\00\00\00\00 \e8?\00\00\00\00\00\00\00\00\00\b8\0emE\14\d2?\ea\baF\ba\de\87\n=\00\00\00\00\00\e0\e7?\00\00\00\00\00\00\00\00\00\90\dc|\f0\be\d2?\f4\04PJ\fa\9c*=\00\00\00\00\00\c0\e7?\00\00\00\00\00\00\00\00\00`\d3\e1\f1\14\d3?\b8<!\d3z\e2(\bd\00\00\00\00\00\a0\e7?\00\00\00\00\00\00\00\00\00\10\bevgk\d3?\c8w\f1\b0\cdn\11=\00\00\00\00\00\80\e7?\00\00\00\00\00\00\00\00\0003wR\c2\d3?\\\bd\06\b6T;\18=\00\00\00\00\00`\e7?\00\00\00\00\00\00\00\00\00\e8\d5#\b4\19\d4?\9d\e0\90\ec6\e4\08=\00\00\00\00\00@\e7?\00\00\00\00\00\00\00\00\00\c8q\c2\8dq\d4?u\d6g\t\ce\'/\bd\00\00\00\00\00 \e7?\00\00\00\00\00\00\00\00\000\17\9e\e0\c9\d4?\a4\d8\n\1b\89 .\bd\00\00\00\00\00\00\e7?\00\00\00\00\00\00\00\00\00\a08\07\ae\"\d5?Y\c7d\81p\be.=\00\00\00\00\00\e0\e6?\00\00\00\00\00\00\00\00\00\d0\c8S\f7{\d5?\ef@]\ee\ed\ad\1f=\00\00\00\00\00\c0\e6?\00\00\00\00\00\00\00\00\00`Y\df\bd\d5\d5?\dce\a4\08*\0b\n\bd")
 (data $6 (i32.const 4560) "\00\00\00\00\00\00\00\00\00\00\00\00\00\00\f0?n\bf\88\1aO;\9b<53\fb\a9=\f6\ef?]\dc\d8\9c\13`q\bca\80w>\9a\ec\ef?\d1f\87\10z^\90\bc\85\7fn\e8\15\e3\ef?\13\f6g5R\d2\8c<t\85\15\d3\b0\d9\ef?\fa\8e\f9#\80\ce\8b\bc\de\f6\dd)k\d0\ef?a\c8\e6aN\f7`<\c8\9bu\18E\c7\ef?\99\d33[\e4\a3\90<\83\f3\c6\ca>\be\ef?m{\83]\a6\9a\97<\0f\89\f9lX\b5\ef?\fc\ef\fd\92\1a\b5\8e<\f7Gr+\92\ac\ef?\d1\9c/p=\be><\a2\d1\d32\ec\a3\ef?\0bn\90\894\03j\bc\1b\d3\fe\aff\9b\ef?\0e\bd/*RV\95\bcQ[\12\d0\01\93\ef?U\eaN\8c\ef\80P\bc\cc1l\c0\bd\8a\ef?\16\f4\d5\b9#\c9\91\bc\e0-\a9\ae\9a\82\ef?\afU\\\e9\e3\d3\80<Q\8e\a5\c8\98z\ef?H\93\a5\ea\15\1b\80\bc{Q}<\b8r\ef?=2\deU\f0\1f\8f\bc\ea\8d\8c8\f9j\ef?\bfS\13?\8c\89\8b<u\cbo\eb[c\ef?&\eb\11v\9c\d9\96\bc\d4\\\04\84\e0[\ef?`/:>\f7\ec\9a<\aa\b9h1\87T\ef?\9d8\86\cb\82\e7\8f\bc\1d\d9\fc\"PM\ef?\8d\c3\a6DAo\8a<\d6\8cb\88;F\ef?}\04\e4\b0\05z\80<\96\dc}\91I?\ef?\94\a8\a8\e3\fd\8e\96<8bunz8\ef?}Ht\f2\18^\87<?\a6\b2O\ce1\ef?\f2\e7\1f\98+G\80<\dd|\e2eE+\ef?^\08q?{\b8\96\bc\81c\f5\e1\df$\ef?1\ab\tm\e1\f7\82<\e1\de\1f\f5\9d\1e\ef?\fa\bfo\1a\9b!=\bc\90\d9\da\d0\7f\18\ef?\b4\n\0cr\827\8b<\0b\03\e4\a6\85\12\ef?\8f\cb\ce\89\92\14n<V/>\a9\af\0c\ef?\b6\ab\b0MuM\83<\15\b71\n\fe\06\ef?Lt\ac\e2\01B\86<1\d8L\fcp\01\ef?J\f8\d3]9\dd\8f<\ff\16d\b2\08\fc\ee?\04[\8e;\80\a3\86\bc\f1\9f\92_\c5\f6\ee?hPK\cc\edJ\92\bc\cb\a9:7\a7\f1\ee?\8e-Q\1b\f8\07\99\bcf\d8\05m\ae\ec\ee?\d26\94>\e8\d1q\bc\f7\9f\e54\db\e7\ee?\15\1b\ce\b3\19\19\99\bc\e5\a8\13\c3-\e3\ee?mL*\a7H\9f\85<\"4\12L\a6\de\ee?\8ai(z`\12\93\bc\1c\80\ac\04E\da\ee?[\89\17H\8f\a7X\bc*.\f7!\n\d6\ee?\1b\9aIg\9b,|\bc\97\a8P\d9\f5\d1\ee?\11\ac\c2`\edcC<-\89a`\08\ce\ee?\efd\06;\tf\96<W\00\1d\edA\ca\ee?y\03\a1\da\e1\ccn<\d0<\c1\b5\a2\c6\ee?0\12\0f?\8e\ff\93<\de\d3\d7\f0*\c3\ee?\b0\afz\bb\ce\90v<\'*6\d5\da\bf\ee?w\e0T\eb\bd\1d\93<\r\dd\fd\99\b2\bc\ee?\8e\a3q\004\94\8f\bc\a7,\9dv\b2\b9\ee?I\a3\93\dc\cc\de\87\bcBf\cf\a2\da\b6\ee?_8\0f\bd\c6\dex\bc\82O\9dV+\b4\ee?\f6\\{\ecF\12\86\bc\0f\92]\ca\a4\b1\ee?\8e\d7\fd\18\055\93<\da\'\b56G\af\ee?\05\9b\8a/\b7\98{<\fd\c7\97\d4\12\ad\ee?\tT\1c\e2\e1c\90<)TH\dd\07\ab\ee?\ea\c6\19P\85\c74<\b7FY\8a&\a9\ee?5\c0d+\e62\94<H!\ad\15o\a7\ee?\9fv\99aJ\e4\8c\bc\t\dcv\b9\e1\a5\ee?\a8M\ef;\c53\8c\bc\85U:\b0~\a4\ee?\ae\e9+\89xS\84\bc \c3\cc4F\a3\ee?XXVx\dd\ce\93\bc%\"U\828\a2\ee?d\19~\80\aa\10W<s\a9L\d4U\a1\ee?(\"^\bf\ef\b3\93\bc\cd;\7ff\9e\a0\ee?\82\b94\87\ad\12j\bc\bf\da\0bu\12\a0\ee?\ee\a9m\b8\efgc\bc/\1ae<\b2\9f\ee?Q\88\e0T=\dc\80\bc\84\94Q\f9}\9f\ee?\cf>Z~d\1fx\bct_\ec\e8u\9f\ee?\b0}\8b\c0J\ee\86\bct\81\a5H\9a\9f\ee?\8a\e6U\1e2\19\86\bc\c9gBV\eb\9f\ee?\d3\d4\t^\cb\9c\90<?]\deOi\a0\ee?\1d\a5M\b9\dc2{\bc\87\01\ebs\14\a1\ee?k\c0gT\fd\ec\94<2\c10\01\ed\a1\ee?Ul\d6\ab\e1\ebe<bN\cf6\f3\a2\ee?B\cf\b3/\c5\a1\88\bc\12\1a>T\'\a4\ee?47;\f1\b6i\93\bc\13\ceL\99\89\a5\ee?\1e\ff\19:\84^\80\bc\ad\c7#F\1a\a7\ee?nWr\d8P\d4\94\bc\ed\92D\9b\d9\a8\ee?\00\8a\0e[g\ad\90<\99f\8a\d9\c7\aa\ee?\b4\ea\f0\c1/\b7\8d<\db\a0*B\e5\ac\ee?\ff\e7\c5\9c`\b6e\bc\8cD\b5\162\af\ee?D_\f3Y\83\f6{<6w\15\99\ae\b1\ee?\83=\1e\a7\1f\t\93\bc\c6\ff\91\0b[\b4\ee?)\1el\8b\b8\a9]\bc\e5\c5\cd\b07\b7\ee?Y\b9\90|\f9#l\bc\0fR\c8\cbD\ba\ee?\aa\f9\f4\"CC\92\bcPN\de\9f\82\bd\ee?K\8ef\d7l\ca\85\bc\ba\07\cap\f1\c0\ee?\'\ce\91+\fc\afq<\90\f0\a3\82\91\c4\ee?\bbs\n\e15\d2m<##\e3\19c\c8\ee?c\"b\"\04\c5\87\bce\e5]{f\cc\ee?\d51\e2\e3\86\1c\8b<3-J\ec\9b\d0\ee?\15\bb\bc\d3\d1\bb\91\bc]%>\b2\03\d5\ee?\d21\ee\9c1\cc\90<X\b30\13\9e\d9\ee?\b3Zsn\84i\84<\bf\fdyUk\de\ee?\b4\9d\8e\97\cd\df\82\bcz\f3\d3\bfk\e3\ee?\873\cb\92w\1a\8c<\ad\d3Z\99\9f\e8\ee?\fa\d9\d1J\8f{\90\bcf\b6\8d)\07\ee\ee?\ba\ae\dcV\d9\c3U\bc\fb\15O\b8\a2\f3\ee?@\f6\a6=\0e\a4\90\bc:Y\e5\8dr\f9\ee?4\93\ad8\f4\d6h\bcG^\fb\f2v\ff\ee?5\8aXk\e2\ee\91\bcJ\06\a10\b0\05\ef?\cd\dd_\n\d7\fft<\d2\c1K\90\1e\0c\ef?\ac\98\92\fa\fb\bd\91\bc\t\1e\d7[\c2\12\ef?\b3\0c\af0\aens<\9cR\85\dd\9b\19\ef?\94\fd\9f\\2\e3\8e<z\d0\ff_\ab \ef?\acY\t\d1\8f\e0\84<K\d1W.\f1\'\ef?g\1aN8\af\cdc<\b5\e7\06\94m/\ef?h\19\92l,kg<i\90\ef\dc 7\ef?\d2\b5\cc\83\18\8a\80\bc\fa\c3]U\0b?\ef?o\fa\ff?]\ad\8f\bc|\89\07J-G\ef?I\a9u8\ae\r\90\bc\f2\89\r\08\87O\ef?\a7\07=\a6\85\a3t<\87\a4\fb\dc\18X\ef?\0f\"@ \9e\91\82\bc\98\83\c9\16\e3`\ef?\ac\92\c1\d5PZ\8e<\852\db\03\e6i\ef?Kk\01\acY:\84<`\b4\01\f3!s\ef?\1f>\b4\07!\d5\82\bc_\9b{3\97|\ef?\c9\rG;\b9*\89\bc)\a1\f5\14F\86\ef?\d3\88:`\04\b6t<\f6?\8b\e7.\90\ef?qr\9dQ\ec\c5\83<\83L\c7\fbQ\9a\ef?\f0\91\d3\8f\12\f7\8f\bc\da\90\a4\a2\af\a4\ef?}t#\e2\98\ae\8d\bc\f1g\8e-H\af\ef?\08 \aaA\bc\c3\8e<\'Za\ee\1b\ba\ef?2\eb\a9\c3\94+\84<\97\bak7+\c5\ef?\ee\85\d11\a9d\8a<@En[v\d0\ef?\ed\e3;\e4\ba7\8e\bc\14\be\9c\ad\fd\db\ef?\9d\cd\91M;\89w<\d8\90\9e\81\c1\e7\ef?\89\cc`A\c1\05S<\f1q\8f+\c2\f3\ef?")
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
   i32.const 98
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
 (func $~lib/math/NativeMath.pow (param $x f64) (param $y f64) (result f64)
  (local $x|2 f64)
  (local $y|3 f64)
  (local $sign_bias i32)
  (local $ix i64)
  (local $iy i64)
  (local $topx i64)
  (local $topy i64)
  (local $u i64)
  (local $u|10 i64)
  (local $x2 f64)
  (local $iy|12 i64)
  (local $e i64)
  (local $iy|14 i64)
  (local $e|15 i64)
  (local $yint i32)
  (local $ix|17 i64)
  (local $tmp i64)
  (local $i i32)
  (local $k i64)
  (local $iz i64)
  (local $z f64)
  (local $kd f64)
  (local $invc f64)
  (local $logc f64)
  (local $logctail f64)
  (local $zhi f64)
  (local $zlo f64)
  (local $rhi f64)
  (local $rlo f64)
  (local $r f64)
  (local $t1 f64)
  (local $t2 f64)
  (local $lo1 f64)
  (local $lo2 f64)
  (local $ar f64)
  (local $ar2 f64)
  (local $ar3 f64)
  (local $arhi f64)
  (local $arhi2 f64)
  (local $hi f64)
  (local $lo3 f64)
  (local $lo4 f64)
  (local $p f64)
  (local $lo f64)
  (local $y|46 f64)
  (local $hi|47 f64)
  (local $lo|48 f64)
  (local $ehi f64)
  (local $elo f64)
  (local $yhi f64)
  (local $ylo f64)
  (local $lhi f64)
  (local $llo f64)
  (local $x|55 f64)
  (local $xtail f64)
  (local $sign_bias|57 i32)
  (local $abstop i32)
  (local $ki i64)
  (local $top i64)
  (local $sbits i64)
  (local $idx i32)
  (local $kd|63 f64)
  (local $z|64 f64)
  (local $r|65 f64)
  (local $r2 f64)
  (local $scale f64)
  (local $tail f64)
  (local $tmp|69 f64)
  (local $ux i64)
  (local $sign i32)
  (local $sign|72 i32)
  (local $y|73 f64)
  (local $sign|74 i32)
  (local $sign|75 i32)
  (local $y|76 f64)
  (local $tmp|77 f64)
  (local $sbits|78 i64)
  (local $ki|79 i64)
  (local $scale|80 f64)
  (local $y|81 f64)
  (local $one f64)
  (local $lo|83 f64)
  (local $hi|84 f64)
  local.get $y
  f64.abs
  f64.const 2
  f64.le
  if
   local.get $y
   f64.const 2
   f64.eq
   if
    local.get $x
    local.get $x
    f64.mul
    return
   end
   local.get $y
   f64.const 0.5
   f64.eq
   if
    local.get $x
    f64.sqrt
    f64.abs
    f64.const inf
    local.get $x
    f64.const inf
    f64.neg
    f64.ne
    select
    return
   end
   local.get $y
   f64.const -1
   f64.eq
   if
    f64.const 1
    local.get $x
    f64.div
    return
   end
   local.get $y
   f64.const 1
   f64.eq
   if
    local.get $x
    return
   end
   local.get $y
   f64.const 0
   f64.eq
   if
    f64.const 1
    return
   end
  end
  i32.const 0
  i32.const 1
  i32.lt_s
  drop
  block $~lib/util/math/pow_lut|inlined.0 (result f64)
   local.get $x
   local.set $x|2
   local.get $y
   local.set $y|3
   i32.const 0
   local.set $sign_bias
   local.get $x|2
   i64.reinterpret_f64
   local.set $ix
   local.get $y|3
   i64.reinterpret_f64
   local.set $iy
   local.get $ix
   i64.const 52
   i64.shr_u
   local.set $topx
   local.get $iy
   i64.const 52
   i64.shr_u
   local.set $topy
   local.get $topx
   i64.const 1
   i64.sub
   i64.const 2047
   i64.const 1
   i64.sub
   i64.ge_u
   if (result i32)
    i32.const 1
   else
    local.get $topy
    i64.const 2047
    i64.and
    i64.const 958
    i64.sub
    i64.const 1086
    i64.const 958
    i64.sub
    i64.ge_u
   end
   if
    block $~lib/util/math/zeroinfnan|inlined.0 (result i32)
     local.get $iy
     local.set $u
     local.get $u
     i64.const 1
     i64.shl
     i64.const 1
     i64.sub
     i64.const -9007199254740992
     i64.const 1
     i64.sub
     i64.ge_u
     br $~lib/util/math/zeroinfnan|inlined.0
    end
    if
     local.get $iy
     i64.const 1
     i64.shl
     i64.const 0
     i64.eq
     if
      f64.const 1
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $ix
     i64.const 4607182418800017408
     i64.eq
     if
      f64.const nan:0x8000000000000
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $ix
     i64.const 1
     i64.shl
     i64.const -9007199254740992
     i64.gt_u
     if (result i32)
      i32.const 1
     else
      local.get $iy
      i64.const 1
      i64.shl
      i64.const -9007199254740992
      i64.gt_u
     end
     if
      local.get $x|2
      local.get $y|3
      f64.add
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $ix
     i64.const 1
     i64.shl
     i64.const 9214364837600034816
     i64.eq
     if
      f64.const nan:0x8000000000000
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $ix
     i64.const 1
     i64.shl
     i64.const 9214364837600034816
     i64.lt_u
     local.get $iy
     i64.const 63
     i64.shr_u
     i64.const 0
     i64.ne
     i32.eqz
     i32.eq
     if
      f64.const 0
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $y|3
     local.get $y|3
     f64.mul
     br $~lib/util/math/pow_lut|inlined.0
    end
    block $~lib/util/math/zeroinfnan|inlined.1 (result i32)
     local.get $ix
     local.set $u|10
     local.get $u|10
     i64.const 1
     i64.shl
     i64.const 1
     i64.sub
     i64.const -9007199254740992
     i64.const 1
     i64.sub
     i64.ge_u
     br $~lib/util/math/zeroinfnan|inlined.1
    end
    if
     local.get $x|2
     local.get $x|2
     f64.mul
     local.set $x2
     local.get $ix
     i64.const 63
     i64.shr_u
     i32.wrap_i64
     if (result i32)
      block $~lib/util/math/checkint|inlined.0 (result i32)
       local.get $iy
       local.set $iy|12
       local.get $iy|12
       i64.const 52
       i64.shr_u
       i64.const 2047
       i64.and
       local.set $e
       local.get $e
       i64.const 1023
       i64.lt_u
       if
        i32.const 0
        br $~lib/util/math/checkint|inlined.0
       end
       local.get $e
       i64.const 1023
       i64.const 52
       i64.add
       i64.gt_u
       if
        i32.const 2
        br $~lib/util/math/checkint|inlined.0
       end
       i64.const 1
       i64.const 1023
       i64.const 52
       i64.add
       local.get $e
       i64.sub
       i64.shl
       local.set $e
       local.get $iy|12
       local.get $e
       i64.const 1
       i64.sub
       i64.and
       i64.const 0
       i64.ne
       if
        i32.const 0
        br $~lib/util/math/checkint|inlined.0
       end
       local.get $iy|12
       local.get $e
       i64.and
       i64.const 0
       i64.ne
       if
        i32.const 1
        br $~lib/util/math/checkint|inlined.0
       end
       i32.const 2
       br $~lib/util/math/checkint|inlined.0
      end
      i32.const 1
      i32.eq
     else
      i32.const 0
     end
     if
      local.get $x2
      f64.neg
      local.set $x2
     end
     local.get $iy
     i64.const 0
     i64.lt_s
     if (result f64)
      f64.const 1
      local.get $x2
      f64.div
     else
      local.get $x2
     end
     br $~lib/util/math/pow_lut|inlined.0
    end
    local.get $ix
    i64.const 0
    i64.lt_s
    if
     block $~lib/util/math/checkint|inlined.1 (result i32)
      local.get $iy
      local.set $iy|14
      local.get $iy|14
      i64.const 52
      i64.shr_u
      i64.const 2047
      i64.and
      local.set $e|15
      local.get $e|15
      i64.const 1023
      i64.lt_u
      if
       i32.const 0
       br $~lib/util/math/checkint|inlined.1
      end
      local.get $e|15
      i64.const 1023
      i64.const 52
      i64.add
      i64.gt_u
      if
       i32.const 2
       br $~lib/util/math/checkint|inlined.1
      end
      i64.const 1
      i64.const 1023
      i64.const 52
      i64.add
      local.get $e|15
      i64.sub
      i64.shl
      local.set $e|15
      local.get $iy|14
      local.get $e|15
      i64.const 1
      i64.sub
      i64.and
      i64.const 0
      i64.ne
      if
       i32.const 0
       br $~lib/util/math/checkint|inlined.1
      end
      local.get $iy|14
      local.get $e|15
      i64.and
      i64.const 0
      i64.ne
      if
       i32.const 1
       br $~lib/util/math/checkint|inlined.1
      end
      i32.const 2
      br $~lib/util/math/checkint|inlined.1
     end
     local.set $yint
     local.get $yint
     i32.const 0
     i32.eq
     if
      local.get $x|2
      local.get $x|2
      f64.sub
      local.get $x|2
      local.get $x|2
      f64.sub
      f64.div
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $yint
     i32.const 1
     i32.eq
     if
      i32.const 262144
      local.set $sign_bias
     end
     local.get $ix
     i64.const 9223372036854775807
     i64.and
     local.set $ix
     local.get $topx
     i64.const 2047
     i64.and
     local.set $topx
    end
    local.get $topy
    i64.const 2047
    i64.and
    i64.const 958
    i64.sub
    i64.const 1086
    i64.const 958
    i64.sub
    i64.ge_u
    if
     local.get $ix
     i64.const 4607182418800017408
     i64.eq
     if
      f64.const 1
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $topy
     i64.const 2047
     i64.and
     i64.const 958
     i64.lt_u
     if
      f64.const 1
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $ix
     i64.const 4607182418800017408
     i64.gt_u
     local.get $topy
     i64.const 2048
     i64.lt_u
     i32.eq
     if (result f64)
      f64.const inf
     else
      f64.const 0
     end
     br $~lib/util/math/pow_lut|inlined.0
    end
    local.get $topx
    i64.const 0
    i64.eq
    if
     local.get $x|2
     f64.const 4503599627370496
     f64.mul
     i64.reinterpret_f64
     local.set $ix
     local.get $ix
     i64.const 9223372036854775807
     i64.and
     local.set $ix
     local.get $ix
     i64.const 52
     i64.const 52
     i64.shl
     i64.sub
     local.set $ix
    end
   end
   block $~lib/util/math/log_inline|inlined.0 (result f64)
    local.get $ix
    local.set $ix|17
    local.get $ix|17
    i64.const 4604531861337669632
    i64.sub
    local.set $tmp
    local.get $tmp
    i64.const 52
    i32.const 7
    i64.extend_i32_s
    i64.sub
    i64.shr_u
    i32.const 127
    i64.extend_i32_s
    i64.and
    i32.wrap_i64
    local.set $i
    local.get $tmp
    i64.const 52
    i64.shr_s
    local.set $k
    local.get $ix|17
    local.get $tmp
    i64.const 4095
    i64.const 52
    i64.shl
    i64.and
    i64.sub
    local.set $iz
    local.get $iz
    f64.reinterpret_i64
    local.set $z
    local.get $k
    f64.convert_i64_s
    local.set $kd
    i32.const 464
    local.get $i
    i32.const 2
    i32.const 3
    i32.add
    i32.shl
    i32.add
    f64.load
    local.set $invc
    i32.const 464
    local.get $i
    i32.const 2
    i32.const 3
    i32.add
    i32.shl
    i32.add
    f64.load offset=16
    local.set $logc
    i32.const 464
    local.get $i
    i32.const 2
    i32.const 3
    i32.add
    i32.shl
    i32.add
    f64.load offset=24
    local.set $logctail
    local.get $iz
    i64.const 2147483648
    i64.add
    i64.const -4294967296
    i64.and
    f64.reinterpret_i64
    local.set $zhi
    local.get $z
    local.get $zhi
    f64.sub
    local.set $zlo
    local.get $zhi
    local.get $invc
    f64.mul
    f64.const 1
    f64.sub
    local.set $rhi
    local.get $zlo
    local.get $invc
    f64.mul
    local.set $rlo
    local.get $rhi
    local.get $rlo
    f64.add
    local.set $r
    local.get $kd
    f64.const 0.6931471805598903
    f64.mul
    local.get $logc
    f64.add
    local.set $t1
    local.get $t1
    local.get $r
    f64.add
    local.set $t2
    local.get $kd
    f64.const 5.497923018708371e-14
    f64.mul
    local.get $logctail
    f64.add
    local.set $lo1
    local.get $t1
    local.get $t2
    f64.sub
    local.get $r
    f64.add
    local.set $lo2
    f64.const -0.5
    local.get $r
    f64.mul
    local.set $ar
    local.get $r
    local.get $ar
    f64.mul
    local.set $ar2
    local.get $r
    local.get $ar2
    f64.mul
    local.set $ar3
    f64.const -0.5
    local.get $rhi
    f64.mul
    local.set $arhi
    local.get $rhi
    local.get $arhi
    f64.mul
    local.set $arhi2
    local.get $t2
    local.get $arhi2
    f64.add
    local.set $hi
    local.get $rlo
    local.get $ar
    local.get $arhi
    f64.add
    f64.mul
    local.set $lo3
    local.get $t2
    local.get $hi
    f64.sub
    local.get $arhi2
    f64.add
    local.set $lo4
    local.get $ar3
    f64.const -0.6666666666666679
    local.get $r
    f64.const 0.5000000000000007
    f64.mul
    f64.add
    local.get $ar2
    f64.const 0.7999999995323976
    local.get $r
    f64.const -0.6666666663487739
    f64.mul
    f64.add
    local.get $ar2
    f64.const -1.142909628459501
    local.get $r
    f64.const 1.0000415263675542
    f64.mul
    f64.add
    f64.mul
    f64.add
    f64.mul
    f64.add
    f64.mul
    local.set $p
    local.get $lo1
    local.get $lo2
    f64.add
    local.get $lo3
    f64.add
    local.get $lo4
    f64.add
    local.get $p
    f64.add
    local.set $lo
    local.get $hi
    local.get $lo
    f64.add
    local.set $y|46
    local.get $hi
    local.get $y|46
    f64.sub
    local.get $lo
    f64.add
    global.set $~lib/util/math/log_tail
    local.get $y|46
    br $~lib/util/math/log_inline|inlined.0
   end
   local.set $hi|47
   global.get $~lib/util/math/log_tail
   local.set $lo|48
   local.get $iy
   i64.const -134217728
   i64.and
   f64.reinterpret_i64
   local.set $yhi
   local.get $y|3
   local.get $yhi
   f64.sub
   local.set $ylo
   local.get $hi|47
   i64.reinterpret_f64
   i64.const -134217728
   i64.and
   f64.reinterpret_i64
   local.set $lhi
   local.get $hi|47
   local.get $lhi
   f64.sub
   local.get $lo|48
   f64.add
   local.set $llo
   local.get $yhi
   local.get $lhi
   f64.mul
   local.set $ehi
   local.get $ylo
   local.get $lhi
   f64.mul
   local.get $y|3
   local.get $llo
   f64.mul
   f64.add
   local.set $elo
   block $~lib/util/math/exp_inline|inlined.0 (result f64)
    local.get $ehi
    local.set $x|55
    local.get $elo
    local.set $xtail
    local.get $sign_bias
    local.set $sign_bias|57
    local.get $x|55
    i64.reinterpret_f64
    local.set $ux
    local.get $ux
    i64.const 52
    i64.shr_u
    i32.wrap_i64
    i32.const 2047
    i32.and
    local.set $abstop
    local.get $abstop
    i32.const 969
    i32.sub
    i32.const 63
    i32.ge_u
    if
     local.get $abstop
     i32.const 969
     i32.sub
     i32.const -2147483648
     i32.ge_u
     if
      f64.const -1
      f64.const 1
      local.get $sign_bias|57
      select
      br $~lib/util/math/exp_inline|inlined.0
     end
     local.get $abstop
     i32.const 1033
     i32.ge_u
     if
      local.get $ux
      i64.const 0
      i64.lt_s
      if (result f64)
       block $~lib/util/math/uflow|inlined.0 (result f64)
        local.get $sign_bias|57
        local.set $sign
        block $~lib/util/math/xflow|inlined.0 (result f64)
         local.get $sign
         local.set $sign|72
         i64.const 1152921504606846976
         f64.reinterpret_i64
         local.set $y|73
         local.get $y|73
         f64.neg
         local.get $y|73
         local.get $sign|72
         select
         local.get $y|73
         f64.mul
         br $~lib/util/math/xflow|inlined.0
        end
        br $~lib/util/math/uflow|inlined.0
       end
      else
       block $~lib/util/math/oflow|inlined.0 (result f64)
        local.get $sign_bias|57
        local.set $sign|74
        block $~lib/util/math/xflow|inlined.1 (result f64)
         local.get $sign|74
         local.set $sign|75
         i64.const 8070450532247928832
         f64.reinterpret_i64
         local.set $y|76
         local.get $y|76
         f64.neg
         local.get $y|76
         local.get $sign|75
         select
         local.get $y|76
         f64.mul
         br $~lib/util/math/xflow|inlined.1
        end
        br $~lib/util/math/oflow|inlined.0
       end
      end
      br $~lib/util/math/exp_inline|inlined.0
     end
     i32.const 0
     local.set $abstop
    end
    f64.const 184.6649652337873
    local.get $x|55
    f64.mul
    local.set $z|64
    local.get $z|64
    f64.const 6755399441055744
    f64.add
    local.set $kd|63
    local.get $kd|63
    i64.reinterpret_f64
    local.set $ki
    local.get $kd|63
    f64.const 6755399441055744
    f64.sub
    local.set $kd|63
    local.get $x|55
    local.get $kd|63
    f64.const -0.005415212348111709
    f64.mul
    f64.add
    local.get $kd|63
    f64.const -1.2864023111638346e-14
    f64.mul
    f64.add
    local.set $r|65
    local.get $r|65
    local.get $xtail
    f64.add
    local.set $r|65
    local.get $ki
    i32.const 127
    i64.extend_i32_s
    i64.and
    i64.const 1
    i64.shl
    i32.wrap_i64
    local.set $idx
    local.get $ki
    local.get $sign_bias|57
    i64.extend_i32_u
    i64.add
    i64.const 52
    i32.const 7
    i64.extend_i32_s
    i64.sub
    i64.shl
    local.set $top
    i32.const 4560
    local.get $idx
    i32.const 3
    i32.shl
    i32.add
    i64.load
    f64.reinterpret_i64
    local.set $tail
    i32.const 4560
    local.get $idx
    i32.const 3
    i32.shl
    i32.add
    i64.load offset=8
    local.get $top
    i64.add
    local.set $sbits
    local.get $r|65
    local.get $r|65
    f64.mul
    local.set $r2
    local.get $tail
    local.get $r|65
    f64.add
    local.get $r2
    f64.const 0.49999999999996786
    local.get $r|65
    f64.const 0.16666666666665886
    f64.mul
    f64.add
    f64.mul
    f64.add
    local.get $r2
    local.get $r2
    f64.mul
    f64.const 0.0416666808410674
    local.get $r|65
    f64.const 0.008333335853059549
    f64.mul
    f64.add
    f64.mul
    f64.add
    local.set $tmp|69
    local.get $abstop
    i32.const 0
    i32.eq
    if
     block $~lib/util/math/specialcase|inlined.0 (result f64)
      local.get $tmp|69
      local.set $tmp|77
      local.get $sbits
      local.set $sbits|78
      local.get $ki
      local.set $ki|79
      local.get $ki|79
      i64.const 2147483648
      i64.and
      i64.const 0
      i64.ne
      i32.eqz
      if
       local.get $sbits|78
       i64.const 1009
       i64.const 52
       i64.shl
       i64.sub
       local.set $sbits|78
       local.get $sbits|78
       f64.reinterpret_i64
       local.set $scale|80
       f64.const 5486124068793688683255936e279
       local.get $scale|80
       local.get $scale|80
       local.get $tmp|77
       f64.mul
       f64.add
       f64.mul
       br $~lib/util/math/specialcase|inlined.0
      end
      local.get $sbits|78
      i64.const 1022
      i64.const 52
      i64.shl
      i64.add
      local.set $sbits|78
      local.get $sbits|78
      f64.reinterpret_i64
      local.set $scale|80
      local.get $scale|80
      local.get $scale|80
      local.get $tmp|77
      f64.mul
      f64.add
      local.set $y|81
      local.get $y|81
      f64.abs
      f64.const 1
      f64.lt
      if
       f64.const 1
       local.get $y|81
       f64.copysign
       local.set $one
       local.get $scale|80
       local.get $y|81
       f64.sub
       local.get $scale|80
       local.get $tmp|77
       f64.mul
       f64.add
       local.set $lo|83
       local.get $one
       local.get $y|81
       f64.add
       local.set $hi|84
       local.get $one
       local.get $hi|84
       f64.sub
       local.get $y|81
       f64.add
       local.get $lo|83
       f64.add
       local.set $lo|83
       local.get $hi|84
       local.get $lo|83
       f64.add
       local.get $one
       f64.sub
       local.set $y|81
       local.get $y|81
       f64.const 0
       f64.eq
       if
        local.get $sbits|78
        i64.const -9223372036854775808
        i64.and
        f64.reinterpret_i64
        local.set $y|81
       end
      end
      local.get $y|81
      f64.const 2.2250738585072014e-308
      f64.mul
      br $~lib/util/math/specialcase|inlined.0
     end
     br $~lib/util/math/exp_inline|inlined.0
    end
    local.get $sbits
    f64.reinterpret_i64
    local.set $scale
    local.get $scale
    local.get $scale
    local.get $tmp|69
    f64.mul
    f64.add
    br $~lib/util/math/exp_inline|inlined.0
   end
   br $~lib/util/math/pow_lut|inlined.0
  end
  return
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
  (local $x|19 f64)
  (local $value1 f64)
  (local $value2 f64)
  (local $stallFactor f64)
  (local $value1|23 f64)
  (local $value2|24 f64)
  (local $rudderForce f64)
  (local $leverArm f64)
  (local $rudderMoment f64)
  (local $windYaw f64)
  (local $mass f64)
  (local $Izz f64)
  (local $uDot f64)
  (local $vDot f64)
  (local $x|33 f64)
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
  f64.const 1
  block $~lib/math/NativeMath.min|inlined.0 (result f64)
   f64.const 1
   local.set $value1
   block $~lib/math/NativeMath.abs|inlined.2 (result f64)
    local.get $vessel
    call $assembly/index/VesselState#get:rudderAngle
    local.set $x|19
    local.get $x|19
    f64.abs
    br $~lib/math/NativeMath.abs|inlined.2
   end
   global.get $assembly/index/RUDDER_STALL_ANGLE
   f64.div
   local.set $value2
   local.get $value1
   local.get $value2
   f64.min
   br $~lib/math/NativeMath.min|inlined.0
  end
  f64.const 2
  call $~lib/math/NativeMath.pow
  f64.sub
  local.set $stallFactor
  global.get $assembly/index/RUDDER_FORCE_COEFFICIENT
  local.get $vessel
  call $assembly/index/VesselState#get:rudderAngle
  f64.mul
  local.get $speedMag
  f64.mul
  local.get $speedMag
  f64.mul
  block $~lib/math/NativeMath.max|inlined.0 (result f64)
   f64.const 0
   local.set $value1|23
   local.get $stallFactor
   local.set $value2|24
   local.get $value1|23
   local.get $value2|24
   f64.max
   br $~lib/math/NativeMath.max|inlined.0
  end
  f64.mul
  local.set $rudderForce
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.const 0.5
  global.get $assembly/index/PIVOT_AFT_RATIO
  f64.add
  f64.mul
  local.set $leverArm
  local.get $rudderForce
  local.get $leverArm
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
  global.get $assembly/index/SWAY_DAMPING
  local.get $vessel
  call $assembly/index/VesselState#get:v
  f64.mul
  f64.sub
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
  global.get $assembly/index/YAW_DAMPING_QUAD
  local.get $vessel
  call $assembly/index/VesselState#get:r
  f64.mul
  block $~lib/math/NativeMath.abs|inlined.3 (result f64)
   local.get $vessel
   call $assembly/index/VesselState#get:r
   local.set $x|33
   local.get $x|33
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.3
  end
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
  block $~lib/math/NativeMath.abs|inlined.4 (result f64)
   local.get $vesselPtr
   call $assembly/index/ensureVessel
   call $assembly/index/VesselState#get:throttle
   local.set $x
   local.get $x
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.4
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
