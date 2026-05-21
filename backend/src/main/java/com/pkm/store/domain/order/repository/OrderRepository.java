package com.pkm.store.domain.order.repository;

import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.order.entity.Order;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findAllByMemberOrderByCreatedAtDesc(Member member);

    Optional<Order> findByIdAndMember(Long id, Member member);
}
