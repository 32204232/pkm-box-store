"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { api, formatPrice } from "@/lib/api";
import type { Cart } from "@/types/api";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);

  async function loadCart() {
    try {
      setCart(await api.cart());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "장바구니 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  async function updateQuantity(id: number, quantity: number) {
    if (updatingItemId !== null || quantity < 1) {
      return;
    }

    setUpdatingItemId(id);
    setMessage(null);
    try {
      await api.updateCartItem(id, { quantity });
      await loadCart();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "수량 변경 실패");
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function removeItem(id: number) {
    if (removingItemId !== null) {
      return;
    }

    setRemovingItemId(id);
    setMessage(null);
    try {
      await api.deleteCartItem(id);
      await loadCart();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "장바구니 상품 삭제 실패");
    } finally {
      setRemovingItemId(null);
    }
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creatingOrder) {
      return;
    }

    setCreatingOrder(true);
    setMessage(null);
    try {
      const order = await api.createOrder({ receiverName, receiverPhone, address });
      router.push(`/orders/${order.id}/payment`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "주문 생성 실패");
      setCreatingOrder(false);
    }
  }

  const isCartEmpty = !cart || cart.items.length === 0;

  return (
    <RequireAuth>
      <div className="stack">
        <div className="section-header">
          <h1>장바구니</h1>
        </div>
        <Message message={message} />
        {loading ? (
          <div className="alert">장바구니를 불러오고 있습니다.</div>
        ) : (
          <div className="split">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>상품</th>
                    <th>가격</th>
                    <th>수량</th>
                    <th>합계</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart?.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.productName}</td>
                      <td>{formatPrice(item.price)}</td>
                      <td>
                        <input
                          className="input"
                          min={1}
                          type="number"
                          value={item.quantity}
                          disabled={updatingItemId === item.id}
                          onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                        />
                      </td>
                      <td>{formatPrice(item.lineTotal)}</td>
                      <td>
                        <button
                          className="button danger"
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={removingItemId === item.id}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {isCartEmpty && <div className="alert">장바구니가 비어 있습니다.</div>}
            </div>
            <form className="card" onSubmit={createOrder}>
              <div className="card-body form">
                <strong>주문 생성</strong>
                <div className="row">
                  <span>총 수량</span>
                  <strong>{cart?.totalQuantity ?? 0}</strong>
                </div>
                <div className="row">
                  <span>총 금액</span>
                  <strong>{formatPrice(cart?.totalPrice ?? 0)}</strong>
                </div>
                <label>
                  수령인
                  <input className="input" value={receiverName} onChange={(event) => setReceiverName(event.target.value)} />
                </label>
                <label>
                  연락처
                  <input
                    className="input"
                    value={receiverPhone}
                    onChange={(event) => setReceiverPhone(event.target.value)}
                  />
                </label>
                <label>
                  주소
                  <textarea className="textarea" value={address} onChange={(event) => setAddress(event.target.value)} />
                </label>
                <button className="button primary" disabled={creatingOrder || isCartEmpty}>
                  주문 생성
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
