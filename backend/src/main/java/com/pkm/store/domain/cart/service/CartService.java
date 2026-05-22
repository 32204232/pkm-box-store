package com.pkm.store.domain.cart.service;

import com.pkm.store.domain.cart.dto.CartItemAddRequest;
import com.pkm.store.domain.cart.dto.CartItemResponse;
import com.pkm.store.domain.cart.dto.CartItemUpdateRequest;
import com.pkm.store.domain.cart.dto.CartResponse;
import com.pkm.store.domain.cart.entity.CartItem;
import com.pkm.store.domain.cart.repository.CartItemRepository;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.member.repository.MemberRepository;
import com.pkm.store.domain.product.entity.Product;
import com.pkm.store.domain.product.repository.ProductRepository;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final MemberRepository memberRepository;
    private final ProductRepository productRepository;

    public CartResponse getMyCart() {
        Member member = getCurrentMember();
        List<CartItemResponse> items = cartItemRepository.findAllByMemberOrderByCreatedAtDesc(member)
                .stream()
                .map(CartItemResponse::from)
                .toList();

        return CartResponse.from(items);
    }

    @Transactional
    public CartItemResponse addItem(CartItemAddRequest request) {
        validateQuantity(request.quantity());
        Member member = getCurrentMember();
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        CartItem cartItem = cartItemRepository.findByMemberAndProduct(member, product)
                .map(existingItem -> {
                    product.validatePurchasable(existingItem.getQuantity() + request.quantity());
                    existingItem.addQuantity(request.quantity());
                    return existingItem;
                })
                .orElseGet(() -> {
                    product.validatePurchasable(request.quantity());
                    return cartItemRepository.save(CartItem.create(member, product, request.quantity()));
                });

        return CartItemResponse.from(cartItem);
    }

    @Transactional
    public CartItemResponse updateItem(Long cartItemId, CartItemUpdateRequest request) {
        validateQuantity(request.quantity());
        Member member = getCurrentMember();
        CartItem cartItem = cartItemRepository.findByIdAndMember(cartItemId, member)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));

        cartItem.getProduct().validatePurchasable(request.quantity());
        cartItem.changeQuantity(request.quantity());
        return CartItemResponse.from(cartItem);
    }

    @Transactional
    public void deleteItem(Long cartItemId) {
        Member member = getCurrentMember();
        CartItem cartItem = cartItemRepository.findByIdAndMember(cartItemId, member)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));

        cartItemRepository.delete(cartItem);
    }

    @Transactional
    public void clearCart() {
        cartItemRepository.deleteAllByMember(getCurrentMember());
    }

    private Member getCurrentMember() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        return memberRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
    }

    private void validateQuantity(int quantity) {
        if (quantity < 1) {
            throw new BusinessException(ErrorCode.INVALID_CART_QUANTITY);
        }
    }
}
