package com.theember.repository;

import com.theember.entity.MenuItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByIsAvailableTrue();
    List<MenuItem> findByIsFeaturedTrueAndIsAvailableTrue();
    Optional<MenuItem> findBySlug(String slug);

    @Query("SELECT m FROM MenuItem m WHERE " +
           "(:categoryId IS NULL OR m.category.id = :categoryId) AND " +
           "(:isVeg IS NULL OR m.isVeg = :isVeg) AND " +
           "(:search IS NULL OR LOWER(m.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(m.description) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:onlyAvailable = false OR m.isAvailable = true)")
    Page<MenuItem> filterMenuItems(
            @Param("categoryId") Long categoryId,
            @Param("isVeg") Boolean isVeg,
            @Param("search") String search,
            @Param("onlyAvailable") boolean onlyAvailable,
            Pageable pageable);

    long countByIsAvailableTrue();
}
