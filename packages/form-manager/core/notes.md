# Notes


<https://chatgpt.com/c/68aecf66-f9cc-8323-8345-5c5cb8bf5686>
<https://claude.ai/chat/bfeb5db0-663e-4cfa-ac0a-fd5953ec6255>

- `any` and `Record<string, any>`: avoid any in public types. Use unknown where you intend to transform/parse, or keep constrained generics `T = unknown`.



*** ChatGPT's notes on form-manager design
---

## Important design decisions & rationale

### 1) Validation return value / typed schema

* **Do not** have validators return `ValidValue` reflecting parsed value. Validation should return boolean-ish or error(s). Parsing should be separate step (parser/formatter). Mixing them conflates concerns.
* For schema-driven validation (Zod/Yup), accept resolver adapters that map to `ValidationResult` or a canonical `Record<string, string>` error shape.

### 2) `initialValue` vs `defaultValue`

* Recommendation: **form-level initial values** (single source of truth) and **field-level default** are different:

  * `initialValues` is passed when creating the form manager — canonical snapshot.
  * `defaultValue` sits in field options (for uncontrolled default).
* Implement `resolveInitialValue(fieldName)` on the form manager to pick `field.defaultValue ?? form.initialValues[name]` — simple deterministic behavior.

### 3) Arrays & stable keys

* Implement stable keys (uuid) for items. Keys must survive reorders. Don’t use indices as React keys.
* On insert/remove, rebuild paths for downstream items (or use a trie mapping to tokenized nodes).

### 4) Trie & path normalization

* Normalize numeric segments to e.g. `${number}` or an internal token `__IDX__` for the trie; keep original path string in leaf nodes.
* When matching subscriptions with wildcards (e.g., `users.*.name`), support `*` semantics or smart numeric matching.

### 5) Subscriptions & perf

* Expose subscription API that returns minimal slices: `subscribe(path, { onChange?, onValidate?, onError? })`.
* Internally maintain a `version` per path node (or per field metadata) so clients can compare and bail out in render layers.

### 6) Types vs runtime: be pragmatic

* Types can only go so far — `NestedPathValue` will not always be perfectly inferable for every possible dynamic structure. Provide `get<T = unknown>(path)` typed overloads so consumers can opt out when necessary.
* Use `unknown` in places where user-supplied data flows in, and force them to define typed `Values` at form creation for developer ergonomics.

---

## Pitfalls & gotchas you already considered (plus what to guard)

* **Type explosions**: Template literal types can blow up compile time for very deep models. Encourage consumers to define small `Values` interfaces rather than huge unions when possible.
* **Edge-case indexing**: Accept strings with numeric segments — your parsing/normalization must be robust for `foo['0']` vs `foo.0`.
* **Cross-framework events**: If this core library is headless and framework-agnostic, don’t type event parameter shapes concretely — accept `unknown` or generic `E`.
* **Validation race conditions**: async validation debounce + request cancellation is essential. Provide an abort token / sequence id per validate call to ignore stale results.
* **Migration surface**: If `FormManager` public API evolves, keep shim helpers to avoid breaking consumers.

---

## Extra UX/Type API ideas (to out-DX other libraries)

* `form.field("users.0.name").bind()` style helper that returns toolkit: `{ value, onChange, onBlur, error, set, get }` — works across frameworks.
* `form.resolver(zodSchema)` adapter that returns mapped typed `Schema` and `validateAll(): Promise<Schema>` (typed).
* `form.watch("a", "b")` typed overloads (single vs multiple).
* `form.subscribe(path, selector?)` where selector picks subtree — reduces listener overhead.
* `form.updater.batch(() => { ... })` to perform multiple sets with single notifications — great perf.

---

## Final notes & next steps

* The types I provided are ready to copy into your repo and iterate from. They tighten many loose `any`s, better separate parsing vs validating, and add explicit array/index support.
* Implementation suggestions: start with a minimal runtime (maps, trie with numeric tokenization, subscription map), then evolve to caching + batching + cancelable async validation.
* Add unit tests focusing on:

  * nested path indexing & `NestedPathValue` inference
  * array operations (insert/remove/move) maintain stable keys
  * async validation race/cancellation
---
***


*** TanStack Form’s approach to typed paths
Got it 👍 — TanStack Form’s **new API** (as of 2024+) exposes `form.setFieldValue` with **overloads** that strongly type the `path` if it’s a literal, and falls back to `unknown` if it’s not.

Here’s the **style of overloads** they use (simplified, but captures the real design):

