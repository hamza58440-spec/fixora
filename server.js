const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

const JWT_SECRET =
  process.env.JWT_SECRET || "CHANGE_THIS_SECRET";

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.DATABASE_PUBLIC_URL ||
  process.env.DATABASE_PRIVATE_URL;

if (!dbUrl) {
  console.error("NO DATABASE URL FOUND");

  console.error(
    "Database variables:",
    Object.keys(process.env).filter(
      (k) => k.includes("DATABASE") || k.includes("PG")
    )
  );

  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});


/* =========================================================
   HEALTH
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Fixora API"
  });
});


/* =========================================================
   DATABASE
========================================================= */

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      cnic TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      active BOOLEAN DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES users(id),
      service TEXT NOT NULL,
      area TEXT NOT NULL,
      booking_date DATE NOT NULL,
      booking_time TIME NOT NULL,
      details TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      provider_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      rating INTEGER,
      review TEXT,
      reviewed_at TIMESTAMP
    );
  `);

  /*
    Migrate old databases safely.
  */

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS cnic TEXT
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_cnic_unique
    ON users(cnic)
    WHERE cnic IS NOT NULL
  `);

  await pool.query(`
    ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS provider_id INTEGER REFERENCES users(id)
  `);

  await pool.query(`
    ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);

  await pool.query(`
    ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS rating INTEGER
  `);

  await pool.query(`
    ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS review TEXT
  `);

  await pool.query(`
    ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP
  `);

  console.log("Fixora database initialized");
}


/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

function auth(req, res, next) {
  const token = (req.headers.authorization || "")
    .replace("Bearer ", "")
    .trim();

  if (!token) {
    return res.status(401).json({
      error: "Login required"
    });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired login"
    });
  }
}


/* =========================================================
   ROLE MIDDLEWARE
========================================================= */

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied"
      });
    }

    next();
  };
}


/* =========================================================
   SIGN UP
========================================================= */

app.post("/api/auth/signup", async (req, res) => {
  try {
    const {
      name,
      phone,
      password,
      role = "customer",
      cnic
    } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        error: "Name, phone and password are required"
      });
    }

    const safeRole = ["customer", "provider"].includes(role)
      ? role
      : "customer";

    /*
      Provider must have CNIC.
    */

    if (safeRole === "provider" && !cnic) {
      return res.status(400).json({
        error: "CNIC is required for provider registration"
      });
    }

    const cleanPhone = String(phone).trim();
    const cleanCnic = cnic
      ? String(cnic).replace(/[-\s]/g, "").trim()
      : null;

    /*
      Basic CNIC validation.
      Pakistan CNIC = 13 digits.
    */

    if (safeRole === "provider") {
      if (!/^\d{13}$/.test(cleanCnic)) {
        return res.status(400).json({
          error: "Please enter a valid 13-digit CNIC"
        });
      }
    }

    /*
      Check phone first.
    */

    const existingPhone = await pool.query(
      "SELECT id FROM users WHERE phone=$1",
      [cleanPhone]
    );

    if (existingPhone.rows.length) {
      return res.status(400).json({
        error: "Phone number is already registered"
      });
    }

    /*
      Check provider CNIC.
    */

    if (safeRole === "provider") {
      const existingCnic = await pool.query(
        "SELECT id FROM users WHERE cnic=$1",
        [cleanCnic]
      );

      if (existingCnic.rows.length) {
        return res.status(400).json({
          error: "This CNIC is already registered"
        });
      }
    }

    const hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
      INSERT INTO users
      (name, phone, password_hash, role, cnic)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id,name,phone,role,cnic
      `,
      [
        name.trim(),
        cleanPhone,
        hash,
        safeRole,
        safeRole === "provider" ? cleanCnic : null
      ]
    );

    const user = result.rows[0];

    /*
      CNIC is NOT placed inside JWT.
      This prevents unnecessary exposure.
    */

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error("SIGNUP ERROR:", error);

    res.status(500).json({
      error: "Account could not be created"
    });
  }
});


/* =========================================================
   LOGIN
========================================================= */

app.post("/api/auth/login", async (req, res) => {
  try {
    const {
      phone,
      password,
      role
    } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        error: "Phone and password are required"
      });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE phone=$1",
      [String(phone).trim()]
    );

    if (!result.rows[0]) {
      return res.status(401).json({
        error: "Invalid login"
      });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid login"
      });
    }

    /*
      If frontend specifically requests
      customer/provider login, enforce the role.
    */

    if (
      role &&
      !["customer", "provider", "admin"].includes(role)
    ) {
      return res.status(400).json({
        error: "Invalid login type"
      });
    }

    if (role && user.role !== role) {
      return res.status(403).json({
        error:
          role === "provider"
            ? "This account is not a provider account"
            : role === "customer"
            ? "This account is not a customer account"
            : "Access denied"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      error: "Server error"
    });
  }
});


/* =========================================================
   SERVICES
========================================================= */

