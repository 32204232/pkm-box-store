"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { api, formatDateTime, formatPrice } from "@/lib/api";
import type { AdminOrder, OrderStatus } from "@/types/api";

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = useMemo(() => Number(params.id), [params.id]);
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [courierCompany, setCourierCompany] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [canceling, setCanceling] = useState(false);

  async function loadOrder() {
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setMessage("올바르지 않은 주문번호입니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await api.adminOrder(orderId);
      setOrder(response);
      setCourierCompany(response.courierCompany ?? "");
      setTrackingNumber(response.trackingNumber ?? "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "관리자 주문 정보를 조회하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function updateStatus(status: OrderStatus) {
    if (updating) {
      return;
    }

    setUpdating(true);
    setMessage(null);
    try {
      await api.updateAdminOrderStatus(
        orderId,
        status,
        status === "SHIPPED" ? courierCompany : undefined,
        status === "SHIPPED" ? trackingNumber : undefined
      );
      await loadOrder();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "주문 상태 변경에 실패했습니다.");
    } finally {
      setUpdating(false);
    }
  }

  async function cancelPayment() {
    if (canceling || !order) {
      return;
    }

    setCanceling(true);
    setMessage(null);
    try {
      await api.adminCancelPayment({ orderId: order.id, cancelReason });
      setOrder(await api.adminOrder(order.id));
      setCancelReason("");
      setMessage("결제 취소/환불이 완료되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "결제 취소/환불에 실패했습니다.");
    } finally {
      setCanceling(false);
    }
  }

  const shippingInfoReady = courierCompany.trim().length > 0 && trackingNumber.trim().length > 0;

  return (
    <RequireAuth requireRole="ROLE_ADMIN">
      <div className="stack">
        <div className="section-header">
          <div>
            <h1>관리자 주문 상세</h1>
            <p>회원, 주문 상품, 배송 정보와 배송 상태를 관리합니다.</p>
          </div>
          <Link className="button" href="/admin/orders">
            관리자 주문 목록
          </Link>
        </div>

        <Message message={message} />

        {loading ? (
          <div className="alert">주문 정보를 불러오고 있습니다.</div>
        ) : !order ? (
          <div className="alert">표시할 주문 정보가 없습니다.</div>
        ) : (
          <div className="admin-order-layout">
            <section className="admin-order-main">
              <div className="card admin-order-status-card">
                <div className="card-body stack">
                  <div className="admin-order-status-header">
                    <div>
                      <span className="muted">현재 주문 상태</span>
                      <div className="admin-order-status-title">
                        <StatusBadge value={order.status} />
                        <strong>{getAdminNextActionText(order.status)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="admin-order-summary-grid">
                    <div>
                      <span className="muted">주문번호</span>
                      <strong>{order.orderUid}</strong>
                    </div>
                    <div>
                      <span className="muted">회원 정보</span>
                      <strong>{order.memberName}</strong>
                      <span>{order.memberEmail}</span>
                    </div>
                    <div>
                      <span className="muted">총 금액</span>
                      <strong className="admin-order-summary-price">{formatPrice(order.totalPrice)}</strong>
                    </div>
                    <div>
                      <span className="muted">생성 시간</span>
                      <strong>{formatDateTime(order.createdAt)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body stack">
                  <div className="admin-order-section-header">
                    <div>
                      <strong>주문 상품</strong>
                      <p>주문된 상품과 수량, 금액을 확인합니다.</p>
                    </div>
                  </div>
                  <div className="table-wrap admin-order-items-wrap">
                    <table className="table admin-order-items-table">
                      <thead>
                        <tr>
                          <th>상품명</th>
                          <th>단가</th>
                          <th>수량</th>
                          <th>합계</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.productNameSnapshot}</strong>
                            </td>
                            <td>{formatPrice(item.orderPrice)}</td>
                            <td>{item.quantity}</td>
                            <td>
                              <strong>{formatPrice(item.lineTotal)}</strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="admin-order-info-grid">
                <div className="card">
                  <div className="card-body stack">
                    <div className="admin-order-section-header">
                      <div>
                        <strong>배송 정보</strong>
                        <p>수령인과 배송 주소입니다.</p>
                      </div>
                    </div>
                    <div className="admin-order-info-list">
                      <div>
                        <span className="muted">수령인</span>
                        <strong>{order.receiverName}</strong>
                      </div>
                      <div>
                        <span className="muted">연락처</span>
                        <strong>{order.receiverPhone}</strong>
                      </div>
                      <div>
                        <span className="muted">주소</span>
                        <strong>{order.address}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body stack">
                    <div className="admin-order-section-header">
                      <div>
                        <strong>운송장 정보</strong>
                        <p>발송 이후 고객에게 표시되는 배송 정보입니다.</p>
                      </div>
                    </div>
                    <div className="admin-order-tracking-card">
                      <div>
                        <span className="muted">택배사</span>
                        <strong>{order.courierCompany ?? "-"}</strong>
                      </div>
                      <div>
                        <span className="muted">운송장 번호</span>
                        <strong>{order.trackingNumber ?? "-"}</strong>
                      </div>
                      <div>
                        <span className="muted">발송 시간</span>
                        <strong>{order.shippedAt ? formatDateTime(order.shippedAt) : "-"}</strong>
                      </div>
                      <div>
                        <span className="muted">배송 완료 시간</span>
                        <strong>{order.deliveredAt ? formatDateTime(order.deliveredAt) : "-"}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="admin-order-actions">
              <div className="card">
                <div className="card-body form admin-order-action-card">
                  <div>
                    <strong>배송 처리</strong>
                    <p className="muted">{getShippingActionDescription(order.status)}</p>
                  </div>
                  {order.status === "PAID" ? (
                    <button
                      className="button primary admin-order-primary-action"
                      type="button"
                      onClick={() => updateStatus("PREPARING")}
                      disabled={updating}
                    >
                      {updating ? "변경 중..." : "배송 준비 처리"}
                    </button>
                  ) : order.status === "PREPARING" ? (
                    <>
                      <label>
                        택배사
                        <input
                          className="input"
                          value={courierCompany}
                          onChange={(event) => setCourierCompany(event.target.value)}
                          disabled={updating}
                        />
                      </label>
                      <label>
                        운송장 번호
                        <input
                          className="input"
                          value={trackingNumber}
                          onChange={(event) => setTrackingNumber(event.target.value)}
                          disabled={updating}
                        />
                      </label>
                      <button
                        className="button primary admin-order-primary-action"
                        type="button"
                        onClick={() => updateStatus("SHIPPED")}
                        disabled={updating || !shippingInfoReady}
                      >
                        {updating ? "변경 중..." : "발송 처리"}
                      </button>
                    </>
                  ) : order.status === "SHIPPED" ? (
                    <button
                      className="button primary admin-order-primary-action"
                      type="button"
                      onClick={() => updateStatus("DELIVERED")}
                      disabled={updating}
                    >
                      {updating ? "변경 중..." : "배송 완료 처리"}
                    </button>
                  ) : order.status === "CANCELED" || order.status === "DELIVERED" ? (
                    <div className="admin-order-no-action">
                      더 이상 처리할 배송 액션이 없습니다.
                    </div>
                  ) : (
                    <div className="admin-order-no-action">현재 상태에서 처리할 배송 액션이 없습니다.</div>
                  )}
                </div>
              </div>

              {order.status === "PAID" ? (
                <div className="card">
                  <div className="card-body form admin-order-action-card">
                    <div>
                      <strong>결제 취소/환불</strong>
                      <p className="muted">취소 사유를 입력한 뒤 결제 취소/환불을 진행합니다.</p>
                    </div>
                    <label>
                      취소 사유
                      <textarea
                        className="textarea"
                        value={cancelReason}
                        onChange={(event) => setCancelReason(event.target.value)}
                        placeholder="취소 사유를 입력하세요."
                        disabled={canceling}
                      />
                    </label>
                    <button
                      className="button danger admin-order-danger-action"
                      type="button"
                      onClick={cancelPayment}
                      disabled={canceling || cancelReason.trim().length === 0}
                    >
                      {canceling ? "취소 처리 중..." : "결제 취소/환불"}
                    </button>
                  </div>
                </div>
              ) : order.status === "CANCELED" || order.status === "DELIVERED" ? (
                <div className="card">
                  <div className="card-body">
                    <div className="admin-order-no-action">더 이상 처리할 결제 액션이 없습니다.</div>
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}

function getAdminNextActionText(status: OrderStatus) {
  switch (status) {
    case "PAID":
      return "배송 준비 처리 또는 결제 취소/환불을 진행할 수 있습니다.";
    case "PREPARING":
      return "택배사와 운송장 번호를 입력한 뒤 발송 처리하세요.";
    case "SHIPPED":
      return "배송이 완료되면 배송 완료 처리하세요.";
    case "DELIVERED":
      return "배송 완료된 주문입니다.";
    case "CANCELED":
      return "취소/환불 처리된 주문입니다.";
    default:
      return "현재 주문 상태를 확인해 주세요.";
  }
}

function getShippingActionDescription(status: OrderStatus) {
  switch (status) {
    case "PAID":
      return "결제 완료 주문을 배송 준비 상태로 전환합니다.";
    case "PREPARING":
      return "택배사와 운송장 번호가 모두 있어야 발송 처리할 수 있습니다.";
    case "SHIPPED":
      return "고객 수령이 확인되면 배송 완료로 전환합니다.";
    case "DELIVERED":
      return "배송 완료 상태입니다.";
    case "CANCELED":
      return "취소된 주문입니다.";
    default:
      return "현재 상태에서는 배송 처리가 제한됩니다.";
  }
}
