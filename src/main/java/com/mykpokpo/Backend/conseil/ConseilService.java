package com.mykpokpo.Backend.conseil;

import com.mykpokpo.Backend.user.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ConseilService {

    private final ConseilRepository conseilRepository;

    @Transactional(readOnly = true)
    public List<ConseilResponse> findAll() {
        return conseilRepository.findAllByPublishedTrueOrderByCreatedAtDesc()
                .stream().map(ConseilResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ConseilResponse> findMine(User author) {
        return conseilRepository.findAllByAuthorOrderByCreatedAtDesc(author)
                .stream().map(ConseilResponse::from).toList();
    }

    @Transactional
    public ConseilResponse create(ConseilRequest request, User author) {
        Conseil conseil = Conseil.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .author(author)
                .build();
        return ConseilResponse.from(conseilRepository.save(conseil));
    }

    @Transactional
    public void delete(Long id, User user) {
        Conseil conseil = conseilRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Conseil introuvable (id=" + id + ")"));

        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ADMIN"));
        boolean isAuthor = conseil.getAuthor().getId().equals(user.getId());

        if (!isAdmin && !isAuthor) {
            throw new AccessDeniedException("Vous ne pouvez pas supprimer ce conseil");
        }
        conseilRepository.delete(conseil);
    }
}
