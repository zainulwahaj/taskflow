# TaskFlow

A production-style MERN stack Trello-style project and task manager.

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS, React Hook Form, Zod, Axios
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt
- **Auth:** JWT access + refresh tokens (refresh in httpOnly cookie)

## Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

## MongoDB local setup (macOS)

**Option A – Homebrew (recommended)**

1. Install MongoDB Community:
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```
2. Start MongoDB (runs in the foreground; use a separate terminal for the app):
   ```bash
   brew services start mongodb-community
   ```
   Or run once in the foreground:
   ```bash
   mongod --config /opt/homebrew/etc/mongod.conf
   ```
3. Default port is `27017`. Your app uses the database name `taskflow`, so set in `server/.env`:
   ```
   MONGO_URI=mongodb://localhost:27017/taskflow
   ```
4. Optional: install MongoDB Compass (GUI) to browse data:
   ```bash
   brew install --cask mongodb-compass
   ```

**Option B – Docker**

```bash
docker run -d --name mongodb -p 27017:27017 mongo:7
```

Use the same `MONGO_URI` as above. To stop: `docker stop mongodb`. To start again: `docker start mongodb`.

**Verify**

- With the server running, you should see a successful MongoDB connection in the logs.
- Or connect with the MongoDB shell: `mongosh` then `use taskflow` and `show collections` after using the app or seed script.

## Setup

### 1. Clone and install

```bash
cd eman
```

### 2. Server

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` and set:

- `PORT` – e.g. 5000 (on macOS, if you see “address already in use”, try `PORT=5001`; port 5000 is sometimes used by AirPlay Receiver)
- `MONGO_URI` – e.g. `mongodb://localhost:27017/taskflow`
- `JWT_ACCESS_SECRET` – long random string (min 32 chars)
- `JWT_REFRESH_SECRET` – long random string (min 32 chars)
- `CLIENT_URL` – e.g. `http://localhost:5173`

Start the server:

```bash
npm run dev
```

### 3. Client

```bash
cd client
npm install
cp .env.example .env
```

Edit `client/.env` and set:

- `VITE_API_URL` – e.g. `http://localhost:5000/api`

Start the client:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Phase 1 – Auth

- **Register** at `/register`
- **Login** at `/login`
- **Dashboard** at `/dashboard` (protected)
- **Logout** via API; refresh token in httpOnly cookie
- **Profile** API: `GET /api/users/profile`, `PATCH /api/users/profile`

## Phase 2 – Boards and dashboard

- **Dashboard** at `/dashboard`: recent boards, starred, shared with me, pending invitations
- **Board** at `/boards/:boardId`: board header, star, edit, invite (lists/cards in Phase 3)
- **Create/Edit board**: title, description, background color, visibility (private/workspace)
- **Invite** by email (admin/owner); accept/decline from dashboard
- **Sidebar**: board list, create board; **Navbar**: user menu, logout

## Phase 3 – Lists and cards

- **Board** at `/boards/:boardId`: horizontal lists with cards; drag-and-drop to reorder lists and move/reorder cards (@dnd-kit).
- **Lists**: create, rename, delete list; add cards to a list.
- **Cards**: create from list; click to open **Card detail modal** (title, description, due date, priority, completed, assign members, labels, checklist); drag between lists; delete card.
- **Assign members** from board members; **due date**, **priority** (low/medium/high), **labels**, **checklist** with add/toggle/remove.

## Phase 4 – Comments, activity, search and polish

- **Comments**: Add, edit (author only), delete (author only) comments on a card; shown in card detail modal.
- **Activity**: Board and card activity (board created, list created, card created/moved, comment) in card modal and via API.
- **Search and filter**: On board page, search cards by title; filter by assignee, due date, priority, label, completion status; results open card modal.
- **Toasts**: Success/error toasts for card save and comment add.
- **Seed script**: Sample users, boards, lists, cards, comments. Run from server: `npm run seed`. Log in with `alice@example.com` or `bob@example.com` (password: `password123`).

## API (Phase 1 + 2 + 3 + 4)

| Method | Path | Description | Auth |
|--------|------|--------------|------|
| POST | /api/auth/register | Register | no |
| POST | /api/auth/login | Login | no |
| POST | /api/auth/logout | Logout | yes |
| POST | /api/auth/refresh | Refresh tokens | cookie |
| GET | /api/users/profile | Get profile | yes |
| PATCH | /api/users/profile | Update profile | yes |
| GET | /api/boards | List my boards (recent, starred, shared) | yes |
| POST | /api/boards | Create board | yes |
| GET | /api/boards/:id | Get board | yes + member |
| PATCH | /api/boards/:id | Update board | yes + member |
| DELETE | /api/boards/:id | Delete board | yes + owner |
| POST | /api/boards/:id/star | Star board | yes + member |
| DELETE | /api/boards/:id/star | Unstar board | yes + member |
| GET | /api/boards/:id/members | List members | yes + member |
| POST | /api/boards/:id/members/invite | Invite by email | yes + admin/owner |
| PATCH | /api/boards/:id/members/:userId | Update member role | yes + admin/owner |
| DELETE | /api/boards/:id/members/:userId | Remove member | yes + admin/owner or self |
| POST | /api/boards/:id/invitations/:invId/accept | Accept invite | yes |
| POST | /api/boards/:id/invitations/:invId/decline | Decline invite | yes |
| GET | /api/invitations/me | List my pending invitations | yes |
| GET | /api/boards/:id/lists | List lists with cards | yes + member |
| POST | /api/boards/:id/lists | Create list | yes + member |
| POST | /api/boards/:id/lists/reorder | Reorder lists (body: listIds) | yes + member |
| PATCH | /api/lists/:id | Update list (title, order) | yes + member |
| DELETE | /api/lists/:id | Delete list | yes + member |
| POST | /api/lists/:id/cards | Create card | yes + member |
| GET | /api/cards/:id | Get card | yes + member |
| PATCH | /api/cards/:id | Update card (incl. listId, order, assign, due, priority, labels, checklist) | yes + member |
| DELETE | /api/cards/:id | Delete card | yes + member |
| GET | /api/cards/:id/members | List board members (for assign) | yes + member |
| GET | /api/cards/:id/comments | List comments | yes + member |
| POST | /api/cards/:id/comments | Add comment | yes + member |
| PATCH | /api/cards/:id/comments/:commentId | Edit comment (author only) | yes |
| DELETE | /api/cards/:id/comments/:commentId | Delete comment (author only) | yes |
| GET | /api/boards/:id/activity | Board activity feed | yes + member |
| GET | /api/cards/:id/activity | Card activity | yes + member |
| GET | /api/boards/:id/cards/search | Search/filter cards (q, assignee, dueDate, priority, label, completed) | yes + member |

## Seed data

From the `server` directory, with MongoDB running and `.env` configured:

```bash
npm run seed
```

Creates users **alice@example.com** and **bob@example.com** (password: **password123**), sample boards, lists, cards, and a comment. Skips if seed data already exists.

## Project structure

```
eman/
├── client/          # React + Vite frontend
├── server/          # Express API
│   └── scripts/
│       └── seed.js  # Seed sample data
├── .gitignore
└── README.md
```
