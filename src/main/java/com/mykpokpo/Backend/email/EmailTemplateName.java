package com.mykpokpo.Backend.email;

import lombok.Getter;

@Getter
public enum EmailTemplateName {

    ACTIVATE_ACCOUNT("activate_account"),
    WELCOME("welcome"),
    RESET_PASSWORD("reset_password"),
    NEW_DEVICE_LOGIN("new_device_login");

    private final String name;

    EmailTemplateName(String name) {
        this.name = name;
    }
}
