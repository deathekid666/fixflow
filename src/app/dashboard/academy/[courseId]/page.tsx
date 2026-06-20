"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

type LessonItem = { id: string; title: string; duration: number; order: number; completed: boolean };

type CourseDetail = {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  instructor: string;
  duration: number;
  lessonCount: number;
  free: boolean;
  enrolled: boolean;
  progress: number;
  doneLessons: number;
  totalLessons: number;
  completedAt: string | null;
  certificate: { code: string; issuedAt: string } | null;
  lessons: LessonItem[];
};

const LEVEL_COLOR: Record<string, string> = {
  BEGINNER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  INTERMEDIATE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  ADVANCED: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
};

export default function CourseDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/academy/courses/${courseId}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setCourse(data);
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [courseId]);

  async function handleEnroll() {
    setEnrolling(true);
    try {
      const r = await fetch(`/api/academy/courses/${courseId}/enroll`, { method: "POST", credentials: "include" });
      if (r.ok) {
        setCourse(prev => prev ? { ...prev, enrolled: true } : prev);
        // Navigate to first lesson
        if (course?.lessons[0]) router.push(`/dashboard/academy/${courseId}/${course.lessons[0].id}`);
      }
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse max-w-3xl mx-auto">
        <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    );
  }

  if (error || !course) {
    return <div className="p-6 text-rose-600">{error || t("courseNotFound")}</div>;
  }

  const firstIncomplete = course.lessons.find(l => !l.completed);
  const nextLesson = firstIncomplete ?? course.lessons[0];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/dashboard/academy" className="hover:text-slate-700 dark:hover:text-slate-200">Academy</Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-200">{course.title}</span>
      </div>

      {/* Course Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLOR[course.level] ?? ""}`}>
                {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{course.category}</span>
              {course.free && (
                <span className="text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                  FREE
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{course.title}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">{course.description}</p>
          </div>
        </div>

        <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
          <span>📖 {course.totalLessons} lessons</span>
          <span>⏱ {course.duration} {t("totalMinutes")}</span>
          <span>👤 {course.instructor}</span>
        </div>

        {/* Progress */}
        {course.enrolled && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>{course.doneLessons} of {course.totalLessons} lessons completed</span>
              <span className="font-medium">{course.progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${course.completedAt ? "bg-emerald-500" : "bg-blue-500"}`}
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Certificate */}
        {course.certificate && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
              🏆 {t("certOfCompletion")}
            </div>
            <Link
              href={`/verify/${course.certificate.code}`}
              target="_blank"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {t("viewCertificate")}
            </Link>
          </div>
        )}

        {/* CTA */}
        {!course.enrolled ? (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-60"
          >
            {enrolling ? t("enrolling") : t("enrollFree")}
          </button>
        ) : nextLesson ? (
          <Link
            href={`/dashboard/academy/${courseId}/${nextLesson.id}`}
            className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {course.progress > 0 && course.progress < 100 ? `Continue → ${nextLesson.title}` : `Start: ${nextLesson.title}`}
          </Link>
        ) : null}
      </div>

      {/* Lesson List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">{t("courseContent")}</h2>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {course.lessons.map((lesson, idx) => {
            const accessible = course.enrolled;
            const content = (
              <div className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                  lesson.completed
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}>
                  {lesson.completed ? "✓" : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{lesson.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{lesson.duration} min</div>
                </div>
                {accessible && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 flex-shrink-0">
                    {lesson.completed ? "Review" : "Start"} →
                  </span>
                )}
                {!accessible && (
                  <span className="text-xs text-slate-400">🔒</span>
                )}
              </div>
            );

            return (
              <li key={lesson.id}>
                {accessible ? (
                  <Link href={`/dashboard/academy/${courseId}/${lesson.id}`}>{content}</Link>
                ) : (
                  <div>{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
