package com.steveForms.dto;

public class AuthDtos {

    public record RegisterCompanyRequest(
        String companyName,
        String name,
        String adminUsername,
        String username,
        String adminPassword,
        String password
    ) {
        public RegisterCompanyRequest(String companyName, String adminUsername, String adminPassword) {
            this(companyName, null, adminUsername, null, adminPassword, null);
        }

        public String getEffectiveCompanyName() {
            if (companyName != null && !companyName.isBlank()) return companyName.trim();
            if (name != null && !name.isBlank()) return name.trim();
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
        String role,
        String companyName,
        String companyCode,
        String displayId,
        String profilePicture,
        String department
    ) {}
}
