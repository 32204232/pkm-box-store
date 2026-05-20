package com.pkm.store.domain.member.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.pkm.store.domain.member.dto.MemberLoginRequest;
import com.pkm.store.domain.member.dto.MemberLoginResponse;
import com.pkm.store.domain.member.dto.MemberResponse;
import com.pkm.store.domain.member.dto.MemberSignupRequest;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.member.repository.MemberRepository;
import com.pkm.store.domain.member.type.MemberRole;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.jwt.JwtTokenProvider;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private MemberService memberService;

    @Test
    void signupSucceeds() {
        MemberSignupRequest request = new MemberSignupRequest("member@example.com", "password123", "홍길동");
        given(memberRepository.existsByEmail(request.email())).willReturn(false);
        given(passwordEncoder.encode(request.password())).willReturn("encoded-password");
        given(memberRepository.save(any(Member.class))).willAnswer(invocation -> invocation.getArgument(0));

        MemberResponse response = memberService.signup(request);

        assertThat(response.email()).isEqualTo("member@example.com");
        assertThat(response.name()).isEqualTo("홍길동");
        assertThat(response.role()).isEqualTo(MemberRole.ROLE_MEMBER);
        verify(passwordEncoder).encode("password123");
        verify(memberRepository).save(any(Member.class));
    }

    @Test
    void signupThrowsBusinessExceptionWhenEmailAlreadyExists() {
        MemberSignupRequest request = new MemberSignupRequest("member@example.com", "password123", "홍길동");
        given(memberRepository.existsByEmail(request.email())).willReturn(true);

        assertThatThrownBy(() -> memberService.signup(request))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void loginSucceeds() {
        MemberLoginRequest request = new MemberLoginRequest("member@example.com", "password123");
        Member member = Member.create("member@example.com", "encoded-password", "홍길동");
        given(memberRepository.findByEmail(request.email())).willReturn(Optional.of(member));
        given(passwordEncoder.matches(request.password(), member.getPassword())).willReturn(true);
        given(jwtTokenProvider.createAccessToken(member.getEmail(), member.getRole())).willReturn("access-token");

        MemberLoginResponse response = memberService.login(request);

        assertThat(response.accessToken()).isEqualTo("access-token");
    }

    @Test
    void loginThrowsBusinessExceptionWhenPasswordDoesNotMatch() {
        MemberLoginRequest request = new MemberLoginRequest("member@example.com", "wrong-password");
        Member member = Member.create("member@example.com", "encoded-password", "홍길동");
        given(memberRepository.findByEmail(request.email())).willReturn(Optional.of(member));
        given(passwordEncoder.matches(request.password(), member.getPassword())).willReturn(false);

        assertThatThrownBy(() -> memberService.login(request))
                .isInstanceOf(BusinessException.class);
    }
}
