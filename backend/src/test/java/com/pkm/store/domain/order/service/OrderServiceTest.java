package com.pkm.store.domain.order.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.pkm.store.domain.cart.entity.CartItem;
import com.pkm.store.domain.cart.repository.CartItemRepository;
import com.pkm.store.domain.deliveryaddress.entity.DeliveryAddress;
import com.pkm.store.domain.deliveryaddress.repository.DeliveryAddressRepository;
import com.pkm.store.domain.inventory.entity.InventoryHistory;
import com.pkm.store.domain.inventory.repository.InventoryHistoryRepository;
import com.pkm.store.domain.inventory.service.InventoryService;
import com.pkm.store.domain.inventory.type.InventoryHistoryType;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.member.repository.MemberRepository;
import com.pkm.store.domain.order.dto.AdminOrderResponse;
import com.pkm.store.domain.order.dto.AdminOrderStatusUpdateRequest;
import com.pkm.store.domain.order.dto.OrderCreateRequest;
import com.pkm.store.domain.order.dto.OrderResponse;
import com.pkm.store.domain.order.entity.Order;
import com.pkm.store.domain.order.entity.OrderItem;
import com.pkm.store.domain.order.repository.OrderRepository;
import com.pkm.store.domain.order.type.OrderStatus;
import com.pkm.store.domain.product.entity.Product;
import com.pkm.store.domain.product.repository.ProductRepository;
import com.pkm.store.domain.product.type.ProductStatus;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
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
class OrderServiceTest {

    private static final String MEMBER_EMAIL = "member@example.com";

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private InventoryHistoryRepository inventoryHistoryRepository;

    @Mock
    private DeliveryAddressRepository deliveryAddressRepository;

    @Mock
    private ProductRepository productRepository;

    private OrderService orderService;
    private Member member;

    @BeforeEach
    void setUp() {
        InventoryService inventoryService = new InventoryService(inventoryHistoryRepository);
        orderService = new OrderService(
                orderRepository,
                cartItemRepository,
                memberRepository,
                inventoryService,
                deliveryAddressRepository,
                productRepository
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
    void createOrderFromCartSucceeds() {
        Product product = createProduct(ProductStatus.ON_SALE, 10);
        CartItem cartItem = CartItem.create(member, product, 2);
        givenCurrentMember();
        given(cartItemRepository.findAllByMemberOrderByCreatedAtDesc(member)).willReturn(List.of(cartItem));
        givenLockedProduct(product);
        given(orderRepository.save(any(Order.class))).willAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.createOrderFromCart(createRequest());

        assertThat(response.status()).isEqualTo(OrderStatus.PAYMENT_PENDING);
        assertThat(response.totalPrice()).isEqualByComparingTo("60000");
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).productNameSnapshot()).isEqualTo("Pokemon Card Box");
        assertThat(response.items().get(0).orderPrice()).isEqualByComparingTo("30000");
    }

    @Test
    void createOrderFromCartDecreasesStock() {
        Product product = createProduct(ProductStatus.ON_SALE, 10);
        CartItem cartItem = CartItem.create(member, product, 3);
        givenCurrentMember();
        given(cartItemRepository.findAllByMemberOrderByCreatedAtDesc(member)).willReturn(List.of(cartItem));
        givenLockedProduct(product);
        given(orderRepository.save(any(Order.class))).willAnswer(invocation -> invocation.getArgument(0));

        orderService.createOrderFromCart(createRequest());

        assertThat(product.getStockQuantity()).isEqualTo(7);
    }

    @Test
    void createOrderFromCartClearsCartAfterOrderCreation() {
        Product product = createProduct(ProductStatus.ON_SALE, 10);
        CartItem cartItem = CartItem.create(member, product, 1);
        givenCurrentMember();
        given(cartItemRepository.findAllByMemberOrderByCreatedAtDesc(member)).willReturn(List.of(cartItem));
        givenLockedProduct(product);
        given(orderRepository.save(any(Order.class))).willAnswer(invocation -> invocation.getArgument(0));

        orderService.createOrderFromCart(createRequest());

        verify(cartItemRepository).deleteAllByMember(member);
    }

