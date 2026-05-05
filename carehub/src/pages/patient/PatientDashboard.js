import React, { useState, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

function PatientDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const location = useLocation();

  // 🔐 Role Protection
  useEffect(() => {
    if (!user || user.role !== "patient") {
      navigate("/");
    }
  }, []);

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
        ? "linear-gradient(90deg, #4b6cb7, #182848)"
        : "transparent",
  });

  const [dashboardData, setDashboardData] = useState({
    patientName: "",
    stats: {
      upcomingAppointments: 0,
      prescriptions: 0,
      pendingBills: 0,
      vitalsStatus: "Normal",
    },
  });

  useEffect(() => {
    if (user?.user_id) {
      axios
        .get(`http://localhost:5000/api/patient/dashboard/${user.user_id}`)
        .then((res) => {
          console.log("API DATA:", res.data);
          setDashboardData(res.data);
        })
        .catch((err) => console.log(err));
    }
  }, []);

  const cardStyle = {
    flex: 1,
    padding: "25px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
    textAlign: "center",
  };

  const getStatusColor = () => {
    const status = dashboardData.stats.vitalsStatus;
    if (status === "Critical") return "#ff4d4d";
    if (status === "Warning") return "#ffa726";
    return "#4caf50";
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #141e30, #243b55)",
      }}
    >
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
          sx={navItemStyle("/patient")}
          onClick={() => navigate("/patient")}
        >
          Home
        </Typography>

        <Typography
          sx={navItemStyle("/patient/profile")}
          onClick={() => navigate("/patient/profile")}
        >
          My Profile
        </Typography>

        <Typography
          sx={navItemStyle("/patient/vitals")}
          onClick={() => navigate("/patient/vitals")}
        >
          My Vitals
        </Typography>

        <Typography
          sx={navItemStyle("/patient/appointments")}
          onClick={() => navigate("/patient/appointments")}
        >
          Book Appointment
        </Typography>

        <Typography
          sx={navItemStyle("/patient/prescriptions")}
          onClick={() => navigate("/patient/prescriptions")}
        >
          My Prescriptions
        </Typography>

        <Typography
          sx={navItemStyle("/patient/billing")}
          onClick={() => navigate("/patient/billing")}
        >
          Payments
        </Typography>

        <Button
          variant="contained"
          onClick={handleLogout}
          sx={{
            mt: 4,
            background: "linear-gradient(90deg, #4b6cb7, #182848)",
          }}
        >
          LOGOUT
        </Button>
      </Box>

      {/* MAIN CONTENT */}
      <Box sx={{ flex: 1, padding: "40px", color: "white" }}>
        <Typography variant="h3" gutterBottom>
          Welcome, {dashboardData.patientName}
        </Typography>

        <Typography sx={{ opacity: 0.7 }}>
          {new Date().toDateString()}
        </Typography>

        <Typography sx={{ opacity: 0.85, mb: 4 }}>
          A snapshot of your appointments, care, and health.
        </Typography>

        <Box sx={{ display: "flex", gap: "20px", mt: 2 }}>
          <Box sx={cardStyle}>
            <Typography variant="h6">Upcoming Appointments</Typography>
            <Typography variant="h3">
              {dashboardData.stats.upcomingAppointments}
            </Typography>
          </Box>

          <Box sx={cardStyle}>
            <Typography variant="h6">Total Prescriptions</Typography>
            <Typography variant="h3">
              {dashboardData.stats.prescriptions}
            </Typography>
          </Box>

          <Box sx={cardStyle}>
            <Typography variant="h6">Pending Bills</Typography>
            <Typography variant="h3">
              {dashboardData.stats.pendingBills === 0
                ? "No pending dues"
                : `₹${dashboardData.stats.pendingBills}`}
            </Typography>
          </Box>

          <Box
            sx={{
              ...cardStyle,
              border: `1px solid ${getStatusColor()}`,
              boxShadow: `0 0 15px ${getStatusColor()}40`,
            }}
          >
            <Typography variant="h6">Health Status</Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              {/* Status Dot */}
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: getStatusColor(),
                }}
              />

              <Typography variant="h3" sx={{ color: getStatusColor() }}>
                {dashboardData.stats.vitalsStatus}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default PatientDashboard;
