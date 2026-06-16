"use client";
import { useEffect, useRef, useState, useCallback } from "react";

type Props = {
  deviceBrand: string;
  deviceModel: string;
  repairType: string;
  total: number;
  currency: string;
  shopName: string;
  shopLogoUrl: string | null;
  intakeUrl: string;
  completionUrl: string;
  onClose: () => void;
};

type Settings = { showPrice: boolean; bgColor: string; showBadge: boolean };

const STORAGE_KEY = "fixflow_social_settings";
const DEFAULTS: Settings = { showPrice: true, bgColor: "#0f172a", showBadge: true };

export function loadSocialSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveSocialSettings(s: Settings) {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export default function SocialShareModal({
  deviceBrand, deviceModel, repairType, total, currency,
  shopName, shopLogoUrl, intakeUrl, completionUrl, onClose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [rendering, setRendering] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  useEffect(() => { setSettings(loadSocialSettings()); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, val: Settings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: val };
      saveSocialSettings(next);
      return next;
    });
  }, []);

  const renderCanvas = useCallback(async (s: Settings) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setRendering(true);
    setRenderError(null);

    const W = 1080, H = 1080;
    canvas.width = W;
    canvas.height = H;

    try {
      const [intake, completion, logo] = await Promise.all([
        loadImg(intakeUrl),
        loadImg(completionUrl),
        shopLogoUrl ? loadImg(shopLogoUrl).catch(() => null) : Promise.resolve(null),
      ]);

      // Background
      ctx.fillStyle = s.bgColor;
      ctx.fillRect(0, 0, W, H);

      // Left photo (intake)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W / 2, H);
      ctx.clip();
      drawCover(ctx, intake, 0, 0, W / 2, H);
      ctx.restore();

      // Right photo (completion)
      ctx.save();
      ctx.beginPath();
      ctx.rect(W / 2, 0, W / 2, H);
      ctx.clip();
      drawCover(ctx, completion, W / 2, 0, W / 2, H);
      ctx.restore();

      // Top gradient
      const topG = ctx.createLinearGradient(0, 0, 0, 250);
      topG.addColorStop(0, "rgba(0,0,0,0.75)");
      topG.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = topG;
      ctx.fillRect(0, 0, W, 250);

      // Bottom gradient
      const botG = ctx.createLinearGradient(0, H - 240, 0, H);
      botG.addColorStop(0, "rgba(0,0,0,0)");
      botG.addColorStop(1, "rgba(0,0,0,0.88)");
      ctx.fillStyle = botG;
      ctx.fillRect(0, H - 240, W, 240);

      // Center divider
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();

      // Before / After labels
      ctx.font = "bold 30px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("BEFORE", 28, 28);
      ctx.fillText("AFTER", W / 2 + 28, 28);

      // Shop logo — top-right
      if (logo) {
        const ls = 80;
        const lx = W - ls - 24;
        const ly = 16;
        ctx.save();
        roundedRect(ctx, lx, ly, ls, ls, 14);
        ctx.clip();
        ctx.fillStyle = "white";
        ctx.fillRect(lx, ly, ls, ls);
        drawCover(ctx, logo, lx, ly, ls, ls);
        ctx.restore();
      }

      // Device name
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = "bold 52px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${deviceBrand} ${deviceModel}`, W / 2, H - 152);

      // Repair type
      ctx.font = "34px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.80)";
      ctx.fillText(repairType || "Repair Complete ✓", W / 2, H - 100);

      // Price
      if (s.showPrice && total > 0) {
        ctx.font = "bold 38px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillStyle = "#34d399";
        ctx.fillText(`${currency} ${total.toFixed(2)}`, W / 2, H - 54);
      }

      // Shop name — bottom left
      ctx.textAlign = "left";
      ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.70)";
      ctx.fillText(shopName, 28, H - 22);

      // FixFlow badge — bottom right
      if (s.showBadge) {
        ctx.textAlign = "right";
        ctx.font = "22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fillText("Powered by FixFlow", W - 24, H - 22);
      }
    } catch {
      setRenderError("Could not load photos — check image permissions or try again.");
    }

    setRendering(false);
  }, [intakeUrl, completionUrl, shopLogoUrl, deviceBrand, deviceModel, repairType, total, currency, shopName]);

  useEffect(() => { renderCanvas(settings); }, [renderCanvas, settings]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || renderError) return;
    try {
      const a = document.createElement("a");
      a.download = `repair-${deviceBrand}-${deviceModel}.jpg`.replace(/\s+/g, "-").toLowerCase();
      a.href = canvas.toDataURL("image/jpeg", 0.92);
      a.click();
    } catch {
      setRenderError("Download failed — image may be from a cross-origin source.");
    }
  }

  function shareWhatsApp() {
    const lines = [
      `✅ *Repair Complete!*`,
      ``,
      `📱 ${deviceBrand} ${deviceModel}`,
      repairType ? `🔧 ${repairType}` : null,
      `🏪 ${shopName}`,
      settings.showPrice && total > 0 ? `💰 ${currency} ${total.toFixed(2)}` : null,
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, "_blank");
  }

  async function copyText() {
    const lines = [
      `✅ Repair Complete!`,
      `📱 ${deviceBrand} ${deviceModel}`,
      repairType ? `🔧 ${repairType}` : null,
      `🏪 ${shopName}`,
      settings.showPrice && total > 0 ? `💰 ${currency} ${total.toFixed(2)}` : null,
    ].filter(Boolean).join("\n");
    await navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">📱</span>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Share Repair</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Canvas preview */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-square border border-slate-200 dark:border-slate-800">
            <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
                <div className="w-8 h-8 border-4 border-slate-500 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {renderError && !rendering && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 gap-3 p-6">
                <span className="text-3xl">⚠️</span>
                <p className="text-red-400 text-xs text-center">{renderError}</p>
                <button onClick={() => renderCanvas(settings)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg">Retry</button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={download}
              disabled={!!renderError || rendering}
              className="flex flex-col items-center gap-1.5 px-3 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              <span className="text-xl">⬇️</span>
              <span className="text-xs font-medium">Download JPG</span>
            </button>
            <button
              onClick={shareWhatsApp}
              className="flex flex-col items-center gap-1.5 px-3 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors"
            >
              <span className="text-xl">💬</span>
              <span className="text-xs font-medium">WhatsApp</span>
            </button>
            <button
              onClick={copyText}
              className="flex flex-col items-center gap-1.5 px-3 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-colors"
            >
              <span className="text-xl">{copied ? "✅" : "🔗"}</span>
              <span className="text-xs font-medium">{copied ? "Copied!" : "Copy Text"}</span>
            </button>
          </div>

          {/* Customize toggle */}
          <button
            onClick={() => setShowCustomize(s => !s)}
            className="w-full text-left text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5 py-1"
          >
            <span className="text-slate-300 dark:text-slate-600">{showCustomize ? "▲" : "▼"}</span>
            Customize image
          </button>

          {showCustomize && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-700 dark:text-slate-300">Show price on image</span>
                <button
                  onClick={() => updateSetting("showPrice", !settings.showPrice)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.showPrice ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${settings.showPrice ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-700 dark:text-slate-300">Show FixFlow badge</span>
                <button
                  onClick={() => updateSetting("showBadge", !settings.showBadge)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.showBadge ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${settings.showBadge ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-700 dark:text-slate-300">Background color</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">{settings.bgColor}</span>
                  <input
                    type="color"
                    value={settings.bgColor}
                    onChange={e => updateSetting("bgColor", e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-1 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400">Settings are saved automatically in your browser.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
