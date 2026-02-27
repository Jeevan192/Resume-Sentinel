package com.resumeguard.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * FraudSignal entity — stores individual signal results per resume.
 */
@Entity
@Table(name = "fraud_signals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FraudSignal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long resumeId;

    @Column(nullable = false)
    private String signalType; // timeline_overlap, email_validation, etc.

    private Integer score;

    private Integer maxScore;

    private String severity; // NONE, LOW, MEDIUM, HIGH, CRITICAL

    @Column(length = 2000)
    private String details;

    @Column(nullable = false)
    private LocalDateTime detectedAt;

    @PrePersist
    protected void onCreate() {
        if (detectedAt == null) {
            detectedAt = LocalDateTime.now();
        }
    }
}
