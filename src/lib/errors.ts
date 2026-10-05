import axios from "axios";

import type { ApiError } from "@/types";

// Backend `detail` strings that users can see, translated for the UI.
const KNOWN_MESSAGES: Record<string, string> = {
  "Invalid credentials": "E-posta veya şifre hatalı.",
  "Account disabled": "Hesabınız devre dışı bırakılmış. Lütfen bizimle iletişime geçin.",
  "Email already registered": "Bu e-posta adresiyle kayıtlı bir hesap zaten var.",
  "Invalid segment": "Geçersiz müşteri tipi.",
};

/** Turns an API failure into a short, user-facing Turkish message. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiError>(error)) return fallback;

  if (!error.response) {
    return "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.";
  }

  const detail = error.response.data?.detail;
  if (typeof detail === "string") return KNOWN_MESSAGES[detail] ?? detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return "Girdiğiniz bilgileri kontrol edin.";
  }
  if (error.response.status >= 500) {
    return "Sunucuda bir hata oluştu. Lütfen biraz sonra tekrar deneyin.";
  }
  return fallback;
}
