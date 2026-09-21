// Presentation only: these switches never replace API permissions or plan limits.
// Keep routes and stored records intact so hidden tools can be restored.
export const OPTIONAL_TOOLS = [
  { key: "academy", label: "Academy", description: "Training courses and course certificates.", href: "/dashboard/academy" },
  { key: "certification", label: "Shop certification", description: "Internal shop badges and certification progress.", href: "/dashboard/certification" },
  { key: "benchmarks", label: "Industry benchmarks", description: "Comparison tab inside Analytics.", adminOnly: true },
  { key: "advancedAI", label: "Additional AI tools", description: "Morning briefing, revenue analysis, pricing and message suggestions." },
  { key: "branches", label: "Branches", description: "Multiple locations and branch filters.", href: "/dashboard/branches" },
  { key: "contracts", label: "Service contracts", description: "Recurring service agreements.", href: "/dashboard/contracts" },
  { key: "commissions", label: "Engineer commissions", description: "Commission reports and team commission settings.", href: "/dashboard/engineers/commissions", adminOnly: true },
  { key: "retailPOS", label: "Separate payment counter", description: "Optional POS screen. Payments remain available inside each repair.", href: "/dashboard/pos" },
  { key: "shifts", label: "Staff shifts", description: "Shift scheduling and time records.", href: "/dashboard/shifts" },
] as const;

export type OptionalTool = (typeof OPTIONAL_TOOLS)[number]["key"];
export type WorkspaceVisibility = Record<OptionalTool, boolean>;
export const DEFAULT_WORKSPACE = Object.fromEntries(OPTIONAL_TOOLS.map(tool => [tool.key, false])) as WorkspaceVisibility;

// Public promotion is separate from an individual shop's workspace preferences.
export const LAUNCH_VISIBILITY = {
  directoryPromotion: false,
  tvHeaderShortcut: false,
  publicCertification: false,
  starterPlan: false,
  enterprisePlan: false,
};

export function readWorkspaceVisibility(raw: string | null): WorkspaceVisibility {
  const visibility = { ...DEFAULT_WORKSPACE };
  try {
    const saved: unknown = JSON.parse(raw ?? "null");
    if (saved && typeof saved === "object") {
      for (const { key } of OPTIONAL_TOOLS) {
        const value = (saved as Record<string, unknown>)[key];
        if (typeof value === "boolean") visibility[key] = value;
      }
    }
  } catch { /* Invalid or old preferences fall back to the simple workspace. */ }
  return visibility;
}

export function isWorkspaceRouteVisible(path: string, visibility: WorkspaceVisibility) {
  const feature = OPTIONAL_TOOLS.find(tool => "href" in tool && (path === tool.href || path.startsWith(`${tool.href}/`)));
  return !feature || visibility[feature.key];
}

export function isLaunchPlanVisible(key: string) {
  return key === "PRO" || (key === "FREE" && LAUNCH_VISIBILITY.starterPlan) || (key === "ENTERPRISE" && LAUNCH_VISIBILITY.enterprisePlan);
}

export const WORKSPACE_LABELS = {
  en: { repairs: "Repairs", customers: "Customers", inventory: "Inventory", calendar: "Calendar", reports: "Reports", workspace: "Workspace", tools: "Shop tools", optional: "Optional tools", description: "Choose which extra tools appear in your workspace. Hidden tools and their data are kept. Preferences are saved for this account and shop on this device.", restore: "Show all optional tools", reset: "Use simple workspace" },
  fr: { repairs: "Réparations", customers: "Clients", inventory: "Stock", calendar: "Calendrier", reports: "Rapports", workspace: "Espace de travail", tools: "Outils de l’atelier", optional: "Outils facultatifs", description: "Choisissez les outils supplémentaires à afficher. Les outils masqués et leurs données sont conservés. Préférences enregistrées pour ce compte et cet atelier sur cet appareil.", restore: "Afficher tous les outils", reset: "Utiliser l’espace simplifié" },
  ar: { repairs: "الإصلاحات", customers: "العملاء", inventory: "المخزون", calendar: "التقويم", reports: "التقارير", workspace: "مساحة العمل", tools: "أدوات المحل", optional: "أدوات اختيارية", description: "اختر الأدوات الإضافية التي تظهر في مساحة العمل. تبقى الأدوات المخفية وبياناتها محفوظة. تُحفظ التفضيلات لهذا الحساب والمحل على هذا الجهاز.", restore: "إظهار كل الأدوات", reset: "استخدام الواجهة المبسطة" },
};
