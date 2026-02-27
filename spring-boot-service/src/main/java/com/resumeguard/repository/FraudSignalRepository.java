package com.resumeguard.repository;

import com.resumeguard.model.FraudSignal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FraudSignalRepository extends JpaRepository<FraudSignal, Long> {

    List<FraudSignal> findByResumeId(Long resumeId);

    List<FraudSignal> findBySignalType(String signalType);

    List<FraudSignal> findBySeverity(String severity);
}
