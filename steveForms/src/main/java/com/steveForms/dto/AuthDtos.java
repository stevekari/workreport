package com.steveForms.dto;

public class AuthDtos {

    public record RegisterCompanyRequest(
        String companyName,
        String name,
        String email,
        String adminEmail,
        String adminUsername,
        String username,
        String adminPassword,
        String password
    ) {
        public RegisterCompanyRequest(String companyName, String adminUsername, String adminPassword) {
            this(companyName, null, null, null, adminUsername, null, adminPassword, null);
        }

        public RegisterCompanyRequest(String companyName, String email, String adminUsername, String adminPassword) {
            this(companyName, null, email, null, adminUsername, null, adminPassword, null);
        }

        public String getEffectiveCompanyName() {
            if (companyName != null && !companyName.isBlank()) return companyName.trim();
            if (name != null && !name.isBlank()) return name.trim();
            return null;
        }

        public String getEffectiveEmail() {
            if (email != null && !email.isBlank()) return email.trim();
            if (adminEmail != null && !adminEmail.isBlank()) return adminEmail.trim();
            return null;
        }

        public String getEffectiveAdminUsername() {
            if (adminUsername != null && !adminUsername.isBlank()) return adminUsername.trim();
            if (username != null && !username.isBlank()) return username.trim();
            return null;
        }

        public String getEffectiveAdminPassword() {
            if (adminPassword != null && !adminPassword.isBlank()) return adminPassword.trim();
            if (password != null && !password.isBlank()) return password.trim();
            return null;
        }
    }

    public record RegisterEmployeeRequest(
        String companyIdOrCode,
        String companyName,
        String fullName,
        String username,
        String password,
        String department
    ) {
        public String getEffectiveCompanyIdentifier() {
            if (companyIdOrCode != null && !companyIdOrCode.isBlank()) return companyIdOrCode.trim();
            if (companyName != null && !companyName.isBlank()) return companyName.trim();
            return null;
        }
    }

    public record LoginRequest(String usernameOrId, String password) {}

    public record UpdateProfileRequest(String fullName, String profilePicture, String password, String department) {}

    public record AuthResponse(
        String token,
        Long userId,
        String fullName,
        String username,
        String email,
        String role,
        String companyName,
        String companyCode,
        String displayId,
        String profilePicture,
        String department
    ) {
        public AuthResponse(
            String token,
            Long userId,
            String fullName,
            String username,
            String role,
            String companyName,
            String companyCode,
            String displayId,
            String profilePicture,
            String department
        ) {
            this(token, userId, fullName, username, null, role, companyName, companyCode, displayId, profilePicture, department);
        }
    }
}
