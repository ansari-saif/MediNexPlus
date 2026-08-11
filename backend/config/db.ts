import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
import { recordDbQueryMetrics } from "../../src/lib/observability/metrics";

const SLOW_QUERY_MS = 500;

function datasourceUrl() {
  const raw = process.env.DATABASE_URL || "";
  if (!raw || /connection_limit=/i.test(raw)) return raw;
  return `${raw}${raw.includes("?") ? "&" : "?"}connection_limit=10&pool_timeout=5`;
}

const prismaClientSingleton = () => {
  logger.info({ module: "prisma" }, "Prisma instance initialized");
  const base = new PrismaClient({
    datasources: { db: { url: datasourceUrl() } },
  });

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = Date.now();
          try {
            const result = await query(args);
            const durationMs = Date.now() - start;
            recordDbQueryMetrics(model, operation, durationMs, false);
            if (durationMs > SLOW_QUERY_MS) {
              logger.warn(
                { model, operation, durationMs, module: "prisma" },
                "slow query"
              );
            }
            return result;
          } catch (err) {
            const durationMs = Date.now() - start;
            recordDbQueryMetrics(model, operation, durationMs, true);
            logger.error(
              { model, operation, durationMs, err, module: "prisma" },
              "query error"
            );
            throw err;
          }
        },
      },
    },
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
