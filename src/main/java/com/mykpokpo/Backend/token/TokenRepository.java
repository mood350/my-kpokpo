package com.mykpokpo.Backend.token;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TokenRepository extends JpaRepository<Token, Long> {
    Optional<Token> findByToken(String token);
    Optional<Token> findByLinkToken(String linkToken);
    void deleteAllByUserAndTokenType(com.mykpokpo.Backend.user.User user, TokenType tokenType);
}
