import { NextRequest } from "next/server";
import { verifyToken } from "../utils/jwt";
import { errorResponse } from "../utils/response";
import { getSessionToken, SessionPortal } from "../utils/session-cookie";
import { runWithLogContext, setLogContext } from "../utils/log-context";

export const authMiddleware = async (req: NextRequest, portal: SessionPortal = "default") => {
  return runWithLogContext({}, async () => {
    try {
      const authHeader = req.headers.get("authorization");
      let token = "";

      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      } else {
        token = getSessionToken(req, portal);
      }

      if (!token) {
        return { user: null, error: errorResponse("Unauthorized", 401) };
      }

      const payload = verifyToken(token);
      if (!payload) {
        return { user: null, error: errorResponse("Invalid token", 401) };
      }

      setLogContext({
        userId: payload.userId as string | undefined,
        hospitalId: payload.hospitalId as string | undefined,
        role: payload.role as string | undefined,
      });

      return { user: payload, error: null };
    } catch {
      return { user: null, error: errorResponse("Unauthorized", 401) };
    }
  });
};
