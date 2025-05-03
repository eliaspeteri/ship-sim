(module
 (type $0 (func (param i32) (result f64)))
 (type $1 (func (param f64) (result f64)))
 (type $2 (func (param i32 f64)))
 (type $3 (func (param i32) (result i32)))
 (type $4 (func (param i32 i32) (result i32)))
 (type $5 (func (param f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64 f64) (result i32)))
 (type $6 (func))
 (type $7 (func (param i32 i32 i32 i32)))
 (type $8 (func (param i32 i32) (result f64)))
 (type $9 (func (param f64) (result i32)))
 (type $10 (func (param f64 f64) (result f64)))
 (type $11 (func (param i64) (result i32)))
 (type $12 (func (param f64 f64 f64 f64 f64 f64 f64 f64) (result f64)))
 (type $13 (func (param i32 i32 f64)))
 (type $14 (func (param i32 i32 f64) (result i32)))
 (type $15 (func (param i32)))
 (type $16 (func (param i32 f64 f64 f64 f64 f64) (result i32)))
 (type $17 (func (param i32 f64 f64)))
 (type $18 (func (param i32 f64 f64 f64)))
 (import "env" "memory" (memory $0 16 100))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (global $assembly/index/globalVessel (mut i32) (i32.const 0))
 (global $~lib/util/math/log_tail (mut f64) (f64.const 0))
 (global $~lib/math/rempio2_y0 (mut f64) (f64.const 0))
 (global $~lib/math/rempio2_y1 (mut f64) (f64.const 0))
 (global $~lib/math/res128_hi (mut i64) (i64.const 0))
 (global $~lib/rt/stub/offset (mut i32) (i32.const 0))
 (data $0 (i32.const 1036) "|\00\00\00\00\00\00\00\00\00\00\00\01\00\00\00h\00\00\00\00\00\00\00\00\00\00\00\9a\99\99\99\99\99\b9?\9a\99\99\99\99\99\c9?333333\e3?\00\00\00\00\00\00\f0?\00\00\00\00\00\00\00@\00\00\00\00\00\00\08@\00\00\00\00\00\00\10@\00\00\00\00\00\00\16@\00\00\00\00\00\00\1c@\00\00\00\00\00\00\"@\00\00\00\00\00\00\'@\00\00\00\00\00\00,@\00\00\00\00")
 (data $1 (i32.const 1164) ",\00\00\00\00\00\00\00\00\00\00\00\04\00\00\00\10\00\00\00 \04\00\00 \04\00\00h\00\00\00\r\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $2 (i32.const 1212) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00$\00\00\00I\00n\00d\00e\00x\00 \00o\00u\00t\00 \00o\00f\00 \00r\00a\00n\00g\00e\00\00\00\00\00\00\00\00\00")
 (data $3 (i32.const 1276) ",\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\1a\00\00\00~\00l\00i\00b\00/\00a\00r\00r\00a\00y\00.\00t\00s\00\00\00")
 (data $4 (i32.const 1328) "\00\00\00\00\00\a0\f6?\00\00\00\00\00\00\00\00\00\c8\b9\f2\82,\d6\bf\80V7($\b4\fa<\00\00\00\00\00\80\f6?\00\00\00\00\00\00\00\00\00\08X\bf\bd\d1\d5\bf \f7\e0\d8\08\a5\1c\bd\00\00\00\00\00`\f6?\00\00\00\00\00\00\00\00\00XE\17wv\d5\bfmP\b6\d5\a4b#\bd\00\00\00\00\00@\f6?\00\00\00\00\00\00\00\00\00\f8-\87\ad\1a\d5\bf\d5g\b0\9e\e4\84\e6\bc\00\00\00\00\00 \f6?\00\00\00\00\00\00\00\00\00xw\95_\be\d4\bf\e0>)\93i\1b\04\bd\00\00\00\00\00\00\f6?\00\00\00\00\00\00\00\00\00`\1c\c2\8ba\d4\bf\cc\84LH/\d8\13=\00\00\00\00\00\e0\f5?\00\00\00\00\00\00\00\00\00\a8\86\860\04\d4\bf:\0b\82\ed\f3B\dc<\00\00\00\00\00\c0\f5?\00\00\00\00\00\00\00\00\00HiUL\a6\d3\bf`\94Q\86\c6\b1 =\00\00\00\00\00\a0\f5?\00\00\00\00\00\00\00\00\00\80\98\9a\ddG\d3\bf\92\80\c5\d4MY%=\00\00\00\00\00\80\f5?\00\00\00\00\00\00\00\00\00 \e1\ba\e2\e8\d2\bf\d8+\b7\99\1e{&=\00\00\00\00\00`\f5?\00\00\00\00\00\00\00\00\00\88\de\13Z\89\d2\bf?\b0\cf\b6\14\ca\15=\00\00\00\00\00`\f5?\00\00\00\00\00\00\00\00\00\88\de\13Z\89\d2\bf?\b0\cf\b6\14\ca\15=\00\00\00\00\00@\f5?\00\00\00\00\00\00\00\00\00x\cf\fbA)\d2\bfv\daS($Z\16\bd\00\00\00\00\00 \f5?\00\00\00\00\00\00\00\00\00\98i\c1\98\c8\d1\bf\04T\e7h\bc\af\1f\bd\00\00\00\00\00\00\f5?\00\00\00\00\00\00\00\00\00\a8\ab\ab\\g\d1\bf\f0\a8\823\c6\1f\1f=\00\00\00\00\00\e0\f4?\00\00\00\00\00\00\00\00\00H\ae\f9\8b\05\d1\bffZ\05\fd\c4\a8&\bd\00\00\00\00\00\c0\f4?\00\00\00\00\00\00\00\00\00\90s\e2$\a3\d0\bf\0e\03\f4~\eek\0c\bd\00\00\00\00\00\a0\f4?\00\00\00\00\00\00\00\00\00\d0\b4\94%@\d0\bf\7f-\f4\9e\b86\f0\bc\00\00\00\00\00\a0\f4?\00\00\00\00\00\00\00\00\00\d0\b4\94%@\d0\bf\7f-\f4\9e\b86\f0\bc\00\00\00\00\00\80\f4?\00\00\00\00\00\00\00\00\00@^m\18\b9\cf\bf\87<\99\ab*W\r=\00\00\00\00\00`\f4?\00\00\00\00\00\00\00\00\00`\dc\cb\ad\f0\ce\bf$\af\86\9c\b7&+=\00\00\00\00\00@\f4?\00\00\00\00\00\00\00\00\00\f0*n\07\'\ce\bf\10\ff?TO/\17\bd\00\00\00\00\00 \f4?\00\00\00\00\00\00\00\00\00\c0Ok!\\\cd\bf\1bh\ca\bb\91\ba!=\00\00\00\00\00\00\f4?\00\00\00\00\00\00\00\00\00\a0\9a\c7\f7\8f\cc\bf4\84\9fhOy\'=\00\00\00\00\00\00\f4?\00\00\00\00\00\00\00\00\00\a0\9a\c7\f7\8f\cc\bf4\84\9fhOy\'=\00\00\00\00\00\e0\f3?\00\00\00\00\00\00\00\00\00\90-t\86\c2\cb\bf\8f\b7\8b1\b0N\19=\00\00\00\00\00\c0\f3?\00\00\00\00\00\00\00\00\00\c0\80N\c9\f3\ca\bff\90\cd?cN\ba<\00\00\00\00\00\a0\f3?\00\00\00\00\00\00\00\00\00\b0\e2\1f\bc#\ca\bf\ea\c1F\dcd\8c%\bd\00\00\00\00\00\a0\f3?\00\00\00\00\00\00\00\00\00\b0\e2\1f\bc#\ca\bf\ea\c1F\dcd\8c%\bd\00\00\00\00\00\80\f3?\00\00\00\00\00\00\00\00\00P\f4\9cZR\c9\bf\e3\d4\c1\04\d9\d1*\bd\00\00\00\00\00`\f3?\00\00\00\00\00\00\00\00\00\d0 e\a0\7f\c8\bf\t\fa\db\7f\bf\bd+=\00\00\00\00\00@\f3?\00\00\00\00\00\00\00\00\00\e0\10\02\89\ab\c7\bfXJSr\90\db+=\00\00\00\00\00@\f3?\00\00\00\00\00\00\00\00\00\e0\10\02\89\ab\c7\bfXJSr\90\db+=\00\00\00\00\00 \f3?\00\00\00\00\00\00\00\00\00\d0\19\e7\0f\d6\c6\bff\e2\b2\a3j\e4\10\bd\00\00\00\00\00\00\f3?\00\00\00\00\00\00\00\00\00\90\a7p0\ff\c5\bf9P\10\9fC\9e\1e\bd\00\00\00\00\00\00\f3?\00\00\00\00\00\00\00\00\00\90\a7p0\ff\c5\bf9P\10\9fC\9e\1e\bd\00\00\00\00\00\e0\f2?\00\00\00\00\00\00\00\00\00\b0\a1\e3\e5&\c5\bf\8f[\07\90\8b\de \bd\00\00\00\00\00\c0\f2?\00\00\00\00\00\00\00\00\00\80\cbl+M\c4\bf<x5a\c1\0c\17=\00\00\00\00\00\c0\f2?\00\00\00\00\00\00\00\00\00\80\cbl+M\c4\bf<x5a\c1\0c\17=\00\00\00\00\00\a0\f2?\00\00\00\00\00\00\00\00\00\90\1e \fcq\c3\bf:T\'M\86x\f1<\00\00\00\00\00\80\f2?\00\00\00\00\00\00\00\00\00\f0\1f\f8R\95\c2\bf\08\c4q\170\8d$\bd\00\00\00\00\00`\f2?\00\00\00\00\00\00\00\00\00`/\d5*\b7\c1\bf\96\a3\11\18\a4\80.\bd\00\00\00\00\00`\f2?\00\00\00\00\00\00\00\00\00`/\d5*\b7\c1\bf\96\a3\11\18\a4\80.\bd\00\00\00\00\00@\f2?\00\00\00\00\00\00\00\00\00\90\d0|~\d7\c0\bf\f4[\e8\88\96i\n=\00\00\00\00\00@\f2?\00\00\00\00\00\00\00\00\00\90\d0|~\d7\c0\bf\f4[\e8\88\96i\n=\00\00\00\00\00 \f2?\00\00\00\00\00\00\00\00\00\e0\db1\91\ec\bf\bf\f23\a3\\Tu%\bd\00\00\00\00\00\00\f2?\00\00\00\00\00\00\00\00\00\00+n\07\'\be\bf<\00\f0*,4*=\00\00\00\00\00\00\f2?\00\00\00\00\00\00\00\00\00\00+n\07\'\be\bf<\00\f0*,4*=\00\00\00\00\00\e0\f1?\00\00\00\00\00\00\00\00\00\c0[\8fT^\bc\bf\06\be_XW\0c\1d\bd\00\00\00\00\00\c0\f1?\00\00\00\00\00\00\00\00\00\e0J:m\92\ba\bf\c8\aa[\e859%=\00\00\00\00\00\c0\f1?\00\00\00\00\00\00\00\00\00\e0J:m\92\ba\bf\c8\aa[\e859%=\00\00\00\00\00\a0\f1?\00\00\00\00\00\00\00\00\00\a01\d6E\c3\b8\bfhV/M)|\13=\00\00\00\00\00\a0\f1?\00\00\00\00\00\00\00\00\00\a01\d6E\c3\b8\bfhV/M)|\13=\00\00\00\00\00\80\f1?\00\00\00\00\00\00\00\00\00`\e5\8a\d2\f0\b6\bf\das3\c97\97&\bd\00\00\00\00\00`\f1?\00\00\00\00\00\00\00\00\00 \06?\07\1b\b5\bfW^\c6a[\02\1f=\00\00\00\00\00`\f1?\00\00\00\00\00\00\00\00\00 \06?\07\1b\b5\bfW^\c6a[\02\1f=\00\00\00\00\00@\f1?\00\00\00\00\00\00\00\00\00\e0\1b\96\d7A\b3\bf\df\13\f9\cc\da^,=\00\00\00\00\00@\f1?\00\00\00\00\00\00\00\00\00\e0\1b\96\d7A\b3\bf\df\13\f9\cc\da^,=\00\00\00\00\00 \f1?\00\00\00\00\00\00\00\00\00\80\a3\ee6e\b1\bf\t\a3\8fv^|\14=\00\00\00\00\00\00\f1?\00\00\00\00\00\00\00\00\00\80\11\c00\n\af\bf\91\8e6\83\9eY-=\00\00\00\00\00\00\f1?\00\00\00\00\00\00\00\00\00\80\11\c00\n\af\bf\91\8e6\83\9eY-=\00\00\00\00\00\e0\f0?\00\00\00\00\00\00\00\00\00\80\19q\ddB\ab\bfLp\d6\e5z\82\1c=\00\00\00\00\00\e0\f0?\00\00\00\00\00\00\00\00\00\80\19q\ddB\ab\bfLp\d6\e5z\82\1c=\00\00\00\00\00\c0\f0?\00\00\00\00\00\00\00\00\00\c02\f6Xt\a7\bf\ee\a1\f24F\fc,\bd\00\00\00\00\00\c0\f0?\00\00\00\00\00\00\00\00\00\c02\f6Xt\a7\bf\ee\a1\f24F\fc,\bd\00\00\00\00\00\a0\f0?\00\00\00\00\00\00\00\00\00\c0\fe\b9\87\9e\a3\bf\aa\fe&\f5\b7\02\f5<\00\00\00\00\00\a0\f0?\00\00\00\00\00\00\00\00\00\c0\fe\b9\87\9e\a3\bf\aa\fe&\f5\b7\02\f5<\00\00\00\00\00\80\f0?\00\00\00\00\00\00\00\00\00\00x\0e\9b\82\9f\bf\e4\t~|&\80)\bd\00\00\00\00\00\80\f0?\00\00\00\00\00\00\00\00\00\00x\0e\9b\82\9f\bf\e4\t~|&\80)\bd\00\00\00\00\00`\f0?\00\00\00\00\00\00\00\00\00\80\d5\07\1b\b9\97\bf9\a6\fa\93T\8d(\bd\00\00\00\00\00@\f0?\00\00\00\00\00\00\00\00\00\00\fc\b0\a8\c0\8f\bf\9c\a6\d3\f6|\1e\df\bc\00\00\00\00\00@\f0?\00\00\00\00\00\00\00\00\00\00\fc\b0\a8\c0\8f\bf\9c\a6\d3\f6|\1e\df\bc\00\00\00\00\00 \f0?\00\00\00\00\00\00\00\00\00\00\10k*\e0\7f\bf\e4@\da\r?\e2\19\bd\00\00\00\00\00 \f0?\00\00\00\00\00\00\00\00\00\00\10k*\e0\7f\bf\e4@\da\r?\e2\19\bd\00\00\00\00\00\00\f0?\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\f0?\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\c0\ef?\00\00\00\00\00\00\00\00\00\00\89u\15\10\80?\e8+\9d\99k\c7\10\bd\00\00\00\00\00\80\ef?\00\00\00\00\00\00\00\00\00\80\93XV \90?\d2\f7\e2\06[\dc#\bd\00\00\00\00\00@\ef?\00\00\00\00\00\00\00\00\00\00\c9(%I\98?4\0cZ2\ba\a0*\bd\00\00\00\00\00\00\ef?\00\00\00\00\00\00\00\00\00@\e7\89]A\a0?S\d7\f1\\\c0\11\01=\00\00\00\00\00\c0\ee?\00\00\00\00\00\00\00\00\00\00.\d4\aef\a4?(\fd\bdus\16,\bd\00\00\00\00\00\80\ee?\00\00\00\00\00\00\00\00\00\c0\9f\14\aa\94\a8?}&Z\d0\95y\19\bd\00\00\00\00\00@\ee?\00\00\00\00\00\00\00\00\00\c0\dd\cds\cb\ac?\07(\d8G\f2h\1a\bd\00\00\00\00\00 \ee?\00\00\00\00\00\00\00\00\00\c0\06\c01\ea\ae?{;\c9O>\11\0e\bd\00\00\00\00\00\e0\ed?\00\00\00\00\00\00\00\00\00`F\d1;\97\b1?\9b\9e\rV]2%\bd\00\00\00\00\00\a0\ed?\00\00\00\00\00\00\00\00\00\e0\d1\a7\f5\bd\b3?\d7N\db\a5^\c8,=\00\00\00\00\00`\ed?\00\00\00\00\00\00\00\00\00\a0\97MZ\e9\b5?\1e\1d]<\06i,\bd\00\00\00\00\00@\ed?\00\00\00\00\00\00\00\00\00\c0\ea\n\d3\00\b7?2\ed\9d\a9\8d\1e\ec<\00\00\00\00\00\00\ed?\00\00\00\00\00\00\00\00\00@Y]^3\b9?\daG\bd:\\\11#=\00\00\00\00\00\c0\ec?\00\00\00\00\00\00\00\00\00`\ad\8d\c8j\bb?\e5h\f7+\80\90\13\bd\00\00\00\00\00\a0\ec?\00\00\00\00\00\00\00\00\00@\bc\01X\88\bc?\d3\acZ\c6\d1F&=\00\00\00\00\00`\ec?\00\00\00\00\00\00\00\00\00 \n\839\c7\be?\e0E\e6\afh\c0-\bd\00\00\00\00\00@\ec?\00\00\00\00\00\00\00\00\00\e0\db9\91\e8\bf?\fd\n\a1O\d64%\bd\00\00\00\00\00\00\ec?\00\00\00\00\00\00\00\00\00\e0\'\82\8e\17\c1?\f2\07-\cex\ef!=\00\00\00\00\00\e0\eb?\00\00\00\00\00\00\00\00\00\f0#~+\aa\c1?4\998D\8e\a7,=\00\00\00\00\00\a0\eb?\00\00\00\00\00\00\00\00\00\80\86\0ca\d1\c2?\a1\b4\81\cbl\9d\03=\00\00\00\00\00\80\eb?\00\00\00\00\00\00\00\00\00\90\15\b0\fce\c3?\89rK#\a8/\c6<\00\00\00\00\00@\eb?\00\00\00\00\00\00\00\00\00\b03\83=\91\c4?x\b6\fdTy\83%=\00\00\00\00\00 \eb?\00\00\00\00\00\00\00\00\00\b0\a1\e4\e5\'\c5?\c7}i\e5\e83&=\00\00\00\00\00\e0\ea?\00\00\00\00\00\00\00\00\00\10\8c\beNW\c6?x.<,\8b\cf\19=\00\00\00\00\00\c0\ea?\00\00\00\00\00\00\00\00\00pu\8b\12\f0\c6?\e1!\9c\e5\8d\11%\bd\00\00\00\00\00\a0\ea?\00\00\00\00\00\00\00\00\00PD\85\8d\89\c7?\05C\91p\10f\1c\bd\00\00\00\00\00`\ea?\00\00\00\00\00\00\00\00\00\009\eb\af\be\c8?\d1,\e9\aaT=\07\bd\00\00\00\00\00@\ea?\00\00\00\00\00\00\00\00\00\00\f7\dcZZ\c9?o\ff\a0X(\f2\07=\00\00\00\00\00\00\ea?\00\00\00\00\00\00\00\00\00\e0\8a<\ed\93\ca?i!VPCr(\bd\00\00\00\00\00\e0\e9?\00\00\00\00\00\00\00\00\00\d0[W\d81\cb?\aa\e1\acN\8d5\0c\bd\00\00\00\00\00\c0\e9?\00\00\00\00\00\00\00\00\00\e0;8\87\d0\cb?\b6\12TY\c4K-\bd\00\00\00\00\00\a0\e9?\00\00\00\00\00\00\00\00\00\10\f0\c6\fbo\cc?\d2+\96\c5r\ec\f1\bc\00\00\00\00\00`\e9?\00\00\00\00\00\00\00\00\00\90\d4\b0=\b1\cd?5\b0\15\f7*\ff*\bd\00\00\00\00\00@\e9?\00\00\00\00\00\00\00\00\00\10\e7\ff\0eS\ce?0\f4A`\'\12\c2<\00\00\00\00\00 \e9?\00\00\00\00\00\00\00\00\00\00\dd\e4\ad\f5\ce?\11\8e\bbe\15!\ca\bc\00\00\00\00\00\00\e9?\00\00\00\00\00\00\00\00\00\b0\b3l\1c\99\cf?0\df\0c\ca\ec\cb\1b=\00\00\00\00\00\c0\e8?\00\00\00\00\00\00\00\00\00XM`8q\d0?\91N\ed\16\db\9c\f8<\00\00\00\00\00\a0\e8?\00\00\00\00\00\00\00\00\00`ag-\c4\d0?\e9\ea<\16\8b\18\'=\00\00\00\00\00\80\e8?\00\00\00\00\00\00\00\00\00\e8\'\82\8e\17\d1?\1c\f0\a5c\0e!,\bd\00\00\00\00\00`\e8?\00\00\00\00\00\00\00\00\00\f8\ac\cb\\k\d1?\81\16\a5\f7\cd\9a+=\00\00\00\00\00@\e8?\00\00\00\00\00\00\00\00\00hZc\99\bf\d1?\b7\bdGQ\ed\a6,=\00\00\00\00\00 \e8?\00\00\00\00\00\00\00\00\00\b8\0emE\14\d2?\ea\baF\ba\de\87\n=\00\00\00\00\00\e0\e7?\00\00\00\00\00\00\00\00\00\90\dc|\f0\be\d2?\f4\04PJ\fa\9c*=\00\00\00\00\00\c0\e7?\00\00\00\00\00\00\00\00\00`\d3\e1\f1\14\d3?\b8<!\d3z\e2(\bd\00\00\00\00\00\a0\e7?\00\00\00\00\00\00\00\00\00\10\bevgk\d3?\c8w\f1\b0\cdn\11=\00\00\00\00\00\80\e7?\00\00\00\00\00\00\00\00\0003wR\c2\d3?\\\bd\06\b6T;\18=\00\00\00\00\00`\e7?\00\00\00\00\00\00\00\00\00\e8\d5#\b4\19\d4?\9d\e0\90\ec6\e4\08=\00\00\00\00\00@\e7?\00\00\00\00\00\00\00\00\00\c8q\c2\8dq\d4?u\d6g\t\ce\'/\bd\00\00\00\00\00 \e7?\00\00\00\00\00\00\00\00\000\17\9e\e0\c9\d4?\a4\d8\n\1b\89 .\bd\00\00\00\00\00\00\e7?\00\00\00\00\00\00\00\00\00\a08\07\ae\"\d5?Y\c7d\81p\be.=\00\00\00\00\00\e0\e6?\00\00\00\00\00\00\00\00\00\d0\c8S\f7{\d5?\ef@]\ee\ed\ad\1f=\00\00\00\00\00\c0\e6?\00\00\00\00\00\00\00\00\00`Y\df\bd\d5\d5?\dce\a4\08*\0b\n\bd")
 (data $5 (i32.const 5424) "\00\00\00\00\00\00\00\00\00\00\00\00\00\00\f0?n\bf\88\1aO;\9b<53\fb\a9=\f6\ef?]\dc\d8\9c\13`q\bca\80w>\9a\ec\ef?\d1f\87\10z^\90\bc\85\7fn\e8\15\e3\ef?\13\f6g5R\d2\8c<t\85\15\d3\b0\d9\ef?\fa\8e\f9#\80\ce\8b\bc\de\f6\dd)k\d0\ef?a\c8\e6aN\f7`<\c8\9bu\18E\c7\ef?\99\d33[\e4\a3\90<\83\f3\c6\ca>\be\ef?m{\83]\a6\9a\97<\0f\89\f9lX\b5\ef?\fc\ef\fd\92\1a\b5\8e<\f7Gr+\92\ac\ef?\d1\9c/p=\be><\a2\d1\d32\ec\a3\ef?\0bn\90\894\03j\bc\1b\d3\fe\aff\9b\ef?\0e\bd/*RV\95\bcQ[\12\d0\01\93\ef?U\eaN\8c\ef\80P\bc\cc1l\c0\bd\8a\ef?\16\f4\d5\b9#\c9\91\bc\e0-\a9\ae\9a\82\ef?\afU\\\e9\e3\d3\80<Q\8e\a5\c8\98z\ef?H\93\a5\ea\15\1b\80\bc{Q}<\b8r\ef?=2\deU\f0\1f\8f\bc\ea\8d\8c8\f9j\ef?\bfS\13?\8c\89\8b<u\cbo\eb[c\ef?&\eb\11v\9c\d9\96\bc\d4\\\04\84\e0[\ef?`/:>\f7\ec\9a<\aa\b9h1\87T\ef?\9d8\86\cb\82\e7\8f\bc\1d\d9\fc\"PM\ef?\8d\c3\a6DAo\8a<\d6\8cb\88;F\ef?}\04\e4\b0\05z\80<\96\dc}\91I?\ef?\94\a8\a8\e3\fd\8e\96<8bunz8\ef?}Ht\f2\18^\87<?\a6\b2O\ce1\ef?\f2\e7\1f\98+G\80<\dd|\e2eE+\ef?^\08q?{\b8\96\bc\81c\f5\e1\df$\ef?1\ab\tm\e1\f7\82<\e1\de\1f\f5\9d\1e\ef?\fa\bfo\1a\9b!=\bc\90\d9\da\d0\7f\18\ef?\b4\n\0cr\827\8b<\0b\03\e4\a6\85\12\ef?\8f\cb\ce\89\92\14n<V/>\a9\af\0c\ef?\b6\ab\b0MuM\83<\15\b71\n\fe\06\ef?Lt\ac\e2\01B\86<1\d8L\fcp\01\ef?J\f8\d3]9\dd\8f<\ff\16d\b2\08\fc\ee?\04[\8e;\80\a3\86\bc\f1\9f\92_\c5\f6\ee?hPK\cc\edJ\92\bc\cb\a9:7\a7\f1\ee?\8e-Q\1b\f8\07\99\bcf\d8\05m\ae\ec\ee?\d26\94>\e8\d1q\bc\f7\9f\e54\db\e7\ee?\15\1b\ce\b3\19\19\99\bc\e5\a8\13\c3-\e3\ee?mL*\a7H\9f\85<\"4\12L\a6\de\ee?\8ai(z`\12\93\bc\1c\80\ac\04E\da\ee?[\89\17H\8f\a7X\bc*.\f7!\n\d6\ee?\1b\9aIg\9b,|\bc\97\a8P\d9\f5\d1\ee?\11\ac\c2`\edcC<-\89a`\08\ce\ee?\efd\06;\tf\96<W\00\1d\edA\ca\ee?y\03\a1\da\e1\ccn<\d0<\c1\b5\a2\c6\ee?0\12\0f?\8e\ff\93<\de\d3\d7\f0*\c3\ee?\b0\afz\bb\ce\90v<\'*6\d5\da\bf\ee?w\e0T\eb\bd\1d\93<\r\dd\fd\99\b2\bc\ee?\8e\a3q\004\94\8f\bc\a7,\9dv\b2\b9\ee?I\a3\93\dc\cc\de\87\bcBf\cf\a2\da\b6\ee?_8\0f\bd\c6\dex\bc\82O\9dV+\b4\ee?\f6\\{\ecF\12\86\bc\0f\92]\ca\a4\b1\ee?\8e\d7\fd\18\055\93<\da\'\b56G\af\ee?\05\9b\8a/\b7\98{<\fd\c7\97\d4\12\ad\ee?\tT\1c\e2\e1c\90<)TH\dd\07\ab\ee?\ea\c6\19P\85\c74<\b7FY\8a&\a9\ee?5\c0d+\e62\94<H!\ad\15o\a7\ee?\9fv\99aJ\e4\8c\bc\t\dcv\b9\e1\a5\ee?\a8M\ef;\c53\8c\bc\85U:\b0~\a4\ee?\ae\e9+\89xS\84\bc \c3\cc4F\a3\ee?XXVx\dd\ce\93\bc%\"U\828\a2\ee?d\19~\80\aa\10W<s\a9L\d4U\a1\ee?(\"^\bf\ef\b3\93\bc\cd;\7ff\9e\a0\ee?\82\b94\87\ad\12j\bc\bf\da\0bu\12\a0\ee?\ee\a9m\b8\efgc\bc/\1ae<\b2\9f\ee?Q\88\e0T=\dc\80\bc\84\94Q\f9}\9f\ee?\cf>Z~d\1fx\bct_\ec\e8u\9f\ee?\b0}\8b\c0J\ee\86\bct\81\a5H\9a\9f\ee?\8a\e6U\1e2\19\86\bc\c9gBV\eb\9f\ee?\d3\d4\t^\cb\9c\90<?]\deOi\a0\ee?\1d\a5M\b9\dc2{\bc\87\01\ebs\14\a1\ee?k\c0gT\fd\ec\94<2\c10\01\ed\a1\ee?Ul\d6\ab\e1\ebe<bN\cf6\f3\a2\ee?B\cf\b3/\c5\a1\88\bc\12\1a>T\'\a4\ee?47;\f1\b6i\93\bc\13\ceL\99\89\a5\ee?\1e\ff\19:\84^\80\bc\ad\c7#F\1a\a7\ee?nWr\d8P\d4\94\bc\ed\92D\9b\d9\a8\ee?\00\8a\0e[g\ad\90<\99f\8a\d9\c7\aa\ee?\b4\ea\f0\c1/\b7\8d<\db\a0*B\e5\ac\ee?\ff\e7\c5\9c`\b6e\bc\8cD\b5\162\af\ee?D_\f3Y\83\f6{<6w\15\99\ae\b1\ee?\83=\1e\a7\1f\t\93\bc\c6\ff\91\0b[\b4\ee?)\1el\8b\b8\a9]\bc\e5\c5\cd\b07\b7\ee?Y\b9\90|\f9#l\bc\0fR\c8\cbD\ba\ee?\aa\f9\f4\"CC\92\bcPN\de\9f\82\bd\ee?K\8ef\d7l\ca\85\bc\ba\07\cap\f1\c0\ee?\'\ce\91+\fc\afq<\90\f0\a3\82\91\c4\ee?\bbs\n\e15\d2m<##\e3\19c\c8\ee?c\"b\"\04\c5\87\bce\e5]{f\cc\ee?\d51\e2\e3\86\1c\8b<3-J\ec\9b\d0\ee?\15\bb\bc\d3\d1\bb\91\bc]%>\b2\03\d5\ee?\d21\ee\9c1\cc\90<X\b30\13\9e\d9\ee?\b3Zsn\84i\84<\bf\fdyUk\de\ee?\b4\9d\8e\97\cd\df\82\bcz\f3\d3\bfk\e3\ee?\873\cb\92w\1a\8c<\ad\d3Z\99\9f\e8\ee?\fa\d9\d1J\8f{\90\bcf\b6\8d)\07\ee\ee?\ba\ae\dcV\d9\c3U\bc\fb\15O\b8\a2\f3\ee?@\f6\a6=\0e\a4\90\bc:Y\e5\8dr\f9\ee?4\93\ad8\f4\d6h\bcG^\fb\f2v\ff\ee?5\8aXk\e2\ee\91\bcJ\06\a10\b0\05\ef?\cd\dd_\n\d7\fft<\d2\c1K\90\1e\0c\ef?\ac\98\92\fa\fb\bd\91\bc\t\1e\d7[\c2\12\ef?\b3\0c\af0\aens<\9cR\85\dd\9b\19\ef?\94\fd\9f\\2\e3\8e<z\d0\ff_\ab \ef?\acY\t\d1\8f\e0\84<K\d1W.\f1\'\ef?g\1aN8\af\cdc<\b5\e7\06\94m/\ef?h\19\92l,kg<i\90\ef\dc 7\ef?\d2\b5\cc\83\18\8a\80\bc\fa\c3]U\0b?\ef?o\fa\ff?]\ad\8f\bc|\89\07J-G\ef?I\a9u8\ae\r\90\bc\f2\89\r\08\87O\ef?\a7\07=\a6\85\a3t<\87\a4\fb\dc\18X\ef?\0f\"@ \9e\91\82\bc\98\83\c9\16\e3`\ef?\ac\92\c1\d5PZ\8e<\852\db\03\e6i\ef?Kk\01\acY:\84<`\b4\01\f3!s\ef?\1f>\b4\07!\d5\82\bc_\9b{3\97|\ef?\c9\rG;\b9*\89\bc)\a1\f5\14F\86\ef?\d3\88:`\04\b6t<\f6?\8b\e7.\90\ef?qr\9dQ\ec\c5\83<\83L\c7\fbQ\9a\ef?\f0\91\d3\8f\12\f7\8f\bc\da\90\a4\a2\af\a4\ef?}t#\e2\98\ae\8d\bc\f1g\8e-H\af\ef?\08 \aaA\bc\c3\8e<\'Za\ee\1b\ba\ef?2\eb\a9\c3\94+\84<\97\bak7+\c5\ef?\ee\85\d11\a9d\8a<@En[v\d0\ef?\ed\e3;\e4\ba7\8e\bc\14\be\9c\ad\fd\db\ef?\9d\cd\91M;\89w<\d8\90\9e\81\c1\e7\ef?\89\cc`A\c1\05S<\f1q\8f+\c2\f3\ef?")
 (data $6 (i32.const 7472) "n\83\f9\a2\00\00\00\00\d1W\'\fc)\15DN\99\95b\db\c0\dd4\f5\abcQ\feA\90C<:n$\b7a\c5\bb\de\ea.I\06\e0\d2MB\1c\eb\1d\fe\1c\92\d1\t\f55\82\e8>\a7)\b1&p\9c\e9\84D\bb.9\d6\919A~_\b4\8b_\84\9c\f49S\83\ff\97\f8\1f;(\f9\bd\8b\11/\ef\0f\98\05\de\cf~6m\1fm\nZf?FO\b7\t\cb\'\c7\ba\'u-\ea_\9e\f79\07={\f1\e5\eb\b1_\fbk\ea\92R\8aF0\03V\08]\8d\1f \bc\cf\f0\abk{\fca\91\e3\a9\1d6\f4\9a_\85\99e\08\1b\e6^\80\d8\ff\8d@h\a0\14W\15\06\061\'sM")
 (data $7 (i32.const 7676) "l\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00N\00\00\00T\00o\00t\00a\00l\00 \00r\00e\00s\00i\00s\00t\00a\00n\00c\00e\00 \00s\00h\00o\00u\00l\00d\00 \00b\00e\00 \00n\00o\00n\00-\00n\00e\00g\00a\00t\00i\00v\00e\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $8 (i32.const 7788) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\"\00\00\00a\00s\00s\00e\00m\00b\00l\00y\00/\00i\00n\00d\00e\00x\00.\00t\00s\00\00\00\00\00\00\00\00\00\00\00")
 (data $9 (i32.const 7852) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00(\00\00\00A\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e\00\00\00\00\00")
 (data $10 (i32.const 7916) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00s\00t\00u\00b\00.\00t\00s\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $11 (i32.const 7980) ",\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\1c\00\00\00I\00n\00v\00a\00l\00i\00d\00 \00l\00e\00n\00g\00t\00h\00")
 (data $12 (i32.const 8028) "L\00\00\00\00\00\00\00\00\00\00\00\01\00\00\000\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $13 (i32.const 8108) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\"\00\00\00m\00a\00s\00s\00S\00u\00r\00g\00e\00 \00i\00n\00v\00a\00l\00i\00d\00\00\00\00\00\00\00\00\00\00\00")
 (data $14 (i32.const 8172) "L\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00.\00\00\00t\00o\00t\00a\00l\00R\00e\00s\00i\00s\00t\00a\00n\00c\00e\00 \00i\00n\00v\00a\00l\00i\00d\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $15 (i32.const 8252) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00$\00\00\00r\00u\00d\00d\00e\00r\00D\00r\00a\00g\00 \00i\00n\00v\00a\00l\00i\00d\00\00\00\00\00\00\00\00\00")
 (data $16 (i32.const 8316) "L\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00.\00\00\00p\00r\00o\00p\00u\00l\00s\00i\00o\00n\00F\00o\00r\00c\00e\00 \00i\00n\00v\00a\00l\00i\00d\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $17 (i32.const 8396) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\"\00\00\00w\00i\00n\00d\00S\00u\00r\00g\00e\00 \00i\00n\00v\00a\00l\00i\00d\00\00\00\00\00\00\00\00\00\00\00")
 (data $18 (i32.const 8460) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00(\00\00\00c\00u\00r\00r\00e\00n\00t\00S\00u\00r\00g\00e\00 \00i\00n\00v\00a\00l\00i\00d\00\00\00\00\00")
 (data $19 (i32.const 8524) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\"\00\00\00w\00a\00v\00e\00S\00u\00r\00g\00e\00 \00i\00n\00v\00a\00l\00i\00d\00\00\00\00\00\00\00\00\00\00\00")
 (data $20 (i32.const 8588) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00*\00\00\00n\00e\00t\00F\00o\00r\00c\00e\00S\00u\00r\00g\00e\00 \00i\00n\00v\00a\00l\00i\00d\00\00\00")
 (data $21 (i32.const 8652) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00 \00\00\00s\00u\00r\00g\00e\00D\00o\00t\00 \00i\00n\00v\00a\00l\00i\00d\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $22 (i32.const 8716) "L\00\00\00\00\00\00\00\00\00\00\00\02\00\00\002\00\00\00V\00e\00s\00s\00e\00l\00 \00u\00 \00v\00e\00l\00o\00c\00i\00t\00y\00 \00i\00n\00v\00a\00l\00i\00d\00\00\00\00\00\00\00\00\00\00\00")
 (data $23 (i32.const 8796) "l\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00X\00\00\00I\00n\00v\00a\00l\00i\00d\00 \00i\00n\00p\00u\00t\00 \00v\00a\00l\00u\00e\00s\00 \00f\00o\00r\00 \00p\00o\00s\00i\00t\00i\00o\00n\00 \00o\00r\00 \00a\00n\00g\00l\00e\00s\00.\00\00\00\00\00")
 (table $0 1 funcref)
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
 (export "getVesselSurgeVelocity" (func $assembly/index/getVesselSurgeVelocity))
 (export "getVesselSwayVelocity" (func $assembly/index/getVesselSwayVelocity))
 (export "getVesselHeaveVelocity" (func $assembly/index/getVesselHeaveVelocity))
 (export "getVesselRudderAngle" (func $assembly/index/getVesselRudderAngle))
 (export "getVesselBallastLevel" (func $assembly/index/getVesselBallastLevel))
 (export "setVesselVelocity" (func $assembly/index/setVesselVelocity))
 (export "resetGlobalVessel" (func $assembly/index/resetGlobalVessel))
 (export "memory" (memory $0))
 (export "table" (table $0))
 (start $~start)
 (func $assembly/index/calculateWaveFrequency (param $0 f64) (result f64)
  f64.const 6.283185307179586
  local.get $0
  f64.const 1.6
  f64.mul
  f64.const 3
  f64.add
  f64.div
 )
 (func $~lib/array/Array<f64>#__get (param $0 i32) (param $1 i32) (result f64)
  local.get $1
  local.get $0
  i32.load offset=12
  i32.ge_u
  if
   i32.const 1232
   i32.const 1296
   i32.const 114
   i32.const 42
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.load offset=4
  local.get $1
  i32.const 3
  i32.shl
  i32.add
  f64.load
 )
 (func $assembly/index/getWaveHeightForSeaState (param $0 f64) (result f64)
  i32.const 1184
  local.get $0
  f64.floor
  f64.const 0
  f64.max
  f64.const 12
  f64.min
  i32.trunc_sat_f64_s
  call $~lib/array/Array<f64>#__get
 )
 (func $assembly/index/calculateBeaufortScale (param $0 f64) (result i32)
  local.get $0
  f64.const 0.5
  f64.lt
  if
   i32.const 0
   return
  end
  local.get $0
  f64.const 1.5
  f64.lt
  if
   i32.const 1
   return
  end
  local.get $0
  f64.const 3.3
  f64.lt
  if
   i32.const 2
   return
  end
  local.get $0
  f64.const 5.5
  f64.lt
  if
   i32.const 3
   return
  end
  local.get $0
  f64.const 8
  f64.lt
  if
   i32.const 4
   return
  end
  local.get $0
  f64.const 10.8
  f64.lt
  if
   i32.const 5
   return
  end
  local.get $0
  f64.const 13.9
  f64.lt
  if
   i32.const 6
   return
  end
  local.get $0
  f64.const 17.2
  f64.lt
  if
   i32.const 7
   return
  end
  local.get $0
  f64.const 20.8
  f64.lt
  if
   i32.const 8
   return
  end
  local.get $0
  f64.const 24.5
  f64.lt
  if
   i32.const 9
   return
  end
  local.get $0
  f64.const 28.5
  f64.lt
  if
   i32.const 10
   return
  end
  local.get $0
  f64.const 32.7
  f64.lt
  if
   i32.const 11
   return
  end
  i32.const 12
 )
 (func $~lib/math/NativeMath.pow (param $0 f64) (param $1 f64) (result f64)
  (local $2 i64)
  (local $3 i32)
  (local $4 i32)
  (local $5 i64)
  (local $6 i64)
  (local $7 f64)
  (local $8 f64)
  (local $9 f64)
  (local $10 f64)
  (local $11 i64)
  (local $12 i64)
  (local $13 f64)
  (local $14 f64)
  (local $15 f64)
  (local $16 f64)
  (local $17 f64)
  (local $18 i32)
  local.get $1
  f64.abs
  f64.const 2
  f64.le
  if
   local.get $1
   f64.const 2
   f64.eq
   if
    local.get $0
    local.get $0
    f64.mul
    return
   end
   local.get $1
   f64.const 0.5
   f64.eq
   if
    local.get $0
    f64.sqrt
    f64.abs
    f64.const inf
    local.get $0
    f64.const -inf
    f64.ne
    select
    return
   end
   local.get $1
   f64.const -1
   f64.eq
   if
    f64.const 1
    local.get $0
    f64.div
    return
   end
   local.get $1
   f64.const 1
   f64.eq
   if
    local.get $0
    return
   end
   local.get $1
   f64.const 0
   f64.eq
   if
    f64.const 1
    return
   end
  end
  block $~lib/util/math/pow_lut|inlined.0 (result f64)
   local.get $1
   i64.reinterpret_f64
   local.tee $11
   i64.const 52
   i64.shr_u
   local.set $6
   local.get $0
   i64.reinterpret_f64
   local.tee $2
   i64.const 52
   i64.shr_u
   local.tee $5
   i64.const 1
   i64.sub
   i64.const 2046
   i64.ge_u
   if (result i32)
    i32.const 1
   else
    local.get $6
    i64.const 2047
    i64.and
    i64.const 958
    i64.sub
    i64.const 128
    i64.ge_u
   end
   if
    local.get $11
    i64.const 1
    i64.shl
    local.tee $12
    i64.const 1
    i64.sub
    i64.const -9007199254740993
    i64.ge_u
    if
     f64.const 1
     local.get $12
     i64.eqz
     br_if $~lib/util/math/pow_lut|inlined.0
     drop
     f64.const nan:0x8000000000000
     local.get $2
     i64.const 4607182418800017408
     i64.eq
     br_if $~lib/util/math/pow_lut|inlined.0
     drop
     local.get $0
     local.get $1
     f64.add
     local.get $12
     i64.const -9007199254740992
     i64.gt_u
     local.get $2
     i64.const 1
     i64.shl
     local.tee $2
     i64.const -9007199254740992
     i64.gt_u
     i32.or
     br_if $~lib/util/math/pow_lut|inlined.0
     drop
     f64.const nan:0x8000000000000
     local.get $2
     i64.const 9214364837600034816
     i64.eq
     br_if $~lib/util/math/pow_lut|inlined.0
     drop
     f64.const 0
     local.get $11
     i64.const 63
     i64.shr_u
     i64.eqz
     local.get $2
     i64.const 9214364837600034816
     i64.lt_u
     i32.eq
     br_if $~lib/util/math/pow_lut|inlined.0
     drop
     local.get $1
     local.get $1
     f64.mul
     br $~lib/util/math/pow_lut|inlined.0
    end
    local.get $2
    i64.const 1
    i64.shl
    i64.const 1
    i64.sub
    i64.const -9007199254740993
    i64.ge_u
    if
     f64.const 1
     local.get $0
     local.get $0
     f64.mul
     local.tee $0
     f64.neg
     local.get $0
     local.get $2
     i64.const 63
     i64.shr_u
     i32.wrap_i64
     if (result i32)
      block $~lib/util/math/checkint|inlined.0 (result i32)
       i32.const 0
       local.get $11
       i64.const 52
       i64.shr_u
       i64.const 2047
       i64.and
       local.tee $2
       i64.const 1023
       i64.lt_u
       br_if $~lib/util/math/checkint|inlined.0
       drop
       i32.const 2
       local.get $2
       i64.const 1075
       i64.gt_u
       br_if $~lib/util/math/checkint|inlined.0
       drop
       i32.const 0
       local.get $11
       i64.const 1
       i64.const 1075
       local.get $2
       i64.sub
       i64.shl
       local.tee $2
       i64.const 1
       i64.sub
       i64.and
       i64.const 0
       i64.ne
       br_if $~lib/util/math/checkint|inlined.0
       drop
       i32.const 1
       local.get $2
       local.get $11
       i64.and
       i64.const 0
       i64.ne
       br_if $~lib/util/math/checkint|inlined.0
       drop
       i32.const 2
      end
      i32.const 1
      i32.eq
     else
      i32.const 0
     end
     select
     local.tee $0
     f64.div
     local.get $0
     local.get $11
     i64.const 0
     i64.lt_s
     select
     br $~lib/util/math/pow_lut|inlined.0
    end
    local.get $2
    i64.const 0
    i64.lt_s
    if
     block $~lib/util/math/checkint|inlined.1 (result i32)
      i32.const 0
      local.get $11
      i64.const 52
      i64.shr_u
      i64.const 2047
      i64.and
      local.tee $12
      i64.const 1023
      i64.lt_u
      br_if $~lib/util/math/checkint|inlined.1
      drop
      i32.const 2
      local.get $12
      i64.const 1075
      i64.gt_u
      br_if $~lib/util/math/checkint|inlined.1
      drop
      i32.const 0
      local.get $11
      i64.const 1
      i64.const 1075
      local.get $12
      i64.sub
      i64.shl
      local.tee $12
      i64.const 1
      i64.sub
      i64.and
      i64.const 0
      i64.ne
      br_if $~lib/util/math/checkint|inlined.1
      drop
      i32.const 1
      local.get $11
      local.get $12
      i64.and
      i64.const 0
      i64.ne
      br_if $~lib/util/math/checkint|inlined.1
      drop
      i32.const 2
     end
     local.tee $3
     i32.eqz
     if
      local.get $0
      local.get $0
      f64.sub
      local.tee $0
      local.get $0
      f64.div
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $5
     i64.const 2047
     i64.and
     local.set $5
     i32.const 262144
     i32.const 0
     local.get $3
     i32.const 1
     i32.eq
     select
     local.set $4
     local.get $2
     i64.const 9223372036854775807
     i64.and
     local.set $2
    end
    local.get $6
    i64.const 2047
    i64.and
    local.tee $12
    i64.const 958
    i64.sub
    i64.const 128
    i64.ge_u
    if
     f64.const 1
     local.get $2
     i64.const 4607182418800017408
     i64.eq
     br_if $~lib/util/math/pow_lut|inlined.0
     drop
     f64.const 1
     local.get $12
     i64.const 958
     i64.lt_u
     br_if $~lib/util/math/pow_lut|inlined.0
     drop
     f64.const inf
     f64.const 0
     local.get $6
     i64.const 2048
     i64.lt_u
     local.get $2
     i64.const 4607182418800017408
     i64.gt_u
     i32.eq
     select
     br $~lib/util/math/pow_lut|inlined.0
    end
    local.get $5
    i64.eqz
    if
     local.get $0
     f64.const 4503599627370496
     f64.mul
     i64.reinterpret_f64
     i64.const 9223372036854775807
     i64.and
     i64.const 234187180623265792
     i64.sub
     local.set $2
    end
   end
   local.get $2
   local.get $2
   i64.const 4604531861337669632
   i64.sub
   local.tee $2
   i64.const -4503599627370496
   i64.and
   i64.sub
   local.tee $5
   i64.const 2147483648
   i64.add
   i64.const -4294967296
   i64.and
   f64.reinterpret_i64
   local.tee $7
   local.get $2
   i64.const 45
   i64.shr_u
   i64.const 127
   i64.and
   i32.wrap_i64
   i32.const 5
   i32.shl
   i32.const 1328
   i32.add
   local.tee $3
   f64.load
   local.tee $8
   f64.mul
   f64.const -1
   f64.add
   local.set $9
   local.get $2
   i64.const 52
   i64.shr_s
   f64.convert_i64_s
   local.tee $13
   f64.const 0.6931471805598903
   f64.mul
   local.get $3
   f64.load offset=16
   f64.add
   local.tee $0
   local.get $9
   local.get $5
   f64.reinterpret_i64
   local.get $7
   f64.sub
   local.get $8
   f64.mul
   local.tee $7
   f64.add
   local.tee $14
   f64.add
   local.set $15
   local.get $14
   local.get $14
   f64.const -0.5
   f64.mul
   local.tee $8
   f64.mul
   local.set $16
   local.get $15
   local.get $9
   local.get $9
   f64.const -0.5
   f64.mul
   local.tee $17
   f64.mul
   local.tee $9
   f64.add
   local.tee $10
   local.get $10
   local.get $13
   f64.const 5.497923018708371e-14
   f64.mul
   local.get $3
   f64.load offset=24
   f64.add
   local.get $0
   local.get $15
   f64.sub
   local.get $14
   f64.add
   f64.add
   local.get $7
   local.get $8
   local.get $17
   f64.add
   f64.mul
   f64.add
   local.get $15
   local.get $10
   f64.sub
   local.get $9
   f64.add
   f64.add
   local.get $14
   local.get $16
   f64.mul
   local.get $14
   f64.const 0.5000000000000007
   f64.mul
   f64.const -0.6666666666666679
   f64.add
   local.get $16
   local.get $14
   f64.const -0.6666666663487739
   f64.mul
   f64.const 0.7999999995323976
   f64.add
   local.get $16
   local.get $14
   f64.const 1.0000415263675542
   f64.mul
   f64.const -1.142909628459501
   f64.add
   f64.mul
   f64.add
   f64.mul
   f64.add
   f64.mul
   f64.add
   local.tee $0
   f64.add
   local.tee $7
   f64.sub
   local.get $0
   f64.add
   global.set $~lib/util/math/log_tail
   block $~lib/util/math/exp_inline|inlined.0 (result f64)
    local.get $11
    i64.const -134217728
    i64.and
    f64.reinterpret_i64
    local.tee $0
    local.get $7
    i64.reinterpret_f64
    i64.const -134217728
    i64.and
    f64.reinterpret_i64
    local.tee $8
    f64.mul
    local.tee $9
    i64.reinterpret_f64
    local.tee $2
    i64.const 52
    i64.shr_u
    i32.wrap_i64
    i32.const 2047
    i32.and
    local.tee $3
    i32.const 969
    i32.sub
    local.tee $18
    i32.const 63
    i32.ge_u
    if
     f64.const -1
     f64.const 1
     local.get $4
     select
     local.get $18
     i32.const -2147483648
     i32.ge_u
     br_if $~lib/util/math/exp_inline|inlined.0
     drop
     f64.const -0
     f64.const 0
     local.get $4
     select
     f64.const -inf
     f64.const inf
     local.get $4
     select
     local.get $2
     i64.const 0
     i64.lt_s
     select
     local.get $3
     i32.const 1033
     i32.ge_u
     br_if $~lib/util/math/exp_inline|inlined.0
     drop
     i32.const 0
     local.set $3
    end
    local.get $9
    f64.const 184.6649652337873
    f64.mul
    f64.const 6755399441055744
    f64.add
    local.tee $10
    i64.reinterpret_f64
    local.tee $2
    i64.const 127
    i64.and
    i64.const 1
    i64.shl
    i32.wrap_i64
    i32.const 3
    i32.shl
    i32.const 5424
    i32.add
    local.tee $18
    i64.load offset=8
    local.get $2
    local.get $4
    i64.extend_i32_u
    i64.add
    i64.const 45
    i64.shl
    i64.add
    local.set $5
    local.get $9
    local.get $10
    f64.const -6755399441055744
    f64.add
    local.tee $9
    f64.const -0.005415212348111709
    f64.mul
    f64.add
    local.get $9
    f64.const -1.2864023111638346e-14
    f64.mul
    f64.add
    local.get $1
    local.get $0
    f64.sub
    local.get $8
    f64.mul
    local.get $1
    local.get $7
    local.get $8
    f64.sub
    global.get $~lib/util/math/log_tail
    f64.add
    f64.mul
    f64.add
    f64.add
    local.tee $0
    local.get $0
    f64.mul
    local.set $1
    local.get $18
    f64.load
    local.get $0
    f64.add
    local.get $1
    local.get $0
    f64.const 0.16666666666665886
    f64.mul
    f64.const 0.49999999999996786
    f64.add
    f64.mul
    f64.add
    local.get $1
    local.get $1
    f64.mul
    local.get $0
    f64.const 0.008333335853059549
    f64.mul
    f64.const 0.0416666808410674
    f64.add
    f64.mul
    f64.add
    local.set $0
    local.get $3
    i32.eqz
    if
     block $~lib/util/math/specialcase|inlined.0 (result f64)
      local.get $2
      i64.const 2147483648
      i64.and
      i64.eqz
      if
       local.get $5
       i64.const 4544132024016830464
       i64.sub
       f64.reinterpret_i64
       local.tee $1
       local.get $1
       local.get $0
       f64.mul
       f64.add
       f64.const 5486124068793688683255936e279
       f64.mul
       br $~lib/util/math/specialcase|inlined.0
      end
      local.get $5
      i64.const 4602678819172646912
      i64.add
      local.tee $2
      f64.reinterpret_i64
      local.tee $1
      local.get $0
      f64.mul
      local.set $0
      local.get $1
      local.get $0
      f64.add
      local.tee $7
      f64.abs
      f64.const 1
      f64.lt
      if (result f64)
       f64.const 1
       local.get $7
       f64.copysign
       local.tee $8
       local.get $7
       f64.add
       local.tee $9
       local.get $8
       local.get $9
       f64.sub
       local.get $7
       f64.add
       local.get $1
       local.get $7
       f64.sub
       local.get $0
       f64.add
       f64.add
       f64.add
       local.get $8
       f64.sub
       local.tee $0
       f64.const 0
       f64.eq
       if (result f64)
        local.get $2
        i64.const -9223372036854775808
        i64.and
        f64.reinterpret_i64
       else
        local.get $0
       end
      else
       local.get $7
      end
      f64.const 2.2250738585072014e-308
      f64.mul
     end
     br $~lib/util/math/exp_inline|inlined.0
    end
    local.get $5
    f64.reinterpret_i64
    local.tee $1
    local.get $1
    local.get $0
    f64.mul
    f64.add
   end
  end
 )
 (func $assembly/index/calculateWaveLength (param $0 f64) (result f64)
  local.get $0
  f64.const 1.6
  f64.mul
  f64.const 3
  f64.add
  f64.const 2
  call $~lib/math/NativeMath.pow
  f64.const 1.5
  f64.mul
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
  i32.const 7472
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
 (func $assembly/index/calculateWaveHeightAtPosition (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (param $4 f64) (param $5 f64) (param $6 f64) (param $7 f64) (result f64)
  local.get $7
  f64.const 0.5
  f64.lt
  if
   f64.const 0
   return
  end
  local.get $3
  f64.const 0.5
  f64.mul
  f64.const 6.283185307179586
  local.get $4
  f64.div
  local.get $0
  local.get $6
  call $~lib/math/NativeMath.cos
  f64.mul
  local.get $1
  local.get $6
  call $~lib/math/NativeMath.sin
  f64.mul
  f64.add
  f64.mul
  local.get $5
  local.get $2
  f64.mul
  f64.sub
  call $~lib/math/NativeMath.sin
  f64.mul
 )
 (func $assembly/index/isInvalidInputValues (param $0 i32) (result i32)
  (local $1 f64)
  local.get $0
  f64.load
  local.tee $1
  local.get $1
  f64.sub
  f64.const 0
  f64.ne
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=8
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=16
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=48
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=56
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=64
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=72
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=80
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=88
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=32
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=40
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=24
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=112
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=120
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=128
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=136
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=144
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=152
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=160
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=168
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=176
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=184
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=192
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=200
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=208
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=216
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=224
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=232
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=240
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=248
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=256
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=264
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=272
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=280
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=288
   local.tee $1
   local.get $1
   f64.sub
   f64.const 0
   f64.ne
  end
 )
 (func $~lib/math/NativeMath.mod (param $0 f64) (result f64)
  (local $1 i64)
  (local $2 i64)
  (local $3 i64)
  (local $4 i64)
  local.get $0
  i64.reinterpret_f64
  local.tee $2
  i64.const 52
  i64.shr_u
  i64.const 2047
  i64.and
  local.tee $4
  i64.const 2047
  i64.eq
  if
   local.get $0
   f64.const 6.283185307179586
   f64.mul
   local.tee $0
   local.get $0
   f64.div
   return
  end
  local.get $2
  i64.const 1
  i64.shl
  local.tee $1
  i64.const -9209223561350718928
  i64.le_u
  if
   local.get $0
   local.get $1
   i64.const -9209223561350718928
   i64.ne
   f64.convert_i32_u
   f64.mul
   return
  end
  local.get $2
  i64.const 63
  i64.shr_u
  local.set $3
  local.get $4
  i64.eqz
  if (result i64)
   local.get $2
   i64.const 1
   local.get $4
   local.get $2
   i64.const 12
   i64.shl
   i64.clz
   i64.sub
   local.tee $4
   i64.sub
   i64.shl
  else
   local.get $2
   i64.const 4503599627370495
   i64.and
   i64.const 4503599627370496
   i64.or
  end
  local.set $1
  loop $while-continue|0
   local.get $4
   i64.const 1025
   i64.gt_s
   if
    local.get $1
    i64.const 7074237752028440
    i64.ge_u
    if (result i64)
     local.get $1
     i64.const 7074237752028440
     i64.eq
     if
      local.get $0
      f64.const 0
      f64.mul
      return
     end
     local.get $1
     i64.const 7074237752028440
     i64.sub
    else
     local.get $1
    end
    i64.const 1
    i64.shl
    local.set $1
    local.get $4
    i64.const 1
    i64.sub
    local.set $4
    br $while-continue|0
   end
  end
  local.get $1
  i64.const 7074237752028440
  i64.ge_u
  if
   local.get $1
   i64.const 7074237752028440
   i64.eq
   if
    local.get $0
    f64.const 0
    f64.mul
    return
   end
   local.get $1
   i64.const 7074237752028440
   i64.sub
   local.set $1
  end
  local.get $4
  local.get $1
  i64.const 11
  i64.shl
  i64.clz
  local.tee $2
  i64.sub
  local.set $4
  local.get $1
  local.get $2
  i64.shl
  local.set $1
  local.get $4
  i64.const 0
  i64.gt_s
  if (result i64)
   local.get $1
   i64.const 4503599627370496
   i64.sub
   local.get $4
   i64.const 52
   i64.shl
   i64.or
  else
   local.get $1
   i64.const 1
   local.get $4
   i64.sub
   i64.shr_u
  end
  local.get $3
  i64.const 63
  i64.shl
  i64.or
  f64.reinterpret_i64
 )
 (func $assembly/index/calculateRudderForceY (param $0 i32) (result f64)
  (local $1 f64)
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
  local.tee $1
  f64.const 0.01
  f64.lt
  if (result f64)
   f64.const 0
  else
   local.get $0
   f64.load offset=104
   f64.const 2.019595277307724
   f64.mul
   local.get $0
   f64.load offset=120
   f64.const 0.018
   f64.mul
   local.get $0
   f64.load offset=136
   f64.mul
   f64.mul
   f64.const 0.5
   f64.mul
   local.get $0
   f64.load offset=152
   f64.mul
   local.get $1
   f64.mul
   local.get $1
   f64.mul
  end
  local.get $0
  f64.load offset=104
  call $~lib/math/NativeMath.cos
  f64.mul
 )
 (func $~lib/rt/stub/__alloc (param $0 i32) (result i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  local.get $0
  i32.const 1073741820
  i32.gt_u
  if
   i32.const 7872
   i32.const 7936
   i32.const 33
   i32.const 29
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/rt/stub/offset
  local.set $1
  global.get $~lib/rt/stub/offset
  i32.const 4
  i32.add
  local.tee $2
  local.get $0
  i32.const 19
  i32.add
  i32.const -16
  i32.and
  i32.const 4
  i32.sub
  local.tee $0
  i32.add
  local.tee $3
  memory.size
  local.tee $4
  i32.const 16
  i32.shl
  i32.const 15
  i32.add
  i32.const -16
  i32.and
  local.tee $5
  i32.gt_u
  if
   local.get $4
   local.get $3
   local.get $5
   i32.sub
   i32.const 65535
   i32.add
   i32.const -65536
   i32.and
   i32.const 16
   i32.shr_u
   local.tee $5
   local.get $4
   local.get $5
   i32.gt_s
   select
   memory.grow
   i32.const 0
   i32.lt_s
   if
    local.get $5
    memory.grow
    i32.const 0
    i32.lt_s
    if
     unreachable
    end
   end
  end
  local.get $3
  global.set $~lib/rt/stub/offset
  local.get $1
  local.get $0
  i32.store
  local.get $2
 )
 (func $~lib/rt/stub/__new (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  local.get $0
  i32.const 1073741804
  i32.gt_u
  if
   i32.const 7872
   i32.const 7936
   i32.const 86
   i32.const 30
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.const 16
  i32.add
  call $~lib/rt/stub/__alloc
  local.tee $3
  i32.const 4
  i32.sub
  local.tee $2
  i32.const 0
  i32.store offset=4
  local.get $2
  i32.const 0
  i32.store offset=8
  local.get $2
  local.get $1
  i32.store offset=12
  local.get $2
  local.get $0
  i32.store offset=16
  local.get $3
  i32.const 16
  i32.add
 )
 (func $~lib/rt/__newArray (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  local.get $0
  i32.const 3
  i32.shl
  local.tee $3
  i32.const 1
  call $~lib/rt/stub/__new
  local.set $2
  local.get $1
  if
   local.get $2
   local.get $1
   local.get $3
   memory.copy
  end
  i32.const 16
  i32.const 4
  call $~lib/rt/stub/__new
  local.tee $1
  local.get $2
  i32.store
  local.get $1
  local.get $2
  i32.store offset=4
  local.get $1
  local.get $3
  i32.store offset=8
  local.get $1
  local.get $0
  i32.store offset=12
  local.get $1
 )
 (func $~lib/array/Array<f64>#__set (param $0 i32) (param $1 i32) (param $2 f64)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  (local $11 i32)
  local.get $1
  local.get $0
  i32.load offset=12
  i32.ge_u
  if
   local.get $1
   i32.const 0
   i32.lt_s
   if
    i32.const 1232
    i32.const 1296
    i32.const 130
    i32.const 22
    call $~lib/builtins/abort
    unreachable
   end
   local.get $1
   i32.const 1
   i32.add
   local.tee $5
   local.get $0
   i32.load offset=8
   local.tee $11
   i32.const 3
   i32.shr_u
   i32.gt_u
   if
    local.get $5
    i32.const 134217727
    i32.gt_u
    if
     i32.const 8000
     i32.const 1296
     i32.const 19
     i32.const 48
     call $~lib/builtins/abort
     unreachable
    end
    local.get $0
    i32.load
    local.set $10
    i32.const 1073741820
    local.get $11
    i32.const 1
    i32.shl
    local.tee $3
    local.get $3
    i32.const 1073741820
    i32.ge_u
    select
    local.tee $4
    i32.const 8
    local.get $5
    local.get $5
    i32.const 8
    i32.le_u
    select
    i32.const 3
    i32.shl
    local.tee $3
    local.get $3
    local.get $4
    i32.lt_u
    select
    local.tee $9
    i32.const 1073741804
    i32.gt_u
    if
     i32.const 7872
     i32.const 7936
     i32.const 99
     i32.const 30
     call $~lib/builtins/abort
     unreachable
    end
    local.get $10
    i32.const 16
    i32.sub
    local.tee $4
    i32.const 15
    i32.and
    i32.const 1
    local.get $4
    select
    if
     i32.const 0
     i32.const 7936
     i32.const 45
     i32.const 3
     call $~lib/builtins/abort
     unreachable
    end
    global.get $~lib/rt/stub/offset
    local.get $4
    i32.const 4
    i32.sub
    local.tee $8
    i32.load
    local.tee $6
    local.get $4
    i32.add
    i32.eq
    local.set $5
    local.get $9
    i32.const 16
    i32.add
    local.tee $3
    i32.const 19
    i32.add
    i32.const -16
    i32.and
    i32.const 4
    i32.sub
    local.set $7
    local.get $3
    local.get $6
    i32.gt_u
    if
     local.get $5
     if
      local.get $3
      i32.const 1073741820
      i32.gt_u
      if
       i32.const 7872
       i32.const 7936
       i32.const 52
       i32.const 33
       call $~lib/builtins/abort
       unreachable
      end
      local.get $4
      local.get $7
      i32.add
      local.tee $6
      memory.size
      local.tee $5
      i32.const 16
      i32.shl
      i32.const 15
      i32.add
      i32.const -16
      i32.and
      local.tee $3
      i32.gt_u
      if
       local.get $5
       local.get $6
       local.get $3
       i32.sub
       i32.const 65535
       i32.add
       i32.const -65536
       i32.and
       i32.const 16
       i32.shr_u
       local.tee $3
       local.get $3
       local.get $5
       i32.lt_s
       select
       memory.grow
       i32.const 0
       i32.lt_s
       if
        local.get $3
        memory.grow
        i32.const 0
        i32.lt_s
        if
         unreachable
        end
       end
      end
      local.get $6
      global.set $~lib/rt/stub/offset
      local.get $8
      local.get $7
      i32.store
     else
      local.get $7
      local.get $6
      i32.const 1
      i32.shl
      local.tee $3
      local.get $3
      local.get $7
      i32.lt_u
      select
      call $~lib/rt/stub/__alloc
      local.tee $3
      local.get $4
      local.get $6
      memory.copy
      local.get $3
      local.set $4
     end
    else
     local.get $5
     if
      local.get $4
      local.get $7
      i32.add
      global.set $~lib/rt/stub/offset
      local.get $8
      local.get $7
      i32.store
     end
    end
    local.get $4
    i32.const 4
    i32.sub
    local.get $9
    i32.store offset=16
    local.get $4
    i32.const 16
    i32.add
    local.tee $3
    local.get $11
    i32.add
    i32.const 0
    local.get $9
    local.get $11
    i32.sub
    memory.fill
    local.get $3
    local.get $10
    i32.ne
    if
     local.get $0
     local.get $3
     i32.store
     local.get $0
     local.get $3
     i32.store offset=4
    end
    local.get $0
    local.get $9
    i32.store offset=8
   end
   local.get $0
   local.get $1
   i32.const 1
   i32.add
   i32.store offset=12
  end
  local.get $0
  i32.load offset=4
  local.get $1
  i32.const 3
  i32.shl
  i32.add
  local.get $2
  f64.store
 )
 (func $assembly/index/calculateWaveForce (param $0 i32) (param $1 i32) (param $2 f64) (result i32)
  (local $3 f64)
  (local $4 f64)
  (local $5 f64)
  (local $6 f64)
  (local $7 f64)
  (local $8 f64)
  local.get $1
  f64.convert_i32_s
  f64.const 0.5
  f64.lt
  if
   i32.const 6
   i32.const 8048
   call $~lib/rt/__newArray
   return
  end
  i32.const 1184
  local.get $1
  f64.convert_i32_s
  local.tee $3
  f64.floor
  f64.const 0
  f64.max
  f64.const 12
  f64.min
  i32.trunc_sat_f64_s
  call $~lib/array/Array<f64>#__get
  local.set $4
  local.get $3
  f64.const 1.6
  f64.mul
  f64.const 3
  f64.add
  local.tee $3
  f64.const 2
  call $~lib/math/NativeMath.pow
  f64.const 1.5
  f64.mul
  local.set $5
  local.get $0
  local.get $4
  f64.store offset=264
  local.get $0
  f64.const 6.283185307179586
  local.get $3
  f64.div
  local.tee $3
  f64.store offset=280
  local.get $0
  f64.load offset=272
  call $~lib/math/NativeMath.cos
  local.set $6
  local.get $0
  f64.load offset=272
  call $~lib/math/NativeMath.sin
  local.set $7
  local.get $0
  f64.const 6.283185307179586
  local.get $5
  f64.div
  local.get $0
  f64.load
  local.get $6
  f64.mul
  local.get $0
  f64.load offset=8
  local.get $7
  f64.mul
  f64.add
  f64.mul
  local.get $3
  local.get $2
  f64.mul
  f64.sub
  f64.store offset=288
  local.get $0
  f64.load offset=272
  local.get $0
  f64.load offset=24
  f64.sub
  local.tee $2
  call $~lib/math/NativeMath.cos
  f64.abs
  local.set $3
  local.get $2
  call $~lib/math/NativeMath.sin
  f64.abs
  local.set $5
  local.get $0
  f64.load offset=152
  f64.const 9.81
  f64.mul
  local.get $4
  f64.const 2
  call $~lib/math/NativeMath.pow
  f64.mul
  local.get $0
  f64.load offset=128
  f64.mul
  local.tee $4
  local.get $3
  f64.mul
  f64.const 0.5
  f64.mul
  local.set $3
  local.get $4
  f64.const 1.2
  f64.mul
  local.get $0
  f64.load offset=288
  call $~lib/math/NativeMath.sin
  f64.const 0
  f64.max
  f64.mul
  local.set $6
  local.get $4
  local.get $5
  f64.mul
  f64.const 0.7
  f64.mul
  local.tee $5
  local.get $0
  f64.load offset=136
  f64.mul
  f64.const 0.6
  f64.mul
  local.get $0
  f64.load offset=288
  call $~lib/math/NativeMath.sin
  f64.mul
  local.set $7
  local.get $3
  local.get $0
  f64.load offset=120
  f64.mul
  f64.const 0.1
  f64.mul
  local.get $0
  f64.load offset=288
  call $~lib/math/NativeMath.sin
  f64.mul
  local.set $8
  local.get $4
  local.get $2
  local.get $2
  f64.add
  call $~lib/math/NativeMath.sin
  f64.mul
  f64.const 0.05
  f64.mul
  local.set $4
  i32.const 6
  i32.const 0
  call $~lib/rt/__newArray
  local.tee $0
  i32.load offset=4
  drop
  local.get $0
  i32.const 0
  local.get $3
  f64.const 1
  f64.const -1
  local.get $2
  call $~lib/math/NativeMath.cos
  local.tee $3
  local.get $3
  f64.const 0
  f64.lt
  select
  local.get $3
  f64.const 0
  f64.gt
  select
  f64.mul
  call $~lib/array/Array<f64>#__set
  local.get $0
  i32.const 1
  local.get $5
  f64.const 1
  f64.const -1
  local.get $2
  call $~lib/math/NativeMath.sin
  local.tee $2
  local.get $2
  f64.const 0
  f64.lt
  select
  local.get $2
  f64.const 0
  f64.gt
  select
  f64.mul
  call $~lib/array/Array<f64>#__set
  local.get $0
  i32.const 2
  local.get $6
  call $~lib/array/Array<f64>#__set
  local.get $0
  i32.const 3
  local.get $7
  call $~lib/array/Array<f64>#__set
  local.get $0
  i32.const 4
  local.get $8
  call $~lib/array/Array<f64>#__set
  local.get $0
  i32.const 5
  local.get $4
  call $~lib/array/Array<f64>#__set
  local.get $0
 )
 (func $assembly/index/calculateCenterOfGravity (param $0 i32)
  (local $1 f64)
  (local $2 f64)
  (local $3 f64)
  (local $4 f64)
  (local $5 f64)
  (local $6 f64)
  (local $7 f64)
  (local $8 f64)
  local.get $0
  f64.load offset=136
  local.tee $8
  f64.const 0.5
  f64.mul
  local.set $3
  local.get $0
  f64.load offset=120
  f64.const -0.2
  f64.mul
  local.set $4
  local.get $0
  f64.load offset=112
  local.tee $5
  f64.const 0.7
  f64.mul
  local.tee $1
  local.get $5
  f64.const 0.1
  f64.mul
  local.get $0
  f64.load offset=248
  f64.mul
  local.tee $2
  f64.add
  local.get $5
  f64.const 0.2
  f64.mul
  local.get $0
  f64.load offset=256
  f64.mul
  local.tee $5
  f64.add
  local.tee $7
  f64.const 0
  f64.eq
  local.get $7
  local.get $7
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  if
   local.get $0
   f64.const 0
   f64.store offset=192
   local.get $0
   f64.const 0
   f64.store offset=200
   local.get $0
   local.get $0
   f64.load offset=136
   f64.const 0.5
   f64.mul
   f64.store offset=208
   local.get $0
   f64.const 1
   f64.store offset=112
   return
  end
  local.get $0
  local.get $1
  f64.const 0
  f64.mul
  local.tee $6
  local.get $2
  local.get $4
  f64.mul
  f64.add
  local.get $7
  f64.div
  f64.store offset=192
  local.get $0
  local.get $6
  local.get $7
  f64.div
  f64.store offset=200
  local.get $0
  local.get $1
  local.get $3
  f64.mul
  local.get $2
  local.get $8
  f64.const 0.3
  f64.mul
  f64.mul
  f64.add
  local.get $5
  local.get $8
  f64.const 0.1
  f64.mul
  f64.mul
  f64.add
  local.get $7
  f64.div
  f64.store offset=208
  local.get $0
  local.get $7
  f64.store offset=112
 )
 (func $assembly/index/calculateGM (param $0 i32) (result f64)
  (local $1 f64)
  local.get $0
  call $assembly/index/calculateCenterOfGravity
  local.get $0
  f64.load offset=136
  local.get $0
  f64.load offset=120
  local.get $0
  f64.load offset=128
  local.tee $1
  f64.mul
  local.get $1
  f64.mul
  local.get $1
  f64.mul
  f64.const 12
  f64.div
  local.get $0
  f64.load offset=152
  local.get $0
  f64.load offset=216
  f64.mul
  f64.div
  f64.add
  local.get $0
  f64.load offset=208
  f64.sub
 )
 (func $assembly/index/updateVesselState (param $0 i32) (param $1 f64) (param $2 f64) (param $3 f64) (param $4 f64) (param $5 f64) (result i32)
  (local $6 i32)
  (local $7 i64)
  (local $8 i32)
  (local $9 f64)
  (local $10 i32)
  (local $11 f64)
  (local $12 f64)
  (local $13 f64)
  (local $14 f64)
  (local $15 f64)
  (local $16 f64)
  (local $17 f64)
  (local $18 f64)
  (local $19 i32)
  (local $20 i64)
  (local $21 f64)
  (local $22 f64)
  (local $23 f64)
  (local $24 f64)
  (local $25 f64)
  (local $26 f64)
  (local $27 f64)
  (local $28 f64)
  (local $29 f64)
  (local $30 f64)
  (local $31 f64)
  (local $32 f64)
  local.get $0
  call $assembly/index/isInvalidInputValues
  if
   local.get $0
   return
  end
  local.get $0
  f64.load offset=248
  local.tee $9
  local.get $9
  f64.sub
  f64.const 0
  f64.ne
  if
   local.get $0
   f64.const 1
   f64.store offset=248
  end
  local.get $0
  f64.load offset=176
  local.tee $9
  local.get $9
  f64.sub
  f64.const 0
  f64.ne
  if
   local.get $0
   f64.const 0
   f64.store offset=176
  end
  local.get $0
  f64.load offset=96
  drop
  local.get $0
  f64.load offset=160
  drop
  local.get $0
  f64.load offset=168
  drop
  local.get $1
  local.get $1
  f64.sub
  f64.const 0
  f64.eq
  local.tee $6
  if
   local.get $1
   f64.const 0
   f64.gt
   local.set $6
  end
  local.get $0
  f64.load offset=48
  local.tee $9
  local.get $9
  f64.sub
  f64.const 0
  f64.eq
  local.tee $10
  if (result i32)
   local.get $0
   f64.load offset=56
   local.tee $9
   local.get $9
   f64.sub
   f64.const 0
   f64.eq
  else
   local.get $10
  end
  i32.eqz
  local.get $6
  i32.eqz
  i32.or
  if
   local.get $0
   return
  end
  local.get $1
  f64.const 1
  f64.min
  local.set $9
  local.get $2
  f64.const 0
  f64.max
  f64.const 50
  f64.min
  f64.const 0
  local.get $2
  local.get $2
  f64.sub
  f64.const 0
  f64.eq
  select
  local.set $2
  local.get $3
  local.get $3
  f64.sub
  f64.const 0
  f64.eq
  if (result f64)
   local.get $3
   call $~lib/math/NativeMath.mod
  else
   f64.const 0
  end
  local.set $12
  local.get $5
  local.get $5
  f64.sub
  f64.const 0
  f64.eq
  if (result f64)
   local.get $5
   call $~lib/math/NativeMath.mod
  else
   f64.const 0
  end
  local.set $13
  local.get $2
  call $assembly/index/calculateBeaufortScale
  local.set $19
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
  local.tee $1
  f64.const 0.01
  f64.lt
  if (result f64)
   f64.const 0
  else
   local.get $0
   f64.load offset=120
   local.tee $3
   local.get $0
   f64.load offset=136
   f64.const 2
   f64.mul
   local.get $0
   f64.load offset=128
   f64.add
   f64.mul
   local.get $0
   f64.load offset=144
   f64.sqrt
   f64.mul
   f64.const 0.8
   f64.mul
   local.set $5
   f64.const 0.075
   block $__inlined_func$~lib/math/NativeMath.log10$4 (result f64)
    local.get $1
    local.get $3
    f64.mul
    f64.const 1.187e-06
    f64.div
    local.tee $3
    i64.reinterpret_f64
    local.tee $7
    i64.const 32
    i64.shr_u
    i32.wrap_i64
    local.tee $6
    i32.const 31
    i32.shr_u
    local.tee $10
    local.get $6
    i32.const 1048576
    i32.lt_u
    i32.or
    if
     f64.const -1
     local.get $3
     local.get $3
     f64.mul
     f64.div
     local.get $7
     i64.const 1
     i64.shl
     i64.eqz
     br_if $__inlined_func$~lib/math/NativeMath.log10$4
     drop
     local.get $3
     local.get $3
     f64.sub
     f64.const 0
     f64.div
     local.get $10
     br_if $__inlined_func$~lib/math/NativeMath.log10$4
     drop
     i32.const -54
     local.set $8
     local.get $3
     f64.const 18014398509481984
     f64.mul
     i64.reinterpret_f64
     local.tee $7
     i64.const 32
     i64.shr_u
     i32.wrap_i64
     local.set $6
    else
     local.get $6
     i32.const 2146435072
     i32.ge_u
     if
      local.get $3
      br $__inlined_func$~lib/math/NativeMath.log10$4
     else
      f64.const 0
      local.get $7
      i64.const 32
      i64.shl
      i64.eqz
      local.get $6
      i32.const 1072693248
      i32.eq
      i32.and
      br_if $__inlined_func$~lib/math/NativeMath.log10$4
      drop
     end
    end
    local.get $7
    i64.const 4294967295
    i64.and
    local.get $6
    i32.const 614242
    i32.add
    local.tee $6
    i32.const 1048575
    i32.and
    i32.const 1072079006
    i32.add
    i64.extend_i32_u
    i64.const 32
    i64.shl
    i64.or
    f64.reinterpret_i64
    f64.const -1
    f64.add
    local.tee $3
    f64.const 0.5
    f64.mul
    local.get $3
    f64.mul
    local.set $11
    local.get $3
    local.get $3
    f64.const 2
    f64.add
    f64.div
    local.tee $14
    local.get $14
    f64.mul
    local.tee $15
    local.get $15
    f64.mul
    local.set $16
    local.get $3
    local.get $3
    local.get $11
    f64.sub
    i64.reinterpret_f64
    i64.const -4294967296
    i64.and
    f64.reinterpret_i64
    local.tee $3
    f64.sub
    local.get $11
    f64.sub
    local.get $14
    local.get $11
    local.get $15
    local.get $16
    local.get $16
    local.get $16
    f64.const 0.14798198605116586
    f64.mul
    f64.const 0.1818357216161805
    f64.add
    f64.mul
    f64.const 0.2857142874366239
    f64.add
    f64.mul
    f64.const 0.6666666666666735
    f64.add
    f64.mul
    local.get $16
    local.get $16
    local.get $16
    f64.const 0.15313837699209373
    f64.mul
    f64.const 0.22222198432149784
    f64.add
    f64.mul
    f64.const 0.3999999999940942
    f64.add
    f64.mul
    f64.add
    f64.add
    f64.mul
    f64.add
    local.set $11
    local.get $8
    local.get $6
    i32.const 20
    i32.shr_u
    i32.const 1023
    i32.sub
    i32.add
    f64.convert_i32_s
    local.tee $14
    f64.const 0.30102999566361177
    f64.mul
    local.tee $15
    local.get $3
    f64.const 0.4342944818781689
    f64.mul
    local.tee $16
    f64.add
    local.set $17
    local.get $14
    f64.const 3.694239077158931e-13
    f64.mul
    local.get $11
    local.get $3
    f64.add
    f64.const 2.5082946711645275e-11
    f64.mul
    f64.add
    local.get $11
    f64.const 0.4342944818781689
    f64.mul
    f64.add
    local.get $15
    local.get $17
    f64.sub
    local.get $16
    f64.add
    f64.add
    local.get $17
    f64.add
   end
   f64.const -2
   f64.add
   f64.const 2
   call $~lib/math/NativeMath.pow
   f64.div
   local.set $3
   local.get $0
   f64.load offset=152
   f64.const 0.5
   f64.mul
   local.get $1
   f64.mul
   local.get $1
   f64.mul
   local.get $5
   f64.mul
   local.get $3
   f64.mul
   local.get $0
   f64.load offset=216
   f64.const 22231.05
   f64.mul
   local.get $1
   local.get $0
   f64.load offset=120
   f64.const 9.81
   f64.mul
   f64.sqrt
   f64.div
   local.tee $1
   f64.const 2
   call $~lib/math/NativeMath.pow
   f64.mul
   block $~lib/util/math/exp_lut|inlined.0 (result f64)
    f64.const -0.5
    local.get $1
    f64.const 0.15
    call $~lib/math/NativeMath.pow
    f64.div
    local.tee $1
    i64.reinterpret_f64
    local.tee $7
    i64.const 52
    i64.shr_u
    i32.wrap_i64
    i32.const 2047
    i32.and
    local.tee $6
    i32.const 969
    i32.sub
    local.tee $8
    i32.const 63
    i32.ge_u
    if
     f64.const 1
     local.get $8
     i32.const -2147483648
     i32.ge_u
     br_if $~lib/util/math/exp_lut|inlined.0
     drop
     local.get $6
     i32.const 1033
     i32.ge_u
     if
      f64.const 0
      local.get $7
      i64.const -4503599627370496
      i64.eq
      br_if $~lib/util/math/exp_lut|inlined.0
      drop
      local.get $1
      f64.const 1
      f64.add
      local.get $6
      i32.const 2047
      i32.ge_u
      br_if $~lib/util/math/exp_lut|inlined.0
      drop
      f64.const 0
      f64.const inf
      local.get $7
      i64.const 0
      i64.lt_s
      select
      br $~lib/util/math/exp_lut|inlined.0
     end
     i32.const 0
     local.set $6
    end
    local.get $1
    f64.const 184.6649652337873
    f64.mul
    f64.const 6755399441055744
    f64.add
    local.tee $3
    i64.reinterpret_f64
    local.tee $20
    i64.const 127
    i64.and
    i64.const 1
    i64.shl
    i32.wrap_i64
    i32.const 3
    i32.shl
    i32.const 5424
    i32.add
    local.tee $8
    i64.load offset=8
    local.get $20
    i64.const 45
    i64.shl
    i64.add
    local.set $7
    local.get $1
    local.get $3
    f64.const -6755399441055744
    f64.add
    local.tee $1
    f64.const -0.005415212348111709
    f64.mul
    f64.add
    local.get $1
    f64.const -1.2864023111638346e-14
    f64.mul
    f64.add
    local.tee $1
    local.get $1
    f64.mul
    local.set $3
    local.get $8
    f64.load
    local.get $1
    f64.add
    local.get $3
    local.get $1
    f64.const 0.16666666666665886
    f64.mul
    f64.const 0.49999999999996786
    f64.add
    f64.mul
    f64.add
    local.get $3
    local.get $3
    f64.mul
    local.get $1
    f64.const 0.008333335853059549
    f64.mul
    f64.const 0.0416666808410674
    f64.add
    f64.mul
    f64.add
    local.set $1
    local.get $6
    i32.eqz
    if
     block $~lib/util/math/specialcase|inlined.1 (result f64)
      local.get $20
      i64.const 2147483648
      i64.and
      i64.eqz
      if
       local.get $7
       i64.const 4544132024016830464
       i64.sub
       f64.reinterpret_i64
       local.tee $3
       local.get $3
       local.get $1
       f64.mul
       f64.add
       f64.const 5486124068793688683255936e279
       f64.mul
       br $~lib/util/math/specialcase|inlined.1
      end
      local.get $7
      i64.const 4602678819172646912
      i64.add
      local.tee $7
      f64.reinterpret_i64
      local.tee $3
      local.get $1
      f64.mul
      local.set $1
      local.get $3
      local.get $1
      f64.add
      local.tee $5
      f64.abs
      f64.const 1
      f64.lt
      if (result f64)
       f64.const 1
       local.get $5
       f64.copysign
       local.tee $11
       local.get $5
       f64.add
       local.tee $14
       local.get $11
       local.get $14
       f64.sub
       local.get $5
       f64.add
       local.get $3
       local.get $5
       f64.sub
       local.get $1
       f64.add
       f64.add
       f64.add
       local.get $11
       f64.sub
       local.tee $1
       f64.const 0
       f64.eq
       if (result f64)
        local.get $7
        i64.const -9223372036854775808
        i64.and
        f64.reinterpret_i64
       else
        local.get $1
       end
      else
       local.get $5
      end
      f64.const 2.2250738585072014e-308
      f64.mul
     end
     br $~lib/util/math/exp_lut|inlined.0
    end
    local.get $7
    f64.reinterpret_i64
    local.tee $3
    local.get $3
    local.get $1
    f64.mul
    f64.add
   end
   f64.mul
   f64.add
  end
  i32.const 1184
  local.get $19
  call $~lib/array/Array<f64>#__get
  f64.const 2
  call $~lib/math/NativeMath.pow
  f64.const 500
  f64.mul
  local.get $0
  f64.load offset=120
  f64.mul
  local.get $0
  f64.load offset=128
  f64.mul
  f64.const 100
  f64.div
  f64.add
  local.tee $3
  f64.const 0
  f64.ge
  i32.eqz
  if
   i32.const 7696
   i32.const 7808
   i32.const 912
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $4
  f64.const 0
  f64.max
  f64.const 10
  f64.min
  f64.const 0
  local.get $4
  local.get $4
  f64.sub
  f64.const 0
  f64.eq
  select
  local.set $14
  local.get $0
  f64.load offset=160
  f64.const 0.01
  f64.lt
  if (result i32)
   i32.const 1
  else
   local.get $0
   f64.load offset=96
   f64.const 0.01
   f64.lt
  end
  if (result f64)
   f64.const 0
  else
   f64.const 1
   local.get $0
   f64.load offset=48
   f64.const 1
   local.get $0
   f64.load offset=144
   f64.const 0.25
   f64.mul
   f64.sub
   f64.mul
   f64.abs
   local.get $0
   f64.load offset=160
   f64.const 60
   f64.div
   f64.const 3
   f64.div
   local.tee $1
   local.get $0
   f64.load offset=184
   local.tee $4
   f64.mul
   f64.const 0.001
   f64.add
   f64.div
   f64.const 0.3
   f64.mul
   f64.sub
   f64.const 0
   f64.max
   local.get $0
   f64.load offset=152
   f64.mul
   local.get $1
   f64.mul
   local.get $1
   f64.mul
   local.get $4
   f64.const 4
   call $~lib/math/NativeMath.pow
   f64.mul
  end
  local.set $1
  local.get $0
  f64.load offset=248
  f64.const 0
  f64.le
  if
   local.get $0
   f64.const 0
   f64.store offset=160
   f64.const 0
   local.set $1
  end
  local.get $0
  f64.load offset=48
  local.tee $4
  local.get $4
  f64.mul
  local.get $0
  f64.load offset=56
  local.tee $4
  local.get $4
  f64.mul
  f64.add
  f64.sqrt
  local.tee $4
  f64.const 0.01
  f64.lt
  if (result f64)
   f64.const 0
  else
   local.get $0
   f64.load offset=104
   f64.const 2.019595277307724
   f64.mul
   local.get $0
   f64.load offset=120
   f64.const 0.018
   f64.mul
   local.get $0
   f64.load offset=136
   f64.mul
   f64.mul
   f64.const 0.5
   f64.mul
   local.get $0
   f64.load offset=152
   f64.mul
   local.get $4
   f64.mul
   local.get $4
   f64.mul
  end
  f64.abs
  local.get $0
  f64.load offset=104
  f64.abs
  call $~lib/math/NativeMath.sin
  f64.mul
  local.set $4
  local.get $0
  call $assembly/index/calculateRudderForceY
  local.set $5
  local.get $0
  call $assembly/index/calculateRudderForceY
  local.get $0
  f64.load offset=120
  f64.const -0.45
  f64.mul
  f64.mul
  local.set $21
  local.get $0
  f64.load offset=128
  local.get $0
  f64.load offset=136
  f64.mul
  f64.const 1.5
  f64.mul
  local.set $11
  local.get $12
  local.get $0
  f64.load offset=24
  f64.sub
  local.tee $15
  call $~lib/math/NativeMath.cos
  f64.abs
  f64.const 0.4
  f64.mul
  f64.const 0.5
  f64.add
  local.set $16
  local.get $2
  f64.const 2
  call $~lib/math/NativeMath.pow
  f64.const 0.6125
  f64.mul
  local.get $11
  f64.mul
  local.get $16
  f64.mul
  local.get $15
  call $~lib/math/NativeMath.cos
  f64.mul
  local.set $11
  local.get $0
  f64.load offset=128
  local.get $0
  f64.load offset=136
  f64.mul
  f64.const 1.5
  f64.mul
  local.set $15
  local.get $12
  local.get $0
  f64.load offset=24
  f64.sub
  local.tee $16
  call $~lib/math/NativeMath.sin
  f64.abs
  f64.const 0.7
  f64.mul
  local.set $17
  local.get $2
  f64.const 2
  call $~lib/math/NativeMath.pow
  f64.const 0.6125
  f64.mul
  local.get $15
  f64.mul
  local.get $17
  f64.mul
  local.get $16
  call $~lib/math/NativeMath.sin
  f64.mul
  local.set $22
  local.get $0
  f64.load offset=128
  local.get $0
  f64.load offset=136
  f64.mul
  f64.const 1.5
  f64.mul
  local.set $15
  local.get $12
  local.get $0
  f64.load offset=24
  f64.sub
  local.tee $12
  local.get $12
  f64.add
  call $~lib/math/NativeMath.sin
  f64.const 0.1
  f64.mul
  local.set $12
  local.get $2
  f64.const 2
  call $~lib/math/NativeMath.pow
  f64.const 0.6125
  f64.mul
  local.get $15
  f64.mul
  local.get $0
  f64.load offset=120
  f64.mul
  local.get $12
  f64.mul
  local.set $23
  local.get $0
  f64.load offset=120
  local.get $0
  f64.load offset=136
  f64.mul
  f64.const 0.7
  f64.mul
  local.set $2
  local.get $0
  f64.load offset=120
  local.get $0
  f64.load offset=128
  f64.mul
  local.get $0
  f64.load offset=144
  f64.mul
  local.set $12
  local.get $13
  local.get $0
  f64.load offset=24
  f64.sub
  local.tee $13
  call $~lib/math/NativeMath.cos
  f64.abs
  f64.const 0.3
  f64.mul
  f64.const 0.5
  f64.add
  local.set $15
  local.get $13
  call $~lib/math/NativeMath.sin
  f64.abs
  f64.const 0.8
  f64.mul
  local.set $16
  local.get $13
  local.get $13
  f64.add
  call $~lib/math/NativeMath.sin
  f64.const 0.1
  f64.mul
  local.set $17
  local.get $0
  f64.load offset=152
  f64.const 0.5
  f64.mul
  local.get $14
  f64.mul
  local.get $14
  f64.mul
  local.get $12
  f64.mul
  local.get $15
  f64.mul
  local.get $13
  call $~lib/math/NativeMath.cos
  f64.mul
  local.set $12
  local.get $0
  f64.load offset=152
  f64.const 0.5
  f64.mul
  local.get $14
  f64.mul
  local.get $14
  f64.mul
  local.get $2
  f64.mul
  local.get $16
  f64.mul
  local.get $13
  call $~lib/math/NativeMath.sin
  f64.mul
  local.set $13
  local.get $0
  f64.load offset=152
  f64.const 0.5
  f64.mul
  local.get $14
  f64.mul
  local.get $14
  f64.mul
  local.get $2
  f64.mul
  local.get $0
  f64.load offset=120
  f64.mul
  local.get $17
  f64.mul
  local.set $2
  i32.const 3
  i32.const 0
  call $~lib/rt/__newArray
  local.tee $6
  i32.load offset=4
  drop
  local.get $6
  i32.const 0
  local.get $12
  call $~lib/array/Array<f64>#__set
  local.get $6
  i32.const 1
  local.get $13
  call $~lib/array/Array<f64>#__set
  local.get $6
  i32.const 2
  local.get $2
  call $~lib/array/Array<f64>#__set
  local.get $6
  i32.const 0
  call $~lib/array/Array<f64>#__get
  local.set $12
  local.get $6
  i32.const 1
  call $~lib/array/Array<f64>#__get
  local.set $24
  local.get $6
  i32.const 2
  call $~lib/array/Array<f64>#__get
  local.set $25
  local.get $0
  local.get $19
  local.get $9
  f64.const 100
  f64.mul
  call $assembly/index/calculateWaveForce
  local.tee $6
  i32.const 0
  call $~lib/array/Array<f64>#__get
  local.set $13
  local.get $6
  i32.const 1
  call $~lib/array/Array<f64>#__get
  local.set $26
  local.get $6
  i32.const 2
  call $~lib/array/Array<f64>#__get
  local.set $27
  local.get $6
  i32.const 3
  call $~lib/array/Array<f64>#__get
  local.set $28
  local.get $6
  i32.const 4
  call $~lib/array/Array<f64>#__get
  local.set $29
  local.get $6
  i32.const 5
  call $~lib/array/Array<f64>#__get
  local.set $30
  local.get $0
  f64.load offset=112
  local.tee $14
  f64.const 1.2
  f64.mul
  local.set $31
  local.get $0
  f64.load offset=224
  f64.const 1.1
  f64.mul
  local.set $15
  local.get $0
  f64.load offset=232
  f64.const 1.1
  f64.mul
  local.set $16
  local.get $0
  f64.load offset=240
  f64.const 1.2
  f64.mul
  local.set $2
  local.get $1
  local.get $11
  f64.add
  local.get $12
  f64.add
  local.get $13
  f64.add
  local.get $3
  f64.const 1
  f64.const -1
  local.get $0
  f64.load offset=48
  local.tee $17
  local.get $17
  f64.const 0
  f64.lt
  select
  local.get $17
  f64.const 0
  f64.gt
  select
  local.tee $17
  f64.mul
  f64.sub
  local.get $4
  local.get $17
  f64.mul
  f64.sub
  local.tee $32
  local.get $14
  f64.const 1.05
  f64.mul
  local.tee $17
  f64.div
  local.set $18
  local.get $17
  local.get $17
  f64.sub
  f64.const 0
  f64.eq
  local.get $17
  f64.const 0
  f64.gt
  i32.and
  i32.eqz
  if
   i32.const 8128
   i32.const 7808
   i32.const 985
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $3
  local.get $3
  f64.sub
  f64.const 0
  f64.eq
  local.get $3
  f64.const 0
  f64.ge
  i32.and
  i32.eqz
  if
   i32.const 8192
   i32.const 7808
   i32.const 986
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $4
  local.get $4
  f64.sub
  f64.const 0
  f64.eq
  local.get $4
  f64.const 0
  f64.ge
  i32.and
  i32.eqz
  if
   i32.const 8272
   i32.const 7808
   i32.const 990
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  local.get $1
  f64.sub
  f64.const 0
  f64.ne
  if
   i32.const 8336
   i32.const 7808
   i32.const 991
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $11
  local.get $11
  f64.sub
  f64.const 0
  f64.ne
  if
   i32.const 8416
   i32.const 7808
   i32.const 992
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $12
  local.get $12
  f64.sub
  f64.const 0
  f64.ne
  if
   i32.const 8480
   i32.const 7808
   i32.const 993
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $13
  local.get $13
  f64.sub
  f64.const 0
  f64.ne
  if
   i32.const 8544
   i32.const 7808
   i32.const 994
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $32
  local.get $32
  f64.sub
  f64.const 0
  f64.ne
  if
   i32.const 8608
   i32.const 7808
   i32.const 995
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $18
  local.get $18
  f64.sub
  f64.const 0
  f64.ne
  if
   i32.const 8672
   i32.const 7808
   i32.const 996
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  f64.load offset=48
  local.tee $1
  local.get $1
  f64.sub
  f64.const 0
  f64.ne
  if
   i32.const 8736
   i32.const 7808
   i32.const 997
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $18
  f64.abs
  f64.const 100
  f64.lt
  if
   local.get $0
   local.get $0
   f64.load offset=48
   local.get $18
   local.get $9
   f64.mul
   f64.add
   f64.store offset=48
  else
   local.get $18
   f64.const 0
   f64.gt
   if
    local.get $0
    local.get $0
    f64.load offset=48
    local.get $9
    f64.const 100
    f64.mul
    f64.add
    f64.store offset=48
   else
    local.get $0
    local.get $0
    f64.load offset=48
    local.get $9
    f64.const 100
    f64.mul
    f64.sub
    f64.store offset=48
   end
  end
  local.get $0
  f64.load offset=48
  local.tee $1
  local.get $1
  f64.sub
  f64.const 0
  f64.ne
  if
   i32.const 8736
   i32.const 7808
   i32.const 1008
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $5
  local.get $22
  f64.add
  local.get $24
  f64.add
  local.get $26
  f64.add
  local.get $3
  f64.const 1
  f64.const -1
  local.get $0
  f64.load offset=56
  local.tee $1
  local.get $1
  f64.const 0
  f64.lt
  select
  local.get $1
  f64.const 0
  f64.gt
  select
  f64.mul
  f64.const 0.8
  f64.mul
  f64.sub
  local.get $31
  f64.div
  local.tee $3
  f64.abs
  f64.const 100
  f64.lt
  if
   local.get $0
   local.get $1
   local.get $3
   local.get $9
   f64.mul
   f64.add
   f64.store offset=56
  else
   local.get $3
   f64.const 0
   f64.gt
   if
    local.get $0
    local.get $0
    f64.load offset=56
    local.get $9
    f64.const 100
    f64.mul
    f64.add
    f64.store offset=56
   else
    local.get $0
    local.get $0
    f64.load offset=56
    local.get $9
    f64.const 100
    f64.mul
    f64.sub
    f64.store offset=56
   end
  end
  local.get $27
  local.get $0
  f64.load offset=64
  local.tee $1
  local.get $1
  f64.abs
  f64.mul
  f64.const 0.5
  f64.mul
  local.get $0
  f64.load offset=152
  f64.mul
  local.get $0
  f64.load offset=128
  f64.mul
  local.get $0
  f64.load offset=120
  f64.mul
  f64.const 0.02
  f64.mul
  f64.sub
  local.get $14
  f64.const 1.1
  f64.mul
  f64.div
  local.tee $3
  f64.abs
  f64.const 20
  f64.lt
  if
   local.get $0
   local.get $1
   local.get $3
   local.get $9
   f64.mul
   f64.add
   f64.store offset=64
  else
   local.get $3
   f64.const 0
   f64.gt
   if
    local.get $0
    local.get $0
    f64.load offset=64
    local.get $9
    f64.const 20
    f64.mul
    f64.add
    f64.store offset=64
   else
    local.get $0
    local.get $0
    f64.load offset=64
    local.get $9
    f64.const 20
    f64.mul
    f64.sub
    f64.store offset=64
   end
  end
  local.get $0
  local.get $0
  f64.load offset=80
  local.tee $1
  local.get $28
  local.get $1
  f64.const -0.9
  f64.mul
  f64.add
  local.get $1
  f64.neg
  local.get $1
  f64.abs
  f64.mul
  local.get $0
  f64.load offset=152
  f64.mul
  local.get $0
  f64.load offset=128
  local.tee $1
  f64.mul
  local.get $1
  f64.mul
  local.get $0
  f64.load offset=120
  f64.mul
  f64.const 0.02
  f64.mul
  f64.add
  local.get $15
  f64.div
  local.get $9
  f64.mul
  f64.add
  f64.store offset=80
  local.get $0
  local.get $0
  f64.load offset=32
  local.get $0
  f64.load offset=80
  local.get $9
  f64.mul
  f64.add
  f64.store offset=32
  local.get $0
  call $assembly/index/calculateGM
  local.set $1
  local.get $0
  local.get $0
  f64.load offset=80
  local.get $0
  f64.load offset=32
  f64.neg
  local.get $1
  f64.mul
  local.get $0
  f64.load offset=112
  f64.mul
  f64.const 9.81
  f64.mul
  local.get $15
  f64.div
  local.get $9
  f64.mul
  f64.add
  f64.store offset=80
  local.get $0
  local.get $0
  f64.load offset=88
  local.tee $1
  local.get $29
  local.get $1
  f64.const -0.8
  f64.mul
  f64.const 1
  f64.const -1
  local.get $1
  local.get $1
  f64.const 0
  f64.lt
  select
  local.get $1
  f64.const 0
  f64.gt
  select
  f64.mul
  f64.add
  local.get $1
  f64.neg
  local.get $1
  f64.abs
  f64.mul
  local.get $0
  f64.load offset=152
  f64.mul
  local.get $0
  f64.load offset=120
  f64.mul
  local.get $0
  f64.load offset=120
  f64.mul
  local.get $0
  f64.load offset=128
  f64.mul
  f64.const 0.015
  f64.mul
  f64.add
  local.get $16
  f64.div
  local.get $9
  f64.mul
  f64.add
  f64.store offset=88
  local.get $0
  local.get $0
  f64.load offset=40
  local.get $0
  f64.load offset=88
  local.get $9
  f64.mul
  f64.add
  f64.store offset=40
  local.get $0
  local.get $0
  f64.load offset=88
  local.get $0
  f64.load offset=40
  f64.neg
  local.get $0
  f64.load offset=120
  f64.mul
  local.get $0
  f64.load offset=112
  f64.mul
  f64.const 0.05
  f64.mul
  local.get $16
  f64.div
  local.get $9
  f64.mul
  f64.add
  f64.store offset=88
  local.get $21
  local.get $23
  f64.add
  local.get $25
  f64.add
  local.get $30
  f64.add
  local.get $0
  f64.load offset=72
  local.tee $1
  f64.const -1.1
  f64.mul
  f64.const 1
  f64.const -1
  local.get $1
  local.get $1
  f64.const 0
  f64.lt
  select
  local.get $1
  f64.const 0
  f64.gt
  select
  f64.mul
  f64.add
  local.get $1
  f64.neg
  local.get $1
  f64.abs
  f64.mul
  local.get $0
  f64.load offset=152
  f64.mul
  local.get $0
  f64.load offset=120
  f64.mul
  local.get $0
  f64.load offset=120
  f64.mul
  local.get $0
  f64.load offset=128
  f64.mul
  f64.const 0.05
  f64.mul
  f64.add
  local.get $2
  f64.div
  local.tee $2
  f64.abs
  f64.const 5
  f64.lt
  if
   local.get $0
   local.get $1
   local.get $2
   local.get $9
   f64.mul
   f64.add
   f64.store offset=72
  else
   local.get $2
   f64.const 0
   f64.gt
   if
    local.get $0
    local.get $0
    f64.load offset=72
    local.get $9
    f64.const 5
    f64.mul
    f64.add
    f64.store offset=72
   else
    local.get $0
    local.get $0
    f64.load offset=72
    local.get $9
    f64.const 5
    f64.mul
    f64.sub
    f64.store offset=72
   end
  end
  local.get $0
  local.get $0
  f64.load offset=24
  local.get $0
  f64.load offset=72
  local.get $9
  f64.mul
  f64.add
  f64.store offset=24
  local.get $0
  f64.load offset=24
  f64.const 6.283185307179586
  f64.ge
  if
   local.get $0
   local.get $0
   f64.load offset=24
   f64.const -6.283185307179586
   f64.add
   f64.store offset=24
   local.get $0
   f64.load offset=24
   f64.const 6.283185307179586
   f64.ge
   if
    local.get $0
    local.get $0
    f64.load offset=24
    call $~lib/math/NativeMath.mod
    f64.store offset=24
   end
  else
   local.get $0
   f64.load offset=24
   local.tee $1
   f64.const 0
   f64.lt
   if
    local.get $0
    local.get $1
    f64.const 6.283185307179586
    f64.add
    f64.store offset=24
    local.get $0
    f64.load offset=24
    f64.const 0
    f64.lt
    if
     local.get $0
     local.get $0
     f64.load offset=24
     call $~lib/math/NativeMath.mod
     local.tee $1
     f64.const 6.283185307179586
     f64.add
     local.get $1
     local.get $1
     f64.const 0
     f64.lt
     select
     f64.store offset=24
    end
   end
  end
  local.get $0
  f64.load offset=24
  call $~lib/math/NativeMath.cos
  local.set $1
  local.get $0
  f64.load offset=24
  call $~lib/math/NativeMath.sin
  local.set $2
  local.get $0
  f64.load offset=48
  local.tee $3
  local.get $2
  f64.mul
  local.get $0
  f64.load offset=56
  local.tee $4
  local.get $1
  f64.mul
  f64.add
  local.set $5
  local.get $0
  local.get $0
  f64.load
  local.get $9
  f64.const 100
  f64.mul
  local.tee $11
  local.get $3
  local.get $1
  f64.mul
  local.get $4
  local.get $2
  f64.mul
  f64.sub
  local.get $9
  f64.mul
  local.tee $1
  f64.lt
  if (result f64)
   local.get $11
  else
   local.get $11
   f64.neg
   local.tee $2
   local.get $1
   local.get $1
   local.get $2
   f64.lt
   select
  end
  f64.add
  f64.store
  local.get $0
  local.get $0
  f64.load offset=8
  local.get $5
  local.get $9
  f64.mul
  local.tee $1
  local.get $11
  f64.gt
  if (result f64)
   local.get $11
  else
   local.get $11
   f64.neg
   local.tee $2
   local.get $1
   local.get $1
   local.get $2
   f64.lt
   select
  end
  f64.add
  f64.store offset=8
  local.get $0
  local.get $0
  f64.load offset=16
  local.get $0
  f64.load offset=64
  local.get $9
  f64.mul
  f64.add
  f64.store offset=16
  local.get $0
  f64.load offset=16
  f64.const 0
  f64.lt
  if
   local.get $0
   f64.const 0
   f64.store offset=16
  end
  local.get $0
  f64.load offset=248
  local.tee $1
  f64.const 0
  f64.gt
  if
   local.get $0
   local.get $1
   local.get $9
   f64.const 0.01
   f64.mul
   local.get $0
   f64.load offset=176
   f64.const 3600
   f64.div
   local.get $0
   f64.load offset=112
   f64.const 0.1
   f64.mul
   f64.div
   f64.max
   local.get $9
   f64.mul
   f64.sub
   f64.store offset=248
   local.get $0
   f64.load offset=248
   f64.const 0
   f64.lt
   if
    local.get $0
    f64.const 0
    f64.store offset=248
    local.get $0
    f64.const 0
    f64.store offset=96
    local.get $0
    f64.const 0
    f64.store offset=160
   end
  end
  local.get $0
  global.set $assembly/index/globalVessel
  local.get $0
 )
 (func $assembly/index/VesselState#constructor (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (param $4 f64) (param $5 f64) (param $6 f64) (param $7 f64) (param $8 f64) (param $9 f64) (param $10 f64) (param $11 f64) (param $12 f64) (param $13 f64) (param $14 f64) (param $15 f64) (param $16 f64) (param $17 f64) (result i32)
  (local $18 i32)
  i32.const 296
  i32.const 5
  call $~lib/rt/stub/__new
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
  f64.const 0
  f64.store offset=136
  local.get $18
  f64.const 0
  f64.store offset=144
  local.get $18
  f64.const 0
  f64.store offset=152
  local.get $18
  f64.const 0
  f64.store offset=160
  local.get $18
  f64.const 0
  f64.store offset=168
  local.get $18
  f64.const 0
  f64.store offset=176
  local.get $18
  f64.const 0
  f64.store offset=184
  local.get $18
  f64.const 0
  f64.store offset=192
  local.get $18
  f64.const 0
  f64.store offset=200
  local.get $18
  f64.const 0
  f64.store offset=208
  local.get $18
  f64.const 0
  f64.store offset=216
  local.get $18
  f64.const 0
  f64.store offset=224
  local.get $18
  f64.const 0
  f64.store offset=232
  local.get $18
  f64.const 0
  f64.store offset=240
  local.get $18
  f64.const 0
  f64.store offset=248
  local.get $18
  f64.const 0
  f64.store offset=256
  local.get $18
  f64.const 0
  f64.store offset=264
  local.get $18
  f64.const 0
  f64.store offset=272
  local.get $18
  f64.const 0
  f64.store offset=280
  local.get $18
  f64.const 0
  f64.store offset=288
  local.get $18
  local.get $0
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
  local.get $4
  f64.store offset=32
  local.get $18
  local.get $5
  f64.store offset=40
  local.get $18
  local.get $6
  f64.store offset=48
  local.get $18
  local.get $7
  f64.store offset=56
  local.get $18
  local.get $8
  f64.store offset=64
  local.get $18
  local.get $9
  f64.store offset=72
  local.get $18
  local.get $10
  f64.store offset=80
  local.get $18
  local.get $11
  f64.store offset=88
  local.get $18
  local.get $12
  f64.store offset=96
  local.get $18
  local.get $13
  f64.store offset=104
  local.get $18
  local.get $14
  f64.store offset=112
  local.get $18
  local.get $15
  f64.store offset=120
  local.get $18
  local.get $16
  f64.store offset=128
  local.get $18
  local.get $17
  f64.store offset=136
  local.get $18
  f64.const 0.8
  f64.store offset=144
  local.get $18
  f64.const 1025
  f64.store offset=152
  local.get $18
  f64.const 0
  f64.store offset=160
  local.get $18
  f64.const 22e5
  f64.store offset=168
  local.get $18
  f64.const 0
  f64.store offset=176
  local.get $18
  f64.const 3
  f64.store offset=184
  local.get $18
  f64.const 0
  f64.store offset=192
  local.get $18
  f64.const 0
  f64.store offset=200
  local.get $18
  local.get $17
  f64.const 0.5
  f64.mul
  f64.store offset=208
  local.get $18
  local.get $18
  f64.load offset=120
  local.get $18
  f64.load offset=128
  f64.mul
  local.get $18
  f64.load offset=136
  f64.mul
  local.get $18
  f64.load offset=144
  f64.mul
  f64.store offset=216
  local.get $18
  local.get $14
  local.get $16
  local.get $16
  f64.mul
  local.tee $0
  local.get $17
  local.get $17
  f64.mul
  local.tee $1
  f64.add
  f64.mul
  f64.const 12
  f64.div
  f64.store offset=224
  local.get $18
  local.get $14
  local.get $15
  local.get $15
  f64.mul
  local.tee $2
  local.get $1
  f64.add
  f64.mul
  f64.const 12
  f64.div
  f64.store offset=232
  local.get $18
  local.get $14
  local.get $2
  local.get $0
  f64.add
  f64.mul
  f64.const 12
  f64.div
  f64.store offset=240
  local.get $18
  f64.const 1
  f64.store offset=248
  local.get $18
  f64.const 0.5
  f64.store offset=256
  local.get $18
  f64.const 0
  f64.store offset=264
  local.get $18
  f64.const 0
  f64.store offset=272
  local.get $18
  f64.const 0
  f64.store offset=280
  local.get $18
  f64.const 0
  f64.store offset=288
  local.get $18
 )
 (func $assembly/index/createVessel (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (param $4 f64) (param $5 f64) (param $6 f64) (param $7 f64) (param $8 f64) (param $9 f64) (param $10 f64) (param $11 f64) (param $12 f64) (param $13 f64) (param $14 f64) (param $15 f64) (param $16 f64) (param $17 f64) (result i32)
  local.get $1
  local.get $1
  f64.sub
  f64.const 0
  f64.ne
  local.get $0
  local.get $0
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $2
  local.get $2
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $3
  local.get $3
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $4
  local.get $4
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $5
  local.get $5
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $6
  local.get $6
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $7
  local.get $7
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $8
  local.get $8
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $9
  local.get $9
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $10
  local.get $10
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $11
  local.get $11
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $12
  local.get $12
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $13
  local.get $13
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $14
  local.get $14
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $15
  local.get $15
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $16
  local.get $16
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $17
  local.get $17
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  if
   i32.const 8816
   i32.const 7808
   i32.const 1253
   i32.const 5
   call $~lib/builtins/abort
   unreachable
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
   local.get $12
   local.get $13
   local.get $14
   local.get $15
   local.get $16
   local.get $17
   call $assembly/index/VesselState#constructor
   global.set $assembly/index/globalVessel
  end
  global.get $assembly/index/globalVessel
 )
 (func $assembly/index/setThrottle (param $0 i32) (param $1 f64)
  local.get $1
  local.get $1
  f64.sub
  f64.const 0
  f64.ne
  if
   return
  end
  local.get $0
  f64.const 1
  f64.const 0
  local.get $1
  local.get $1
  f64.const 0
  f64.lt
  select
  local.get $1
  f64.const 1
  f64.gt
  select
  f64.store offset=96
  local.get $0
  local.get $0
  f64.load offset=96
  f64.const 1200
  f64.mul
  f64.store offset=160
  local.get $0
  f64.load offset=96
  f64.const 0.01
  f64.gt
  if (result i32)
   local.get $0
   f64.load offset=248
   f64.const 0
   f64.gt
  else
   i32.const 0
  end
  if
   local.get $0
   local.get $0
   f64.load offset=96
   local.tee $1
   local.get $1
   f64.mul
   f64.const 95
   f64.mul
   f64.const 5
   f64.add
   f64.store offset=176
  else
   local.get $0
   f64.const 0
   f64.store offset=176
  end
  local.get $0
  global.set $assembly/index/globalVessel
 )
 (func $assembly/index/setWaveData (param $0 i32) (param $1 f64) (param $2 f64)
  local.get $2
  local.get $2
  f64.sub
  f64.const 0
  f64.ne
  local.get $1
  local.get $1
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  if
   return
  end
  local.get $0
  local.get $1
  f64.store offset=264
  local.get $0
  local.get $2
  f64.store offset=288
  local.get $0
  global.set $assembly/index/globalVessel
 )
 (func $assembly/index/setRudderAngle (param $0 i32) (param $1 f64)
  local.get $1
  local.get $1
  f64.sub
  f64.const 0
  f64.ne
  if
   return
  end
  local.get $0
  f64.const 0.6
  f64.const -0.6
  local.get $1
  local.get $1
  f64.const -0.6
  f64.lt
  select
  local.get $1
  f64.const 0.6
  f64.gt
  select
  f64.store offset=104
  local.get $0
  global.set $assembly/index/globalVessel
 )
 (func $assembly/index/setBallast (param $0 i32) (param $1 f64)
  local.get $1
  local.get $1
  f64.sub
  f64.const 0
  f64.ne
  if
   return
  end
  local.get $0
  f64.const 1
  f64.const 0
  local.get $1
  local.get $1
  f64.const 0
  f64.lt
  select
  local.get $1
  f64.const 1
  f64.gt
  select
  f64.store offset=256
  local.get $0
  call $assembly/index/calculateCenterOfGravity
  local.get $0
  global.set $assembly/index/globalVessel
 )
 (func $assembly/index/getVesselRollAngle (param $0 i32) (result f64)
  local.get $0
  f64.load offset=32
 )
 (func $assembly/index/getVesselPitchAngle (param $0 i32) (result f64)
  local.get $0
  f64.load offset=40
 )
 (func $assembly/index/getVesselX (param $0 i32) (result f64)
  local.get $0
  f64.load
 )
 (func $assembly/index/getVesselY (param $0 i32) (result f64)
  local.get $0
  f64.load offset=8
 )
 (func $assembly/index/getVesselZ (param $0 i32) (result f64)
  local.get $0
  f64.load offset=16
 )
 (func $assembly/index/getVesselHeading (param $0 i32) (result f64)
  local.get $0
  f64.load offset=24
 )
 (func $assembly/index/getVesselSpeed (param $0 i32) (result f64)
  (local $1 f64)
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
 (func $assembly/index/getVesselEngineRPM (param $0 i32) (result f64)
  local.get $0
  f64.load offset=160
 )
 (func $assembly/index/getVesselFuelLevel (param $0 i32) (result f64)
  local.get $0
  f64.load offset=248
 )
 (func $assembly/index/getVesselFuelConsumption (param $0 i32) (result f64)
  local.get $0
  f64.load offset=176
 )
 (func $assembly/index/getVesselGM (param $0 i32) (result f64)
  local.get $0
  call $assembly/index/calculateGM
 )
 (func $assembly/index/getVesselCenterOfGravityY (param $0 i32) (result f64)
  local.get $0
  call $assembly/index/calculateCenterOfGravity
  local.get $0
  f64.load offset=200
 )
 (func $assembly/index/getVesselSurgeVelocity (param $0 i32) (result f64)
  local.get $0
  f64.load offset=48
 )
 (func $assembly/index/getVesselSwayVelocity (param $0 i32) (result f64)
  local.get $0
  f64.load offset=56
 )
 (func $assembly/index/getVesselHeaveVelocity (param $0 i32) (result f64)
  local.get $0
  f64.load offset=64
 )
 (func $assembly/index/getVesselRudderAngle (param $0 i32) (result f64)
  local.get $0
  f64.load offset=104
 )
 (func $assembly/index/getVesselBallastLevel (param $0 i32) (result f64)
  local.get $0
  f64.load offset=256
 )
 (func $assembly/index/setVesselVelocity (param $0 i32) (param $1 f64) (param $2 f64) (param $3 f64)
  local.get $2
  local.get $2
  f64.sub
  f64.const 0
  f64.ne
  local.get $1
  local.get $1
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  local.get $3
  local.get $3
  f64.sub
  f64.const 0
  f64.ne
  i32.or
  if
   return
  end
  local.get $0
  local.get $1
  f64.store offset=48
  local.get $0
  local.get $2
  f64.store offset=56
  local.get $0
  local.get $3
  f64.store offset=64
  local.get $0
  global.set $assembly/index/globalVessel
 )
 (func $assembly/index/resetGlobalVessel
  i32.const 0
  global.set $assembly/index/globalVessel
 )
 (func $~start
  i32.const 8908
  global.set $~lib/rt/stub/offset
 )
)
