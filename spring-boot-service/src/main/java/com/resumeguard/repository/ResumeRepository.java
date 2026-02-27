package com.resumeguard.repository;

import com.resumeguard.model.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {

    List<Resume> findByEmail(String email);

    List<Resume> findByPhone(String phone);

    List<Resume> findByTextHash(String textHash);

    List<Resume> findByRiskLevel(String riskLevel);

    @Query("SELECT r FROM Resume r WHERE r.riskScore >= :threshold ORDER BY r.riskScore DESC")
    List<Resume> findHighRiskResumes(Double threshold);

    @Query("SELECT r FROM Resume r ORDER BY r.analyzedAt DESC")
    List<Resume> findRecentResumes();

    @Query("SELECT COUNT(r) FROM Resume r WHERE r.alertTriggered = true")
    Long countAlerts();

    @Query("SELECT AVG(r.riskScore) FROM Resume r")
    Double averageRiskScore();
}
