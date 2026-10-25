package com.theember.repository;

import com.theember.entity.ContactEnquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContactEnquiryRepository extends JpaRepository<ContactEnquiry, Long> {
}

