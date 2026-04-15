# Development Principles

## SOLID Principles

| Principle                       | Requirement                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Single Responsibility Principle | Each module, service, controller, and repository must have one clear reason to change.                                 |
| Open/Closed Principle           | Core quiz, authentication, and persistence logic should be extendable without modifying stable behavior unnecessarily. |
| Liskov Substitution Principle   | Implementations of shared interfaces must remain interchangeable without breaking application behavior.                |
| Interface Segregation Principle | Consumers must depend only on the contracts they actually use.                                                         |
| Dependency Inversion Principle  | Business rules must depend on abstractions rather than concrete frameworks, database drivers, or transport details.    |

## ACID Principles

| Principle   | Requirement                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| Atomicity   | Multi-step writes such as quiz creation, session creation, and answer submission must succeed or fail as a single unit.   |
| Consistency | Every transaction must preserve schema rules, foreign key relationships, uniqueness constraints, and business invariants. |
| Isolation   | Concurrent updates must not corrupt session progress, scoring, or administrative changes.                                 |
| Durability  | Once committed, persisted quiz data, answers, and audit events must survive application restarts or process failures.     |

## Approved Dependencies

| Purpose                                          | Package                      |
| ------------------------------------------------ | ---------------------------- |
| Shared application language                      | `typescript`                 |
| NestJS framework core APIs                       | `@nestjs/common`             |
| NestJS application runtime                       | `@nestjs/core`               |
| HTTP platform adapter                            | `@nestjs/platform-express`   |
| NestJS WebSocket gateway support                 | `@nestjs/websockets`         |
| Socket.IO platform adapter                       | `@nestjs/platform-socket.io` |
| Socket.IO realtime transport                     | `socket.io`                  |
| Environment and configuration management         | `@nestjs/config`             |
| OpenAPI document generation and UI               | `@nestjs/swagger`            |
| JSON Schema-based request validation             | `ajv`                        |
| JSON Schema formats support                      | `ajv-formats`                |
| Shared type contracts and interfaces             | TypeScript interfaces        |
| NestJS reactive primitives                       | `rxjs`                       |
| HTTP cookie parsing                              | `cookie-parser`              |
| Google OAuth token verification                  | `google-auth-library`        |
| JWT signing and verification                     | `@nestjs/jwt`                |
| Decorator metadata required by NestJS decorators | `reflect-metadata`           |
| PostgreSQL driver for Prisma                     | `pg`                         |
| Prisma schema and migration tooling              | `prisma`                     |
| Prisma database client                           | `@prisma/client`             |

## Approved Frontend Dependencies

| Purpose                           | Package                      |
| --------------------------------- | ---------------------------- |
| Shared application language       | `typescript`                 |
| React UI runtime                  | `react`                      |
| React DOM runtime                 | `react-dom`                  |
| React Native mobile runtime       | `react-native`               |
| React Native web runtime          | `react-native-web`           |
| React Native Babel preset         | `@react-native/babel-preset` |
| Vite web build tooling            | `vite`                       |
| Vite React plugin                 | `@vitejs/plugin-react`       |
| Type definitions for React        | `@types/react`               |
| Type definitions for React DOM    | `@types/react-dom`           |
| Type definitions for React Native | `@types/react-native`        |
| Socket.IO realtime transport      | `socket.io-client`           |

# Technical Requirements

## 2.1 Authentication

| ID      | Requirement                                                                                                                                                    |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUTH-01 | Google authentication MUST be optional for end users and REQUIRED only for administrative access.                                                              |
| AUTH-02 | The authentication flow MUST rely on Google-issued identity tokens verified on the backend using `google-auth-library`.                                        |
| AUTH-03 | The backend MUST expose an authentication end point to redirect to Google login and exchange the verified Google identity for an application session with JWT. |
| AUTH-04 | Administrative routes MUST require authenticated access enforced by backend authorization checks.                                                              |
| AUTH-05 | Unauthenticated users MUST be allowed to browse and play quizzes without creating an account.                                                                  |
| AUTH-06 | The system MUST persist a user profile for authenticated users, including Google provider identifiers and audit timestamps.                                    |
| AUTH-07 | The system MUST persist the application session or token state required for revocation and administrative logout workflows.                                    |
| AUTH-08 | Authenticated sessions MUST use signed application JWTs delivered through secure HTTP cookies.                                                                 |
| AUTH-09 | Authentication MUST sign tokens with RSA256                                                                                                                    |

## 2.2 Quiz Discovery And Management

### 2.2.1 Public Quiz Search

| ID      | Requirement                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------ |
| DISC-01 | The client MUST provide a search field for quiz search by title or name.                                     |
| DISC-02 | The backend MUST expose an indexed search endpoint backed by SQL queries for partial title or name matching. |
| DISC-03 | Search results MUST include quizzes that are publicly available to all users.                                |
| DISC-04 | Search responses MUST include at least title, topic, and difficulty metadata.                                |
| DISC-05 | Search endpoints SHOULD support pagination to keep query performance stable as the quiz catalog grows.       |

