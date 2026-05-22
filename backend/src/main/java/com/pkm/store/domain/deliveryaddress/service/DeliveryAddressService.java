package com.pkm.store.domain.deliveryaddress.service;

import com.pkm.store.domain.deliveryaddress.dto.DeliveryAddressCreateRequest;
import com.pkm.store.domain.deliveryaddress.dto.DeliveryAddressResponse;
import com.pkm.store.domain.deliveryaddress.dto.DeliveryAddressUpdateRequest;
import com.pkm.store.domain.deliveryaddress.entity.DeliveryAddress;
import com.pkm.store.domain.deliveryaddress.repository.DeliveryAddressRepository;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.member.repository.MemberRepository;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeliveryAddressService {

    private final DeliveryAddressRepository deliveryAddressRepository;
    private final MemberRepository memberRepository;

    public List<DeliveryAddressResponse> getMyAddresses() {
        Member member = getCurrentMember();
        return deliveryAddressRepository.findAllByMemberOrderByIsDefaultDescCreatedAtDesc(member)
                .stream()
                .map(DeliveryAddressResponse::from)
                .toList();
    }

    @Transactional
    public DeliveryAddressResponse createAddress(DeliveryAddressCreateRequest request) {
        Member member = getCurrentMember();
        boolean firstAddress = deliveryAddressRepository.countByMember(member) == 0;
        boolean markAsDefault = firstAddress || Boolean.TRUE.equals(request.isDefault());

        if (markAsDefault) {
            unmarkCurrentDefault(member);
        }

        DeliveryAddress address = DeliveryAddress.create(
                member,
                request.label(),
                request.receiverName(),
                request.receiverPhone(),
                request.zipCode(),
                request.address1(),
                request.address2(),
                markAsDefault
        );

        return DeliveryAddressResponse.from(deliveryAddressRepository.save(address));
    }

    @Transactional
    public DeliveryAddressResponse updateAddress(Long addressId, DeliveryAddressUpdateRequest request) {
        validateUpdateRequest(request);
        Member member = getCurrentMember();
        DeliveryAddress address = getAddress(addressId, member);

        address.update(
                request.label(),
                request.receiverName(),
                request.receiverPhone(),
                request.zipCode(),
                request.address1(),
                request.address2()
        );

        if (Boolean.TRUE.equals(request.isDefault())) {
            setDefaultAddress(member, address);
        } else if (Boolean.FALSE.equals(request.isDefault())) {
            address.unmarkDefault();
        }

        return DeliveryAddressResponse.from(address);
    }

    @Transactional
    public void deleteAddress(Long addressId) {
        Member member = getCurrentMember();
        DeliveryAddress address = getAddress(addressId, member);
        deliveryAddressRepository.delete(address);
    }

    @Transactional
    public DeliveryAddressResponse setDefaultAddress(Long addressId) {
        Member member = getCurrentMember();
        DeliveryAddress address = getAddress(addressId, member);
        setDefaultAddress(member, address);
        return DeliveryAddressResponse.from(address);
    }

    private void setDefaultAddress(Member member, DeliveryAddress address) {
        deliveryAddressRepository.findByMemberAndIsDefaultTrue(member)
                .filter(currentDefault -> currentDefault != address)
                .ifPresent(DeliveryAddress::unmarkDefault);
        address.markDefault();
    }

    private void unmarkCurrentDefault(Member member) {
        deliveryAddressRepository.findByMemberAndIsDefaultTrue(member)
                .ifPresent(DeliveryAddress::unmarkDefault);
    }

    private DeliveryAddress getAddress(Long addressId, Member member) {
        return deliveryAddressRepository.findByIdAndMember(addressId, member)
                .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND));
    }

    private void validateUpdateRequest(DeliveryAddressUpdateRequest request) {
        if (isBlank(request.receiverName())
                || isBlank(request.receiverPhone())
                || isBlank(request.zipCode())
                || isBlank(request.address1())) {
            throw new BusinessException(ErrorCode.INVALID_ADDRESS_REQUEST);
        }
    }

    private boolean isBlank(String value) {
        return value != null && value.isBlank();
    }

    private Member getCurrentMember() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        return memberRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
    }
}
