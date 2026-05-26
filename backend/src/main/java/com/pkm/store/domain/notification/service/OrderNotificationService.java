package com.pkm.store.domain.notification.service;

import com.pkm.store.domain.order.entity.Order;
import com.pkm.store.global.mail.CustomerEmailSender;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderNotificationService {

    private final CustomerEmailSender customerEmailSender;

    public void sendOrderCreated(Order order) {
        sendSafely(
                order,
                "[PKM Box Store] 주문이 생성되었습니다.",
                """
                        주문이 생성되었습니다.

                        주문번호: %s
                        결제금액: %s원

                        결제 대기 시간이 지나면 주문이 만료될 수 있습니다.
                        """.formatted(order.getOrderUid(), order.getTotalPrice().toPlainString())
        );
    }

    public void sendPaymentCompleted(Order order) {
        sendSafely(
                order,
                "[PKM Box Store] 결제가 완료되었습니다.",
                """
                        결제가 완료되었습니다.

                        주문번호: %s
                        결제금액: %s원

                        상품 준비가 시작되면 주문 상태가 변경됩니다.
                        """.formatted(order.getOrderUid(), order.getTotalPrice().toPlainString())
        );
    }

    public void sendShippingStarted(Order order) {
        sendSafely(
                order,
                "[PKM Box Store] 상품이 발송되었습니다.",
                """
                        상품이 발송되었습니다.

                        주문번호: %s
                        택배사: %s
                        운송장 번호: %s
                        """.formatted(order.getOrderUid(), order.getCourierCompany(), order.getTrackingNumber())
        );
    }

    public void sendDelivered(Order order) {
        sendSafely(
                order,
                "[PKM Box Store] 배송이 완료되었습니다.",
                """
                        배송이 완료되었습니다.

                        주문번호: %s

                        이용해 주셔서 감사합니다.
                        """.formatted(order.getOrderUid())
        );
    }

    private void sendSafely(Order order, String subject, String text) {
        try {
            customerEmailSender.send(order.getMember().getEmail(), subject, text);
        } catch (RuntimeException exception) {
            log.warn("Failed to send order notification email. orderId={}, subject={}", order.getId(), subject, exception);
        }
    }
}
