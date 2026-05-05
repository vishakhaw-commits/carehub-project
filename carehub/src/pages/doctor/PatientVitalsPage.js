import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";

import { Box, Typography, Grid } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function PatientVitalsPage() {

  const { id } = useParams();
  console.log("Patient ID from URL:", id);
  const navigate = useNavigate();

  const [vitalData, setVitalData] = useState([]);
  const [currentVitals, setCurrentVitals] = useState(null);
  const [patient, setPatient] = useState(null);
  const [alert, setAlert] = useState(null);

  // 🔥 Fetch vitals
  useEffect(() => {

  const fetchVitals = () => {
    fetch("http://localhost:5000/api/cloud-vitals")
      .then(res => res.json())
      .then(data => {

        console.log("Cloud vitals:", data);   // 👈 debug

        let latest;

        if (Array.isArray(data)) {
          setVitalData(data);
          latest = data[data.length - 1];
        } else {
          latest = data;
        }

        if (latest) {
          setCurrentVitals(latest);

          if (
            latest.heart_rate > 120 ||
            latest.heart_rate < 50 ||
            latest.oxygen_level < 90 ||
            latest.temperature > 38
          ) {
            setAlert("⚠️ Abnormal vitals detected!");
          } else {
            setAlert(null);
          }
        }

      })
      .catch(err => console.error(err));
  };

  fetchVitals();

  const interval = setInterval(fetchVitals, 5000);

  return () => clearInterval(interval);

}, [id]);

  // 🔥 Fetch patient info
  useEffect(() => {
    fetch(`http://localhost:5000/api/patient/${id}`)
      .then(res => res.json())
      .then(data => setPatient(data))
      .catch(err => console.error(err));
  }, [id]);

  const cardStyle = {
    padding: "25px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
    textAlign: "center"
  };

  const graphCard = {
    padding: "20px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white"
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        padding: "40px",
        background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)"
      }}
    >
      
  {/* Back to patients button */}
  <Button
  onClick={() => navigate("/patientprofile")}
  sx={{
    mb: 2,
    background: "linear-gradient(90deg, #00c6ff, #0072ff)",
    color: "white",
    borderRadius: "10px",
    padding: "8px 18px",
    textTransform: "none",
    border: "1px solid rgba(255,255,255,0.2)"
  }}
>
  ← Back to Patients
</Button>

{/* HEADER */}
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
      boxShadow: "0 0 15px rgba(255,0,0,0.6)"
    }}
  >
    {alert}
  </Box>
  )}

      <Typography variant="h3" sx={{ color: "white", mb: 4 }}>
        Patient Vitals Monitor 
      </Typography>

      {/* 🔥 PATIENT INFO FROM DB */}
      <Box sx={{ ...cardStyle, mb: 4 }}>
        {patient ? (
          <>
            <Typography variant="h5">
              Patient: {patient.name}
            </Typography>
            <Typography>
              Age: {patient.age} | Patient_ID: {patient.patient_id}
            </Typography>
          </>
        ) : (
          <Typography>Loading patient info...</Typography>
        )}
      </Box>

      {/* 🔥 CURRENT VITALS CARDS */}
      <Grid container spacing={3}>

        <Grid item xs={12} md={3}>
          <Box sx={cardStyle}>
            <Typography>Heart Rate ❤️</Typography>
            <Typography variant="h4">
              {currentVitals?.heart_rate ?? "--"} bpm
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={3}>
          <Box sx={cardStyle}>
            <Typography>Oxygen 🫁</Typography>
            <Typography variant="h4">
              {currentVitals?.oxygen_level ?? "--"} %
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={3}>
          <Box sx={cardStyle}>
            <Typography>Temperature 🌡️</Typography>
            <Typography variant="h4">
              {currentVitals?.temperature ?? "--"} °C
            </Typography>
          </Box>
        </Grid>

      </Grid>

      {/* GRAPHS */}
      <Typography variant="h4" sx={{ mt: 6, mb: 3, color: "white" }}>
        Multi-Vital Trends 
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* ❤️ Heart Rate */}
        <Box sx={graphCard}>
          <Typography>Heart Rate ❤️</Typography>
          {vitalData.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={vitalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="heart_rate" stroke="#ff4d4d" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Box>

        {/* 🫁 Oxygen */}
        <Box sx={graphCard}>
          <Typography>Oxygen 🫁</Typography>
          {vitalData.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={vitalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="oxygen_level" stroke="#00ff9c" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Box>

        {/* 🌡️ Temperature */}
        <Box sx={graphCard}>
          <Typography>Temperature 🌡️</Typography>
          {vitalData.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={vitalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="temperature" stroke="#ffaa00" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Box>

      </Box>
    </Box>
  );
}

export default PatientVitalsPage;