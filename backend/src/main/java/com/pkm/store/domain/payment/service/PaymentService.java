package com.pkm.store.domain.payment.service;

import com.pkm.store.domain.inventory.service.InventoryService;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.member.repository.MemberRepository;
import com.pkm.store.domain.order.entity.Order;
import com.pkm.store.domain.order.repository.OrderRepository;
import com.pkm.store.domain.order.type.OrderStatus;
import com.pkm.store.domain.payment.client.PaymentApproveCommand;
import com.pkm.store.domain.payment.client.PaymentApproveResponse;
import com.pkm.store.domain.payment.client.PaymentClient;
import com.pkm.store.domain.payment.client.PaymentClientResolver;
import com.pkm.store.domain.payment.dto.PaymentConfirmRequest;
import com.pkm.store.domain.payment.dto.PaymentResponse;
import com.pkm.store.domain.payment.entity.Payment;
import com.pkm.store.domain.payment.repository.PaymentRepository;
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

    @Transactional
    public PaymentResponse confirmPayment(PaymentConfirmRequest request) {
        Member member = getCurrentMember();
        Order order = orderRepository.findByIdAndMember(request.orderId(), member)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        validateOrderCanBePaid(order);
        validateAmount(order, request);

        PaymentClient paymentClient = paymentClientResolver.resolve(request.provider());
        PaymentApproveResponse approveResponse = paymentClient.approve(new PaymentApproveCommand(
                request.paymentKey(),
                request.providerOrderId(),
                request.amount()
        ));

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

        return PaymentResponse.from(paymentRepository.save(payment));
    }

    private void validateOrderCanBePaid(Order order) {
        if (order.getStatus() != OrderStatus.PAYMENT_PENDING) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }
    }

    private void validateAmount(Order order, PaymentConfirmRequest request) {
        if (order.getTotalPrice().compareTo(request.amount()) != 0) {
            throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }
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
