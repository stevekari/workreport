package com.steveForms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.steveForms.model.Company;
import com.steveForms.model.Role;
import com.steveForms.model.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findAllByUsernameIgnoreCase(String username);
    Optional<User> findByUsernameIgnoreCase(String username);
    List<User> findByFullNameIgnoreCase(String fullName);
    List<User> findAllByEmailIgnoreCase(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByCompanyAndUsernameIgnoreCase(Company company, String username);
    boolean existsByCompanyAndUsernameIgnoreCase(Company company, String username);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByEmailIgnoreCase(String email);
    List<User> findByCompanyAndRole(Company company, Role role);
}