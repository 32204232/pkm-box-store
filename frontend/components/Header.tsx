"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAccessToken, getCurrentRole, isLoggedIn, onAuthChanged } from "@/store/auth";
import type { MemberRole } from "@/types/api";

export function Header() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<MemberRole | null>(null);

  function refreshAuthState() {
    setLoggedIn(isLoggedIn());
    setRole(getCurrentRole());
  }

  useEffect(() => {
    refreshAuthState();
    return onAuthChanged(refreshAuthState);
  }, []);

  function logout() {
    clearAccessToken();
    refreshAuthState();
    router.push("/");
  }

  return (
    <header className="topbar">
      <Link className="brand" href="/">
        PKM Box Store
      </Link>
      <nav className="nav">
        <Link href="/">상품</Link>
        {loggedIn && <Link href="/cart">장바구니</Link>}
        {loggedIn && <Link href="/orders">주문</Link>}
        {role === "ROLE_ADMIN" && <Link href="/admin">관리자 대시보드</Link>}
        {role === "ROLE_ADMIN" && <Link href="/admin/products">관리자 상품</Link>}
        {role === "ROLE_ADMIN" && <Link href="/admin/orders">관리자 주문</Link>}
        {role === "ROLE_ADMIN" && <Link href="/admin/audit-logs">감사 로그</Link>}
        {loggedIn ? (
          <button className="nav-button" type="button" onClick={logout}>
            로그아웃
          </button>
        ) : (
          <>
            <Link href="/login">로그인</Link>
            <Link href="/signup">회원가입</Link>
          </>
        )}
      </nav>
    </header>
  );
}
