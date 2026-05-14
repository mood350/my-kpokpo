package com.mykpokpo.Backend.role;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.mykpokpo.Backend.user.User;
import com.mykpokpo.Backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
public class Role extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true)
    private String roleName;

    @ManyToMany(mappedBy = "roles")
    @JsonIgnore
    private List<User> users;
}
