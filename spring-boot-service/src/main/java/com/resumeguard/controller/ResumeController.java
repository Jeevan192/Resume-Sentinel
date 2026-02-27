package com.resumeguard.controller;

import com.resumeguard.model.*;
import com.resumeguard.repository.*;
import com.resumeguard.service.RuleEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Resume Controller — REST API for resume management and analysis storage.
 */
@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ResumeController {

    private final ResumeRepository resumeRepository;
    private final FraudSignalRepository signalRepository;
    private final AuditLogRepository auditLogRepository;
    private final RuleEngineService ruleEngineService;

    /**
     * Store analysis result from the Python ML service.
     */
    @PostMapping("/store")
    public ResponseEntity<Map<String, Object>> storeResult(@RequestBody Map<String, Object> analysisData) {
        log.info("Storing analysis result for: {}", analysisData.get("filename"));
        Resume resume = ruleEngineService.storeAnalysisResult(analysisData);

        // Check for fraud links
        List<Map<String, Object>> links = ruleEngineService.checkFraudLinks(resume.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("stored_id", resume.getId());
        response.put("filename", resume.getFilename());
        response.put("risk_score", resume.getRiskScore());
        response.put("fraud_links", links);
        response.put("fraud_link_count", links.size());

        return ResponseEntity.ok(response);
    }

    /**
     * Get all resumes with pagination.
     */
    @GetMapping
    public ResponseEntity<List<Resume>> getAllResumes() {
        return ResponseEntity.ok(resumeRepository.findRecentResumes());
    }

    /**
     * Get resume by ID with its signals.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getResume(@PathVariable Long id) {
        return resumeRepository.findById(id)
                .map(resume -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("resume", resume);
                    result.put("signals", signalRepository.findByResumeId(id));
                    result.put("audit_log", auditLogRepository.findByResumeIdOrderByTimestampDesc(id));
                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get high-risk resumes.
     */
    @GetMapping("/high-risk")
    public ResponseEntity<List<Resume>> getHighRisk(
            @RequestParam(defaultValue = "65.0") Double threshold) {
        return ResponseEntity.ok(resumeRepository.findHighRiskResumes(threshold));
    }

    /**
     * Get system statistics.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(ruleEngineService.getStatistics());
    }

    /**
     * Get audit log for a resume.
     */
    @GetMapping("/{id}/audit")
    public ResponseEntity<List<AuditLog>> getAuditLog(@PathVariable Long id) {
        return ResponseEntity.ok(auditLogRepository.findByResumeIdOrderByTimestampDesc(id));
    }
}
