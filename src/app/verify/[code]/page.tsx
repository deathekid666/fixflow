import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Fundamentals",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export default async function VerifyCertificatePage({ params }: { params: { code: string } }) {
  const cert = await prisma.academyCertificate.findUnique({
    where: { certificateCode: params.code },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true, level: true, duration: true } },
    },
  });

  if (!cert) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-5xl">❌</div>
          <h1 className="text-xl font-bold text-slate-900">Certificate Not Found</h1>
          <p className="text-slate-500">No certificate exists for code <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm">{params.code}</code></p>
          <Link href="/" className="text-blue-600 hover:underline text-sm">← Go to FixFlow</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Certificate Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Top band */}
          <div className="h-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <div className="px-8 py-10 text-center space-y-6">
            {/* Badge */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-4xl shadow-lg">
                🏆
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-2">
                Certificate of Completion
              </div>
              <div className="text-slate-500 text-sm">This certifies that</div>
              <div className="text-3xl font-bold text-slate-900 mt-1">{cert.user.name}</div>
              <div className="text-slate-500 text-sm mt-2">has successfully completed</div>
            </div>

            {/* Course */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-xl font-bold text-slate-900">{cert.course.title}</div>
              <div className="flex items-center justify-center gap-3 mt-2 text-sm text-slate-500">
                <span>📚 {LEVEL_LABEL[cert.course.level] ?? cert.course.level}</span>
                <span>·</span>
                <span>⏱ {cert.course.duration} minutes</span>
              </div>
            </div>

            {/* Date */}
            <div className="text-slate-500 text-sm">
              Issued on <span className="font-medium text-slate-700">{formatDate(new Date(cert.issuedAt))}</span>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200" />

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">F</div>
                <span>Issued by FixFlow Academy</span>
              </div>
              <div className="font-mono">{cert.certificateCode}</div>
            </div>

            {/* Verified badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-2 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Verified authentic
            </div>
          </div>

          {/* Bottom band */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link href="/dashboard/academy" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← FixFlow Academy
          </Link>
        </div>
      </div>
    </div>
  );
}
