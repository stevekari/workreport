package com.steveForms.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.steveForms.model.Company;
import com.steveForms.model.Product;

import java.util.List;
 
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCompanyOrderByCodeAsc(Company company);
    boolean existsByCompanyAndCodeIgnoreCase(Company company, String code);
}
 