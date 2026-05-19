package com.mykpokpo.Backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    // ── Admin stats ───────────────────────────────────────────────────────────

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.roleName = :role")
    long countByRole(@Param("role") String role);

    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r " +
           "WHERE r.roleName = :role AND u.createdAt BETWEEN :start AND :end")
    long countByRoleAndCreatedAtBetween(
            @Param("role")  String        role,
            @Param("start") LocalDateTime start,
            @Param("end")   LocalDateTime end);
}
