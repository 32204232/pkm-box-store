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
      <nav className="nav" aria-label="주요 메뉴">
        <div className="nav-main">
          <Link href="/">Shop</Link>
          {loggedIn && <Link href="/cart">Cart</Link>}
          {loggedIn && <Link href="/orders">Orders</Link>}
        </div>

        {role === "ROLE_ADMIN" && (
          <div className="nav-admin" aria-label="관리자 메뉴">
            <span className="nav-admin-label">Admin</span>
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/products">Products</Link>
            <Link href="/admin/orders">Orders</Link>
            <Link href="/admin/audit-logs">Audit Logs</Link>
          </div>
        )}

        <div className="nav-auth">
          {loggedIn ? (
            <button className="nav-button" type="button" onClick={logout}>
              Logout
            </button>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/signup">Join</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
