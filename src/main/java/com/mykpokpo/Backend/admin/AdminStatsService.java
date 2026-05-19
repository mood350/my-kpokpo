package com.mykpokpo.Backend.admin;

import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.garage.GarageRepository;
import com.mykpokpo.Backend.intervention.InterventionRepository;
import com.mykpokpo.Backend.invoice.InvoiceRepository;
import com.mykpokpo.Backend.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminStatsService {

    private final GarageRepository       garageRepository;
    private final UserRepository         userRepository;
    private final InvoiceRepository      invoiceRepository;
    private final InterventionRepository interventionRepository;

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        YearMonth     month    = YearMonth.now();
        LocalDate     mStart   = month.atDay(1);
        LocalDate     mEnd     = month.atEndOfMonth();
        LocalDateTime mStartDT = mStart.atStartOfDay();
        LocalDateTime mEndDT   = mEnd.atTime(23, 59, 59);

        BigDecimal mrr   = invoiceRepository.sumPlatformRevenueTTCByPeriod(mStart, mEnd);
        BigDecimal total = invoiceRepository.sumTotalPlatformRevenueTTC();

        var recentGarages = garageRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(g -> new AdminStatsResponse.RecentGarageInfo(
                        g.getId(),
                        g.getName(),
                        g.getCity(),
                        g.getOwner().fullName(),
                        g.isVerified(),
                        g.getCreatedAt().toLocalDate().toString()
                ))
                .toList();

        return new AdminStatsResponse(
                garageRepository.count(),
                garageRepository.countByVerifiedTrue(),
                garageRepository.countByCreatedAtBetween(mStartDT, mEndDT),
                userRepository.countByRole("GARAGISTE"),
                userRepository.countByRole("CLIENT"),
                userRepository.countByRoleAndCreatedAtBetween("GARAGISTE", mStartDT, mEndDT),
                interventionRepository.count(),
                interventionRepository.countByInterventionDateBetween(mStart, mEnd),
                mrr   != null ? mrr   : BigDecimal.ZERO,
                total != null ? total : BigDecimal.ZERO,
                recentGarages
        );
    }

    @Transactional(readOnly = true)
    public List<AdminGarageResponse> getAllGarages() {
        return garageRepository.findAll().stream()
                .map(g -> new AdminGarageResponse(
                        g.getId(),
                        g.getName(),
                        g.getCity(),
                        g.getPhone(),
                        g.getEmail(),
                        g.getAddress(),
                        g.getOwner().fullName(),
                        g.getOwner().getEmail(),
                        g.isVerified(),
                        g.getCreatedAt() != null ? g.getCreatedAt().toLocalDate().toString() : null
                ))
                .toList();
    }

    @Transactional
    public AdminGarageResponse toggleVerify(Long garageId) {
        Garage g = garageRepository.findById(garageId)
                .orElseThrow(() -> new EntityNotFoundException("Garage introuvable (id=" + garageId + ")"));
        g.setVerified(!g.isVerified());
        garageRepository.save(g);
        return new AdminGarageResponse(
                g.getId(), g.getName(), g.getCity(), g.getPhone(), g.getEmail(), g.getAddress(),
                g.getOwner().fullName(), g.getOwner().getEmail(), g.isVerified(),
                g.getCreatedAt() != null ? g.getCreatedAt().toLocalDate().toString() : null
        );
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> {
                    String role = u.getRoles().stream()
                            .map(r -> r.getRoleName())
                            .filter(r -> List.of("ADMIN", "GARAGISTE", "CLIENT").contains(r))
                            .findFirst()
                            .orElse("INCONNU");
                    String garageName = null;
                    if ("GARAGISTE".equals(role)) {
                        garageName = garageRepository.findByOwner(u)
                                .map(Garage::getName)
                                .orElse(null);
                    }
                    String createdAt = u.getCreatedAt() != null
                            ? u.getCreatedAt().toLocalDate().toString()
                            : null;
                    return new AdminUserResponse(
                            u.getId(), u.getFirstName(), u.getLastName(),
                            u.getEmail(), role, u.isEnabled(), createdAt, garageName
                    );
                })
                .toList();
    }
}
