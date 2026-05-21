package com.pkm.store.domain.payment.client;

import com.pkm.store.domain.payment.type.PaymentProvider;

public interface PaymentClient {

    PaymentProvider getProvider();

    PaymentApproveResponse approve(PaymentApproveCommand command);

    PaymentCancelResponse cancel(PaymentCancelCommand command);
}
