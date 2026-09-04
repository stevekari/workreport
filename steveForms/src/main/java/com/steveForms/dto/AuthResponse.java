package com.steveForms.dto;

public record AuthResponse(
    String token,
    Long userId,
    String fullName,
    String username,
    String role,
    String companyName,
    String displayId,
    String profilePicture,
    String department
) {}
