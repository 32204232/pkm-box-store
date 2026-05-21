package com.pkm.store.domain.payment.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.pkm.store.domain.inventory.entity.InventoryHistory;
import com.pkm.store.domain.inventory.repository.InventoryHistoryRepository;
import com.pkm.store.domain.inventory.service.InventoryService;
import com.pkm.store.domain.inventory.type.InventoryHistoryType;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.member.repository.MemberRepository;
import com.pkm.store.domain.order.entity.Order;
import com.pkm.store.domain.order.entity.OrderItem;
import com.pkm.store.domain.order.repository.OrderRepository;
import com.pkm.store.domain.order.type.OrderStatus;
import com.pkm.store.domain.payment.client.PaymentApproveCommand;
import com.pkm.store.domain.payment.client.PaymentApproveResponse;
import com.pkm.store.domain.payment.client.PaymentClient;
import com.pkm.store.domain.payment.client.PaymentClientResolver;
import com.pkm.store.domain.payment.dto.PaymentConfirmRequest;
import com.pkm.store.domain.payment.dto.PaymentFailRequest;
import com.pkm.store.domain.payment.dto.PaymentResponse;
import com.pkm.store.domain.payment.entity.Payment;
import com.pkm.store.domain.payment.repository.PaymentRepository;
import com.pkm.store.domain.payment.type.PaymentProvider;
import com.pkm.store.domain.payment.type.PaymentStatus;
import com.pkm.store.domain.product.entity.Product;
import com.pkm.store.domain.product.type.ProductStatus;
import com.pkm.store.global.exception.BusinessException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    private static final String MEMBER_EMAIL = "member@example.com";

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private PaymentClientResolver paymentClientResolver;

    @Mock
    private PaymentClient paymentClient;

    @Mock
    private InventoryHistoryRepository inventoryHistoryRepository;

    private PaymentService paymentService;
    private Member member;

    @BeforeEach
    void setUp() {
        InventoryService inventoryService = new InventoryService(inventoryHistoryRepository);
        paymentService = new PaymentService(
                paymentRepository,
                orderRepository,
                memberRepository,
                paymentClientResolver,
                inventoryService
        );
        member = Member.create(MEMBER_EMAIL, "encoded-password", "Test Member");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(MEMBER_EMAIL, null)
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void confirmPaymentSucceeds() {
        Order order = createOrder(OrderStatus.PAYMENT_PENDING);
        givenConfirmSuccess(order);

        PaymentResponse response = paymentService.confirmPayment(createRequest(order, BigDecimal.valueOf(30000)));

        assertThat(response.provider()).isEqualTo(PaymentProvider.TOSS);
        assertThat(response.status()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(response.amount()).isEqualByComparingTo("30000");
    }

    @Test
    void confirmPaymentThrowsBusinessExceptionWhenAmountDoesNotMatch() {
        Order order = createOrder(OrderStatus.PAYMENT_PENDING);
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));

        assertThatThrownBy(() -> paymentService.confirmPayment(createRequest(order, BigDecimal.valueOf(10000))))
                .isInstanceOf(BusinessException.class);
        verify(paymentClient, never()).approve(any(PaymentApproveCommand.class));
    }

    @Test
    void confirmPaymentThrowsBusinessExceptionWhenOrderIsExpired() {
        Order order = createOrder(OrderStatus.EXPIRED);
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));

        assertThatThrownBy(() -> paymentService.confirmPayment(createRequest(order, BigDecimal.valueOf(30000))))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void confirmPaymentChangesOrderStatusToPaid() {
        Order order = createOrder(OrderStatus.PAYMENT_PENDING);
        givenConfirmSuccess(order);

        paymentService.confirmPayment(createRequest(order, BigDecimal.valueOf(30000)));

        assertThat(order.getStatus()).isEqualTo(OrderStatus.PAID);
    }

    @Test
    void confirmPaymentSavesConfirmedInventoryHistory() {
        Order order = createOrder(OrderStatus.PAYMENT_PENDING);
        givenConfirmSuccess(order);
        ArgumentCaptor<InventoryHistory> captor = ArgumentCaptor.forClass(InventoryHistory.class);

        paymentService.confirmPayment(createRequest(order, BigDecimal.valueOf(30000)));

        verify(inventoryHistoryRepository).save(captor.capture());
        assertThat(captor.getValue().getType()).isEqualTo(InventoryHistoryType.CONFIRMED);
        assertThat(captor.getValue().getQuantity()).isEqualTo(1);
        assertThat(captor.getValue().getReason()).isEqualTo("PAYMENT_APPROVED");
    }

    @Test
    void confirmPaymentThrowsBusinessExceptionWhenApproveResponseAmountDoesNotMatch() {
        Order order = createOrder(OrderStatus.PAYMENT_PENDING);
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));
        given(paymentRepository.existsByOrder(order)).willReturn(false);
        given(paymentRepository.existsByPaymentKey("payment-key")).willReturn(false);
        given(paymentClientResolver.resolve(PaymentProvider.TOSS)).willReturn(paymentClient);
        given(paymentClient.approve(any(PaymentApproveCommand.class))).willReturn(new PaymentApproveResponse(
                "payment-key",
                order.getOrderUid(),
                BigDecimal.valueOf(10000),
                LocalDateTime.of(2026, 5, 21, 9, 30)
        ));

        assertThatThrownBy(() -> paymentService.confirmPayment(createRequest(order, BigDecimal.valueOf(30000))))
                .isInstanceOf(BusinessException.class);
        verify(paymentRepository, never()).save(any(Payment.class));
        verify(inventoryHistoryRepository, never()).save(any(InventoryHistory.class));
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYMENT_PENDING);
    }

    @Test
    void confirmPaymentThrowsBusinessExceptionWhenProviderOrderIdDoesNotMatch() {
        Order order = createOrder(OrderStatus.PAYMENT_PENDING);
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));

        PaymentConfirmRequest request = new PaymentConfirmRequest(
                1L,
                PaymentProvider.TOSS,
                "payment-key",
                "wrong-order-id",
                BigDecimal.valueOf(30000)
        );

        assertThatThrownBy(() -> paymentService.confirmPayment(request))
                .isInstanceOf(BusinessException.class);
        verify(paymentClient, never()).approve(any(PaymentApproveCommand.class));
    }

    @Test
    void confirmPaymentThrowsBusinessExceptionWhenOrderAlreadyHasPayment() {
        Order order = createOrder(OrderStatus.PAYMENT_PENDING);
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));
        given(paymentRepository.existsByOrder(order)).willReturn(true);

        assertThatThrownBy(() -> paymentService.confirmPayment(createRequest(order, BigDecimal.valueOf(30000))))
                .isInstanceOf(BusinessException.class);
        verify(paymentClient, never()).approve(any(PaymentApproveCommand.class));
    }

    @Test
    void confirmPaymentThrowsBusinessExceptionWhenPaymentKeyAlreadyExists() {
        Order order = createOrder(OrderStatus.PAYMENT_PENDING);
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));
        given(paymentRepository.existsByOrder(order)).willReturn(false);
        given(paymentRepository.existsByPaymentKey("payment-key")).willReturn(true);

        assertThatThrownBy(() -> paymentService.confirmPayment(createRequest(order, BigDecimal.valueOf(30000))))
                .isInstanceOf(BusinessException.class);
        verify(paymentClient, never()).approve(any(PaymentApproveCommand.class));
    }

    @Test
    void failPaymentSucceedsWhenOrderIsPaymentPending() {
        Order order = createOrder(OrderStatus.PAYMENT_PENDING);
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));

        paymentService.failPayment(new PaymentFailRequest(1L));

        assertThat(order.getStatus()).isEqualTo(OrderStatus.FAILED);
    }

    @Test
    void failPaymentRestoresStock() {
        Order order = createOrder(OrderStatus.PAYMENT_PENDING);
        Product product = order.getOrderItems().get(0).getProduct();
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));

        paymentService.failPayment(new PaymentFailRequest(1L));

        assertThat(product.getStockQuantity()).isEqualTo(11);
    }

    @Test
    void failPaymentSavesReleasedInventoryHistory() {
        Order order = createOrder(OrderStatus.PAYMENT_PENDING);
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));
        ArgumentCaptor<InventoryHistory> captor = ArgumentCaptor.forClass(InventoryHistory.class);

        paymentService.failPayment(new PaymentFailRequest(1L));

        verify(inventoryHistoryRepository).save(captor.capture());
        assertThat(captor.getValue().getType()).isEqualTo(InventoryHistoryType.RELEASED);
        assertThat(captor.getValue().getQuantity()).isEqualTo(1);
        assertThat(captor.getValue().getReason()).isEqualTo("PAYMENT_FAILED");
    }

    @Test
    void failPaymentThrowsBusinessExceptionWhenOrderIsPaid() {
        Order order = createOrder(OrderStatus.PAID);
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));

        assertThatThrownBy(() -> paymentService.failPayment(new PaymentFailRequest(1L)))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void failPaymentThrowsBusinessExceptionWhenOrderIsExpired() {
        Order order = createOrder(OrderStatus.EXPIRED);
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));

        assertThatThrownBy(() -> paymentService.failPayment(new PaymentFailRequest(1L)))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void failPaymentThrowsBusinessExceptionWhenOrderDoesNotBelongToCurrentMember() {
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.failPayment(new PaymentFailRequest(1L)))
                .isInstanceOf(BusinessException.class);
    }

    private void givenConfirmSuccess(Order order) {
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));
        given(paymentRepository.existsByOrder(order)).willReturn(false);
        given(paymentRepository.existsByPaymentKey("payment-key")).willReturn(false);
        given(paymentClientResolver.resolve(PaymentProvider.TOSS)).willReturn(paymentClient);
        given(paymentClient.approve(any(PaymentApproveCommand.class))).willReturn(new PaymentApproveResponse(
                "payment-key",
                order.getOrderUid(),
                BigDecimal.valueOf(30000),
                LocalDateTime.of(2026, 5, 21, 9, 30)
        ));
        given(paymentRepository.save(any(Payment.class))).willAnswer(invocation -> invocation.getArgument(0));
    }

    private void givenCurrentMember() {
        given(memberRepository.findByEmail(MEMBER_EMAIL)).willReturn(Optional.of(member));
    }

    private PaymentConfirmRequest createRequest(Order order, BigDecimal amount) {
        return new PaymentConfirmRequest(
                1L,
                PaymentProvider.TOSS,
                "payment-key",
                order.getOrderUid(),
                amount
        );
    }

    private Order createOrder(OrderStatus status) {
        Product product = Product.create(
                "Pokemon Card Box",
                "Korean Pokemon card box",
                BigDecimal.valueOf(30000),
                "Booster Box",
                "Scarlet Violet",
                LocalDate.of(2026, 1, 1),
                10,
                "https://example.com/product.jpg",
                ProductStatus.ON_SALE
        );
        Order order = Order.create(member, "Test Member", "010-1234-5678", "Seoul");
        ReflectionTestUtils.setField(order, "id", 1L);
        order.addOrderItem(OrderItem.create(product, 1));
        ReflectionTestUtils.setField(order, "status", status);
        return order;
    }
}
