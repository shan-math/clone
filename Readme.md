# Chat app

This project includes both the frontend, built with React, and the backend, built with Spring Boot.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)


## Features

- Real-time chat functionality.
- User authentication and registration.
- Group chat creation.
- Sending text messages, documents and media.
- User profile management.
- Message timestamps and read receipts.

## Technologies Used

- Frontend:

  - React
  - Redux for state management
  - Material-UI for UI components
  - WebSocket for real-time messaging
  - Tailwind CSS

- Backend:
  - Spring Boot
  - Spring Security for authentication
  - Spring Data JPA for data persistence
  - WebSocket for real-time messaging
  - MySQL for database storage


### Installation

1. Clone the repository.

2. Install frontend dependencies.

3. Navigate to the backend directory.

4. Open the application.properties file and configure your database settings and JWT secret.

spring.datasource.url=jdbc:mysql://localhost:3306/whatsapp
spring.datasource.username=root
spring.datasource.password=password
...
jwt.secret=your-secret-key

5. Build and run the backend:

./mvnw spring-boot:run


