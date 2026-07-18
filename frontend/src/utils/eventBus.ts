/**
 * A minimal, typed publish/subscribe event bus (Observer pattern). Used to
 * decouple engine modules from React components.
 * @module utils/eventBus
 */

/** Map of event name to payload type. Extend as features are added. */
export type EditorEvents = {
  'selection:changed': { ids: string[] };
  'project:changed': { reason: string };
  'history:changed': { canUndo: boolean; canRedo: boolean };
  'zoom:fit': undefined;
  'export:request': { format: 'png' | 'svg' | 'pdf' | 'json' | 'zip' };
  'import:request': undefined;
  'ai:open': undefined;
  'templates:open': undefined;
  'shortcuts:open': undefined;
  'welcome:open': undefined;
  'toast': { message: string; kind: 'info' | 'success' | 'error' };
};

type Handler<T> = (payload: T) => void;

/** Strongly-typed event emitter. */
export class EventBus<Events extends Record<string, unknown>> {
  private handlers = new Map<keyof Events, Set<Handler<unknown>>>();

  /** Subscribe to an event; returns an unsubscribe function. */
  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<unknown>);
    return () => set!.delete(handler as Handler<unknown>);
  }

  /** Emit an event to all subscribers. */
  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const handler of set) (handler as Handler<Events[K]>)(payload);
  }

  /** Remove all handlers (used in tests/teardown). */
  clear(): void {
    this.handlers.clear();
  }
}

/** Shared application-wide event bus instance. */
export const editorBus = new EventBus<EditorEvents>();
