package com.steveForms.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;

    @Column(nullable = false)
    private String username;

    private String email; // Only set for company admin upon company registration

    @Column(nullable = false)
    private String password; // stored as a BCrypt hash

    @Enumerated(EnumType.STRING)
    private Role role;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String profilePicture;

    private String department;

    public User() {}

    public User(String fullName, String username, String password, Role role, Company company) {
        this.fullName = fullName;
        this.username = username;
        this.password = password;
        this.role = role;
        this.company = company;
    }

    public User(String fullName, String username, String email, String password, Role role, Company company) {
        this.fullName = fullName;
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
        this.company = company;
    }

    public User(String fullName, String username, String password, Role role, Company company, String profilePicture, String department) {
        this.fullName = fullName;
        this.username = username;
        this.password = password;
        this.role = role;
        this.company = company;
        this.profilePicture = profilePicture;
        this.department = department;
    }

    // A friendly unique login ID like "ID-1001", "ID-1002"
    public String getDisplayId() {
        return "ID-" + (id != null ? id : "");
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }

    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}