package com.resumeguard.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Resume entity — stores metadata and analysis results.
 */
@Entity
@Table(name = "resumes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename;

    private String candidateName;

    private String email;

    @Convert(converter = com.resumeguard.util.AesEncryptor.class)
    private String phone;

    @Column(length = 5000)
    @Convert(converter = com.resumeguard.util.AesEncryptor.class)
    private String rawText;

    private Double riskScore;

    private String riskLevel; // CLEAN, LOW, MEDIUM, HIGH, CRITICAL

    private Integer activeSignals;

    private String textHash; // SHA-256 of raw text

    @Column(length = 3000)
    private String explanation;

    private Boolean alertTriggered;

    @Column(nullable = false)
    private LocalDateTime analyzedAt;

    @PrePersist
    protected void onCreate() {
        if (analyzedAt == null) {
            analyzedAt = LocalDateTime.now();
        }
    }
}
