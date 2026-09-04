package com.steveForms.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "entries")
public class Entry {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String product;

	private String department; // Color, Drying, Roll

	private LocalDate date;

	private String status = "OK";

	private int quantity = 1;

	@ManyToOne
	@JoinColumn(name = "worker_id", nullable = false)
	private User worker;

	@ManyToOne
	@JoinColumn(name = "company_id", nullable = false)
	private Company company;

	public Entry() {
	}

	public Entry(String product, String department, LocalDate date, int quantity, User worker, Company company) {
		this.product = product;
		this.department = department;
		this.date = date;
		this.quantity = quantity;
		this.worker = worker;
		this.company = company;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getProduct() {
		return product;
	}

	public void setProduct(String product) {
		this.product = product;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public LocalDate getDate() {
		return date;
	}

	public void setDate(LocalDate date) {
		this.date = date;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public int getQuantity() {
		return quantity;
	}

	public void setQuantity(int quantity) {
		this.quantity = quantity;
	}

	public User getWorker() {
		return worker;
	}

	public void setWorker(User worker) {
		this.worker = worker;
	}

	public Company getCompany() {
		return company;
	}

	public void setCompany(Company company) {
		this.company = company;
	}
}