### 2.2.2 Admin Quiz CRUD

| ID      | Requirement                                                                                               |
| ------- | --------------------------------------------------------------------------------------------------------- |
| QADM-01 | The backend MUST expose protected CRUD endpoints for quizzes and questions.                               |
| QADM-02 | Administrative quiz management MUST support create, edit, save, and delete workflows for quizzes.         |
| QADM-03 | Administrative question management MUST support create, edit, save, and delete workflows for questions.   |
| QADM-04 | Quiz data MUST be validated server-side before persistence.                                               |
| QADM-05 | Question data MUST be validated server-side before persistence.                                           |
| QADM-06 | Administrative mutations MUST be auditable at least at the application level.                             |
| QADM-07 | Saved quizzes MUST be treated as publicly available published content once persisted.                     |
| QADM-08 | Quiz management SHOULD preserve historical quiz and question data where possible when content is updated. |

## 2.3 Quiz Sessions

| ID      | Requirement                                                                                                                               |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| SESS-01 | The system MUST support creating quiz sessions in `solo` mode.                                                                            |
| SESS-02 | The system MUST support creating shareable quiz sessions in `two-player` mode.                                                            |
| SESS-03 | Each shared session MUST generate a unique join code or share link.                                                                       |
| SESS-04 | The backend MUST persist a durable session record for each active session.                                                                |
| SESS-05 | The backend MUST track the participants associated with each session.                                                                     |
| SESS-06 | Active gameplay state MAY be cached in memory, but the authoritative active session record MUST exist in SQL while the session is active. |
| SESS-07 | The system MUST NOT require long-term persistence of ephemeral runtime state after the session ends.                                      |
| SESS-08 | Session creation and participant joins MUST be implemented so duplicate join codes cannot be issued concurrently.                         |
| SESS-09 | Session gameplay MUST use persistent socket connections so clients receive live session updates.                                          |
| SESS-10 | Socket session updates MUST reflect question progression, participant joins, and submitted answers in real time.                          |

## 2.4 Question Model

| ID      | Requirement                                                                                                                  |
| ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| QUES-01 | The initial quiz engine MUST support exactly one question type: autocomplete order selection (AOS).                          |
| QUES-02 | IN AOS each question MUST define an array `options` of ordered words with `label` to identify as `HIDE`, `SHOW` and `EXTRA`. |
| QUES-03 | In AOS The correct order is defined by the consecutive `HIDE` and `SHOW` items inside `options` using `optionOrder`.         |
| QUES-04 | The backend MUST reject unsupported question types during validation or persistence.                                         |
| QUES-05 | The question domain model MUST constrain rendering and grading logic so order evaluation is deterministic.                   |
| QUES-06 | The model MUST contain only `Description`, `options` and `type`                                                              |

## 2.5 Answer Submission And Scoring

| ID     | Requirement                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------- |
| ANS-01 | The client MUST render selectable options for each question and submit the selected order as structured positional data.  |
| ANS-02 | The answer model MUST capture the selected order for each participant and question.                                       |
| ANS-03 | The backend MUST validate the submitted order against the canonical answer order.                                         |
| ANS-04 | The scoring logic MUST support full credit for a fully correct order.                                                     |
| ANS-05 | The scoring logic MAY support zero or partial credit for incorrect answers if partial scoring is enabled.                 |
| ANS-06 | The presentation layer must present Final score, and a Feedback section showing one by one the wrong and correct answers. |
| ANS-07 | The backend MUST broadcast each submitted answer to the other session participant in real time.                           |

## 2.6 Session Progression And Timing

| ID      | Requirement                                                                                                                                                                                                             |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FLOW-01 | The presentation MUST show one question at a time during a session, showing only Question, Complete the Phrase, Word list and Live Feed                                                                                 |
| FLOW-02 | The backend MUST preserve question order within each quiz session.                                                                                                                                                      |
| FLOW-03 | On every question the game mechanic MUST show the incomplete phrase with presenting the `SHOW` words and spaces for the `HIDDEN` words, and list in disorder to fill the spaces between the `HIDDEN` and `EXTRA` WORDS. |
| FLOW-04 | The system MUST advance to the next question only after the current answer has been submitted, showing if the answer was correct or not before continuing.                                                              |
| FLOW-05 | Session progression MUST be controlled server-side using the persisted current question index.                                                                                                                          |
| FLOW-06 | The system MUST record answer timestamps for each player using server-side time.                                                                                                                                        |
| FLOW-07 | The backend MUST determine which player answered first for each question.                                                                                                                                               |
| FLOW-08 | The client MUST display a visual alert when the opponent answers faster.                                                                                                                                                |
| FLOW-09 | Session result payloads MUST include timing-based comparison data for multiplayer sessions.                                                                                                                             |
| FLOW-10 | Real-time socket events MUST notify clients when the current question changes.                                                                                                                                          |
| FLOW-11 | Real-time socket events MUST notify clients when an opponent submits an answer.                                                                                                                                         |

## 2.8 SQL Data Model

