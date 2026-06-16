import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { courseId: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      lessons: { orderBy: { order: "asc" }, select: { id: true, title: true, duration: true, order: true } },
      enrollments: { where: { userId: user.id } },
      certificates: { where: { userId: user.id }, select: { certificateCode: true, issuedAt: true } },
    },
  });

  if (!course || !course.published) return Response.json({ error: "Not found" }, { status: 404 });

  const completedLessons = await prisma.lessonProgress.findMany({
    where: { userId: user.id, lessonId: { in: course.lessons.map(l => l.id) } },
    select: { lessonId: true },
  });
  const completedSet = new Set(completedLessons.map(p => p.lessonId));

  const enrolled = course.enrollments.length > 0;
  const totalLessons = course.lessons.length;
  const doneLessons = course.lessons.filter(l => completedSet.has(l.id)).length;
  const progress = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const cert = course.certificates[0] ?? null;

  return Response.json({
    id: course.id,
    title: course.title,
    description: course.description,
    level: course.level,
    category: course.category,
    instructor: course.instructor,
    duration: course.duration,
    free: course.free,
    enrolled,
    progress,
    doneLessons,
    totalLessons,
    certificate: cert ? { code: cert.certificateCode, issuedAt: cert.issuedAt } : null,
    lessons: course.lessons.map(l => ({
      id: l.id,
      title: l.title,
      duration: l.duration,
      order: l.order,
      completed: completedSet.has(l.id),
    })),
  });
}
