"use client";

import { useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { CatalogTabs, type CatalogTabKey } from "./components/CatalogTabs";
import { CategoryManager } from "./components/CategoryManager";
import { ProductTypeManager } from "./components/ProductTypeManager";
import { SeriesManager } from "./components/SeriesManager";

export default function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState<CatalogTabKey>("categories");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <RequireAuth requireRole="ROLE_ADMIN">
      <div className="stack admin-catalog-page">
        <div className="section-header">
          <div>
            <h1>카탈로그 관리</h1>
            <p>상품 분류, 상품 유형, 시리즈를 관리합니다.</p>
          </div>
        </div>

        <Message message={message} />

        <CatalogTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "categories" && <CategoryManager onMessage={setMessage} />}
        {activeTab === "productTypes" && <ProductTypeManager onMessage={setMessage} />}
        {activeTab === "series" && <SeriesManager onMessage={setMessage} />}
      </div>
    </RequireAuth>
  );
}
