package com.pkm.store.domain.payment.repository;

import com.pkm.store.domain.order.entity.Order;
import com.pkm.store.domain.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    boolean existsByOrder(Order order);

    boolean existsByPaymentKey(String paymentKey);
}
