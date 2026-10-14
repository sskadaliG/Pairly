# pairly

A Tinder-inspired dating application built from scratch to demonstrate full-stack development skills, including user authentication, profile management, swipe-based matching, real-time messaging, and REST APIs.

## API Endpoints

Base URL: `http://localhost:3000`

Routes marked 🔒 require login. After `POST /login`, the server sets a `token` cookie (JWT, valid for 1 hour) that is sent automatically with later requests.

### Auth

| Method | Endpoint           | Auth | Description                                          |
| ------ | ------------------ | ---- | ---------------------------------------------------- |
| POST   | `/signup`          |      | Create a new account                                 |
| POST   | `/login`           |      | Log in and receive the `token` cookie                |
| POST   | `/logout`          |      | Log out by clearing the `token` cookie               |
| POST   | `/forgot-password` |      | Request a password reset link (valid for 15 minutes) |
| POST   | `/reset-password`  |      | Set a new password using the reset token             |

**Request bodies**

- `POST /signup`: `firstName`, `lastName`, `email`, `password`, `gender` (`Male`, `Female` or `Other`) are required. Optional: `age`, `phoneNumber`, `address`, `city`, `state`, `zipCode`, `country`, `photoURL`, `bio`, `interests`.
- `POST /login`: `{ "email": "...", "password": "..." }`
- `POST /forgot-password`: `{ "email": "..." }`. The response is the same whether or not the email is registered.
- `POST /reset-password`: `{ "resetToken": "...", "newPassword": "..." }`

Passwords must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a symbol.

### Profile

| Method | Endpoint        | Auth | Description                         |
| ------ | --------------- | ---- | ----------------------------------- |
| GET    | `/profile/view` | 🔒   | Get the logged-in user's profile    |
| PATCH  | `/profile/edit` | 🔒   | Update the logged-in user's profile |
| PATCH  | `/profile/password` | 🔒   | Change the logged-in user's password |

**Request body**

- `PATCH /profile/edit`: any of `firstName`, `lastName`, `age`, `gender`, `phoneNumber`, `address`, `city`, `state`, `zipCode`, `country`, `photoURL`, `bio`, `interests`. Any other field is rejected with `400`. Use `/profile/password` to change the password.
- `PATCH /profile/password`: `{ "currentPassword": "...", "newPassword": "..." }`

### Connection Requests

| Method | Endpoint                             | Auth | Description                                                                   |
| ------ | ------------------------------------ | ---- | ----------------------------------------------------------------------------- |
| POST   | `/request/send/:status/:userId`      | 🔒   | Send a request to another user. `status` is `interested` or `not_interested`  |
| POST   | `/request/review/:status/:requestId` | 🔒   | Accept or reject a request you received. `status` is `accepted` or `rejected` |

### User

| Method | Endpoint                  | Auth | Description                                                  |
| ------ | ------------------------- | ---- | ------------------------------------------------------------ |
| GET    | `/user/requests/received` | 🔒   | Get pending `interested` requests sent to the logged-in user |
| GET    | `/user/connections`       | 🔒   | Get the logged-in user's accepted connections                |
| GET    | `/feed`                   | 🔒   | Get users the logged-in user has not interacted with yet     |

**Query parameters**

- `GET /feed`: `page` (default `1`) and `limit` (default `10`, max `50`). Example: `/feed?page=2&limit=10`. Excludes the logged-in user and anyone they have already sent a request to or received a request from.
