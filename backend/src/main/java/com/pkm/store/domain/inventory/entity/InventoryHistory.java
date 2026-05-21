package com.pkm.store.domain.inventory.entity;

import com.pkm.store.domain.inventory.type.InventoryHistoryType;
import com.pkm.store.domain.product.entity.Product;
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
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "inventory_histories")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InventoryHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InventoryHistoryType type;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, length = 255)
    private String reason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private InventoryHistory(Product product, InventoryHistoryType type, int quantity, String reason) {
        this.product = product;
        this.type = type;
        this.quantity = quantity;
        this.reason = reason;
    }

    public static InventoryHistory create(
            Product product,
            InventoryHistoryType type,
            int quantity,
            String reason
    ) {
        return new InventoryHistory(product, type, quantity, reason);
    }

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
