package com.pkm.store.domain.deliveryaddress.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.pkm.store.domain.deliveryaddress.dto.DeliveryAddressCreateRequest;
import com.pkm.store.domain.deliveryaddress.dto.DeliveryAddressResponse;
import com.pkm.store.domain.deliveryaddress.dto.DeliveryAddressUpdateRequest;
import com.pkm.store.domain.deliveryaddress.entity.DeliveryAddress;
import com.pkm.store.domain.deliveryaddress.repository.DeliveryAddressRepository;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.member.repository.MemberRepository;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class DeliveryAddressServiceTest {

    private static final String MEMBER_EMAIL = "member@example.com";

    @Mock
    private DeliveryAddressRepository deliveryAddressRepository;

    @Mock
    private MemberRepository memberRepository;

    @InjectMocks
    private DeliveryAddressService deliveryAddressService;

    private Member member;

    @BeforeEach
    void setUp() {
        member = Member.create(MEMBER_EMAIL, "encoded-password", "Test Member");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(MEMBER_EMAIL, null)
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createAddressSucceeds() {
        givenCurrentMember();
        given(deliveryAddressRepository.countByMember(member)).willReturn(1L);
        given(deliveryAddressRepository.save(any(DeliveryAddress.class)))
                .willAnswer(invocation -> invocation.getArgument(0));

        DeliveryAddressResponse response = deliveryAddressService.createAddress(createRequest(false));

        assertThat(response.receiverName()).isEqualTo("Test Member");
        assertThat(response.receiverPhone()).isEqualTo("010-1234-5678");
        assertThat(response.zipCode()).isEqualTo("06236");
        assertThat(response.address1()).isEqualTo("Seoul Gangnam");
        assertThat(response.isDefault()).isFalse();
        verify(deliveryAddressRepository).save(any(DeliveryAddress.class));
    }

    @Test
    void firstAddressIsDefault() {
        givenCurrentMember();
        given(deliveryAddressRepository.countByMember(member)).willReturn(0L);
        given(deliveryAddressRepository.findByMemberAndIsDefaultTrue(member)).willReturn(Optional.empty());
        given(deliveryAddressRepository.save(any(DeliveryAddress.class)))
                .willAnswer(invocation -> invocation.getArgument(0));

        DeliveryAddressResponse response = deliveryAddressService.createAddress(createRequest(false));

        assertThat(response.isDefault()).isTrue();
    }

    @Test
    void secondAddressIsNotDefaultWhenDefaultIsNotRequested() {
        givenCurrentMember();
        given(deliveryAddressRepository.countByMember(member)).willReturn(1L);
        given(deliveryAddressRepository.save(any(DeliveryAddress.class)))
                .willAnswer(invocation -> invocation.getArgument(0));

        DeliveryAddressResponse response = deliveryAddressService.createAddress(createRequest(null));

        assertThat(response.isDefault()).isFalse();
    }

    @Test
    void setDefaultAddressUnmarksCurrentDefault() {
        DeliveryAddress currentDefault = createAddress(true);
        DeliveryAddress target = createAddress(false);
        givenCurrentMember();
        given(deliveryAddressRepository.findByIdAndMember(2L, member)).willReturn(Optional.of(target));
        given(deliveryAddressRepository.findByMemberAndIsDefaultTrue(member)).willReturn(Optional.of(currentDefault));

        DeliveryAddressResponse response = deliveryAddressService.setDefaultAddress(2L);

        assertThat(response.isDefault()).isTrue();
        assertThat(target.isDefault()).isTrue();
        assertThat(currentDefault.isDefault()).isFalse();
    }

    @Test
    void accessingOtherMembersAddressThrowsAddressNotFound() {
        givenCurrentMember();
        given(deliveryAddressRepository.findByIdAndMember(1L, member)).willReturn(Optional.empty());

        assertThatThrownBy(() -> deliveryAddressService.setDefaultAddress(1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ADDRESS_NOT_FOUND);
    }

    @Test
    void updateAddressSucceeds() {
        DeliveryAddress address = createAddress(false);
        givenCurrentMember();
        given(deliveryAddressRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(address));

        DeliveryAddressResponse response = deliveryAddressService.updateAddress(
                1L,
                new DeliveryAddressUpdateRequest(
                        "Office",
                        "Updated Receiver",
                        "010-9999-9999",
                        "12345",
                        "Busan",
                        "101",
                        null
                )
        );

        assertThat(response.label()).isEqualTo("Office");
        assertThat(response.receiverName()).isEqualTo("Updated Receiver");
        assertThat(response.receiverPhone()).isEqualTo("010-9999-9999");
        assertThat(response.zipCode()).isEqualTo("12345");
        assertThat(response.address1()).isEqualTo("Busan");
        assertThat(response.address2()).isEqualTo("101");
    }

    @Test
    void deleteAddressSucceeds() {
        DeliveryAddress address = createAddress(false);
        givenCurrentMember();
        given(deliveryAddressRepository.findByIdAndMember(1L, member)).willReturn(Optional.of(address));

        deliveryAddressService.deleteAddress(1L);

        verify(deliveryAddressRepository).delete(address);
    }

    private void givenCurrentMember() {
        given(memberRepository.findByEmail(MEMBER_EMAIL)).willReturn(Optional.of(member));
    }

    private DeliveryAddressCreateRequest createRequest(Boolean isDefault) {
        return new DeliveryAddressCreateRequest(
                "Home",
                "Test Member",
                "010-1234-5678",
                "06236",
                "Seoul Gangnam",
                "Apt 101",
                isDefault
        );
    }

    private DeliveryAddress createAddress(boolean isDefault) {
        DeliveryAddress address = DeliveryAddress.create(
                member,
                "Home",
                "Test Member",
                "010-1234-5678",
                "06236",
                "Seoul Gangnam",
                "Apt 101",
                isDefault
        );
        ReflectionTestUtils.setField(address, "id", isDefault ? 1L : 2L);
        return address;
    }
}
