package com.resumeguard.controller;

import com.resumeguard.service.FraudRingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Fraud Graph Controller — Returns fraud network graph data
 * for visualization on the Streamlit dashboard.
 */
@RestController
@RequestMapping("/api/fraud-graph")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class FraudGraphController {

    private final FraudRingService fraudRingService;

    /**
     * Get the complete fraud network graph (nodes + edges + clusters).
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getFraudGraph() {
        log.info("Fetching fraud network graph");
        return ResponseEntity.ok(fraudRingService.getFraudGraph());
    }
}
