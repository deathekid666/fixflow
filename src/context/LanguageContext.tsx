"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "fr" | "ar";

export const translations = {
  en: {
    // Nav
    workOrders: "Work Orders",
    spareParts: "Spare Parts",
    customers: "Customers",
    warranties: "Warranties",
    satisfaction: "Satisfaction",
    csvImport: "CSV Import",
    analytics: "Analytics",
    engineers: "Engineers",
    reports: "Reports",
    templates: "Templates",
    shops: "Shops",
    expenses: "Expenses",
    settings: "Settings",
    // Sidebar actions
    notifications: "Notifications",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    installApp: "Install App",
    logout: "Log out",
    // Bottom nav
    orders: "Orders",
    parts: "Parts",
    // Notifications panel
    markAllRead: "Mark all read",
    noNotifications: "No notifications",
    // Session warning
    sessionExpiring: "Session expiring soon",
    sessionWarningBody: "You'll be signed out in {time} due to inactivity.",
    stayLoggedIn: "Stay logged in",
  },
  fr: {
    workOrders: "Ordres de travail",
    spareParts: "Pièces détachées",
    customers: "Clients",
    warranties: "Garanties",
    satisfaction: "Satisfaction",
    csvImport: "Import CSV",
    analytics: "Analytique",
    engineers: "Techniciens",
    reports: "Rapports",
    templates: "Modèles",
    shops: "Boutiques",
    expenses: "Dépenses",
    settings: "Paramètres",
    notifications: "Notifications",
    lightMode: "Mode clair",
    darkMode: "Mode sombre",
    installApp: "Installer",
    logout: "Déconnexion",
    orders: "Ordres",
    parts: "Pièces",
    markAllRead: "Tout marquer lu",
    noNotifications: "Aucune notification",
    sessionExpiring: "Session bientôt expirée",
    sessionWarningBody: "Vous serez déconnecté dans {time} en raison d'inactivité.",
    stayLoggedIn: "Rester connecté",
  },
  ar: {
    workOrders: "أوامر العمل",
    spareParts: "قطع الغيار",
    customers: "العملاء",
    warranties: "الضمانات",
    satisfaction: "الرضا",
    csvImport: "استيراد CSV",
    analytics: "التحليلات",
    engineers: "المهندسون",
    reports: "التقارير",
    templates: "القوالب",
    shops: "المتاجر",
    expenses: "المصاريف",
    settings: "الإعدادات",
    notifications: "الإشعارات",
    lightMode: "الوضع الفاتح",
    darkMode: "الوضع الداكن",
    installApp: "تثبيت التطبيق",
    logout: "تسجيل الخروج",
    orders: "الطلبات",
    parts: "القطع",
    markAllRead: "تحديد الكل كمقروء",
    noNotifications: "لا توجد إشعارات",
    sessionExpiring: "انتهاء الجلسة قريباً",
    sessionWarningBody: "سيتم تسجيل خروجك خلال {time} بسبب عدم النشاط.",
    stayLoggedIn: "البقاء متصلاً",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => translations.en[key],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("lang") as Lang | null;
    if (stored && stored in translations) setLangState(stored);
  }, []);

  // Keep <html dir> and <html lang> in sync
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("lang", l);
  }

  function t(key: TranslationKey): string {
    return (translations[lang] as Record<string, string>)[key] ?? translations.en[key];
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
