package com.theember.repository;

import com.theember.entity.Offer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OfferRepository extends JpaRepository<Offer, Long> {
    @Query("SELECT o FROM Offer o WHERE o.isActive = true AND o.startDate <= :now AND o.expiryDate >= :now")
    List<Offer> findCurrentActiveOffers(@Param("now") LocalDateTime now);

    Optional<Offer> findByCodeIgnoreCase(String code);

    long countByIsActiveTrue();
}
