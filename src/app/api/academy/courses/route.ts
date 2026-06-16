import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { ensureAcademySeeded } from "@/lib/academySeed";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await ensureAcademySeeded();

  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: {
      lessons: { select: { id: true }, orderBy: { order: "asc" } },
      enrollments: { where: { userId: user.id }, select: { enrolledAt: true, completedAt: true } },
      certificates: { where: { userId: user.id }, select: { certificateCode: true, issuedAt: true } },
    },
  });

  const completedLessonIds = await prisma.lessonProgress.findMany({
    where: { userId: user.id },
    select: { lessonId: true },
  });
  const completedSet = new Set(completedLessonIds.map(p => p.lessonId));

  const result = courses.map(c => {
    const enrolled = c.enrollments.length > 0;
    const totalLessons = c.lessons.length;
    const doneLessons = c.lessons.filter(l => completedSet.has(l.id)).length;
    const progress = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
    const cert = c.certificates[0] ?? null;
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      thumbnail: c.thumbnail,
      duration: c.duration,
      level: c.level,
      category: c.category,
      instructor: c.instructor,
      free: c.free,
      lessonCount: totalLessons,
      enrolled,
      completedAt: c.enrollments[0]?.completedAt ?? null,
      progress,
      doneLessons,
      certificate: cert ? { code: cert.certificateCode, issuedAt: cert.issuedAt } : null,
    };
  });

  return Response.json(result);
}
