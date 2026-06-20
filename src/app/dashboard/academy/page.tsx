"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

type CourseCard = {
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
  completedAt: string | null;
  certificate: { code: string; issuedAt: string } | null;
};

const LEVEL_COLOR: Record<string, string> = {
  BEGINNER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  INTERMEDIATE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  ADVANCED: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
};

const LEVEL_EMOJI: Record<string, string> = {
  BEGINNER: "🌱",
  INTERMEDIATE: "⚡",
  ADVANCED: "🔥",
};

const CATEGORY_EMOJI: Record<string, string> = {
  Fundamentals: "📘",
  Operations: "⚙️",
  Technical: "🔬",
  General: "📚",
};

export default function AcademyPage() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/academy/courses", { credentials: "include" })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCourses(data); else setError("Failed to load courses"); })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse space-y-3">
              <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded-lg mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-rose-600">{error}</div>;
  }

  const totalCompleted = courses.filter(c => c.completedAt).length;
  const totalEnrolled = courses.filter(c => c.enrolled).length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("academyTitle")}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {t("academySubtitle")}
          </p>
        </div>
        {totalEnrolled > 0 && (
          <div className="flex gap-4 text-center">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg px-4 py-2">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalEnrolled}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("enrolledLabel")}</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-4 py-2">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{totalCompleted}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("completedCourses")}</div>
            </div>
          </div>
        )}
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {courses.map(course => (
          <div
            key={course.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Card header band */}
            <div className={`h-2 ${course.completedAt ? "bg-emerald-500" : course.enrolled ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`} />

            <div className="p-6 flex flex-col flex-1 gap-4">
              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLOR[course.level] ?? "bg-slate-100 text-slate-600"}`}>
                  {LEVEL_EMOJI[course.level]} {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {CATEGORY_EMOJI[course.category] ?? "📚"} {course.category}
                </span>
                {course.free && (
                  <span className="text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 rounded-full ml-auto">
                    FREE
                  </span>
                )}
              </div>

              {/* Title & description */}
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">{course.title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">{course.description}</p>
              </div>

              {/* Stats */}
              <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>📖 {course.lessonCount} {t("lessonsCount")}</span>
                <span>⏱ {course.duration} min</span>
                <span>👤 {course.instructor}</span>
              </div>

              {/* Progress bar (enrolled) */}
              {course.enrolled && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{course.doneLessons}/{course.lessonCount} {t("lessonsCount")}</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${course.completedAt ? "bg-emerald-500" : "bg-blue-500"}`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Certificate */}
              {course.certificate && (
                <Link
                  href={`/verify/${course.certificate.code}`}
                  target="_blank"
                  className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t("certificateEarned")}
                </Link>
              )}

              {/* CTA */}
              <div className="mt-auto pt-2">
                <Link
                  href={`/dashboard/academy/${course.id}`}
                  className={`block w-full text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    course.completedAt
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : course.enrolled
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  }`}
                >
                  {course.completedAt ? t("reviewCourse") : course.enrolled ? (course.progress > 0 ? t("continueCourse") : t("startLearning")) : t("enrollFree")}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
