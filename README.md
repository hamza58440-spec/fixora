# Fixora Backend Starter

This is the next step after the HTML demo: a Node.js + Express + PostgreSQL backend.

## What it provides
- Customer/provider signup and login
- Password hashing
- JWT authentication
- PostgreSQL users/services/bookings
- Customer booking API
- Provider booking/status API
- Health check

## Important
This is a development starter, NOT a production deployment. Before accepting real customers, use a real production database, HTTPS, a strong secret, validation/rate limiting, backups, monitoring, and proper admin authorization.

## Run
1. Install Node.js and PostgreSQL.
2. Create a PostgreSQL database named `fixora`.
3. Copy `.env.example` to `.env` and set secure values.
4. Run `npm install`
5. Run `npm start`
6. Check `http://localhost:3000/api/health`