| ID      | Requirement                                                                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DATA-01 | The backend MUST persist data in a SQL database using relational tables, primary keys, foreign keys, and transactional consistency.                                |
| DATA-02 | A `User` table MUST store authenticated profile data, Google provider identifiers, roles, and audit timestamps.                                                    |
| DATA-03 | The `User` table MUST use an internal primary key and unique constraints for provider identifier and email where applicable.                                       |
| DATA-04 | A `Quiz` table MUST store title, topic, difficulty, description, and creation or update timestamps.                                                                |
| DATA-05 | The `Quiz` table MUST support indexed lookup by quiz title or name.                                                                                                |
| DATA-06 | A `Question` table MUST belong to exactly one quiz through a foreign key and MUST store an ordinal position within the quiz.                                       |
| DATA-07 | The `Question` table MUST enforce uniqueness of question order within the same quiz.                                                                               |
| DATA-08 | A `QuestionOption` table MUST store one row per selectable option, linked to exactly one question through a foreign key.                                           |
| DATA-09 | The `QuestionOption` table MUST preserve deterministic ordering for rendering and grading and MUST enforce uniqueness of option position within the same question. |
| DATA-10 | A `QuizSession` table MUST store quiz association, mode, join code or share link, session status, current question index, and timing metadata.                     |
| DATA-11 | A `SessionParticipant` table MUST model the session-to-user association, including participant role, join time, and response timing metadata.                      |
| DATA-12 | `SessionParticipant.user_id` MAY be nullable if guest participants are supported.                                                                                  |
| DATA-13 | The `SessionParticipant` table MUST enforce that a participant can appear only once per session.                                                                   |
| DATA-14 | An `Answer` table MUST store one submitted response for one question in one session, including selected order, correctness, score, and answer timestamp.           |
| DATA-15 | Each `Answer` row MUST belong to exactly one quiz session, one participant, and one question through foreign keys.                                                 |
| DATA-16 | If answer order is normalized into child rows, the persisted order MUST remain deterministic for grading.                                                          |
| DATA-17 | An `AuditEvent` table MUST capture append-only administrative actions including actor, action type, target entity, timestamp, and optional metadata.               |
| DATA-18 | `AuditEvent` records SHOULD support relational references to the acting user when available.                                                                       |

## 2.9 Database Constraints And Relational Rules

| ID    | Requirement                                                                                                                                                    |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB-01 | The system MUST use a SQL database engine compatible with Prisma and supporting transactions, indexes, and foreign keys.                                       |
| DB-02 | Every core table MUST have a stable, immutable primary key.                                                                                                    |
| DB-03 | Relationships between quizzes, questions, options, sessions, participants, answers, and audit records MUST be enforced with foreign keys.                      |
| DB-04 | Foreign key policies MUST prevent orphaned rows while preserving required historical data.                                                                     |
| DB-05 | The backend MUST use transactions for multi-step writes affecting quiz creation, quiz updates, session creation, answer submission, or audit logging.          |
| DB-06 | Transaction boundaries MUST be defined in the service layer so each business operation commits completely or rolls back safely.                                |
| DB-07 | Frequently queried fields such as quiz name, join code, session status, and foreign key columns MUST be indexed.                                               |
| DB-08 | The schema MUST treat quizzes as publicly available published records and MUST preserve historical answer and audit records when related quiz data is updated. |
| DB-09 | Referential actions for updates and deletes MUST be explicitly defined across related tables.                                                                  |

## 2.10 API Documentation

| ID     | Requirement                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------------- |
| DOC-01 | The backend MUST expose an OpenAPI 3.0 document describing the public and admin HTTP endpoints.                 |
| DOC-02 | The OpenAPI document SHOULD include request bodies, response shapes, and authentication requirements by route.  |
| DOC-03 | The OpenAPI document SHOULD be served by the backend itself so the contract stays aligned with the API runtime. |

## 2.11 Frontend design

| ID     | Requirement                                                                  |
| ------ | ---------------------------------------------------------------------------- |
| DOC-01 | The presentation layer MUST be simplistic with minimal colors and background |
| DOC-02 | The presentation layer MUST center the attention on words and phrases        |
| DOC-03 | The presentation layer MUST be responsive.                                   |

## 2.12 Presentation requirements - users

| ID     | Requirement                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| DOC-01 | The first path / MUST present only a title and the search quiz component and the Selected question component. |
| DOC-02 | The Search quiz component MUST allow to select qizzes to feed the Selected question component                 |
| DOC-03 | The Selected question component question MUST present only options to Play Solo, Play two-player              |
| DOC-04 | The Selected question component MUST show only name and number of questions                                   |

## 3 Configuration

| ID        | Requirement                                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| CONFIG-01 | The system MUST use the environment variables to load configurations with separation of concerns and interface segregation. |
| CONFIG-02 | The system MUST have fallback values or error handling when configuration is incomplete                                     |

## Initial Tech Stack

- Backend: `NestJS`
- Mobile client: `React Native`
- Shared language: `TypeScript`

## Next Step

Define the quiz abstraction in more detail, including quiz structure, question types, and answer evaluation rules.
