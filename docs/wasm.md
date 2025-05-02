## Validation

### AssemblyScript Export Validation

This command uses the AssemblyScript compiler's validate mode to check for syntax errors and other issues in your AssemblyScript code before compilation.

```sh
npm run wasm:check-exports
```

This command analyzes both debug and release WASM files to detect which functions are actually being exported. It will:

1. List all exported functions
2. Identify any missing exports (functions that should be exported but aren't)
3. Analyze potential causes for export issues
4. Suggest fixes for common export problems

### Common AssemblyScript Export Issues

When functions aren't exported properly, it's typically due to one of these issues:

1. **Default parameters**: AssemblyScript cannot export functions with default parameters. Remove defaults for exported functions:

   ```typescript
   // Won't export properly:
   export function updateState(dt: f64, speed: f64 = 0): void {}
   
   // Will export properly:
   export function updateState(dt: f64, speed: f64): void {}
   ```

2. **Complex return types**: Functions returning arrays or complex objects may not export properly. Use simpler return types or separate functions:

   ```typescript
   // May not export:
   export function getValues(): f64[] {}
   
   // Better approach:
   export function getValue(index: i32): f64 {}
   ```

3. **Missing @external annotation**: Add this annotation to ensure the function is exported:

   ```typescript
   /** @external */
   export function importantFunction(): void {}
   ```

4. **Classes**: AssemblyScript cannot export classes directly. Use functions instead:

   ```typescript
   // Won't export:
   export class MyClass {
     method(): void {}
   }
   
   // Use this approach instead:
   export function createMyObject(): usize {}
   export function callMethod(ptr: usize): void {}
   ```

Always run the validation scripts after making changes to your AssemblyScript code to ensure all functions are properly exported.
