import axios from "axios";

import type { ApiError } from "@/types";

// Backend `detail` strings that users can see, translated for the UI.
const KNOWN_MESSAGES: Record<string, string> = {
  "Invalid credentials": "E-posta veya şifre hatalı.",
  "Account disabled": "Hesabınız devre dışı bırakılmış. Lütfen bizimle iletişime geçin.",
  "Email already registered": "Bu e-posta adresiyle kayıtlı bir hesap zaten var.",
  "Invalid or expired token": "Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.",
  "Order not found": "Sipariş bulunamadı.",
  "Admin privileges required": "Bu işlem için yönetici yetkisi gerekiyor.",
  "Variant not found": "Ürün varyantı bulunamadı.",
};

// Checkout engine errors carry details (SKU, quantities); match and translate them.
const PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [
    /^Insufficient stock for (\S+): requested (\d+), available (\d+)/,
    (m) => `Stok yetersiz: ${m[1]} için en fazla ${m[3]} adet sipariş verebilirsiniz (sepette ${m[2]}).`,
  ],
  [
    /^Insufficient ParaPuan: requested (\d+), available (\d+)/,
    (m) => `Yetersiz ParaPuan: ${m[1]} puan kullanmak istediniz, bakiyeniz ${m[2]} puan.`,
  ],
  [
    /^No TRY price for variant (\S+)/,
    (m) => `${m[1]} kodlu ürün hesabınız için satışta değil. Lütfen sepetten çıkarın.`,
  ],
  [
    /^Order cannot be approved — current status is (\w+)/,
    (m) => `Bu sipariş onaylanamaz: durumu zaten "${m[1]}". Yalnızca onay bekleyen siparişler onaylanabilir.`,
  ],
  [/^Variant \S+ not found/, () => "Sepetinizdeki bir ürün artık satışta değil. Lütfen sepeti güncelleyin."],
];

function translate(detail: string): string {
  if (KNOWN_MESSAGES[detail]) return KNOWN_MESSAGES[detail];
  for (const [pattern, render] of PATTERNS) {
    const m = detail.match(pattern);
    if (m) return render(m);
  }
  return detail;
}

/** Turns an API failure into a short, user-facing Turkish message. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiError>(error)) return fallback;

  if (!error.response) {
    return "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.";
  }

  const detail = error.response.data?.detail;
  if (typeof detail === "string") return translate(detail);
  if (Array.isArray(detail) && detail.length > 0) {
    return "Girdiğiniz bilgileri kontrol edin.";
  }
  if (error.response.status >= 500) {
    return "Sunucuda bir hata oluştu. Lütfen biraz sonra tekrar deneyin.";
  }
  return fallback;
}
