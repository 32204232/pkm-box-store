"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const menuGroups = [
  {
    title: "쇼핑 정보",
    items: [
      { href: "/mypage", label: "마이페이지 홈", exact: true },
      { href: "/mypage/orders", label: "주문 내역" }
    ]
  },
  {
    title: "내 정보",
    items: [
      { href: "/mypage/login-info", label: "로그인 정보" },
      { href: "/mypage/profile", label: "프로필 관리" },
      { href: "/mypage/addresses", label: "주소록" }
    ]
  }
];

type MypageLayoutProps = {
  children: ReactNode;
};

export function MypageLayout({ children }: MypageLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="mypage-layout">
      <aside className="mypage-sidebar" aria-label="마이페이지 메뉴">
        <Link className="mypage-sidebar-title" href="/mypage">
          마이 페이지
        </Link>
        <nav className="mypage-sidebar-nav">
          {menuGroups.map((group) => (
            <section className="mypage-sidebar-group" key={group.title}>
              <h2>{group.title}</h2>
              <div>
                {group.items.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link className={active ? "is-active" : undefined} href={item.href} key={item.href}>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
      </aside>
      <div className="mypage-content">{children}</div>
    </div>
  );
}
