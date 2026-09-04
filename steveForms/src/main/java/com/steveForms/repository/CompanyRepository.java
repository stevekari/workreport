package com.steveForms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.steveForms.model.Company;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByNameIgnoreCase(String name);
    Optional<Company> findByCompanyCodeIgnoreCase(String companyCode);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByCompanyCodeIgnoreCase(String companyCode);
}