    @Test
    void createOrderFromCartSucceedsWithDeliveryAddressId() {
        Product product = createProduct(ProductStatus.ON_SALE, 10);
        CartItem cartItem = CartItem.create(member, product, 1);
        DeliveryAddress address = createDeliveryAddress();
        givenCurrentMember();
        given(cartItemRepository.findAllByMemberOrderByCreatedAtDesc(member)).willReturn(List.of(cartItem));
        given(deliveryAddressRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(address));
        givenLockedProduct(product);
        given(orderRepository.save(any(Order.class))).willAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.createOrderFromCart(createAddressRequest(1L));

        assertThat(response.receiverName()).isEqualTo("Address Receiver");
        assertThat(response.receiverPhone()).isEqualTo("010-2222-3333");
        assertThat(response.zipCode()).isEqualTo("12345");
        assertThat(response.address1()).isEqualTo("Seoul Address 1");
        assertThat(response.address2()).isEqualTo("Address 2");
    }

    @Test
    void createOrderFromCartStoresDeliveryAddressSnapshot() {
        Product product = createProduct(ProductStatus.ON_SALE, 10);
        CartItem cartItem = CartItem.create(member, product, 1);
        DeliveryAddress address = createDeliveryAddress();
        givenCurrentMember();
        given(cartItemRepository.findAllByMemberOrderByCreatedAtDesc(member)).willReturn(List.of(cartItem));
        given(deliveryAddressRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(address));
        givenLockedProduct(product);
        given(orderRepository.save(any(Order.class))).willAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.createOrderFromCart(createAddressRequest(1L));

        assertThat(response.address()).isEqualTo("12345 Seoul Address 1 Address 2");
        assertThat(response.zipCode()).isEqualTo("12345");
        assertThat(response.address1()).isEqualTo("Seoul Address 1");
        assertThat(response.address2()).isEqualTo("Address 2");
    }

    @Test
    void createOrderFromCartThrowsWhenDeliveryAddressDoesNotBelongToCurrentMember() {
        Product product = createProduct(ProductStatus.ON_SALE, 10);
        CartItem cartItem = CartItem.create(member, product, 1);
        givenCurrentMember();
        given(cartItemRepository.findAllByMemberOrderByCreatedAtDesc(member)).willReturn(List.of(cartItem));
        given(deliveryAddressRepository.findByIdAndMember(1L, member)).willReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.createOrderFromCart(createAddressRequest(1L)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ADDRESS_NOT_FOUND);
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void createOrderFromCartSucceedsWithoutDeliveryAddressId() {
        Product product = createProduct(ProductStatus.ON_SALE, 10);
        CartItem cartItem = CartItem.create(member, product, 1);
        givenCurrentMember();
        given(cartItemRepository.findAllByMemberOrderByCreatedAtDesc(member)).willReturn(List.of(cartItem));
        givenLockedProduct(product);
        given(orderRepository.save(any(Order.class))).willAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.createOrderFromCart(createRequest());

        assertThat(response.receiverName()).isEqualTo("Test Member");
        assertThat(response.receiverPhone()).isEqualTo("010-1234-5678");
        assertThat(response.address()).isEqualTo("Seoul");
    }

    @Test
    void createOrderFromCartThrowsBusinessExceptionWhenCartIsEmpty() {
        givenCurrentMember();
        given(cartItemRepository.findAllByMemberOrderByCreatedAtDesc(member)).willReturn(List.of());

        assertThatThrownBy(() -> orderService.createOrderFromCart(createRequest()))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void createOrderFromCartThrowsBusinessExceptionWhenStockIsNotEnough() {
        Product product = createProduct(ProductStatus.ON_SALE, 1);
        CartItem cartItem = CartItem.create(member, product, 2);
        givenCurrentMember();
        given(cartItemRepository.findAllByMemberOrderByCreatedAtDesc(member)).willReturn(List.of(cartItem));
        givenLockedProduct(product);

        assertThatThrownBy(() -> orderService.createOrderFromCart(createRequest()))
                .isInstanceOf(BusinessException.class);
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void createOrderFromCartThrowsBusinessExceptionWhenProductIsHidden() {
        Product product = createProduct(ProductStatus.HIDDEN, 10);
        CartItem cartItem = CartItem.create(member, product, 1);
        givenCurrentMember();
        given(cartItemRepository.findAllByMemberOrderByCreatedAtDesc(member)).willReturn(List.of(cartItem));
        givenLockedProduct(product);

        assertThatThrownBy(() -> orderService.createOrderFromCart(createRequest()))
                .isInstanceOf(BusinessException.class);
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void createOrderFromCartUsesPessimisticWriteLockWhenDecreasingStock() {
        Product product = createProduct(ProductStatus.ON_SALE, 10);
        CartItem cartItem = CartItem.create(member, product, 2);
        givenCurrentMember();
        given(cartItemRepository.findAllByMemberOrderByCreatedAtDesc(member)).willReturn(List.of(cartItem));
        givenLockedProduct(product);
        given(orderRepository.save(any(Order.class))).willAnswer(invocation -> invocation.getArgument(0));

        orderService.createOrderFromCart(createRequest());

        verify(productRepository).findByIdWithPessimisticWriteLock(product.getId());
    }

    @Test
    void createOrderFromCartThrowsOutOfStockWhenLockedProductStockIsNotEnough() {
        Product cartProduct = createProduct(ProductStatus.ON_SALE, 10);
        Product lockedProduct = createProduct(ProductStatus.ON_SALE, 1);
        ReflectionTestUtils.setField(lockedProduct, "id", cartProduct.getId());
        CartItem cartItem = CartItem.create(member, cartProduct, 2);
        givenCurrentMember();
        given(cartItemRepository.findAllByMemberOrderByCreatedAtDesc(member)).willReturn(List.of(cartItem));
        givenLockedProduct(lockedProduct);

        assertThatThrownBy(() -> orderService.createOrderFromCart(createRequest()))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.OUT_OF_STOCK);
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void expireOrderSucceedsWhenPaymentPendingOrderIsExpired() {
        Order order = createExpiredPendingOrder(createProduct(ProductStatus.ON_SALE, 5), 2);
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));

        orderService.expireOrder(1L);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.EXPIRED);
    }

    @Test
    void expireOrderRestoresStock() {
        Product product = createProduct(ProductStatus.ON_SALE, 5);
        Order order = createExpiredPendingOrder(product, 2);
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));

