package com.steveForms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.steveForms.model.Company;
import com.steveForms.model.Message;
import com.steveForms.model.User;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByCompanyOrderByCreatedAtDesc(Company company);
    List<Message> findBySenderOrderByCreatedAtDesc(User sender);
    long countByCompanyAndStatus(Company company, String status);
}

