"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { api, formatDateTime, formatPrice } from "@/lib/api";
import type { AdminDashboardResponse } from "@/types/api";

type MetricCard = {
  label: string;
  value: string;
  tone?: "primary" | "warning";
};

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .adminDashboard()
      .then(setDashboard)
      .catch((error) => setMessage(error instanceof Error ? error.message : "관리자 대시보드 조회에 실패했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const primaryMetrics: MetricCard[] = dashboard
    ? [
        { label: "오늘 주문 수", value: `${dashboard.todayOrderCount}건`, tone: "primary" },
        { label: "오늘 매출", value: formatPrice(dashboard.todaySalesAmount) },
        { label: "재고 부족 상품", value: `${dashboard.lowStockProductCount}개`, tone: "warning" }
      ]
    : [];

  const orderStatusMetrics: MetricCard[] = dashboard
    ? [
        { label: "결제 대기 주문 수", value: `${dashboard.paymentPendingOrderCount}` },
        { label: "결제 완료 주문 수", value: `${dashboard.paidOrderCount}` },
        { label: "배송 준비 중 주문 수", value: `${dashboard.preparingOrderCount}` },
        { label: "배송 중 주문 수", value: `${dashboard.shippedOrderCount}` }
      ]
    : [];

  return (
    <RequireAuth requireRole="ROLE_ADMIN">
      <div className="stack">
        <div className="section-header">
          <div>
            <h1>관리자 대시보드</h1>
            <p>주문, 매출, 배송, 재고 상태를 한눈에 확인합니다.</p>
          </div>
        </div>

        <Message message={message} />

        {loading ? (
          <div className="alert">관리자 대시보드를 불러오고 있습니다.</div>
        ) : !dashboard ? (
          <div className="alert">표시할 대시보드 정보가 없습니다.</div>
        ) : (
          <div className="admin-dashboard">
            <section className="dashboard-hero-metrics" aria-label="핵심 운영 지표">
              {primaryMetrics.map((metric) => (
                <article className={`card dashboard-hero-card ${metric.tone ? `dashboard-hero-card-${metric.tone}` : ""}`} key={metric.label}>
                  <div className="card-body metric-card">
                    <span className="muted">{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                </article>
              ))}
            </section>

            <section className="card">
              <div className="card-body stack">
                <div className="admin-dashboard-section-header">
                  <div>
                    <h2>상태별 주문</h2>
                    <p>결제와 배송 처리 대기 건수를 확인합니다.</p>
                  </div>
                  <Link className="button" href="/admin/orders">
                    주문 관리로 이동
                  </Link>
                </div>
                <div className="dashboard-status-metrics">
                  {orderStatusMetrics.map((metric) => (
                    <div key={metric.label}>
                      <span className="muted">{metric.label}</span>
                      <strong>{metric.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="admin-dashboard-grid">
              <section className="card">
                <div className="card-body stack">
                  <div className="admin-dashboard-section-header">
                    <div>
                      <h2>최근 주문 5개</h2>
                      <p>최근 접수된 주문을 바로 확인합니다.</p>
                    </div>
                    <Link className="button" href="/admin/orders">
                      전체 주문
                    </Link>
                  </div>
                  {dashboard.recentOrders.length === 0 ? (
                    <div className="dashboard-empty">최근 주문이 없습니다.</div>
                  ) : (
                    <div className="table-wrap dashboard-table-wrap">
                      <table className="table dashboard-orders-table">
                        <thead>
                          <tr>
                            <th>주문번호</th>
                            <th>회원</th>
                            <th>상태</th>
                            <th>총 금액</th>
                            <th>생성 시간</th>
                            <th>관리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard.recentOrders.map((order) => (
                            <tr key={order.id}>
                              <td>
                                <strong>{order.orderUid}</strong>
                              </td>
                              <td>
                                <strong>{order.memberName}</strong>
                                <span className="muted">{order.memberEmail}</span>
                              </td>
                              <td>
                                <StatusBadge value={order.status} />
                              </td>
                              <td>{formatPrice(order.totalPrice)}</td>
                              <td>{formatDateTime(order.createdAt)}</td>
                              <td>
                                <Link className="button primary dashboard-table-action" href={`/admin/orders/${order.id}`}>
                                  주문 상세
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>

              <section className="card">
                <div className="card-body stack">
                  <div className="admin-dashboard-section-header">
                    <div>
                      <h2>재고 부족 상품</h2>
                      <p>재고가 5개 이하인 노출 상품입니다.</p>
                    </div>
                    <Link className="button primary dashboard-product-action" href="/admin/products">
                      상품 관리
                    </Link>
                  </div>
                  {dashboard.lowStockProducts.length === 0 ? (
                    <div className="dashboard-empty">재고 부족 상품이 없습니다.</div>
                  ) : (
                    <div className="table-wrap dashboard-table-wrap">
                      <table className="table dashboard-products-table">
                        <thead>
                          <tr>
                            <th>상품명</th>
                            <th>분류</th>
                            <th>재고</th>
                            <th>상태</th>
                            <th>관리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard.lowStockProducts.map((product) => (
                            <tr key={product.id}>
                              <td>
                                <strong>{product.name}</strong>
                              </td>
                              <td>
                                <strong>{product.category}</strong>
                                <span className="muted">{product.series}</span>
                              </td>
                              <td>
                                <strong className="dashboard-low-stock">{product.stockQuantity}</strong>
                              </td>
                              <td>
                                <StatusBadge value={product.status} />
                              </td>
                              <td>
                                <Link className="button dashboard-table-action" href="/admin/products">
                                  상품 관리
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
