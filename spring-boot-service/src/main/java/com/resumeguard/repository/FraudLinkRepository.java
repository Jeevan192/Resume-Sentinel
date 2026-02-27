package com.resumeguard.repository;

import com.resumeguard.model.FraudLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FraudLinkRepository extends JpaRepository<FraudLink, Long> {

    @Query("SELECT f FROM FraudLink f WHERE f.resumeId1 = :resumeId OR f.resumeId2 = :resumeId")
    List<FraudLink> findLinksForResume(Long resumeId);

    List<FraudLink> findByLinkType(String linkType);

    @Query("SELECT f FROM FraudLink f WHERE f.confidence >= :minConfidence ORDER BY f.confidence DESC")
    List<FraudLink> findHighConfidenceLinks(Double minConfidence);
}
