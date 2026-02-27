package com.resumeguard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 🛡️ ResumeGuard — Spring Boot Core Service
 * 
 * Handles: Rule orchestration, fraud ring detection,
 * audit logging, and H2 database persistence.
 */
@SpringBootApplication
public class ResumeGuardApplication {

    public static void main(String[] args) {
        SpringApplication.run(ResumeGuardApplication.class, args);
    }
}
