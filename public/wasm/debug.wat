(module
 (type $0 (func (param i32) (result f64)))
 (type $1 (func (param i32 f64)))
 (type $2 (func (param f64) (result f64)))
 (type $3 (func (param i32) (result i32)))
 (type $4 (func (param i32 i32)))
 (type $5 (func (param i32 f64) (result f64)))
 (type $6 (func (param i32 f64 f64) (result f64)))
 (type $7 (func (param i32 i32) (result i32)))
 (type $8 (func (param i32 i32 i32 i32)))
 (type $9 (func (param i32)))
 (type $10 (func (param i32 f64 f64) (result i32)))
 (type $11 (func (param i32 i32) (result f64)))
 (type $12 (func (param f64) (result i32)))
 (type $13 (func (param f64 i64) (result i32)))
 (type $14 (func (param f64 f64 f64 f64 f64 f64 f64 f64) (result f64)))
 (type $15 (func (param f64 f64) (result f64)))
 (type $16 (func (param i32 i32 i32) (result i32)))
 (type $17 (func (param i32 i32 i32)))
 (type $18 (func (param i32 i32 i32 i32) (result i32)))
 (type $19 (func (param i32 i32 f64)))
 (type $20 (func (param i32 f64 f64 f64 f64 f64 f64) (result i32)))
 (type $21 (func (param i32 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64) (result i32)))
 (type $22 (func (result i32)))
 (type $23 (func (param i32 f64 f64)))
 (type $24 (func))
 (import "env" "memory" (memory $0 16 100))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (global $assembly/index/globalVessel (mut i32) (i32.const 0))
 (global $assembly/index/HM_C1 f64 (f64.const 2223105))
 (global $assembly/index/HM_C2 f64 (f64.const 4))
 (global $assembly/index/HM_C3 f64 (f64.const 0.5))
 (global $assembly/index/HM_C4 f64 (f64.const 0.15))
 (global $assembly/index/WAVE_GRAVITY f64 (f64.const 9.81))
 (global $assembly/index/WAVE_LENGTH_FACTOR f64 (f64.const 1.5))
 (global $assembly/index/BEAUFORT_WAVE_HEIGHTS i32 (i32.const 160))
 (global $~lib/math/NativeMath.PI f64 (f64.const 3.141592653589793))
 (global $~lib/shared/runtime/Runtime.Stub i32 (i32.const 0))
 (global $~lib/shared/runtime/Runtime.Minimal i32 (i32.const 1))
 (global $~lib/shared/runtime/Runtime.Incremental i32 (i32.const 2))
 (global $~lib/native/ASC_SHRINK_LEVEL i32 (i32.const 0))
 (global $~lib/math/rempio2_y0 (mut f64) (f64.const 0))
 (global $~lib/math/rempio2_y1 (mut f64) (f64.const 0))
 (global $~lib/math/res128_hi (mut i64) (i64.const 0))
 (global $~lib/util/math/log_tail (mut f64) (f64.const 0))
 (global $~lib/rt/stub/startOffset (mut i32) (i32.const 0))
 (global $~lib/rt/stub/offset (mut i32) (i32.const 0))
 (global $~lib/native/ASC_RUNTIME i32 (i32.const 0))
 (global $~lib/memory/__heap_base i32 (i32.const 6908))
 (data $0 (i32.const 12) "|\00\00\00\00\00\00\00\00\00\00\00\01\00\00\00h\00\00\00\00\00\00\00\00\00\00\00\9a\99\99\99\99\99\b9?\9a\99\99\99\99\99\c9?333333\e3?\00\00\00\00\00\00\f0?\00\00\00\00\00\00\00@\00\00\00\00\00\00\08@\00\00\00\00\00\00\10@\00\00\00\00\00\00\16@\00\00\00\00\00\00\1c@\00\00\00\00\00\00\"@\00\00\00\00\00\00\'@\00\00\00\00\00\00,@\00\00\00\00")
 (data $1 (i32.const 140) ",\00\00\00\00\00\00\00\00\00\00\00\05\00\00\00\10\00\00\00 \00\00\00 \00\00\00h\00\00\00\r\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $2 (i32.const 188) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00$\00\00\00I\00n\00d\00e\00x\00 \00o\00u\00t\00 \00o\00f\00 \00r\00a\00n\00g\00e\00\00\00\00\00\00\00\00\00")
 (data $3 (i32.const 252) ",\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\1a\00\00\00~\00l\00i\00b\00/\00a\00r\00r\00a\00y\00.\00t\00s\00\00\00")
 (data $4 (i32.const 304) "n\83\f9\a2\00\00\00\00\d1W\'\fc)\15DN\99\95b\db\c0\dd4\f5\abcQ\feA\90C<:n$\b7a\c5\bb\de\ea.I\06\e0\d2MB\1c\eb\1d\fe\1c\92\d1\t\f55\82\e8>\a7)\b1&p\9c\e9\84D\bb.9\d6\919A~_\b4\8b_\84\9c\f49S\83\ff\97\f8\1f;(\f9\bd\8b\11/\ef\0f\98\05\de\cf~6m\1fm\nZf?FO\b7\t\cb\'\c7\ba\'u-\ea_\9e\f79\07={\f1\e5\eb\b1_\fbk\ea\92R\8aF0\03V\08]\8d\1f \bc\cf\f0\abk{\fca\91\e3\a9\1d6\f4\9a_\85\99e\08\1b\e6^\80\d8\ff\8d@h\a0\14W\15\06\061\'sM")
 (data $5 (i32.const 496) "\00\00\00\00\00\a0\f6?\00\00\00\00\00\00\00\00\00\c8\b9\f2\82,\d6\bf\80V7($\b4\fa<\00\00\00\00\00\80\f6?\00\00\00\00\00\00\00\00\00\08X\bf\bd\d1\d5\bf \f7\e0\d8\08\a5\1c\bd\00\00\00\00\00`\f6?\00\00\00\00\00\00\00\00\00XE\17wv\d5\bfmP\b6\d5\a4b#\bd\00\00\00\00\00@\f6?\00\00\00\00\00\00\00\00\00\f8-\87\ad\1a\d5\bf\d5g\b0\9e\e4\84\e6\bc\00\00\00\00\00 \f6?\00\00\00\00\00\00\00\00\00xw\95_\be\d4\bf\e0>)\93i\1b\04\bd\00\00\00\00\00\00\f6?\00\00\00\00\00\00\00\00\00`\1c\c2\8ba\d4\bf\cc\84LH/\d8\13=\00\00\00\00\00\e0\f5?\00\00\00\00\00\00\00\00\00\a8\86\860\04\d4\bf:\0b\82\ed\f3B\dc<\00\00\00\00\00\c0\f5?\00\00\00\00\00\00\00\00\00HiUL\a6\d3\bf`\94Q\86\c6\b1 =\00\00\00\00\00\a0\f5?\00\00\00\00\00\00\00\00\00\80\98\9a\ddG\d3\bf\92\80\c5\d4MY%=\00\00\00\00\00\80\f5?\00\00\00\00\00\00\00\00\00 \e1\ba\e2\e8\d2\bf\d8+\b7\99\1e{&=\00\00\00\00\00`\f5?\00\00\00\00\00\00\00\00\00\88\de\13Z\89\d2\bf?\b0\cf\b6\14\ca\15=\00\00\00\00\00`\f5?\00\00\00\00\00\00\00\00\00\88\de\13Z\89\d2\bf?\b0\cf\b6\14\ca\15=\00\00\00\00\00@\f5?\00\00\00\00\00\00\00\00\00x\cf\fbA)\d2\bfv\daS($Z\16\bd\00\00\00\00\00 \f5?\00\00\00\00\00\00\00\00\00\98i\c1\98\c8\d1\bf\04T\e7h\bc\af\1f\bd\00\00\00\00\00\00\f5?\00\00\00\00\00\00\00\00\00\a8\ab\ab\\g\d1\bf\f0\a8\823\c6\1f\1f=\00\00\00\00\00\e0\f4?\00\00\00\00\00\00\00\00\00H\ae\f9\8b\05\d1\bffZ\05\fd\c4\a8&\bd\00\00\00\00\00\c0\f4?\00\00\00\00\00\00\00\00\00\90s\e2$\a3\d0\bf\0e\03\f4~\eek\0c\bd\00\00\00\00\00\a0\f4?\00\00\00\00\00\00\00\00\00\d0\b4\94%@\d0\bf\7f-\f4\9e\b86\f0\bc\00\00\00\00\00\a0\f4?\00\00\00\00\00\00\00\00\00\d0\b4\94%@\d0\bf\7f-\f4\9e\b86\f0\bc\00\00\00\00\00\80\f4?\00\00\00\00\00\00\00\00\00@^m\18\b9\cf\bf\87<\99\ab*W\r=\00\00\00\00\00`\f4?\00\00\00\00\00\00\00\00\00`\dc\cb\ad\f0\ce\bf$\af\86\9c\b7&+=\00\00\00\00\00@\f4?\00\00\00\00\00\00\00\00\00\f0*n\07\'\ce\bf\10\ff?TO/\17\bd\00\00\00\00\00 \f4?\00\00\00\00\00\00\00\00\00\c0Ok!\\\cd\bf\1bh\ca\bb\91\ba!=\00\00\00\00\00\00\f4?\00\00\00\00\00\00\00\00\00\a0\9a\c7\f7\8f\cc\bf4\84\9fhOy\'=\00\00\00\00\00\00\f4?\00\00\00\00\00\00\00\00\00\a0\9a\c7\f7\8f\cc\bf4\84\9fhOy\'=\00\00\00\00\00\e0\f3?\00\00\00\00\00\00\00\00\00\90-t\86\c2\cb\bf\8f\b7\8b1\b0N\19=\00\00\00\00\00\c0\f3?\00\00\00\00\00\00\00\00\00\c0\80N\c9\f3\ca\bff\90\cd?cN\ba<\00\00\00\00\00\a0\f3?\00\00\00\00\00\00\00\00\00\b0\e2\1f\bc#\ca\bf\ea\c1F\dcd\8c%\bd\00\00\00\00\00\a0\f3?\00\00\00\00\00\00\00\00\00\b0\e2\1f\bc#\ca\bf\ea\c1F\dcd\8c%\bd\00\00\00\00\00\80\f3?\00\00\00\00\00\00\00\00\00P\f4\9cZR\c9\bf\e3\d4\c1\04\d9\d1*\bd\00\00\00\00\00`\f3?\00\00\00\00\00\00\00\00\00\d0 e\a0\7f\c8\bf\t\fa\db\7f\bf\bd+=\00\00\00\00\00@\f3?\00\00\00\00\00\00\00\00\00\e0\10\02\89\ab\c7\bfXJSr\90\db+=\00\00\00\00\00@\f3?\00\00\00\00\00\00\00\00\00\e0\10\02\89\ab\c7\bfXJSr\90\db+=\00\00\00\00\00 \f3?\00\00\00\00\00\00\00\00\00\d0\19\e7\0f\d6\c6\bff\e2\b2\a3j\e4\10\bd\00\00\00\00\00\00\f3?\00\00\00\00\00\00\00\00\00\90\a7p0\ff\c5\bf9P\10\9fC\9e\1e\bd\00\00\00\00\00\00\f3?\00\00\00\00\00\00\00\00\00\90\a7p0\ff\c5\bf9P\10\9fC\9e\1e\bd\00\00\00\00\00\e0\f2?\00\00\00\00\00\00\00\00\00\b0\a1\e3\e5&\c5\bf\8f[\07\90\8b\de \bd\00\00\00\00\00\c0\f2?\00\00\00\00\00\00\00\00\00\80\cbl+M\c4\bf<x5a\c1\0c\17=\00\00\00\00\00\c0\f2?\00\00\00\00\00\00\00\00\00\80\cbl+M\c4\bf<x5a\c1\0c\17=\00\00\00\00\00\a0\f2?\00\00\00\00\00\00\00\00\00\90\1e \fcq\c3\bf:T\'M\86x\f1<\00\00\00\00\00\80\f2?\00\00\00\00\00\00\00\00\00\f0\1f\f8R\95\c2\bf\08\c4q\170\8d$\bd\00\00\00\00\00`\f2?\00\00\00\00\00\00\00\00\00`/\d5*\b7\c1\bf\96\a3\11\18\a4\80.\bd\00\00\00\00\00`\f2?\00\00\00\00\00\00\00\00\00`/\d5*\b7\c1\bf\96\a3\11\18\a4\80.\bd\00\00\00\00\00@\f2?\00\00\00\00\00\00\00\00\00\90\d0|~\d7\c0\bf\f4[\e8\88\96i\n=\00\00\00\00\00@\f2?\00\00\00\00\00\00\00\00\00\90\d0|~\d7\c0\bf\f4[\e8\88\96i\n=\00\00\00\00\00 \f2?\00\00\00\00\00\00\00\00\00\e0\db1\91\ec\bf\bf\f23\a3\\Tu%\bd\00\00\00\00\00\00\f2?\00\00\00\00\00\00\00\00\00\00+n\07\'\be\bf<\00\f0*,4*=\00\00\00\00\00\00\f2?\00\00\00\00\00\00\00\00\00\00+n\07\'\be\bf<\00\f0*,4*=\00\00\00\00\00\e0\f1?\00\00\00\00\00\00\00\00\00\c0[\8fT^\bc\bf\06\be_XW\0c\1d\bd\00\00\00\00\00\c0\f1?\00\00\00\00\00\00\00\00\00\e0J:m\92\ba\bf\c8\aa[\e859%=\00\00\00\00\00\c0\f1?\00\00\00\00\00\00\00\00\00\e0J:m\92\ba\bf\c8\aa[\e859%=\00\00\00\00\00\a0\f1?\00\00\00\00\00\00\00\00\00\a01\d6E\c3\b8\bfhV/M)|\13=\00\00\00\00\00\a0\f1?\00\00\00\00\00\00\00\00\00\a01\d6E\c3\b8\bfhV/M)|\13=\00\00\00\00\00\80\f1?\00\00\00\00\00\00\00\00\00`\e5\8a\d2\f0\b6\bf\das3\c97\97&\bd\00\00\00\00\00`\f1?\00\00\00\00\00\00\00\00\00 \06?\07\1b\b5\bfW^\c6a[\02\1f=\00\00\00\00\00`\f1?\00\00\00\00\00\00\00\00\00 \06?\07\1b\b5\bfW^\c6a[\02\1f=\00\00\00\00\00@\f1?\00\00\00\00\00\00\00\00\00\e0\1b\96\d7A\b3\bf\df\13\f9\cc\da^,=\00\00\00\00\00@\f1?\00\00\00\00\00\00\00\00\00\e0\1b\96\d7A\b3\bf\df\13\f9\cc\da^,=\00\00\00\00\00 \f1?\00\00\00\00\00\00\00\00\00\80\a3\ee6e\b1\bf\t\a3\8fv^|\14=\00\00\00\00\00\00\f1?\00\00\00\00\00\00\00\00\00\80\11\c00\n\af\bf\91\8e6\83\9eY-=\00\00\00\00\00\00\f1?\00\00\00\00\00\00\00\00\00\80\11\c00\n\af\bf\91\8e6\83\9eY-=\00\00\00\00\00\e0\f0?\00\00\00\00\00\00\00\00\00\80\19q\ddB\ab\bfLp\d6\e5z\82\1c=\00\00\00\00\00\e0\f0?\00\00\00\00\00\00\00\00\00\80\19q\ddB\ab\bfLp\d6\e5z\82\1c=\00\00\00\00\00\c0\f0?\00\00\00\00\00\00\00\00\00\c02\f6Xt\a7\bf\ee\a1\f24F\fc,\bd\00\00\00\00\00\c0\f0?\00\00\00\00\00\00\00\00\00\c02\f6Xt\a7\bf\ee\a1\f24F\fc,\bd\00\00\00\00\00\a0\f0?\00\00\00\00\00\00\00\00\00\c0\fe\b9\87\9e\a3\bf\aa\fe&\f5\b7\02\f5<\00\00\00\00\00\a0\f0?\00\00\00\00\00\00\00\00\00\c0\fe\b9\87\9e\a3\bf\aa\fe&\f5\b7\02\f5<\00\00\00\00\00\80\f0?\00\00\00\00\00\00\00\00\00\00x\0e\9b\82\9f\bf\e4\t~|&\80)\bd\00\00\00\00\00\80\f0?\00\00\00\00\00\00\00\00\00\00x\0e\9b\82\9f\bf\e4\t~|&\80)\bd\00\00\00\00\00`\f0?\00\00\00\00\00\00\00\00\00\80\d5\07\1b\b9\97\bf9\a6\fa\93T\8d(\bd\00\00\00\00\00@\f0?\00\00\00\00\00\00\00\00\00\00\fc\b0\a8\c0\8f\bf\9c\a6\d3\f6|\1e\df\bc\00\00\00\00\00@\f0?\00\00\00\00\00\00\00\00\00\00\fc\b0\a8\c0\8f\bf\9c\a6\d3\f6|\1e\df\bc\00\00\00\00\00 \f0?\00\00\00\00\00\00\00\00\00\00\10k*\e0\7f\bf\e4@\da\r?\e2\19\bd\00\00\00\00\00 \f0?\00\00\00\00\00\00\00\00\00\00\10k*\e0\7f\bf\e4@\da\r?\e2\19\bd\00\00\00\00\00\00\f0?\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\f0?\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\c0\ef?\00\00\00\00\00\00\00\00\00\00\89u\15\10\80?\e8+\9d\99k\c7\10\bd\00\00\00\00\00\80\ef?\00\00\00\00\00\00\00\00\00\80\93XV \90?\d2\f7\e2\06[\dc#\bd\00\00\00\00\00@\ef?\00\00\00\00\00\00\00\00\00\00\c9(%I\98?4\0cZ2\ba\a0*\bd\00\00\00\00\00\00\ef?\00\00\00\00\00\00\00\00\00@\e7\89]A\a0?S\d7\f1\\\c0\11\01=\00\00\00\00\00\c0\ee?\00\00\00\00\00\00\00\00\00\00.\d4\aef\a4?(\fd\bdus\16,\bd\00\00\00\00\00\80\ee?\00\00\00\00\00\00\00\00\00\c0\9f\14\aa\94\a8?}&Z\d0\95y\19\bd\00\00\00\00\00@\ee?\00\00\00\00\00\00\00\00\00\c0\dd\cds\cb\ac?\07(\d8G\f2h\1a\bd\00\00\00\00\00 \ee?\00\00\00\00\00\00\00\00\00\c0\06\c01\ea\ae?{;\c9O>\11\0e\bd\00\00\00\00\00\e0\ed?\00\00\00\00\00\00\00\00\00`F\d1;\97\b1?\9b\9e\rV]2%\bd\00\00\00\00\00\a0\ed?\00\00\00\00\00\00\00\00\00\e0\d1\a7\f5\bd\b3?\d7N\db\a5^\c8,=\00\00\00\00\00`\ed?\00\00\00\00\00\00\00\00\00\a0\97MZ\e9\b5?\1e\1d]<\06i,\bd\00\00\00\00\00@\ed?\00\00\00\00\00\00\00\00\00\c0\ea\n\d3\00\b7?2\ed\9d\a9\8d\1e\ec<\00\00\00\00\00\00\ed?\00\00\00\00\00\00\00\00\00@Y]^3\b9?\daG\bd:\\\11#=\00\00\00\00\00\c0\ec?\00\00\00\00\00\00\00\00\00`\ad\8d\c8j\bb?\e5h\f7+\80\90\13\bd\00\00\00\00\00\a0\ec?\00\00\00\00\00\00\00\00\00@\bc\01X\88\bc?\d3\acZ\c6\d1F&=\00\00\00\00\00`\ec?\00\00\00\00\00\00\00\00\00 \n\839\c7\be?\e0E\e6\afh\c0-\bd\00\00\00\00\00@\ec?\00\00\00\00\00\00\00\00\00\e0\db9\91\e8\bf?\fd\n\a1O\d64%\bd\00\00\00\00\00\00\ec?\00\00\00\00\00\00\00\00\00\e0\'\82\8e\17\c1?\f2\07-\cex\ef!=\00\00\00\00\00\e0\eb?\00\00\00\00\00\00\00\00\00\f0#~+\aa\c1?4\998D\8e\a7,=\00\00\00\00\00\a0\eb?\00\00\00\00\00\00\00\00\00\80\86\0ca\d1\c2?\a1\b4\81\cbl\9d\03=\00\00\00\00\00\80\eb?\00\00\00\00\00\00\00\00\00\90\15\b0\fce\c3?\89rK#\a8/\c6<\00\00\00\00\00@\eb?\00\00\00\00\00\00\00\00\00\b03\83=\91\c4?x\b6\fdTy\83%=\00\00\00\00\00 \eb?\00\00\00\00\00\00\00\00\00\b0\a1\e4\e5\'\c5?\c7}i\e5\e83&=\00\00\00\00\00\e0\ea?\00\00\00\00\00\00\00\00\00\10\8c\beNW\c6?x.<,\8b\cf\19=\00\00\00\00\00\c0\ea?\00\00\00\00\00\00\00\00\00pu\8b\12\f0\c6?\e1!\9c\e5\8d\11%\bd\00\00\00\00\00\a0\ea?\00\00\00\00\00\00\00\00\00PD\85\8d\89\c7?\05C\91p\10f\1c\bd\00\00\00\00\00`\ea?\00\00\00\00\00\00\00\00\00\009\eb\af\be\c8?\d1,\e9\aaT=\07\bd\00\00\00\00\00@\ea?\00\00\00\00\00\00\00\00\00\00\f7\dcZZ\c9?o\ff\a0X(\f2\07=\00\00\00\00\00\00\ea?\00\00\00\00\00\00\00\00\00\e0\8a<\ed\93\ca?i!VPCr(\bd\00\00\00\00\00\e0\e9?\00\00\00\00\00\00\00\00\00\d0[W\d81\cb?\aa\e1\acN\8d5\0c\bd\00\00\00\00\00\c0\e9?\00\00\00\00\00\00\00\00\00\e0;8\87\d0\cb?\b6\12TY\c4K-\bd\00\00\00\00\00\a0\e9?\00\00\00\00\00\00\00\00\00\10\f0\c6\fbo\cc?\d2+\96\c5r\ec\f1\bc\00\00\00\00\00`\e9?\00\00\00\00\00\00\00\00\00\90\d4\b0=\b1\cd?5\b0\15\f7*\ff*\bd\00\00\00\00\00@\e9?\00\00\00\00\00\00\00\00\00\10\e7\ff\0eS\ce?0\f4A`\'\12\c2<\00\00\00\00\00 \e9?\00\00\00\00\00\00\00\00\00\00\dd\e4\ad\f5\ce?\11\8e\bbe\15!\ca\bc\00\00\00\00\00\00\e9?\00\00\00\00\00\00\00\00\00\b0\b3l\1c\99\cf?0\df\0c\ca\ec\cb\1b=\00\00\00\00\00\c0\e8?\00\00\00\00\00\00\00\00\00XM`8q\d0?\91N\ed\16\db\9c\f8<\00\00\00\00\00\a0\e8?\00\00\00\00\00\00\00\00\00`ag-\c4\d0?\e9\ea<\16\8b\18\'=\00\00\00\00\00\80\e8?\00\00\00\00\00\00\00\00\00\e8\'\82\8e\17\d1?\1c\f0\a5c\0e!,\bd\00\00\00\00\00`\e8?\00\00\00\00\00\00\00\00\00\f8\ac\cb\\k\d1?\81\16\a5\f7\cd\9a+=\00\00\00\00\00@\e8?\00\00\00\00\00\00\00\00\00hZc\99\bf\d1?\b7\bdGQ\ed\a6,=\00\00\00\00\00 \e8?\00\00\00\00\00\00\00\00\00\b8\0emE\14\d2?\ea\baF\ba\de\87\n=\00\00\00\00\00\e0\e7?\00\00\00\00\00\00\00\00\00\90\dc|\f0\be\d2?\f4\04PJ\fa\9c*=\00\00\00\00\00\c0\e7?\00\00\00\00\00\00\00\00\00`\d3\e1\f1\14\d3?\b8<!\d3z\e2(\bd\00\00\00\00\00\a0\e7?\00\00\00\00\00\00\00\00\00\10\bevgk\d3?\c8w\f1\b0\cdn\11=\00\00\00\00\00\80\e7?\00\00\00\00\00\00\00\00\0003wR\c2\d3?\\\bd\06\b6T;\18=\00\00\00\00\00`\e7?\00\00\00\00\00\00\00\00\00\e8\d5#\b4\19\d4?\9d\e0\90\ec6\e4\08=\00\00\00\00\00@\e7?\00\00\00\00\00\00\00\00\00\c8q\c2\8dq\d4?u\d6g\t\ce\'/\bd\00\00\00\00\00 \e7?\00\00\00\00\00\00\00\00\000\17\9e\e0\c9\d4?\a4\d8\n\1b\89 .\bd\00\00\00\00\00\00\e7?\00\00\00\00\00\00\00\00\00\a08\07\ae\"\d5?Y\c7d\81p\be.=\00\00\00\00\00\e0\e6?\00\00\00\00\00\00\00\00\00\d0\c8S\f7{\d5?\ef@]\ee\ed\ad\1f=\00\00\00\00\00\c0\e6?\00\00\00\00\00\00\00\00\00`Y\df\bd\d5\d5?\dce\a4\08*\0b\n\bd")
 (data $6 (i32.const 4592) "\00\00\00\00\00\00\00\00\00\00\00\00\00\00\f0?n\bf\88\1aO;\9b<53\fb\a9=\f6\ef?]\dc\d8\9c\13`q\bca\80w>\9a\ec\ef?\d1f\87\10z^\90\bc\85\7fn\e8\15\e3\ef?\13\f6g5R\d2\8c<t\85\15\d3\b0\d9\ef?\fa\8e\f9#\80\ce\8b\bc\de\f6\dd)k\d0\ef?a\c8\e6aN\f7`<\c8\9bu\18E\c7\ef?\99\d33[\e4\a3\90<\83\f3\c6\ca>\be\ef?m{\83]\a6\9a\97<\0f\89\f9lX\b5\ef?\fc\ef\fd\92\1a\b5\8e<\f7Gr+\92\ac\ef?\d1\9c/p=\be><\a2\d1\d32\ec\a3\ef?\0bn\90\894\03j\bc\1b\d3\fe\aff\9b\ef?\0e\bd/*RV\95\bcQ[\12\d0\01\93\ef?U\eaN\8c\ef\80P\bc\cc1l\c0\bd\8a\ef?\16\f4\d5\b9#\c9\91\bc\e0-\a9\ae\9a\82\ef?\afU\\\e9\e3\d3\80<Q\8e\a5\c8\98z\ef?H\93\a5\ea\15\1b\80\bc{Q}<\b8r\ef?=2\deU\f0\1f\8f\bc\ea\8d\8c8\f9j\ef?\bfS\13?\8c\89\8b<u\cbo\eb[c\ef?&\eb\11v\9c\d9\96\bc\d4\\\04\84\e0[\ef?`/:>\f7\ec\9a<\aa\b9h1\87T\ef?\9d8\86\cb\82\e7\8f\bc\1d\d9\fc\"PM\ef?\8d\c3\a6DAo\8a<\d6\8cb\88;F\ef?}\04\e4\b0\05z\80<\96\dc}\91I?\ef?\94\a8\a8\e3\fd\8e\96<8bunz8\ef?}Ht\f2\18^\87<?\a6\b2O\ce1\ef?\f2\e7\1f\98+G\80<\dd|\e2eE+\ef?^\08q?{\b8\96\bc\81c\f5\e1\df$\ef?1\ab\tm\e1\f7\82<\e1\de\1f\f5\9d\1e\ef?\fa\bfo\1a\9b!=\bc\90\d9\da\d0\7f\18\ef?\b4\n\0cr\827\8b<\0b\03\e4\a6\85\12\ef?\8f\cb\ce\89\92\14n<V/>\a9\af\0c\ef?\b6\ab\b0MuM\83<\15\b71\n\fe\06\ef?Lt\ac\e2\01B\86<1\d8L\fcp\01\ef?J\f8\d3]9\dd\8f<\ff\16d\b2\08\fc\ee?\04[\8e;\80\a3\86\bc\f1\9f\92_\c5\f6\ee?hPK\cc\edJ\92\bc\cb\a9:7\a7\f1\ee?\8e-Q\1b\f8\07\99\bcf\d8\05m\ae\ec\ee?\d26\94>\e8\d1q\bc\f7\9f\e54\db\e7\ee?\15\1b\ce\b3\19\19\99\bc\e5\a8\13\c3-\e3\ee?mL*\a7H\9f\85<\"4\12L\a6\de\ee?\8ai(z`\12\93\bc\1c\80\ac\04E\da\ee?[\89\17H\8f\a7X\bc*.\f7!\n\d6\ee?\1b\9aIg\9b,|\bc\97\a8P\d9\f5\d1\ee?\11\ac\c2`\edcC<-\89a`\08\ce\ee?\efd\06;\tf\96<W\00\1d\edA\ca\ee?y\03\a1\da\e1\ccn<\d0<\c1\b5\a2\c6\ee?0\12\0f?\8e\ff\93<\de\d3\d7\f0*\c3\ee?\b0\afz\bb\ce\90v<\'*6\d5\da\bf\ee?w\e0T\eb\bd\1d\93<\r\dd\fd\99\b2\bc\ee?\8e\a3q\004\94\8f\bc\a7,\9dv\b2\b9\ee?I\a3\93\dc\cc\de\87\bcBf\cf\a2\da\b6\ee?_8\0f\bd\c6\dex\bc\82O\9dV+\b4\ee?\f6\\{\ecF\12\86\bc\0f\92]\ca\a4\b1\ee?\8e\d7\fd\18\055\93<\da\'\b56G\af\ee?\05\9b\8a/\b7\98{<\fd\c7\97\d4\12\ad\ee?\tT\1c\e2\e1c\90<)TH\dd\07\ab\ee?\ea\c6\19P\85\c74<\b7FY\8a&\a9\ee?5\c0d+\e62\94<H!\ad\15o\a7\ee?\9fv\99aJ\e4\8c\bc\t\dcv\b9\e1\a5\ee?\a8M\ef;\c53\8c\bc\85U:\b0~\a4\ee?\ae\e9+\89xS\84\bc \c3\cc4F\a3\ee?XXVx\dd\ce\93\bc%\"U\828\a2\ee?d\19~\80\aa\10W<s\a9L\d4U\a1\ee?(\"^\bf\ef\b3\93\bc\cd;\7ff\9e\a0\ee?\82\b94\87\ad\12j\bc\bf\da\0bu\12\a0\ee?\ee\a9m\b8\efgc\bc/\1ae<\b2\9f\ee?Q\88\e0T=\dc\80\bc\84\94Q\f9}\9f\ee?\cf>Z~d\1fx\bct_\ec\e8u\9f\ee?\b0}\8b\c0J\ee\86\bct\81\a5H\9a\9f\ee?\8a\e6U\1e2\19\86\bc\c9gBV\eb\9f\ee?\d3\d4\t^\cb\9c\90<?]\deOi\a0\ee?\1d\a5M\b9\dc2{\bc\87\01\ebs\14\a1\ee?k\c0gT\fd\ec\94<2\c10\01\ed\a1\ee?Ul\d6\ab\e1\ebe<bN\cf6\f3\a2\ee?B\cf\b3/\c5\a1\88\bc\12\1a>T\'\a4\ee?47;\f1\b6i\93\bc\13\ceL\99\89\a5\ee?\1e\ff\19:\84^\80\bc\ad\c7#F\1a\a7\ee?nWr\d8P\d4\94\bc\ed\92D\9b\d9\a8\ee?\00\8a\0e[g\ad\90<\99f\8a\d9\c7\aa\ee?\b4\ea\f0\c1/\b7\8d<\db\a0*B\e5\ac\ee?\ff\e7\c5\9c`\b6e\bc\8cD\b5\162\af\ee?D_\f3Y\83\f6{<6w\15\99\ae\b1\ee?\83=\1e\a7\1f\t\93\bc\c6\ff\91\0b[\b4\ee?)\1el\8b\b8\a9]\bc\e5\c5\cd\b07\b7\ee?Y\b9\90|\f9#l\bc\0fR\c8\cbD\ba\ee?\aa\f9\f4\"CC\92\bcPN\de\9f\82\bd\ee?K\8ef\d7l\ca\85\bc\ba\07\cap\f1\c0\ee?\'\ce\91+\fc\afq<\90\f0\a3\82\91\c4\ee?\bbs\n\e15\d2m<##\e3\19c\c8\ee?c\"b\"\04\c5\87\bce\e5]{f\cc\ee?\d51\e2\e3\86\1c\8b<3-J\ec\9b\d0\ee?\15\bb\bc\d3\d1\bb\91\bc]%>\b2\03\d5\ee?\d21\ee\9c1\cc\90<X\b30\13\9e\d9\ee?\b3Zsn\84i\84<\bf\fdyUk\de\ee?\b4\9d\8e\97\cd\df\82\bcz\f3\d3\bfk\e3\ee?\873\cb\92w\1a\8c<\ad\d3Z\99\9f\e8\ee?\fa\d9\d1J\8f{\90\bcf\b6\8d)\07\ee\ee?\ba\ae\dcV\d9\c3U\bc\fb\15O\b8\a2\f3\ee?@\f6\a6=\0e\a4\90\bc:Y\e5\8dr\f9\ee?4\93\ad8\f4\d6h\bcG^\fb\f2v\ff\ee?5\8aXk\e2\ee\91\bcJ\06\a10\b0\05\ef?\cd\dd_\n\d7\fft<\d2\c1K\90\1e\0c\ef?\ac\98\92\fa\fb\bd\91\bc\t\1e\d7[\c2\12\ef?\b3\0c\af0\aens<\9cR\85\dd\9b\19\ef?\94\fd\9f\\2\e3\8e<z\d0\ff_\ab \ef?\acY\t\d1\8f\e0\84<K\d1W.\f1\'\ef?g\1aN8\af\cdc<\b5\e7\06\94m/\ef?h\19\92l,kg<i\90\ef\dc 7\ef?\d2\b5\cc\83\18\8a\80\bc\fa\c3]U\0b?\ef?o\fa\ff?]\ad\8f\bc|\89\07J-G\ef?I\a9u8\ae\r\90\bc\f2\89\r\08\87O\ef?\a7\07=\a6\85\a3t<\87\a4\fb\dc\18X\ef?\0f\"@ \9e\91\82\bc\98\83\c9\16\e3`\ef?\ac\92\c1\d5PZ\8e<\852\db\03\e6i\ef?Kk\01\acY:\84<`\b4\01\f3!s\ef?\1f>\b4\07!\d5\82\bc_\9b{3\97|\ef?\c9\rG;\b9*\89\bc)\a1\f5\14F\86\ef?\d3\88:`\04\b6t<\f6?\8b\e7.\90\ef?qr\9dQ\ec\c5\83<\83L\c7\fbQ\9a\ef?\f0\91\d3\8f\12\f7\8f\bc\da\90\a4\a2\af\a4\ef?}t#\e2\98\ae\8d\bc\f1g\8e-H\af\ef?\08 \aaA\bc\c3\8e<\'Za\ee\1b\ba\ef?2\eb\a9\c3\94+\84<\97\bak7+\c5\ef?\ee\85\d11\a9d\8a<@En[v\d0\ef?\ed\e3;\e4\ba7\8e\bc\14\be\9c\ad\fd\db\ef?\9d\cd\91M;\89w<\d8\90\9e\81\c1\e7\ef?\89\cc`A\c1\05S<\f1q\8f+\c2\f3\ef?")
 (data $7 (i32.const 6652) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00(\00\00\00A\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e\00\00\00\00\00")
 (data $8 (i32.const 6716) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00s\00t\00u\00b\00.\00t\00s\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $9 (i32.const 6780) ",\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\1c\00\00\00I\00n\00v\00a\00l\00i\00d\00 \00l\00e\00n\00g\00t\00h\00")
 (data $10 (i32.const 6828) "L\00\00\00\00\00\00\00\00\00\00\00\01\00\00\000\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (table $0 1 funcref)
 (elem $0 (i32.const 1))
 (export "calculateWaveFrequency" (func $assembly/index/calculateWaveFrequency))
 (export "getWaveHeightForSeaState" (func $assembly/index/getWaveHeightForSeaState))
 (export "calculateBeaufortScale" (func $assembly/index/calculateBeaufortScale))
 (export "calculateWaveLength" (func $assembly/index/calculateWaveLength))
 (export "calculateWaveHeightAtPosition" (func $assembly/index/calculateWaveHeightAtPosition))
 (export "updateVesselState" (func $assembly/index/updateVesselState))
 (export "createVessel" (func $assembly/index/createVessel))
 (export "setThrottle" (func $assembly/index/setThrottle))
 (export "setWaveData" (func $assembly/index/setWaveData))
 (export "setRudderAngle" (func $assembly/index/setRudderAngle))
 (export "setBallast" (func $assembly/index/setBallast))
 (export "getVesselRollAngle" (func $assembly/index/getVesselRollAngle))
 (export "getVesselPitchAngle" (func $assembly/index/getVesselPitchAngle))
 (export "getVesselX" (func $assembly/index/getVesselX))
 (export "getVesselY" (func $assembly/index/getVesselY))
 (export "getVesselZ" (func $assembly/index/getVesselZ))
 (export "getVesselHeading" (func $assembly/index/getVesselHeading))
 (export "getVesselSpeed" (func $assembly/index/getVesselSpeed))
 (export "getVesselEngineRPM" (func $assembly/index/getVesselEngineRPM))
 (export "getVesselFuelLevel" (func $assembly/index/getVesselFuelLevel))
 (export "getVesselFuelConsumption" (func $assembly/index/getVesselFuelConsumption))
 (export "getVesselGM" (func $assembly/index/getVesselGM))
 (export "getVesselCenterOfGravityY" (func $assembly/index/getVesselCenterOfGravityY))
 (export "memory" (memory $0))
 (export "table" (table $0))
 (start $~start)
 (func $assembly/index/calculateWaveFrequency (param $seaState f64) (result f64)
  (local $wavePeriod f64)
  f64.const 3
  local.get $seaState
  f64.const 1.6
  f64.mul
  f64.add
  local.set $wavePeriod
  f64.const 2
  global.get $~lib/math/NativeMath.PI
  f64.mul
  local.get $wavePeriod
  f64.div
  return
 )
 (func $~lib/array/Array<f64>#get:length_ (param $this i32) (result i32)
  local.get $this
  i32.load offset=12
 )
 (func $~lib/array/Array<f64>#get:dataStart (param $this i32) (result i32)
  local.get $this
  i32.load offset=4
 )
 (func $~lib/array/Array<f64>#__get (param $this i32) (param $index i32) (result f64)
  (local $value f64)
  local.get $index
  local.get $this
  call $~lib/array/Array<f64>#get:length_
  i32.ge_u
  if
   i32.const 208
   i32.const 272
   i32.const 114
   i32.const 42
   call $~lib/builtins/abort
   unreachable
  end
  local.get $this
  call $~lib/array/Array<f64>#get:dataStart
  local.get $index
  i32.const 3
  i32.shl
  i32.add
  f64.load
  local.set $value
  i32.const 0
  drop
  local.get $value
  return
 )
 (func $assembly/index/getWaveHeightForSeaState (param $seaState f64) (result f64)
  (local $x f64)
  (local $value1 f64)
  (local $value2 f64)
  (local $value1|4 f64)
  (local $value2|5 f64)
  (local $index f64)
  block $~lib/math/NativeMath.min|inlined.0 (result f64)
   block $~lib/math/NativeMath.max|inlined.0 (result f64)
    f64.const 0
    local.set $value1
    block $~lib/math/NativeMath.floor|inlined.0 (result f64)
     local.get $seaState
     local.set $x
     local.get $x
     f64.floor
     br $~lib/math/NativeMath.floor|inlined.0
    end
    local.set $value2
    local.get $value1
    local.get $value2
    f64.max
    br $~lib/math/NativeMath.max|inlined.0
   end
   local.set $value1|4
   f64.const 12
   local.set $value2|5
   local.get $value1|4
   local.get $value2|5
   f64.min
   br $~lib/math/NativeMath.min|inlined.0
  end
  local.set $index
  global.get $assembly/index/BEAUFORT_WAVE_HEIGHTS
  local.get $index
  i32.trunc_sat_f64_s
  call $~lib/array/Array<f64>#__get
  return
 )
 (func $assembly/index/calculateBeaufortScale (param $windSpeed f64) (result i32)
  local.get $windSpeed
  f64.const 0.5
  f64.lt
  if
   i32.const 0
   return
  end
  local.get $windSpeed
  f64.const 1.5
  f64.lt
  if
   i32.const 1
   return
  end
  local.get $windSpeed
  f64.const 3.3
  f64.lt
  if
   i32.const 2
   return
  end
  local.get $windSpeed
  f64.const 5.5
  f64.lt
  if
   i32.const 3
   return
  end
  local.get $windSpeed
  f64.const 8
  f64.lt
  if
   i32.const 4
   return
  end
  local.get $windSpeed
  f64.const 10.8
  f64.lt
  if
   i32.const 5
   return
  end
  local.get $windSpeed
  f64.const 13.9
  f64.lt
  if
   i32.const 6
   return
  end
  local.get $windSpeed
  f64.const 17.2
  f64.lt
  if
   i32.const 7
   return
  end
  local.get $windSpeed
  f64.const 20.8
  f64.lt
  if
   i32.const 8
   return
  end
  local.get $windSpeed
  f64.const 24.5
  f64.lt
  if
   i32.const 9
   return
  end
  local.get $windSpeed
  f64.const 28.5
  f64.lt
  if
   i32.const 10
   return
  end
  local.get $windSpeed
  f64.const 32.7
  f64.lt
  if
   i32.const 11
   return
  end
  i32.const 12
  return
 )
 (func $assembly/index/calculateWaveLength (param $seaState f64) (result f64)
  (local $wavePeriod f64)
  f64.const 3
  local.get $seaState
  f64.const 1.6
  f64.mul
  f64.add
  local.set $wavePeriod
  global.get $assembly/index/WAVE_LENGTH_FACTOR
  local.get $wavePeriod
  f64.mul
  local.get $wavePeriod
  f64.mul
  return
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
  i32.const 304
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
 (func $assembly/index/calculateWaveHeightAtPosition (param $x f64) (param $y f64) (param $time f64) (param $waveHeight f64) (param $waveLength f64) (param $waveFrequency f64) (param $waveDirection f64) (param $seaState f64) (result f64)
  (local $k f64)
  (local $dirX f64)
  (local $dirY f64)
  (local $dot f64)
  (local $phase f64)
  (local $height f64)
  local.get $seaState
  f64.const 0.5
  f64.lt
  if
   f64.const 0
   return
  end
  f64.const 2
  global.get $~lib/math/NativeMath.PI
  f64.mul
  local.get $waveLength
  f64.div
  local.set $k
  local.get $waveDirection
  call $~lib/math/NativeMath.cos
  local.set $dirX
  local.get $waveDirection
  call $~lib/math/NativeMath.sin
  local.set $dirY
  local.get $x
  local.get $dirX
  f64.mul
  local.get $y
  local.get $dirY
  f64.mul
  f64.add
  local.set $dot
  local.get $k
  local.get $dot
  f64.mul
  local.get $waveFrequency
  local.get $time
  f64.mul
  f64.sub
  local.set $phase
  local.get $waveHeight
  f64.const 0.5
  f64.mul
  local.get $phase
  call $~lib/math/NativeMath.sin
  f64.mul
  local.set $height
  local.get $height
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
 (func $assembly/index/VesselState#get:length (param $this i32) (result f64)
  local.get $this
  f64.load offset=120
 )
 (func $assembly/index/VesselState#get:draft (param $this i32) (result f64)
  local.get $this
  f64.load offset=136
 )
 (func $assembly/index/VesselState#get:beam (param $this i32) (result f64)
  local.get $this
  f64.load offset=128
 )
 (func $assembly/index/VesselState#get:blockCoefficient (param $this i32) (result f64)
  local.get $this
  f64.load offset=144
 )
 (func $~lib/math/NativeMath.log10 (param $x f64) (result f64)
  (local $u i64)
  (local $hx i32)
  (local $k i32)
  (local $sign i32)
  (local $f f64)
  (local $hfsq f64)
  (local $s f64)
  (local $z f64)
  (local $w f64)
  (local $t1 f64)
  (local $t2 f64)
  (local $r f64)
  (local $hi f64)
  (local $lo f64)
  (local $val_hi f64)
  (local $dk f64)
  (local $y f64)
  (local $val_lo f64)
  local.get $x
  i64.reinterpret_f64
  local.set $u
  local.get $u
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.set $hx
  i32.const 0
  local.set $k
  local.get $hx
  i32.const 31
  i32.shr_u
  local.set $sign
  local.get $sign
  if (result i32)
   i32.const 1
  else
   local.get $hx
   i32.const 1048576
   i32.lt_u
  end
  if
   local.get $u
   i64.const 1
   i64.shl
   i64.const 0
   i64.eq
   if
    f64.const -1
    local.get $x
    local.get $x
    f64.mul
    f64.div
    return
   end
   local.get $sign
   if
    local.get $x
    local.get $x
    f64.sub
    f64.const 0
    f64.div
    return
   end
   local.get $k
   i32.const 54
   i32.sub
   local.set $k
   local.get $x
   f64.const 18014398509481984
   f64.mul
   local.set $x
   local.get $x
   i64.reinterpret_f64
   local.set $u
   local.get $u
   i64.const 32
   i64.shr_u
   i32.wrap_i64
   local.set $hx
  else
   local.get $hx
   i32.const 2146435072
   i32.ge_u
   if
    local.get $x
    return
   else
    local.get $hx
    i32.const 1072693248
    i32.eq
    if (result i32)
     local.get $u
     i64.const 32
     i64.shl
     i64.const 0
     i64.eq
    else
     i32.const 0
    end
    if
     f64.const 0
     return
    end
   end
  end
  local.get $hx
  i32.const 1072693248
  i32.const 1072079006
  i32.sub
  i32.add
  local.set $hx
  local.get $k
  local.get $hx
  i32.const 20
  i32.shr_u
  i32.const 1023
  i32.sub
  i32.add
  local.set $k
  local.get $hx
  i32.const 1048575
  i32.and
  i32.const 1072079006
  i32.add
  local.set $hx
  local.get $hx
  i64.extend_i32_u
  i64.const 32
  i64.shl
  local.get $u
  i64.const 4294967295
  i64.and
  i64.or
  local.set $u
  local.get $u
  f64.reinterpret_i64
  local.set $x
  local.get $x
  f64.const 1
  f64.sub
  local.set $f
  f64.const 0.5
  local.get $f
  f64.mul
  local.get $f
  f64.mul
  local.set $hfsq
  local.get $f
  f64.const 2
  local.get $f
  f64.add
  f64.div
  local.set $s
  local.get $s
  local.get $s
  f64.mul
  local.set $z
  local.get $z
  local.get $z
  f64.mul
  local.set $w
  local.get $w
  f64.const 0.3999999999940942
  local.get $w
  f64.const 0.22222198432149784
  local.get $w
  f64.const 0.15313837699209373
  f64.mul
  f64.add
  f64.mul
  f64.add
  f64.mul
  local.set $t1
  local.get $z
  f64.const 0.6666666666666735
  local.get $w
  f64.const 0.2857142874366239
  local.get $w
  f64.const 0.1818357216161805
  local.get $w
  f64.const 0.14798198605116586
  f64.mul
  f64.add
  f64.mul
  f64.add
  f64.mul
  f64.add
  f64.mul
  local.set $t2
  local.get $t2
  local.get $t1
  f64.add
  local.set $r
  local.get $f
  local.get $hfsq
  f64.sub
  local.set $hi
  local.get $hi
  i64.reinterpret_f64
  local.set $u
  local.get $u
  i64.const -4294967296
  i64.and
  local.set $u
  local.get $u
  f64.reinterpret_i64
  local.set $hi
  local.get $f
  local.get $hi
  f64.sub
  local.get $hfsq
  f64.sub
  local.get $s
  local.get $hfsq
  local.get $r
  f64.add
  f64.mul
  f64.add
  local.set $lo
  local.get $hi
  f64.const 0.4342944818781689
  f64.mul
  local.set $val_hi
  local.get $k
  f64.convert_i32_s
  local.set $dk
  local.get $dk
  f64.const 0.30102999566361177
  f64.mul
  local.set $y
  local.get $dk
  f64.const 3.694239077158931e-13
  f64.mul
  local.get $lo
  local.get $hi
  f64.add
  f64.const 2.5082946711645275e-11
  f64.mul
  f64.add
  local.get $lo
  f64.const 0.4342944818781689
  f64.mul
  f64.add
  local.set $val_lo
  local.get $y
  local.get $val_hi
  f64.add
  local.set $w
  local.get $val_lo
  local.get $y
  local.get $w
  f64.sub
  local.get $val_hi
  f64.add
  f64.add
  local.set $val_lo
  local.get $val_lo
  local.get $w
  f64.add
  return
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
    i32.const 496
    local.get $i
    i32.const 2
    i32.const 3
    i32.add
    i32.shl
    i32.add
    f64.load
    local.set $invc
    i32.const 496
    local.get $i
    i32.const 2
    i32.const 3
    i32.add
    i32.shl
    i32.add
    f64.load offset=16
    local.set $logc
    i32.const 496
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
    i32.const 4592
    local.get $idx
    i32.const 3
    i32.shl
    i32.add
    i64.load
    f64.reinterpret_i64
    local.set $tail
    i32.const 4592
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
 (func $assembly/index/VesselState#get:waterDensity (param $this i32) (result f64)
  local.get $this
  f64.load offset=152
 )
 (func $assembly/index/VesselState#get:displacement (param $this i32) (result f64)
  local.get $this
  f64.load offset=216
 )
 (func $~lib/math/NativeMath.exp (param $x f64) (result f64)
  (local $x|1 f64)
  (local $ux i64)
  (local $abstop i32)
  (local $z f64)
  (local $kd f64)
  (local $ki i64)
  (local $r f64)
  (local $idx i32)
  (local $top i64)
  (local $tail f64)
  (local $sbits i64)
  (local $r2 f64)
  (local $tmp f64)
  (local $tmp|14 f64)
  (local $sbits|15 i64)
  (local $ki|16 i64)
  (local $scale f64)
  (local $y f64)
  (local $one f64)
  (local $lo f64)
  (local $hi f64)
  (local $scale|22 f64)
  i32.const 0
  i32.const 1
  i32.lt_s
  drop
  block $~lib/util/math/exp_lut|inlined.0 (result f64)
   local.get $x
   local.set $x|1
   local.get $x|1
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
     f64.const 1
     br $~lib/util/math/exp_lut|inlined.0
    end
    local.get $abstop
    i32.const 1033
    i32.ge_u
    if
     local.get $ux
     i64.const -4503599627370496
     i64.eq
     if
      f64.const 0
      br $~lib/util/math/exp_lut|inlined.0
     end
     local.get $abstop
     i32.const 2047
     i32.ge_u
     if
      f64.const 1
      local.get $x|1
      f64.add
      br $~lib/util/math/exp_lut|inlined.0
     else
      f64.const 0
      f64.const inf
      local.get $ux
      i64.const 0
      i64.lt_s
      select
      br $~lib/util/math/exp_lut|inlined.0
     end
     unreachable
    end
    i32.const 0
    local.set $abstop
   end
   f64.const 184.6649652337873
   local.get $x|1
   f64.mul
   local.set $z
   local.get $z
   f64.const 6755399441055744
   f64.add
   local.set $kd
   local.get $kd
   i64.reinterpret_f64
   local.set $ki
   local.get $kd
   f64.const 6755399441055744
   f64.sub
   local.set $kd
   local.get $x|1
   local.get $kd
   f64.const -0.005415212348111709
   f64.mul
   f64.add
   local.get $kd
   f64.const -1.2864023111638346e-14
   f64.mul
   f64.add
   local.set $r
   local.get $ki
   i32.const 127
   i64.extend_i32_s
   i64.and
   i64.const 1
   i64.shl
   i32.wrap_i64
   local.set $idx
   local.get $ki
   i64.const 52
   i32.const 7
   i64.extend_i32_s
   i64.sub
   i64.shl
   local.set $top
   i32.const 4592
   local.get $idx
   i32.const 3
   i32.shl
   i32.add
   i64.load
   f64.reinterpret_i64
   local.set $tail
   i32.const 4592
   local.get $idx
   i32.const 3
   i32.shl
   i32.add
   i64.load offset=8
   local.get $top
   i64.add
   local.set $sbits
   local.get $r
   local.get $r
   f64.mul
   local.set $r2
   local.get $tail
   local.get $r
   f64.add
   local.get $r2
   f64.const 0.49999999999996786
   local.get $r
   f64.const 0.16666666666665886
   f64.mul
   f64.add
   f64.mul
   f64.add
   local.get $r2
   local.get $r2
   f64.mul
   f64.const 0.0416666808410674
   local.get $r
   f64.const 0.008333335853059549
   f64.mul
   f64.add
   f64.mul
   f64.add
   local.set $tmp
   local.get $abstop
   i32.const 0
   i32.eq
   if
    block $~lib/util/math/specialcase|inlined.1 (result f64)
     local.get $tmp
     local.set $tmp|14
     local.get $sbits
     local.set $sbits|15
     local.get $ki
     local.set $ki|16
     local.get $ki|16
     i64.const 2147483648
     i64.and
     i64.const 0
     i64.ne
     i32.eqz
     if
      local.get $sbits|15
      i64.const 1009
      i64.const 52
      i64.shl
      i64.sub
      local.set $sbits|15
      local.get $sbits|15
      f64.reinterpret_i64
      local.set $scale
      f64.const 5486124068793688683255936e279
      local.get $scale
      local.get $scale
      local.get $tmp|14
      f64.mul
      f64.add
      f64.mul
      br $~lib/util/math/specialcase|inlined.1
     end
     local.get $sbits|15
     i64.const 1022
     i64.const 52
     i64.shl
     i64.add
     local.set $sbits|15
     local.get $sbits|15
     f64.reinterpret_i64
     local.set $scale
     local.get $scale
     local.get $scale
     local.get $tmp|14
     f64.mul
     f64.add
     local.set $y
     local.get $y
     f64.abs
     f64.const 1
     f64.lt
     if
      f64.const 1
      local.get $y
      f64.copysign
      local.set $one
      local.get $scale
      local.get $y
      f64.sub
      local.get $scale
      local.get $tmp|14
      f64.mul
      f64.add
      local.set $lo
      local.get $one
      local.get $y
      f64.add
      local.set $hi
      local.get $one
      local.get $hi
      f64.sub
      local.get $y
      f64.add
      local.get $lo
      f64.add
      local.set $lo
      local.get $hi
      local.get $lo
      f64.add
      local.get $one
      f64.sub
      local.set $y
      local.get $y
      f64.const 0
      f64.eq
      if
       local.get $sbits|15
       i64.const -9223372036854775808
       i64.and
       f64.reinterpret_i64
       local.set $y
      end
     end
     local.get $y
     f64.const 2.2250738585072014e-308
     f64.mul
     br $~lib/util/math/specialcase|inlined.1
    end
    br $~lib/util/math/exp_lut|inlined.0
   end
   local.get $sbits
   f64.reinterpret_i64
   local.set $scale|22
   local.get $scale|22
   local.get $scale|22
   local.get $tmp
   f64.mul
   f64.add
   br $~lib/util/math/exp_lut|inlined.0
  end
  return
 )
 (func $assembly/index/calculateHullResistance (param $vessel i32) (param $speed f64) (result f64)
  (local $x f64)
  (local $wettedArea f64)
  (local $x|4 f64)
  (local $froudeNum f64)
  (local $reynoldsNum f64)
  (local $Cf f64)
  (local $Rf f64)
  (local $Rr f64)
  (local $Rt f64)
  local.get $speed
  f64.const 0.01
  f64.lt
  if
   f64.const 0
   return
  end
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.const 2
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:beam
  f64.add
  f64.mul
  block $~lib/math/NativeMath.sqrt|inlined.1 (result f64)
   local.get $vessel
   call $assembly/index/VesselState#get:blockCoefficient
   local.set $x
   local.get $x
   f64.sqrt
   br $~lib/math/NativeMath.sqrt|inlined.1
  end
  f64.mul
  f64.const 0.8
  f64.mul
  local.set $wettedArea
  local.get $speed
  block $~lib/math/NativeMath.sqrt|inlined.2 (result f64)
   f64.const 9.81
   local.get $vessel
   call $assembly/index/VesselState#get:length
   f64.mul
   local.set $x|4
   local.get $x|4
   f64.sqrt
   br $~lib/math/NativeMath.sqrt|inlined.2
  end
  f64.div
  local.set $froudeNum
  local.get $speed
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.mul
  f64.const 1.187e-06
  f64.div
  local.set $reynoldsNum
  f64.const 0.075
  local.get $reynoldsNum
  call $~lib/math/NativeMath.log10
  f64.const 2
  f64.sub
  f64.const 2
  call $~lib/math/NativeMath.pow
  f64.div
  local.set $Cf
  f64.const 0.5
  local.get $vessel
  call $assembly/index/VesselState#get:waterDensity
  f64.mul
  local.get $speed
  f64.mul
  local.get $speed
  f64.mul
  local.get $wettedArea
  f64.mul
  local.get $Cf
  f64.mul
  local.set $Rf
  global.get $assembly/index/HM_C1
  local.get $vessel
  call $assembly/index/VesselState#get:displacement
  f64.mul
  local.get $froudeNum
  global.get $assembly/index/HM_C2
  call $~lib/math/NativeMath.pow
  f64.mul
  global.get $assembly/index/HM_C3
  f64.neg
  local.get $froudeNum
  global.get $assembly/index/HM_C4
  call $~lib/math/NativeMath.pow
  f64.div
  call $~lib/math/NativeMath.exp
  f64.mul
  local.set $Rr
  local.get $Rf
  local.get $Rr
  f64.add
  local.set $Rt
  local.get $Rt
  return
 )
 (func $assembly/index/calculateWaveResistance (param $vessel i32) (param $seaState f64) (result f64)
  (local $waveHeight f64)
  (local $addedResistance f64)
  local.get $seaState
  f64.const 2
  call $~lib/math/NativeMath.pow
  f64.const 0.05
  f64.mul
  local.set $waveHeight
  f64.const 500
  local.get $waveHeight
  f64.mul
  local.get $waveHeight
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:beam
  f64.mul
  f64.const 100
  f64.div
  local.set $addedResistance
  local.get $addedResistance
  return
 )
 (func $assembly/index/VesselState#get:maxEnginePower (param $this i32) (result f64)
  local.get $this
  f64.load offset=168
 )
 (func $assembly/index/VesselState#get:engineRPM (param $this i32) (result f64)
  local.get $this
  f64.load offset=160
 )
 (func $assembly/index/VesselState#get:throttle (param $this i32) (result f64)
  local.get $this
  f64.load offset=96
 )
 (func $assembly/index/calculateEngineTorque (param $vessel i32) (result f64)
  (local $maxTorque f64)
  (local $rpmRatio f64)
  (local $torqueFactor f64)
  local.get $vessel
  call $assembly/index/VesselState#get:maxEnginePower
  f64.const 9550
  f64.mul
  f64.const 0.8
  f64.div
  local.get $vessel
  call $assembly/index/VesselState#get:engineRPM
  f64.div
  local.set $maxTorque
  local.get $vessel
  call $assembly/index/VesselState#get:engineRPM
  local.get $vessel
  call $assembly/index/VesselState#get:maxEnginePower
  f64.const 5
  f64.div
  f64.div
  local.set $rpmRatio
  local.get $rpmRatio
  f64.const 0.1
  f64.lt
  if
   local.get $rpmRatio
   f64.const 5
   f64.mul
   local.set $torqueFactor
  else
   local.get $rpmRatio
   f64.const 0.8
   f64.lt
   if
    f64.const 0.5
    local.get $rpmRatio
    f64.const 1.6
    f64.div
    f64.add
    local.set $torqueFactor
   else
    f64.const 1
    local.get $rpmRatio
    f64.const 0.8
    f64.sub
    f64.const 2
    f64.div
    f64.sub
    local.set $torqueFactor
   end
  end
  local.get $maxTorque
  local.get $torqueFactor
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:throttle
  f64.mul
  return
 )
 (func $assembly/index/VesselState#get:propellerDiameter (param $this i32) (result f64)
  local.get $this
  f64.load offset=184
 )
 (func $assembly/index/calculateFuelConsumption (param $vessel i32) (param $torque f64) (result f64)
  (local $powerFactor f64)
  (local $sfc f64)
  (local $loadFactor f64)
  local.get $torque
  local.get $vessel
  call $assembly/index/VesselState#get:engineRPM
  f64.mul
  f64.const 9550
  f64.div
  local.set $powerFactor
  local.get $powerFactor
  local.get $vessel
  call $assembly/index/VesselState#get:maxEnginePower
  f64.div
  local.set $loadFactor
  local.get $loadFactor
  f64.const 0.2
  f64.lt
  if
   f64.const 220
   f64.const 0.2
   local.get $loadFactor
   f64.sub
   f64.const 400
   f64.mul
   f64.add
   local.set $sfc
  else
   local.get $loadFactor
   f64.const 0.8
   f64.lt
   if
    f64.const 220
    local.get $loadFactor
    f64.const 0.2
    f64.sub
    f64.const 20
    f64.mul
    f64.sub
    local.set $sfc
   else
    f64.const 200
    local.get $loadFactor
    f64.const 0.8
    f64.sub
    f64.const 50
    f64.mul
    f64.add
    local.set $sfc
   end
  end
  local.get $powerFactor
  local.get $sfc
  f64.mul
  f64.const 1e3
  f64.div
  return
 )
 (func $assembly/index/VesselState#set:fuelConsumption (param $this i32) (param $fuelConsumption f64)
  local.get $this
  local.get $fuelConsumption
  f64.store offset=176
 )
 (func $assembly/index/calculatePropellerThrust (param $vessel i32) (result f64)
  (local $engineTorque f64)
  (local $wakeFraction f64)
  (local $speedAdvance f64)
  (local $propRPS f64)
  (local $x f64)
  (local $J f64)
  (local $value1 f64)
  (local $value2 f64)
  (local $KT f64)
  (local $thrust f64)
  local.get $vessel
  call $assembly/index/calculateEngineTorque
  local.set $engineTorque
  f64.const 0.3
  local.get $vessel
  call $assembly/index/VesselState#get:blockCoefficient
  f64.mul
  local.set $wakeFraction
  local.get $vessel
  call $assembly/index/VesselState#get:u
  f64.const 1
  local.get $wakeFraction
  f64.sub
  f64.mul
  local.set $speedAdvance
  local.get $vessel
  call $assembly/index/VesselState#get:engineRPM
  f64.const 60
  f64.div
  f64.const 3
  f64.div
  local.set $propRPS
  block $~lib/math/NativeMath.abs|inlined.0 (result f64)
   local.get $speedAdvance
   local.set $x
   local.get $x
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.0
  end
  local.get $propRPS
  local.get $vessel
  call $assembly/index/VesselState#get:propellerDiameter
  f64.mul
  f64.const 0.001
  f64.add
  f64.div
  local.set $J
  block $~lib/math/NativeMath.max|inlined.1 (result f64)
   f64.const 0
   local.set $value1
   f64.const 0.5
   f64.const 0.4
   local.get $J
   f64.mul
   f64.sub
   local.set $value2
   local.get $value1
   local.get $value2
   f64.max
   br $~lib/math/NativeMath.max|inlined.1
  end
  local.set $KT
  local.get $KT
  local.get $vessel
  call $assembly/index/VesselState#get:waterDensity
  f64.mul
  local.get $propRPS
  f64.mul
  local.get $propRPS
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:propellerDiameter
  f64.const 4
  call $~lib/math/NativeMath.pow
  f64.mul
  local.set $thrust
  local.get $vessel
  local.get $vessel
  local.get $engineTorque
  call $assembly/index/calculateFuelConsumption
  call $assembly/index/VesselState#set:fuelConsumption
  local.get $thrust
  return
 )
 (func $assembly/index/VesselState#get:rudderAngle (param $this i32) (result f64)
  local.get $this
  f64.load offset=104
 )
 (func $assembly/index/calculateRudderDrag (param $vessel i32) (result f64)
  (local $x f64)
  (local $speed f64)
  (local $rudderArea f64)
  (local $rudderLift f64)
  (local $x|5 f64)
  (local $x|6 f64)
  block $~lib/math/NativeMath.sqrt|inlined.3 (result f64)
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
   br $~lib/math/NativeMath.sqrt|inlined.3
  end
  local.set $speed
  local.get $speed
  f64.const 0.01
  f64.lt
  if
   f64.const 0
   return
  end
  f64.const 0.02
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  f64.mul
  local.set $rudderArea
  global.get $~lib/math/NativeMath.PI
  f64.const 1.5
  f64.mul
  f64.const 1
  f64.const 1.5
  f64.add
  f64.div
  local.get $vessel
  call $assembly/index/VesselState#get:rudderAngle
  f64.mul
  local.get $rudderArea
  f64.mul
  f64.const 0.5
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:waterDensity
  f64.mul
  local.get $speed
  f64.mul
  local.get $speed
  f64.mul
  local.set $rudderLift
  block $~lib/math/NativeMath.abs|inlined.1 (result f64)
   local.get $rudderLift
   local.set $x|5
   local.get $x|5
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.1
  end
  block $~lib/math/NativeMath.abs|inlined.2 (result f64)
   local.get $vessel
   call $assembly/index/VesselState#get:rudderAngle
   local.set $x|6
   local.get $x|6
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.2
  end
  call $~lib/math/NativeMath.sin
  f64.mul
  return
 )
 (func $assembly/index/calculateRudderForceY (param $vessel i32) (result f64)
  (local $x f64)
  (local $speed f64)
  (local $rudderArea f64)
  (local $rudderLift f64)
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
  local.set $speed
  local.get $speed
  f64.const 0.01
  f64.lt
  if
   f64.const 0
   return
  end
  f64.const 0.02
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  f64.mul
  local.set $rudderArea
  global.get $~lib/math/NativeMath.PI
  f64.const 1.5
  f64.mul
  f64.const 1
  f64.const 1.5
  f64.add
  f64.div
  local.get $vessel
  call $assembly/index/VesselState#get:rudderAngle
  f64.mul
  local.get $rudderArea
  f64.mul
  f64.const 0.5
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:waterDensity
  f64.mul
  local.get $speed
  f64.mul
  local.get $speed
  f64.mul
  local.set $rudderLift
  local.get $rudderLift
  local.get $vessel
  call $assembly/index/VesselState#get:rudderAngle
  call $~lib/math/NativeMath.cos
  f64.mul
  return
 )
 (func $assembly/index/calculateRudderMomentZ (param $vessel i32) (result f64)
  (local $rudderForceY f64)
  (local $rudderLeverArm f64)
  local.get $vessel
  call $assembly/index/calculateRudderForceY
  local.set $rudderForceY
  f64.const -0.45
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.mul
  local.set $rudderLeverArm
  local.get $rudderForceY
  local.get $rudderLeverArm
  f64.mul
  return
 )
 (func $assembly/index/VesselState#get:psi (param $this i32) (result f64)
  local.get $this
  f64.load offset=24
 )
 (func $assembly/index/calculateWindForceX (param $vessel i32) (param $windSpeed f64) (param $windDirection f64) (result f64)
  (local $relativeDirection f64)
  (local $projectedAreaFront f64)
  (local $x f64)
  (local $windCoefficientX f64)
  local.get $windDirection
  local.get $vessel
  call $assembly/index/VesselState#get:psi
  f64.sub
  local.set $relativeDirection
  local.get $vessel
  call $assembly/index/VesselState#get:beam
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  f64.mul
  f64.const 1.5
  f64.mul
  local.set $projectedAreaFront
  f64.const 0.5
  f64.const 0.4
  block $~lib/math/NativeMath.abs|inlined.3 (result f64)
   local.get $relativeDirection
   call $~lib/math/NativeMath.cos
   local.set $x
   local.get $x
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.3
  end
  f64.mul
  f64.add
  local.set $windCoefficientX
  f64.const 0.5
  f64.const 1.225
  f64.mul
  local.get $windSpeed
  f64.mul
  local.get $windSpeed
  f64.mul
  local.get $projectedAreaFront
  f64.mul
  local.get $windCoefficientX
  f64.mul
  local.get $relativeDirection
  call $~lib/math/NativeMath.cos
  f64.mul
  return
 )
 (func $assembly/index/calculateWindForceY (param $vessel i32) (param $windSpeed f64) (param $windDirection f64) (result f64)
  (local $relativeDirection f64)
  (local $projectedAreaSide f64)
  (local $x f64)
  (local $windCoefficientY f64)
  local.get $windDirection
  local.get $vessel
  call $assembly/index/VesselState#get:psi
  f64.sub
  local.set $relativeDirection
  local.get $vessel
  call $assembly/index/VesselState#get:length
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  f64.mul
  f64.const 1.5
  f64.mul
  local.set $projectedAreaSide
  f64.const 0.7
  block $~lib/math/NativeMath.abs|inlined.4 (result f64)
   local.get $relativeDirection
   call $~lib/math/NativeMath.sin
   local.set $x
   local.get $x
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.4
  end
  f64.mul
  local.set $windCoefficientY
  f64.const 0.5
  f64.const 1.225
  f64.mul
  local.get $windSpeed
  f64.mul
  local.get $windSpeed
  f64.mul
  local.get $projectedAreaSide
  f64.mul
  local.get $windCoefficientY
  f64.mul
  local.get $relativeDirection
  call $~lib/math/NativeMath.sin
  f64.mul
  return
 )
 (func $assembly/index/calculateWindMomentN (param $vessel i32) (param $windSpeed f64) (param $windDirection f64) (result f64)
  (local $relativeDirection f64)
  (local $projectedAreaSide f64)
  (local $windCoefficientN f64)
  local.get $windDirection
  local.get $vessel
  call $assembly/index/VesselState#get:psi
  f64.sub
  local.set $relativeDirection
  local.get $vessel
  call $assembly/index/VesselState#get:length
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  f64.mul
  f64.const 1.5
  f64.mul
  local.set $projectedAreaSide
  f64.const 0.1
  f64.const 2
  local.get $relativeDirection
  f64.mul
  call $~lib/math/NativeMath.sin
  f64.mul
  local.set $windCoefficientN
  f64.const 0.5
  f64.const 1.225
  f64.mul
  local.get $windSpeed
  f64.mul
  local.get $windSpeed
  f64.mul
  local.get $projectedAreaSide
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.mul
  local.get $windCoefficientN
  f64.mul
  return
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
   i32.const 6672
   i32.const 6736
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
   i32.const 6672
   i32.const 6736
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
 (func $~lib/rt/__newBuffer (param $size i32) (param $id i32) (param $data i32) (result i32)
  (local $buffer i32)
  local.get $size
  local.get $id
  call $~lib/rt/stub/__new
  local.set $buffer
  local.get $data
  if
   local.get $buffer
   local.get $data
   local.get $size
   memory.copy
  end
  local.get $buffer
  return
 )
 (func $~lib/rt/stub/__link (param $parentPtr i32) (param $childPtr i32) (param $expectMultiple i32)
 )
 (func $~lib/rt/__newArray (param $length i32) (param $alignLog2 i32) (param $id i32) (param $data i32) (result i32)
  (local $bufferSize i32)
  (local $buffer i32)
  (local $array i32)
  local.get $length
  local.get $alignLog2
  i32.shl
  local.set $bufferSize
  local.get $bufferSize
  i32.const 1
  local.get $data
  call $~lib/rt/__newBuffer
  local.set $buffer
  i32.const 16
  local.get $id
  call $~lib/rt/stub/__new
  local.set $array
  local.get $array
  local.get $buffer
  i32.store
  local.get $array
  local.get $buffer
  i32.const 0
  call $~lib/rt/stub/__link
  local.get $array
  local.get $buffer
  i32.store offset=4
  local.get $array
  local.get $bufferSize
  i32.store offset=8
  local.get $array
  local.get $length
  i32.store offset=12
  local.get $array
  return
 )
 (func $~lib/arraybuffer/ArrayBufferView#get:byteLength (param $this i32) (result i32)
  local.get $this
  i32.load offset=8
 )
 (func $~lib/arraybuffer/ArrayBufferView#get:buffer (param $this i32) (result i32)
  local.get $this
  i32.load
 )
 (func $~lib/rt/common/BLOCK#get:mmInfo (param $this i32) (result i32)
  local.get $this
  i32.load
 )
 (func $~lib/rt/stub/__realloc (param $ptr i32) (param $size i32) (result i32)
  (local $block i32)
  (local $actualSize i32)
  (local $isLast i32)
  (local $size|5 i32)
  (local $payloadSize i32)
  (local $7 i32)
  (local $8 i32)
  (local $newPtr i32)
  local.get $ptr
  i32.const 0
  i32.ne
  if (result i32)
   local.get $ptr
   i32.const 15
   i32.and
   i32.eqz
  else
   i32.const 0
  end
  i32.eqz
  if
   i32.const 0
   i32.const 6736
   i32.const 45
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $ptr
  i32.const 4
  i32.sub
  local.set $block
  local.get $block
  call $~lib/rt/common/BLOCK#get:mmInfo
  local.set $actualSize
  local.get $ptr
  local.get $actualSize
  i32.add
  global.get $~lib/rt/stub/offset
  i32.eq
  local.set $isLast
  block $~lib/rt/stub/computeSize|inlined.1 (result i32)
   local.get $size
   local.set $size|5
   local.get $size|5
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
   br $~lib/rt/stub/computeSize|inlined.1
  end
  local.set $payloadSize
  local.get $size
  local.get $actualSize
  i32.gt_u
  if
   local.get $isLast
   if
    local.get $size
    i32.const 1073741820
    i32.gt_u
    if
     i32.const 6672
     i32.const 6736
     i32.const 52
     i32.const 33
     call $~lib/builtins/abort
     unreachable
    end
    local.get $ptr
    local.get $payloadSize
    i32.add
    call $~lib/rt/stub/maybeGrowMemory
    local.get $block
    local.get $payloadSize
    call $~lib/rt/common/BLOCK#set:mmInfo
   else
    local.get $payloadSize
    local.tee $7
    local.get $actualSize
    i32.const 1
    i32.shl
    local.tee $8
    local.get $7
    local.get $8
    i32.gt_u
    select
    call $~lib/rt/stub/__alloc
    local.set $newPtr
    local.get $newPtr
    local.get $ptr
    local.get $actualSize
    memory.copy
    local.get $newPtr
    local.tee $ptr
    i32.const 4
    i32.sub
    local.set $block
   end
  else
   local.get $isLast
   if
    local.get $ptr
    local.get $payloadSize
    i32.add
    global.set $~lib/rt/stub/offset
    local.get $block
    local.get $payloadSize
    call $~lib/rt/common/BLOCK#set:mmInfo
   end
  end
  local.get $ptr
  return
 )
 (func $~lib/rt/stub/__renew (param $oldPtr i32) (param $size i32) (result i32)
  (local $newPtr i32)
  local.get $size
  i32.const 1073741804
  i32.gt_u
  if
   i32.const 6672
   i32.const 6736
   i32.const 99
   i32.const 30
   call $~lib/builtins/abort
   unreachable
  end
  local.get $oldPtr
  i32.const 16
  i32.sub
  i32.const 16
  local.get $size
  i32.add
  call $~lib/rt/stub/__realloc
  local.set $newPtr
  local.get $newPtr
  i32.const 4
  i32.sub
  local.get $size
  call $~lib/rt/common/OBJECT#set:rtSize
  local.get $newPtr
  i32.const 16
  i32.add
  return
 )
 (func $~lib/array/ensureCapacity (param $array i32) (param $newSize i32) (param $alignLog2 i32) (param $canGrow i32)
  (local $oldCapacity i32)
  (local $oldData i32)
  (local $6 i32)
  (local $7 i32)
  (local $newCapacity i32)
  (local $9 i32)
  (local $10 i32)
  (local $11 i32)
  (local $12 i32)
  (local $newData i32)
  local.get $array
  call $~lib/arraybuffer/ArrayBufferView#get:byteLength
  local.set $oldCapacity
  local.get $newSize
  local.get $oldCapacity
  local.get $alignLog2
  i32.shr_u
  i32.gt_u
  if
   local.get $newSize
   i32.const 1073741820
   local.get $alignLog2
   i32.shr_u
   i32.gt_u
   if
    i32.const 6800
    i32.const 272
    i32.const 19
    i32.const 48
    call $~lib/builtins/abort
    unreachable
   end
   local.get $array
   call $~lib/arraybuffer/ArrayBufferView#get:buffer
   local.set $oldData
   local.get $newSize
   local.tee $6
   i32.const 8
   local.tee $7
   local.get $6
   local.get $7
   i32.gt_u
   select
   local.get $alignLog2
   i32.shl
   local.set $newCapacity
   local.get $canGrow
   if
    local.get $oldCapacity
    i32.const 1
    i32.shl
    local.tee $9
    i32.const 1073741820
    local.tee $10
    local.get $9
    local.get $10
    i32.lt_u
    select
    local.tee $11
    local.get $newCapacity
    local.tee $12
    local.get $11
    local.get $12
    i32.gt_u
    select
    local.set $newCapacity
   end
   local.get $oldData
   local.get $newCapacity
   call $~lib/rt/stub/__renew
   local.set $newData
   i32.const 0
   global.get $~lib/shared/runtime/Runtime.Incremental
   i32.ne
   drop
   local.get $newData
   local.get $oldCapacity
   i32.add
   i32.const 0
   local.get $newCapacity
   local.get $oldCapacity
   i32.sub
   memory.fill
   local.get $newData
   local.get $oldData
   i32.ne
   if
    local.get $array
    local.get $newData
    i32.store
    local.get $array
    local.get $newData
    i32.store offset=4
    local.get $array
    local.get $newData
    i32.const 0
    call $~lib/rt/stub/__link
   end
   local.get $array
   local.get $newCapacity
   i32.store offset=8
  end
 )
 (func $~lib/array/Array<f64>#set:length_ (param $this i32) (param $length_ i32)
  local.get $this
  local.get $length_
  i32.store offset=12
 )
 (func $~lib/array/Array<f64>#__set (param $this i32) (param $index i32) (param $value f64)
  local.get $index
  local.get $this
  call $~lib/array/Array<f64>#get:length_
  i32.ge_u
  if
   local.get $index
   i32.const 0
   i32.lt_s
   if
    i32.const 208
    i32.const 272
    i32.const 130
    i32.const 22
    call $~lib/builtins/abort
    unreachable
   end
   local.get $this
   local.get $index
   i32.const 1
   i32.add
   i32.const 3
   i32.const 1
   call $~lib/array/ensureCapacity
   local.get $this
   local.get $index
   i32.const 1
   i32.add
   call $~lib/array/Array<f64>#set:length_
  end
  local.get $this
  call $~lib/array/Array<f64>#get:dataStart
  local.get $index
  i32.const 3
  i32.shl
  i32.add
  local.get $value
  f64.store
  i32.const 0
  drop
 )
 (func $assembly/index/calculateCurrentForce (param $vessel i32) (param $currentSpeed f64) (param $currentDirection f64) (result i32)
  (local $relativeDirection f64)
  (local $wettedAreaSide f64)
  (local $wettedAreaBottom f64)
  (local $x f64)
  (local $currentCoefficientX f64)
  (local $x|8 f64)
  (local $currentCoefficientY f64)
  (local $currentCoefficientN f64)
  (local $currentForceX f64)
  (local $currentForceY f64)
  (local $currentMomentN f64)
  (local $14 i32)
  (local $15 i32)
  local.get $currentDirection
  local.get $vessel
  call $assembly/index/VesselState#get:psi
  f64.sub
  local.set $relativeDirection
  local.get $vessel
  call $assembly/index/VesselState#get:length
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  f64.mul
  f64.const 0.7
  f64.mul
  local.set $wettedAreaSide
  local.get $vessel
  call $assembly/index/VesselState#get:length
  local.get $vessel
  call $assembly/index/VesselState#get:beam
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:blockCoefficient
  f64.mul
  local.set $wettedAreaBottom
  f64.const 0.5
  f64.const 0.3
  block $~lib/math/NativeMath.abs|inlined.5 (result f64)
   local.get $relativeDirection
   call $~lib/math/NativeMath.cos
   local.set $x
   local.get $x
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.5
  end
  f64.mul
  f64.add
  local.set $currentCoefficientX
  f64.const 0.8
  block $~lib/math/NativeMath.abs|inlined.6 (result f64)
   local.get $relativeDirection
   call $~lib/math/NativeMath.sin
   local.set $x|8
   local.get $x|8
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.6
  end
  f64.mul
  local.set $currentCoefficientY
  f64.const 0.1
  f64.const 2
  local.get $relativeDirection
  f64.mul
  call $~lib/math/NativeMath.sin
  f64.mul
  local.set $currentCoefficientN
  f64.const 0.5
  local.get $vessel
  call $assembly/index/VesselState#get:waterDensity
  f64.mul
  local.get $currentSpeed
  f64.mul
  local.get $currentSpeed
  f64.mul
  local.get $wettedAreaBottom
  f64.mul
  local.get $currentCoefficientX
  f64.mul
  local.get $relativeDirection
  call $~lib/math/NativeMath.cos
  f64.mul
  local.set $currentForceX
  f64.const 0.5
  local.get $vessel
  call $assembly/index/VesselState#get:waterDensity
  f64.mul
  local.get $currentSpeed
  f64.mul
  local.get $currentSpeed
  f64.mul
  local.get $wettedAreaSide
  f64.mul
  local.get $currentCoefficientY
  f64.mul
  local.get $relativeDirection
  call $~lib/math/NativeMath.sin
  f64.mul
  local.set $currentForceY
  f64.const 0.5
  local.get $vessel
  call $assembly/index/VesselState#get:waterDensity
  f64.mul
  local.get $currentSpeed
  f64.mul
  local.get $currentSpeed
  f64.mul
  local.get $wettedAreaSide
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.mul
  local.get $currentCoefficientN
  f64.mul
  local.set $currentMomentN
  i32.const 3
  i32.const 3
  i32.const 5
  i32.const 0
  call $~lib/rt/__newArray
  local.set $14
  local.get $14
  i32.load offset=4
  local.set $15
  local.get $14
  i32.const 0
  local.get $currentForceX
  call $~lib/array/Array<f64>#__set
  local.get $14
  i32.const 1
  local.get $currentForceY
  call $~lib/array/Array<f64>#__set
  local.get $14
  i32.const 2
  local.get $currentMomentN
  call $~lib/array/Array<f64>#__set
  local.get $14
  return
 )
 (func $assembly/index/VesselState#set:waveHeight (param $this i32) (param $waveHeight f64)
  local.get $this
  local.get $waveHeight
  f64.store offset=264
 )
 (func $assembly/index/VesselState#set:waveFrequency (param $this i32) (param $waveFrequency f64)
  local.get $this
  local.get $waveFrequency
  f64.store offset=280
 )
 (func $assembly/index/VesselState#get:waveDirection (param $this i32) (result f64)
  local.get $this
  f64.load offset=272
 )
 (func $assembly/index/VesselState#get:x (param $this i32) (result f64)
  local.get $this
  f64.load
 )
 (func $assembly/index/VesselState#get:y (param $this i32) (result f64)
  local.get $this
  f64.load offset=8
 )
 (func $assembly/index/VesselState#set:wavePhase (param $this i32) (param $wavePhase f64)
  local.get $this
  local.get $wavePhase
  f64.store offset=288
 )
 (func $assembly/index/VesselState#get:wavePhase (param $this i32) (result f64)
  local.get $this
  f64.load offset=288
 )
 (func $~lib/math/NativeMath.sign (param $x f64) (result f64)
  i32.const 0
  i32.const 0
  i32.gt_s
  drop
  f64.const 1
  f64.const -1
  local.get $x
  local.get $x
  f64.const 0
  f64.lt
  select
  local.get $x
  f64.const 0
  f64.gt
  select
  return
 )
 (func $assembly/index/calculateWaveForce (param $vessel i32) (param $seaState f64) (param $time f64) (result i32)
  (local $3 i32)
  (local $4 i32)
  (local $waveHeight f64)
  (local $waveLength f64)
  (local $waveFrequency f64)
  (local $waveNumber f64)
  (local $dirX f64)
  (local $dirY f64)
  (local $positionProjection f64)
  (local $vesselLength f64)
  (local $vesselBeam f64)
  (local $encounterAngle f64)
  (local $x f64)
  (local $headSeaFactor f64)
  (local $x|17 f64)
  (local $beamSeaFactor f64)
  (local $baseWaveForce f64)
  (local $surgeForce f64)
  (local $swayForce f64)
  (local $value1 f64)
  (local $value2 f64)
  (local $heaveFactor f64)
  (local $heaveForce f64)
  (local $rollMoment f64)
  (local $pitchMoment f64)
  (local $yawMoment f64)
  (local $29 i32)
  (local $30 i32)
  local.get $seaState
  f64.const 0.5
  f64.lt
  if
   i32.const 6
   i32.const 3
   i32.const 5
   i32.const 6848
   call $~lib/rt/__newArray
   return
  end
  local.get $seaState
  call $assembly/index/getWaveHeightForSeaState
  local.set $waveHeight
  local.get $seaState
  call $assembly/index/calculateWaveLength
  local.set $waveLength
  local.get $seaState
  call $assembly/index/calculateWaveFrequency
  local.set $waveFrequency
  local.get $vessel
  local.get $waveHeight
  call $assembly/index/VesselState#set:waveHeight
  local.get $vessel
  local.get $waveFrequency
  call $assembly/index/VesselState#set:waveFrequency
  f64.const 2
  global.get $~lib/math/NativeMath.PI
  f64.mul
  local.get $waveLength
  f64.div
  local.set $waveNumber
  local.get $vessel
  call $assembly/index/VesselState#get:waveDirection
  call $~lib/math/NativeMath.cos
  local.set $dirX
  local.get $vessel
  call $assembly/index/VesselState#get:waveDirection
  call $~lib/math/NativeMath.sin
  local.set $dirY
  local.get $vessel
  call $assembly/index/VesselState#get:x
  local.get $dirX
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:y
  local.get $dirY
  f64.mul
  f64.add
  local.set $positionProjection
  local.get $vessel
  local.get $waveNumber
  local.get $positionProjection
  f64.mul
  local.get $waveFrequency
  local.get $time
  f64.mul
  f64.sub
  call $assembly/index/VesselState#set:wavePhase
  local.get $vessel
  call $assembly/index/VesselState#get:length
  local.set $vesselLength
  local.get $vessel
  call $assembly/index/VesselState#get:beam
  local.set $vesselBeam
  local.get $vessel
  call $assembly/index/VesselState#get:waveDirection
  local.get $vessel
  call $assembly/index/VesselState#get:psi
  f64.sub
  local.set $encounterAngle
  block $~lib/math/NativeMath.abs|inlined.7 (result f64)
   local.get $encounterAngle
   call $~lib/math/NativeMath.cos
   local.set $x
   local.get $x
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.7
  end
  local.set $headSeaFactor
  block $~lib/math/NativeMath.abs|inlined.8 (result f64)
   local.get $encounterAngle
   call $~lib/math/NativeMath.sin
   local.set $x|17
   local.get $x|17
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.8
  end
  local.set $beamSeaFactor
  local.get $vessel
  call $assembly/index/VesselState#get:waterDensity
  global.get $assembly/index/WAVE_GRAVITY
  f64.mul
  local.get $waveHeight
  f64.mul
  local.get $waveHeight
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:beam
  f64.mul
  local.set $baseWaveForce
  local.get $baseWaveForce
  local.get $headSeaFactor
  f64.mul
  f64.const 0.5
  f64.mul
  local.set $surgeForce
  local.get $baseWaveForce
  local.get $beamSeaFactor
  f64.mul
  f64.const 0.7
  f64.mul
  local.set $swayForce
  block $~lib/math/NativeMath.max|inlined.2 (result f64)
   local.get $vessel
   call $assembly/index/VesselState#get:wavePhase
   call $~lib/math/NativeMath.sin
   local.set $value1
   f64.const 0
   local.set $value2
   local.get $value1
   local.get $value2
   f64.max
   br $~lib/math/NativeMath.max|inlined.2
  end
  local.set $heaveFactor
  local.get $baseWaveForce
  f64.const 1.2
  f64.mul
  local.get $heaveFactor
  f64.mul
  local.set $heaveForce
  local.get $swayForce
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  f64.mul
  f64.const 0.6
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:wavePhase
  call $~lib/math/NativeMath.sin
  f64.mul
  local.set $rollMoment
  local.get $surgeForce
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.mul
  f64.const 0.1
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:wavePhase
  call $~lib/math/NativeMath.sin
  f64.mul
  local.set $pitchMoment
  local.get $baseWaveForce
  f64.const 2
  local.get $encounterAngle
  f64.mul
  call $~lib/math/NativeMath.sin
  f64.mul
  f64.const 0.05
  f64.mul
  local.set $yawMoment
  i32.const 6
  i32.const 3
  i32.const 5
  i32.const 0
  call $~lib/rt/__newArray
  local.set $29
  local.get $29
  i32.load offset=4
  local.set $30
  local.get $29
  i32.const 0
  local.get $surgeForce
  local.get $encounterAngle
  call $~lib/math/NativeMath.cos
  call $~lib/math/NativeMath.sign
  f64.mul
  call $~lib/array/Array<f64>#__set
  local.get $29
  i32.const 1
  local.get $swayForce
  local.get $encounterAngle
  call $~lib/math/NativeMath.sin
  call $~lib/math/NativeMath.sign
  f64.mul
  call $~lib/array/Array<f64>#__set
  local.get $29
  i32.const 2
  local.get $heaveForce
  call $~lib/array/Array<f64>#__set
  local.get $29
  i32.const 3
  local.get $rollMoment
  call $~lib/array/Array<f64>#__set
  local.get $29
  i32.const 4
  local.get $pitchMoment
  call $~lib/array/Array<f64>#__set
  local.get $29
  i32.const 5
  local.get $yawMoment
  call $~lib/array/Array<f64>#__set
  local.get $29
  return
 )
 (func $assembly/index/VesselState#get:mass (param $this i32) (result f64)
  local.get $this
  f64.load offset=112
 )
 (func $assembly/index/VesselState#get:Ixx (param $this i32) (result f64)
  local.get $this
  f64.load offset=224
 )
 (func $assembly/index/VesselState#get:Iyy (param $this i32) (result f64)
  local.get $this
  f64.load offset=232
 )
 (func $assembly/index/VesselState#get:Izz (param $this i32) (result f64)
  local.get $this
  f64.load offset=240
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
 (func $assembly/index/VesselState#get:w (param $this i32) (result f64)
  local.get $this
  f64.load offset=64
 )
 (func $assembly/index/VesselState#set:w (param $this i32) (param $w f64)
  local.get $this
  local.get $w
  f64.store offset=64
 )
 (func $assembly/index/VesselState#get:p (param $this i32) (result f64)
  local.get $this
  f64.load offset=80
 )
 (func $assembly/index/VesselState#set:p (param $this i32) (param $p f64)
  local.get $this
  local.get $p
  f64.store offset=80
 )
 (func $assembly/index/VesselState#get:phi (param $this i32) (result f64)
  local.get $this
  f64.load offset=32
 )
 (func $assembly/index/VesselState#set:phi (param $this i32) (param $phi f64)
  local.get $this
  local.get $phi
  f64.store offset=32
 )
 (func $assembly/index/VesselState#get:fuelLevel (param $this i32) (result f64)
  local.get $this
  f64.load offset=248
 )
 (func $assembly/index/VesselState#get:ballastLevel (param $this i32) (result f64)
  local.get $this
  f64.load offset=256
 )
 (func $assembly/index/VesselState#set:centerOfGravityX (param $this i32) (param $centerOfGravityX f64)
  local.get $this
  local.get $centerOfGravityX
  f64.store offset=192
 )
 (func $assembly/index/VesselState#set:centerOfGravityY (param $this i32) (param $centerOfGravityY f64)
  local.get $this
  local.get $centerOfGravityY
  f64.store offset=200
 )
 (func $assembly/index/VesselState#set:centerOfGravityZ (param $this i32) (param $centerOfGravityZ f64)
  local.get $this
  local.get $centerOfGravityZ
  f64.store offset=208
 )
 (func $assembly/index/VesselState#set:mass (param $this i32) (param $mass f64)
  local.get $this
  local.get $mass
  f64.store offset=112
 )
 (func $assembly/index/calculateCenterOfGravity (param $vessel i32)
  (local $baseCGZ f64)
  (local $emptyMass f64)
  (local $fuelTankMaxMass f64)
  (local $fuelMass f64)
  (local $fuelCGX f64)
  (local $fuelCGZ f64)
  (local $ballastTankMaxMass f64)
  (local $ballastMass f64)
  (local $ballastCGZ f64)
  (local $totalMass f64)
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  f64.const 0.5
  f64.mul
  local.set $baseCGZ
  local.get $vessel
  call $assembly/index/VesselState#get:mass
  f64.const 0.7
  f64.mul
  local.set $emptyMass
  local.get $vessel
  call $assembly/index/VesselState#get:mass
  f64.const 0.1
  f64.mul
  local.set $fuelTankMaxMass
  local.get $fuelTankMaxMass
  local.get $vessel
  call $assembly/index/VesselState#get:fuelLevel
  f64.mul
  local.set $fuelMass
  f64.const -0.2
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.mul
  local.set $fuelCGX
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  f64.const 0.3
  f64.mul
  local.set $fuelCGZ
  local.get $vessel
  call $assembly/index/VesselState#get:mass
  f64.const 0.2
  f64.mul
  local.set $ballastTankMaxMass
  local.get $ballastTankMaxMass
  local.get $vessel
  call $assembly/index/VesselState#get:ballastLevel
  f64.mul
  local.set $ballastMass
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  f64.const 0.1
  f64.mul
  local.set $ballastCGZ
  local.get $emptyMass
  local.get $fuelMass
  f64.add
  local.get $ballastMass
  f64.add
  local.set $totalMass
  local.get $vessel
  local.get $emptyMass
  f64.const 0
  f64.mul
  local.get $fuelMass
  local.get $fuelCGX
  f64.mul
  f64.add
  local.get $totalMass
  f64.div
  call $assembly/index/VesselState#set:centerOfGravityX
  local.get $vessel
  local.get $emptyMass
  f64.const 0
  f64.mul
  local.get $totalMass
  f64.div
  call $assembly/index/VesselState#set:centerOfGravityY
  local.get $vessel
  local.get $emptyMass
  local.get $baseCGZ
  f64.mul
  local.get $fuelMass
  local.get $fuelCGZ
  f64.mul
  f64.add
  local.get $ballastMass
  local.get $ballastCGZ
  f64.mul
  f64.add
  local.get $totalMass
  f64.div
  call $assembly/index/VesselState#set:centerOfGravityZ
  local.get $vessel
  local.get $totalMass
  call $assembly/index/VesselState#set:mass
 )
 (func $assembly/index/VesselState#get:centerOfGravityZ (param $this i32) (result f64)
  local.get $this
  f64.load offset=208
 )
 (func $assembly/index/calculateGM (param $vessel i32) (result f64)
  (local $cgZ f64)
  (local $waterplaneArea f64)
  (local $Iyy_waterplane f64)
  (local $volume f64)
  (local $KM f64)
  (local $GM f64)
  local.get $vessel
  call $assembly/index/calculateCenterOfGravity
  local.get $vessel
  call $assembly/index/VesselState#get:centerOfGravityZ
  local.set $cgZ
  local.get $vessel
  call $assembly/index/VesselState#get:length
  local.get $vessel
  call $assembly/index/VesselState#get:beam
  f64.mul
  local.set $waterplaneArea
  local.get $waterplaneArea
  local.get $vessel
  call $assembly/index/VesselState#get:beam
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:beam
  f64.mul
  f64.const 12
  f64.div
  local.set $Iyy_waterplane
  local.get $vessel
  call $assembly/index/VesselState#get:displacement
  local.set $volume
  local.get $vessel
  call $assembly/index/VesselState#get:draft
  local.get $Iyy_waterplane
  local.get $vessel
  call $assembly/index/VesselState#get:waterDensity
  local.get $volume
  f64.mul
  f64.div
  f64.add
  local.set $KM
  local.get $KM
  local.get $cgZ
  f64.sub
  local.set $GM
  local.get $GM
  return
 )
 (func $assembly/index/VesselState#get:q (param $this i32) (result f64)
  local.get $this
  f64.load offset=88
 )
 (func $assembly/index/VesselState#set:q (param $this i32) (param $q f64)
  local.get $this
  local.get $q
  f64.store offset=88
 )
 (func $assembly/index/VesselState#get:theta (param $this i32) (result f64)
  local.get $this
  f64.load offset=40
 )
 (func $assembly/index/VesselState#set:theta (param $this i32) (param $theta f64)
  local.get $this
  local.get $theta
  f64.store offset=40
 )
 (func $assembly/index/VesselState#get:r (param $this i32) (result f64)
  local.get $this
  f64.load offset=72
 )
 (func $assembly/index/VesselState#set:r (param $this i32) (param $r f64)
  local.get $this
  local.get $r
  f64.store offset=72
 )
 (func $assembly/index/VesselState#set:psi (param $this i32) (param $psi f64)
  local.get $this
  local.get $psi
  f64.store offset=24
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
 (func $assembly/index/VesselState#get:z (param $this i32) (result f64)
  local.get $this
  f64.load offset=16
 )
 (func $assembly/index/VesselState#set:z (param $this i32) (param $z f64)
  local.get $this
  local.get $z
  f64.store offset=16
 )
 (func $assembly/index/VesselState#get:fuelConsumption (param $this i32) (result f64)
  local.get $this
  f64.load offset=176
 )
 (func $assembly/index/VesselState#set:fuelLevel (param $this i32) (param $fuelLevel f64)
  local.get $this
  local.get $fuelLevel
  f64.store offset=248
 )
 (func $assembly/index/VesselState#set:throttle (param $this i32) (param $throttle f64)
  local.get $this
  local.get $throttle
  f64.store offset=96
 )
 (func $assembly/index/VesselState#set:engineRPM (param $this i32) (param $engineRPM f64)
  local.get $this
  local.get $engineRPM
  f64.store offset=160
 )
 (func $assembly/index/updateVesselState (param $vesselPtr i32) (param $dt f64) (param $windSpeed f64) (param $windDirection f64) (param $currentSpeed f64) (param $currentDirection f64) (param $seaState f64) (result i32)
  (local $vessel i32)
  (local $calculatedSeaState i32)
  (local $effectiveSeaState f64)
  (local $x f64)
  (local $speed f64)
  (local $resistance f64)
  (local $waveResistance f64)
  (local $totalResistance f64)
  (local $propulsionForce f64)
  (local $rudderDrag f64)
  (local $rudderSway f64)
  (local $rudderYaw f64)
  (local $windSurge f64)
  (local $windSway f64)
  (local $windYaw f64)
  (local $currentForces i32)
  (local $currentSurge f64)
  (local $currentSway f64)
  (local $currentYaw f64)
  (local $simulationTime f64)
  (local $waveForces i32)
  (local $waveSurge f64)
  (local $waveSway f64)
  (local $waveHeave f64)
  (local $waveRoll f64)
  (local $wavePitch f64)
  (local $waveYaw f64)
  (local $massSurge f64)
  (local $massSway f64)
  (local $massHeave f64)
  (local $inertiaRoll f64)
  (local $inertiaPitch f64)
  (local $inertiaYaw f64)
  (local $netForceSurge f64)
  (local $surgeDot f64)
  (local $netForceSway f64)
  (local $swayDot f64)
  (local $netForceHeave f64)
  (local $heaveDot f64)
  (local $rollDamping f64)
  (local $netMomentRoll f64)
  (local $rollDot f64)
  (local $GM f64)
  (local $stabilizingMoment f64)
  (local $value1 f64)
  (local $value2 f64)
  (local $value1|53 f64)
  (local $value2|54 f64)
  (local $pitchDamping f64)
  (local $netMomentPitch f64)
  (local $pitchDot f64)
  (local $pitchStabilizing f64)
  (local $value1|59 f64)
  (local $value2|60 f64)
  (local $value1|61 f64)
  (local $value2|62 f64)
  (local $netMomentYaw f64)
  (local $yawDot f64)
  (local $cosPsi f64)
  (local $sinPsi f64)
  (local $worldU f64)
  (local $worldV f64)
  (local $value1|69 f64)
  (local $value2|70 f64)
  (local $fuelTankCapacity f64)
  (local $fuelConsumptionRate f64)
  (local $value1|73 f64)
  (local $value2|74 f64)
  (local $effectiveFuelRate f64)
  local.get $vesselPtr
  local.set $vessel
  local.get $windSpeed
  call $assembly/index/calculateBeaufortScale
  local.set $calculatedSeaState
  local.get $calculatedSeaState
  f64.convert_i32_s
  local.set $effectiveSeaState
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
   local.set $x
   local.get $x
   f64.sqrt
   br $~lib/math/NativeMath.sqrt|inlined.0
  end
  local.set $speed
  local.get $vessel
  local.get $speed
  call $assembly/index/calculateHullResistance
  local.set $resistance
  local.get $vessel
  local.get $effectiveSeaState
  call $assembly/index/calculateWaveResistance
  local.set $waveResistance
  local.get $resistance
  local.get $waveResistance
  f64.add
  local.set $totalResistance
  local.get $vessel
  call $assembly/index/calculatePropellerThrust
  local.set $propulsionForce
  local.get $vessel
  call $assembly/index/calculateRudderDrag
  local.set $rudderDrag
  local.get $vessel
  call $assembly/index/calculateRudderForceY
  local.set $rudderSway
  local.get $vessel
  call $assembly/index/calculateRudderMomentZ
  local.set $rudderYaw
  local.get $vessel
  local.get $windSpeed
  local.get $windDirection
  call $assembly/index/calculateWindForceX
  local.set $windSurge
  local.get $vessel
  local.get $windSpeed
  local.get $windDirection
  call $assembly/index/calculateWindForceY
  local.set $windSway
  local.get $vessel
  local.get $windSpeed
  local.get $windDirection
  call $assembly/index/calculateWindMomentN
  local.set $windYaw
  local.get $vessel
  local.get $currentSpeed
  local.get $currentDirection
  call $assembly/index/calculateCurrentForce
  local.set $currentForces
  local.get $currentForces
  i32.const 0
  call $~lib/array/Array<f64>#__get
  local.set $currentSurge
  local.get $currentForces
  i32.const 1
  call $~lib/array/Array<f64>#__get
  local.set $currentSway
  local.get $currentForces
  i32.const 2
  call $~lib/array/Array<f64>#__get
  local.set $currentYaw
  local.get $dt
  f64.const 100
  f64.mul
  local.set $simulationTime
  local.get $vessel
  local.get $effectiveSeaState
  local.get $simulationTime
  call $assembly/index/calculateWaveForce
  local.set $waveForces
  local.get $waveForces
  i32.const 0
  call $~lib/array/Array<f64>#__get
  local.set $waveSurge
  local.get $waveForces
  i32.const 1
  call $~lib/array/Array<f64>#__get
  local.set $waveSway
  local.get $waveForces
  i32.const 2
  call $~lib/array/Array<f64>#__get
  local.set $waveHeave
  local.get $waveForces
  i32.const 3
  call $~lib/array/Array<f64>#__get
  local.set $waveRoll
  local.get $waveForces
  i32.const 4
  call $~lib/array/Array<f64>#__get
  local.set $wavePitch
  local.get $waveForces
  i32.const 5
  call $~lib/array/Array<f64>#__get
  local.set $waveYaw
  local.get $vessel
  call $assembly/index/VesselState#get:mass
  f64.const 1.1
  f64.mul
  local.set $massSurge
  local.get $vessel
  call $assembly/index/VesselState#get:mass
  f64.const 1.6
  f64.mul
  local.set $massSway
  local.get $vessel
  call $assembly/index/VesselState#get:mass
  f64.const 1.2
  f64.mul
  local.set $massHeave
  local.get $vessel
  call $assembly/index/VesselState#get:Ixx
  f64.const 1.1
  f64.mul
  local.set $inertiaRoll
  local.get $vessel
  call $assembly/index/VesselState#get:Iyy
  f64.const 1.1
  f64.mul
  local.set $inertiaPitch
  local.get $vessel
  call $assembly/index/VesselState#get:Izz
  f64.const 1.2
  f64.mul
  local.set $inertiaYaw
  local.get $propulsionForce
  local.get $totalResistance
  f64.sub
  local.get $rudderDrag
  f64.sub
  local.get $windSurge
  f64.add
  local.get $currentSurge
  f64.add
  local.get $waveSurge
  f64.add
  local.set $netForceSurge
  local.get $netForceSurge
  local.get $massSurge
  f64.div
  local.set $surgeDot
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:u
  local.get $surgeDot
  local.get $dt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:u
  local.get $rudderSway
  local.get $windSway
  f64.add
  local.get $currentSway
  f64.add
  local.get $waveSway
  f64.add
  local.set $netForceSway
  local.get $netForceSway
  local.get $massSway
  f64.div
  local.set $swayDot
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:v
  local.get $swayDot
  local.get $dt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:v
  local.get $waveHeave
  local.set $netForceHeave
  local.get $netForceHeave
  local.get $massHeave
  f64.div
  local.set $heaveDot
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:w
  f64.const 0.95
  f64.mul
  local.get $heaveDot
  local.get $dt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:w
  local.get $vessel
  call $assembly/index/VesselState#get:p
  f64.neg
  f64.const 0.9
  f64.mul
  local.set $rollDamping
  local.get $waveRoll
  local.get $rollDamping
  f64.add
  local.set $netMomentRoll
  local.get $netMomentRoll
  local.get $inertiaRoll
  f64.div
  local.set $rollDot
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:p
  local.get $rollDot
  local.get $dt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:p
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:phi
  local.get $vessel
  call $assembly/index/VesselState#get:p
  local.get $dt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:phi
  local.get $vessel
  call $assembly/index/calculateGM
  local.set $GM
  local.get $vessel
  call $assembly/index/VesselState#get:phi
  f64.neg
  local.get $GM
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:mass
  f64.mul
  f64.const 9.81
  f64.mul
  local.set $stabilizingMoment
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:p
  local.get $stabilizingMoment
  local.get $inertiaRoll
  f64.div
  local.get $dt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:p
  local.get $vessel
  block $~lib/math/NativeMath.max|inlined.3 (result f64)
   block $~lib/math/NativeMath.min|inlined.1 (result f64)
    local.get $vessel
    call $assembly/index/VesselState#get:phi
    local.set $value1
    f64.const 0.6
    local.set $value2
    local.get $value1
    local.get $value2
    f64.min
    br $~lib/math/NativeMath.min|inlined.1
   end
   local.set $value1|53
   f64.const -0.6
   local.set $value2|54
   local.get $value1|53
   local.get $value2|54
   f64.max
   br $~lib/math/NativeMath.max|inlined.3
  end
  call $assembly/index/VesselState#set:phi
  local.get $vessel
  call $assembly/index/VesselState#get:q
  f64.neg
  f64.const 0.8
  f64.mul
  local.set $pitchDamping
  local.get $wavePitch
  local.get $pitchDamping
  f64.add
  local.set $netMomentPitch
  local.get $netMomentPitch
  local.get $inertiaPitch
  f64.div
  local.set $pitchDot
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:q
  local.get $pitchDot
  local.get $dt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:q
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:theta
  local.get $vessel
  call $assembly/index/VesselState#get:q
  local.get $dt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:theta
  local.get $vessel
  call $assembly/index/VesselState#get:theta
  f64.neg
  local.get $vessel
  call $assembly/index/VesselState#get:length
  f64.mul
  local.get $vessel
  call $assembly/index/VesselState#get:mass
  f64.mul
  f64.const 0.05
  f64.mul
  local.set $pitchStabilizing
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:q
  local.get $pitchStabilizing
  local.get $inertiaPitch
  f64.div
  local.get $dt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:q
  local.get $vessel
  block $~lib/math/NativeMath.max|inlined.4 (result f64)
   block $~lib/math/NativeMath.min|inlined.2 (result f64)
    local.get $vessel
    call $assembly/index/VesselState#get:theta
    local.set $value1|59
    f64.const 0.3
    local.set $value2|60
    local.get $value1|59
    local.get $value2|60
    f64.min
    br $~lib/math/NativeMath.min|inlined.2
   end
   local.set $value1|61
   f64.const -0.3
   local.set $value2|62
   local.get $value1|61
   local.get $value2|62
   f64.max
   br $~lib/math/NativeMath.max|inlined.4
  end
  call $assembly/index/VesselState#set:theta
  local.get $rudderYaw
  local.get $windYaw
  f64.add
  local.get $currentYaw
  f64.add
  local.get $waveYaw
  f64.add
  local.set $netMomentYaw
  local.get $netMomentYaw
  local.get $inertiaYaw
  f64.div
  local.set $yawDot
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:r
  local.get $yawDot
  local.get $dt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:r
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:psi
  local.get $vessel
  call $assembly/index/VesselState#get:r
  local.get $dt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:psi
  loop $while-continue|0
   local.get $vessel
   call $assembly/index/VesselState#get:psi
   f64.const 2
   global.get $~lib/math/NativeMath.PI
   f64.mul
   f64.gt
   if
    local.get $vessel
    local.get $vessel
    call $assembly/index/VesselState#get:psi
    f64.const 2
    global.get $~lib/math/NativeMath.PI
    f64.mul
    f64.sub
    call $assembly/index/VesselState#set:psi
    br $while-continue|0
   end
  end
  loop $while-continue|1
   local.get $vessel
   call $assembly/index/VesselState#get:psi
   f64.const 0
   f64.lt
   if
    local.get $vessel
    local.get $vessel
    call $assembly/index/VesselState#get:psi
    f64.const 2
    global.get $~lib/math/NativeMath.PI
    f64.mul
    f64.add
    call $assembly/index/VesselState#set:psi
    br $while-continue|1
   end
  end
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
  local.get $dt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:x
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:y
  local.get $worldV
  local.get $dt
  f64.mul
  f64.add
  call $assembly/index/VesselState#set:y
  local.get $vessel
  block $~lib/math/NativeMath.max|inlined.5 (result f64)
   f64.const 0
   local.set $value1|69
   local.get $vessel
   call $assembly/index/VesselState#get:z
   local.get $vessel
   call $assembly/index/VesselState#get:w
   local.get $dt
   f64.mul
   f64.add
   local.set $value2|70
   local.get $value1|69
   local.get $value2|70
   f64.max
   br $~lib/math/NativeMath.max|inlined.5
  end
  call $assembly/index/VesselState#set:z
  local.get $vessel
  call $assembly/index/VesselState#get:fuelLevel
  f64.const 0
  f64.gt
  if
   local.get $vessel
   call $assembly/index/VesselState#get:mass
   f64.const 0.1
   f64.mul
   local.set $fuelTankCapacity
   local.get $vessel
   call $assembly/index/VesselState#get:fuelConsumption
   f64.const 3600
   f64.div
   local.get $fuelTankCapacity
   f64.div
   local.set $fuelConsumptionRate
   block $~lib/math/NativeMath.max|inlined.6 (result f64)
    local.get $fuelConsumptionRate
    local.set $value1|73
    f64.const 0.01
    local.get $dt
    f64.mul
    local.set $value2|74
    local.get $value1|73
    local.get $value2|74
    f64.max
    br $~lib/math/NativeMath.max|inlined.6
   end
   local.set $effectiveFuelRate
   local.get $vessel
   local.get $vessel
   call $assembly/index/VesselState#get:fuelLevel
   local.get $effectiveFuelRate
   local.get $dt
   f64.mul
   f64.sub
   call $assembly/index/VesselState#set:fuelLevel
   local.get $vessel
   call $assembly/index/VesselState#get:fuelLevel
   f64.const 0
   f64.lt
   if
    local.get $vessel
    f64.const 0
    call $assembly/index/VesselState#set:fuelLevel
    local.get $vessel
    f64.const 0
    call $assembly/index/VesselState#set:throttle
    local.get $vessel
    f64.const 0
    call $assembly/index/VesselState#set:engineRPM
   end
  end
  local.get $vessel
  global.set $assembly/index/globalVessel
  local.get $vesselPtr
  return
 )
 (func $assembly/index/VesselState#set:rudderAngle (param $this i32) (param $rudderAngle f64)
  local.get $this
  local.get $rudderAngle
  f64.store offset=104
 )
 (func $assembly/index/VesselState#set:length (param $this i32) (param $length f64)
  local.get $this
  local.get $length
  f64.store offset=120
 )
 (func $assembly/index/VesselState#set:beam (param $this i32) (param $beam f64)
  local.get $this
  local.get $beam
  f64.store offset=128
 )
 (func $assembly/index/VesselState#set:draft (param $this i32) (param $draft f64)
  local.get $this
  local.get $draft
  f64.store offset=136
 )
 (func $assembly/index/VesselState#set:blockCoefficient (param $this i32) (param $blockCoefficient f64)
  local.get $this
  local.get $blockCoefficient
  f64.store offset=144
 )
 (func $assembly/index/VesselState#set:waterDensity (param $this i32) (param $waterDensity f64)
  local.get $this
  local.get $waterDensity
  f64.store offset=152
 )
 (func $assembly/index/VesselState#set:maxEnginePower (param $this i32) (param $maxEnginePower f64)
  local.get $this
  local.get $maxEnginePower
  f64.store offset=168
 )
 (func $assembly/index/VesselState#set:propellerDiameter (param $this i32) (param $propellerDiameter f64)
  local.get $this
  local.get $propellerDiameter
  f64.store offset=184
 )
 (func $assembly/index/VesselState#calculateDisplacement (param $this i32) (result f64)
  local.get $this
  call $assembly/index/VesselState#get:length
  local.get $this
  call $assembly/index/VesselState#get:beam
  f64.mul
  local.get $this
  call $assembly/index/VesselState#get:draft
  f64.mul
  local.get $this
  call $assembly/index/VesselState#get:blockCoefficient
  f64.mul
  return
 )
 (func $assembly/index/VesselState#set:displacement (param $this i32) (param $displacement f64)
  local.get $this
  local.get $displacement
  f64.store offset=216
 )
 (func $assembly/index/VesselState#set:Ixx (param $this i32) (param $Ixx f64)
  local.get $this
  local.get $Ixx
  f64.store offset=224
 )
 (func $assembly/index/VesselState#set:Iyy (param $this i32) (param $Iyy f64)
  local.get $this
  local.get $Iyy
  f64.store offset=232
 )
 (func $assembly/index/VesselState#set:Izz (param $this i32) (param $Izz f64)
  local.get $this
  local.get $Izz
  f64.store offset=240
 )
 (func $assembly/index/VesselState#set:ballastLevel (param $this i32) (param $ballastLevel f64)
  local.get $this
  local.get $ballastLevel
  f64.store offset=256
 )
 (func $assembly/index/VesselState#set:waveDirection (param $this i32) (param $waveDirection f64)
  local.get $this
  local.get $waveDirection
  f64.store offset=272
 )
 (func $assembly/index/VesselState#constructor (param $this i32) (param $x f64) (param $y f64) (param $z f64) (param $psi f64) (param $phi f64) (param $theta f64) (param $u f64) (param $v f64) (param $w f64) (param $r f64) (param $p f64) (param $q f64) (param $throttle f64) (param $rudderAngle f64) (param $mass f64) (param $length f64) (param $beam f64) (param $draft f64) (result i32)
  local.get $this
  i32.eqz
  if
   i32.const 296
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
  call $assembly/index/VesselState#set:phi
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:theta
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
  call $assembly/index/VesselState#set:blockCoefficient
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waterDensity
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:engineRPM
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:maxEnginePower
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:fuelConsumption
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:propellerDiameter
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:centerOfGravityX
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:centerOfGravityY
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:centerOfGravityZ
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:displacement
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:Ixx
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:Iyy
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:Izz
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:fuelLevel
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:ballastLevel
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waveHeight
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waveDirection
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waveFrequency
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:wavePhase
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
  local.get $phi
  call $assembly/index/VesselState#set:phi
  local.get $this
  local.get $theta
  call $assembly/index/VesselState#set:theta
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
  local.get $this
  local.get $throttle
  call $assembly/index/VesselState#set:throttle
  local.get $this
  local.get $rudderAngle
  call $assembly/index/VesselState#set:rudderAngle
  local.get $this
  local.get $mass
  call $assembly/index/VesselState#set:mass
  local.get $this
  local.get $length
  call $assembly/index/VesselState#set:length
  local.get $this
  local.get $beam
  call $assembly/index/VesselState#set:beam
  local.get $this
  local.get $draft
  call $assembly/index/VesselState#set:draft
  local.get $this
  f64.const 0.8
  call $assembly/index/VesselState#set:blockCoefficient
  local.get $this
  f64.const 1025
  call $assembly/index/VesselState#set:waterDensity
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:engineRPM
  local.get $this
  f64.const 2e3
  call $assembly/index/VesselState#set:maxEnginePower
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:fuelConsumption
  local.get $this
  f64.const 3
  call $assembly/index/VesselState#set:propellerDiameter
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:centerOfGravityX
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:centerOfGravityY
  local.get $this
  local.get $draft
  f64.const 0.5
  f64.mul
  call $assembly/index/VesselState#set:centerOfGravityZ
  local.get $this
  local.get $this
  call $assembly/index/VesselState#calculateDisplacement
  call $assembly/index/VesselState#set:displacement
  local.get $this
  local.get $mass
  local.get $beam
  local.get $beam
  f64.mul
  local.get $draft
  local.get $draft
  f64.mul
  f64.add
  f64.mul
  f64.const 12
  f64.div
  call $assembly/index/VesselState#set:Ixx
  local.get $this
  local.get $mass
  local.get $length
  local.get $length
  f64.mul
  local.get $draft
  local.get $draft
  f64.mul
  f64.add
  f64.mul
  f64.const 12
  f64.div
  call $assembly/index/VesselState#set:Iyy
  local.get $this
  local.get $mass
  local.get $length
  local.get $length
  f64.mul
  local.get $beam
  local.get $beam
  f64.mul
  f64.add
  f64.mul
  f64.const 12
  f64.div
  call $assembly/index/VesselState#set:Izz
  local.get $this
  f64.const 1
  call $assembly/index/VesselState#set:fuelLevel
  local.get $this
  f64.const 0.5
  call $assembly/index/VesselState#set:ballastLevel
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waveHeight
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waveDirection
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:waveFrequency
  local.get $this
  f64.const 0
  call $assembly/index/VesselState#set:wavePhase
  local.get $this
 )
 (func $assembly/index/createVessel (result i32)
  global.get $assembly/index/globalVessel
  i32.const 0
  i32.eq
  if
   i32.const 0
   f64.const 0
   f64.const 0
   f64.const 0
   f64.const 0
   f64.const 0
   f64.const 0
   f64.const 1
   f64.const 0
   f64.const 0
   f64.const 0
   f64.const 0
   f64.const 0
   f64.const 0.2
   f64.const 0
   f64.const 5e4
   f64.const 50
   f64.const 10
   f64.const 3
   call $assembly/index/VesselState#constructor
   global.set $assembly/index/globalVessel
  end
  global.get $assembly/index/globalVessel
  return
 )
 (func $assembly/index/setThrottle (param $vesselPtr i32) (param $throttle f64)
  (local $vessel i32)
  local.get $vesselPtr
  local.set $vessel
  local.get $vessel
  local.get $throttle
  f64.const 1
  f64.gt
  if (result f64)
   f64.const 1
  else
   local.get $throttle
   f64.const 0
   f64.lt
   if (result f64)
    f64.const 0
   else
    local.get $throttle
   end
  end
  call $assembly/index/VesselState#set:throttle
  local.get $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:throttle
  f64.const 1200
  f64.mul
  call $assembly/index/VesselState#set:engineRPM
  local.get $vessel
  call $assembly/index/VesselState#get:throttle
  f64.const 0.01
  f64.gt
  if (result i32)
   local.get $vessel
   call $assembly/index/VesselState#get:fuelLevel
   f64.const 0
   f64.gt
  else
   i32.const 0
  end
  if
   local.get $vessel
   f64.const 5
   local.get $vessel
   call $assembly/index/VesselState#get:throttle
   local.get $vessel
   call $assembly/index/VesselState#get:throttle
   f64.mul
   f64.const 95
   f64.mul
   f64.add
   call $assembly/index/VesselState#set:fuelConsumption
  else
   local.get $vessel
   f64.const 0
   call $assembly/index/VesselState#set:fuelConsumption
  end
  local.get $vessel
  global.set $assembly/index/globalVessel
 )
 (func $assembly/index/setWaveData (param $vesselPtr i32) (param $height f64) (param $phase f64)
  (local $vessel i32)
  local.get $vesselPtr
  local.set $vessel
  local.get $vessel
  local.get $height
  call $assembly/index/VesselState#set:waveHeight
  local.get $vessel
  local.get $phase
  call $assembly/index/VesselState#set:wavePhase
  local.get $vessel
  global.set $assembly/index/globalVessel
 )
 (func $assembly/index/setRudderAngle (param $vesselPtr i32) (param $angle f64)
  (local $vessel i32)
  local.get $vesselPtr
  local.set $vessel
  local.get $vessel
  local.get $angle
  f64.const 0.6
  f64.gt
  if (result f64)
   f64.const 0.6
  else
   local.get $angle
   f64.const 0.6
   f64.neg
   f64.lt
   if (result f64)
    f64.const 0.6
    f64.neg
   else
    local.get $angle
   end
  end
  call $assembly/index/VesselState#set:rudderAngle
  local.get $vessel
  global.set $assembly/index/globalVessel
 )
 (func $assembly/index/setBallast (param $vesselPtr i32) (param $level f64)
  (local $vessel i32)
  local.get $vesselPtr
  local.set $vessel
  local.get $vessel
  local.get $level
  f64.const 1
  f64.gt
  if (result f64)
   f64.const 1
  else
   local.get $level
   f64.const 0
   f64.lt
   if (result f64)
    f64.const 0
   else
    local.get $level
   end
  end
  call $assembly/index/VesselState#set:ballastLevel
  local.get $vessel
  call $assembly/index/calculateCenterOfGravity
  local.get $vessel
  global.set $assembly/index/globalVessel
 )
 (func $assembly/index/getVesselRollAngle (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/VesselState#get:phi
  return
 )
 (func $assembly/index/getVesselPitchAngle (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/VesselState#get:theta
  return
 )
 (func $assembly/index/getVesselX (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/VesselState#get:x
  return
 )
 (func $assembly/index/getVesselY (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/VesselState#get:y
  return
 )
 (func $assembly/index/getVesselZ (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/VesselState#get:z
  return
 )
 (func $assembly/index/getVesselHeading (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/VesselState#get:psi
  return
 )
 (func $assembly/index/getVesselSpeed (param $vesselPtr i32) (result f64)
  (local $vessel i32)
  (local $x f64)
  local.get $vesselPtr
  local.set $vessel
  block $~lib/math/NativeMath.sqrt|inlined.5 (result f64)
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
   br $~lib/math/NativeMath.sqrt|inlined.5
  end
  return
 )
 (func $assembly/index/getVesselEngineRPM (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/VesselState#get:engineRPM
  return
 )
 (func $assembly/index/getVesselFuelLevel (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/VesselState#get:fuelLevel
  return
 )
 (func $assembly/index/getVesselFuelConsumption (param $vesselPtr i32) (result f64)
  local.get $vesselPtr
  call $assembly/index/VesselState#get:fuelConsumption
  return
 )
 (func $assembly/index/getVesselGM (param $vesselPtr i32) (result f64)
  (local $vessel i32)
  local.get $vesselPtr
  local.set $vessel
  local.get $vessel
  call $assembly/index/calculateGM
  return
 )
 (func $assembly/index/VesselState#get:centerOfGravityY (param $this i32) (result f64)
  local.get $this
  f64.load offset=200
 )
 (func $assembly/index/getVesselCenterOfGravityY (param $vesselPtr i32) (result f64)
  (local $vessel i32)
  local.get $vesselPtr
  local.set $vessel
  local.get $vessel
  call $assembly/index/VesselState#get:centerOfGravityY
  return
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
