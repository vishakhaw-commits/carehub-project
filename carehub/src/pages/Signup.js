import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, TextField, Button, Typography, MenuItem } from "@mui/material";
import { BASE_URL } from "../config";

function Signup() {
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  // Doctor
  const [specialization, setSpecialization] = useState("");
  // Patient
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  // Common
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const navigate = useNavigate();

  const handleSignup = async () => {
    // 🔐 Password check
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!role) {
      alert("Please select a role");
      return;
    }
    setLoading(true); // START loading

    try {
      const res = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,

          // doctor fields
          specialization,

          // patient fields
          age,
          gender,

          // common fields
          phone,
          city,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Signup successful");
        navigate("/"); // go to login
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }

    setLoading(false); // STOP loading
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url('/login.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      {/* DARK OVERLAY */}
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(90deg, rgba(15,32,39,0.9), rgba(44,83,100,0.85))",
        }}
      />

      {/* LEFT TEXT (same as login) */}
      <Box
        sx={{
          position: "absolute",
          left: "8%",
          top: "35%",
          color: "white",
        }}
      >
        <Typography variant="h2" sx={{ fontWeight: "bold" }}>
          CareHub
        </Typography>

        <Typography variant="h6" sx={{ opacity: 0.9, mt: 2 }}>
          Smart Healthcare Management Platform
        </Typography>
      </Box>

      {/* SIGNUP PANEL — SAME STYLE */}
      <Box
        sx={{
          position: "absolute",
          right: "8%",
          top: "50%",
          transform: "translateY(-50%)",
          width: "420px",
          padding: "40px",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.18)",
          border: "1px solid rgba(255,255,255,0.3)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
          color: "white",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Sign Up
        </Typography>

        <TextField
          fullWidth
          label="Full Name"
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <TextField
          fullWidth
          label="Email"
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <TextField
          fullWidth
          label="Confrim Password"
          type="password"
          margin="normal"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <TextField
          fullWidth
          select
          label="Role"
          margin="normal"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <MenuItem value="doctor">Doctor</MenuItem>
          <MenuItem value="patient">Patient</MenuItem>
        </TextField>

        {role === "doctor" && (
          <>
            <TextField
              fullWidth
              label="Specialization"
              margin="normal"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
            />

            <TextField
              fullWidth
              label="Phone"
              margin="normal"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <TextField
              fullWidth
              label="City"
              margin="normal"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </>
        )}

        {role === "patient" && (
          <>
            <TextField
              fullWidth
              label="Age"
              margin="normal"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />

            <TextField
              fullWidth
              select
              label="Gender"
              margin="normal"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Phone"
              margin="normal"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <TextField
              fullWidth
              label="City"
              margin="normal"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </>
        )}

        <Button
          variant="contained"
          fullWidth
          disabled={loading}
          onClick={handleSignup}
          sx={{
            marginTop: "25px",
            padding: "14px",
            borderRadius: "12px",
            background: "linear-gradient(90deg, #00c6ff, #0072ff)",
            fontWeight: "bold",
          }}
        >
          {loading ? "Creating Account..." : "CREATE ACCOUNT"}
        </Button>
      </Box>
    </Box>
  );
}

export default Signup;
