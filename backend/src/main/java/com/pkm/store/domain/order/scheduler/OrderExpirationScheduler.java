package com.pkm.store.domain.order.scheduler;

import com.pkm.store.domain.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OrderExpirationScheduler {

    private final OrderService orderService;

    @Scheduled(fixedDelay = 60_000)
    public void expireExpiredPendingOrders() {
        orderService.expireExpiredPendingOrders();
    }
}
