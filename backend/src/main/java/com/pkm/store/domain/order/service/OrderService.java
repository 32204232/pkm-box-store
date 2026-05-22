package com.pkm.store.domain.order.service;

import com.pkm.store.domain.adminlog.service.AdminAuditLogService;
import com.pkm.store.domain.adminlog.type.AdminAuditActionType;
import com.pkm.store.domain.adminlog.type.AdminAuditTargetType;
import com.pkm.store.domain.cart.entity.CartItem;
import com.pkm.store.domain.cart.repository.CartItemRepository;
import com.pkm.store.domain.deliveryaddress.entity.DeliveryAddress;
import com.pkm.store.domain.deliveryaddress.repository.DeliveryAddressRepository;
import com.pkm.store.domain.inventory.service.InventoryService;
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
import java.time.LocalDateTime;
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
    private final DeliveryAddressRepository deliveryAddressRepository;
    private final ProductRepository productRepository;
    private final AdminAuditLogService adminAuditLogService;

    @Transactional
    public OrderResponse createOrderFromCart(OrderCreateRequest request) {
        Member member = getCurrentMember();
        List<CartItem> cartItems = cartItemRepository.findAllByMemberOrderByCreatedAtDesc(member);
        if (cartItems.isEmpty()) {
            throw new BusinessException(ErrorCode.EMPTY_CART);
        }

        Order order = createOrder(member, request);
        for (CartItem cartItem : cartItems) {
            Product product = productRepository.findByIdWithPessimisticWriteLock(cartItem.getProduct().getId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
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

    public List<AdminOrderResponse> getAdminOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(AdminOrderResponse::from)
                .toList();
    }

    public AdminOrderResponse getAdminOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        return AdminOrderResponse.from(order);
    }

    @Transactional
    public AdminOrderResponse updateAdminOrderStatus(Long orderId, AdminOrderStatusUpdateRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        order.changeDeliveryStatus(request.status(), request.courierCompany(), request.trackingNumber());
        recordDeliveryStatusChange(order, request);
        return AdminOrderResponse.from(order);
    }

    @Transactional
    public void expireOrder(Long orderId) {
        Member member = getCurrentMember();
        Order order = orderRepository.findByIdAndMember(orderId, member)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        expireSingleOrder(order);
    }

    @Transactional
    public void expireExpiredPendingOrders() {
        List<Order> orders = orderRepository.findAllByStatusAndExpiresAtBefore(
                OrderStatus.PAYMENT_PENDING,
                LocalDateTime.now()
        );

        for (Order order : orders) {
            try {
                expireSingleOrder(order);
            } catch (RuntimeException ignored) {
                // Continue processing other expired orders.
            }
        }
    }

    private void expireSingleOrder(Order order) {
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

    private Order createOrder(Member member, OrderCreateRequest request) {
        if (request.deliveryAddressId() != null) {
            DeliveryAddress address = deliveryAddressRepository.findByIdAndMember(request.deliveryAddressId(), member)
                    .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND));
            return Order.create(
                    member,
                    address.getReceiverName(),
                    address.getReceiverPhone(),
                    formatAddress(address.getZipCode(), address.getAddress1(), address.getAddress2()),
                    address.getZipCode(),
                    address.getAddress1(),
                    address.getAddress2()
            );
        }

        validateManualAddress(request);
        return Order.create(member, request.receiverName(), request.receiverPhone(), request.address());
    }

    private void validateManualAddress(OrderCreateRequest request) {
        if (isBlank(request.receiverName()) || isBlank(request.receiverPhone()) || isBlank(request.address())) {
            throw new BusinessException(ErrorCode.INVALID_ADDRESS_REQUEST);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private void recordDeliveryStatusChange(Order order, AdminOrderStatusUpdateRequest request) {
        if (request.status() == OrderStatus.PREPARING) {
            adminAuditLogService.record(
                    AdminAuditActionType.ORDER_PREPARED,
                    AdminAuditTargetType.ORDER,
                    order.getId(),
                    "주문 배송 준비 처리: " + order.getOrderUid()
            );
            return;
        }
        if (request.status() == OrderStatus.SHIPPED) {
            adminAuditLogService.record(
                    AdminAuditActionType.ORDER_SHIPPED,
                    AdminAuditTargetType.ORDER,
                    order.getId(),
                    "주문 발송 처리: " + order.getOrderUid()
                            + ", " + request.courierCompany()
                            + ", " + request.trackingNumber()
            );
            return;
        }
        if (request.status() == OrderStatus.DELIVERED) {
            adminAuditLogService.record(
                    AdminAuditActionType.ORDER_DELIVERED,
                    AdminAuditTargetType.ORDER,
                    order.getId(),
                    "주문 배송 완료 처리: " + order.getOrderUid()
            );
        }
    }

    private String formatAddress(String zipCode, String address1, String address2) {
        if (address2 == null || address2.isBlank()) {
            return zipCode + " " + address1;
        }
        return zipCode + " " + address1 + " " + address2;
    }
}
