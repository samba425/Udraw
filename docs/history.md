# History system

`state/historyStore.ts` implements unlimited undo/redo using the **Command
pattern** over immutable project snapshots. Because every `projectStore`
mutation produces a new immutable `Project`, snapshots are cheap reference copies
rather than deep clones.

## API

```ts
history.run(label, () => { /* mutate */ });  // capture → mutate → commit
history.capture();                            // snapshot baseline (drag start)
history.commit(label);                        // record if changed
history.cancel();                             // discard baseline (no-op drag)
history.undo(); history.redo(); history.clear();
```

- `run` is the common case for atomic actions (create, delete, align, group, …).
- `capture`/`commit`/`cancel` support drags where many intermediate mutations
  happen between pointer-down and pointer-up; only the net change is recorded.
- `commit` records **nothing** if the project reference is unchanged, preventing
  empty history entries.
- The stack is capped at `MAX_ENTRIES` (500) to bound memory.

## Events

Every change emits `history:changed { canUndo, canRedo }` on the Event Bus, which
the toolbar uses to enable/disable the undo/redo buttons.

## Covered operations

Move, resize, rotate, create, delete, duplicate, paste, import, group, ungroup,
reorder (z-order), lock/hide, property changes, freehand draw, erase, and AI
diagram generation — all wrapped in a single reversible step.

## Interaction with drags

`hooks/useCanvasInteractions.ts` calls `history.begin()` (capture) on
pointer-down for move/resize/rotate/create, and `history.commit()` /
`history.cancel()` on pointer-up depending on whether anything moved.
