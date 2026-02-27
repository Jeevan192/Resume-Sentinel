package com.resumeguard.service;

import com.resumeguard.model.FraudLink;
import com.resumeguard.model.Resume;
import com.resumeguard.repository.FraudLinkRepository;
import com.resumeguard.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Fraud Ring Service — Builds and queries the fraud network graph.
 * Uses Union-Find to detect connected fraud clusters.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FraudRingService {

    private final FraudLinkRepository fraudLinkRepository;
    private final ResumeRepository resumeRepository;

    /**
     * Get the complete fraud network graph as nodes and edges.
     */
    public Map<String, Object> getFraudGraph() {
        List<FraudLink> links = fraudLinkRepository.findAll();
        List<Resume> resumes = resumeRepository.findAll();

        // Build node set (only resumes involved in links)
        Set<Long> linkedIds = new HashSet<>();
        for (FraudLink link : links) {
            linkedIds.add(link.getResumeId1());
            linkedIds.add(link.getResumeId2());
        }

        // Build nodes
        List<Map<String, Object>> nodes = resumes.stream()
                .filter(r -> linkedIds.contains(r.getId()))
                .map(r -> {
                    Map<String, Object> node = new HashMap<>();
                    node.put("id", r.getId());
                    node.put("name", r.getCandidateName());
                    node.put("filename", r.getFilename());
                    node.put("risk_score", r.getRiskScore());
                    node.put("risk_level", r.getRiskLevel());
                    return node;
                })
                .collect(Collectors.toList());

        // Build edges
        List<Map<String, Object>> edges = links.stream()
                .map(l -> {
                    Map<String, Object> edge = new HashMap<>();
                    edge.put("source", l.getResumeId1());
                    edge.put("target", l.getResumeId2());
                    edge.put("type", l.getLinkType());
                    edge.put("confidence", l.getConfidence());
                    edge.put("details", l.getDetails());
                    return edge;
                })
                .collect(Collectors.toList());

        // Detect clusters using Union-Find
        List<Set<Long>> clusters = detectClusters(links, linkedIds);

        Map<String, Object> graph = new HashMap<>();
        graph.put("nodes", nodes);
        graph.put("edges", edges);
        graph.put("clusters", clusters.size());
        graph.put("largest_cluster", clusters.stream()
                .mapToInt(Set::size).max().orElse(0));

        return graph;
    }

    /**
     * Detect connected components (fraud rings) using Union-Find.
     */
    private List<Set<Long>> detectClusters(List<FraudLink> links, Set<Long> allIds) {
        Map<Long, Long> parent = new HashMap<>();
        for (Long id : allIds) {
            parent.put(id, id);
        }

        for (FraudLink link : links) {
            union(parent, link.getResumeId1(), link.getResumeId2());
        }

        // Group by root
        Map<Long, Set<Long>> clusters = new HashMap<>();
        for (Long id : allIds) {
            Long root = find(parent, id);
            clusters.computeIfAbsent(root, k -> new HashSet<>()).add(id);
        }

        return clusters.values().stream()
                .filter(c -> c.size() > 1)
                .collect(Collectors.toList());
    }

    private Long find(Map<Long, Long> parent, Long x) {
        if (!parent.get(x).equals(x)) {
            parent.put(x, find(parent, parent.get(x)));
        }
        return parent.get(x);
    }

    private void union(Map<Long, Long> parent, Long a, Long b) {
        Long rootA = find(parent, a);
        Long rootB = find(parent, b);
        if (!rootA.equals(rootB)) {
            parent.put(rootA, rootB);
        }
    }
}
