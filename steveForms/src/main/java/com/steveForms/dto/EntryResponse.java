package com.steveForms.dto;

import java.time.LocalDate;

public record EntryResponse(Long id, String product, String department, LocalDate date, String status, int quantity,
		boolean merged, String workerName, Long workerId) {
}
