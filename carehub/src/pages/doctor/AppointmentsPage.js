import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../config";

function AppointmentsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [appointments, setAppointments] = useState([]);

  const user = JSON.parse(localStorage.getItem("user")); // doctor

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

  useEffect(() => {
    axios
      .get(`${API_URL}/doctor/appointments/${user.user_id}`)
      .then((res) => setAppointments(res.data))
      .catch((err) => console.log(err));
  }, [user.user_id]);

  const completeAppointment = async (appointmentId) => {
    try {
      await axios.put(
        `${API_URL}/doctor/complete/${appointmentId}`
      );

      alert("Consultation completed");

      // reload appointments from backend
      const res = await axios.get(
        `${API_URL}/doctor/appointments/${user.user_id}`
      );

      setAppointments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* 🔹 LEFT SIDEBAR */}
      <Box
        sx={{
          width: "250px",
          minHeight: "100vh",
          background: "#0f2027",
          color: "white",
          padding: "30px",
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

      {/* Main Content*/}
      <Box
        sx={{
          flex: 1,
          padding: "40px",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
          color: "white",
        }}
      >
        <Typography variant="h3" gutterBottom>
          Upcoming Appointments
        </Typography>

        {appointments.length === 0 ? (
          <Typography>No upcoming appointments.</Typography>
        ) : (
          appointments.map((a) => (
            <Box
              key={a.appointment_id}
              sx={{
                padding: "15px",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "12px",
                mb: 2,
              }}
            >
              <Typography>Patient: {a.patient_name}</Typography>
              <Typography>
                Date: {new Date(a.appointment_date).toLocaleDateString("en-IN")}
              </Typography>
              <Typography>
                Time:{" "}
                {new Date(
                  `1970-01-01T${a.appointment_time}`
                ).toLocaleTimeString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
              <Typography
                sx={{
                  color:
                    a.status === "Completed"
                      ? "#4caf50"
                      : a.status === "Booked"
                      ? "#ffa726"
                      : "#f44336",
                }}
              >
                Status: {a.status}
              </Typography>

              {/* COMPLETE CONSULTATION BUTTON */}
              {a.status === "Booked" && (
                <Button
                  variant="contained"
                  sx={{
                    mt: 1,
                    background: "linear-gradient(90deg, #00c6ff, #0072ff)",
                  }}
                  onClick={() => completeAppointment(a.appointment_id)}
                >
                  Complete Consultation
                </Button>
              )}

              {a.status === "Completed" && (
                <Typography sx={{ mt: 1, color: "#4caf50" }}>
                  Consultation Completed
                </Typography>
              )}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

export default AppointmentsPage;
