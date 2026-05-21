"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { api, formatPrice } from "@/lib/api";
import type { AdminOrder, OrderStatus } from "@/types/api";

const nextStatusByCurrentStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: "PREPARING",
  PREPARING: "SHIPPED",
  SHIPPED: "DELIVERED"
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = useMemo(() => Number(params.id), [params.id]);
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
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
      setOrder(await api.adminOrder(orderId));
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
      await api.updateAdminOrderStatus(orderId, status);
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

  const nextStatus = order ? nextStatusByCurrentStatus[order.status] : undefined;

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
          <div className="stack">
            <div className="card">
              <div className="card-body stack">
                <div className="row">
                  <span className="muted">주문번호</span>
                  <strong>{order.orderUid}</strong>
                </div>
                <div className="row">
                  <span className="muted">주문 상태</span>
                  <StatusBadge value={order.status} />
                </div>
                <div className="row">
                  <span className="muted">회원 ID</span>
                  <span>{order.memberId}</span>
                </div>
                <div className="row">
                  <span className="muted">회원 이메일</span>
                  <span>{order.memberEmail}</span>
                </div>
                <div className="row">
                  <span className="muted">회원 이름</span>
                  <span>{order.memberName}</span>
                </div>
                <div className="row">
                  <span className="muted">총 금액</span>
                  <strong>{formatPrice(order.totalPrice)}</strong>
                </div>
                <div className="row">
                  <span className="muted">만료 시간</span>
                  <span>{formatDateTime(order.expiresAt)}</span>
                </div>
                <div className="row">
                  <span className="muted">생성 시간</span>
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
                <div className="row">
                  <span className="muted">수정 시간</span>
                  <span>{formatDateTime(order.updatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="table-wrap">
              <table className="table">
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
                      <td>{item.productNameSnapshot}</td>
                      <td>{formatPrice(item.orderPrice)}</td>
                      <td>{item.quantity}</td>
                      <td>{formatPrice(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-body stack">
                <strong>배송 정보</strong>
                <div className="row">
                  <span className="muted">수령인</span>
                  <span>{order.receiverName}</span>
                </div>
                <div className="row">
                  <span className="muted">연락처</span>
                  <span>{order.receiverPhone}</span>
                </div>
                <div className="row">
                  <span className="muted">주소</span>
                  <span>{order.address}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body stack">
                <strong>상태 변경</strong>
                {nextStatus ? (
                  <div className="action-group">
                    <button
                      className="button primary"
                      type="button"
                      onClick={() => updateStatus(nextStatus)}
                      disabled={updating}
                    >
                      {nextStatus}
                    </button>
                  </div>
                ) : (
                  <span className="muted">변경 가능한 배송 상태가 없습니다.</span>
                )}
              </div>
            </div>

            {order.status === "PAID" && (
              <div className="card">
                <div className="card-body form">
                  <strong>결제 취소/환불</strong>
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
                    className="button danger"
                    type="button"
                    onClick={cancelPayment}
                    disabled={canceling || cancelReason.trim().length === 0}
                  >
                    {canceling ? "취소 처리 중..." : "결제 취소/환불"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
