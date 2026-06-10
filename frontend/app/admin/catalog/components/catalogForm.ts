import type { Category, ProductType, Series } from "@/types/api";

export type BasicCatalogItem = Category | Series;

export type BasicCatalogForm = {
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  active: boolean;
};

export const emptyBasicCatalogForm: BasicCatalogForm = {
  name: "",
  slug: "",
  description: "",
  displayOrder: 0,
  active: true
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function sortByDisplayOrder<T extends { displayOrder: number; id: number }>(items: T[]) {
  return [...items].sort((left, right) => left.displayOrder - right.displayOrder || left.id - right.id);
}

export function formFromBasicCatalogItem(item: BasicCatalogItem): BasicCatalogForm {
  return {
    name: item.name,
    slug: item.slug,
    description: item.description ?? "",
    displayOrder: item.displayOrder,
    active: item.active
  };
}

export function validateBasicCatalogForm(form: BasicCatalogForm) {
  if (!form.name.trim()) {
    return "이름을 입력해 주세요.";
  }

  if (!form.slug.trim()) {
    return "slug를 입력해 주세요.";
  }

  if (!slugPattern.test(form.slug.trim())) {
    return "slug는 소문자 영문, 숫자, hyphen(-) 조합으로 입력해 주세요.";
  }

  return null;
}

export function buildBasicCatalogRequest(form: BasicCatalogForm) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim().toLowerCase(),
    description: form.description.trim() || null,
    displayOrder: Number(form.displayOrder) || 0,
    active: form.active
  };
}

export function activeLabel(active: boolean) {
  return active ? "활성" : "숨김";
}

export function categoryOptionLabel(category: Category) {
  return `${category.name}${category.active ? "" : " (숨김)"}`;
}

export type ProductTypeForm = {
  categoryId: number;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  active: boolean;
};

export function formFromProductType(item: ProductType): ProductTypeForm {
  return {
    categoryId: item.categoryId,
    name: item.name,
    slug: item.slug,
    description: item.description ?? "",
    displayOrder: item.displayOrder,
    active: item.active
  };
}
