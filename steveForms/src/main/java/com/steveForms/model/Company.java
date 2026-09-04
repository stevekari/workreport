package com.steveForms.model;

import jakarta.persistence.*;
import java.util.concurrent.ThreadLocalRandom;

@Entity
@Table(name = "companies")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(unique = true, nullable = false)
    private String companyCode; // e.g. COMP-4829 (Random 4-digit number)

    public Company() {
    }

    public Company(String name) {
        this.name = name;
        this.companyCode = "COMP-" + ThreadLocalRandom.current().nextInt(1000, 10000);
    }

    public Company(String name, String companyCode) {
        this.name = name;
        this.companyCode = companyCode;
    }

    @PrePersist
    public void ensureCompanyCode() {
        if (this.companyCode == null || this.companyCode.isBlank()) {
            this.companyCode = "COMP-" + ThreadLocalRandom.current().nextInt(1000, 10000);
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCompanyCode() {
        if (companyCode != null && !companyCode.isBlank()) {
            return companyCode;
        }
        return id != null ? "COMP-" + (1000 + (id % 9000)) : "COMP-1001";
    }

    public void setCompanyCode(String companyCode) {
        this.companyCode = companyCode;
    }
}