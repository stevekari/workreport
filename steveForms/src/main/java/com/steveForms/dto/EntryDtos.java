package com.steveForms.dto;

import java.time.LocalDate;

public class EntryDtos {

    public record CreateEntryRequest(String product, String department, LocalDate date) {}

    public record UpdateEntryRequest(String product, String department, LocalDate date, String status) {}

    public record EntryResponse(
        Long id,
        String product,
        String department,
        LocalDate date,
        String status,
        String workerName,
        Long workerId,
        String workerProfilePicture,
        String workerDisplayId
    ) {}
}