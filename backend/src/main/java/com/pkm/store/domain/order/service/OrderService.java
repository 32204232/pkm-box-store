package com.pkm.store.domain.order.service;

import com.pkm.store.domain.cart.entity.CartItem;
import com.pkm.store.domain.cart.repository.CartItemRepository;
import com.pkm.store.domain.inventory.service.InventoryService;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.member.repository.MemberRepository;
import com.pkm.store.domain.order.dto.OrderCreateRequest;
import com.pkm.store.domain.order.dto.OrderResponse;
import com.pkm.store.domain.order.entity.Order;
import com.pkm.store.domain.order.entity.OrderItem;
import com.pkm.store.domain.order.repository.OrderRepository;
import com.pkm.store.domain.product.entity.Product;
import com.pkm.store.domain.product.type.ProductStatus;
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
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final MemberRepository memberRepository;
    private final InventoryService inventoryService;

    @Transactional
    public OrderResponse createOrderFromCart(OrderCreateRequest request) {
        Member member = getCurrentMember();
        List<CartItem> cartItems = cartItemRepository.findAllByMemberOrderByCreatedAtDesc(member);
        if (cartItems.isEmpty()) {
            throw new BusinessException(ErrorCode.EMPTY_CART);
        }

        Order order = Order.create(member, request.receiverName(), request.receiverPhone(), request.address());
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            validateOrderable(product);
            inventoryService.reserve(product, cartItem.getQuantity(), "ORDER_RESERVED");
            order.addOrderItem(OrderItem.create(product, cartItem.getQuantity()));
        }

        Order savedOrder = orderRepository.save(order);
        cartItemRepository.deleteAllByMember(member);
        return OrderResponse.from(savedOrder);
    }

    public List<OrderResponse> getMyOrders() {
        Member member = getCurrentMember();
        return orderRepository.findAllByMemberOrderByCreatedAtDesc(member)
                .stream()
                .map(OrderResponse::from)
                .toList();
    }

    public OrderResponse getMyOrder(Long orderId) {
        Member member = getCurrentMember();
        Order order = orderRepository.findByIdAndMember(orderId, member)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        return OrderResponse.from(order);
    }

    @Transactional
    public void expireOrder(Long orderId) {
        Member member = getCurrentMember();
        Order order = orderRepository.findByIdAndMember(orderId, member)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        order.expire();
        order.getOrderItems().forEach(orderItem -> inventoryService.release(
                orderItem.getProduct(),
                orderItem.getQuantity(),
                "ORDER_EXPIRED"
        ));
    }

    private Member getCurrentMember() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        return memberRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
    }

    private void validateOrderable(Product product) {
        if (product.getStatus() == ProductStatus.HIDDEN) {
            throw new BusinessException(ErrorCode.ORDER_NOT_ALLOWED);
        }
    }
}
