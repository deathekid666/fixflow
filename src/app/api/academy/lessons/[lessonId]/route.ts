import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { lessonId: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    include: { course: { select: { id: true, title: true, lessons: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true } } } } },
  });

  if (!lesson) return Response.json({ error: "Not found" }, { status: 404 });

  const completed = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId: params.lessonId } },
  });

  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } },
  });

  const completedLessonIds = await prisma.lessonProgress.findMany({
    where: { userId: user.id, lessonId: { in: lesson.course.lessons.map(l => l.id) } },
    select: { lessonId: true },
  });
  const completedSet = new Set(completedLessonIds.map(p => p.lessonId));

  const sortedLessons = lesson.course.lessons;
  const currentIndex = sortedLessons.findIndex(l => l.id === params.lessonId);
  const prev = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
  const next = currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null;

  return Response.json({
    id: lesson.id,
    courseId: lesson.courseId,
    courseTitle: lesson.course.title,
    title: lesson.title,
    content: lesson.content,
    videoUrl: lesson.videoUrl,
    duration: lesson.duration,
    order: lesson.order,
    completed: !!completed,
    enrolled: !!enrolled,
    prev: prev ? { id: prev.id, title: prev.title } : null,
    next: next ? { id: next.id, title: next.title } : null,
    courseOutline: sortedLessons.map(l => ({ id: l.id, title: l.title, order: l.order, completed: completedSet.has(l.id) })),
  });
}
