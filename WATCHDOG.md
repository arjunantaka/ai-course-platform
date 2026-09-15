Seven Essential Coding Habits for Writing Maintainable and Reliable Software
This video outlines seven practical coding habits that significantly improve code quality by making it easier to understand, maintain, and evolve. Rather than focusing on learning more languages, it emphasizes writing code with clarity, simplicity, and structure—traits observed in experienced engineers' work. The core message is to make the next change easier for developers.

1. Keep the Main Path Easy to Follow
Complex nested conditions can bury the core logic, making the code harder to read and maintain. Instead, guard clauses or early returns should be used to surface errors or edge cases upfront, making the primary function flow clear.

Avoid deep nesting of conditional checks.
Validate failure conditions early and return immediately.
Let the main successful operation remain visible and uncluttered.
2. Name Things by Meaning
Using vague, generic names like data or item obscures code intent and harms readability. Naming variables and functions according to their specific business meaning reduces cognitive load and eliminates guesswork.

Use descriptive names that reflect real-world concepts (e.g., pendingOrder).
Avoid overly long names, but make key concepts immediately clear.
Let function names clearly state their purpose (e.g., processOrder).
3. Keep External Systems Behind a Boundary
Applications often integrate with third-party APIs or external services whose interfaces can change unexpectedly. Directly depending on external field names spreads fragility throughout your code.

Isolate external dependencies behind a translation or adapter layer.
Map external data into internal models with application-specific names.
Handle changes in external services centrally, avoiding widespread changes.
This containment limits ripple effects from outside changes.
4. Make Invalid States Harder to Represent
Using models where fields are mostly optional shifts validation responsibility everywhere in the code and increases errors.

Define types or classes that accurately capture valid states (e.g., PaidOrder requiring order ID and payment ID).
Use types to enforce the presence of necessary data at compile-time or design-time.
This approach reduces runtime validation checks and clarifies assumptions for all consumers of the model.
5. Separate Decisions from Actions
Combining business rules and side effects (database access, emails) makes core decisions hard to isolate and test.

Extract decision logic into pure functions that return eligibility or permission status.
Trigger side effects only after decisions are made.
This separation:
Simplifies testing business rules independently.
Enhances readability by clarifying policy vs implementation.
Common use cases include permissions, pricing, validation, retries, and notifications.
6. Make Errors Useful
Generic error messages offer little help in debugging or automated handling. Errors should provide machine-readable codes alongside human-readable messages.

Aspect	Poor Example	Improved Example
Message	"Something went wrong."	"Payment processing failed: 402"
Machine Readable	None	Error codes or enums
Contextual Info	None	Include relevant debugging details (without sensitive data)
Use error codes or structured error objects for predictable, systematic handling.
Include contextual information helpful for diagnosis.
Never log sensitive data such as passwords or tokens in errors.
7. Keep Your Changes Focused
Large, mixed pull requests are difficult to review and debug. Focused, atomic changes improve maintainability and collaboration.

Separate features, refactors, and bug fixes into distinct PRs.
Each change should have a clear, singular purpose.
Benefits include easier reviews, testing, debugging, rollback, and clearer history.
Emphasizes the idea that software quality depends on managing change over time, not just the initial version.



## `$state`

Only use the `$state` rune for variables that should be _reactive_ — in other words, variables that cause an `$effect`, `$derived` or template expression to update. Everything else can be a normal variable.

Objects and arrays (`$state({...})` or `$state([...])`) are made deeply reactive, meaning mutation will trigger updates. This has a trade-off: in exchange for fine-grained reactivity, the objects must be proxied, which has performance overhead. In cases where you're dealing with large objects that are only ever reassigned (rather than mutated), use `$state.raw` instead. This is often the case with API responses, for example.

## `$derived`

To compute something from state, use `$derived` rather than `$effect`:

```js
// @errors: 2451
let num = 0;
// ---cut---
// do this
let square = $derived(num * num);

// don't do this
let square;

$effect(() => {
	square = num * num;
});
```

> [!NOTE] `$derived` is given an expression, _not_ a function. If you need to use a function (because the expression is complex, for example) use `$derived.by`.

Deriveds are writable — you can assign to them, just like `$state`, except that they will re-evaluate when their expression changes.

If the derived expression is an object or array, it will be returned as-is — it is _not_ made deeply reactive. You can, however, use `$state` inside `$derived.by` in the rare cases that you need this.

## `$effect`

Effects are an escape hatch and should mostly be avoided. In particular, avoid updating state inside effects.

