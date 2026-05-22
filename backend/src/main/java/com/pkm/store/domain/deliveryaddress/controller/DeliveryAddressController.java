package com.pkm.store.domain.deliveryaddress.controller;

import com.pkm.store.domain.deliveryaddress.dto.DeliveryAddressCreateRequest;
import com.pkm.store.domain.deliveryaddress.dto.DeliveryAddressResponse;
import com.pkm.store.domain.deliveryaddress.dto.DeliveryAddressUpdateRequest;
import com.pkm.store.domain.deliveryaddress.service.DeliveryAddressService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/me/addresses")
public class DeliveryAddressController {

    private final DeliveryAddressService deliveryAddressService;

    @GetMapping
    public ResponseEntity<List<DeliveryAddressResponse>> getMyAddresses() {
        return ResponseEntity.ok(deliveryAddressService.getMyAddresses());
    }

    @PostMapping
    public ResponseEntity<DeliveryAddressResponse> createAddress(
            @Valid @RequestBody DeliveryAddressCreateRequest request
    ) {
        return ResponseEntity.ok(deliveryAddressService.createAddress(request));
    }

    @PatchMapping("/{addressId}")
    public ResponseEntity<DeliveryAddressResponse> updateAddress(
            @PathVariable Long addressId,
            @RequestBody DeliveryAddressUpdateRequest request
    ) {
        return ResponseEntity.ok(deliveryAddressService.updateAddress(addressId, request));
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long addressId) {
        deliveryAddressService.deleteAddress(addressId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{addressId}/default")
    public ResponseEntity<DeliveryAddressResponse> setDefaultAddress(@PathVariable Long addressId) {
        return ResponseEntity.ok(deliveryAddressService.setDefaultAddress(addressId));
    }
}
