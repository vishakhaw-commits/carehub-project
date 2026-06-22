import React, { useMemo, useState, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import axios from "axios";
import { API_URL } from "../../config";
import { useNavigate, useLocation } from "react-router-dom";

function DoctorDashboard() {
  const user = useMemo(() => JSON.parse(localStorage.getItem("user")), []);
  const navigate = useNavigate();
  const location = useLocation();

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
        ? "linear-gradient(90deg, #00c6ff, #0072ff)"
        : "transparent",
  });

  // ⭐ Dashboard state
  const [dashboardData, setDashboardData] = useState({
    doctorName: "",
    stats: {
      patients: 0,
      appointmentsToday: 0,
    },
    criticalPatient: null,
  });

  const [criticalAlert, setCriticalAlert] = useState(null);

  // ⭐ Auto refresh dashboard every 5 seconds
  useEffect(() => {
    if (!user?.user_id) return;

    axios
      .get(`${API_URL}/doctor/dashboard/${user.user_id}`)
      .then((res) => setDashboardData(res.data));
  }, [user?.user_id]);

  // 🔴 Show alert when abnormal vitals detected
  useEffect(() => {
    if (dashboardData.criticalPatient) {
      setCriticalAlert(dashboardData.criticalPatient);

      // hide banner after 6 seconds
      setTimeout(() => {
        setCriticalAlert(null);
      }, 6000);
    }
  }, [dashboardData]);

  const cardStyle = {
    flex: 1,
    padding: "25px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
    textAlign: "center",
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
      }}
    >
      {/* 🚨 ALERT BANNER */}
      {criticalAlert && (
        <Box
          sx={{
            position: "fixed",
            top: 80,
            left: "50%",
            transform: "translateX(-50%)",
            width: "60%",
            padding: "14px",
            borderRadius: "10px",
            background: "rgba(255,0,0,0.15)",
            border: "1px solid red",
            color: "#ff4d4d",
            fontWeight: "bold",
            textAlign: "center",
            zIndex: 1000,
            animation: "pulse 1s infinite",
          }}
        >
          🚨 Critical Alert: {criticalAlert.name}
          {criticalAlert.oxygen_level < 90 &&
            ` (Oxygen: ${criticalAlert.oxygen_level}%)`}
          {criticalAlert.heart_rate > 120 &&
            ` (Heart Rate: ${criticalAlert.heart_rate} bpm)`}
          {criticalAlert.temperature > 38 &&
            ` (Temp: ${criticalAlert.temperature} °C)`}
        </Box>
      )}

      {/* SIDEBAR */}
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

        <Typography
          sx={navItemStyle("/doctor")}
          onClick={() => navigate("/doctor")}
        >
          Home
        </Typography>

        <Typography
          sx={navItemStyle("/patientprofile")}
          onClick={() => navigate("/patientprofile")}
        >
          Patients
        </Typography>

        <Typography
          sx={navItemStyle("/slots")}
          onClick={() => navigate("/slots")}
        >
          Slots
        </Typography>

        <Typography
          sx={navItemStyle("/appointments")}
          onClick={() => navigate("/appointments")}
        >
          Upcoming Appointments
        </Typography>

        <Button
          variant="contained"
          onClick={handleLogout}
          sx={{
            mt: 4,
            background: "linear-gradient(90deg, #00c6ff, #0072ff)",
          }}
        >
          LOGOUT
        </Button>
      </Box>

      {/* MAIN CONTENT */}
      <Box sx={{ flex: 1, padding: "40px", color: "white" }}>
        <Typography variant="h3" gutterBottom>
          Welcome back, {dashboardData.doctorName} 👨‍⚕️
        </Typography>

        <Typography sx={{ opacity: 0.7 }}>
          {new Date().toDateString()}
        </Typography>

        <Typography sx={{ opacity: 0.85 }}>
          Here is your overview for today.
        </Typography>

        {/* STATS */}
        <Box sx={{ display: "flex", gap: "20px", mt: 4 }}>
          <Box sx={cardStyle}>
            <Typography variant="h6">Patients</Typography>
            <Typography variant="h3">{dashboardData.stats.patients}</Typography>
          </Box>

          <Box sx={cardStyle}>
            <Typography variant="h6">Appointments Today</Typography>
            <Typography variant="h3">
              {dashboardData.stats.appointmentsToday}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default DoctorDashboard;
