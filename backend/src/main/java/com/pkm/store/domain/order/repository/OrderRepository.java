package com.pkm.store.domain.order.repository;

import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.order.entity.Order;
import com.pkm.store.domain.order.type.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findAllByMemberOrderByCreatedAtDesc(Member member);

    Optional<Order> findByIdAndMember(Long id, Member member);

    List<Order> findAllByStatusAndExpiresAtBefore(OrderStatus status, LocalDateTime now);

    @Query("""
            select o
            from Order o
            join fetch o.member m
            where (:status is null or o.status = :status)
              and (:memberEmail is null or lower(m.email) like lower(concat('%', :memberEmail, '%')))
              and (:startAt is null or o.createdAt >= :startAt)
              and (:endAt is null or o.createdAt < :endAt)
            order by o.createdAt desc
            """)
    List<Order> searchAdminOrders(
            @Param("status") OrderStatus status,
            @Param("memberEmail") String memberEmail,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt
    );

    long countByStatus(OrderStatus status);

    List<Order> findTop5ByOrderByCreatedAtDesc();

    @Query("""
            select count(o)
            from Order o
            where o.createdAt >= :start
              and o.createdAt < :end
            """)
    long countByCreatedAtRange(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
            select coalesce(sum(o.totalPrice), 0)
            from Order o
            where o.status = :status
              and o.createdAt >= :start
              and o.createdAt < :end
            """)
    BigDecimal sumTotalPriceByStatusAndCreatedAtRange(
            @Param("status") OrderStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
}
