# pairly

A Tinder-inspired dating application built from scratch to demonstrate full-stack development skills, including user authentication, profile management, swipe-based matching, real-time messaging, and REST APIs.

This is the backend: an Express REST API with a Socket.IO server for live chat, backed by MongoDB. The React frontend lives in the separate `Pairly Web` project.

## Tech stack

- [Express 5](https://expressjs.com) for the REST API
- [MongoDB](https://www.mongodb.com) with [Mongoose](https://mongoosejs.com)
- [Socket.IO](https://socket.io) for live chat
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) and [bcrypt](https://github.com/kelektiv/node.bcrypt.js) for login and password hashing
- [validator](https://github.com/validatorjs/validator.js) for input checks
- [helmet](https://helmetjs.github.io), [express-rate-limit](https://express-rate-limit.mintlify.app) and [compression](https://github.com/expressjs/compression)
- [nodemon](https://nodemon.io) for development (installed globally: `npm install -g nodemon`)

## Getting started

Requires [Node.js](https://nodejs.org) (current LTS) and a MongoDB database.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root (it's git-ignored, never commit it):

   ```
   DB_CONNECTION_STRING=<your MongoDB connection string>
   JWT_SECRET=<a long random string>
   ```

3. Start the server:

   ```bash
   npm run dev
   ```

The API and the Socket.IO server both run on http://localhost:3000. CORS allows the frontend at `http://localhost:5173`, with credentials, so the login cookie is sent.

## Scripts

| Command       | Description                           |
| ------------- | ------------------------------------- |
| `npm run dev` | Start with nodemon (restarts on save) |
| `npm start`   | Start with node                       |

## Project structure

```
src/
├── app.js                    # Express app, middleware, routes; starts the HTTP + Socket.IO server
├── config/
│   └── database.js           # MongoDB connection
├── middlewares/
│   ├── auth.js               # userAuth for routes, getUserFromToken shared with the socket
│   └── rateLimiter.js        # Login, signup and forgot password limits
├── models/
│   ├── user.js               # User, password hashing helpers, JWT and reset tokens
│   ├── connectionRequest.js  # Requests between two users and their status
│   └── message.js            # Chat messages
├── routes/
│   ├── authRouter.js         # Signup, login, logout, forgot and reset password
│   ├── profile.js            # View and edit profile, change password
│   ├── request.js            # Send and review connection requests
│   ├── user.js               # Received requests, connections, feed
│   └── chat.js               # Chat history
└── utils/
    ├── socket.js             # Socket.IO: login check, rooms, sendMessage
    ├── validateSignUpData.js # Signup checks
    └── isValidToUpdate.js    # Allowed profile edit fields
```

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

| Method | Endpoint            | Auth | Description                          |
| ------ | ------------------- | ---- | ------------------------------------ |
| GET    | `/profile/view`     | 🔒   | Get the logged-in user's profile     |
| PATCH  | `/profile/edit`     | 🔒   | Update the logged-in user's profile  |
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

### Chat

| Method | Endpoint        | Auth | Description                                                             |
| ------ | --------------- | ---- | ----------------------------------------------------------------------- |
| GET    | `/chat/:userId` | 🔒   | Get the other user and your latest 100 messages with them, oldest first |

Only connections can chat. Returns `400` for an invalid ID, `404` if the user doesn't exist, and `403` if you aren't connected.

## Live chat (Socket.IO)

The Socket.IO server shares port 3000 with the API.

- **Login check:** before accepting a connection, the server reads the `token` cookie and checks it with the same `getUserFromToken` as the API. Without a valid login, the connection is refused with `Please login again`.
- **Rooms:** each connection joins a room named after its user ID, so a user with several tabs or devices receives every message in all of them.

| Direction        | Event         | Data                 | Description                                                                                              |
| ---------------- | ------------- | -------------------- | -------------------------------------------------------------------------------------------------------- |
| Client → server  | `sendMessage` | `{ toUserId, text }` | Send a message. Reply via callback: `{ ok: true }` or `{ ok: false, error }`. Text is 1–1000 characters. |
| Server → clients | `newMessage`  | The saved message    | Sent to both the sender's and the receiver's rooms                                                       |

A message is only sent between connections, and it's saved before it's delivered.

## Security

- **Passwords** are hashed with bcrypt and never returned by the API.
- **Login cookie:** the JWT is stored in an `httpOnly` cookie, so page scripts can't read it.
- **Sessions end on a password change:** changing or resetting a password sets `passwordChangedAt`, and tokens issued before it are rejected, on both the API and the socket. Changing your password keeps your current session logged in with a new cookie.
- **Rate limits:** login allows 5 attempts per 15 minutes, signup 5 per hour, and forgot password 3 per hour, per IP address.
- **Input checks:** emails are trimmed and lowercased, and values are type-checked before they reach the database, bcrypt or crypto, which also blocks NoSQL injection like `{ "$ne": null }`.
- **Login and forgot password don't reveal accounts:** login says "Invalid credentials" whether the email or the password is wrong, and forgot password gives the same reply for unknown emails. (Signup does say "Email already registered", which most apps accept; the signup rate limit slows down anyone checking many emails.)
- **Reset tokens** are random, stored only as a SHA-256 hash, valid for 15 minutes, and single-use.
- **Safe errors:** unexpected errors return a generic `500` message; details are only logged on the server.
- **helmet** adds standard security headers.

## Performance

- **Indexes:** connection requests are indexed by `fromUserId + toUserId` (also unique) and by `toUserId + status`, for the "sent to me" queries. Messages are indexed by sender, receiver and time.
- **Lean queries:** read-only routes use `.lean()`, which returns plain objects instead of full Mongoose documents.
- **Compression:** responses over 1 kB are gzipped.
- **Chat history** is limited to the latest 100 messages.

## Next steps

- Send password reset links by email (they're only logged to the terminal for now)
- Deployment: environment-based CORS origin and frontend URL, `secure` / `sameSite` cookie settings, and CSRF protection
- Photo upload
- Load older chat messages on scroll
