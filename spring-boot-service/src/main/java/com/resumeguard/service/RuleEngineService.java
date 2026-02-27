package com.resumeguard.service;

import com.resumeguard.model.*;
import com.resumeguard.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Rule Engine Service — Orchestrates fraud detection rules,
 * manages configurable thresholds, and coordinates scoring.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RuleEngineService {

    private final ResumeRepository resumeRepository;
    private final FraudSignalRepository signalRepository;
    private final AuditLogRepository auditLogRepository;

    /**
     * Store a resume analysis result from the Python service.
     */
    @Transactional
    public Resume storeAnalysisResult(Map<String, Object> analysisData) {
        Resume resume = Resume.builder()
                .filename((String) analysisData.getOrDefault("filename", "unknown"))
                .candidateName((String) analysisData.getOrDefault("name", "Unknown"))
                .email(getFirstEmail(analysisData))
                .phone(getFirstPhone(analysisData))
                .riskScore(toDouble(analysisData.get("risk_score")))
                .riskLevel((String) analysisData.getOrDefault("risk_level", "UNKNOWN"))
                .activeSignals(toInt(analysisData.get("active_signals")))
                .explanation((String) analysisData.getOrDefault("llm_explanation", ""))
                .alertTriggered((Boolean) analysisData.getOrDefault("alert", false))
                .analyzedAt(LocalDateTime.now())
                .build();

        resume = resumeRepository.save(resume);
        log.info("Stored resume analysis: id={}, file={}, score={}", 
                resume.getId(), resume.getFilename(), resume.getRiskScore());

        // Store individual signals
        storeSignals(resume.getId(), analysisData);

        // Create audit entry
        createAuditLog(resume.getId(), "ANALYZE", 
                String.format("Resume analyzed: score=%.1f, level=%s", 
                        resume.getRiskScore(), resume.getRiskLevel()));

        if (Boolean.TRUE.equals(resume.getAlertTriggered())) {
            createAuditLog(resume.getId(), "ALERT_TRIGGERED",
                    "High-risk alert triggered for recruiter review");
        }

        return resume;
    }

    /**
     * Check for fraud links between the new resume and existing ones.
     */
    @Transactional
    public List<Map<String, Object>> checkFraudLinks(Long resumeId) {
        Resume resume = resumeRepository.findById(resumeId).orElse(null);
        if (resume == null) return Collections.emptyList();

        List<Map<String, Object>> links = new ArrayList<>();

        // Check email duplicates
        if (resume.getEmail() != null && !resume.getEmail().isEmpty()) {
            List<Resume> sameEmail = resumeRepository.findByEmail(resume.getEmail());
            for (Resume other : sameEmail) {
                if (!other.getId().equals(resumeId)) {
                    links.add(Map.of(
                            "type", "SAME_EMAIL",
                            "other_id", other.getId(),
                            "other_name", other.getCandidateName(),
                            "confidence", 0.95,
                            "detail", "Shared email: " + resume.getEmail()
                    ));
                }
            }
        }

        // Check phone duplicates
        if (resume.getPhone() != null && !resume.getPhone().isEmpty()) {
            List<Resume> samePhone = resumeRepository.findByPhone(resume.getPhone());
            for (Resume other : samePhone) {
                if (!other.getId().equals(resumeId)) {
                    links.add(Map.of(
                            "type", "SAME_PHONE",
                            "other_id", other.getId(),
                            "other_name", other.getCandidateName(),
                            "confidence", 0.90,
                            "detail", "Shared phone: " + resume.getPhone()
                    ));
                }
            }
        }

        // Check text hash duplicates (exact same resume)
        if (resume.getTextHash() != null) {
            List<Resume> sameHash = resumeRepository.findByTextHash(resume.getTextHash());
            for (Resume other : sameHash) {
                if (!other.getId().equals(resumeId)) {
                    links.add(Map.of(
                            "type", "EXACT_DUPLICATE",
                            "other_id", other.getId(),
                            "other_name", other.getCandidateName(),
                            "confidence", 1.0,
                            "detail", "Identical resume content"
                    ));
                }
            }
        }

        return links;
    }

    /**
     * Get system-wide statistics.
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total_resumes", resumeRepository.count());
        stats.put("total_alerts", resumeRepository.countAlerts());
        stats.put("avg_risk_score", resumeRepository.averageRiskScore());
        stats.put("high_risk_resumes", resumeRepository.findHighRiskResumes(65.0).size());
        stats.put("critical_risk_resumes", resumeRepository.findHighRiskResumes(85.0).size());
        return stats;
    }

    // ─── Private Helpers ─────────────────────────

    private void storeSignals(Long resumeId, Map<String, Object> data) {
        @SuppressWarnings("unchecked")
        Map<String, Object> signals = (Map<String, Object>) data.getOrDefault("signals", Collections.emptyMap());

        String[] signalTypes = {"timeline_score", "email_score", "phone_score",
                "plagiarism_score", "similarity_score", "mismatch_score"};
        String[] signalNames = {"timeline_overlap", "email_validation", "phone_validation",
                "jd_plagiarism", "semantic_similarity", "skills_mismatch"};
        int[] maxScores = {40, 20, 15, 30, 35, 20};

        for (int i = 0; i < signalTypes.length; i++) {
            int score = toInt(signals.get(signalTypes[i]));
            String severity = score >= maxScores[i] * 0.75 ? "HIGH" :
                    score >= maxScores[i] * 0.4 ? "MEDIUM" :
                            score > 0 ? "LOW" : "NONE";

            FraudSignal signal = FraudSignal.builder()
                    .resumeId(resumeId)
                    .signalType(signalNames[i])
                    .score(score)
                    .maxScore(maxScores[i])
                    .severity(severity)
                    .detectedAt(LocalDateTime.now())
                    .build();
            signalRepository.save(signal);
        }
    }

    private void createAuditLog(Long resumeId, String action, String details) {
        AuditLog log = AuditLog.builder()
                .resumeId(resumeId)
                .action(action)
                .details(details)
                .performedBy("system")
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }

    @SuppressWarnings("unchecked")
    private String getFirstEmail(Map<String, Object> data) {
        List<String> emails = (List<String>) data.getOrDefault("emails", Collections.emptyList());
        return emails.isEmpty() ? null : emails.get(0);
    }

    @SuppressWarnings("unchecked")
    private String getFirstPhone(Map<String, Object> data) {
        List<String> phones = (List<String>) data.getOrDefault("phones", Collections.emptyList());
        return phones.isEmpty() ? null : phones.get(0);
    }

    private Double toDouble(Object val) {
        if (val == null) return 0.0;
        if (val instanceof Number) return ((Number) val).doubleValue();
        try { return Double.parseDouble(val.toString()); } catch (Exception e) { return 0.0; }
    }

    private int toInt(Object val) {
        if (val == null) return 0;
        if (val instanceof Number) return ((Number) val).intValue();
        try { return Integer.parseInt(val.toString()); } catch (Exception e) { return 0; }
    }
}
