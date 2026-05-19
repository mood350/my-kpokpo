package com.mykpokpo.Backend.messaging;

import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    List<Conversation> findAllByGarageOrderByLastModifiedDateDesc(Garage garage);

    List<Conversation> findAllByClientOrderByLastModifiedDateDesc(User client);

    Optional<Conversation> findByGarageAndClient(Garage garage, User client);
}
