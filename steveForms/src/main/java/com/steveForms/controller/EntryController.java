package com.steveForms.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.steveForms.dto.EntryDtos.CreateEntryRequest;
import com.steveForms.dto.EntryDtos.EntryResponse;
import com.steveForms.dto.EntryDtos.UpdateEntryRequest;
import com.steveForms.model.Entry;
import com.steveForms.model.Role;
import com.steveForms.model.User;
import com.steveForms.repository.EntryRepository;
import com.steveForms.repository.UserRepository;

import java.util.List;

@RestController
@RequestMapping("/api/entries")
@CrossOrigin(origins = "*", maxAge = 3600)
public class EntryController {

    private final EntryRepository entryRepo;
    private final UserRepository userRepo;

    public EntryController(EntryRepository entryRepo, UserRepository userRepo) {
        this.entryRepo = entryRepo;
        this.userRepo = userRepo;
    }

    // GET /api/entries
    // - admin: sees every entry in the company (for the dashboard)
    // - worker: sees only their own submissions
    @GetMapping
    public ResponseEntity<?> listEntries(HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null)
            return ResponseEntity.status(401).build();

        List<Entry> entries = user.getRole() == Role.ADMIN
                ? entryRepo.findByCompanyOrderByDateDesc(user.getCompany())
                : entryRepo.findByWorkerOrderByDateDesc(user);

        return ResponseEntity.ok(entries.stream().map(this::toResponse).toList());
    }

    // POST /api/entries - a worker submits a new product entry
    @PostMapping
    public ResponseEntity<?> createEntry(@RequestBody CreateEntryRequest req, HttpServletRequest request) {
        User worker = currentUser(request);
        if (worker == null)
            return ResponseEntity.status(401).build();

        Entry entry = new Entry();
        entry.setProduct(req.product());
        entry.setDepartment(req.department());
        entry.setDate(req.date());
        entry.setWorker(worker);
        entry.setCompany(worker.getCompany());
        entry = entryRepo.save(entry);

        return ResponseEntity.ok(toResponse(entry));
    }

    // PUT /api/entries/{id} - admin edits an entry
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEntry(@PathVariable Long id, @RequestBody UpdateEntryRequest req,
            HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null || user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body("Admins only");
        }

        Entry entry = entryRepo.findById(id).orElse(null);
        if (entry == null || !entry.getCompany().getId().equals(user.getCompany().getId())) {
            return ResponseEntity.status(404).body("Entry not found");
        }

        entry.setProduct(req.product());
        entry.setDepartment(req.department());
        entry.setDate(req.date());
        if (req.status() != null)
            entry.setStatus(req.status());
        entryRepo.save(entry);

        return ResponseEntity.ok(toResponse(entry));
    }

    // DELETE /api/entries/{id} - admin removes an entry
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEntry(@PathVariable Long id, HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null || user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body("Admins only");
        }

        Entry entry = entryRepo.findById(id).orElse(null);
        if (entry == null || !entry.getCompany().getId().equals(user.getCompany().getId())) {
            return ResponseEntity.status(404).body("Entry not found");
        }

        entryRepo.delete(entry);
        return ResponseEntity.ok().build();
    }

    private EntryResponse toResponse(Entry e) {
        User w = e.getWorker();
        String pfp = w != null ? w.getProfilePicture() : null;
        String dispId = w != null ? w.getDisplayId() : null;
        String name = w != null ? w.getFullName() : "Unknown";
        Long wId = w != null ? w.getId() : null;
        return new EntryResponse(
            e.getId(),
            e.getProduct(),
            e.getDepartment(),
            e.getDate(),
            e.getStatus(),
            name,
            wId,
            pfp,
            dispId
        );
    }

    private User currentUser(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null)
            return null;
        return userRepo.findById(userId).orElse(null);
    }
}