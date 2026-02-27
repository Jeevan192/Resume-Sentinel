package com.resumeguard.repository;

import com.resumeguard.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByResumeIdOrderByTimestampDesc(Long resumeId);

    List<AuditLog> findByActionOrderByTimestampDesc(String action);
}
