package com.mykpokpo.Backend.token;

import com.mykpokpo.Backend.user.User;
import com.mykpokpo.Backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
public class Token extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Code OTP 6 chiffres — ex: "847291" (mobile)
    @Column(unique = true)
    private String token;

    // UUID pour le lien cliquable — ex: "a3f2c1d4-..." (desktop)
    @Column(unique = true)
    private String linkToken;

    @Enumerated(EnumType.STRING)
    private TokenType tokenType;

    private LocalDateTime expiresAt;
    private LocalDateTime validatedAt;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
