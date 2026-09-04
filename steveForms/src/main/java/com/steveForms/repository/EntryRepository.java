package com.steveForms.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.steveForms.model.Company;
import com.steveForms.model.Entry;

import com.steveForms.model.User;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EntryRepository extends JpaRepository<Entry, Long> {
	List<Entry> findByCompanyOrderByDateDesc(Company company);

	List<Entry> findByWorkerOrderByDateDesc(User worker);

	long countByWorker(User worker);

	Optional<Entry> findByWorkerAndProductIgnoreCaseAndDepartmentAndDate(User worker, String product, String department,
			LocalDate date);
}
