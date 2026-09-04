# ========================================================
# Full-Stack Single Container Build for Render & Docker
# Builds React frontend, embeds into Spring Boot, and runs on 1 port
# ========================================================

# ---- Stage 1: Build React Frontend ----
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend

# Install dependencies first for Docker caching
COPY stevforms/package*.json ./
RUN npm ci

# Copy frontend source and build production bundle
COPY stevforms/ ./
RUN npm run build

# ---- Stage 2: Build Spring Boot Backend with Frontend Assets ----
FROM maven:3.9.9-eclipse-temurin-21-alpine AS backend-builder
WORKDIR /backend

# Cache Maven dependencies
COPY steveForms/pom.xml ./
RUN mvn dependency:go-offline -B || true

# Copy Java backend source
COPY steveForms/src ./src

# Copy built React assets directly into Spring Boot static resources folder
RUN mkdir -p ./src/main/resources/static
COPY --from=frontend-builder /frontend/dist/ ./src/main/resources/static/

# Build executable fat JAR
RUN mvn clean package -DskipTests -B

# ---- Stage 3: Lightweight Production JRE Runtime ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create directory for persistent database storage (H2 database in ./data/)
RUN mkdir -p /app/data

# Copy packaged JAR from backend builder stage
COPY --from=backend-builder /backend/target/*.jar app.jar

# Render dynamically sets $PORT (defaults to 8080 locally)
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
