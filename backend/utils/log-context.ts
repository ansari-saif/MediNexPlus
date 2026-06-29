import { AsyncLocalStorage } from "async_hooks";

export type LogContext = {
  requestId?: string;
  traceId?: string;
  hospitalId?: string;
  userId?: string;
  role?: string;
  route?: string;
  module?: string;
};

export const logContextStorage = new AsyncLocalStorage<LogContext>();

export function runWithLogContext<T>(ctx: LogContext, fn: () => T): T {
  const parent = logContextStorage.getStore();
  return logContextStorage.run({ ...parent, ...ctx }, fn);
}

export function setLogContext(ctx: Partial<LogContext>): void {
  const store = logContextStorage.getStore();
  if (store) {
    Object.assign(store, ctx);
  }
}

export function getLogContext(): LogContext | undefined {
  return logContextStorage.getStore();
}
