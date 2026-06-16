import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const cert = await prisma.academyCertificate.findUnique({
    where: { certificateCode: params.code },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true, level: true, duration: true } },
    },
  });

  if (!cert) return Response.json({ error: "Certificate not found" }, { status: 404 });

  return Response.json({
    code: cert.certificateCode,
    issuedAt: cert.issuedAt,
    recipientName: cert.user.name,
    courseTitle: cert.course.title,
    courseLevel: cert.course.level,
    courseDuration: cert.course.duration,
  });
}
