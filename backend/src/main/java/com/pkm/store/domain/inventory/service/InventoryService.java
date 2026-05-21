package com.pkm.store.domain.inventory.service;

import com.pkm.store.domain.inventory.entity.InventoryHistory;
import com.pkm.store.domain.inventory.repository.InventoryHistoryRepository;
import com.pkm.store.domain.inventory.type.InventoryHistoryType;
import com.pkm.store.domain.product.entity.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryHistoryRepository inventoryHistoryRepository;

    public void reserve(Product product, int quantity, String reason) {
        product.decreaseStock(quantity);
        inventoryHistoryRepository.save(InventoryHistory.create(
                product,
                InventoryHistoryType.RESERVED,
                quantity,
                reason
        ));
    }
}
