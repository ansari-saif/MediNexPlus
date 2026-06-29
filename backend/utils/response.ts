import { NextResponse } from "next/server";
import { logger } from "./logger";

export const successResponse = (data: unknown, message: string = "Success", status: number = 200) => {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
};

export const errorResponse = (message: string = "Internal Server Error", status: number = 500, errors?: unknown) => {
  const logFields = { status, message, module: "response" };
  if (status >= 500) {
    logger.error(logFields, "api.error");
  } else if (status >= 400) {
    logger.warn(logFields, "api.client_error");
  }

  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { status }
  );
};

export const validationErrorResponse = (errors: unknown) => {
  logger.warn({ status: 400, module: "response" }, "api.validation_error");
  return NextResponse.json(
    {
      success: false,
      message: "Validation Error",
      errors,
    },
    { status: 400 }
  );
};
