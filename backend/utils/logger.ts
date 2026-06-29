/**
 * Structured logging for MediNexPlus (PHI-safe).
 *
 * NEVER log: patient names, phones, emails, diagnoses, passwords, tokens,
 * request/response bodies on patient/billing/auth routes.
 * Metric labels must not include patientId, hospitalId, billId, or email.
 */
import pino from "pino";
import { trace, context } from "@opentelemetry/api";
import {
  logContextStorage,
  runWithLogContext,
  setLogContext,
  type LogContext,
} from "./log-context";

export type { LogContext };
export { logContextStorage, runWithLogContext, setLogContext };

/** Keys redacted from log payloads (case-insensitive match). */
const PHI_KEYS = new Set([
  "name",
  "fullname",
  "fullName",
  "patientname",
  "patientName",
  "phone",
  "mobile",
  "altcontact",
  "altContact",
  "email",
  "patientid",
  "patientId",
  "diagnosis",
  "password",
  "token",
  "accesstoken",
  "accessToken",
  "refreshtoken",
  "refreshToken",
  "otp",
  "ssn",
  "address",
  "dob",
  "dateofbirth",
  "dateOfBirth",
]);

const REDACTED = "[REDACTED]";

export type AppLogger = {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
};

function getActiveTraceId(): string | undefined {
  const span = trace.getSpan(context.active());
  if (!span) return undefined;
  return span.spanContext().traceId;
}

function mergeContext(fields?: Record<string, unknown>): Record<string, unknown> {
  const store = logContextStorage.getStore();
  const merged: Record<string, unknown> = {
    service: process.env.OTEL_SERVICE_NAME || "medinexplus-web",
    ...store,
    ...fields,
  };
  const traceId = merged.traceId ?? getActiveTraceId();
  if (traceId) merged.traceId = traceId;
  return merged;
}

export function redactPhi<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => redactPhi(item)) as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (PHI_KEYS.has(key.toLowerCase())) {
        out[key] = REDACTED;
      } else if (typeof val === "object" && val !== null) {
        out[key] = redactPhi(val);
      } else {
        out[key] = val;
      }
    }
    return out as T;
  }
  return value;
}

const baseLogger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  base: undefined,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  hooks: {
    logMethod(inputArgs, method) {
      if (inputArgs.length >= 2 && typeof inputArgs[0] === "object" && inputArgs[0] !== null) {
        inputArgs[0] = redactPhi(inputArgs[0]);
      }
      return method.apply(this, inputArgs as Parameters<typeof method>);
    },
  },
});

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { err: { type: err.name, message: err.message } };
  }
  return { detail: String(err) };
}

function writeLog(
  fn: (obj: Record<string, unknown>, msg?: string) => void,
  module: string | undefined,
  args: unknown[]
): void {
  const fields = mergeContext(module ? { module } : undefined);

  if (args.length === 0) {
    fn(fields, "log");
    return;
  }

  if (args.length === 1) {
    if (typeof args[0] === "string") {
      fn(fields, args[0]);
      return;
    }
    if (args[0] instanceof Error) {
      fn({ ...fields, ...serializeError(args[0]) }, "error");
      return;
    }
    if (typeof args[0] === "object" && args[0] !== null) {
      fn({ ...fields, ...redactPhi(args[0] as Record<string, unknown>) }, "log");
      return;
    }
    fn({ ...fields, detail: args[0] }, "log");
    return;
  }

  if (typeof args[0] === "string") {
    const msgParts = [args[0]];
    const extra: Record<string, unknown> = { ...fields };
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg instanceof Error) {
        Object.assign(extra, serializeError(arg));
      } else if (typeof arg === "object" && arg !== null) {
        Object.assign(extra, redactPhi(arg as Record<string, unknown>));
      } else {
        msgParts.push(String(arg));
      }
    }
    fn(extra, msgParts.join(" "));
    return;
  }

  if (typeof args[0] === "object" && args[0] !== null && typeof args[1] === "string") {
    fn({ ...fields, ...redactPhi(args[0] as Record<string, unknown>) }, args[1]);
    return;
  }

  fn({ ...fields, args: args.map((a) => (a instanceof Error ? a.message : String(a))) }, "log");
}

function wrapPino(pinoLogger: pino.Logger, module?: string): AppLogger {
  return {
    info: (...args: unknown[]) => writeLog(pinoLogger.info.bind(pinoLogger), module, args),
    warn: (...args: unknown[]) => writeLog(pinoLogger.warn.bind(pinoLogger), module, args),
    error: (...args: unknown[]) => writeLog(pinoLogger.error.bind(pinoLogger), module, args),
    debug: (...args: unknown[]) => writeLog(pinoLogger.debug.bind(pinoLogger), module, args),
  };
}

export const logger: AppLogger & { child: (module: string, fields?: Record<string, unknown>) => AppLogger } = {
  child(module: string, fields?: Record<string, unknown>) {
    return wrapPino(baseLogger.child(mergeContext({ module, ...fields })), module);
  },
  info: (...args: unknown[]) => writeLog(baseLogger.info.bind(baseLogger), undefined, args),
  warn: (...args: unknown[]) => writeLog(baseLogger.warn.bind(baseLogger), undefined, args),
  error: (...args: unknown[]) => writeLog(baseLogger.error.bind(baseLogger), undefined, args),
  debug: (...args: unknown[]) => writeLog(baseLogger.debug.bind(baseLogger), undefined, args),
};

export function createRequestLogger(ctx: LogContext): AppLogger {
  return wrapPino(baseLogger.child(mergeContext({ module: "api", ...ctx })), "api");
}

export default logger;
