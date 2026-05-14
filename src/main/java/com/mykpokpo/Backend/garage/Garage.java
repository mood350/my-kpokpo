package com.mykpokpo.Backend.garage;

import com.mykpokpo.Backend.user.User;
import com.mykpokpo.Backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
public class Garage extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false, unique = true)
    private User owner;

    @Column(nullable = false)
    private String name;

    private String phone;
    private String email;
    private String address;

    @Column(nullable = false)
    private String city;

    @Builder.Default
    private String country = "Togo";

    @Column(columnDefinition = "TEXT")
    private String description;

    private String logoUrl;

    @Builder.Default
    private boolean verified = false;

    private Double latitude;
    private Double longitude;

    @OneToMany(mappedBy = "garage", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WorkingHours> workingHours = new ArrayList<>();
}