        orderService.expireOrder(1L);

        assertThat(product.getStockQuantity()).isEqualTo(7);
    }

    @Test
    void expireOrderSavesReleasedInventoryHistory() {
        Product product = createProduct(ProductStatus.ON_SALE, 5);
        Order order = createExpiredPendingOrder(product, 2);
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));
        ArgumentCaptor<InventoryHistory> captor = ArgumentCaptor.forClass(InventoryHistory.class);

        orderService.expireOrder(1L);

        verify(inventoryHistoryRepository).save(captor.capture());
        assertThat(captor.getValue().getType()).isEqualTo(InventoryHistoryType.RELEASED);
        assertThat(captor.getValue().getQuantity()).isEqualTo(2);
        assertThat(captor.getValue().getReason()).isEqualTo("ORDER_EXPIRED");
    }

    @Test
    void expireOrderThrowsBusinessExceptionWhenOrderIsPaid() {
        Order order = createExpiredPendingOrder(createProduct(ProductStatus.ON_SALE, 5), 2);
        ReflectionTestUtils.setField(order, "status", OrderStatus.PAID);
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.expireOrder(1L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void expireOrderThrowsBusinessExceptionWhenOrderIsAlreadyExpired() {
        Order order = createExpiredPendingOrder(createProduct(ProductStatus.ON_SALE, 5), 2);
        order.expire();
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.expireOrder(1L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void expireOrderThrowsBusinessExceptionWhenOrderDoesNotBelongToCurrentMember() {
        givenCurrentMember();
        given(orderRepository.findByIdAndMember(1L, member)).willReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.expireOrder(1L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void expireExpiredPendingOrdersExpiresExpiredOrders() {
        Order order = createExpiredPendingOrder(createProduct(ProductStatus.ON_SALE, 5), 2);
        given(orderRepository.findAllByStatusAndExpiresAtBefore(any(OrderStatus.class), any(LocalDateTime.class)))
                .willReturn(List.of(order));
        SecurityContextHolder.clearContext();

        orderService.expireExpiredPendingOrders();

        assertThat(order.getStatus()).isEqualTo(OrderStatus.EXPIRED);
    }

    @Test
    void expireExpiredPendingOrdersRestoresStock() {
        Product product = createProduct(ProductStatus.ON_SALE, 5);
        Order order = createExpiredPendingOrder(product, 2);
        given(orderRepository.findAllByStatusAndExpiresAtBefore(any(OrderStatus.class), any(LocalDateTime.class)))
                .willReturn(List.of(order));
        SecurityContextHolder.clearContext();

        orderService.expireExpiredPendingOrders();

        assertThat(product.getStockQuantity()).isEqualTo(7);
    }

    @Test
    void expireExpiredPendingOrdersContinuesWhenOneOrderFails() {
        Order failedOrder = createExpiredPendingOrder(createProduct(ProductStatus.ON_SALE, 5), 1);
        ReflectionTestUtils.setField(failedOrder, "status", OrderStatus.PAID);
        Order validOrder = createExpiredPendingOrder(createProduct(ProductStatus.ON_SALE, 5), 1);
        given(orderRepository.findAllByStatusAndExpiresAtBefore(any(OrderStatus.class), any(LocalDateTime.class)))
                .willReturn(List.of(failedOrder, validOrder));
        SecurityContextHolder.clearContext();

        orderService.expireExpiredPendingOrders();

        assertThat(failedOrder.getStatus()).isEqualTo(OrderStatus.PAID);
        assertThat(validOrder.getStatus()).isEqualTo(OrderStatus.EXPIRED);
        verify(inventoryHistoryRepository, times(1)).save(any(InventoryHistory.class));
    }

    @Test
    void getAdminOrdersSucceeds() {
        Order order = createOrder(OrderStatus.PAID);
        given(orderRepository.findAllByOrderByCreatedAtDesc()).willReturn(List.of(order));

        List<AdminOrderResponse> responses = orderService.getAdminOrders();

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).status()).isEqualTo(OrderStatus.PAID);
    }

    @Test
    void getAdminOrderSucceeds() {
        Order order = createOrder(OrderStatus.PAID);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        AdminOrderResponse response = orderService.getAdminOrder(1L);

        assertThat(response.status()).isEqualTo(OrderStatus.PAID);
        assertThat(response.memberEmail()).isEqualTo(MEMBER_EMAIL);
    }

    @Test
    void updateAdminOrderStatusFromPaidToPreparingSucceeds() {
        Order order = createOrder(OrderStatus.PAID);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        AdminOrderResponse response = orderService.updateAdminOrderStatus(
                1L,
                new AdminOrderStatusUpdateRequest(OrderStatus.PREPARING)
        );

        assertThat(response.status()).isEqualTo(OrderStatus.PREPARING);
    }

    @Test
    void updateAdminOrderStatusFromPreparingToShippedSucceeds() {
        Order order = createOrder(OrderStatus.PREPARING);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        AdminOrderResponse response = orderService.updateAdminOrderStatus(
                1L,
                new AdminOrderStatusUpdateRequest(OrderStatus.SHIPPED, "CJ대한통운", "1234567890")
        );

        assertThat(response.status()).isEqualTo(OrderStatus.SHIPPED);
        assertThat(response.courierCompany()).isEqualTo("CJ대한통운");
        assertThat(response.trackingNumber()).isEqualTo("1234567890");
        assertThat(response.shippedAt()).isNotNull();
    }

    @Test
    void updateAdminOrderStatusFromShippedToDeliveredSucceeds() {
        Order order = createOrder(OrderStatus.SHIPPED);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        AdminOrderResponse response = orderService.updateAdminOrderStatus(
                1L,
                new AdminOrderStatusUpdateRequest(OrderStatus.DELIVERED)
        );

        assertThat(response.status()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(response.deliveredAt()).isNotNull();
    }

    @Test
    void updateAdminOrderStatusFromPreparingToShippedThrowsWhenCourierCompanyIsMissing() {
        Order order = createOrder(OrderStatus.PREPARING);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateAdminOrderStatus(
                1L,
                new AdminOrderStatusUpdateRequest(OrderStatus.SHIPPED, null, "1234567890")
        )).isInstanceOf(BusinessException.class);
    }

    @Test
    void updateAdminOrderStatusFromPreparingToShippedThrowsWhenTrackingNumberIsMissing() {
        Order order = createOrder(OrderStatus.PREPARING);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateAdminOrderStatus(
                1L,
                new AdminOrderStatusUpdateRequest(OrderStatus.SHIPPED, "CJ대한통운", null)
        )).isInstanceOf(BusinessException.class);
    }

    @Test
    void updateAdminOrderStatusFromPaymentPendingToShippedThrowsBusinessException() {
        Order order = createOrder(OrderStatus.PAYMENT_PENDING);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateAdminOrderStatus(
                1L,
                new AdminOrderStatusUpdateRequest(OrderStatus.SHIPPED, "CJ대한통운", "1234567890")
        )).isInstanceOf(BusinessException.class);
    }

    @Test
    void updateAdminOrderStatusFromDeliveredThrowsBusinessException() {
        Order order = createOrder(OrderStatus.DELIVERED);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateAdminOrderStatus(
                1L,
                new AdminOrderStatusUpdateRequest(OrderStatus.SHIPPED, "CJ대한통운", "1234567890")
        )).isInstanceOf(BusinessException.class);
    }

    @Test
    void updateAdminOrderStatusFromPaymentPendingToPreparingThrowsBusinessException() {
        Order order = createOrder(OrderStatus.PAYMENT_PENDING);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateAdminOrderStatus(
                1L,
                new AdminOrderStatusUpdateRequest(OrderStatus.PREPARING)
        )).isInstanceOf(BusinessException.class);
    }

    @Test
    void updateAdminOrderStatusFromFailedToPreparingThrowsBusinessException() {
        Order order = createOrder(OrderStatus.FAILED);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateAdminOrderStatus(
                1L,
                new AdminOrderStatusUpdateRequest(OrderStatus.PREPARING)
        )).isInstanceOf(BusinessException.class);
    }

    private void givenCurrentMember() {
        given(memberRepository.findByEmail(MEMBER_EMAIL)).willReturn(Optional.of(member));
    }

    private void givenLockedProduct(Product product) {
        given(productRepository.findByIdWithPessimisticWriteLock(product.getId())).willReturn(Optional.of(product));
    }

    private OrderCreateRequest createRequest() {
        return new OrderCreateRequest("Test Member", "010-1234-5678", "Seoul", null);
    }

    private OrderCreateRequest createAddressRequest(Long deliveryAddressId) {
        return new OrderCreateRequest(null, null, null, deliveryAddressId);
    }

    private DeliveryAddress createDeliveryAddress() {
        return DeliveryAddress.create(
                member,
                "Home",
                "Address Receiver",
                "010-2222-3333",
                "12345",
                "Seoul Address 1",
                "Address 2",
                true
        );
    }

    private Order createExpiredPendingOrder(Product product, int quantity) {
        Order order = Order.create(member, "Test Member", "010-1234-5678", "Seoul");
        order.addOrderItem(OrderItem.create(product, quantity));
        ReflectionTestUtils.setField(order, "expiresAt", LocalDateTime.now().minusMinutes(1));
        return order;
    }

    private Order createOrder(OrderStatus status) {
        Order order = Order.create(member, "Test Member", "010-1234-5678", "Seoul");
        order.addOrderItem(OrderItem.create(createProduct(ProductStatus.ON_SALE, 5), 1));
        ReflectionTestUtils.setField(order, "status", status);
        return order;
    }

    private Product createProduct(ProductStatus status, int stockQuantity) {
        Product product = Product.create(
                "Pokemon Card Box",
                "Korean Pokemon card box",
                BigDecimal.valueOf(30000),
                "Booster Box",
                "Scarlet Violet",
                LocalDate.of(2026, 1, 1),
                stockQuantity,
                "https://example.com/product.jpg",
                status
        );
        ReflectionTestUtils.setField(product, "id", 1L);
        return product;
    }
}
