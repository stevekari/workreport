package com.steveForms.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.steveForms.dto.MessageDtos.AddCommentRequest;
import com.steveForms.dto.MessageDtos.CommentResponse;
import com.steveForms.dto.MessageDtos.LikeResponse;
import com.steveForms.dto.MessageDtos.MessageResponse;
import com.steveForms.dto.MessageDtos.SendMessageRequest;
import com.steveForms.dto.MessageDtos.UpdateMessageStatusRequest;
import com.steveForms.model.Message;
import com.steveForms.model.MessageComment;
import com.steveForms.model.Role;
import com.steveForms.model.User;
import com.steveForms.repository.MessageRepository;
import com.steveForms.repository.UserRepository;
import com.steveForms.security.JwtUtil;

import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*", maxAge = 3600)
@Transactional
public class MessageController {

    private final MessageRepository messageRepo;
    private final UserRepository userRepo;
    private final JwtUtil jwtUtil;
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public MessageController(MessageRepository messageRepo, UserRepository userRepo, JwtUtil jwtUtil) {
        this.messageRepo = messageRepo;
        this.userRepo = userRepo;
        this.jwtUtil = jwtUtil;
    }

    // GET /api/messages - List announcements, meetings, and messages for current company
    @GetMapping
    public ResponseEntity<?> listMessages(HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        List<Message> messages = messageRepo.findByCompanyOrderByCreatedAtDesc(user.getCompany());
        List<MessageResponse> responses = messages.stream().map(m -> toResponse(m, user)).toList();
        return ResponseEntity.ok(responses);
    }

    // POST /api/messages - Send a group announcement, meeting notice, note, or shortage alert
    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody SendMessageRequest req, HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        if (req == null || ((req.content() == null || req.content().trim().isEmpty())
                && (req.itemNeeded() == null || req.itemNeeded().trim().isEmpty())
                && (req.title() == null || req.title().trim().isEmpty()))) {
            return ResponseEntity.badRequest().body("Please enter your message or announcement content");
        }

        String type = req.type() != null && !req.type().isBlank() ? req.type().trim().toUpperCase() : "NOTE";
        String dept = req.department() != null && !req.department().isBlank()
                ? req.department().trim()
                : (user.getDepartment() != null ? user.getDepartment() : "ALL");

        String title = req.title() != null ? req.title().trim() : null;
        String meetingDate = req.meetingDate() != null ? req.meetingDate().trim() : null;
        String item = req.itemNeeded() != null ? req.itemNeeded().trim() : "";
        String content = req.content() != null && !req.content().isBlank()
                ? req.content().trim()
                : (!item.isEmpty() ? "Lack of " + item : (title != null ? title : "Notice"));

        Message message = new Message(
                user.getCompany(),
                user,
                title,
                dept,
                type,
                meetingDate,
                item,
                content
        );

        message = messageRepo.save(message);
        return ResponseEntity.ok(toResponse(message, user));
    }

    // POST /api/messages/{id}/like - Toggle like (❤️ / 👍) on announcement/meeting
    @PostMapping("/{id}/like")
    public ResponseEntity<?> toggleLike(@PathVariable Long id, HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Message message = messageRepo.findById(id).orElse(null);
        if (message == null || !message.getCompany().getId().equals(user.getCompany().getId())) {
            return ResponseEntity.status(404).body("Message not found");
        }

        boolean liked = message.toggleLike(user.getId());
        message = messageRepo.save(message);

        return ResponseEntity.ok(new LikeResponse(message.getId(), message.getLikesCount(), liked));
    }

    // POST /api/messages/{id}/comments - Add a reply/comment to an announcement or meeting notice
    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody AddCommentRequest req, HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        if (req == null || req.text() == null || req.text().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Comment text is required");
        }

        Message message = messageRepo.findById(id).orElse(null);
        if (message == null || !message.getCompany().getId().equals(user.getCompany().getId())) {
            return ResponseEntity.status(404).body("Message not found");
        }

        MessageComment comment = new MessageComment(message, user, req.text().trim());
        message.getComments().add(comment);
        messageRepo.save(message);

        String created = comment.getCreatedAt() != null ? comment.getCreatedAt().format(FORMATTER) : "";
        return ResponseEntity.ok(new CommentResponse(
                comment.getId(),
                user.getId(),
                user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getUsername(),
                user.getDisplayId(),
                user.getProfilePicture(),
                comment.getText(),
                created
        ));
    }

    // PUT /api/messages/{id}/status - Admin updates status (SEEN, RESOLVED) or adds reply
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody UpdateMessageStatusRequest req, HttpServletRequest request) {
        User admin = currentUser(request);
        if (admin == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        if (admin.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body("Admins only");
        }

        Message message = messageRepo.findById(id).orElse(null);
        if (message == null || !message.getCompany().getId().equals(admin.getCompany().getId())) {
            return ResponseEntity.status(404).body("Message not found");
        }

        if (req.status() != null && !req.status().isBlank()) {
            message.setStatus(req.status().trim().toUpperCase());
        }
        if (req.adminReply() != null) {
            message.setAdminReply(req.adminReply().trim());
        }

        message = messageRepo.save(message);
        return ResponseEntity.ok(toResponse(message, admin));
    }

    // DELETE /api/messages/{id} - Admin or sender deletes a message
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMessage(@PathVariable Long id, HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Message message = messageRepo.findById(id).orElse(null);
        if (message == null || !message.getCompany().getId().equals(user.getCompany().getId())) {
            return ResponseEntity.status(404).body("Message not found");
        }

        if (user.getRole() != Role.ADMIN && !message.getSender().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body("You can only delete your own messages");
        }

        messageRepo.delete(message);
        return ResponseEntity.noContent().build();
    }

    private MessageResponse toResponse(Message m, User currentUser) {
        String created = m.getCreatedAt() != null ? m.getCreatedAt().format(FORMATTER) : "";
        User s = m.getSender();

        List<CommentResponse> commentList = new ArrayList<>();
        if (m.getComments() != null) {
            for (MessageComment c : m.getComments()) {
                User u = c.getAuthor();
                String cCreated = c.getCreatedAt() != null ? c.getCreatedAt().format(FORMATTER) : "";
                commentList.add(new CommentResponse(
                        c.getId(),
                        u != null ? u.getId() : null,
                        u != null ? (u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getUsername()) : "Unknown",
                        u != null ? u.getDisplayId() : "",
                        u != null ? u.getProfilePicture() : null,
                        c.getText(),
                        cCreated
                ));
            }
        }

        boolean isLiked = currentUser != null && m.isLikedByUser(currentUser.getId());

        return new MessageResponse(
                m.getId(),
                s != null ? s.getId() : null,
                s != null ? (s.getFullName() != null && !s.getFullName().isBlank() ? s.getFullName() : s.getUsername()) : "Unknown",
                s != null ? s.getDisplayId() : "",
                s != null ? s.getProfilePicture() : null,
                m.getTitle(),
                m.getDepartment(),
                m.getType(),
                m.getMeetingDate(),
                m.getItemNeeded(),
                m.getContent(),
                m.getStatus(),
                m.getAdminReply(),
                m.getLikesCount(),
                isLiked,
                commentList,
                created
        );
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
