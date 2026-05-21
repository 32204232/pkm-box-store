package com.pkm.store.domain.payment.client.toss;

import com.pkm.store.domain.payment.client.PaymentApproveCommand;
import com.pkm.store.domain.payment.client.PaymentApproveResponse;
import com.pkm.store.domain.payment.client.PaymentCancelCommand;
import com.pkm.store.domain.payment.client.PaymentCancelResponse;
import com.pkm.store.domain.payment.client.PaymentClient;
import com.pkm.store.domain.payment.type.PaymentProvider;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class TossPaymentClient implements PaymentClient {

    private final RestClient restClient;
    private final String secretKey;

    public TossPaymentClient(
            RestClient.Builder restClientBuilder,
            @Value("${toss.payments.api-url}") String apiUrl,
            @Value("${toss.payments.secret-key}") String secretKey
    ) {
        this.restClient = restClientBuilder.baseUrl(apiUrl).build();
        this.secretKey = secretKey;
    }

    @Override
    public PaymentProvider getProvider() {
        return PaymentProvider.TOSS;
    }

    @Override
    public PaymentApproveResponse approve(PaymentApproveCommand command) {
        try {
            TossConfirmResponse response = restClient.post()
                    .uri("/v1/payments/confirm")
                    .header(HttpHeaders.AUTHORIZATION, authorizationHeader())
                    .body(new TossConfirmRequest(
                            command.paymentKey(),
                            command.providerOrderId(),
                            command.amount().longValueExact()
                    ))
                    .retrieve()
                    .body(TossConfirmResponse.class);

            if (response == null) {
                throw new BusinessException(ErrorCode.PAYMENT_APPROVAL_FAILED);
            }

            return new PaymentApproveResponse(
                    response.paymentKey(),
                    response.orderId(),
                    java.math.BigDecimal.valueOf(response.totalAmount()),
                    OffsetDateTime.parse(response.approvedAt()).toLocalDateTime()
            );
        } catch (RuntimeException exception) {
            if (exception instanceof BusinessException businessException) {
                throw businessException;
            }
            throw new BusinessException(ErrorCode.PAYMENT_APPROVAL_FAILED);
        }
    }

    @Override
    public PaymentCancelResponse cancel(PaymentCancelCommand command) {
        try {
            TossCancelResponse response = restClient.post()
                    .uri("/v1/payments/{paymentKey}/cancel", command.paymentKey())
                    .header(HttpHeaders.AUTHORIZATION, authorizationHeader())
                    .body(new TossCancelRequest(
                            command.cancelReason(),
                            command.cancelAmount().longValueExact()
                    ))
                    .retrieve()
                    .body(TossCancelResponse.class);

            if (response == null || response.cancels() == null || response.cancels().isEmpty()) {
                throw new BusinessException(ErrorCode.PAYMENT_CANCEL_FAILED);
            }

            TossCancel cancel = response.cancels()
                    .stream()
                    .max(Comparator.comparing(TossCancel::canceledAt))
                    .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_CANCEL_FAILED));

            return new PaymentCancelResponse(
                    response.paymentKey(),
                    BigDecimal.valueOf(cancel.cancelAmount()),
                    OffsetDateTime.parse(cancel.canceledAt()).toLocalDateTime()
            );
        } catch (RuntimeException exception) {
            if (exception instanceof BusinessException businessException) {
                throw businessException;
            }
            throw new BusinessException(ErrorCode.PAYMENT_CANCEL_FAILED);
        }
    }

    private String authorizationHeader() {
        String token = Base64.getEncoder()
                .encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
        return "Basic " + token;
    }

    private record TossConfirmRequest(
            String paymentKey,
            String orderId,
            long amount
    ) {
    }

    private record TossConfirmResponse(
            String paymentKey,
            String orderId,
            long totalAmount,
            String approvedAt
    ) {
    }

    private record TossCancelRequest(
            String cancelReason,
            long cancelAmount
    ) {
    }

    private record TossCancelResponse(
            String paymentKey,
            List<TossCancel> cancels
    ) {
    }

    private record TossCancel(
            long cancelAmount,
            String canceledAt
    ) {
    }
}
