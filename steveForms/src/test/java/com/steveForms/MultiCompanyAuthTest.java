package com.steveForms;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;

import com.steveForms.controller.AuthController;
import com.steveForms.dto.AuthDtos.AuthResponse;
import com.steveForms.dto.AuthDtos.LoginRequest;
import com.steveForms.dto.AuthDtos.RegisterCompanyRequest;
import com.steveForms.dto.AuthDtos.RegisterEmployeeRequest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class MultiCompanyAuthTest {

    @Autowired
    private AuthController authController;

    @Test
    void testMultipleCompaniesCanHaveSameAdminUsername() {
        // 1. Register Company A with admin username "admin" and email "alpha@corp.com"
        RegisterCompanyRequest reqA = new RegisterCompanyRequest("Alpha Corp", "alpha@corp.com", "admin", "alphaSecret123");
        ResponseEntity<?> resA = authController.registerCompany(reqA);
        assertEquals(200, resA.getStatusCode().value(), "Company A registration should succeed");
        assertTrue(resA.getBody() instanceof AuthResponse);
        AuthResponse authA = (AuthResponse) resA.getBody();
        assertEquals("Alpha Corp", authA.companyName());
        assertEquals("alpha@corp.com", authA.email());

        // 2. Register Company B with SAME admin username "admin" and email "beta@corp.com"
        RegisterCompanyRequest reqB = new RegisterCompanyRequest("Beta Corp", "beta@corp.com", "admin", "betaSecret456");
        ResponseEntity<?> resB = authController.registerCompany(reqB);
        assertEquals(200, resB.getStatusCode().value(), "Company B registration with same 'admin' username should succeed");
        assertTrue(resB.getBody() instanceof AuthResponse);
        AuthResponse authB = (AuthResponse) resB.getBody();
        assertEquals("Beta Corp", authB.companyName());
        assertEquals("beta@corp.com", authB.email());

        // 3. Attempt to register duplicate company name "Alpha Corp" -> MUST FAIL
        RegisterCompanyRequest reqDup = new RegisterCompanyRequest("alpha corp", "admin2", "dupPass");
        ResponseEntity<?> resDup = authController.registerCompany(reqDup);
        assertEquals(400, resDup.getStatusCode().value(), "Duplicate company name must be rejected");
        assertTrue(resDup.getBody() != null && (resDup.getBody().toString().toLowerCase().contains("already") || resDup.getBody().toString().toLowerCase().contains("use")), "Actual body was: " + resDup.getBody());

        // 4. Authenticate as Company A's admin using EMAIL
        ResponseEntity<?> loginResAEmail = authController.login(new LoginRequest("alpha@corp.com", "alphaSecret123"));
        assertEquals(200, loginResAEmail.getStatusCode().value(), "Admin can log in using registered email");
        AuthResponse loginAuthAEmail = (AuthResponse) loginResAEmail.getBody();
        assertEquals("Alpha Corp", loginAuthAEmail.companyName());

        // 5. Authenticate as Company A's admin using USERNAME
        ResponseEntity<?> loginResA = authController.login(new LoginRequest("admin", "alphaSecret123"));
        assertEquals(200, loginResA.getStatusCode().value());
        AuthResponse loginAuthA = (AuthResponse) loginResA.getBody();
        assertEquals("Alpha Corp", loginAuthA.companyName());

        // 6. Authenticate as Company B's admin using EMAIL
        ResponseEntity<?> loginResBEmail = authController.login(new LoginRequest("beta@corp.com", "betaSecret456"));
        assertEquals(200, loginResBEmail.getStatusCode().value(), "Admin can log in using registered email");
        AuthResponse loginAuthBEmail = (AuthResponse) loginResBEmail.getBody();
        assertEquals("Beta Corp", loginAuthBEmail.companyName());

        // 7. Register employee with username "john" in Company A (No email needed for employee)
        RegisterEmployeeRequest empReqA = new RegisterEmployeeRequest(
                authA.companyCode(), null, "John Doe", "john", "empPass1", "Color"
        );
        ResponseEntity<?> empResA = authController.registerEmployee(empReqA);
        assertEquals(200, empResA.getStatusCode().value());
        AuthResponse empAuthA = (AuthResponse) empResA.getBody();

        // 8. Register SECOND employee with SAME name "john" in Company A -> MUST SUCCEED with distinct ID!
        RegisterEmployeeRequest empReqA2 = new RegisterEmployeeRequest(
                authA.companyCode(), null, "John Doe", "john", "empPass2", "Drying"
        );
        ResponseEntity<?> empResA2 = authController.registerEmployee(empReqA2);
        assertEquals(200, empResA2.getStatusCode().value(), "Same name allowed with distinct ID number");
        AuthResponse empAuthA2 = (AuthResponse) empResA2.getBody();
        assertNotEquals(empAuthA.userId(), empAuthA2.userId(), "Each employee has a distinct unique ID");

        // 9. Register employee with SAME username "john" in Company B -> MUST SUCCEED
        RegisterEmployeeRequest empReqB = new RegisterEmployeeRequest(
                authB.companyCode(), null, "John Beta", "john", "empPass3", "Roll"
        );
        ResponseEntity<?> empResB = authController.registerEmployee(empReqB);
        assertEquals(200, empResB.getStatusCode().value());
    }
}
