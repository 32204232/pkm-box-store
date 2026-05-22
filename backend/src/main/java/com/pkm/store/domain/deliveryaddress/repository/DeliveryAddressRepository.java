package com.pkm.store.domain.deliveryaddress.repository;

import com.pkm.store.domain.deliveryaddress.entity.DeliveryAddress;
import com.pkm.store.domain.member.entity.Member;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DeliveryAddressRepository extends JpaRepository<DeliveryAddress, Long> {

    @Query("""
            select address
            from DeliveryAddress address
            where address.member = :member
            order by address.isDefault desc, address.createdAt desc
            """)
    List<DeliveryAddress> findAllByMemberOrderByIsDefaultDescCreatedAtDesc(Member member);

    long countByMember(Member member);

    Optional<DeliveryAddress> findByIdAndMember(Long id, Member member);

    @Query("""
            select address
            from DeliveryAddress address
            where address.member = :member and address.isDefault = true
            """)
    Optional<DeliveryAddress> findByMemberAndIsDefaultTrue(Member member);
}
