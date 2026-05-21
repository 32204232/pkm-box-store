package com.pkm.store.domain.inventory.repository;

import com.pkm.store.domain.inventory.entity.InventoryHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryHistoryRepository extends JpaRepository<InventoryHistory, Long> {
}
