package com.pkm.store.domain.dashboard.service;

import com.pkm.store.domain.dashboard.dto.AdminDashboardOrderResponse;
import com.pkm.store.domain.dashboard.dto.AdminDashboardProductResponse;
import com.pkm.store.domain.dashboard.dto.AdminDashboardResponse;
import com.pkm.store.domain.order.repository.OrderRepository;
import com.pkm.store.domain.order.type.OrderStatus;
import com.pkm.store.domain.product.repository.ProductRepository;
import com.pkm.store.domain.product.type.ProductStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private static final int LOW_STOCK_THRESHOLD = 5;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public AdminDashboardResponse getDashboard() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime tomorrowStart = todayStart.plusDays(1);

        return new AdminDashboardResponse(
                orderRepository.countByCreatedAtRange(todayStart, tomorrowStart),
                todaySalesAmount(todayStart, tomorrowStart),
                orderRepository.countByStatus(OrderStatus.PAYMENT_PENDING),
                orderRepository.countByStatus(OrderStatus.PAID),
                orderRepository.countByStatus(OrderStatus.PREPARING),
                orderRepository.countByStatus(OrderStatus.SHIPPED),
                productRepository.countByStockQuantityLessThanEqualAndStatusNot(
                        LOW_STOCK_THRESHOLD,
                        ProductStatus.HIDDEN
                ),
                orderRepository.findTop5ByOrderByCreatedAtDesc()
                        .stream()
                        .map(AdminDashboardOrderResponse::from)
                        .toList(),
                productRepository.findAllByStockQuantityLessThanEqualAndStatusNotOrderByStockQuantityAscCreatedAtDesc(
                                LOW_STOCK_THRESHOLD,
                                ProductStatus.HIDDEN
                        )
                        .stream()
                        .map(AdminDashboardProductResponse::from)
                        .toList()
        );
    }

    private BigDecimal todaySalesAmount(LocalDateTime todayStart, LocalDateTime tomorrowStart) {
        BigDecimal amount = orderRepository.sumTotalPriceByStatusAndCreatedAtRange(
                OrderStatus.PAID,
                todayStart,
                tomorrowStart
        );
        return amount == null ? BigDecimal.ZERO : amount;
    }
}
