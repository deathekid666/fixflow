"use client";

import { useEffect, useRef } from "react";

const TOUR_KEY_PREFIX = "fixflow_tour_v1_";

export function getTourKey(userId: string) {
  return `${TOUR_KEY_PREFIX}${userId}`;
}

export function markTourDone(userId: string) {
  try { localStorage.setItem(getTourKey(userId), "done"); } catch { /* noop */ }
}

export function resetTour(userId: string) {
  try { localStorage.removeItem(getTourKey(userId)); } catch { /* noop */ }
}

export function isTourDone(userId: string) {
  try { return !!localStorage.getItem(getTourKey(userId)); } catch { return false; }
}

interface Props {
  userId: string;
  userRole: string;
}

export default function OnboardingTour({ userId, userRole }: Props) {
  const started = useRef(false);

  function buildSteps(isAdmin: boolean) {
    return [
      {
        element: "#tour-step-dashboard",
        popover: {
          title: "👋 Welcome to FixFlow!",
          description:
            "You're all set! This is your repair shop dashboard. Let's take a 60-second tour so you feel right at home.",
          side: "right" as const,
          align: "start" as const,
        },
      },
      {
        element: "#tour-step-workorders",
        popover: {
          title: "📋 Create your first work order",
          description:
            "Every repair job starts here. Track device intake, status, photos, technician notes, parts used, and collect payment — all in one place.",
          side: "right" as const,
          align: "start" as const,
        },
      },
      {
        element: "#tour-step-spareparts",
        popover: {
          title: "🔧 Track your inventory",
          description:
            "Manage spare parts with cost tracking, low-stock alerts, and auto-deduction when parts are used on a repair job.",
          side: "right" as const,
          align: "start" as const,
        },
      },
      ...(isAdmin
        ? [
            {
              element: "#tour-step-analytics",
              popover: {
                title: "📊 See your analytics",
                description:
                  "Revenue charts, profit margins, engineer performance, and expense tracking. Know exactly how your shop is doing at a glance.",
                side: "right" as const,
                align: "start" as const,
              },
            },
            {
              element: "#tour-step-engineers",
              popover: {
                title: "👥 Invite your team",
                description:
                  "Add engineers, assign repairs, track turnaround time, and auto-calculate monthly commissions.",
                side: "right" as const,
                align: "start" as const,
              },
            },
          ]
        : []),
      {
        element: "#tour-step-settings",
        popover: {
          title: "⚙️ Set up your shop",
          description:
            "Add your shop name, logo, address, and currency. You can also configure SMS/WhatsApp notifications and invite team members here.",
          side: "right" as const,
          align: "start" as const,
        },
      },
      {
        popover: {
          title: "🎉 You're ready!",
          description:
            "That's the tour! Head to Work Orders and create your first repair job to get started. You can replay this tour anytime from Settings.",
        },
      },
    ];
  }

  async function startTour() {
    if (started.current) return;
    started.current = true;

    // Dynamically import to avoid SSR issues
    const [{ driver }, confetti] = await Promise.all([
      import("driver.js"),
      import("canvas-confetti"),
    ]);

    const isAdmin = userRole === "ADMIN";
    const steps = buildSteps(isAdmin);
    const totalSteps = steps.length;

    const driverObj = driver({
      showProgress: false,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayColor: "rgba(0,0,0,0.55)",
      stagePadding: 6,
      stageRadius: 10,
      popoverClass: "fixflow-tour-popover",
      steps,

      onPopoverRender(popoverEl, { state }) {
        // Inject progress dots
        const currentIndex = state.activeIndex ?? 0;
        const dots = document.createElement("div");
        dots.className = "tour-dots";
        dots.style.cssText =
          "display:flex;gap:5px;justify-content:center;margin-top:12px;";
        for (let i = 0; i < totalSteps; i++) {
          const dot = document.createElement("span");
          dot.style.cssText = `
            width:6px;height:6px;border-radius:50%;transition:all .2s;
            background:${i === currentIndex ? "#3b82f6" : "rgba(255,255,255,0.25)"};
            transform:${i === currentIndex ? "scale(1.4)" : "scale(1)"};
          `;
          dots.appendChild(dot);
        }
        const footer = popoverEl.footerButtons;
        if (footer) footer.after(dots);
      },

      onDestroyStarted() {
        markTourDone(userId);
        started.current = false;

        // Final step confetti
        const isLastStep =
          driverObj.getActiveIndex() === totalSteps - 1 ||
          !driverObj.hasNextStep();
        if (isLastStep) {
          driverObj.destroy();
          const fire = confetti.default ?? confetti;
          fire({ particleCount: 120, spread: 80, origin: { y: 0.55 } });
          setTimeout(() => fire({ particleCount: 60, spread: 120, origin: { y: 0.4 }, angle: 60 }), 250);
          setTimeout(() => fire({ particleCount: 60, spread: 120, origin: { y: 0.4 }, angle: 120 }), 500);
          return false;
        }
      },

      onDestroyed() {
        markTourDone(userId);
        started.current = false;
      },
    });

    driverObj.drive();
  }

  useEffect(() => {
    if (!userId) return;

    // Auto-start for new users
    const delay = setTimeout(() => {
      if (!isTourDone(userId)) startTour();
    }, 800);

    // Listen for manual replay
    function onReplay() {
      started.current = false;
      startTour();
    }
    window.addEventListener("fixflow:start-tour", onReplay);

    return () => {
      clearTimeout(delay);
      window.removeEventListener("fixflow:start-tour", onReplay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return null;
}
