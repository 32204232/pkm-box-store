package com.pkm.store.global.mail;

public interface CustomerEmailSender {

    void send(String to, String subject, String text);
}
