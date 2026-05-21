package com.pkm.store.domain.payment.controller;

import com.pkm.store.domain.payment.dto.PaymentCancelRequest;
import com.pkm.store.domain.payment.dto.PaymentResponse;
import com.pkm.store.domain.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/payments")
public class AdminPaymentController {

    private final PaymentService paymentService;

    @PostMapping("/cancel")
    public ResponseEntity<PaymentResponse> cancelPayment(@Valid @RequestBody PaymentCancelRequest request) {
        return ResponseEntity.ok(paymentService.cancelPaymentByAdmin(request.orderId(), request.cancelReason()));
    }
}
