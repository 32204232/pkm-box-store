package com.pkm.store.global.mail;

import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.util.Properties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "mail", name = "mode", havingValue = "SMTP")
public class SmtpCustomerEmailSender implements CustomerEmailSender {

    private final MailProperties mailProperties;
    private final JavaMailSenderImpl mailSender;

    public SmtpCustomerEmailSender(MailProperties mailProperties) {
        this.mailProperties = mailProperties;
        this.mailSender = createMailSender(mailProperties);
    }

    @Override
    public void send(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailProperties.getFrom());
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
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
}
