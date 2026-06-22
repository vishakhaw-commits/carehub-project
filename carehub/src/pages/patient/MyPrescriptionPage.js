import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../config";

function MyPrescriptionPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useMemo(() => JSON.parse(localStorage.getItem("user")), []);

  const [prescriptions, setPrescriptions] = useState([]);

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
    if (!user?.user_id) return;

    axios
      .get(`${API_URL}/patient/prescriptions/${user.user_id}`)
      .then((res) => setPrescriptions(res.data))
      .catch((err) => console.log(err));
  }, [user?.user_id]);

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
            background: "linear-gradient(90deg,#4b6cb7,#182848)",
          }}
        >
          LOGOUT
        </Button>
      </Box>

      {/* Main Content */}

      <Box sx={{ flex: 1, padding: "40px", color: "white" }}>
        <Typography variant="h3" gutterBottom>
          My Prescriptions
        </Typography>

        {prescriptions.length === 0 ? (
          <Typography>No prescriptions available.</Typography>
        ) : (
          prescriptions.map((p) => (
            <Box
              key={p.prescription_id}
              sx={{
                padding: "20px",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "15px",
                mb: 3,
              }}
            >
              <Typography sx={{ fontWeight: "bold" }}>
                Doctor: {p.doctor_name}
              </Typography>

              <Typography>
                Date: {new Date(p.date).toLocaleDateString("en-IN")}
              </Typography>

              <Typography sx={{ mt: 1 }}>Medication: {p.medication}</Typography>

              <Typography sx={{ mt: 1 }}>Notes: {p.notes}</Typography>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

export default MyPrescriptionPage;
