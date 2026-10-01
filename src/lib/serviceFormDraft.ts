/**
 * Utility to save, restore, and clear pending service form drafts across login redirects
 */

export function saveServiceFormDraft(serviceKey: string, data: any): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`mmc_service_draft_${serviceKey}`, JSON.stringify(data));
  } catch (e) {
    console.warn("Could not save form draft:", e);
  }
}

export function getServiceFormDraft<T = any>(serviceKey: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`mmc_service_draft_${serviceKey}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearServiceFormDraft(serviceKey: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(`mmc_service_draft_${serviceKey}`);
  } catch {}
}
