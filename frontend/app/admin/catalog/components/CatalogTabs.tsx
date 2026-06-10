"use client";

export type CatalogTabKey = "categories" | "productTypes" | "series";

type CatalogTabsProps = {
  activeTab: CatalogTabKey;
  onTabChange: (tab: CatalogTabKey) => void;
};

const tabs: Array<{ key: CatalogTabKey; label: string }> = [
  { key: "categories", label: "카테고리" },
  { key: "productTypes", label: "상품 유형" },
  { key: "series", label: "시리즈" }
];

export function CatalogTabs({ activeTab, onTabChange }: CatalogTabsProps) {
  return (
    <div className="admin-catalog-tabs" role="tablist" aria-label="카탈로그 관리 탭">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.key}
          className={activeTab === tab.key ? "active" : ""}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
