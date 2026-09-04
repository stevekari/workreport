package com.steveForms.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.steveForms.dto.AuthDtos.AuthResponse;
import com.steveForms.dto.AuthDtos.LoginRequest;
import com.steveForms.dto.AuthDtos.RegisterCompanyRequest;
import com.steveForms.dto.AuthDtos.RegisterEmployeeRequest;
import com.steveForms.dto.AuthDtos.UpdateProfileRequest;
import com.steveForms.model.Company;
import com.steveForms.model.Role;
import com.steveForms.model.User;
import com.steveForms.repository.CompanyRepository;
import com.steveForms.repository.UserRepository;
import com.steveForms.security.JwtUtil;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private final CompanyRepository companyRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(CompanyRepository companyRepo, UserRepository userRepo,
                          PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.companyRepo = companyRepo;
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // POST /api/auth/register-company - Create new company and admin account (Only company creates email on registration)
    @PostMapping("/register-company")
    public ResponseEntity<?> registerCompany(@RequestBody RegisterCompanyRequest req) {
        if (req == null) {
            return ResponseEntity.badRequest().body("Request body is missing");
        }
        String compName = req.getEffectiveCompanyName();
        if (compName == null || compName.isEmpty()) {
            return ResponseEntity.badRequest().body("Company name is required");
        }
        String email = req.getEffectiveEmail();
        String adminUser = req.getEffectiveAdminUsername();
        if (adminUser == null || adminUser.isEmpty()) {
            return ResponseEntity.badRequest().body("Admin username is required");
        }
        String adminPass = req.getEffectiveAdminPassword();
        if (adminPass == null || adminPass.isEmpty()) {
            return ResponseEntity.badRequest().body("Admin password is required");
        }

        // Strict duplicate protection: Company cannot be registered twice with the same name
        if (companyRepo.existsByNameIgnoreCase(compName)) {
            return ResponseEntity.badRequest().body("The company name '" + compName + "' is already in use. A company with this name has already been registered in the app. Please choose a different company name or sign in.");
        }

        // Generate a random 4-digit unique company ID (e.g. COMP-4829)
        String unique4DigitCode = generateUnique4DigitCompanyCode();
        Company company = companyRepo.save(new Company(compName, unique4DigitCode, email));

        User admin = new User(
                "Admin",
                adminUser,
                email,
                passwordEncoder.encode(adminPass),
                Role.ADMIN,
                company
        );
        admin = userRepo.save(admin);

        String token = jwtUtil.generateToken(admin.getId(), admin.getUsername(), admin.getRole().name());

        ResponseCookie cookie = ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(false) // set true in production (HTTPS)
                .sameSite("Strict")
                .path("/")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new AuthResponse(
                        token,
                        admin.getId(),
                        admin.getFullName(),
                        admin.getUsername(),
                        admin.getEmail(),
                        admin.getRole().name(),
                        company.getName(),
                        company.getCompanyCode(),
                        admin.getDisplayId(),
                        admin.getProfilePicture(),
                        admin.getDepartment()
                ));
    }

    // POST /api/auth/register-employee - Employee registers under verified origin company with Company ID (No email required)
    @PostMapping("/register-employee")
    public ResponseEntity<?> registerEmployee(@RequestBody RegisterEmployeeRequest req) {
        if (req == null) {
            return ResponseEntity.badRequest().body("Request body is missing");
        }

        String compIdentifier = req.getEffectiveCompanyIdentifier();
        if (compIdentifier == null || compIdentifier.isEmpty()) {
            return ResponseEntity.badRequest().body("Security Verification Required: Company ID is required. Employees cannot register without a verified Company ID.");
        }
        if (req.fullName() == null || req.fullName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Employee full name is required.");
        }
        if (req.username() == null || req.username().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Username is required.");
        }
        if (req.password() == null || req.password().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Password is required.");
        }

        String empUsername = req.username().trim();
        String empFullName = req.fullName().trim();
        String empPassword = req.password().trim();

        // 1. Security Check: Company MUST be registered in the system (matches 4-digit code, COMP-xxxx, or name)
        Company company = findCompanyByIdOrCodeOrName(compIdentifier);
        if (company == null) {
            return ResponseEntity.status(401).body("Security Verification Failed: Company ID / Code '" + compIdentifier + "' is not registered in the system. Employees cannot register without a verified company.");
        }

        String dept = req.department() != null && !req.department().isBlank() ? req.department().trim() : "Color";

        User employee = new User(
                empFullName,
                empUsername,
                passwordEncoder.encode(empPassword),
                Role.WORKER,
                company,
                null,
                dept
        );
        employee = userRepo.save(employee);

        String token = jwtUtil.generateToken(employee.getId(), employee.getUsername(), employee.getRole().name());

        ResponseCookie cookie = ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(false)
                .sameSite("Strict")
                .path("/")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new AuthResponse(
                        token,
                        employee.getId(),
                        employee.getFullName(),
                        employee.getUsername(),
                        employee.getEmail(),
                        employee.getRole().name(),
                        company.getName(),
                        company.getCompanyCode(),
                        employee.getDisplayId(),
                        employee.getProfilePicture(),
                        employee.getDepartment()
                ));
    }

    // POST /api/auth/login - Flexible login by Email, Display ID ("ID-1001"), or Name/Username + password
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        if (req == null || req.usernameOrId() == null || req.usernameOrId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Please enter your name, email, or ID.");
        }
        if (req.password() == null || req.password().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Password is required.");
        }

        String inputIdentifier = req.usernameOrId().trim();
        String rawPassword = req.password();

        User user = findUserForAuthentication(inputIdentifier, rawPassword);
        if (user == null) {
            return ResponseEntity.status(401).body("Invalid credentials. Please check your username, email, ID, and password.");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().name());

        ResponseCookie cookie = ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(false)
                .sameSite("Strict")
                .path("/")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new AuthResponse(
                        token,
                        user.getId(),
                        user.getFullName(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getRole().name(),
                        user.getCompany().getName(),
                        user.getCompany().getCompanyCode(),
                        user.getDisplayId(),
                        user.getProfilePicture(),
                        user.getDepartment()
                ));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest req, HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        if (req.fullName() != null && !req.fullName().isBlank()) {
            user.setFullName(req.fullName().trim());
        }
        if (req.profilePicture() != null) {
            user.setProfilePicture(req.profilePicture());
        }
        if (req.password() != null && !req.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.password().trim()));
        }
        if (req.department() != null && !req.department().isBlank()) {
            user.setDepartment(req.department().trim());
        }

        user = userRepo.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().name());

        return ResponseEntity.ok(new AuthResponse(
                token,
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getCompany().getName(),
                user.getCompany().getCompanyCode(),
                user.getDisplayId(),
                user.getProfilePicture(),
                user.getDepartment()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        return ResponseEntity.ok(new AuthResponse(
                null,
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getCompany().getName(),
                user.getCompany().getCompanyCode(),
                user.getDisplayId(),
                user.getProfilePicture(),
                user.getDepartment()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        ResponseCookie cookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Strict")
                .path("/")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body("Logged out successfully");
    }

    private String generateUnique4DigitCompanyCode() {
        for (int i = 0; i < 50; i++) {
            int randomNum = ThreadLocalRandom.current().nextInt(1000, 10000);
            String code = "COMP-" + randomNum;
            if (!companyRepo.existsByCompanyCodeIgnoreCase(code)) {
                return code;
            }
        }
        return "COMP-" + ThreadLocalRandom.current().nextInt(1000, 10000);
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

    private boolean checkPasswordMatch(String rawPassword, String encodedPassword) {
        if (rawPassword == null || encodedPassword == null) return false;
        return passwordEncoder.matches(rawPassword, encodedPassword)
                || passwordEncoder.matches(rawPassword.trim(), encodedPassword);
    }

    private User findUserForAuthentication(String inputIdentifier, String password) {
        if (inputIdentifier == null || inputIdentifier.isBlank()) return null;
        String trimmed = inputIdentifier.trim();

        // 1. Try display ID ("ID-1234") or pure numeric ID (globally unique across all companies)
        if (trimmed.toUpperCase().startsWith("ID-")) {
            try {
                Long id = Long.parseLong(trimmed.substring(3).trim());
                Optional<User> byId = userRepo.findById(id);
                if (byId.isPresent() && checkPasswordMatch(password, byId.get().getPassword())) {
                    return byId.get();
                }
            } catch (NumberFormatException ignored) {}
        }
        if (trimmed.matches("^\\d+$")) {
            try {
                Long id = Long.parseLong(trimmed);
                Optional<User> byId = userRepo.findById(id);
                if (byId.isPresent() && checkPasswordMatch(password, byId.get().getPassword())) {
                    return byId.get();
                }
            } catch (NumberFormatException ignored) {}
        }

        // 2. Try email matches (company admin email)
        List<User> byEmail = userRepo.findAllByEmailIgnoreCase(trimmed);
        for (User candidate : byEmail) {
            if (checkPasswordMatch(password, candidate.getPassword())) {
                return candidate;
            }
        }

        // 3. Try username matches across companies (authenticates the one with matching password)
        List<User> byUsername = userRepo.findAllByUsernameIgnoreCase(trimmed);
        for (User candidate : byUsername) {
            if (checkPasswordMatch(password, candidate.getPassword())) {
                return candidate;
            }
        }

        // 4. Try full name matches across companies (authenticates the one with matching password)
        List<User> byFullName = userRepo.findByFullNameIgnoreCase(trimmed);
        for (User candidate : byFullName) {
            if (checkPasswordMatch(password, candidate.getPassword())) {
                return candidate;
            }
        }

        return null;
    }

    private Company findCompanyByIdOrCodeOrName(String input) {
        if (input == null || input.isBlank()) return null;
        String trimmed = input.trim();

        // 1. Try direct company code (e.g. COMP-4829)
        Optional<Company> byCode = companyRepo.findByCompanyCodeIgnoreCase(trimmed);
        if (byCode.isPresent()) return byCode.get();

        // 2. If entered 4 numbers (e.g. "4829"), check "COMP-" + 4829
        if (trimmed.matches("^\\d{4}$")) {
            Optional<Company> by4DigitCode = companyRepo.findByCompanyCodeIgnoreCase("COMP-" + trimmed);
            if (by4DigitCode.isPresent()) return by4DigitCode.get();
        }

        // 3. Try company email
        Optional<Company> byEmail = companyRepo.findByEmailIgnoreCase(trimmed);
        if (byEmail.isPresent()) return byEmail.get();

        // 4. Try company name (case-insensitive)
        Optional<Company> byName = companyRepo.findByNameIgnoreCase(trimmed);
        if (byName.isPresent()) return byName.get();

        // 5. Try COMP- prefix numeric ID
        if (trimmed.toUpperCase().startsWith("COMP-")) {
            try {
                Long id = Long.parseLong(trimmed.substring(5).trim());
                Optional<Company> byId = companyRepo.findById(id);
                if (byId.isPresent()) return byId.get();
            } catch (NumberFormatException ignored) {}
        }

        // 6. Try raw numeric database ID
        if (trimmed.matches("^\\d+$")) {
            try {
                Long id = Long.parseLong(trimmed);
                Optional<Company> byId = companyRepo.findById(id);
                if (byId.isPresent()) return byId.get();
            } catch (NumberFormatException ignored) {}
        }

        return null;
    }
}