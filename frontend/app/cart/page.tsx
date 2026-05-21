"use client";

import { FormEvent, useEffect, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { api, formatPrice } from "@/lib/api";
import type { Cart } from "@/types/api";

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [address, setAddress] = useState("");

  async function loadCart() {
    try {
      setCart(await api.cart());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "장바구니 조회 실패");
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  async function updateQuantity(id: number, quantity: number) {
    await api.updateCartItem(id, { quantity });
    await loadCart();
  }

  async function removeItem(id: number) {
    await api.deleteCartItem(id);
    await loadCart();
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    try {
      const order = await api.createOrder({ receiverName, receiverPhone, address });
      setMessage(`주문이 생성되었습니다. 주문번호: ${order.orderUid}`);
      await loadCart();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "주문 생성 실패");
    }
  }

  return (
    <RequireAuth>
      <div className="stack">
        <div className="section-header">
          <h1>장바구니</h1>
        </div>
        <Message message={message} />
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
                        onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                      />
                    </td>
                    <td>{formatPrice(item.lineTotal)}</td>
                    <td>
                      <button className="button danger" onClick={() => removeItem(item.id)}>
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              <button className="button primary">주문 생성</button>
            </div>
          </form>
        </div>
      </div>
    </RequireAuth>
  );
}
