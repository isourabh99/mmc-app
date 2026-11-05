import { getStoredZoneId } from "@/lib/service/zone.service";
import apiClient from "@/lib/http/apiClient";
import axios from "axios";

export interface GalleryMediaItem {
  id: string;
  media_type: "image" | "video";
  media_file_full_path: string;
  video_url?: string | null;
  thumbnail_full_path?: string | null;
  priority?: number;
  label?: string;
  duration?: string;
}

export interface GalleryItem {
  id: string;
  category_id?: string;
  category_name?: string;
  service_id?: string | null;
  service_name?: string | null;
  title: string;
  description: string;
  priority?: number;
  before_image?: string;
  after_image?: string;
  media: GalleryMediaItem[];
  images?: GalleryMediaItem[];
  videos?: GalleryMediaItem[];
  tags?: string[];
  specs?: { label: string; value: string }[];
  is_featured?: boolean;
}

export interface GalleryApiResponse {
  response_code: string;
  message: string;
  content: {
    current_page: number;
    data: Array<{
      id: string;
      category_id?: string;
      category_name?: string;
      service_id?: string | null;
      service_name?: string | null;
      title: string;
      description: string;
      priority?: number;
      media?: Array<{
        id: string;
        media_type: string;
        media_file_full_path: string;
        video_url?: string | null;
        thumbnail_full_path?: string | null;
        priority?: number;
      }>;
      images?: Array<any>;
      videos?: Array<any>;
    }>;
    total: number;
  };
}

/**
 * Maps raw backend API gallery item into a strongly typed GalleryItem.
 */
export function mapApiItemToGalleryItem(item: any): GalleryItem {
  const rawMedia = item.media || [];
  const mediaList: GalleryMediaItem[] = rawMedia.map((m: any, idx: number) => {
    const isVid = String(m.media_type || "").toLowerCase() === "video";
    return {
      id: m.id || `m-${idx}`,
      media_type: isVid ? "video" : "image",
      media_file_full_path: m.media_file_full_path || m.file_path || m.url || "",
      video_url: m.video_url || null,
      thumbnail_full_path: m.thumbnail_full_path || null,
      priority: m.priority || idx + 1,
      label: isVid ? `Video Clip ${idx + 1}` : `Showcase Photo ${idx + 1}`,
      duration: isVid ? "02:30" : undefined,
    };
  });

  const imageItems = mediaList.filter((m) => m.media_type === "image");
  const videoItems = mediaList.filter((m) => m.media_type === "video");

  const beforeImg =
    imageItems[0]?.media_file_full_path ||
    mediaList[0]?.media_file_full_path ||
    "";

  const afterImg =
    imageItems[1]?.media_file_full_path ||
    imageItems[0]?.media_file_full_path ||
    "";

  const cleanTitle =
    !item.title || item.title === "Select category" || item.title.trim() === ""
      ? `${item.category_name || "Vehicle Service"} Gallery Showcase`
      : item.title;

  const cleanDesc =
    !item.description ||
    item.description.startsWith("Select category") ||
    item.description.trim() === ""
      ? `Specialist transformation and craft for ${item.category_name || "vehicle upgrades"}. Verified work by MMC specialists.`
      : item.description;

  return {
    id: String(item.id),
    category_id: item.category_id || "",
    category_name: item.category_name || "Vehicle Service",
    service_id: item.service_id,
    service_name: item.service_name,
    title: cleanTitle,
    description: cleanDesc,
    priority: item.priority || 1,
    before_image: beforeImg,
    after_image: afterImg,
    media: mediaList,
    images: imageItems,
    videos: videoItems,
    tags: [item.category_name].filter(Boolean),
  };
}

/**
 * Match Category Utility
 */
export interface ServiceCategoryDefinition {
  id: string;
  name: string;
  label: string;
  aliases: string[];
}

