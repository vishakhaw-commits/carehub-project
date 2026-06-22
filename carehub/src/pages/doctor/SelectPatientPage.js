import React, { useMemo, useState, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import axios from "axios";
import { API_URL } from "../../config";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

function PatientsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("user"); // clear stored login
    navigate("/"); // go to login page
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

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const user = useMemo(() => JSON.parse(localStorage.getItem("user")), []);

  useEffect(() => {
    if (!user?.user_id) return;

    axios
      .get(`${API_URL}/doctor/patients/${user.user_id}`)
      .then((res) => setPatients(res.data));
  }, [user?.user_id]);

  const patientCardStyle = {
    padding: "20px",
    borderRadius: "15px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    marginBottom: "15px",
    cursor: "pointer",
    color: "white",
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

      {/* 🔹 MAIN CONTENT */}
      <Box
        sx={{
          flex: 1,
          padding: "40px",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
        }}
      >
        <Typography variant="h3" gutterBottom color="white">
          Patients 👥
        </Typography>

        <Typography color="white" sx={{ mb: 3 }}>
          Select a patient to view details and vitals.
        </Typography>

        {/* PATIENT LIST */}
        {patients.map((patient) => (
          <Box
            key={patient.id}
            sx={patientCardStyle}
            onClick={() => setSelectedPatient(patient)}
          >
            <Typography variant="h6">{patient.name}</Typography>
            <Typography>Age: {patient.age}</Typography>
          </Box>
        ))}

        {/* SELECTED PATIENT INFO */}
        {selectedPatient && (
          <Box sx={{ mt: 4, color: "white" }}>
            <Typography variant="h5">
              Selected Patient: {selectedPatient.name}
            </Typography>

            {/* 🔥 ACTION BUTTONS */}
            <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
              {[
                {
                  label: "Vitals",
                  path: selectedPatient
                    ? `/doctor/vitals/${selectedPatient.patient_id}`
                    : "#",
                },
                {
                  label: "Prescriptions",
                  path: `/prescriptions/${selectedPatient.patient_id}`,
                },
                {
                  label: "Billing",
                  path: `/doctor/billing/${selectedPatient.patient_id}`,
                },
              ].map((item) => (
                <Button
                  key={item.label}
                  onClick={() => {
                    if (item.label === "Vitals") {
                      if (!selectedPatient) {
                        alert("Please select a patient first");
                        return;
                      }

                      navigate(`/doctor/vitals/${selectedPatient.patient_id}`);
                    } else {
                      navigate(item.path);
                    }
                  }}
                  sx={{
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    backdropFilter: "blur(8px)",
                    textTransform: "none",
                    fontWeight: "600",
                    transition: "0.3s",
                    "&:hover": {
                      background: "rgba(255,255,255,0.2)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default PatientsPage;
