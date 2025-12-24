# Project Context: KYC Automation

## Overview
**kyc-automation** is a Spring Boot application designed to automate Know Your Customer (KYC) processes. It provides a RESTful API for managing customer data, secured with JWT authentication and documented via Swagger UI. The project uses a PostgreSQL database for persistence.

## Technology Stack
*   **Language:** Java 21
*   **Framework:** Spring Boot 4.0.1
*   **Build Tool:** Gradle
*   **Database:** PostgreSQL 16+ (Dockerized or Local)
*   **Security:** Spring Security, JWT (via `jjwt` 0.12.6)
*   **Documentation:** SpringDoc OpenAPI (Swagger UI)
*   **Utilities:** Lombok

## Project Structure
*   `src/main/java/com/kyc/automation`: Main source code.
    *   `config/`: Configuration classes (`ApplicationConfig`, `DataSeeder`, `OpenApiConfig`).
    *   `controller/`: REST Controllers (`AuthenticationController`, `CustomerController`, `HomeController`).
    *   `dto/`: Data Transfer Objects (Requests/Responses).
    *   `entity/`: JPA Entities (`Customer`, `User`, `Role`).
    *   `repository/`: Spring Data JPA Repositories.
    *   `security/`: Security configuration and filters (`JwtAuthenticationFilter`, `SecurityConfig`, `JwtService`).
    *   `service/`: Business logic (`AuthenticationService`).
*   `src/main/resources`:
    *   `application.properties`: Main configuration file.
*   `docker-compose.yml`: Docker configuration for the PostgreSQL database.

## Setup & Running

### Prerequisites
*   Java JDK 21
*   Docker (optional, for DB) or Local PostgreSQL instance

### Database Setup
The application requires a PostgreSQL database named `kycdb`.
**Option 1: Docker (Recommended)**
```bash
docker-compose up -d
```
**Option 2: Local PostgreSQL**
Ensure a local instance is running on port 5432 and create the database:
```sql
CREATE DATABASE kycdb;
```

### Build & Run
**Windows (PowerShell):**
```powershell
# Set JAVA_HOME if necessary (example path)
$env:JAVA_HOME='C:\Users\AmangLy\.jdks\ms-21.0.9'

# Build
./gradlew clean build

# Run
./gradlew bootRun
```

## Key Endpoints

*   **Swagger UI:** `http://localhost:8080/swagger-ui.html` (or `http://localhost:8080/` which redirects)
*   **API Docs:** `http://localhost:8080/api-docs`
*   **H2 Console (Disabled/Replaced):** Replaced by PostgreSQL.

### Authentication
*   **Register:** `POST /api/auth/register`
*   **Login:** `POST /api/auth/authenticate`
    *   Returns a JWT `token`.
    *   Use this token in the Swagger UI "Authorize" button or HTTP Header: `Authorization: Bearer <token>`.

### Default Credentials (Seeded)
*   **Admin User:**
    *   Username: `admin`
    *   Password: `admin123`

## Development Notes
*   **Data Seeding:** `DataSeeder.java` automatically seeds 5 sample customers and the admin user if the database is empty on startup.
*   **Security:** The application uses a stateless session policy. `SecurityConfig` and `ApplicationConfig` handle the security bean wiring to avoid circular dependencies.
*   **Circular Dependencies:** Be mindful of injecting `SecurityConfig` into beans that `SecurityConfig` depends on (like filters). Use `ApplicationConfig` for shared beans.