export const MMC_SERVICE_CATEGORIES: ServiceCategoryDefinition[] = [
  {
    id: "all",
    name: "All",
    label: "All",
    aliases: ["all", "everything"],
  },
  {
    id: "35f3a758-c66b-444e-83fb-9325a345e2db",
    name: "Car Hire",
    label: "Car Hire",
    aliases: ["car hire", "hire", "rental", "fleet"],
  },
  {
    id: "e1fb2dae-c233-4b45-852b-8253373e06d7",
    name: "Alloy Refurbishment",
    label: "Alloy Wheels",
    aliases: ["alloy refurbishment", "alloy wheels", "alloy", "wheel", "alloys", "refurbishment"],
  },
  {
    id: "dbafef35-cfa4-4757-90f4-ddbf568d5d83",
    name: "Bodywork Repairs",
    label: "Bodywork & Paint",
    aliases: ["bodywork repairs", "bodywork", "paint repair", "bodywork & paint repair", "bodykits & styling", "bodykits", "body", "paint"],
  },
  {
    id: "675fb918-9d0c-4ee5-9a0a-904b42651033",
    name: "Modifications",
    label: "Modifications & Tuning",
    aliases: ["modifications", "vehicle modifications & tuning", "performance upgrades", "tuning", "mod", "f14c244c-352b-4395-9bfd-384dfa1d8ea8"],
  },
  {
    id: "b0a78f28-5281-4284-a50d-781d4592b1c4",
    name: "Mechanic",
    label: "Mechanical Repairs",
    aliases: ["mechanic", "mechanical repairs", "mechanical repairs & diagnostics", "diagnostics", "servicing"],
  },
  {
    id: "812a149b-2ccd-43ef-901a-a665f2ff78ea",
    name: "Valet / Detailing",
    label: "Valet & Detailing",
    aliases: ["valet / detailing", "valet", "detailing", "valet wash", "wash"],
  },
  {
    id: "5d98d5c9-509e-4ab7-859d-806174384e27",
    name: "Tyre Fittings",
    label: "Tyre Fittings",
    aliases: ["tyre fittings", "tyres", "tyre"],
  },
  {
    id: "fd6a04cf-3803-4a9b-a830-6cfa9c3c48d4",
    name: "Chauffeur",
    label: "Chauffeur",
    aliases: ["chauffeur", "chauffeur service"],
  },
];

/**
 * Match Category Utility
 */
export function matchCategory(
  item: GalleryItem,
  targetCategory?: string,
  targetCategoryId?: string
): boolean {
  if (!targetCategory && !targetCategoryId) return true;

  const cleanTargetName = String(targetCategory || "").toLowerCase().trim();
  const cleanTargetId = String(targetCategoryId || "").toLowerCase().trim();

  if (cleanTargetName === "all" || cleanTargetId === "all") return true;

  const itemCatId = String(item.category_id || "").toLowerCase().trim();
  const itemCatName = String(item.category_name || "").toLowerCase().trim();
  const itemTitle = String(item.title || "").toLowerCase().trim();
  const tagsStr = (item.tags || []).join(" ").toLowerCase();

  // 1. Direct ID match
  if (cleanTargetId && itemCatId === cleanTargetId) return true;

  // 2. Modifications alternate ID
  if (
    (cleanTargetId === "675fb918-9d0c-4ee5-9a0a-904b42651033" || cleanTargetId === "f14c244c-352b-4395-9bfd-384dfa1d8ea8") &&
    (itemCatId === "675fb918-9d0c-4ee5-9a0a-904b42651033" || itemCatId === "f14c244c-352b-4395-9bfd-384dfa1d8ea8")
  ) {
    return true;
  }

  // 3. Direct Category Name Substring
  if (cleanTargetName && (itemCatName.includes(cleanTargetName) || cleanTargetName.includes(itemCatName))) {
    return true;
  }

  // 4. Canonical MMC category alias matching
  const matchedDef = MMC_SERVICE_CATEGORIES.find(
    (c) =>
      c.id === cleanTargetId ||
      c.name.toLowerCase() === cleanTargetName ||
      c.label.toLowerCase() === cleanTargetName ||
      c.aliases.some((a) => cleanTargetName.includes(a) || a === cleanTargetName || cleanTargetId === a)
  );

  if (matchedDef) {
    if (itemCatId && itemCatId === matchedDef.id) return true;
    if (matchedDef.aliases.some((a) => itemCatName.includes(a) || (/^[a-f0-9-]+$/.test(a) && itemCatId === a))) {
      return true;
    }
  }

  // 5. Semantic Fallbacks
  // Alloy
  if (cleanTargetName.includes("alloy") || cleanTargetName.includes("wheel") || cleanTargetId.includes("e1fb2dae")) {
    return itemCatName.includes("alloy") || itemCatName.includes("wheel") || itemCatId.includes("e1fb2dae");
  }

  // Bodywork
  if (cleanTargetName.includes("body") || cleanTargetName.includes("paint") || cleanTargetId.includes("dbafef35")) {
    return (
      itemCatName.includes("body") ||
      itemCatName.includes("paint") ||
      itemCatName.includes("styling") ||
      itemCatId.includes("dbafef35") ||
      /body|paint|dent|scratch|ppf|respray/i.test(itemTitle + " " + tagsStr)
    );
  }

  // Modifications
  if (
    cleanTargetName.includes("mod") ||
    cleanTargetName.includes("tun") ||
    cleanTargetName.includes("performance") ||
    cleanTargetId.includes("675fb918") ||
    cleanTargetId.includes("f14c244c")
  ) {
    return (
      itemCatName.includes("mod") ||
      itemCatName.includes("performance") ||
      itemCatName.includes("tun") ||
      itemCatId.includes("675fb918") ||
      itemCatId.includes("f14c244c")
    );
  }

  // Car Hire
  if (cleanTargetName.includes("hire") || cleanTargetName.includes("rental") || cleanTargetId.includes("35f3a758")) {
    return itemCatName.includes("hire") || itemCatId === "35f3a758-c66b-444e-83fb-9325a345e2db";
  }

  // Mechanical
  if (cleanTargetName.includes("mech") || cleanTargetId.includes("b0a78f28")) {
    return itemCatName.includes("mech") || itemCatId.includes("b0a78f28");
  }

  // Valet
  if (cleanTargetName.includes("valet") || cleanTargetName.includes("wash") || cleanTargetId.includes("812a149b")) {
    return itemCatName.includes("valet") || itemCatName.includes("wash") || itemCatId.includes("812a149b");
  }

  return false;
}

