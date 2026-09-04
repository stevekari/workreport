package com.steveForms.dto;

import java.util.List;

public class MessageDtos {

    public record SendMessageRequest(
            String title,
            String department,
            String type, // ANNOUNCEMENT, MEETING, SHORTAGE, ISSUE, NOTE
            String meetingDate, // optional e.g. "2026-08-28 10:00 AM"
            String itemNeeded,
            String content
    ) {
        public SendMessageRequest(String department, String type, String itemNeeded, String content) {
            this(null, department, type, null, itemNeeded, content);
        }
    }

    public record AddCommentRequest(String text) {}

    public record CommentResponse(
            Long id,
            Long authorId,
            String authorName,
            String authorDisplayId,
            String authorProfilePicture,
            String text,
            String createdAt
    ) {}

    public record LikeResponse(
            Long messageId,
            int likesCount,
            boolean likedByMe
    ) {}

    public record UpdateMessageStatusRequest(
            String status,
            String adminReply
    ) {}

    public record MessageResponse(
            Long id,
            Long senderId,
            String senderName,
            String senderDisplayId,
            String senderProfilePicture,
            String title,
            String department,
            String type,
            String meetingDate,
            String itemNeeded,
            String content,
            String status,
            String adminReply,
            int likesCount,
            boolean likedByMe,
            List<CommentResponse> comments,
            String createdAt
    ) {}
}
