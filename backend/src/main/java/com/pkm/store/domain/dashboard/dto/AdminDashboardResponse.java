package com.pkm.store.domain.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardResponse(
        long todayOrderCount,
        BigDecimal todaySalesAmount,
        long paymentPendingOrderCount,
        long paidOrderCount,
        long preparingOrderCount,
        long shippedOrderCount,
        long lowStockProductCount,
        List<AdminDashboardOrderResponse> recentOrders,
        List<AdminDashboardProductResponse> lowStockProducts
) {
}