app.get("/api/services", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id,name
      FROM services
      WHERE active=true
      ORDER BY name
      `
    );

    res.json(result.rows);

  } catch (error) {
    console.error("SERVICES ERROR:", error);

    res.status(500).json({
      error: "Could not load services"
    });
  }
});


/* =========================================================
   CREATE CUSTOMER BOOKING
   Customer -> Fixora/Admin
========================================================= */

app.post(
  "/api/bookings",
  auth,
  requireRole("customer"),
  async (req, res) => {
    try {
      const {
        service,
        area,
        date,
        time,
        details
      } = req.body;

      if (!service || !area || !date || !time) {
        return res.status(400).json({
          error: "Service, area, date and time are required"
        });
      }

      const result = await pool.query(
        `
        INSERT INTO bookings
        (
          customer_id,
          service,
          area,
          booking_date,
          booking_time,
          details,
          status
        )
        VALUES ($1,$2,$3,$4,$5,$6,'Pending')
        RETURNING *
        `,
        [
          req.user.id,
          service,
          area,
          date,
          time,
          details || ""
        ]
      );

      res.status(201).json(result.rows[0]);

    } catch (error) {
      console.error("CREATE BOOKING ERROR:", error);

      res.status(400).json({
        error: "Booking could not be created"
      });
    }
  }
);


/* =========================================================
   GET BOOKINGS
========================================================= */

app.get(
  "/api/bookings",
  auth,
  async (req, res) => {
    try {

      /*
        CUSTOMER
        Only their own bookings.
        They can see provider name/phone only after assignment.
      */

      if (req.user.role === "customer") {

        const result = await pool.query(
          `
          SELECT
            b.*,
            p.name AS provider_name,
            p.phone AS provider_phone
          FROM bookings b
          LEFT JOIN users p
            ON p.id=b.provider_id
          WHERE b.customer_id=$1
          ORDER BY b.created_at DESC,b.id DESC
          `,
          [req.user.id]
        );

        return res.json(result.rows);
      }


      /*
        PROVIDER
        IMPORTANT:
        Provider sees ONLY bookings assigned to them.
        Customer phone is NOT returned.
      */

      if (req.user.role === "provider") {

        const result = await pool.query(
          `
          SELECT
            b.id,
            b.service,
            b.area,
            b.booking_date,
            b.booking_time,
            b.details,
            b.status,
            b.provider_id,
            b.created_at,
            b.rating,
            b.review,
            u.name AS customer_name
          FROM bookings b
          LEFT JOIN users u
            ON u.id=b.customer_id
          WHERE b.provider_id=$1
          ORDER BY b.created_at DESC,b.id DESC
          `,
          [req.user.id]
        );

        return res.json(result.rows);
      }


      /*
        ADMIN
        Full information.
      */

      if (req.user.role === "admin") {

        const result = await pool.query(
          `
          SELECT
            b.*,

            c.name AS customer_name,
            c.phone AS customer_phone,

            p.name AS provider_name,
            p.phone AS provider_phone

          FROM bookings b

          LEFT JOIN users c
            ON c.id=b.customer_id

          LEFT JOIN users p
            ON p.id=b.provider_id

          ORDER BY b.created_at DESC,b.id DESC
          `
        );

        return res.json(result.rows);
      }


      return res.status(403).json({
        error: "Access denied"
      });

    } catch (error) {

      console.error("GET BOOKINGS ERROR:", error);

      res.status(500).json({
        error: "Could not load bookings"
      });
    }
  }
);


/* =========================================================
   ADMIN ASSIGNS PROVIDER
========================================================= */

app.patch(
  "/api/bookings/:id/assign",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {

      const bookingId = Number(req.params.id);
      const providerId = Number(req.body.provider_id);

      if (!bookingId || !providerId) {
        return res.status(400).json({
          error: "Booking ID and provider ID are required"
        });
      }

      const provider = await pool.query(
        `
        SELECT id,name,role
        FROM users
        WHERE id=$1 AND role='provider'
        `,
        [providerId]
      );

      if (!provider.rows[0]) {
        return res.status(404).json({
          error: "Provider not found"
        });
      }

      const result = await pool.query(
        `
        UPDATE bookings
        SET
          provider_id=$1,
          status='Accepted'
        WHERE id=$2
        RETURNING *
        `,
        [providerId, bookingId]
      );

      if (!result.rows[0]) {
        return res.status(404).json({
          error: "Booking not found"
        });
      }

      res.json({
        message: "Provider assigned successfully",
        booking: result.rows[0]
      });

    } catch (error) {

      console.error("ASSIGN PROVIDER ERROR:", error);

      res.status(500).json({
        error: "Provider could not be assigned"
      });
    }
  }
);


/* =========================================================
   ADMIN - PROVIDERS LIST
   Customer information is NOT included here.
========================================================= */

app.get(
  "/api/providers",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {

      const result = await pool.query(
        `
        SELECT
          id,
          name,
          phone,
          cnic,
          created_at
        FROM users
        WHERE role='provider'
        ORDER BY created_at DESC
        `
      );

      res.json(result.rows);

    } catch (error) {

      console.error("PROVIDERS ERROR:", error);

      res.status(500).json({
        error: "Could not load providers"
      });
    }
  }
);


/* =========================================================
   CUSTOMER CANCEL BOOKING
========================================================= */

app.patch(
  "/api/bookings/:id/cancel",
  auth,
  requireRole("customer"),
  async (req, res) => {
    try {

      const result = await pool.query(
        `
        UPDATE bookings
        SET status='Cancelled'
        WHERE
          id=$1
          AND customer_id=$2
          AND status='Pending'
        RETURNING *
        `,
        [
          Number(req.params.id),
          req.user.id
        ]
      );

      if (!result.rows[0]) {
        return res.status(404).json({
          error: "Pending booking not found"
        });
      }

      res.json(result.rows[0]);

    } catch (error) {

      console.error("CANCEL BOOKING ERROR:", error);

      res.status(500).json({
        error: "Booking could not be cancelled"
      });
    }
  }
);


/* =========================================================
   PROVIDER / ADMIN STATUS UPDATE
========================================================= */

app.patch(
  "/api/bookings/:id/status",
  auth,
  requireRole("provider", "admin"),
  async (req, res) => {
    try {

      const bookingId = Number(req.params.id);
      const newStatus = req.body.status;

      const allowedStatuses = [
        "Accepted",
        "On the Way",
        "Completed",
        "Cancelled"
      ];

      if (!allowedStatuses.includes(newStatus)) {
        return res.status(400).json({
          error: "Invalid status"
        });
      }


      /*
        PROVIDER:
        Can ONLY update their own assigned booking.
      */

      if (req.user.role === "provider") {

        const result = await pool.query(
          `
          UPDATE bookings
          SET status=$1
          WHERE
            id=$2
            AND provider_id=$3
          RETURNING *
          `,
          [
            newStatus,
            bookingId,
            req.user.id
          ]
        );

        if (!result.rows[0]) {
          return res.status(404).json({
            error: "Assigned booking not found"
          });
        }

        return res.json(result.rows[0]);
      }


      /*
        ADMIN:
        Can update any booking.
      */

      const result = await pool.query(
        `
        UPDATE bookings
        SET status=$1
        WHERE id=$2
        RETURNING *
        `,
        [
          newStatus,
          bookingId
        ]
      );

      if (!result.rows[0]) {
        return res.status(404).json({
          error: "Booking not found"
        });
      }

      res.json(result.rows[0]);

    } catch (error) {

      console.error("STATUS UPDATE ERROR:", error);

      res.status(500).json({
        error: "Booking status could not be updated"
      });
    }
  }
);


/* =========================================================
   CUSTOMER REVIEW
========================================================= */

app.post(
  "/api/bookings/:id/review",
  auth,
  requireRole("customer"),
  async (req, res) => {
    try {

      const id = Number(req.params.id);

      const rating = Number(req.body.rating);

      const review = String(
        req.body.review || ""
      ).trim();

      if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      ) {
        return res.status(400).json({
          error: "Rating must be between 1 and 5"
        });
      }

      const result = await pool.query(
        `
        UPDATE bookings

        SET
          rating=$1,
          review=$2,
          reviewed_at=CURRENT_TIMESTAMP

        WHERE
          id=$3
          AND customer_id=$4
          AND status='Completed'

        RETURNING *
        `,
        [
          rating,
          review,
          id,
          req.user.id
        ]
      );

      if (!result.rows[0]) {
        return res.status(404).json({
          error: "Completed booking not found"
        });
      }

      res.json(result.rows[0]);

    } catch (error) {

      console.error("REVIEW ERROR:", error);

      res.status(500).json({
        error: "Review could not be saved"
      });
    }
  }
);


/* =========================================================
   ADMIN DASHBOARD STATS
========================================================= */

app.get(
  "/api/admin/stats",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {

      const bookings = await pool.query(
        "SELECT COUNT(*)::int AS count FROM bookings"
      );

      const pending = await pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM bookings
        WHERE status='Pending'
        `
      );

      const completed = await pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM bookings
        WHERE status='Completed'
        `
      );

      const customers = await pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM users
        WHERE role='customer'
        `
      );

      const providers = await pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM users
        WHERE role='provider'
        `
      );

      res.json({
        bookings: bookings.rows[0].count,
        pending: pending.rows[0].count,
        completed: completed.rows[0].count,
        customers: customers.rows[0].count,
        providers: providers.rows[0].count
      });

    } catch (error) {

      console.error("ADMIN STATS ERROR:", error);

      res.status(500).json({
        error: "Could not load admin stats"
      });
    }
  }
);


/* =========================================================
   ROOT
========================================================= */

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "Fixora API",
    message: "Fixora backend is running"
  });
});


/* =========================================================
   START DATABASE
========================================================= */

initDb()
  .then(() => {
    console.log("Fixora database ready");
  })
  .catch((error) => {
    console.error(
      "Database connection failed:",
      error
    );
  });


module.exports = app;
