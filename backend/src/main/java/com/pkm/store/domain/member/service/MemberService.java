package com.pkm.store.domain.member.service;

import com.pkm.store.domain.member.dto.MemberLoginRequest;
import com.pkm.store.domain.member.dto.MemberLoginResponse;
import com.pkm.store.domain.member.dto.MemberResponse;
import com.pkm.store.domain.member.dto.MemberSignupRequest;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.member.repository.MemberRepository;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import com.pkm.store.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
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

    @Transactional
    public MemberResponse signup(MemberSignupRequest request) {
        if (memberRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        Member member = Member.create(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.name()
        );

        return MemberResponse.from(memberRepository.save(member));
    }

    public MemberLoginResponse login(MemberLoginRequest request) {
        Member member = memberRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        if (!passwordEncoder.matches(request.password(), member.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD);
        }

        return new MemberLoginResponse(jwtTokenProvider.createAccessToken(member.getEmail(), member.getRole()));
    }
}
