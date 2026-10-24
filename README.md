# SmartResolve AI

A college issue-reporting and resolution platform, built for the ACE Digital 7-day internship assignment.
Students and staff report campus problems. A trained text model suggests the department. Rules set the
priority and pick the staff member. The system suggests similar open tickets. Staff resolve the ticket.
Reporters close or reopen it. Admins manage routing and staff accounts and see live numbers.

**All data in this project is made up (synthetic). No real people or college records are used.**

## Live links

- App: YOUR_CLOUDFLARE_LINK
- API health check: https://smartresolve-api-r7yi.onrender.com/health
- Repository: YOUR_GITHUB_LINK

The free API server sleeps when nobody uses it. The first request can take up to a minute. The app shows a
waiting message and tries again by itself.

## Demo accounts (dummy accounts only)

Password for all accounts: `Demo@12345`

| Role | Email |
|---|---|
| Reporter A | reporter.a@smartresolve.test |
| Reporter B | reporter.b@smartresolve.test |
| IT Support staff | it1@smartresolve.test, it2@smartresolve.test |
| Facilities staff | fac1@smartresolve.test, fac2@smartresolve.test |
| Administration staff | adm1@smartresolve.test, adm2@smartresolve.test |
| Admin | admin@smartresolve.test |

Seeded demo data: 35 fake tickets. Overdue examples include SR-000001, SR-000003 and SR-000013.
Resolved tickets for the reopen demo include SR-000008 (owned by Reporter A).

## Tech stack

- Frontend: React (JavaScript), Tailwind CSS, React Router. Hosted on Cloudflare (free).
- Backend: Node.js, Express (JavaScript, CommonJS). Hosted on Render Free.
- Database: MongoDB Atlas Free (Mongoose).
- Text model and duplicate check: written by hand in JavaScript (no paid AI service, no ML library).
  They run inside the backend.
- Cost: 0 rupees. No paid service is used.

## Folder structure

```
client/            React app
server/src/        API code: models, controllers, routes, middleware, utils
server/src/ml/     dataset, Naive Bayes, duplicate check, training script, saved model and metrics
server/src/seed/   seed scripts for demo users and tickets
server/src/tests/  automated tests
docs/              evidence files and notes
```

## Run it on your computer

Needs Node.js 18 or newer and a free MongoDB Atlas cluster.

```bash
cd server
npm install
# create server/.env using .env.example and fill in the values
npm run seed:users
npm run seed:issues
npm run dev
```

In another terminal:

```bash
cd client
npm install
# create client/.env with: VITE_API_URL=http://localhost:5000
npm run dev
```

Other commands (in `server`): `npm run train` (train and test the model), `npm test` (unit tests).

Warning: `npm run seed:issues` deletes all tickets and starts again. It is a terminal command only. It is
not exposed as a web API.

### Environment variables (see `.env.example`)

- `PORT` - server port
- `MONGODB_URI` - MongoDB Atlas connection link
- `JWT_SECRET` - long random text used to sign login tokens
- `CORS_ORIGINS` - allowed website addresses, separated by commas, no spaces

## Roles and permissions

All permission checks happen on the server. Hiding a button is never the only protection.

- Reporter: create tickets, see only their own tickets, close or reopen their own resolved ticket.
- Department staff: see tickets of their own department, move tickets to In Progress and Resolved,
  suggest a priority. Staff cannot close a ticket.
- Admin: see all tickets, reassign staff with a reason, change priority with a reason, link similar
  tickets with a reason, close in exceptional cases with a reason, create staff accounts, switch staff
  accounts on or off, see analytics for all departments.
- Registration always creates a Reporter. Staff accounts are created only by an admin (or the seed
  script). Admin accounts come only from the seed script.

## How the ticket flow works

1. Reporter submits the form. The server checks every field and saves the ticket as OPEN.
2. The model suggests a department with a confidence number.
3. If confidence is below 0.75, the ticket waits in the admin Routing Queue (Needs Review).
4. If confidence is enough, the ticket goes to the active staff member in that department with the
   fewest ASSIGNED and IN_PROGRESS tickets. A tie goes to the smaller staff ID. Status becomes ASSIGNED.
5. The server also looks for similar open tickets and shows up to 3 as suggestions.
6. Staff starts work (IN_PROGRESS), then resolves with a note of at least 15 characters (RESOLVED).
7. Reporter closes it (CLOSED) or reopens it with a reason (back to IN_PROGRESS).

Allowed moves: OPEN to ASSIGNED, ASSIGNED to IN_PROGRESS, IN_PROGRESS to RESOLVED, RESOLVED to CLOSED,
RESOLVED to IN_PROGRESS (reopen). Admin can close any open ticket with a reason. Other moves are refused
by the API.

Every important action adds one line to an append-only activity log (who, what, before, after, reason,
server time).

## Priority rule (fixed rule, not AI)

- Urgency: LOW = 1, MEDIUM = 2, HIGH = 3
- Impact: 1 to 5 people = 1, 6 to 20 = 2, 21 to 500 = 3
- Score = (2 x urgency) + impact + 5 if a safety hazard is flagged
- P1 if hazard is flagged or score is 11 or more. P2 for 8 to 10. P3 for 5 to 7. P4 for 4 or less.

