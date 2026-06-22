import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import axios from "axios";
import { API_URL } from "../../config";
import { useNavigate, useLocation } from "react-router-dom";

function MyProfilePage() {

  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user"));

  const [profile, setProfile] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const navItemStyle = (path) => ({
    mb: 2,
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: "8px",
    background:
      location.pathname === path
        ? "linear-gradient(90deg,#4b6cb7,#182848)"
        : "transparent",
  });

  useEffect(() => {

    axios
      .get(`${API_URL}/patient/profile/${user.user_id}`)
      .then((res) => setProfile(res.data))
      .catch((err) => console.log(err));

  }, []);

  if (!profile) return null;

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg,#141e30,#243b55)",
      }}
    >

      {/* Sidebar */}

      <Box
        sx={{
          width: "260px",
          padding: "30px",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.15)",
          color: "white",
        }}
      >

        <Typography variant="h4" sx={{ mb: 4 }}>
          CareHub
        </Typography>

        <Typography sx={navItemStyle("/patient")} onClick={() => navigate("/patient")}>
          Home
        </Typography>

        <Typography sx={navItemStyle("/patient/profile")} onClick={() => navigate("/patient/profile")}>
          My Profile
        </Typography>

        <Typography sx={navItemStyle("/patient/vitals")} onClick={() => navigate("/patient/vitals")}>
          My Vitals
        </Typography>

        <Typography sx={navItemStyle("/patient/appointments")} onClick={() => navigate("/patient/appointments")}>
          Appointments
        </Typography>

        <Typography sx={navItemStyle("/patient/prescriptions")} onClick={() => navigate("/patient/prescriptions")}>
          Prescriptions
        </Typography>

        <Typography sx={navItemStyle("/patient/billing")} onClick={() => navigate("/patient/billing")}>
          Payments
        </Typography>

        <Button variant="contained" sx={{ mt: 4 }} onClick={handleLogout}>
          LOGOUT
        </Button>

      </Box>

      {/* Main */}

      <Box sx={{ flex: 1, padding: "40px", color: "white" }}>

        <Typography variant="h3" gutterBottom>
          My Profile
        </Typography>

        <Box
          sx={{
            padding: "30px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "15px",
            width: "400px"
          }}
        >

          <Typography>Name: {profile.name}</Typography>
          <Typography>Age: {profile.age}</Typography>
          <Typography>Gender: {profile.gender}</Typography>
          <Typography>Phone: {profile.phone}</Typography>
          <Typography>City: {profile.city}</Typography>

        </Box>

      </Box>

    </Box>
  );
}

export default MyProfilePage;