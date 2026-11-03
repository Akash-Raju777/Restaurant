package com.theember.repository;

import com.theember.entity.Offer;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OfferRepository extends JpaRepository<Offer, Long> {

    @Query("SELECT DISTINCT o FROM Offer o LEFT JOIN FETCH o.items WHERE o.isActive = true " +
            "AND o.startDate <= :now AND o.expiryDate >= :now " +
            "AND (o.usageLimit IS NULL OR o.timesUsed < o.usageLimit) " +
            "ORDER BY o.createdAt DESC")
    List<Offer> findCurrentActiveOffers(@Param("now") LocalDateTime now);

    Optional<Offer> findByCodeIgnoreCase(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Offer o WHERE UPPER(o.code) = UPPER(:code)")
    Optional<Offer> findByCodeIgnoreCaseForUpdate(@Param("code") String code);

    long countByIsActiveTrue();
}
