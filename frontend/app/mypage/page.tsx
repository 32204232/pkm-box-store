"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Message } from "@/components/Message";
import { RecentViewedProducts } from "@/components/mypage/RecentViewedProducts";
import { loadRecentViewedProducts, type RecentViewedProduct } from "@/components/mypage/recentViewed";
import { StatusBadge } from "@/components/StatusBadge";
import { api, formatDateTime, formatPrice } from "@/lib/api";
import { getCurrentEmail } from "@/store/auth";
import type { DeliveryAddress, MemberResponse, Order, OrderStatus } from "@/types/api";

const orderSummaryItems: Array<{ status: OrderStatus; label: string }> = [
  { status: "PAYMENT_PENDING", label: "결제 대기" },
  { status: "PAID", label: "결제 완료" },
  { status: "SHIPPED", label: "배송 중" },
  { status: "DELIVERED", label: "배송 완료" }
];

function getOrderTitle(order: Order) {
  const firstItem = order.items[0]?.productNameSnapshot ?? "주문 상품";
  const otherCount = order.items.length - 1;
  return otherCount > 0 ? `${firstItem} 외 ${otherCount}개` : firstItem;
}

export default function MypageHomePage() {
  const [member, setMember] = useState<MemberResponse | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [recentViewed, setRecentViewed] = useState<RecentViewedProduct[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setMessage(null);
      try {
        const [memberResponse, orderResponse, addressResponse] = await Promise.all([api.me(), api.orders(), api.deliveryAddresses()]);
        if (!mounted) {
          return;
        }
        setMember(memberResponse);
        setOrders(orderResponse);
        setAddresses(addressResponse);
      } catch (error) {
        if (mounted) {
          setMessage(error instanceof Error ? error.message : "마이페이지 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (mounted) {
          setRecentViewed(loadRecentViewedProducts(5));
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const email = member?.email ?? getCurrentEmail() ?? "로그인 계정";
  const defaultAddress = addresses.find((address) => address.isDefault);
  const counts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.total += 1;
        acc.byStatus[order.status] = (acc.byStatus[order.status] ?? 0) + 1;
        return acc;
      },
      { total: 0, byStatus: {} as Partial<Record<OrderStatus, number>> }
    );
  }, [orders]);
  const recentOrders = orders.slice(0, 4);

  return (
    <div className="mypage-section">
      <div className="mypage-page-head">
        <div>
          <h1>마이페이지 홈</h1>
          <p>내 계정, 주문, 주소, 최근 본 상품을 한눈에 확인합니다.</p>
        </div>
      </div>
      <Message message={message} />

      <section className="mypage-profile-card" aria-label="프로필 요약">
        <div className="mypage-avatar">
          {member?.profileImageUrl ? <img src={member.profileImageUrl} alt="" /> : <span>{(member?.name ?? email).slice(0, 1).toUpperCase()}</span>}
        </div>
        <div>
          <strong>{member?.name ?? "PKM 회원"}</strong>
          <p>{email}</p>
          {member?.bio && <small>{member.bio}</small>}
        </div>
        <div className="mypage-profile-actions">
          <Link className="button" href="/mypage/profile">
            프로필 관리
          </Link>
          <Link className="button" href="/mypage/login-info">
            로그인 정보
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="alert">마이페이지 정보를 불러오고 있습니다.</div>
      ) : (
        <>
          <section className="mypage-quick-grid" aria-label="빠른 메뉴">
            <Link href="/mypage/orders">
              <span>주문</span>
              <strong>{counts.total}</strong>
              <small>전체 주문</small>
            </Link>
            <Link href="/mypage/addresses">
              <span>주소</span>
              <strong>{addresses.length}</strong>
              <small>{defaultAddress ? "기본 배송지 설정됨" : "기본 배송지 없음"}</small>
            </Link>
            <Link href="/mypage/login-info">
              <span>계정</span>
              <strong>보안</strong>
              <small>비밀번호 변경</small>
            </Link>
            <Link href="/mypage/profile">
              <span>프로필</span>
              <strong>관리</strong>
              <small>이름과 소개</small>
            </Link>
          </section>

          <section className="mypage-card">
            <div className="mypage-card-head">
              <div>
                <span>ORDER STATUS</span>
                <h2>구매 내역 요약</h2>
              </div>
              <Link href="/mypage/orders">전체 보기</Link>
            </div>
            <div className="mypage-status-grid">
              <div>
                <span>전체</span>
                <strong>{counts.total}</strong>
              </div>
              {orderSummaryItems.map((item) => (
                <div key={item.status}>
                  <span>{item.label}</span>
                  <strong>{counts.byStatus[item.status] ?? 0}</strong>
                </div>
              ))}
            </div>
          </section>

          <div className="mypage-dashboard-grid">
            <section className="mypage-card">
              <div className="mypage-card-head">
                <div>
                  <span>RECENT ORDERS</span>
                  <h2>최근 주문</h2>
                </div>
                <Link href="/mypage/orders">주문 내역</Link>
              </div>
              {recentOrders.length === 0 ? (
                <div className="mypage-empty">최근 주문이 없습니다.</div>
              ) : (
                <div className="mypage-mini-order-list">
                  {recentOrders.map((order) => (
                    <Link href={`/orders/${order.id}`} key={order.id}>
                      <div>
                        <strong>{getOrderTitle(order)}</strong>
                        <small>{formatDateTime(order.createdAt)}</small>
                      </div>
                      <div>
                        <StatusBadge value={order.status} />
                        <span>{formatPrice(order.totalPrice)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="mypage-card">
              <div className="mypage-card-head">
                <div>
                  <span>DEFAULT ADDRESS</span>
                  <h2>기본 배송지</h2>
                </div>
                <Link href="/mypage/addresses">주소록</Link>
              </div>
              {defaultAddress ? (
                <div className="mypage-default-address">
                  <strong>{defaultAddress.receiverName}</strong>
                  <span>{defaultAddress.receiverPhone}</span>
                  <p>
                    [{defaultAddress.zipCode}] {defaultAddress.address1} {defaultAddress.address2 ?? ""}
                  </p>
                </div>
              ) : (
                <div className="mypage-empty">기본 배송지를 등록해 주세요.</div>
              )}
            </section>
          </div>

          <section className="mypage-card">
            <div className="mypage-card-head">
              <div>
                <span>RECENT VIEWED</span>
                <h2>최근 본 상품</h2>
              </div>
              <Link href="/#shop">쇼핑 계속하기</Link>
            </div>
            <RecentViewedProducts products={recentViewed} />
          </section>
        </>
      )}
    </div>
  );
}
