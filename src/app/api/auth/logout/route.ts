import { NextResponse } from "next/server";

import { withApiError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

export const POST = withApiError(async () => {
  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
});