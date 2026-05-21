package com.pkm.store.domain.order.controller;

import com.pkm.store.domain.order.dto.AdminOrderResponse;
import com.pkm.store.domain.order.dto.AdminOrderStatusUpdateRequest;
import com.pkm.store.domain.order.service.OrderService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<AdminOrderResponse>> getOrders() {
        return ResponseEntity.ok(orderService.getAdminOrders());
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<AdminOrderResponse> getOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getAdminOrder(orderId));
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<AdminOrderResponse> updateStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody AdminOrderStatusUpdateRequest request
    ) {
        return ResponseEntity.ok(orderService.updateAdminOrderStatus(orderId, request));
    }
}
