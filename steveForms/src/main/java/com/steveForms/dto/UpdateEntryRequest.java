package com.steveForms.dto;

import java.time.LocalDate;

public record UpdateEntryRequest(String product, String department, LocalDate date, String status, Integer quantity) {
}