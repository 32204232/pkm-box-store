package com.pkm.store.domain.cart.repository;

import com.pkm.store.domain.cart.entity.CartItem;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.product.entity.Product;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findAllByMemberOrderByCreatedAtDesc(Member member);

    Optional<CartItem> findByMemberAndProduct(Member member, Product product);

    Optional<CartItem> findByIdAndMember(Long id, Member member);

    void deleteAllByMember(Member member);
}