// ---------------------------------------------------------------------------
// 100% Dynamic API Fetcher
// ---------------------------------------------------------------------------
export async function fetchGalleryFromApi(
  params?: {
    category_id?: string;
    limit?: number;
  }
): Promise<GalleryItem[]> {
  try {
    const queryParams: any = {
      limit: params?.limit || 100,
    };
    if (params?.category_id) {
      queryParams.category_id = params.category_id;
    }

    let rawList: any[] = [];
    try {
      const res = await apiClient.get<GalleryApiResponse>(
        "/customer/service/gallery",
        {
          params: queryParams,
          headers: {
            Accept: "application/json",
            zoneid: getStoredZoneId(),
          },
        }
      );
      rawList = res.data?.content?.data || [];
    } catch (clientErr) {
      // Fallback direct axios call to live backend domain
      const liveRes = await axios.get<GalleryApiResponse>(
        "https://mmcclub.co.uk/backend/api/v1/customer/service/gallery",
        {
          params: queryParams,
          headers: {
            Accept: "application/json",
            zoneid: getStoredZoneId(),
          },
        }
      );
      rawList = liveRes.data?.content?.data || [];
    }

    if (!Array.isArray(rawList)) {
      return [];
    }

    return rawList.map(mapApiItemToGalleryItem);
  } catch (err) {
    console.warn("[Gallery API] fetch failed:", err);
    return [];
  }
}

/**
 * Returns projects for a given category 100% from the API.
 */
export async function getGalleryForCategory(
  categoryId?: string,
  categoryName?: string
): Promise<GalleryItem[]> {
  // 1. Try to fetch live from API with category_id parameter
  if (categoryId) {
    const byCategory = await fetchGalleryFromApi({ category_id: categoryId, limit: 100 });
    if (byCategory.length > 0) {
      return byCategory;
    }
  }

  // 2. Fetch all gallery items from API and match by categoryId or categoryName
  const allApi = await fetchGalleryFromApi({ limit: 100 });
  const matched = allApi.filter((p) => matchCategory(p, categoryName, categoryId));

  return matched;
}

/**
 * Returns all gallery projects 100% from the API.
 */
export async function getAllGalleryProjects(): Promise<GalleryItem[]> {
  return fetchGalleryFromApi({ limit: 100 });
}
