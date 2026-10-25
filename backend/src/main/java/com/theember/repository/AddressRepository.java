package com.theember.repository;

import com.theember.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Address> findByUserIdAndIsDefaultTrue(Long userId);
}
