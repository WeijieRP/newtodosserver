const express = require("express");
const cors = require("cors");
const mysql2 = require("mysql2/promise");
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

// -------------------- CORS --------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.REACT_APP_API_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
  })
);

// -------------------- MySQL Pool --------------------
const db = mysql2.createPool({
  waitForConnections: true,
  connectTimeout: 10000,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// -------------------- GET ALL TODOS --------------------
app.get("/todo", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM todo");

    if (rows.length === 0) {
      return res.status(404).json({ message: "No records found in database" });
    }

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// -------------------- DELETE TODO --------------------
app.delete("/todo/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [result] = await db.execute(
      "DELETE FROM todo WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Todo not found" });
    }

    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// -------------------- UPDATE TODO --------------------
app.put("/todo/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { task, description, category, date } = req.body;

    const [result] = await db.execute(
      "UPDATE todo SET task = ?, description = ?, category = ?, date = ? WHERE id = ?",
      [task, description, category, date, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Todo not found" });
    }

    return res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// -------------------- CREATE TODO --------------------
app.post("/todo", async (req, res) => {
  try {
    const { task, description, category, date } = req.body;

    const [result] = await db.execute(
      "INSERT INTO todo (task, description, category, date) VALUES (?, ?, ?, ?)",
      [task, description, category, date]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "Insert operation failed" });
    }

    return res.status(201).json({
      message: "Inserted successfully",
      insertId: result.insertId,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// -------------------- 404 HANDLER --------------------
app.use((req, res) => {
  return res.status(404).json({ message: "Route not found" });
});

// -------------------- START SERVER --------------------
app.listen(PORT, () => {
  console.log(`Server running at PORT ${PORT}`);
});