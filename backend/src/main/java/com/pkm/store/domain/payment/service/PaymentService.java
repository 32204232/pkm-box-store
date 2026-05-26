package com.pkm.store.domain.payment.service;

import com.pkm.store.domain.adminlog.service.AdminAuditLogService;
import com.pkm.store.domain.adminlog.type.AdminAuditActionType;
import com.pkm.store.domain.adminlog.type.AdminAuditTargetType;
import com.pkm.store.domain.inventory.service.InventoryService;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.member.repository.MemberRepository;
import com.pkm.store.domain.notification.service.OrderNotificationService;
import com.pkm.store.domain.order.entity.Order;
import com.pkm.store.domain.order.repository.OrderRepository;
import com.pkm.store.domain.order.type.OrderStatus;
import com.pkm.store.domain.payment.client.PaymentApproveCommand;
import com.pkm.store.domain.payment.client.PaymentApproveResponse;
import com.pkm.store.domain.payment.client.PaymentCancelCommand;
import com.pkm.store.domain.payment.client.PaymentCancelResponse;
import com.pkm.store.domain.payment.client.PaymentClient;
import com.pkm.store.domain.payment.client.PaymentClientResolver;
import com.pkm.store.domain.payment.dto.PaymentConfirmRequest;
import com.pkm.store.domain.payment.dto.PaymentFailRequest;
import com.pkm.store.domain.payment.dto.PaymentResponse;
import com.pkm.store.domain.payment.entity.Payment;
import com.pkm.store.domain.payment.repository.PaymentRepository;
import com.pkm.store.domain.payment.type.PaymentStatus;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final MemberRepository memberRepository;
    private final PaymentClientResolver paymentClientResolver;
    private final InventoryService inventoryService;
    private final AdminAuditLogService adminAuditLogService;
    private final OrderNotificationService orderNotificationService;

    @Transactional
    public PaymentResponse confirmPayment(PaymentConfirmRequest request) {
        Member member = getCurrentMember();
        Order order = orderRepository.findByIdAndMember(request.orderId(), member)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        validateRequestAmount(order, request);
        validateProviderOrderId(order, request);
        if (order.getStatus() == OrderStatus.PAID) {
            return PaymentResponse.from(findIdempotentApprovedPayment(order, request));
        }
        validateOrderCanBePaid(order);
        validateNotAlreadyPaid(order, request.paymentKey(), request.providerOrderId());

        PaymentClient paymentClient = paymentClientResolver.resolve(request.provider());
        PaymentApproveResponse approveResponse = paymentClient.approve(new PaymentApproveCommand(
                request.paymentKey(),
                request.providerOrderId(),
                request.amount()
        ));
        validateApproveResponseAmount(order, approveResponse);

        Payment payment = Payment.approved(
                order,
                request.provider(),
                approveResponse.paymentKey(),
                approveResponse.providerOrderId(),
                approveResponse.amount(),
                approveResponse.approvedAt()
        );

        order.markPaid();
        order.getOrderItems().forEach(orderItem -> inventoryService.confirm(
                orderItem.getProduct(),
                orderItem.getQuantity(),
                "PAYMENT_APPROVED"
        ));

        Payment savedPayment = paymentRepository.save(payment);
        orderNotificationService.sendPaymentCompleted(order);
        return PaymentResponse.from(savedPayment);
    }

    @Transactional
    public void failPayment(PaymentFailRequest request) {
        Member member = getCurrentMember();
        Order order = orderRepository.findByIdAndMember(request.orderId(), member)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        order.failPayment();
        order.getOrderItems().forEach(orderItem -> inventoryService.release(
                orderItem.getProduct(),
                orderItem.getQuantity(),
                "PAYMENT_FAILED"
        ));
    }

    @Transactional
    public PaymentResponse cancelPayment(Long orderId, String cancelReason) {
        Member member = getCurrentMember();
        Order order = orderRepository.findByIdAndMember(orderId, member)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        return cancelPaidOrder(order, cancelReason);
    }

    @Transactional
    public PaymentResponse cancelPaymentByAdmin(Long orderId, String cancelReason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        boolean alreadyCanceled = order.getStatus() == OrderStatus.CANCELED;
        PaymentResponse response = cancelPaidOrder(order, cancelReason);
        if (!alreadyCanceled) {
            adminAuditLogService.record(
                    AdminAuditActionType.PAYMENT_CANCELED,
                    AdminAuditTargetType.PAYMENT,
                    response.paymentId(),
                    "관리자 결제 취소/환불: " + order.getOrderUid() + ", 사유: " + normalizeCancelReason(cancelReason)
            );
        }
        return response;
    }

    private PaymentResponse cancelPaidOrder(Order order, String cancelReason) {
        if (order.getStatus() == OrderStatus.CANCELED) {
            return PaymentResponse.from(paymentRepository.findByOrderAndStatus(order, PaymentStatus.CANCELED)
                    .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND)));
        }
        validateOrderCanBeCanceled(order);
        Payment payment = paymentRepository.findByOrderAndStatus(order, PaymentStatus.APPROVED)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        PaymentClient paymentClient = paymentClientResolver.resolve(payment.getProvider());
        PaymentCancelResponse cancelResponse = paymentClient.cancel(new PaymentCancelCommand(
                payment.getPaymentKey(),
                cancelReason,
                payment.getAmount()
        ));
        validateCancelResponseAmount(payment, cancelResponse);

        payment.cancel();
        order.cancelAfterPayment();
        order.getOrderItems().forEach(orderItem -> inventoryService.release(
                orderItem.getProduct(),
                orderItem.getQuantity(),
                cancelReason(cancelReason)
        ));

        return PaymentResponse.from(payment);
    }

    private void validateOrderCanBePaid(Order order) {
        if (order.getStatus() != OrderStatus.PAYMENT_PENDING) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }
    }

    private void validateOrderCanBeCanceled(Order order) {
        if (order.getStatus() != OrderStatus.PAID) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }
    }

    private void validateRequestAmount(Order order, PaymentConfirmRequest request) {
        if (order.getTotalPrice().compareTo(request.amount()) != 0) {
            throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }
    }

    private void validateApproveResponseAmount(Order order, PaymentApproveResponse approveResponse) {
        if (order.getTotalPrice().compareTo(approveResponse.amount()) != 0) {
            throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }
    }

    private void validateCancelResponseAmount(Payment payment, PaymentCancelResponse cancelResponse) {
        if (cancelResponse == null || payment.getAmount().compareTo(cancelResponse.canceledAmount()) != 0) {
            throw new BusinessException(ErrorCode.PAYMENT_CANCEL_FAILED);
        }
    }

    private void validateProviderOrderId(Order order, PaymentConfirmRequest request) {
        if (!order.getOrderUid().equals(request.providerOrderId())) {
            throw new BusinessException(ErrorCode.PAYMENT_ORDER_MISMATCH);
        }
    }

    private void validateNotAlreadyPaid(Order order, String paymentKey, String providerOrderId) {
        if (paymentRepository.existsByOrder(order)
                || paymentRepository.existsByPaymentKey(paymentKey)
                || paymentRepository.findByProviderOrderId(providerOrderId).isPresent()) {
            throw new BusinessException(ErrorCode.PAYMENT_ALREADY_APPROVED);
        }
    }

    private Payment findIdempotentApprovedPayment(Order order, PaymentConfirmRequest request) {
        Payment payment = paymentRepository.findByOrderAndStatus(order, PaymentStatus.APPROVED)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        if (!payment.getPaymentKey().equals(request.paymentKey())
                || !payment.getProviderOrderId().equals(request.providerOrderId())) {
            throw new BusinessException(ErrorCode.PAYMENT_ALREADY_APPROVED);
        }
        if (payment.getAmount().compareTo(request.amount()) != 0) {
            throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }

        return payment;
    }

    private String cancelReason(String cancelReason) {
        if (cancelReason == null || cancelReason.isBlank()) {
            return "PAYMENT_CANCELED";
        }
        return "PAYMENT_CANCELED: " + cancelReason;
    }

    private String normalizeCancelReason(String cancelReason) {
        if (cancelReason == null || cancelReason.isBlank()) {
            return "미입력";
        }
        return cancelReason;
    }

    private Member getCurrentMember() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        return memberRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
    }
}
