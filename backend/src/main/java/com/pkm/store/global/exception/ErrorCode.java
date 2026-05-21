package com.pkm.store.global.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다."),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 가입된 이메일입니다."),
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다."),
    INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "비밀번호가 일치하지 않습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    INVALID_IMAGE_FILE(HttpStatus.BAD_REQUEST, "지원하지 않는 이미지 파일입니다."),
    IMAGE_FILE_TOO_LARGE(HttpStatus.BAD_REQUEST, "이미지 파일 크기는 5MB 이하여야 합니다."),
    IMAGE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "이미지 업로드에 실패했습니다."),
    CART_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "장바구니 항목을 찾을 수 없습니다."),
    INVALID_CART_QUANTITY(HttpStatus.BAD_REQUEST, "장바구니 수량은 1 이상이어야 합니다."),
    PRODUCT_NOT_AVAILABLE(HttpStatus.BAD_REQUEST, "장바구니에 담을 수 없는 상품입니다."),
    ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."),
    EMPTY_CART(HttpStatus.BAD_REQUEST, "장바구니가 비어 있습니다."),
    OUT_OF_STOCK(HttpStatus.BAD_REQUEST, "상품 재고가 부족합니다."),
    ORDER_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "주문할 수 없는 상품이 포함되어 있습니다."),
    INVALID_ORDER_STATUS(HttpStatus.BAD_REQUEST, "유효하지 않은 주문 상태입니다."),
    PAYMENT_PROVIDER_NOT_SUPPORTED(HttpStatus.BAD_REQUEST, "지원하지 않는 결제사입니다."),
    PAYMENT_AMOUNT_MISMATCH(HttpStatus.BAD_REQUEST, "주문 금액과 결제 금액이 일치하지 않습니다."),
    PAYMENT_APPROVAL_FAILED(HttpStatus.BAD_REQUEST, "결제 승인에 실패했습니다."),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "잘못된 요청입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}
