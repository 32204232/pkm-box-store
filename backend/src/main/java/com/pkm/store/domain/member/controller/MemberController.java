package com.pkm.store.domain.member.controller;

import com.pkm.store.domain.member.dto.EmailVerificationSendRequest;
import com.pkm.store.domain.member.dto.EmailVerificationSendResponse;
import com.pkm.store.domain.member.dto.EmailVerificationVerifyRequest;
import com.pkm.store.domain.member.dto.EmailVerificationVerifyResponse;
import com.pkm.store.domain.member.dto.MemberLoginRequest;
import com.pkm.store.domain.member.dto.MemberLoginResponse;
import com.pkm.store.domain.member.dto.MemberResponse;
import com.pkm.store.domain.member.dto.MemberSignupRequest;
import com.pkm.store.domain.member.dto.PasswordResetRequest;
import com.pkm.store.domain.member.service.EmailVerificationService;
import com.pkm.store.domain.member.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService memberService;
    private final EmailVerificationService emailVerificationService;

    @PostMapping("/email-verifications/send")
    public ResponseEntity<EmailVerificationSendResponse> sendEmailVerification(
            @Valid @RequestBody EmailVerificationSendRequest request
    ) {
        return ResponseEntity.ok(emailVerificationService.send(request));
    }

    @PostMapping("/email-verifications/verify")
    public ResponseEntity<EmailVerificationVerifyResponse> verifyEmailVerification(
            @Valid @RequestBody EmailVerificationVerifyRequest request
    ) {
        return ResponseEntity.ok(emailVerificationService.verify(request));
    }

    @PostMapping("/signup")
    public ResponseEntity<MemberResponse> signup(@Valid @RequestBody MemberSignupRequest request) {
        return ResponseEntity.ok(memberService.signup(request));
    }

    @PostMapping("/login")
    public ResponseEntity<MemberLoginResponse> login(@Valid @RequestBody MemberLoginRequest request) {
        return ResponseEntity.ok(memberService.login(request));
    }

    @PostMapping("/password-reset")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        memberService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }
}
