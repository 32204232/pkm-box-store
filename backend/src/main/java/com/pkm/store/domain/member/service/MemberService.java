package com.pkm.store.domain.member.service;

import com.pkm.store.domain.member.dto.MemberLoginRequest;
import com.pkm.store.domain.member.dto.MemberLoginResponse;
import com.pkm.store.domain.member.dto.MemberProfileUpdateRequest;
import com.pkm.store.domain.member.dto.MemberResponse;
import com.pkm.store.domain.member.dto.MemberSignupRequest;
import com.pkm.store.domain.member.dto.PasswordChangeRequest;
import com.pkm.store.domain.member.dto.PasswordResetRequest;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.member.repository.MemberRepository;
import com.pkm.store.domain.member.type.EmailVerificationPurpose;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import com.pkm.store.global.jwt.JwtTokenProvider;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailVerificationService emailVerificationService;

    @Transactional
    public MemberResponse signup(MemberSignupRequest request) {
        String email = normalizeEmail(request.email());
        if (memberRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        emailVerificationService.consumeVerificationToken(
                email,
                EmailVerificationPurpose.SIGNUP,
                request.emailVerificationToken()
        );

        Member member = Member.create(
                email,
                passwordEncoder.encode(request.password()),
                request.name()
        );

        return MemberResponse.from(memberRepository.save(member));
    }

    public MemberLoginResponse login(MemberLoginRequest request) {
        Member member = memberRepository.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        if (!passwordEncoder.matches(request.password(), member.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD);
        }

        return new MemberLoginResponse(jwtTokenProvider.createAccessToken(member.getEmail(), member.getRole()));
    }

    public MemberResponse getMe() {
        return MemberResponse.from(getCurrentMember());
    }

    @Transactional
    public MemberResponse updateMyProfile(MemberProfileUpdateRequest request) {
        Member member = getCurrentMember();
        member.updateProfile(
                request.name().trim(),
                normalizeNullableText(request.profileImageUrl()),
                normalizeNullableText(request.bio())
        );
        return MemberResponse.from(member);
    }

    @Transactional
    public void changeMyPassword(PasswordChangeRequest request) {
        Member member = getCurrentMember();
        if (!passwordEncoder.matches(request.currentPassword(), member.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD);
        }
        member.changePassword(passwordEncoder.encode(request.newPassword()));
    }

    @Transactional
    public void resetPassword(PasswordResetRequest request) {
        String email = normalizeEmail(request.email());
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        emailVerificationService.consumeVerificationToken(
                email,
                EmailVerificationPurpose.PASSWORD_RESET,
                request.verificationToken()
        );
        member.changePassword(passwordEncoder.encode(request.newPassword()));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeNullableText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
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
