package com.pkm.store.domain.payment.client;

import com.pkm.store.domain.payment.type.PaymentProvider;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class PaymentClientResolver {

    private final Map<PaymentProvider, PaymentClient> clients = new EnumMap<>(PaymentProvider.class);

    public PaymentClientResolver(List<PaymentClient> paymentClients) {
        paymentClients.forEach(client -> clients.put(client.getProvider(), client));
    }

    public PaymentClient resolve(PaymentProvider provider) {
        PaymentClient client = clients.get(provider);
        if (client == null) {
            throw new BusinessException(ErrorCode.PAYMENT_PROVIDER_NOT_SUPPORTED);
        }
        return client;
    }
}
