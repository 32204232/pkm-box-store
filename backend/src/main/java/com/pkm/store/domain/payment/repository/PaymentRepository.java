package com.pkm.store.domain.payment.repository;

import com.pkm.store.domain.order.entity.Order;
import com.pkm.store.domain.payment.entity.Payment;
import com.pkm.store.domain.payment.type.PaymentStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    boolean existsByOrder(Order order);

    boolean existsByPaymentKey(String paymentKey);

    Optional<Payment> findByProviderOrderId(String providerOrderId);

    Optional<Payment> findByOrderAndStatus(Order order, PaymentStatus status);
}
