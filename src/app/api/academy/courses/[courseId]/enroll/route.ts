import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { courseId: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const course = await prisma.course.findUnique({ where: { id: params.courseId, published: true } });
  if (!course) return Response.json({ error: "Course not found" }, { status: 404 });

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId: params.courseId } },
    create: { userId: user.id, courseId: params.courseId },
    update: {},
  });

  return Response.json({ enrolled: true, enrolledAt: enrollment.enrolledAt });
}
