export type ImeiStatus = "valid" | "invalid" | "suspicious";

export type ImeiResult = {
  status: ImeiStatus;
  luhn: boolean;
  format: boolean;
  manufacturer: string | null;
  modelHint: string | null;
  warning: string | null;
  tac: string;
};

// Luhn algorithm — standard IMEI check digit validation
export function luhnCheck(imei: string): boolean {
  if (!/^\d+$/.test(imei)) return false;
  let sum = 0;
  let alt = false;
  for (let i = imei.length - 1; i >= 0; i--) {
    let n = parseInt(imei[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// Reporting Body Identifier (first 2 digits) to registrar country/body
const RBI_MAP: Record<string, string> = {
  "00": "ATIS (USA)", "01": "BABT (UK)", "02": "BABT (UK)", "10": "CETECOM (Germany)",
  "20": "BABT (UK)", "30": "TUVRHEINLAND (Germany)", "33": "France",
  "35": "BABT (UK)", "44": "BABT (UK)", "45": "BABT (UK)",
  "49": "ANATEL (Brazil)", "52": "APCO (Oceania)", "54": "BABT (UK)",
  "86": "CATT (China)", "87": "CATT (China)", "89": "CATT (China)",
  "91": "ACMA (Australia)", "99": "BABT (UK)",
};

// Known TAC prefixes (first 6–8 digits) → { brand, model hint }
// Curated list of the most common devices worldwide
const TAC_DB: Array<{ prefix: string; brand: string; model: string }> = [
  // Apple iPhone
  { prefix: "35209600", brand: "Apple", model: "iPhone 15 Pro Max" },
  { prefix: "35209500", brand: "Apple", model: "iPhone 15 Pro" },
  { prefix: "35209400", brand: "Apple", model: "iPhone 15 Plus" },
  { prefix: "35209300", brand: "Apple", model: "iPhone 15" },
  { prefix: "35320600", brand: "Apple", model: "iPhone 14 Pro Max" },
  { prefix: "35320500", brand: "Apple", model: "iPhone 14 Pro" },
  { prefix: "35320400", brand: "Apple", model: "iPhone 14 Plus" },
  { prefix: "35320300", brand: "Apple", model: "iPhone 14" },
  { prefix: "35384600", brand: "Apple", model: "iPhone 13 Pro Max" },
  { prefix: "35384500", brand: "Apple", model: "iPhone 13 Pro" },
  { prefix: "35384400", brand: "Apple", model: "iPhone 13 mini" },
  { prefix: "35384300", brand: "Apple", model: "iPhone 13" },
  { prefix: "35397500", brand: "Apple", model: "iPhone 12 Pro Max" },
  { prefix: "35397400", brand: "Apple", model: "iPhone 12 Pro" },
  { prefix: "35397300", brand: "Apple", model: "iPhone 12 mini" },
  { prefix: "35397200", brand: "Apple", model: "iPhone 12" },
  { prefix: "353827", brand: "Apple", model: "iPhone 11 series" },
  { prefix: "352739", brand: "Apple", model: "iPhone XS/XR series" },
  { prefix: "353288", brand: "Apple", model: "iPhone X/8 series" },
  { prefix: "359375", brand: "Apple", model: "iPhone 7 series" },
  // Samsung Galaxy
  { prefix: "35741110", brand: "Samsung", model: "Galaxy S24 Ultra" },
  { prefix: "35741100", brand: "Samsung", model: "Galaxy S24+" },
  { prefix: "35741090", brand: "Samsung", model: "Galaxy S24" },
  { prefix: "35632310", brand: "Samsung", model: "Galaxy S23 Ultra" },
  { prefix: "35632300", brand: "Samsung", model: "Galaxy S23+" },
  { prefix: "35632290", brand: "Samsung", model: "Galaxy S23" },
  { prefix: "35282610", brand: "Samsung", model: "Galaxy S22 Ultra" },
  { prefix: "35282600", brand: "Samsung", model: "Galaxy S22+" },
  { prefix: "35282590", brand: "Samsung", model: "Galaxy S22" },
  { prefix: "352078", brand: "Samsung", model: "Galaxy S series" },
  { prefix: "353260", brand: "Samsung", model: "Galaxy A series" },
  { prefix: "354969", brand: "Samsung", model: "Galaxy Note series" },
  // Huawei
  { prefix: "86097810", brand: "Huawei", model: "Mate 60 Pro" },
  { prefix: "86009340", brand: "Huawei", model: "P60 series" },
  { prefix: "86975510", brand: "Huawei", model: "P50 series" },
  { prefix: "860456", brand: "Huawei", model: "series" },
  { prefix: "863571", brand: "Huawei", model: "series" },
  // Xiaomi
  { prefix: "86397710", brand: "Xiaomi", model: "14 Ultra" },
  { prefix: "86397700", brand: "Xiaomi", model: "14 Pro" },
  { prefix: "86397690", brand: "Xiaomi", model: "14" },
  { prefix: "863977", brand: "Xiaomi", model: "series" },
  { prefix: "864012", brand: "Xiaomi", model: "Redmi series" },
  // OPPO
  { prefix: "86502010", brand: "OPPO", model: "Find X7" },
  { prefix: "865020", brand: "OPPO", model: "series" },
  // OnePlus
  { prefix: "86688210", brand: "OnePlus", model: "12" },
  { prefix: "866882", brand: "OnePlus", model: "series" },
  // Vivo
  { prefix: "86500110", brand: "Vivo", model: "X100 Pro" },
  { prefix: "865001", brand: "Vivo", model: "series" },
  // Realme
  { prefix: "86600010", brand: "Realme", model: "series" },
  // Google Pixel
  { prefix: "35843100", brand: "Google", model: "Pixel 8 Pro" },
  { prefix: "35843090", brand: "Google", model: "Pixel 8" },
  { prefix: "35843080", brand: "Google", model: "Pixel 7a" },
  { prefix: "358430", brand: "Google", model: "Pixel series" },
  { prefix: "352877", brand: "Google", model: "Pixel series" },
  // Nokia
  { prefix: "354040", brand: "Nokia", model: "series" },
  { prefix: "358826", brand: "Nokia", model: "series" },
  // Motorola
  { prefix: "356938", brand: "Motorola", model: "series" },
  { prefix: "353260", brand: "Motorola", model: "series" },
  // Sony
  { prefix: "359100", brand: "Sony", model: "Xperia series" },
  { prefix: "357681", brand: "Sony", model: "Xperia series" },
  // LG
  { prefix: "352093", brand: "LG", model: "series" },
  { prefix: "354971", brand: "LG", model: "series" },
];

function lookupTac(imei: string): { brand: string | null; model: string | null } {
  for (const entry of TAC_DB) {
    if (imei.startsWith(entry.prefix)) {
      return { brand: entry.brand, model: entry.model };
    }
  }
  return { brand: null, model: null };
}

function detectFake(imei: string): string | null {
  if (/^0+$/.test(imei)) return "All-zeros IMEI — clearly invalid";
  if (/^1+$/.test(imei)) return "All-ones IMEI — test/fake device";
  if (imei === "123456789012345") return "Sequential test IMEI";
  // Same digit repeated ≥13 times out of 15
  const digitCounts = [...imei].reduce((acc, d) => { acc[d] = (acc[d] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const maxCount = Math.max(...Object.values(digitCounts));
  if (maxCount >= 13) return "Suspiciously repetitive digits";
  // Common test IMEIs
  const testImeis = new Set(["000000000000000", "111111111111111", "999999999999999"]);
  if (testImeis.has(imei)) return "Known test IMEI";
  return null;
}

export function validateImei(imei: string): ImeiResult {
  const clean = imei.replace(/\s+/g, "").replace(/-/g, "");
  const format = /^\d{15}$/.test(clean);
  const tac = clean.slice(0, 8);

  if (!format) {
    return { status: "invalid", luhn: false, format: false, manufacturer: null, modelHint: null, warning: "IMEI must be exactly 15 digits", tac };
  }

  const fakeWarning = detectFake(clean);
  if (fakeWarning) {
    return { status: "invalid", luhn: false, format: true, manufacturer: null, modelHint: null, warning: fakeWarning, tac };
  }

  const luhn = luhnCheck(clean);
  const { brand, model } = lookupTac(clean);
  const rbi = clean.slice(0, 2);
  const rbiLabel = RBI_MAP[rbi] ?? null;
  const manufacturer = brand ?? (rbiLabel ? `Device registered via ${rbiLabel}` : null);

  if (!luhn) {
    return { status: "suspicious", luhn: false, format: true, manufacturer, modelHint: model, warning: "Luhn check failed — IMEI may be altered or transcribed incorrectly", tac };
  }

  return { status: "valid", luhn: true, format: true, manufacturer, modelHint: model, warning: null, tac };
}

export function imeiResultSummary(result: ImeiResult, blacklistStatus?: string | null): string {
  const parts: string[] = [];
  parts.push(`IMEI Check: ${result.status.toUpperCase()}`);
  if (result.manufacturer) parts.push(`Device: ${result.manufacturer}${result.modelHint && result.modelHint !== "series" ? ` ${result.modelHint}` : ""}`);
  parts.push(`Format: ${result.format ? "Valid (15 digits)" : "Invalid format"}`);
  parts.push(`Luhn: ${result.luhn ? "Pass" : "Fail"}`);
  if (result.warning) parts.push(`Warning: ${result.warning}`);
  if (blacklistStatus) parts.push(`Blacklist: ${blacklistStatus}`);
  return parts.join(" | ");
}
