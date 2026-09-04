package com.steveForms.dto;

import java.time.LocalDate;

public record CreateEntryRequest(String product, String department, LocalDate date, Integer quantity) {
}
