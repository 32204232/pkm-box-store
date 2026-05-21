package com.pkm.store.domain.payment.dto;

import com.pkm.store.domain.payment.entity.Payment;
import com.pkm.store.domain.payment.type.PaymentProvider;
import com.pkm.store.domain.payment.type.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long paymentId,
        Long orderId,
        PaymentProvider provider,
        PaymentStatus status,
        BigDecimal amount,
        LocalDateTime approvedAt
) {

    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getProvider(),
                payment.getStatus(),
                payment.getAmount(),
                payment.getApprovedAt()
        );
    }
}
