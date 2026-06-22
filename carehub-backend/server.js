const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
const axios = require("axios");

const loadLocalEnv = () => {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const envFile = fs.readFileSync(envPath, "utf8");
  envFile.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  });
};

loadLocalEnv();

const db = require("./db");

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  })
);
app.use(express.json());

const DEFAULT_SLOT_WINDOWS = {
  weekday: [
    [10, 13],
    [15, 19],
  ],
  weekend: [[10, 13]],
};

const isValidDateKey = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date || "");

const toSlotTime = (hour) => `${String(hour).padStart(2, "0")}:00:00`;

const getDefaultSlotsForDate = (date) => {
  const day = new Date(`${date}T00:00:00`).getDay();
  const windows =
    day === 0 || day === 6
      ? DEFAULT_SLOT_WINDOWS.weekend
      : DEFAULT_SLOT_WINDOWS.weekday;

  return windows.flatMap(([start, end]) => {
    const slots = [];
    for (let hour = start; hour < end; hour += 1) {
      slots.push({
        start_time: toSlotTime(hour),
        end_time: toSlotTime(hour + 1),
      });
    }
    return slots;
  });
};

const ensureDeletedSlotsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS deleted_doctor_slots (
      doctor_id INT NOT NULL,
      slot_date DATE NOT NULL,
      start_time TIME NOT NULL,
      PRIMARY KEY (doctor_id, slot_date, start_time)
    )
  `);
};

const ensureDefaultSlotsForDate = async (doctorId, date) => {
  if (!doctorId || !isValidDateKey(date)) return;

  await ensureDeletedSlotsTable();

  const defaultSlots = getDefaultSlotsForDate(date);
  const [existing] = await db.query(
    `SELECT TIME_FORMAT(start_time, '%H:%i') AS start_time
     FROM slots
     WHERE doctor_id=? AND slot_date=?`,
    [doctorId, date]
  );
  const [deleted] = await db.query(
    `SELECT TIME_FORMAT(start_time, '%H:%i') AS start_time
     FROM deleted_doctor_slots
     WHERE doctor_id=? AND slot_date=?`,
    [doctorId, date]
  );

  const existingTimes = new Set(existing.map((slot) => slot.start_time));
  const deletedTimes = new Set(deleted.map((slot) => slot.start_time));

  for (const slot of defaultSlots) {
    const shortTime = slot.start_time.slice(0, 5);
    if (existingTimes.has(shortTime) || deletedTimes.has(shortTime)) continue;

    await db.query(
      `INSERT INTO slots (doctor_id, slot_date, start_time, end_time, status)
       VALUES (?, ?, ?, ?, 'Available')`,
      [doctorId, date, slot.start_time, slot.end_time]
    );
  }
};

// TEST API — get users
app.get("/users", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN API
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [result] = await db.query(
      "SELECT * FROM users WHERE email = ? AND password = ?",
      [email, password]
    );

    if (result.length > 0) {
      res.json({ success: true, user: result[0] });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// SignUP API
app.post("/signup", async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    specialization,
    age,
    gender,
    phone,
    city,
  } = req.body;

  try {
    // 1️⃣ Insert into USERS table
    const [userResult] = await db.query(
      `INSERT INTO users (email, password, role)
       VALUES (?, ?, ?)`,
      [email, password, role]
    );

    const userId = userResult.insertId;

    // 2️⃣ Insert into DOCTORS table
    if (role === "doctor") {
      const doctorName = name.startsWith("Dr.") ? name : `Dr. ${name}`;
      await db.query(
        `INSERT INTO doctors 
         (user_id, name, specialization, phone, city)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, doctorName, specialization, phone, city]
      );
    }

    // 3️⃣ Insert into PATIENTS table
    else if (role === "patient") {
      await db.query(
        `INSERT INTO patients 
         (user_id, name, age, gender, phone, city)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, name, age, gender, phone, city]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Signup error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      res.json({ success: false, message: "User already exists" });
    } else {
      res.status(500).json({ error: "Database error" });
    }
  }
});

// DOCTOR DASHBOARD API
app.get("/api/doctor/dashboard/:id", async (req, res) => {
  const doctorId = req.params.id;

  try {
    // 1️⃣ Doctor name
    const [nameResult] = await db.query(
      `SELECT d.name 
       FROM doctors d
       JOIN users u ON d.user_id = u.user_id
       WHERE u.user_id = ?`,
      [doctorId]
    );

    const doctorName = nameResult[0]?.name || "Doctor";

    // 2️⃣ Patients count
    const [pRes] = await db.query(
      `SELECT COUNT(DISTINCT patient_id) AS count
       FROM appointments
       WHERE doctor_id = ?`,
      [doctorId]
    );

    // 3️⃣ Today's appointments
    const [aRes] = await db.query(
      `SELECT COUNT(*) AS count
       FROM appointments
       WHERE doctor_id = ? AND appointment_date = CURDATE()`,
      [doctorId]
    );

    // Count abnormal vitals
    const [alertCount] = await db.query(
      `SELECT COUNT(*) AS count
       FROM vitals v
       JOIN appointments a ON v.patient_id = a.patient_id
       WHERE a.doctor_id = ?
       AND (
            v.heart_rate > 120
            OR v.heart_rate < 50
            OR v.oxygen_level < 90
            OR v.temperature > 38
           )
       AND v.recorded_at > NOW() - INTERVAL 5 MINUTE`,
      [doctorId]
    );

    // Latest critical patient
    const [criticalPatient] = await db.query(
      `SELECT p.name, v.heart_rate, v.oxygen_level, v.temperature
       FROM vitals v
       JOIN patients p ON v.patient_id = p.patient_id
       JOIN appointments a ON v.patient_id = a.patient_id
       WHERE a.doctor_id = ?
       AND (
            v.heart_rate > 120
            OR v.heart_rate < 50
            OR v.oxygen_level < 90
            OR v.temperature > 38
           )
       ORDER BY v.recorded_at DESC
       LIMIT 1`,
      [doctorId]
    );

    res.json({
      doctorName,
      stats: {
        patients: pRes[0].count,
        appointmentsToday: aRes[0].count,
        alerts: alertCount[0].count,
      },
      criticalPatient: criticalPatient[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DOCTOR PATIENT LIST
app.get("/api/doctor/patients/:id", async (req, res) => {
  const doctorId = req.params.id;

  const sql = `
    SELECT DISTINCT p.patient_id, p.name, p.age, p.gender, p.phone, p.city
    FROM patients p
    JOIN appointments a ON p.patient_id = a.patient_id
    WHERE a.doctor_id = ?
  `;

  try {
    const [rows] = await db.query(sql, [doctorId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

//Vitals for selected patients
app.get("/api/patient/:id", async (req, res) => {
  const patientId = req.params.id;

  try {
    const [rows] = await db.query(
      "SELECT * FROM patients WHERE patient_id = ?",
      [patientId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Patient viewing their own vitals
app.get("/api/patient/vitals/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Step 1: find patient_id from patients table
    const [patient] = await db.query(
      "SELECT patient_id FROM patients WHERE user_id = ?",
      [userId]
    );

    if (patient.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const patientId = patient[0].patient_id;

    // Step 2: fetch vitals
    const [rows] = await db.query(
      "SELECT * FROM vitals WHERE patient_id = ? ORDER BY recorded_at ASC LIMIT 30",
      [patientId]
    );

    const formatted = rows.map((row) => ({
      time: new Date(row.recorded_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      heart_rate: row.heart_rate,
      oxygen_level: row.oxygen_level,
      temperature: row.temperature,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// PRESCRIPTIONS for Selected Patients
app.get("/api/prescriptions/:patientId", async (req, res) => {
  const patientId = req.params.patientId;

  try {
    const [rows] = await db.query(
      `SELECT p.prescription_id,
          p.medication,
          p.notes,
          p.date,
          d.name AS doctor_name,
          d.specialization
   FROM prescriptions p
   JOIN doctors d ON p.doctor_id = d.doctor_id
   WHERE p.patient_id = ?
   ORDER BY p.date DESC`,
      [patientId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Add prescription
// ADD NEW PRESCRIPTION (UPDATED)
app.post("/api/prescriptions", async (req, res) => {
  const { doctor_id, patient_id, medication, notes } = req.body;

  try {
    await db.query(
      `INSERT INTO prescriptions 
       (doctor_id, patient_id, medication, notes)
       VALUES (?, ?, ?, ?)`,
      [doctor_id, patient_id, medication, notes]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET BILLING HISTORY FOR A PATIENT
app.get("/api/doctor/bills/:patientId", async (req, res) => {
  const patientId = req.params.patientId;

  try {
    const [rows] = await db.query(
      `SELECT 
        b.bill_id,
        b.amount,
        b.payment_status,
        b.bill_date,
        d.name AS doctor_name
      FROM bills b
      JOIN appointments a ON b.appointment_id = a.appointment_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
      WHERE a.patient_id = ?
      ORDER BY b.bill_date DESC`,
      [patientId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Doctor Checks Upcoming appointments
app.get("/api/doctor/appointments/:doctorId", async (req, res) => {
  const doctorId = req.params.doctorId;

  try {
    const [rows] = await db.query(
      `SELECT a.appointment_id,
              a.appointment_date,
              a.appointment_time,
              a.status,
              p.name AS patient_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       WHERE a.doctor_id = ?
         AND a.status != 'Completed'      -- ⭐ hides completed
         AND a.appointment_date >= CURDATE()  -- ⭐ only upcoming
       ORDER BY a.appointment_date, a.appointment_time`,
      [doctorId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Set appoitment as completed and generate bill
app.put("/api/doctor/complete/:appointmentId", async (req, res) => {
  try {
    const appointmentId = req.params.appointmentId;
    const CONSULTATION_FEE = 500;

    // update appointment
    await db.query(
      "UPDATE appointments SET status = 'Completed' WHERE appointment_id = ?",
      [appointmentId]
    );

    // Check if bill already exists
    const [existingBill] = await db.query(
      "SELECT * FROM bills WHERE appointment_id = ?",
      [appointmentId]
    );

    // Insert bill only if it doesn't exist
    if (existingBill.length === 0) {
      await db.query(
        `INSERT INTO bills (appointment_id, amount, payment_status, bill_date)
         VALUES (?, ?, 'Pending', CURDATE())`,
        [appointmentId, CONSULTATION_FEE]
      );
    }

    res.json({ message: "Consultation completed" });
  } catch (error) {
    console.error("ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// Slots
app.get("/api/doctor/:id/slots", async (req, res) => {
  const { id } = req.params;
  const [doctor] = await db.query(
    "SELECT doctor_id FROM doctors WHERE user_id=?",
    [id]
  );

  const doctorId = doctor[0]?.doctor_id;
  const { date } = req.query;

  if (!isValidDateKey(date)) {
    return res.status(400).json({ error: "Valid date is required" });
  }

  if (doctor.length === 0) {
    return res.status(404).json({ error: "Doctor not found" });
  }

  await ensureDefaultSlotsForDate(doctorId, date);

  console.log("API HIT:", id, date); // 👈 ADD THIS FOR DEBUG

  // 1. Get base slots
  const [slots] = await db.query(
    `SELECT s.slot_id,
            s.start_time,
            s.end_time,
            s.status,
            p.name AS patient_name
     FROM slots s
     LEFT JOIN appointments a
       ON a.slot_id = s.slot_id
      AND a.status = 'Booked'
     LEFT JOIN patients p
       ON p.patient_id = a.patient_id
     WHERE s.doctor_id=? AND s.slot_date=?
     ORDER BY s.start_time`,
    [doctorId, date]
  );

  // 2. Booked slots
  const [booked] = await db.query(
    "SELECT appointment_time FROM appointments WHERE doctor_id=? AND appointment_date=? AND status='Booked'",
    [doctorId, date]
  );

  // 3. Blocked slots
  const [blocked] = await db.query(
    "SELECT time FROM blocked_slots WHERE doctor_id=? AND date=?",
    [doctorId, date]
  );

  const bookedTimes = booked.map((b) => b.appointment_time.slice(0, 5));
  const blockedTimes = blocked.map((b) => b.time.slice(0, 5));

  const finalSlots = slots.map((s) => {
    const time = s.start_time.slice(0, 5);
    const endTime = s.end_time ? s.end_time.slice(0, 5) : "";

    let status = s.status ? s.status.toLowerCase() : "available";
    if (bookedTimes.includes(time)) status = "booked";
    if (blockedTimes.includes(time)) status = "blocked";

    return {
      slot_id: s.slot_id,
      time,
      end_time: endTime,
      status,
      patient_name: s.patient_name,
    };
  });

  res.json(finalSlots);
});

app.delete("/api/doctor/:doctorUserId/slots/:slotId", async (req, res) => {
  const { doctorUserId, slotId } = req.params;

  try {
    const [doctor] = await db.query(
      "SELECT doctor_id FROM doctors WHERE user_id=?",
      [doctorUserId]
    );

    if (doctor.length === 0) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const doctorId = doctor[0].doctor_id;

    const [slot] = await db.query(
      "SELECT * FROM slots WHERE slot_id=? AND doctor_id=?",
      [slotId, doctorId]
    );

    if (slot.length === 0) {
      return res.status(404).json({ error: "Slot not found" });
    }

    const [booked] = await db.query(
      "SELECT appointment_id FROM appointments WHERE slot_id=? AND status='Booked'",
      [slotId]
    );

    if (booked.length > 0 || String(slot[0].status).toLowerCase() === "booked") {
      return res.status(409).json({ error: "Booked slots cannot be deleted" });
    }

    const startTime = slot[0].start_time;
    const shortStartTime =
      typeof startTime === "string" ? startTime.slice(0, 5) : startTime;

    await ensureDeletedSlotsTable();
    await db.query(
      `INSERT IGNORE INTO deleted_doctor_slots (doctor_id, slot_date, start_time)
       VALUES (?, ?, ?)`,
      [doctorId, slot[0].slot_date, startTime]
    );

    await db.query(
      "DELETE FROM blocked_slots WHERE doctor_id=? AND date=? AND (time=? OR time=?)",
      [doctorId, slot[0].slot_date, startTime, shortStartTime]
    );

    await db.query(
      "UPDATE appointments SET slot_id=NULL WHERE slot_id=? AND status!='Booked'",
      [slotId]
    );

    await db.query("DELETE FROM slots WHERE slot_id=?", [slotId]);

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE SLOT ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/block-slot", async (req, res) => {
  const { doctorId, date, time } = req.body;

  try {
    const [doctor] = await db.query(
      "SELECT doctor_id FROM doctors WHERE user_id=?",
      [doctorId]
    );

    if (doctor.length === 0) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    await db.query(
      "INSERT IGNORE INTO blocked_slots (doctor_id, date, time) VALUES (?, ?, ?)",
      [doctor[0].doctor_id, date, time]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("BLOCK SLOT ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/block-slot", async (req, res) => {
  const { doctorId, date, time } = req.body;

  try {
    const [doctor] = await db.query(
      "SELECT doctor_id FROM doctors WHERE user_id=?",
      [doctorId]
    );

    if (doctor.length === 0) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    await db.query(
      "DELETE FROM blocked_slots WHERE doctor_id=? AND date=? AND time=?",
      [doctor[0].doctor_id, date, time]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("UNBLOCK SLOT ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET ALL DOCTORS (for patient booking)
app.get("/api/doctors", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT doctor_id, name, specialization FROM doctors"
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET FUTURE SLOTS FOR A DOCTOR (for patient booking)
app.get("/api/doctor/slots/:doctorId", async (req, res) => {
  const doctorId = req.params.doctorId;
  const { date } = req.query;

  try {
    if (!isValidDateKey(date)) {
      return res.status(400).json({ error: "Valid date is required" });
    }

    await ensureDefaultSlotsForDate(doctorId, date);

    const [rows] = await db.query(
      `SELECT slot_id, doctor_id, slot_date, start_time, end_time, status
       FROM slots
       WHERE doctor_id = ?
         AND slot_date = ?
         AND (slot_date > CURDATE() OR start_time > CURTIME())
         AND LOWER(status) != 'booked'
         AND NOT EXISTS (
           SELECT 1
           FROM blocked_slots bs
           WHERE bs.doctor_id = slots.doctor_id
             AND bs.date = slots.slot_date
             AND bs.time = slots.start_time
         )
         AND NOT EXISTS (
           SELECT 1
           FROM appointments a
           WHERE a.doctor_id = slots.doctor_id
             AND a.appointment_date = slots.slot_date
             AND a.appointment_time = slots.start_time
            AND a.status = 'Booked'
         )
       ORDER BY slot_date, start_time`,
      [doctorId, date]
    );

    res.json(rows);
  } catch (err) {
    console.error("PATIENT SLOT LIST ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET PATIENT APPOINTMENTS
// (Upcoming + Previous)
app.get("/api/patient/appointments/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Convert user_id → patient_id
    const [patient] = await db.query(
      "SELECT patient_id FROM patients WHERE user_id = ?",
      [userId]
    );

    if (patient.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const patientId = patient[0].patient_id;

    const [rows] = await db.query(
      `SELECT a.appointment_id,
              a.appointment_date,
              a.appointment_time,
              a.status,
              d.name AS doctor_name
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.doctor_id
       WHERE a.patient_id = ?
       ORDER BY a.appointment_date DESC`,
      [patientId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// PATIENT BOOK APPOINTMENT
app.post("/api/patient/book", async (req, res) => {
  const { patientId, slotId } = req.body;

  try {
    // Convert user_id → patient_id
    const [patient] = await db.query(
      "SELECT patient_id FROM patients WHERE user_id = ?",
      [patientId]
    );

    if (patient.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const patient_id = patient[0].patient_id;

    // Get slot
    const [slot] = await db.query("SELECT * FROM slots WHERE slot_id = ?", [
      slotId,
    ]);

    if (slot.length === 0) {
      return res.status(404).json({ error: "Slot not found" });
    }

    const doctorId = slot[0].doctor_id;

    if (String(slot[0].status).toLowerCase() === "booked") {
      return res.status(409).json({ error: "Slot already booked" });
    }

    const [blocked] = await db.query(
      `SELECT 1 FROM blocked_slots
       WHERE doctor_id=? AND date=? AND (time=? OR time=?)`,
      [
        doctorId,
        slot[0].slot_date,
        slot[0].start_time,
        String(slot[0].start_time).slice(0, 5),
      ]
    );

    if (blocked.length > 0) {
      return res.status(409).json({ error: "Slot is not available" });
    }

    const [existingAppointment] = await db.query(
      `SELECT appointment_id FROM appointments
       WHERE slot_id=? AND status='Booked'`,
      [slotId]
    );

    if (existingAppointment.length > 0) {
      return res.status(409).json({ error: "Slot already booked" });
    }

    // Insert appointment
    await db.query(
      `INSERT INTO appointments
       (patient_id, doctor_id, appointment_date, appointment_time, status, slot_id)
       VALUES (?, ?, ?, ?, 'Booked', ?)`,
      [patient_id, doctorId, slot[0].slot_date, slot[0].start_time, slotId]
    );

    // Update slot status
    await db.query("UPDATE slots SET status='Booked' WHERE slot_id=?", [
      slotId,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error("BOOK ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Patient Dashboard
app.get("/api/patient/dashboard/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    // 1️⃣ Get patient_id + name
    const [patientRes] = await db.query(
      `SELECT patient_id, name
       FROM patients
       WHERE user_id = ?`,
      [userId]
    );

    if (patientRes.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const patientId = patientRes[0].patient_id;
    const patientName = patientRes[0].name;

    // 2️⃣ Upcoming appointments
    const [appointmentRes] = await db.query(
      `SELECT COUNT(*) AS count
       FROM appointments
       WHERE patient_id = ?
       AND status = 'Booked'
       AND appointment_date >= CURDATE()`,
      [patientId]
    );

    // 3️⃣ Prescriptions count
    const [prescriptionRes] = await db.query(
      `SELECT COUNT(*) AS count
       FROM prescriptions
       WHERE patient_id = ?`,
      [patientId]
    );

    // 4️⃣ Pending Bills (JOIN with appointments)
    const [billRes] = await db.query(
      `SELECT IFNULL(SUM(b.amount),0) AS total
       FROM bills b
       JOIN appointments a ON b.appointment_id = a.appointment_id
       WHERE a.patient_id = ?
       AND b.payment_status = 'Pending'`,
      [patientId]
    );

    // 5️⃣ Latest Vitals
    const [vitalRes] = await db.query(
      `SELECT heart_rate, oxygen_level, temperature
       FROM vitals
       WHERE patient_id = ?
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [patientId]
    );

    let vitalsStatus = "Normal";

    if (vitalRes.length > 0) {
      const { heart_rate, oxygen_level, temperature } = vitalRes[0];

      if (oxygen_level < 90 || heart_rate > 120 || temperature > 39) {
        vitalsStatus = "Critical";
      } else if (oxygen_level < 95 || heart_rate > 100 || temperature > 37.8) {
        vitalsStatus = "Warning";
      }
    }

    res.json({
      patientName,
      stats: {
        upcomingAppointments: appointmentRes[0].count,
        prescriptions: prescriptionRes[0].count,
        pendingBills: billRes[0].total,
        vitalsStatus,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/patient/vitals/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Convert user_id → patient_id
    const [patient] = await db.query(
      "SELECT patient_id FROM patients WHERE user_id = ?",
      [userId]
    );

    if (patient.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const patientId = patient[0].patient_id;

    const [rows] = await db.query(
      "SELECT * FROM vitals WHERE patient_id = ? ORDER BY recorded_at ASC",
      [patientId]
    );

    const formatted = rows.map((row) => ({
      time: new Date(row.recorded_at).toLocaleTimeString(),
      heart: row.heart_rate,
      oxygen: row.oxygen_level,
      temp: row.temperature,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// PATIENT PROFILE API
app.get("/api/patient/profile/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const [rows] = await db.query(
      `SELECT name, age, gender, phone, city
       FROM patients
       WHERE user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// PATIENT VIEW PRESCRIPTIONS
app.get("/api/patient/prescriptions/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // convert user_id → patient_id
    const [patient] = await db.query(
      "SELECT patient_id FROM patients WHERE user_id = ?",
      [userId]
    );

    if (patient.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const patientId = patient[0].patient_id;

    const [rows] = await db.query(
      `SELECT p.prescription_id,
              p.medication,
              p.notes,
              p.date,
              d.name AS doctor_name
       FROM prescriptions p
       JOIN doctors d ON p.doctor_id = d.doctor_id
       WHERE p.patient_id = ?
       ORDER BY p.date DESC`,
      [patientId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// PATIENT BILLING
app.get("/api/patient/bills/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // convert user_id → patient_id
    const [patient] = await db.query(
      "SELECT patient_id FROM patients WHERE user_id = ?",
      [userId]
    );

    if (patient.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const patientId = patient[0].patient_id;

    const [rows] = await db.query(
      `SELECT b.bill_id,
              b.amount,
              b.payment_status,
              b.bill_date,
              d.name AS doctor_name
       FROM bills b
       JOIN appointments a ON b.appointment_id = a.appointment_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       WHERE a.patient_id = ?
       ORDER BY b.bill_date DESC`,
      [patientId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// PAY BILL
app.post("/api/patient/bills/:billId/create-order", async (req, res) => {
  const billId = req.params.billId;

  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({ error: "Razorpay keys are not configured" });
    }

    const [bill] = await db.query(
      `SELECT b.bill_id,
              b.amount,
              b.payment_status,
              b.bill_date,
              d.name AS doctor_name
       FROM bills b
       JOIN appointments a ON b.appointment_id = a.appointment_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       WHERE b.bill_id = ?`,
      [billId]
    );

    if (bill.length === 0) {
      return res.status(404).json({ error: "Bill not found" });
    }

    if (bill[0].payment_status === "Paid") {
      return res.status(409).json({ error: "Bill already paid" });
    }

    const amountInPaise = Math.round(Number(bill[0].amount) * 100);

    const orderResponse = await axios.post(
      "https://api.razorpay.com/v1/orders",
      {
        amount: amountInPaise,
        currency: "INR",
        receipt: `bill_${billId}`,
        notes: {
          bill_id: String(billId),
          doctor_name: bill[0].doctor_name || "",
        },
      },
      {
        auth: {
          username: keyId,
          password: keySecret,
        },
      }
    );

    res.json({
      keyId,
      orderId: orderResponse.data.id,
      amount: orderResponse.data.amount,
      currency: orderResponse.data.currency,
      bill: bill[0],
    });
  } catch (err) {
    console.error("RAZORPAY ORDER ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Unable to create payment order" });
  }
});

app.post("/api/patient/bills/:billId/verify-payment", async (req, res) => {
  const billId = req.params.billId;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return res.status(500).json({ error: "Razorpay keys are not configured" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    const [bill] = await db.query(
      "SELECT bill_id, payment_status FROM bills WHERE bill_id = ?",
      [billId]
    );

    if (bill.length === 0) {
      return res.status(404).json({ error: "Bill not found" });
    }

    if (bill[0].payment_status === "Paid") {
      return res.status(409).json({ error: "Bill already paid" });
    }

    await db.query(
      "UPDATE bills SET payment_status = 'Paid' WHERE bill_id = ?",
      [billId]
    );

    res.json({
      success: true,
      transactionId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (err) {
    console.error("RAZORPAY VERIFY ERROR:", err);
    res.status(500).json({ error: "Unable to verify payment" });
  }
});

app.put("/api/patient/pay-bill/:billId", async (req, res) => {
  res.status(400).json({
    error: "Use the Razorpay payment gateway to pay bills",
  });
});

// Simulated Cloud Vitals
app.get("/api/cloud-vitals", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.thingspeak.com/channels/3288171/feeds.json?api_key=U2MQCUXAUIR3TMW5&results=20"
    );

    const feeds = response.data.feeds || [];

    if (!feeds || feeds.length === 0) {
      return res.json([]);
    }

    // latest record
    const latest = feeds[feeds.length - 1];

    const heart = Number(latest.field1);
    const oxygen = Number(latest.field2);
    const temperature = Number(latest.field3);

    // SAVE INTO DATABASE
    await db.query(
      `INSERT INTO vitals (patient_id, heart_rate, oxygen_level, temperature, recorded_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [1, heart, oxygen, temperature]
    );

    // format all feeds for graphs
    const formatted = feeds.map((feed) => ({
      time: new Date(feed.created_at).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  }),
      heart_rate: Number(feed.field1),
      oxygen_level: Number(feed.field2),
      temperature: Number(feed.field3),
    }));

    res.json(formatted);
  } catch (err) {
    console.error("ThingSpeak Error:", err.message);

    res.status(500).json({
      error: "Failed to fetch cloud vitals",
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Simulate vitals and send to ThingSpeak
setInterval(async () => {
  const heartRate = Math.floor(Math.random() * 30) + 70;
  const oxygen = Math.floor(Math.random() * 5) + 95;
  const temperature = (Math.random() * 1 + 36).toFixed(1);

  try {
    await axios.get(
      `https://api.thingspeak.com/update?api_key=${process.env.THINGSPEAK_API_KEY}&field1=${heartRate}&field2=${oxygen}&field3=${temperature}`
    );

    console.log(
      `Vitals sent: ${heartRate}, ${oxygen}, ${temperature}`
    );
  } catch (err) {
    console.error("ThingSpeak Update Error:", err.message);
  }
}, 20000); // every 20 seconds

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
