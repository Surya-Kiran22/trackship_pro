# Stage 1: Build React Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Spring Boot Backend with embedded frontend
FROM maven:3.9.6-eclipse-temurin-21 AS backend-builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static
RUN mvn clean package -DskipTests

# Stage 3: Final Runtime Image
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend-builder /app/target/*.jar app.jar
EXPOSE 1022
ENTRYPOINT ["java", "-jar", "app.jar"]
