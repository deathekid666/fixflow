import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

function generateCertCode(): string {
  const part = () => randomBytes(2).toString("hex").toUpperCase();
  return `FF-${part()}-${part()}-${part()}`;
}

export async function POST(req: Request, { params }: { params: { lessonId: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const lesson = await prisma.lesson.findUnique({ where: { id: params.lessonId } });
  if (!lesson) return Response.json({ error: "Not found" }, { status: 404 });

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } },
  });
  if (!enrollment) return Response.json({ error: "Not enrolled" }, { status: 403 });

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: params.lessonId } },
    create: { userId: user.id, lessonId: params.lessonId },
    update: {},
  });

  const allLessons = await prisma.lesson.findMany({ where: { courseId: lesson.courseId }, select: { id: true } });
  const completedLessons = await prisma.lessonProgress.findMany({
    where: { userId: user.id, lessonId: { in: allLessons.map(l => l.id) } },
    select: { lessonId: true },
  });

  const allDone = allLessons.every(l => completedLessons.some(p => p.lessonId === l.id));

  let certificate = null;
  if (allDone) {
    await prisma.enrollment.update({
      where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } },
      data: { completedAt: new Date() },
    });

    const existing = await prisma.academyCertificate.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } },
    });

    if (!existing) {
      let code = generateCertCode();
      let attempts = 0;
      while (attempts < 5) {
        const clash = await prisma.academyCertificate.findUnique({ where: { certificateCode: code } });
        if (!clash) break;
        code = generateCertCode();
        attempts++;
      }
      const cert = await prisma.academyCertificate.create({
        data: { userId: user.id, courseId: lesson.courseId, certificateCode: code },
      });
      certificate = { code: cert.certificateCode, issuedAt: cert.issuedAt };
    } else {
      certificate = { code: existing.certificateCode, issuedAt: existing.issuedAt };
    }
  }

  const totalLessons = allLessons.length;
  const doneLessons = Math.min(completedLessons.length + 1, totalLessons);
  const progress = Math.round((doneLessons / totalLessons) * 100);

  return Response.json({ completed: true, courseCompleted: allDone, progress, certificate });
}
