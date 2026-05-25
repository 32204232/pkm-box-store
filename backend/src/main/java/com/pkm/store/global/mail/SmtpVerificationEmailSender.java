package com.pkm.store.global.mail;

import com.pkm.store.domain.member.type.EmailVerificationPurpose;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.util.Properties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "mail", name = "mode", havingValue = "SMTP")
public class SmtpVerificationEmailSender implements VerificationEmailSender {

    private final MailProperties mailProperties;
    private final JavaMailSenderImpl mailSender;

    public SmtpVerificationEmailSender(MailProperties mailProperties) {
        this.mailProperties = mailProperties;
        this.mailSender = createMailSender(mailProperties);
    }

    @Override
    public void sendVerificationCode(String email, EmailVerificationPurpose purpose, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailProperties.getFrom());
            message.setTo(email);
            message.setSubject(subjectOf(purpose));
            message.setText("""
                    PKM Box Store 인증번호입니다.

                    인증번호: %s

                    요청하지 않은 인증번호라면 이 메일을 무시해 주세요.
                    """.formatted(code));

            mailSender.send(message);
        } catch (RuntimeException exception) {
            throw new BusinessException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }

    private JavaMailSenderImpl createMailSender(MailProperties properties) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(properties.getHost());
        sender.setPort(properties.getPort());
        sender.setUsername(properties.getUsername());
        sender.setPassword(properties.getPassword());

        Properties javaMailProperties = sender.getJavaMailProperties();
        javaMailProperties.put("mail.smtp.auth", String.valueOf(properties.isSmtpAuth()));
        javaMailProperties.put("mail.smtp.starttls.enable", String.valueOf(properties.isSmtpStarttlsEnable()));
        return sender;
    }

    private String subjectOf(EmailVerificationPurpose purpose) {
        if (purpose == EmailVerificationPurpose.PASSWORD_RESET) {
            return "[PKM Box Store] 비밀번호 재설정 인증번호";
        }
        return "[PKM Box Store] 회원가입 인증번호";
    }
}
