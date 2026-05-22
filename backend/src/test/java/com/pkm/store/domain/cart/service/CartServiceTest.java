package com.pkm.store.domain.cart.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.pkm.store.domain.cart.dto.CartItemAddRequest;
import com.pkm.store.domain.cart.dto.CartItemResponse;
import com.pkm.store.domain.cart.dto.CartItemUpdateRequest;
import com.pkm.store.domain.cart.entity.CartItem;
import com.pkm.store.domain.cart.repository.CartItemRepository;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.member.repository.MemberRepository;
import com.pkm.store.domain.product.entity.Product;
import com.pkm.store.domain.product.repository.ProductRepository;
import com.pkm.store.domain.product.type.ProductStatus;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    private static final String MEMBER_EMAIL = "member@example.com";

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private CartService cartService;

    private Member member;

    @BeforeEach
    void setUp() {
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
    void addItemSucceeds() {
        Product product = createProduct(ProductStatus.ON_SALE);
        given(memberRepository.findByEmail(MEMBER_EMAIL)).willReturn(Optional.of(member));
        given(productRepository.findById(1L)).willReturn(Optional.of(product));
        given(cartItemRepository.findByMemberAndProduct(member, product)).willReturn(Optional.empty());
        given(cartItemRepository.save(any(CartItem.class))).willAnswer(invocation -> invocation.getArgument(0));

        CartItemResponse response = cartService.addItem(new CartItemAddRequest(1L, 2));

        assertThat(response.quantity()).isEqualTo(2);
        assertThat(response.productName()).isEqualTo("포켓몬 카드 박스");
        verify(cartItemRepository).save(any(CartItem.class));
    }

    @Test
    void addItemIncreasesQuantityWhenSameProductAlreadyExists() {
        Product product = createProduct(ProductStatus.ON_SALE);
        CartItem cartItem = CartItem.create(member, product, 2);
        given(memberRepository.findByEmail(MEMBER_EMAIL)).willReturn(Optional.of(member));
        given(productRepository.findById(1L)).willReturn(Optional.of(product));
        given(cartItemRepository.findByMemberAndProduct(member, product)).willReturn(Optional.of(cartItem));

        CartItemResponse response = cartService.addItem(new CartItemAddRequest(1L, 3));

        assertThat(response.quantity()).isEqualTo(5);
    }

    @Test
    void addItemThrowsBusinessExceptionWhenProductIsHidden() {
        Product product = createProduct(ProductStatus.HIDDEN);
        given(memberRepository.findByEmail(MEMBER_EMAIL)).willReturn(Optional.of(member));
        given(productRepository.findById(1L)).willReturn(Optional.of(product));

        assertThatThrownBy(() -> cartService.addItem(new CartItemAddRequest(1L, 1)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PRODUCT_NOT_PURCHASABLE);
        verify(cartItemRepository, never()).save(any(CartItem.class));
    }

    @Test
    void addItemThrowsBusinessExceptionWhenProductIsSoldOut() {
        Product product = createProduct(ProductStatus.SOLD_OUT);
        given(memberRepository.findByEmail(MEMBER_EMAIL)).willReturn(Optional.of(member));
        given(productRepository.findById(1L)).willReturn(Optional.of(product));

        assertThatThrownBy(() -> cartService.addItem(new CartItemAddRequest(1L, 1)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PRODUCT_NOT_PURCHASABLE);
        verify(cartItemRepository, never()).save(any(CartItem.class));
    }

    @Test
    void addItemThrowsBusinessExceptionWhenProductIsComingSoon() {
        Product product = createProduct(ProductStatus.COMING_SOON);
        given(memberRepository.findByEmail(MEMBER_EMAIL)).willReturn(Optional.of(member));
        given(productRepository.findById(1L)).willReturn(Optional.of(product));

        assertThatThrownBy(() -> cartService.addItem(new CartItemAddRequest(1L, 1)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PRODUCT_NOT_PURCHASABLE);
        verify(cartItemRepository, never()).save(any(CartItem.class));
    }

    @Test
    void addItemThrowsBusinessExceptionWhenStockIsNotEnough() {
        Product product = createProduct(ProductStatus.ON_SALE, 1);
        given(memberRepository.findByEmail(MEMBER_EMAIL)).willReturn(Optional.of(member));
        given(productRepository.findById(1L)).willReturn(Optional.of(product));

        assertThatThrownBy(() -> cartService.addItem(new CartItemAddRequest(1L, 2)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.OUT_OF_STOCK);
        verify(cartItemRepository, never()).save(any(CartItem.class));
    }

    @Test
    void addItemThrowsBusinessExceptionWhenExistingCartQuantityWouldExceedStock() {
        Product product = createProduct(ProductStatus.ON_SALE, 4);
        CartItem cartItem = CartItem.create(member, product, 2);
        given(memberRepository.findByEmail(MEMBER_EMAIL)).willReturn(Optional.of(member));
        given(productRepository.findById(1L)).willReturn(Optional.of(product));
        given(cartItemRepository.findByMemberAndProduct(member, product)).willReturn(Optional.of(cartItem));

        assertThatThrownBy(() -> cartService.addItem(new CartItemAddRequest(1L, 3)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.OUT_OF_STOCK);
        assertThat(cartItem.getQuantity()).isEqualTo(2);
    }

    @Test
    void updateItemThrowsBusinessExceptionWhenQuantityIsZeroOrLess() {
        assertThatThrownBy(() -> cartService.updateItem(1L, new CartItemUpdateRequest(0)))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void updateItemThrowsBusinessExceptionWhenProductIsNotPurchasable() {
        Product product = createProduct(ProductStatus.SOLD_OUT, 20);
        CartItem cartItem = CartItem.create(member, product, 2);
        given(memberRepository.findByEmail(MEMBER_EMAIL)).willReturn(Optional.of(member));
        given(cartItemRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(cartItem));

        assertThatThrownBy(() -> cartService.updateItem(1L, new CartItemUpdateRequest(3)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PRODUCT_NOT_PURCHASABLE);
        assertThat(cartItem.getQuantity()).isEqualTo(2);
    }

    @Test
    void updateItemThrowsBusinessExceptionWhenStockIsNotEnough() {
        Product product = createProduct(ProductStatus.ON_SALE, 2);
        CartItem cartItem = CartItem.create(member, product, 1);
        given(memberRepository.findByEmail(MEMBER_EMAIL)).willReturn(Optional.of(member));
        given(cartItemRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(cartItem));

        assertThatThrownBy(() -> cartService.updateItem(1L, new CartItemUpdateRequest(3)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.OUT_OF_STOCK);
        assertThat(cartItem.getQuantity()).isEqualTo(1);
    }

    @Test
    void deleteItemSucceeds() {
        Product product = createProduct(ProductStatus.ON_SALE);
        CartItem cartItem = CartItem.create(member, product, 2);
        given(memberRepository.findByEmail(MEMBER_EMAIL)).willReturn(Optional.of(member));
        given(cartItemRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(cartItem));

        cartService.deleteItem(1L);

        verify(cartItemRepository).delete(cartItem);
    }

    private Product createProduct(ProductStatus status) {
        return createProduct(status, 20);
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
