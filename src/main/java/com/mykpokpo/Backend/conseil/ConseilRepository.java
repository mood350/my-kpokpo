package com.mykpokpo.Backend.conseil;

import com.mykpokpo.Backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConseilRepository extends JpaRepository<Conseil, Long> {

    List<Conseil> findAllByPublishedTrueOrderByCreatedAtDesc();

    List<Conseil> findAllByAuthorOrderByCreatedAtDesc(User author);
}
