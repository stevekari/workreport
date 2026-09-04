package com.steveForms;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.annotation.DirtiesContext;

import com.steveForms.controller.AuthController;
import com.steveForms.controller.MessageController;
import com.steveForms.dto.AuthDtos.AuthResponse;
import com.steveForms.dto.AuthDtos.RegisterCompanyRequest;
import com.steveForms.dto.AuthDtos.RegisterEmployeeRequest;
import com.steveForms.dto.MessageDtos.AddCommentRequest;
import com.steveForms.dto.MessageDtos.CommentResponse;
import com.steveForms.dto.MessageDtos.LikeResponse;
import com.steveForms.dto.MessageDtos.MessageResponse;
import com.steveForms.dto.MessageDtos.SendMessageRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class MessageAndMeetingTest {

    @Autowired
    private AuthController authController;

    @Autowired
    private MessageController messageController;

    @Test
    void testMeetingAnnouncementsLikesAndComments() {
        // 1. Register Company & Admin
        RegisterCompanyRequest compReq = new RegisterCompanyRequest("Acme Industries", "admin1", "adminSecret123");
        ResponseEntity<?> compRes = authController.registerCompany(compReq);
        assertEquals(200, compRes.getStatusCode().value());
        AuthResponse adminAuth = (AuthResponse) compRes.getBody();

        // 2. Register a Member / Worker
        RegisterEmployeeRequest empReq = new RegisterEmployeeRequest(
                adminAuth.companyCode(), null, "Maria Rossi", "maria", "maria123", "Color"
        );
        ResponseEntity<?> empRes = authController.registerEmployee(empReq);
        assertEquals(200, empRes.getStatusCode().value());
        AuthResponse workerAuth = (AuthResponse) empRes.getBody();

        // 3. Admin posts a Meeting Announcement for all members
        MockHttpServletRequest adminReq = new MockHttpServletRequest();
        adminReq.addHeader("Authorization", "Bearer " + adminAuth.token());
        adminReq.setAttribute("userId", adminAuth.userId());

        SendMessageRequest meetingReq = new SendMessageRequest(
                "Quarterly Strategy & Safety Meeting",
                "ALL",
                "MEETING",
                "2026-08-28 10:00 AM",
                null,
                "Please attend the team meeting in the main hall."
        );
        ResponseEntity<?> postRes = messageController.sendMessage(meetingReq, adminReq);
        assertEquals(200, postRes.getStatusCode().value());
        MessageResponse createdMsg = (MessageResponse) postRes.getBody();
        assertNotNull(createdMsg);
        assertEquals("Quarterly Strategy & Safety Meeting", createdMsg.title());
        assertEquals("2026-08-28 10:00 AM", createdMsg.meetingDate());
        assertEquals("MEETING", createdMsg.type());
        assertEquals(0, createdMsg.likesCount());

        // 4. Worker Maria views the message feed
        MockHttpServletRequest workerReq = new MockHttpServletRequest();
        workerReq.addHeader("Authorization", "Bearer " + workerAuth.token());
        workerReq.setAttribute("userId", workerAuth.userId());

        ResponseEntity<?> listRes = messageController.listMessages(workerReq);
        assertEquals(200, listRes.getStatusCode().value());
        @SuppressWarnings("unchecked")
        List<MessageResponse> list = (List<MessageResponse>) listRes.getBody();
        assertNotNull(list);
        assertFalse(list.isEmpty());

        // 5. Worker Maria Likes the Meeting Notice
        ResponseEntity<?> likeRes = messageController.toggleLike(createdMsg.id(), workerReq);
        assertEquals(200, likeRes.getStatusCode().value());
        LikeResponse likeData = (LikeResponse) likeRes.getBody();
        assertNotNull(likeData);
        assertEquals(1, likeData.likesCount());
        assertTrue(likeData.likedByMe());

        // 6. Worker Maria adds a comment confirming attendance
        AddCommentRequest commentReq = new AddCommentRequest("I will be there on time!");
        ResponseEntity<?> commentRes = messageController.addComment(createdMsg.id(), commentReq, workerReq);
        assertEquals(200, commentRes.getStatusCode().value());
        CommentResponse commentData = (CommentResponse) commentRes.getBody();
        assertNotNull(commentData);
        assertEquals("I will be there on time!", commentData.text());
        assertEquals("Maria Rossi", commentData.authorName());

        // 7. Check that the message in the feed now contains the like and comment
        ResponseEntity<?> feedRes = messageController.listMessages(workerReq);
        @SuppressWarnings("unchecked")
        List<MessageResponse> updatedFeed = (List<MessageResponse>) feedRes.getBody();
        assertNotNull(updatedFeed);
        MessageResponse updated = updatedFeed.get(0);
        assertEquals(1, updated.likesCount());
        assertTrue(updated.likedByMe());
        assertEquals(1, updated.comments().size());
        assertEquals("I will be there on time!", updated.comments().get(0).text());
    }
}