Note about the brief: without a hazard the highest possible score is 9, so "score 11 or more" can never
happen on its own. We kept the rule as written and did not change it. We suggest asking the organizer.

Deadlines (from the creation time): P1 2h response and 8h resolution, P2 8h and 24h, P3 24h and 72h,
P4 48h and 120h. "Overdue" is worked out when a page loads. No background job is used.

## AI approach

### Department classifier

- Model: Naive Bayes text classifier with lowercase, punctuation removal and stop-word removal.
- Data: 90 made-up examples (30 per department). 60 for training, 30 for testing (10 per department).
  Test sentences use different wording from training sentences.
- Result on the 30 unseen test cases: accuracy 80% (24 of 30).

| Actual \ Predicted | IT Support | Facilities | Administration |
|---|---|---|---|
| IT Support | 9 | 0 | 1 |
| Facilities | 1 | 7 | 2 |
| Administration | 0 | 2 | 8 |

- Precision and recall: IT Support 0.90 and 0.90. Facilities 0.78 and 0.70. Administration 0.73 and 0.80.
- Confidence cut-off: we started at 0.65. An unclear ticket ("Nothing is working in the main office")
  scored 0.67 and was sent to a department. We tested cut-offs from 0.65 to 0.90 on the 30 test cases
  (see `docs/threshold-tuning.txt`) and chose 0.75. We do not claim this number is calibrated, because the
  dataset is small and made up.
- Files: `server/src/ml/metrics.json` and `docs/training-output.txt`. Retrain with `npm run train`.
- The suggestion is always shown as a suggestion, "subject to review". The first suggestion stays in the
  ticket history, even if an admin changes the department.

### Duplicate suggestions

- Method: TF-IDF word scores and cosine similarity between the new ticket and open tickets
  (OPEN, ASSIGNED, IN_PROGRESS) in the same building. A small same-meaning list helps match words like
  "internet", "network" and "wifi".
- Extra checks: the departments must not clash. Same room adds 0.2 to the score. Same department adds 0.1.
- Starting threshold: 0.55 (from the brief). Up to 3 suggestions are shown, each with short reasons.
- Safe summary only: ticket ID, title, building, room, status and score. No reporter name, email or
  description is shown.
- Nothing is ever merged or deleted. Only an admin can link two tickets (with a reason). Both tickets keep
  their own history.
- The room bonus, department bonus and same-meaning list are our own choices. We checked them on three
  hand-made examples only (`server/src/ml/checkDuplicates.js`, `docs/duplicate-tuning.txt`).

## API routes

`POST /auth/register`, `POST /auth/login`, `GET /me`, `POST /issues`, `GET /issues`
(filters: status, priority, department, overdue, queue=routing), `GET /issues/:id`,
`GET /issues/:id/activity`, `PATCH /issues/:id/status`, `PATCH /issues/:id/assignment` (admin),
`PATCH /issues/:id/priority`, `PATCH /issues/:id/duplicates` (admin), `GET /admin/staff` (admin),
`POST /admin/staff` (admin), `PATCH /admin/staff/:id/active` (admin), `GET /admin/analytics` (admin),
`GET /analytics/me`, `GET /health`.

## Security

Passwords are hashed with bcrypt. Login uses signed tokens. Roles are read from the database on every
request. Inputs are checked and filter values must be plain text from allowed lists (this blocks NoSQL
injection). Login has rate limiting. CORS allows only listed websites. Secrets are in environment
variables. The `.env` file is not in the repository. Users see simple error messages, never stack traces.

## Testing

- Manual test record: `docs/test-cases.md` (test steps, expected result, actual result, pass or fail).
- Automated unit tests for the priority rule: `npm test` in `server`. Output: `docs/automated-test-output.txt`.
- The 10 reviewer steps were run by hand on the live site.

## Known limitations

- Automated tests cover the priority rule only. Other tests were done by hand.
- The classifier is trained on only 90 made-up sentences. It makes mistakes, for example on lifts and
  roof leaks. The 80 percent score does not prove real-world accuracy.
- The duplicate check uses starting values and a short same-meaning list. It checked only open tickets in
  the same building (the latest 200). It may miss similar tickets that use very different words.
- Staff accounts: there is no password change, no delete (only switch off), and account changes are not
  written to an activity log. Switching off a person does not move their tickets. An admin must reassign
  them.
- Choices where the brief was silent: staff can act on any ticket in their own department. A changed
  priority also changes the deadlines.
- Free hosting: the API can take up to a minute to wake up. Database limit is about 0.5 GB.
- Analytics are plain numbers and tables. There are no charts.
- Emergency guidance shows when the hazard box is ticked. We do not scan the text for danger words.
- No password reset, no email, no notifications (out of scope in the brief).

YOUR_CLOUDFLARE_LINK => https://smartresolve-ai.vishwashvarprasanth1874.workers.dev

YOUR_GITHUB_LINK => https://github.com/VishwashvarPrasanth/smartresolve-ai