package com.pkm.store.domain.order.entity;

import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.order.type.OrderStatus;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "orders")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order {

    private static final long PAYMENT_EXPIRATION_MINUTES = 30;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String orderUid;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderStatus status;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalPrice;

    @Column(nullable = false, length = 100)
    private String receiverName;

    @Column(nullable = false, length = 30)
    private String receiverPhone;

    @Column(nullable = false, length = 500)
    private String address;

    @Column(length = 20)
    private String zipCode;

    @Column(length = 255)
    private String address1;

    @Column(length = 255)
    private String address2;

    @Column(length = 100)
    private String courierCompany;

    @Column(length = 100)
    private String trackingNumber;

    private LocalDateTime shippedAt;

    private LocalDateTime deliveredAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<OrderItem> orderItems = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private Order(
            Member member,
            String receiverName,
            String receiverPhone,
            String address,
            String zipCode,
            String address1,
            String address2
    ) {
        LocalDateTime now = LocalDateTime.now();
        this.orderUid = UUID.randomUUID().toString();
        this.member = member;
        this.status = OrderStatus.PAYMENT_PENDING;
        this.totalPrice = BigDecimal.ZERO;
        this.receiverName = receiverName;
        this.receiverPhone = receiverPhone;
        this.address = address;
        this.zipCode = zipCode;
        this.address1 = address1;
        this.address2 = address2;
        this.expiresAt = now.plusMinutes(PAYMENT_EXPIRATION_MINUTES);
    }

    public static Order create(Member member, String receiverName, String receiverPhone, String address) {
        return new Order(member, receiverName, receiverPhone, address, null, address, null);
    }

    public static Order create(
            Member member,
            String receiverName,
            String receiverPhone,
            String address,
            String zipCode,
            String address1,
            String address2
    ) {
        return new Order(member, receiverName, receiverPhone, address, zipCode, address1, address2);
    }

    public void addOrderItem(OrderItem orderItem) {
        orderItems.add(orderItem);
        orderItem.assignOrder(this);
        totalPrice = totalPrice.add(orderItem.getLineTotal());
    }

    public void updateDeliveryAddress(
            String receiverName,
            String receiverPhone,
            String address,
            String zipCode,
            String address1,
            String address2
    ) {
        if (status != OrderStatus.PAYMENT_PENDING) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }
        validateDeliveryAddress(receiverName, receiverPhone, address, zipCode, address1);
        this.receiverName = receiverName;
        this.receiverPhone = receiverPhone;
        this.address = address;
        this.zipCode = zipCode;
        this.address1 = address1;
        this.address2 = address2;
    }

    public void expire() {
        if (status != OrderStatus.PAYMENT_PENDING) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }
        if (!isExpired(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }
        this.status = OrderStatus.EXPIRED;
    }

    public void markPaid() {
        if (status != OrderStatus.PAYMENT_PENDING) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }
        this.status = OrderStatus.PAID;
    }

    public void failPayment() {
        if (status != OrderStatus.PAYMENT_PENDING) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }
        this.status = OrderStatus.FAILED;
    }

    public void cancelAfterPayment() {
        if (status != OrderStatus.PAID) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }
        this.status = OrderStatus.CANCELED;
    }

    public void changeDeliveryStatus(OrderStatus nextStatus, String courierCompany, String trackingNumber) {
        if (status == OrderStatus.PAID && nextStatus == OrderStatus.PREPARING) {
            this.status = nextStatus;
            return;
        }
        if (status == OrderStatus.PREPARING && nextStatus == OrderStatus.SHIPPED) {
            validateShippingInfo(courierCompany, trackingNumber);
            this.courierCompany = courierCompany;
            this.trackingNumber = trackingNumber;
            this.shippedAt = LocalDateTime.now();
            this.status = nextStatus;
            return;
        }
        if (status == OrderStatus.SHIPPED && nextStatus == OrderStatus.DELIVERED) {
            this.deliveredAt = LocalDateTime.now();
            this.status = nextStatus;
            return;
        }
        throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
    }

    private void validateShippingInfo(String courierCompany, String trackingNumber) {
        if (isBlank(courierCompany) || isBlank(trackingNumber)) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }
    }

    private void validateDeliveryAddress(
            String receiverName,
            String receiverPhone,
            String address,
            String zipCode,
            String address1
    ) {
        if (isBlank(receiverName) || isBlank(receiverPhone) || isBlank(address) || isBlank(zipCode) || isBlank(address1)) {
            throw new BusinessException(ErrorCode.INVALID_ADDRESS_REQUEST);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public boolean isExpired(LocalDateTime now) {
        return !expiresAt.isAfter(now);
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
