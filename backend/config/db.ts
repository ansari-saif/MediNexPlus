import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
import { recordDbQueryMetrics } from "../../src/lib/observability/metrics";

const SLOW_QUERY_MS = 500;

const prismaClientSingleton = () => {
  const base = new PrismaClient();

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

logger.info({ module: "prisma" }, "Prisma instance initialized");

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
