import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function PatientBillingPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/doctor/bills/${patientId}`)
      .then((res) => setBills(res.data))
      .catch((err) => console.log(err));
  }, [patientId]);

  return (
    <Box
      sx={{
        padding: "40px",
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0f2027,#203a43,#2c5364)",
        color: "white",
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
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        ← Back to Patients
      </Button>

      <Typography variant="h3" gutterBottom>
        Billing History
      </Typography>

      {bills.length === 0 ? (
        <Typography>No bills found.</Typography>
      ) : (
        bills.map((b) => (
          <Box
            key={b.bill_id}
            sx={{
              padding: "20px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: "12px",
              mb: 2,
            }}
          >
            <Typography>Amount: ₹{b.amount}</Typography>

            <Typography>
              Date: {new Date(b.bill_date).toLocaleDateString("en-IN")}
            </Typography>

            <Typography>Doctor: {b.doctor_name}</Typography>

            <Typography
              sx={{
                color: b.payment_status === "Paid" ? "#4caf50" : "#ffa726",
              }}
            >
              Status: {b.payment_status}
            </Typography>
          </Box>
        ))
      )}
    </Box>
  );
}

export default PatientBillingPage;