```ts
// Path typing helper, same idea as react-hook-form or type-fest
type Path<T> = 
  T extends object 
    ? { [K in keyof T]: 
          K extends string 
            ? T[K] extends object 
              ? `${K}` | `${K}.${Path<T[K]>}`
              : `${K}`
            : never
      }[keyof T]
    : never;

type PathValue<T, P extends Path<T>> = 
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof T 
      ? Rest extends Path<T[K]>
        ? PathValue<T[K], Rest>
        : never
      : never
    : P extends keyof T
      ? T[P]
      : never;

// --- Example from TanStack Form ---

interface FormApi<TValues> {
  // Strongly typed version: path must be a literal, value must match
  setFieldValue<TPath extends Path<TValues>>(
    path: TPath,
    value: PathValue<TValues, TPath>
  ): void;

  // Escape hatch: dynamic string path, no type guarantee
  setFieldValue(
    path: string,
    value: unknown
  ): void;
}
```

---

### Example usage with a schema

```ts
type Values = {
  user: {
    name: string;
    age: number;
  };
  tags: string[];
};

declare const form: FormApi<Values>;

// ✅ Strongly typed, autocompletes, value type checked
form.setFieldValue("user.name", "Alice"); // ok
form.setFieldValue("user.age", 42); // ok

// ❌ Type error: expects number
form.setFieldValue("user.age", "wrong");

// ✅ Array index works
form.setFieldValue("tags.0", "first-tag");

// ✅ Escape hatch: dynamic string path, no type checking
const dynamicPath = "user." + "name";
form.setFieldValue(dynamicPath, 123); // allowed, value = unknown
```

---

### Why this style?

* **DX**: If you write literal paths (`"user.name"`), TypeScript infers and validates the type.
* **Flexibility**: If you build dynamic paths at runtime, you fall back to `unknown`, forcing you to handle types yourself.
* **Consistency**: Same API covers both cases, dev chooses trade-off.

This matches exactly what TanStack Form does: **literal = safe & inferred**, **dynamic = unsafe & escape hatch**.

---

👉 Do you want me to also write out the **matching `getFieldValue` overloads** the same way (with typed path + escape hatch)? That’ll give you the full `get/set` API parity like TanStack.
---
***

***
---
### 3.3 `parser` / `formatter` symmetry

- You expose `parser` and `format` in different places.  
- **Good**: keep them symmetrical.  
- **Bad**: `parser` returns `Value`, but `format` returns `any`. Make `format` return `string | number | readonly string[]` so the consumer can blindly feed it to an `<input>`.
---

---
## 4. Form-wide state – gigantic `FormManger` interface

- **Surface area**: 200+ lines of public API before we even talk about field arrays.  
- **Suggestion**: split into composable slices—users can import only what they need:

```ts
interface FormState<Values> { … }
interface FormSubmission<…> { … }
interface FormValidation<…> { … }
```

Then:

```ts
interface FormManager<…> extends FormState<Values>, FormSubmission<…>, FormValidation<…>, FieldArrayOps<Values> {}
```

Tree-shakers will thank you, and intellisense becomes *progressive*.
---

---
## 7. `ConditionManager` ergonomics

```ts
conditions.when('a', v => v > 5).then('b', 'hide').register();
```

- **Good**: fluent.  
- **Bad**: the builder keeps state *inside* the manager; accidental double `.register()` leaks memory.  
- **Suggestion**: return a *handle* instead of a builder:

```ts
const off = form.conditions.when('a', v => v > 5, {
  targets: [{ field: 'b', action: 'hide' }]
});
off(); // removes listeners
```
---

---
## 8. Performance hints for production

1. **Avoid mega-objects in React context**  
   - React re-renders when *any* part of context changes.  
   - Publish separate contexts: `FormValuesContext`, `FormMetaContext`, `FormSubmissionContext`.

2. **Stable getters**  
   - `values.get('user.name')` should return the same reference when nothing changed.  
   - Use `WeakMap` or structural sharing (like Immer) to guarantee stability.

3. **Memoised validation**  
   - `validateMany` should skip untouched fields unless `force=true`.  
   - Cache async results keyed by `(value, validationEvent)`.

4. **Bundle size budget**  
   - You are at ~3 kB gzipped for types only; aim to keep runtime < 8 kB.
---

---
## 9. Missing pieces (before you say “production ready”)

- **Schema inference** – let users pass a Zod schema *once* and derive both `Values` and `ValidValues`.  
- **i18n for error messages** – provide a message registry, not hard-coded strings.  
- **Dev-time only devtools** – opt-in bundle that adds a `FormManagerDev` interface for time-travel.  
- **Plugin system** – e.g., `registerPlugin({ afterChange, beforeSubmit })` so third-party UI kits can hook in.
---

---
## TL;DR recommendations

| Area | Do | Don’t |
|---|---|---|
| **Naming** | Rename `FormManger` → `FormManager` | Ship with typo |
| **Size** | Split into feature slices | One mega interface |
| **Arrays** | Add `garbageCollect()` to trie | Leak dead paths |
| **Validation** | Single `initial` source, typed rules | `initialValue` + `defaultValue` |
| **Context** | Multiple contexts / selectors | One giant object |
| **Docs** | Provide minimal “hello world” + advanced cookbook | 200-line type dump |

You are **~80 % of the way to a best-in-class core**. The remaining 20 % is ruthless pruning and DX polish.
---
***
