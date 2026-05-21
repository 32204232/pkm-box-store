package com.pkm.store.domain.cart.controller;

import com.pkm.store.domain.cart.dto.CartItemAddRequest;
import com.pkm.store.domain.cart.dto.CartItemResponse;
import com.pkm.store.domain.cart.dto.CartItemUpdateRequest;
import com.pkm.store.domain.cart.dto.CartResponse;
import com.pkm.store.domain.cart.service.CartService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartResponse> getMyCart() {
        return ResponseEntity.ok(cartService.getMyCart());
    }

    @PostMapping("/items")
    public ResponseEntity<CartItemResponse> addItem(@Valid @RequestBody CartItemAddRequest request) {
        return ResponseEntity.ok(cartService.addItem(request));
    }

    @PatchMapping("/items/{cartItemId}")
    public ResponseEntity<CartItemResponse> updateItem(
            @PathVariable Long cartItemId,
            @Valid @RequestBody CartItemUpdateRequest request
    ) {
        return ResponseEntity.ok(cartService.updateItem(cartItemId, request));
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long cartItemId) {
        cartService.deleteItem(cartItemId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/items")
    public ResponseEntity<Void> clearCart() {
        cartService.clearCart();
        return ResponseEntity.noContent().build();
    }
}
