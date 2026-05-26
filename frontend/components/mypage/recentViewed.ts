export type RecentViewedProduct = {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
};

export const RECENT_VIEWED_KEY = "pkm_recent_viewed_products";

export function loadRecentViewedProducts(limit = 10): RecentViewedProduct[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(RECENT_VIEWED_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => typeof item?.id === "number" && typeof item?.name === "string")
      .map((item) => ({
        id: item.id,
        name: item.name,
        price: typeof item.price === "number" ? item.price : 0,
        imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null
      }))
      .slice(0, limit);
  } catch {
    return [];
  }
}
