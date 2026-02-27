package com.resumeguard.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * FraudLink entity — represents a connection between two resumes
 * that share suspicious similarities (shared contact, JD plagiarism, etc.)
 * Used for fraud ring/graph detection.
 */
@Entity
@Table(name = "fraud_links")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FraudLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long resumeId1;

    @Column(nullable = false)
    private Long resumeId2;

    @Column(nullable = false)
    private String linkType; // SAME_EMAIL, SAME_PHONE, JD_COLLISION, HIGH_SIMILARITY

    private Double confidence; // 0.0 to 1.0

    @Column(length = 500)
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
