"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { mdToHtml } from "@/lib/markdown";
import { useLanguage } from "@/context/LanguageContext";

type OutlineItem = { id: string; title: string; order: number; completed: boolean };

type LessonData = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  content: string;
  videoUrl: string | null;
  duration: number;
  order: number;
  completed: boolean;
  enrolled: boolean;
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
  courseOutline: OutlineItem[];
};

export default function LessonPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "info" } | null>(null);
  const [certCode, setCertCode] = useState<string | null>(null);

  const fetchLesson = useCallback(() => {
    setLoading(true);
    fetch(`/api/academy/lessons/${lessonId}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (!data.error) setLesson(data);
      })
      .finally(() => setLoading(false));
  }, [lessonId]);

  useEffect(() => { fetchLesson(); }, [fetchLesson]);

  function showToast(msg: string, type: "success" | "info" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function markComplete() {
    if (!lesson || marking) return;
    setMarking(true);
    try {
      const r = await fetch(`/api/academy/lessons/${lessonId}/complete`, { method: "POST", credentials: "include" });
      const data = await r.json();
      if (r.ok) {
        setLesson(prev => prev ? { ...prev, completed: true } : prev);
        if (data.courseCompleted && data.certificate) {
          setCertCode(data.certificate.code);
          showToast("🎉 Course completed! Certificate earned.", "success");
        } else {
          showToast("Lesson marked complete!", "success");
          if (lesson.next) {
            setTimeout(() => router.push(`/dashboard/academy/${courseId}/${lesson.next!.id}`), 1000);
          }
        }
      }
    } finally {
      setMarking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full">
        <div className="hidden lg:block w-64 border-r border-slate-200 dark:border-slate-700 animate-pulse p-4 space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-slate-200 dark:bg-slate-700 rounded" />)}
        </div>
        <div className="flex-1 p-6 space-y-4 animate-pulse">
          <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (!lesson) return <div className="p-6 text-rose-600">{t("lessonNotFound")}</div>;

  const htmlContent = mdToHtml(lesson.content);

  return (
    <div className="flex h-full min-h-screen relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${toast.type === "success" ? "bg-emerald-600" : "bg-blue-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Course Outline Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-40 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <Link href={`/dashboard/academy/${courseId}`} className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 truncate">
            ← {lesson.courseTitle}
          </Link>
          <button className="lg:hidden text-slate-400 hover:text-slate-600 ml-2" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {lesson.courseOutline.map((item, idx) => (
            <Link
              key={item.id}
              href={`/dashboard/academy/${courseId}/${item.id}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${
                item.id === lessonId
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                item.completed
                  ? "bg-emerald-500 text-white"
                  : item.id === lessonId
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}>
                {item.completed ? "✓" : idx + 1}
              </span>
              <span className="truncate">{item.title}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{lesson.courseTitle}</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{lesson.title}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">⏱ {lesson.duration} min</span>
            {lesson.completed ? (
              <span className="text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2.5 py-1 rounded-full">
                ✓ Completed
              </span>
            ) : (
              <button
                onClick={markComplete}
                disabled={marking}
                className="text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {marking ? t("markCompleteSaving") : t("markComplete")}
              </button>
            )}
          </div>
        </div>

        {/* Lesson Body */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          {/* Video embed */}
          {lesson.videoUrl && (() => {
            const url = lesson.videoUrl!;
            // YouTube: watch?v= or youtu.be/
            const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
            if (ytMatch) {
              return (
                <div className="mb-8 aspect-video rounded-xl overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              );
            }
            // Vimeo
            const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
            if (vimeoMatch) {
              return (
                <div className="mb-8 aspect-video rounded-xl overflow-hidden">
                  <iframe
                    src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              );
            }
            // Direct video file
            if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
              return (
                <div className="mb-8 aspect-video rounded-xl overflow-hidden bg-black">
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video src={url} controls className="w-full h-full" />
                </div>
              );
            }
            // Generic iframe fallback
            return (
              <div className="mb-8 aspect-video rounded-xl overflow-hidden">
                <iframe src={url} className="w-full h-full" allowFullScreen />
              </div>
            );
          })()}

          {/* Certificate earned banner */}
          {certCode && (
            <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="font-semibold text-emerald-800 dark:text-emerald-300">🏆 Course Complete!</div>
                <div className="text-sm text-emerald-700 dark:text-emerald-400">Your certificate is ready</div>
              </div>
              <Link
                href={`/verify/${certCode}`}
                target="_blank"
                className="text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {t("viewCertificate")}
              </Link>
            </div>
          )}

          {/* Markdown Content */}
          <div
            className="prose prose-slate dark:prose-invert max-w-none
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:dark:text-white [&_h1]:mb-4 [&_h1]:mt-0
              [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:dark:text-white [&_h2]:mt-8 [&_h2]:mb-3
              [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:dark:text-white [&_h3]:mt-6 [&_h3]:mb-2
              [&_p]:text-slate-700 [&_p]:dark:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-4
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul_li]:text-slate-700 [&_ul_li]:dark:text-slate-300 [&_ul_li]:mb-1
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol_li]:text-slate-700 [&_ol_li]:dark:text-slate-300 [&_ol_li]:mb-1
              [&_strong]:font-semibold [&_strong]:text-slate-900 [&_strong]:dark:text-white
              [&_code]:bg-slate-100 [&_code]:dark:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_code]:text-blue-600 [&_code]:dark:text-blue-400
              [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:dark:text-slate-400 [&_blockquote]:my-4
              [&_hr]:border-slate-200 [&_hr]:dark:border-slate-700 [&_hr]:my-6
              [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:hover:underline
              [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse [&_table]:mb-4
              [&_th]:bg-slate-100 [&_th]:dark:bg-slate-800 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium [&_th]:border [&_th]:border-slate-200 [&_th]:dark:border-slate-700
              [&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-slate-200 [&_td]:dark:border-slate-700"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Navigation */}
          <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
            {lesson.prev ? (
              <Link
                href={`/dashboard/academy/${courseId}/${lesson.prev.id}`}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ← {lesson.prev.title}
              </Link>
            ) : (
              <div />
            )}
            {lesson.next ? (
              <Link
                href={`/dashboard/academy/${courseId}/${lesson.next.id}`}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {lesson.next.title} →
              </Link>
            ) : lesson.completed ? (
              <Link
                href={`/dashboard/academy/${courseId}`}
                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {t("backToCourse")}
              </Link>
            ) : (
              <button
                onClick={markComplete}
                disabled={marking}
                className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {marking ? t("markCompleteSaving") : t("markCompleteFinish")}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
