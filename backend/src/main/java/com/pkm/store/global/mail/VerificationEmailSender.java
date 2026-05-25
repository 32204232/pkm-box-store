package com.pkm.store.global.mail;

import com.pkm.store.domain.member.type.EmailVerificationPurpose;

public interface VerificationEmailSender {

    void sendVerificationCode(String email, EmailVerificationPurpose purpose, String code);
}
