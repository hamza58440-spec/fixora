const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:hamza728@localhost:5432/fixora"
});

app.get("/api/health", (req,res)=>res.json({ok:true, service:"Fixora API"}));

async function initDb(){
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
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
  // Migrate older installations that already have the bookings table.
  await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_id INTEGER REFERENCES users(id)`);
  await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rating INTEGER`);
  await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review TEXT`);
  await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP`);
}

function auth(req,res,next){
  const token=(req.headers.authorization||"").replace("Bearer ","");
  try { req.user=jwt.verify(token,JWT_SECRET); next(); }
  catch { res.status(401).json({error:"Login required"}); }
}

app.post("/api/auth/signup", async (req,res)=>{
  try{
    const {name,phone,password,role="customer"}=req.body;
    if(!name||!phone||!password) return res.status(400).json({error:"Name, phone and password are required"});
    const safeRole=["customer","provider"].includes(role)?role:"customer";
    const hash=await bcrypt.hash(password,12);
    const result=await pool.query(
      "INSERT INTO users(name,phone,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,phone,role",
      [name,phone,hash,safeRole]
    );
    const user=result.rows[0];
    const token=jwt.sign({id:user.id,name:user.name,phone:user.phone,role:user.role},JWT_SECRET,{expiresIn:"7d"});
    res.json({user,token});
  }catch(e){res.status(400).json({error:"Account could not be created. Phone may already be registered."});}
});

app.post("/api/auth/login", async (req,res)=>{
  try{
    const {phone,password}=req.body;
    const r=await pool.query("SELECT * FROM users WHERE phone=$1",[phone]);
    if(!r.rows[0] || !(await bcrypt.compare(password,r.rows[0].password_hash))) return res.status(401).json({error:"Invalid login"});
    const u=r.rows[0];
    const token=jwt.sign({id:u.id,name:u.name,phone:u.phone,role:u.role},JWT_SECRET,{expiresIn:"7d"});
    res.json({user:{id:u.id,name:u.name,phone:u.phone,role:u.role},token});
  }catch(e){res.status(500).json({error:"Server error"});}
});

app.get("/api/services", async (req,res)=>{
  const r=await pool.query("SELECT id,name FROM services WHERE active=true ORDER BY name");
  res.json(r.rows);
});

app.post("/api/bookings", auth, async (req,res)=>{
  try{
    const {service,area,date,time,details}=req.body;
    const r=await pool.query(
      `INSERT INTO bookings(customer_id,service,area,booking_date,booking_time,details)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id,service,area,date,time,details||""]
    );
    res.status(201).json(r.rows[0]);
  }catch(e){res.status(400).json({error:"Booking could not be created"});}
});

app.get("/api/bookings", auth, async (req,res)=>{
  try{
    const isProvider=req.user.role==="provider";
    const q=isProvider
      ? `SELECT b.*, u.name AS name, u.phone AS phone
         FROM bookings b
         LEFT JOIN users u ON u.id=b.customer_id
         WHERE b.provider_id=$1 OR b.provider_id IS NULL
         ORDER BY b.created_at DESC, b.id DESC`
      : `SELECT b.*, u.name AS provider_name, u.phone AS provider_phone
         FROM bookings b
         LEFT JOIN users u ON u.id=b.provider_id
         WHERE b.customer_id=$1
         ORDER BY b.created_at DESC, b.id DESC`;
    const r=await pool.query(q,[req.user.id]);
    res.json(r.rows);
  }catch(e){
    console.error("GET /api/bookings:",e);
    res.status(500).json({error:"Could not load bookings"});
  }
});

app.post("/api/bookings/:id/review", auth, async (req,res)=>{
  try{
    const id=Number(req.params.id);
    const rating=Number(req.body.rating);
    const review=String(req.body.review||"").trim();
    if(!Number.isInteger(rating)||rating<1||rating>5) return res.status(400).json({error:"Rating must be between 1 and 5"});
    const r=await pool.query(
      `UPDATE bookings
       SET rating=$1, review=$2, reviewed_at=CURRENT_TIMESTAMP
       WHERE id=$3 AND customer_id=$4 AND status='Completed'
       RETURNING *`,
      [rating,review,id,req.user.id]
    );
    if(!r.rows[0]) return res.status(404).json({error:"Completed booking not found"});
    res.json(r.rows[0]);
  }catch(e){
    console.error("POST review:",e);
    res.status(500).json({error:"Review could not be saved"});
  }
});

app.patch("/api/bookings/:id/cancel", auth, async (req,res)=>{
  try{
    const r=await pool.query(
      `UPDATE bookings SET status='Cancelled'
       WHERE id=$1 AND customer_id=$2 AND status='Pending'
       RETURNING *`,
      [Number(req.params.id),req.user.id]
    );
    if(!r.rows[0]) return res.status(404).json({error:"Pending booking not found"});
    res.json(r.rows[0]);
  }catch(e){
    console.error("Cancel booking:",e);
    res.status(500).json({error:"Booking could not be cancelled"});
  }
});

app.patch("/api/bookings/:id/status", auth, async (req,res)=>{
  try{
    if(!["provider","admin"].includes(req.user.role)) return res.status(403).json({error:"Provider/Admin only"});
    const allowed=["Accepted","On the Way","Completed","Cancelled"];
    if(!allowed.includes(req.body.status)) return res.status(400).json({error:"Invalid status"});
    const r=await pool.query(
      `UPDATE bookings
       SET status=$1, provider_id=COALESCE(provider_id,$2)
       WHERE id=$3 AND (provider_id=$2 OR provider_id IS NULL)
       RETURNING *`,
      [req.body.status,req.user.role==="provider"?req.user.id:null,Number(req.params.id)]
    );
    if(!r.rows[0]) return res.status(404).json({error:"Booking not found"});
    res.json(r.rows[0]);
  }catch(e){
    console.error("PATCH status:",e);
    res.status(500).json({error:"Booking status could not be updated"});
  }
});

initDb().then(()=>app.listen(PORT,()=>console.log(`Fixora API running on http://localhost:${PORT}`)))
..catch(err=>{
  console.error("Database connection failed:", err);
  process.exit(1);
});
