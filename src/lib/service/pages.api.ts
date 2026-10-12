import apiClient, { getBackendRootUrl } from "@/lib/http/apiClient";

export interface PageItem {
  id?: string;
  page_key: string;
  title: string;
  content: string;
  image?: string | null;
  image_full_path?: string | null;
  is_active?: number;
  is_default?: number;
  created_at?: string;
  updated_at?: string;
  value?: string;
}

export interface PagesConfigResponse {
  response_code: string;
  message: string;
  content: {
    pages?: PageItem[];
    about_us?: PageItem;
    terms_and_conditions?: PageItem;
    privacy_policy?: PageItem;
    cancellation_policy?: PageItem;
    refund_policy?: PageItem;
    faqs?: PageItem;
    [key: string]: any;
  };
}

let cachedPagesData: Record<string, PageItem> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute in-memory cache

/**
 * Fetch all CMS pages from GET /customer/config/pages
 */
export async function getPagesConfig(): Promise<Record<string, PageItem>> {
  const now = Date.now();
  if (cachedPagesData && now - lastFetchTime < CACHE_TTL) {
    return cachedPagesData;
  }

  // Check sessionStorage cache for instant hydration
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("mmc_pages_config");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          cachedPagesData = parsed;
        }
      }
    } catch {}
  }

  try {
    const res = await apiClient.get<PagesConfigResponse>("/customer/config/pages");
    const body = res.data;
    const content = body?.content;

    const map: Record<string, PageItem> = {};

    if (Array.isArray(content?.pages)) {
      content.pages.forEach((p) => {
        if (p.page_key) {
          map[p.page_key] = p;
        }
      });
    }

    // Also map specific named keys if present
    const namedKeys: Array<[string, string]> = [
      ["about_us", "about-us"],
      ["terms_and_conditions", "terms-and-conditions"],
      ["privacy_policy", "privacy-policy"],
      ["cancellation_policy", "cancellation-policy"],
      ["refund_policy", "refund-policy"],
      ["faqs", "faqs"],
    ];

    namedKeys.forEach(([objKey, slugKey]) => {
      if (content && content[objKey] && !map[slugKey]) {
        map[slugKey] = {
          ...content[objKey],
          page_key: slugKey,
        };
      }
    });

    if (Object.keys(map).length > 0) {
      cachedPagesData = map;
      lastFetchTime = now;
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("mmc_pages_config", JSON.stringify(map));
        } catch {}
      }
    }

    return cachedPagesData || map;
  } catch (err: any) {
    console.warn("[pages.api] Failed to fetch /customer/config/pages:", err?.message);
    return cachedPagesData || {};
  }
}

/**
 * Get a specific page by key (e.g. "about-us", "terms-and-conditions", "privacy-policy", etc.)
 */
export async function getPageByKey(pageKey: string): Promise<PageItem | null> {
  const all = await getPagesConfig();
  if (all[pageKey]) return all[pageKey];

  // Try normalized fallback matching
  const normalizedKey = pageKey.toLowerCase().replace(/_/g, "-");
  for (const [k, v] of Object.entries(all)) {
    if (k.toLowerCase().replace(/_/g, "-") === normalizedKey) {
      return v;
    }
  }

  return null;
}
