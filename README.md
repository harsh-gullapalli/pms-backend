<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

PMS backend for Tripon X, built with [NestJS](https://github.com/nestjs/nest) and backed by PostgreSQL and Redis.

## Project setup

```bash
$ npm install
```

### Environment configuration

Copy `.env.example` to `.env` and fill in the values. `.env` is git-ignored and must never be committed.

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | PostgreSQL user (required) | - |
| `DB_PASSWORD` | PostgreSQL password (required) | - |
| `DB_NAME` | PostgreSQL database (required) | - |
| `DB_POOL_MAX` | Max pooled connections | `10` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password, leave empty if none | - |
| `JWT_SECRET` | Secret used to sign access tokens, at least 32 characters (required) | - |

Generate a secret with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.

The app fails at startup if a required variable is missing.

### Local services (Docker)

PostgreSQL and Redis run as Docker containers that publish their default ports to `localhost`:

```bash
docker run -d --name postgres-db -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:17
docker run -d --name redis -p 6379:6379 redis
docker exec postgres-db psql -U postgres -c 'CREATE DATABASE "pms-triponx";'
```

### Database (Prisma)

The schema lives in `prisma/schema.prisma` (`users` and `sessions` tables). The generated client is written to `src/generated/` (git-ignored) and is rebuilt automatically by `npm install`.

```bash
npm run prisma:migrate   # create and apply a migration in development
npm run prisma:deploy    # apply existing migrations (CI / production)
npm run prisma:seed      # insert the sample users below
npm run prisma:generate  # regenerate the client after editing the schema
```

The Prisma CLI builds its connection URL from the same `DB_*` variables as the app, so there is no separate `DATABASE_URL` to maintain.

### Authentication

Users are provisioned directly in the `users` table; there is no registration endpoint. The seed creates these sample accounts (development only, the seed refuses to run with `NODE_ENV=production`):

| Email | Password |
| --- | --- |
| `admin@pms.local` | `Admin@12345` |
| `john.doe@pms.local` | `Password@123` |
| `jane.smith@pms.local` | `Password@123` |

| Endpoint | Auth | Description |
| --- | --- | --- |
| `POST /auth/login` | public | Body `{ "email", "password" }`. Returns `{ accessToken, tokenType, user }` |
| `GET /auth/me` | bearer token | Returns the current user |
| `POST /auth/logout` | bearer token | Ends the session; returns `204` |
| `GET /health` | public | See below |

```bash
curl -X POST localhost:3000/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@pms.local","password":"Admin@12345"}'

curl localhost:3000/auth/me -H 'Authorization: Bearer <accessToken>'
```

How it works:

- **Sessions last until logout.** The JWT has no expiry. Each login creates a row in `sessions`, and the token carries its id (`sid`). Logout deletes the row, which invalidates that token immediately. Logging in on several devices creates independent sessions.
- **Default-deny.** `AuthGuard` is registered globally, so every route requires a valid token unless it is marked `@Public()`. On each request it checks the token signature (HS256 only) and that the session is still active.
- **Redis cache.** Active sessions are cached in Redis (5-minute TTL) so most requests skip the database. PostgreSQL stays the source of truth; if Redis is down, requests fall back to the database.
- **Credentials.** Passwords are hashed with bcrypt. Wrong password, unknown email, and deactivated account all return the same `401`, and unknown emails take the same time as wrong passwords.
- **Validation.** Request bodies are validated and unknown properties are rejected with `400`.

Note: because tokens never expire, a leaked token stays valid until its owner logs out. Deactivating a user (`is_active = false`) blocks new logins and, once the cache entry expires, existing sessions.

### Health check

`GET /health` checks PostgreSQL and Redis in parallel, with a 2-second timeout per dependency.

- `200 OK` when both are up
- `503 Service Unavailable` when either is down

```json
{
  "status": "ok",
  "timestamp": "2026-11-04T13:11:48.977Z",
  "components": {
    "postgres": { "status": "up", "latencyMs": 83 },
    "redis": { "status": "up", "latencyMs": 2 }
  }
}
```

Failure reasons are written to the server log, not returned in the response.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

To add it to this project, run this and approve the code it prints at [observe.nestjs.com/link](https://observe.nestjs.com/link) - signing up for free if you have no account:

```bash
$ npx @nestjs/observe link
```

It installs `@nestjs/observe`, wires it into `AppModule` and `main.ts`, and writes the app key and secret into `.env`, which every `nest start` script (`start`, `start:dev`, `start:debug`) then loads. In production, set `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment instead.

Or do it by hand:

```bash
$ npm install @nestjs/observe
```

Then follow the [setup guide](https://docs.nestjs.com/observability/sdk) - it takes a single import and an app key.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
