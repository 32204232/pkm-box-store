package com.pkm.store.domain.dashboard.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.pkm.store.domain.dashboard.dto.AdminDashboardResponse;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.order.entity.Order;
import com.pkm.store.domain.order.repository.OrderRepository;
import com.pkm.store.domain.order.type.OrderStatus;
import com.pkm.store.domain.product.entity.Product;
import com.pkm.store.domain.product.repository.ProductRepository;
import com.pkm.store.domain.product.type.ProductStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Test
    void getDashboardCalculatesTodayOrderCount() {
        AdminDashboardService service = createService();
        given(orderRepository.countByCreatedAtRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .willReturn(3L);

        AdminDashboardResponse response = service.getDashboard();

        assertThat(response.todayOrderCount()).isEqualTo(3);
        ArgumentCaptor<LocalDateTime> startCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> endCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(orderRepository).countByCreatedAtRange(startCaptor.capture(), endCaptor.capture());
        assertThat(startCaptor.getValue()).isEqualTo(LocalDate.now().atStartOfDay());
        assertThat(endCaptor.getValue()).isEqualTo(LocalDate.now().plusDays(1).atStartOfDay());
    }

    @Test
    void getDashboardCalculatesTodaySalesAmount() {
        AdminDashboardService service = createService();
        given(orderRepository.sumTotalPriceByStatusAndCreatedAtRange(
                eq(OrderStatus.PAID),
                any(LocalDateTime.class),
                any(LocalDateTime.class)
        )).willReturn(BigDecimal.valueOf(90000));

        AdminDashboardResponse response = service.getDashboard();

        assertThat(response.todaySalesAmount()).isEqualByComparingTo("90000");
    }

    @Test
    void getDashboardCalculatesOrderCountByStatus() {
        AdminDashboardService service = createService();
        given(orderRepository.countByStatus(OrderStatus.PAYMENT_PENDING)).willReturn(1L);
        given(orderRepository.countByStatus(OrderStatus.PAID)).willReturn(2L);
        given(orderRepository.countByStatus(OrderStatus.PREPARING)).willReturn(3L);
        given(orderRepository.countByStatus(OrderStatus.SHIPPED)).willReturn(4L);

        AdminDashboardResponse response = service.getDashboard();

        assertThat(response.paymentPendingOrderCount()).isEqualTo(1);
        assertThat(response.paidOrderCount()).isEqualTo(2);
        assertThat(response.preparingOrderCount()).isEqualTo(3);
        assertThat(response.shippedOrderCount()).isEqualTo(4);
    }

    @Test
    void getDashboardCalculatesLowStockProductCount() {
        AdminDashboardService service = createService();
        given(productRepository.countByStockQuantityLessThanEqualAndStatusNot(5, ProductStatus.HIDDEN))
                .willReturn(7L);

        AdminDashboardResponse response = service.getDashboard();

        assertThat(response.lowStockProductCount()).isEqualTo(7);
    }

    @Test
    void getDashboardReturnsRecentFiveOrders() {
        AdminDashboardService service = createService();
        given(orderRepository.findTop5ByOrderByCreatedAtDesc()).willReturn(List.of(
                order(1L),
                order(2L),
                order(3L),
                order(4L),
                order(5L)
        ));

        AdminDashboardResponse response = service.getDashboard();

        assertThat(response.recentOrders()).hasSize(5);
        assertThat(response.recentOrders()).extracting("id").containsExactly(1L, 2L, 3L, 4L, 5L);
    }

    @Test
    void getDashboardExcludesHiddenProductsFromLowStockProducts() {
        AdminDashboardService service = createService();
        given(productRepository.findAllByStockQuantityLessThanEqualAndStatusNotOrderByStockQuantityAscCreatedAtDesc(
                5,
                ProductStatus.HIDDEN
        )).willReturn(List.of(product(1L, ProductStatus.ON_SALE)));

        AdminDashboardResponse response = service.getDashboard();

        assertThat(response.lowStockProducts()).hasSize(1);
        assertThat(response.lowStockProducts().get(0).status()).isEqualTo(ProductStatus.ON_SALE);
        verify(productRepository).findAllByStockQuantityLessThanEqualAndStatusNotOrderByStockQuantityAscCreatedAtDesc(
                5,
                ProductStatus.HIDDEN
        );
    }

    private AdminDashboardService createService() {
        return new AdminDashboardService(orderRepository, productRepository);
    }

    private Order order(Long id) {
        Member member = Member.create("member" + id + "@example.com", "password", "Member " + id);
        Order order = Order.create(member, "Receiver", "010-1234-5678", "Seoul");
        ReflectionTestUtils.setField(order, "id", id);
        ReflectionTestUtils.setField(order, "status", OrderStatus.PAID);
        ReflectionTestUtils.setField(order, "createdAt", LocalDateTime.now().minusMinutes(id));
        return order;
    }

    private Product product(Long id, ProductStatus status) {
        Product product = Product.create(
                "Pokemon Card Box " + id,
                "Korean Pokemon card box",
                BigDecimal.valueOf(30000),
                "Booster Box",
                "Scarlet Violet",
                LocalDate.of(2026, 1, 1),
                3,
                null,
                status
        );
        ReflectionTestUtils.setField(product, "id", id);
        return product;
    }
}
