import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Grid, Button } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function MyVitalsPage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const location = useLocation();

  const [vitalData, setVitalData] = useState([]);
  const [currentVitals, setCurrentVitals] = useState(null);
  const [alert, setAlert] = useState(null);

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

  useEffect(() => {
    const fetchVitals = () => {
      fetch("http://localhost:5000/api/cloud-vitals")
        .then((res) => res.json())
        .then((data) => {
          console.log("Vitals Data:", data);

          if (Array.isArray(data)) {
            setVitalData(data);

            if (data.length > 0) {
              const latest = data[data.length - 1];
              setCurrentVitals(latest);
              console.log("Latest:", latest);

              // 🚨 Abnormal detection using REAL DB keys
              if (
                latest.heart_rate > 120 ||
                latest.heart_rate < 50 ||
                latest.oxygen_level < 90 ||
                latest.temperature > 38
              ) {
                setAlert(
                  "⚠️ Abnormal vitals detected! Please consult your doctor."
                );
              } else {
                setAlert(null);
              }
            }
          }
        })
        .catch((err) => console.error(err));
    };

    fetchVitals();
    const interval = setInterval(fetchVitals, 15000);
    return () => clearInterval(interval);
  }, [user.user_id]);

  const cardStyle = {
    padding: "25px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
    textAlign: "center",
  };

  const graphCard = {
    padding: "20px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
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

      {/* Main content */}
      <Box
        sx={{
          flex: 1,
          minHeight: "100vh",
          padding: "40px",
          background: "linear-gradient(135deg, #141e30, #243b55)",
          color: "white",
        }}
      >
        {alert && (
          <Box
            sx={{
              background: "#ff4d4d",
              padding: "15px",
              borderRadius: "12px",
              mb: 3,
              color: "white",
              textAlign: "center",
              fontWeight: "bold",
              boxShadow: "0 0 15px rgba(255,0,0,0.6)",
            }}
          >
            {alert}
          </Box>
        )}

        <Typography variant="h3" sx={{ color: "white", mb: 4 }}>
          My Health Vitals
        </Typography>

        {/* CURRENT VITALS */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={cardStyle}>
              <Typography>Heart Rate ❤️</Typography>
              <Typography variant="h4">
                {currentVitals?.heart_rate || "--"} bpm
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={cardStyle}>
              <Typography>Oxygen 🫁</Typography>
              <Typography variant="h4">
                {currentVitals?.oxygen_level || "--"}%
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={cardStyle}>
              <Typography>temperature 🌡️</Typography>
              <Typography variant="h4">
                {currentVitals?.temperature || "--"} °C
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* GRAPHS */}
        <Typography variant="h4" sx={{ mt: 6, mb: 3, color: "white" }}>
          Vital Trends
        </Typography>

        <Box
          sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
        >
          <Box sx={graphCard}>
            <Typography>Heart Rate ❤️</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={vitalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                <XAxis dataKey="time" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="heart_rate"
                  stroke="#ff4d4d"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          <Box sx={graphCard}>
            <Typography>Oxygen 🫁</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={vitalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                <XAxis dataKey="time" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="oxygen_level"
                  stroke="#00ff9c"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          <Box sx={graphCard}>
            <Typography>Temperature 🌡️</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={vitalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                <XAxis dataKey="time" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#ffaa00"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default MyVitalsPage;
