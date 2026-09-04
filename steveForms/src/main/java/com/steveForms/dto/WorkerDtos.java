package com.steveForms.dto;

public class WorkerDtos {

	public record CreateWorkerRequest(String fullName, String username, String password, String department) {
	}

	public record UpdateWorkerRequest(String fullName, String username, String password, String department) {
	}

	public record WorkerResponse(Long id, String displayId, String fullName, String username, long entryCount, String department, String profilePicture) {
	}
}