- If you need to sync state to an external library such as D3, it is often neater to use [`{@attach ...}`](@attach)
- If you need to run some code in response to user interaction, put the code directly in an event handler or use a [function binding](bind#Function-bindings) as appropriate
- If you need to log values for debugging purposes, use [`$inspect`]($inspect)
- If you need to observe something external to Svelte, use [`createSubscriber`](svelte-reactivity#createSubscriber)

Never wrap the contents of an effect in `if (browser) {...}` or similar — effects do not run on the server.

## `$props`

Treat props as though they will change. For example, values that depend on props should usually use `$derived`:

```js
// @errors: 2451
let { type } = $props();

// do this
let color = $derived(type === 'danger' ? 'red' : 'green');

// don't do this — `color` will not update if `type` changes
let color = type === 'danger' ? 'red' : 'green';
```

## `$inspect.trace`

`$inspect.trace` is a debugging tool for reactivity. If something is not updating properly or running more than it should you can add `$inspect.trace(label)` as the first line of an `$effect` or `$derived.by` (or any function they call) to trace their dependencies and discover which one triggered an update.

## Events

Any element attribute starting with `on` is treated as an event listener:

```svelte
<button onclick={() => {...}}>click me</button>

<!-- attribute shorthand also works -->
<button {onclick}>...</button>

<!-- so do spread attributes -->
<button {...props}>...</button>
```

If you need to attach listeners to `window` or `document` you can use `<svelte:window>` and `<svelte:document>`:

```svelte
<svelte:window onkeydown={...} />
<svelte:document onvisibilitychange={...} />
```

Avoid using `onMount` or `$effect` for this.

## Snippets

[Snippets](snippet) are a way to define reusable chunks of markup that can be instantiated with the [`{@render ...}`](@render) tag, or passed to components as props. They must be declared within the template.

```svelte
{#snippet greeting(name)}
  <p>hello {name}!</p>
{/snippet}

{@render greeting('world')}
```

> [!NOTE] Snippets declared at the top level of a component (i.e. not inside elements or blocks) can be referenced inside `<script>`. A snippet that doesn't reference component state is also available in a `<script module>`, in which case it can be exported for use by other components.

## Each blocks

Prefer to use [keyed each blocks](each#Keyed-each-blocks) — this improves performance by allowing Svelte to surgically insert or remove items rather than updating the DOM belonging to existing items.

> [!NOTE] The key _must_ uniquely identify the object. Do not use the index as a key.

Avoid destructuring if you need to mutate the item (with something like `bind:value={item.count}`, for example).

## Using JavaScript variables in CSS

If you have a JS variable that you want to use inside CSS you can set a CSS custom property with the `style:` directive.

```svelte
<div style:--columns={columns}>...</div>
```

You can then reference `var(--columns)` inside the component's `<style>`.

## Styling child components

The CSS in a component's `<style>` is scoped to that component. If a parent component needs to control the child's styles, the preferred way is to use CSS custom properties:

```svelte
<!-- Parent.svelte -->
<Child --color="red" />

<!-- Child.svelte -->
<h1>Hello</h1>

<style>
	h1 {
		color: var(--color);
	}
</style>
```

If this is impossible (for example, the child component comes from a library) you can use `:global` to override styles:

```svelte
<div>
	<Child />
</div>

<style>
	div :global {
		h1 {
			color: red;
		}
	}
</style>
```

## Context

Consider using context instead of declaring state in a shared module. This will scope the state to the part of the app that needs it, and eliminate the possibility of it leaking between users when server-side rendering.

Use `createContext` rather than `setContext` and `getContext`, as it provides type safety.

## Async Svelte

If using version 5.36 or higher, you can use [await expressions](await-expressions) and [hydratable](hydratable) to use promises directly inside components. Note that these require the `experimental.async` option to be enabled in `svelte.config.js` as they are not yet considered fully stable.

## Avoid legacy features

Always use runes mode for new code, and avoid features that have more modern replacements:

- use `$state` instead of implicit reactivity (e.g. `let count = 0; count += 1`)
- use `$derived` and `$effect` instead of `$:` assignments and statements (but only use effects when there is no better solution)
- use `$props` instead of `export let`, `$$props` and `$$restProps`
- use `onclick={...}` instead of `on:click={...}`
- use `{#snippet ...}` and `{@render ...}` instead of `<slot>` and `$$slots` and `<svelte:fragment>`
- use `<DynamicComponent>` instead of `<svelte:component this={DynamicComponent}>`
- use `import Self from './ThisComponent.svelte'` and `<Self>` instead of `<svelte:self>`
- use classes with `$state` fields to share reactivity between components, instead of using stores
- use `{@attach ...}` instead of `use:action`
- use clsx-style arrays and objects in `class` attributes, instead of the `class:` directive