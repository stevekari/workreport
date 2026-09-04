package com.steveForms.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.steveForms.model.Product;
import com.steveForms.model.User;
import com.steveForms.repository.ProductRepository;
import com.steveForms.repository.UserRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProductController {

	private final ProductRepository productRepo;
	private final UserRepository userRepo;

	public ProductController(ProductRepository productRepo, UserRepository userRepo) {
		this.productRepo = productRepo;
		this.userRepo = userRepo;
	}

	// GET /api/products - list every product code for the caller's company
	@GetMapping
	public ResponseEntity<?> listProducts(HttpServletRequest request) {
		User user = currentUser(request);
		if (user == null)
			return ResponseEntity.status(401).build();

		List<Product> products = productRepo.findByCompanyOrderByCodeAsc(user.getCompany());
		return ResponseEntity.ok(products);
	}

	// POST /api/products - add a new product code (used by the "add new" option in
	// the search box)
	@PostMapping
	public ResponseEntity<?> addProduct(@RequestBody Map<String, String> body, HttpServletRequest request) {
		User user = currentUser(request);
		if (user == null)
			return ResponseEntity.status(401).build();

		String code = body.get("code");
		if (code == null || code.isBlank()) {
			return ResponseEntity.badRequest().body("Product code is required");
		}
		if (productRepo.existsByCompanyAndCodeIgnoreCase(user.getCompany(), code)) {
			return ResponseEntity.ok(Map.of("message", "already exists"));
		}

		Product product = productRepo.save(new Product(code, user.getCompany()));
		return ResponseEntity.ok(product);
	}

	private User currentUser(HttpServletRequest request) {
		Long userId = (Long) request.getAttribute("userId");
		if (userId == null)
			return null;
		return userRepo.findById(userId).orElse(null);
	}
}