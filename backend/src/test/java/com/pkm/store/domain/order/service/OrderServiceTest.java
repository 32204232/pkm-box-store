package com.pkm.store.domain.order.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.pkm.store.domain.cart.entity.CartItem;
import com.pkm.store.domain.cart.repository.CartItemRepository;
import com.pkm.store.domain.inventory.repository.InventoryHistoryRepository;
import com.pkm.store.domain.inventory.service.InventoryService;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.member.repository.MemberRepository;
import com.pkm.store.domain.order.dto.OrderCreateRequest;
import com.pkm.store.domain.order.dto.OrderResponse;
import com.pkm.store.domain.order.entity.Order;
import com.pkm.store.domain.order.repository.OrderRepository;
import com.pkm.store.domain.order.type.OrderStatus;
import com.pkm.store.domain.product.entity.Product;
import com.pkm.store.domain.product.type.ProductStatus;
import com.pkm.store.global.exception.BusinessException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

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

    private OrderService orderService;
    private Member member;

    @BeforeEach
    void setUp() {
        InventoryService inventoryService = new InventoryService(inventoryHistoryRepository);
        orderService = new OrderService(orderRepository, cartItemRepository, memberRepository, inventoryService);
        member = Member.create(MEMBER_EMAIL, "encoded-password", "홍길동");
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
        given(orderRepository.save(any(Order.class))).willAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.createOrderFromCart(createRequest());

        assertThat(response.status()).isEqualTo(OrderStatus.PAYMENT_PENDING);
        assertThat(response.totalPrice()).isEqualByComparingTo("60000");
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).productNameSnapshot()).isEqualTo("포켓몬 카드 박스");
        assertThat(response.items().get(0).orderPrice()).isEqualByComparingTo("30000");
    }

    @Test
    void createOrderFromCartDecreasesStock() {
        Product product = createProduct(ProductStatus.ON_SALE, 10);
        CartItem cartItem = CartItem.create(member, product, 3);
        givenCurrentMember();
        given(cartItemRepository.findAllByMemberOrderByCreatedAtDesc(member)).willReturn(List.of(cartItem));
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
        given(orderRepository.save(any(Order.class))).willAnswer(invocation -> invocation.getArgument(0));

        orderService.createOrderFromCart(createRequest());

        verify(cartItemRepository).deleteAllByMember(member);
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

        assertThatThrownBy(() -> orderService.createOrderFromCart(createRequest()))
                .isInstanceOf(BusinessException.class);
        verify(orderRepository, never()).save(any(Order.class));
    }

    private void givenCurrentMember() {
        given(memberRepository.findByEmail(MEMBER_EMAIL)).willReturn(Optional.of(member));
    }

    private OrderCreateRequest createRequest() {
        return new OrderCreateRequest("홍길동", "010-1234-5678", "서울시 강남구");
    }

    private Product createProduct(ProductStatus status, int stockQuantity) {
        return Product.create(
                "포켓몬 카드 박스",
                "한국어판 포켓몬 카드 박스",
                BigDecimal.valueOf(30000),
                "부스터 박스",
                "스칼렛&바이올렛",
                LocalDate.of(2026, 1, 1),
                stockQuantity,
                "https://example.com/product.jpg",
                status
        );
    }
}
