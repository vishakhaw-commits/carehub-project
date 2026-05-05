import React from "react";
import { Box, TextField, Button, Typography, MenuItem } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
  try {
    const res = await axios.post("http://localhost:5000/api/login", {
      email,
      password
    });

   const userData = res.data.user;

localStorage.setItem("user", JSON.stringify(userData));

if (userData.role === "doctor") {
  navigate("/doctor");
} else {
  navigate("/patient");
}

  } catch (err) {
    alert("Invalid login");
  }
};

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url('/login.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative"
      }}
    >
      {/* DARK OVERLAY */}
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(90deg, rgba(15,32,39,0.9), rgba(44,83,100,0.85))"
        }}
      />

      {/* LEFT TEXT */}
      <Box
        sx={{
          position: "absolute",
          left: "8%",
          top: "35%",
          color: "white"
        }}
      >
        <Typography variant="h2" sx={{ fontWeight: "bold" }}>
          CareHub
        </Typography>

        <Typography variant="h6" sx={{ opacity: 0.9, mt: 2 }}>
          Smart Healthcare Management Platform
        </Typography>
      </Box>

      {/* LOGIN PANEL */}
      <Box
        sx={{
          position: "absolute",
          right: "8%",
          top: "50%",
          transform: "translateY(-50%)",
          width: "400px",
          padding: "40px",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.18)",
          border: "1px solid rgba(255,255,255,0.3)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
          color: "white"
        }}
      >
        <Typography variant="h4" gutterBottom>
          Login
        </Typography>

        {/* EMAIL */}
       <TextField
         fullWidth
         label="Email"
         margin="normal"
         onChange={(e) => setEmail(e.target.value)}
          sx={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: "8px"
          }}
       />

        {/* PASSWORD */}
       <TextField
        fullWidth
        label="Password"
        type="password"
        margin="normal"
        onChange={(e) => setPassword(e.target.value)}
          sx={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: "8px"
          }}
        />

        {/* LOGIN BUTTON */}
        <Button
          variant="contained"
          fullWidth
          onClick={handleLogin}
          sx={{
            marginTop: "25px",
            padding: "14px",
            borderRadius: "12px",
            background: "linear-gradient(90deg, #00c6ff, #0072ff)",
            fontWeight: "bold",
            boxShadow: "0 10px 25px rgba(0,114,255,0.5)"
          }}
        >
          LOGIN
        </Button>
        <Typography sx={{ mt: 2, textAlign: "center", color: "white" }}>
  Don't have an account?{" "}
  <span
    style={{ color: "#00c6ff", cursor: "pointer", fontWeight: "bold" }}
    onClick={() => navigate("/signup")}
  >
    Sign up
  </span>
</Typography>
      </Box>
    </Box>
  );
}

export default Login;