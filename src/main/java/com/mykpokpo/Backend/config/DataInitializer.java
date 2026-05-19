package com.mykpokpo.Backend.config;

import com.mykpokpo.Backend.role.Role;
import com.mykpokpo.Backend.role.RoleRepository;
import com.mykpokpo.Backend.user.User;
import com.mykpokpo.Backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository  roleRepository;
    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL    = "admin@mykpokpo.com";
    private static final String ADMIN_PASSWORD = "root";

    @Override
    public void run(String... args) {
        insertRoleIfAbsent("ADMIN");
        insertRoleIfAbsent("GARAGISTE");
        insertRoleIfAbsent("CLIENT");
        insertAdminIfAbsent();
    }

    private void insertRoleIfAbsent(String roleName) {
        if (roleRepository.findByRoleName(roleName).isEmpty()) {
            roleRepository.save(new Role(null, roleName, null));
            log.info("Rôle '{}' créé automatiquement.", roleName);
        }
    }

    private void insertAdminIfAbsent() {
        if (userRepository.findByEmail(ADMIN_EMAIL).isPresent()) return;

        Role adminRole = roleRepository.findByRoleName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("Rôle ADMIN introuvable"));

        User admin = User.builder()
                .firstName("Admin")
                .lastName("MyKpokpo")
                .email(ADMIN_EMAIL)
                .password(passwordEncoder.encode(ADMIN_PASSWORD))
                .enabled(true)
                .accountLocked(false)
                .roles(List.of(adminRole))
                .build();

        userRepository.save(admin);
        log.info("Utilisateur admin '{}' créé automatiquement.", ADMIN_EMAIL);
    }
}
