"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api, formatPrice } from "@/lib/api";
import { clearAccessToken, getCurrentRole, isLoggedIn, onAuthChanged } from "@/store/auth";
import type { MemberRole, Product } from "@/types/api";

type RecentViewedProduct = {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
};

type PopularSearch = {
  keyword: string;
  source: string;
  count: number;
};

const RECENT_SEARCHES_KEY = "pkm_recent_searches";
const RECENT_VIEWED_KEY = "pkm_recent_viewed_products";

export function Header() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<MemberRole | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentViewed, setRecentViewed] = useState<RecentViewedProduct[]>([]);
  const [menuProducts, setMenuProducts] = useState<Product[]>([]);

  function refreshAuthState() {
    setLoggedIn(isLoggedIn());
    setRole(getCurrentRole());
  }

  useEffect(() => {
    refreshAuthState();
    return onAuthChanged(refreshAuthState);
  }, []);

  useEffect(() => {
    api
      .products({ sort: "latest" })
      .then((products) => setMenuProducts(products))
      .catch(() => setMenuProducts([]));
  }, []);

  useEffect(() => {
    loadSearchStorage();
  }, []);

  useEffect(() => {
    if (!searchOpen && !menuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchOpen, menuOpen]);

  function logout() {
    clearAccessToken();
    refreshAuthState();
    setMenuOpen(false);
    setSearchOpen(false);
    router.push("/");
  }

  function loadSearchStorage() {
    try {
      const storedSearches = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      const storedViewed = window.localStorage.getItem(RECENT_VIEWED_KEY);
      const parsedViewed = storedViewed ? JSON.parse(storedViewed) : [];

      setRecentSearches(storedSearches ? JSON.parse(storedSearches) : []);
      setRecentViewed(
        Array.isArray(parsedViewed)
          ? parsedViewed
              .filter((item) => typeof item?.id === "number" && typeof item?.name === "string")
              .map((item) => ({
                id: item.id,
                name: item.name,
                price: typeof item.price === "number" ? item.price : 0,
                imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null
              }))
              .slice(0, 10)
          : []
      );
    } catch {
      setRecentSearches([]);
      setRecentViewed([]);
    }
  }

  function openSearchPanel() {
    setMenuOpen(false);
    loadSearchStorage();
    setSearchOpen(true);
  }

  function closeSearchPanel() {
    setSearchOpen(false);
    setSearchInput("");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const keyword = searchInput.trim();
    if (!keyword) {
      return;
    }

    const nextSearches = [keyword, ...recentSearches.filter((item) => item !== keyword)].slice(0, 6);
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextSearches));
    setRecentSearches(nextSearches);
    closeSearchPanel();
    router.push(`/?keyword=${encodeURIComponent(keyword)}#shop`);
    window.dispatchEvent(new CustomEvent("pkm-product-search", { detail: { keyword } }));
  }

  function selectSearchKeyword(keyword: string) {
    setSearchInput(keyword);
    const nextSearches = [keyword, ...recentSearches.filter((item) => item !== keyword)].slice(0, 6);
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextSearches));
    setRecentSearches(nextSearches);
    closeSearchPanel();
    router.push(`/?keyword=${encodeURIComponent(keyword)}#shop`);
    window.dispatchEvent(new CustomEvent("pkm-product-search", { detail: { keyword } }));
  }

  function clearRecentSearches() {
    window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecentSearches([]);
  }

  const categories = Array.from(new Set(menuProducts.map((product) => product.category).filter(Boolean))).slice(0, 8);
  const series = Array.from(new Set(menuProducts.map((product) => product.series).filter(Boolean))).slice(0, 8);
  const todayPicks = menuProducts.filter((product) => product.status === "ON_SALE" && product.stockQuantity > 0).slice(0, 3);
  const issueProducts = menuProducts.filter((product) => product.imageUrl).slice(0, 5);
  const popularSearches = useMemo(() => {
    const terms = new Map<string, PopularSearch>();

    function addTerm(keyword: string | null | undefined, source: string) {
      const normalized = keyword?.trim();
      if (!normalized) {
        return;
      }

      const current = terms.get(normalized);
      terms.set(normalized, {
        keyword: normalized,
        source: current?.source ?? source,
        count: (current?.count ?? 0) + 1
      });
    }

    menuProducts.forEach((product) => {
      addTerm(product.name, "상품명");
      addTerm(product.category, "카테고리");
      addTerm(product.series, "시리즈");
    });

    return Array.from(terms.values())
      .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword, "ko-KR"))
      .slice(0, 20);
  }, [menuProducts]);

  return (
    <header className="site-header">
      <div className="header-util" aria-label="상단 메뉴">
        <button type="button" disabled>
          고객센터 준비중
        </button>
        {loggedIn ? <Link href="/mypage">마이페이지</Link> : <button type="button" disabled>마이페이지</button>}
        <button type="button" disabled>
          관심 준비중
        </button>
        <button type="button" disabled>
          알림 준비중
        </button>
        <div className="header-auth">
          {loggedIn ? (
            <button type="button" onClick={logout}>
              로그아웃
            </button>
          ) : (
            <>
              <Link href="/login">로그인</Link>
              <Link href="/signup">회원가입</Link>
            </>
          )}
        </div>
      </div>

      <div className="topbar">
        <Link className="brand" href="/" onClick={() => setMenuOpen(false)}>
          PKM Box Store
        </Link>
        <nav className="nav" aria-label="주요 메뉴">
          <div className="nav-main">
            <Link href="/">HOME</Link>
            <Link href="/#shop">SHOP</Link>
            <Link href="/#ranking">RANKING</Link>
          </div>

          <div className="nav-icons" aria-label="빠른 메뉴">
            <button className="nav-icon-link" type="button" onClick={openSearchPanel} aria-label="상품 검색">
              검색
            </button>
            {loggedIn ? (
              <Link className="nav-icon-link" href="/cart" aria-label="장바구니">
                장바구니
              </Link>
            ) : (
              <button className="nav-icon-link" type="button" disabled aria-label="장바구니 로그인 필요">
                장바구니
              </button>
            )}
            <button
              className="nav-menu-button"
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setMenuOpen((current) => !current);
              }}
              aria-expanded={menuOpen}
            >
              메뉴
            </button>
          </div>
        </nav>
      </div>

      {menuOpen &&
        createPortal(
        <div className="drawer-overlay" role="presentation" onClick={closeMenu}>
          <aside className="header-drawer" aria-label="확장 메뉴" onClick={(event) => event.stopPropagation()}>
            <div className="header-drawer-head">
              <strong>Menu</strong>
              <button type="button" onClick={closeMenu}>
                닫기
              </button>
            </div>

            <div className="header-drawer-section">
              <div className="header-drawer-title">
                <span>CATEGORY</span>
                <strong>카테고리</strong>
              </div>
              <div className="header-drawer-chip-list">
                {categories.length > 0 ? categories.map((category) => <span key={category}>{category}</span>) : <span>상품 데이터 준비중</span>}
              </div>
            </div>

            <div className="header-drawer-section">
              <div className="header-drawer-title">
                <span>SERIES</span>
                <strong>시리즈</strong>
              </div>
              <div className="header-drawer-chip-list">
                {series.length > 0 ? series.map((item) => <span key={item}>{item}</span>) : <span>상품 데이터 준비중</span>}
              </div>
            </div>

            <div className="header-drawer-section">
              <div className="header-drawer-title">
                <span>DISCOVER</span>
                <strong>추천 탐색</strong>
              </div>
              <div className="header-pick-list">
                {todayPicks.length > 0 ? (
                  todayPicks.map((product) => (
                    <Link key={product.id} href={`/products/${product.id}`} onClick={closeMenu}>
                      <span>{product.category}</span>
                      <strong>{product.name}</strong>
                    </Link>
                  ))
                ) : (
                  <span className="header-empty-text">판매 중 상품 데이터가 없습니다.</span>
                )}
              </div>
            </div>

            {role === "ROLE_ADMIN" && (
              <div className="header-drawer-section header-drawer-admin" aria-label="관리자 메뉴">
                <div className="header-drawer-title">
                  <span>ADMIN</span>
                  <strong>관리자</strong>
                </div>
                <div className="header-admin-links">
                  <Link href="/admin" onClick={closeMenu}>Dashboard</Link>
                  <Link href="/admin/products" onClick={closeMenu}>Products</Link>
                  <Link href="/admin/orders" onClick={closeMenu}>Orders</Link>
                  <Link href="/admin/audit-logs" onClick={closeMenu}>Audit Logs</Link>
                </div>
              </div>
            )}
          </aside>
        </div>,
        document.body
      )}

      {searchOpen && (
        <div className="search-overlay" role="dialog" aria-modal="true" aria-label="상품 검색">
          <div className="search-panel">
            <div className="search-panel-head">
              <span>검색</span>
              <button className="search-close-button" type="button" onClick={closeSearchPanel} aria-label="검색 닫기">
                닫기
              </button>
            </div>

            <div className="search-input-area">
              <form className="search-panel-form" onSubmit={submitSearch}>
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="브랜드, 상품, 시리즈, 태그 등"
                  autoFocus
                  aria-label="검색어"
                />
                <button type="submit">검색</button>
              </form>
            </div>

            <section className="search-panel-section">
              <div className="search-section-head">
                <strong>최근 검색어</strong>
                {recentSearches.length > 0 && (
                  <button type="button" onClick={clearRecentSearches}>
                    지우기
                  </button>
                )}
              </div>
              {recentSearches.length > 0 ? (
                <div className="search-keyword-list">
                  {recentSearches.map((keyword) => (
                    <button key={keyword} type="button" onClick={() => selectSearchKeyword(keyword)}>
                      {keyword}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="search-empty-text">최근 검색어가 없습니다.</p>
              )}
            </section>

            <section className="search-panel-section">
              <div className="search-section-head">
                <strong>지금 가장 뜨는 이슈?</strong>
              </div>
              {issueProducts.length > 0 ? (
                <div className="search-issue-list">
                  {issueProducts.map((product) => (
                    <Link key={product.id} href={`/products/${product.id}`} onClick={closeSearchPanel}>
                      <span>
                        {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <em>PKM</em>}
                      </span>
                      <strong>{product.name}</strong>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="search-empty-text">추천 상품을 준비 중입니다.</p>
              )}
            </section>

            <section className="search-panel-section">
              <div className="search-section-head">
                <strong>인기 검색어</strong>
                <span>현재 상품 데이터 기준</span>
              </div>
              {popularSearches.length > 0 ? (
                <div className="search-popular-grid">
                  {popularSearches.map((item, index) => (
                    <button key={item.keyword} type="button" onClick={() => selectSearchKeyword(item.keyword)}>
                      <em>{String(index + 1).padStart(2, "0")}</em>
                      <span>{item.keyword}</span>
                      <small>{item.source}</small>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="search-empty-text">상품 데이터 기준 검색어를 준비 중입니다.</p>
              )}
            </section>

            <section className="search-panel-section">
              <div className="search-section-head">
                <strong>최근 본 상품</strong>
              </div>
              {recentViewed.length > 0 ? (
                <div className="search-viewed-list">
                  {recentViewed.map((product) => (
                    <Link key={product.id} href={`/products/${product.id}`} onClick={closeSearchPanel}>
                      {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span>PKM</span>}
                      <div>
                        <strong>{product.name}</strong>
                        <em>{formatPrice(product.price)}</em>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="search-empty-text">최근 본 상품이 없습니다.</p>
              )}
            </section>
          </div>
        </div>
      )}
    </header>
  );
}
