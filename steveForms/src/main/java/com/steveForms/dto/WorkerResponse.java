package com.steveForms.dto;

public record WorkerResponse(Long id, String displayId, String fullName, String username, long entryCount, String department, String profilePicture) {}
