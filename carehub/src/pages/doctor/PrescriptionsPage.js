import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function PrescriptionsPage() {
  const { id } = useParams(); // patient ID
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState([]);
  const [medication, setMedication] = useState("");
  const [notes, setNotes] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  // 🔹 Fetch prescriptions of selected patient
  const fetchPrescriptions = () => {
    axios
      .get(`http://localhost:5000/api/prescriptions/${id}`)
      .then((res) => setPrescriptions(res.data))
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [id]);

  // 🔹 Add new prescription
  const handleAddPrescription = () => {
    if (!medication || !notes) {
      alert("Please fill all fields");
      return;
    }

    axios
      .post("http://localhost:5000/api/prescriptions", {
        doctor_id: user.user_id,
        patient_id: id,
        medication: medication,
        notes: notes,
      })
      .then(() => {
        alert("Prescription added");
        setMedication("");
        setNotes("");
        fetchPrescriptions(); // refresh list
      })
      .catch((err) => console.log(err));
  };

  return (
    <Box
      sx={{
        padding: "40px",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
        color: "white",
      }}
    >
      {/* 🔹 Back button */}
      <Button
        onClick={() => navigate("/patientprofile")}
        sx={{
          mb: 2,
          background: "linear-gradient(90deg, #00c6ff, #0072ff)",
          color: "white",
          borderRadius: "10px",
          padding: "8px 18px",
          textTransform: "none",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        ← Back to Patients
      </Button>

      <Typography variant="h3" gutterBottom>
        Prescriptions
      </Typography>

      {/* 🔹 Patient name */}
      {prescriptions.length > 0 && (
        <Typography sx={{ mb: 3 }}>
          Patient: {prescriptions[0].patient_name} (ID: {id})
        </Typography>
      )}

      {/* 🔥 ADD NEW PRESCRIPTION FORM */}
      <Box
        sx={{
          mb: 4,
          padding: "20px",
          background: "rgba(255,255,255,0.08)",
          borderRadius: "12px",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Add New Prescription
        </Typography>

        <input
          placeholder="Medication"
          value={medication}
          onChange={(e) => setMedication(e.target.value)}
          style={{ marginRight: "10px", padding: "8px" }}
        />

        <input
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ marginRight: "10px", padding: "8px" }}
        />

        <Button
          onClick={handleAddPrescription}
          sx={{
            background: "linear-gradient(90deg, #00c6ff, #0072ff)",
            color: "white",
            borderRadius: "10px",
            textTransform: "none",
          }}
        >
          Add Prescription
        </Button>
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Past Medications:
      </Typography>

      {/* 🔹 PRESCRIPTIONS LIST */}
      {prescriptions.length === 0 ? (
        <Typography>No prescriptions found.</Typography>
      ) : (
        prescriptions.map((p) => (
          <Box
            key={p.prescription_id}
            sx={{
              padding: "15px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: "12px",
              mb: 2,
            }}
          >
            <Typography>
              <Typography>
                Date:{" "}
                {p.date
                  ? new Date(p.date.replace(" ", "T")).toLocaleDateString()
                  : "Not available"}
              </Typography>
            </Typography>
            <Typography>Medication: {p.medication}</Typography>
            <Typography>Notes: {p.notes}</Typography>
            <Typography>Doctor: {p.doctor_name} ({p.specialization})</Typography>
          </Box>
        ))
      )}
    </Box>
  );
}

export default PrescriptionsPage;
