package com.steveForms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    private String title; // Optional title for announcements/meetings

    @Column(nullable = false)
    private String department; // "ALL" or specific dept ("Color", "Drying", "Roll")

    @Column(nullable = false)
    private String type; // ANNOUNCEMENT, MEETING, SHORTAGE, ISSUE, NOTE

    private String meetingDate; // e.g. "2026-08-28 10:00 AM" or date string

    private String itemNeeded; // for shortage alerts

    @Column(columnDefinition = "CLOB", nullable = false)
    private String content;

    @Column(nullable = false)
    private String status; // ACTIVE, UNREAD, SEEN, RESOLVED

    @Column(columnDefinition = "CLOB")
    private String adminReply;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "message_likes", joinColumns = @JoinColumn(name = "message_id"))
    @Column(name = "user_id")
    private Set<Long> likedUserIds = new HashSet<>();

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("createdAt ASC")
    private List<MessageComment> comments = new ArrayList<>();

    private LocalDateTime createdAt;

    public Message() {
    }

    public Message(Company company, User sender, String title, String department, String type, String meetingDate, String itemNeeded, String content) {
        this.company = company;
        this.sender = sender;
        this.title = title;
        this.department = department != null ? department : "ALL";
        this.type = type != null ? type : "NOTE";
        this.meetingDate = meetingDate;
        this.itemNeeded = itemNeeded;
        this.content = content;
        this.status = "ACTIVE";
        this.createdAt = LocalDateTime.now();
    }

    public Message(Company company, User sender, String department, String type, String itemNeeded, String content) {
        this(company, sender, null, department, type, null, itemNeeded, content);
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "ACTIVE";
        }
        if (this.department == null) {
            this.department = "ALL";
        }
    }

    public boolean toggleLike(Long userId) {
        if (userId == null) return false;
        if (likedUserIds.contains(userId)) {
            likedUserIds.remove(userId);
            return false;
        } else {
            likedUserIds.add(userId);
            return true;
        }
    }

    public int getLikesCount() {
        return likedUserIds.size();
    }

    public boolean isLikedByUser(Long userId) {
        return userId != null && likedUserIds.contains(userId);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMeetingDate() {
        return meetingDate;
    }

    public void setMeetingDate(String meetingDate) {
        this.meetingDate = meetingDate;
    }

    public String getItemNeeded() {
        return itemNeeded;
    }

    public void setItemNeeded(String itemNeeded) {
        this.itemNeeded = itemNeeded;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAdminReply() {
        return adminReply;
    }

    public void setAdminReply(String adminReply) {
        this.adminReply = adminReply;
    }

    public Set<Long> getLikedUserIds() {
        return likedUserIds;
    }

    public void setLikedUserIds(Set<Long> likedUserIds) {
        this.likedUserIds = likedUserIds;
    }

    public List<MessageComment> getComments() {
        return comments;
    }

    public void setComments(List<MessageComment> comments) {
        this.comments = comments;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
