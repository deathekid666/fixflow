import { Prisma } from "@prisma/client";

/**
 * Wraps a Next.js route handler so any thrown error becomes a JSON error
 * response instead of crashing to Next's generic HTML 500 page.
 */
export function withApiError<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>): (...args: Args) => Promise<Response> {
  return (async (...args: Args) => {
    const req = args[0] as Request | undefined;
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof SyntaxError) {
        return Response.json({ error: "Invalid JSON request" }, { status: 400 });
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        if (err.code === "P2002") {
          return Response.json({ error: "A record with this value already exists" }, { status: 409 });
        }
      }
      console.error(`[api] ${req?.method ?? "UNKNOWN"} request failed`, err instanceof Error ? err.name : "UnknownError");
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
