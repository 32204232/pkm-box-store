package com.pkm.store.domain.payment.entity;

import com.pkm.store.domain.order.entity.Order;
import com.pkm.store.domain.payment.type.PaymentProvider;
import com.pkm.store.domain.payment.type.PaymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "payments",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_payment_order", columnNames = "order_id"),
                @UniqueConstraint(name = "uk_payment_payment_key", columnNames = "payment_key")
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentStatus status;

    @Column(nullable = false, unique = true, length = 200)
    private String paymentKey;

    @Column(nullable = false, length = 100)
    private String providerOrderId;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    private LocalDateTime approvedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private Payment(
            Order order,
            PaymentProvider provider,
            String paymentKey,
            String providerOrderId,
            BigDecimal amount,
            LocalDateTime approvedAt
    ) {
        this.order = order;
        this.provider = provider;
        this.status = PaymentStatus.APPROVED;
        this.paymentKey = paymentKey;
        this.providerOrderId = providerOrderId;
        this.amount = amount;
        this.approvedAt = approvedAt;
    }

    public static Payment approved(
            Order order,
            PaymentProvider provider,
            String paymentKey,
            String providerOrderId,
            BigDecimal amount,
            LocalDateTime approvedAt
    ) {
        return new Payment(order, provider, paymentKey, providerOrderId, amount, approvedAt);
    }

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
