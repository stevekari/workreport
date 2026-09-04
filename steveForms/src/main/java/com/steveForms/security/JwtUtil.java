package com.steveForms.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

	@Value("${jwt.secret}")
	private String secret;

	@Value("${jwt.expiration-ms}")
	private long expirationMs;

	private Key key() {
		return Keys.hmacShaKeyFor(secret.getBytes());
	}

	// token stores userId, username and role
	public String generateToken(Long userId, String username, String role) {
		return Jwts.builder().setSubject(username).claim("userId", userId).claim("role", role).setIssuedAt(new Date())
				.setExpiration(new Date(System.currentTimeMillis() + expirationMs))
				.signWith(key(), SignatureAlgorithm.HS256).compact();
	}

	public Claims parseToken(String token) {
		return Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token).getBody();
	}

	public boolean isValid(String token) {
		try {
			parseToken(token);
			return true;
		} catch (JwtException | IllegalArgumentException e) {
			return false;
		}
	}

	public Long extractUserId(String token) {
		try {
			Claims claims = parseToken(token);
			return extractUserId(claims);
		} catch (Exception e) {
			return null;
		}
	}

	public Long extractUserId(Claims claims) {
		if (claims == null) return null;
		Object val = claims.get("userId");
		if (val == null) return null;
		if (val instanceof Number) {
			return ((Number) val).longValue();
		}
		try {
			return Long.parseLong(val.toString().trim());
		} catch (Exception e) {
			return null;
		}
	}

	public String extractRole(Claims claims) {
		if (claims == null) return null;
		Object val = claims.get("role");
		return val != null ? val.toString() : null;
	}
}