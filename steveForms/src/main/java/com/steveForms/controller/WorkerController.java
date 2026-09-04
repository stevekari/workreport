package com.steveForms.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.steveForms.dto.WorkerDtos.CreateWorkerRequest;
import com.steveForms.dto.WorkerDtos.UpdateWorkerRequest;
import com.steveForms.dto.WorkerDtos.WorkerResponse;
import com.steveForms.model.Role;
import com.steveForms.model.User;
import com.steveForms.repository.EntryRepository;
import com.steveForms.repository.UserRepository;
import com.steveForms.security.JwtUtil;

import java.util.List;

@RestController
@RequestMapping("/api/workers")
@CrossOrigin(origins = "*", maxAge = 3600)
public class WorkerController {

    private final UserRepository userRepo;
    private final EntryRepository entryRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public WorkerController(UserRepository userRepo, EntryRepository entryRepo,
                            PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepo = userRepo;
        this.entryRepo = entryRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // GET /api/workers - list all workers in the caller's company (admin only)
    @GetMapping
    public ResponseEntity<?> listWorkers(HttpServletRequest request) {
        User admin = currentUser(request);
        if (admin == null || admin.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body("Admins only");
        }

        List<WorkerResponse> workers = userRepo.findByCompanyAndRole(admin.getCompany(), Role.WORKER)
                .stream()
                .map(w -> new WorkerResponse(
                        w.getId(),
                        w.getDisplayId(),
                        w.getFullName(),
                        w.getUsername(),
                        entryRepo.countByWorker(w),
                        w.getDepartment() != null ? w.getDepartment() : "Color",
                        w.getProfilePicture()
                ))
                .toList();

        return ResponseEntity.ok(workers);
    }

    // POST /api/workers - admin creates a new worker login (unique within caller's company)
    @PostMapping
    public ResponseEntity<?> createWorker(@RequestBody CreateWorkerRequest req, HttpServletRequest request) {
        User admin = currentUser(request);
        if (admin == null || admin.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body("Admins only");
        }

        if (req == null) {
            return ResponseEntity.badRequest().body("Worker details are required");
        }

        String fullName = req.fullName() != null ? req.fullName().trim() : "";
        String username = req.username() != null ? req.username().trim() : "";
        String rawPassword = req.password() != null ? req.password().trim() : "";
        String dept = req.department() != null && !req.department().isBlank() ? req.department().trim() : "Color";

        if (username.isEmpty()) {
            if (!fullName.isEmpty()) {
                username = fullName.toLowerCase().replaceAll("[^a-zA-Z0-9]", "");
            } else {
                return ResponseEntity.badRequest().body("Worker name or username is required");
            }
        }

        if (fullName.isEmpty()) {
            fullName = username;
        }

        if (rawPassword.isEmpty()) {
            rawPassword = "123456"; // default worker password if left blank
        }



        User worker = new User(
                fullName,
                username,
                passwordEncoder.encode(rawPassword),
                Role.WORKER,
                admin.getCompany(),
                null,
                dept
        );
        worker = userRepo.save(worker);

        return ResponseEntity.ok(new WorkerResponse(
                worker.getId(),
                worker.getDisplayId(),
                worker.getFullName(),
                worker.getUsername(),
                0,
                worker.getDepartment(),
                worker.getProfilePicture()
        ));
    }

    // PUT /api/workers/{id} - admin updates a worker's details (name, department, username, password)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateWorker(@PathVariable Long id, @RequestBody UpdateWorkerRequest req, HttpServletRequest request) {
        User admin = currentUser(request);
        if (admin == null || admin.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body("Admins only");
        }

        User worker = userRepo.findById(id).orElse(null);
        if (worker == null || !worker.getCompany().getId().equals(admin.getCompany().getId())) {
            return ResponseEntity.status(404).body("Worker not found");
        }

        if (req.username() != null && !req.username().isBlank()) {
            worker.setUsername(req.username().trim());
        }

        if (req.fullName() != null && !req.fullName().isBlank()) {
            worker.setFullName(req.fullName().trim());
        }

        if (req.department() != null && !req.department().isBlank()) {
            worker.setDepartment(req.department().trim());
        }

        if (req.password() != null && !req.password().isBlank()) {
            worker.setPassword(passwordEncoder.encode(req.password().trim()));
        }

        worker = userRepo.save(worker);

        return ResponseEntity.ok(new WorkerResponse(
                worker.getId(),
                worker.getDisplayId(),
                worker.getFullName(),
                worker.getUsername(),
                entryRepo.countByWorker(worker),
                worker.getDepartment() != null ? worker.getDepartment() : "Color",
                worker.getProfilePicture()
        ));
    }

    // DELETE /api/workers/{id} - admin removes a worker
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWorker(@PathVariable Long id, HttpServletRequest request) {
        User admin = currentUser(request);
        if (admin == null || admin.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body("Admins only");
        }

        User worker = userRepo.findById(id).orElse(null);
        if (worker == null || !worker.getCompany().getId().equals(admin.getCompany().getId())) {
            return ResponseEntity.status(404).body("Worker not found");
        }

        userRepo.delete(worker);
        return ResponseEntity.ok().build();
    }

    private User currentUser(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId != null) {
            return userRepo.findById(userId).orElse(null);
        }
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.isValid(token)) {
                Long id = jwtUtil.extractUserId(token);
                if (id != null) {
                    return userRepo.findById(id).orElse(null);
                }
            }
        }
        return null;
    }
}