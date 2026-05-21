package com.pkm.store.domain.cart.entity;

import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.product.entity.Product;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "cart_items",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_cart_item_member_product",
                columnNames = {"member_id", "product_id"}
        )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private CartItem(Member member, Product product, int quantity) {
        validateQuantity(quantity);
        this.member = member;
        this.product = product;
        this.quantity = quantity;
    }

    public static CartItem create(Member member, Product product, int quantity) {
        return new CartItem(member, product, quantity);
    }

    public void addQuantity(int quantity) {
        validateQuantity(quantity);
        this.quantity += quantity;
    }

    public void changeQuantity(int quantity) {
        validateQuantity(quantity);
        this.quantity = quantity;
    }

    private static void validateQuantity(int quantity) {
        if (quantity < 1) {
            throw new BusinessException(ErrorCode.INVALID_CART_QUANTITY);
        }
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
