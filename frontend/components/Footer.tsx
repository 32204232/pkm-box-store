import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand-block">
          <Link href="/" className="footer-brand">
            PKM Box Store
          </Link>
          <p>포켓몬 카드 박스를 간결하게 둘러보고 구매할 수 있는 스토어입니다.</p>
        </div>

        <div className="footer-section">
          <strong>이용 안내</strong>
          <span>상품 재고와 판매 상태는 상품 상세에서 확인해 주세요.</span>
          <span>주문과 결제 내역은 로그인 후 마이페이지에서 확인할 수 있습니다.</span>
        </div>

        <div className="footer-section">
          <strong>고객지원</strong>
          <span>고객 문의는 관리자에게 문의해 주세요.</span>
          <span>운영 정보는 추후 업데이트 예정입니다.</span>
        </div>

        <div className="footer-section">
          <strong>고객센터</strong>
          <span>전화번호와 운영 시간은 아직 제공되지 않습니다.</span>
          <span>실제 사업자 정보는 등록 후 안내됩니다.</span>
        </div>
      </div>
    </footer>
  );
}
