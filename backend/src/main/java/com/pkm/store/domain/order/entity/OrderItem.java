package com.pkm.store.domain.order.entity;

import com.pkm.store.domain.product.entity.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "order_items")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 120)
    private String productNameSnapshot;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal orderPrice;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal lineTotal;

    private OrderItem(Product product, int quantity) {
        this.product = product;
        this.productNameSnapshot = product.getName();
        this.orderPrice = product.getPrice();
        this.quantity = quantity;
        this.lineTotal = product.getPrice().multiply(BigDecimal.valueOf(quantity));
    }

    public static OrderItem create(Product product, int quantity) {
        return new OrderItem(product, quantity);
    }

    void assignOrder(Order order) {
        this.order = order;
    }
}
