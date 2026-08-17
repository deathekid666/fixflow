import { Prisma } from "@prisma/client";

/**
 * Wraps a Next.js route handler so any thrown error becomes a JSON error
 * response instead of crashing to Next's generic HTML 500 page.
 */
export function withApiError<T extends (...args: any[]) => Promise<Response>>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    const req: Request = args[0];
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        if (err.code === "P2002") {
          return Response.json({ error: "A record with this value already exists" }, { status: 409 });
        }
      }
      console.error(`[api] ${req.method} ${req.url}`, err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }) as T;
}
