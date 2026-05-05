import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import {
  CreditCard,
  Payments,
  ReceiptLong,
  Verified,
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

const formatAmount = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) => new Date(date).toLocaleDateString("en-IN");

function BillingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const pending = bills.filter((b) => b.payment_status === "Pending");
  const paid = bills.filter((b) => b.payment_status === "Paid");

  const pendingTotal = useMemo(
    () => pending.reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
    [pending]
  );

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

  const loadBills = useCallback(() => {
    if (!user?.user_id) return;

    axios
      .get(`${API_URL}/patient/bills/${user.user_id}`)
      .then((res) => setBills(res.data))
      .catch((err) => {
        console.log(err);
        setError("Unable to load bills.");
      });
  }, [user?.user_id]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  const openGateway = (bill) => {
    setSelectedBill(bill);
    setMessage("");
    setError("");
  };

  const closeGateway = () => {
    if (processing) return;
    setSelectedBill(null);
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const confirmPayment = async () => {
    if (!selectedBill) return;

    setProcessing(true);
    setError("");

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        setError("Unable to load Razorpay Checkout. Please try again.");
        return;
      }

      const orderRes = await axios.post(
        `${API_URL}/patient/bills/${selectedBill.bill_id}/create-order`
      );

      const { keyId, orderId, amount, currency, bill } = orderRes.data;

      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: "CareHub",
        description: `Consultation bill #${bill.bill_id}`,
        order_id: orderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        notes: {
          bill_id: String(bill.bill_id),
        },
        theme: {
          color: "#4b6cb7",
        },
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(
              `${API_URL}/patient/bills/${selectedBill.bill_id}/verify-payment`,
              response
            );

            setMessage(
              `Payment successful. Transaction ID: ${verifyRes.data.transactionId}`
            );
            setSelectedBill(null);
            loadBills();
          } catch (err) {
            console.log(err);
            setError("Payment verification failed. Please contact support.");
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      });

      razorpay.open();
    } catch (err) {
      console.log(err);
      setError(
        err.response?.status === 409
          ? "This bill has already been paid."
          : err.response?.data?.error || "Unable to start Razorpay payment."
      );
      setProcessing(false);
    }
  };

  const cardStyle = {
    padding: "20px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "12px",
    color: "white",
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg,#141e30,#243b55)",
      }}
    >
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
          sx={{ mt: 4, background: "linear-gradient(90deg,#4b6cb7,#182848)" }}
          onClick={handleLogout}
        >
          LOGOUT
        </Button>
      </Box>

      <Box sx={{ flex: 1, padding: "40px", color: "white" }}>
        <Typography variant="h3" sx={{ fontWeight: 800 }}>
          Payments
        </Typography>
        <Typography sx={{ opacity: 0.75, mt: 1, mb: 4 }}>
          Pay consultation bills generated after completed appointments.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={cardStyle}>
            <Typography sx={{ opacity: 0.72 }}>Pending Bills</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {pending.length}
            </Typography>
          </Box>
          <Box sx={cardStyle}>
            <Typography sx={{ opacity: 0.72 }}>Amount Due</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {formatAmount(pendingTotal)}
            </Typography>
          </Box>
          <Box sx={cardStyle}>
            <Typography sx={{ opacity: 0.72 }}>Paid Bills</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {paid.length}
            </Typography>
          </Box>
        </Box>

        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>
          Pending Bills
        </Typography>

        {pending.length === 0 ? (
          <Box sx={cardStyle}>
            <Typography>No pending bills</Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {pending.map((bill) => (
              <BillCard
                key={bill.bill_id}
                bill={bill}
                statusColor="#ffa726"
                action={
                  <Button
                    variant="contained"
                    startIcon={<Payments />}
                    onClick={() => openGateway(bill)}
                    sx={{
                      background: "linear-gradient(90deg,#4b6cb7,#182848)",
                      textTransform: "none",
                      fontWeight: 800,
                    }}
                  >
                    Pay Securely
                  </Button>
                }
              />
            ))}
          </Stack>
        )}

        <Typography variant="h4" sx={{ mt: 5, mb: 2 }}>
          Payment History
        </Typography>

        {paid.length === 0 ? (
          <Box sx={cardStyle}>
            <Typography>No paid bills yet</Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {paid.map((bill) => (
              <BillCard
                key={bill.bill_id}
                bill={bill}
                statusColor="#4caf50"
                action={
                  <Chip
                    icon={<Verified />}
                    label="Paid"
                    sx={{
                      background: "rgba(76,175,80,0.18)",
                      color: "#9be7a0",
                      "& .MuiChip-icon": { color: "#9be7a0" },
                    }}
                  />
                }
              />
            ))}
          </Stack>
        )}
      </Box>

      <Dialog open={Boolean(selectedBill)} onClose={closeGateway} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Secure Payment Gateway</DialogTitle>
        <DialogContent>
          {selectedBill && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: "8px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Typography sx={{ fontWeight: 800 }}>
                  {selectedBill.doctor_name}
                </Typography>
                <Typography color="text.secondary">
                  Bill #{selectedBill.bill_id} | {formatDate(selectedBill.bill_date)}
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 800 }}>
                  {formatAmount(selectedBill.amount)}
                </Typography>
              </Box>

              <Alert severity="info">
                You will be redirected to Razorpay Checkout to complete this payment.
                CareHub will mark the bill paid only after Razorpay confirms the
                payment signature.
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeGateway} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<CreditCard />}
            disabled={processing}
            onClick={confirmPayment}
            sx={{ background: "linear-gradient(90deg,#4b6cb7,#182848)" }}
          >
            {processing ? "Processing..." : "Pay Now"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function BillCard({ bill, statusColor, action }) {
  return (
    <Box
      sx={{
        padding: "20px",
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "12px",
        color: "white",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <ReceiptLong />
          <Box>
            <Typography sx={{ fontWeight: 800 }}>Dr. Bill #{bill.bill_id}</Typography>
            <Typography sx={{ opacity: 0.75 }}>{bill.doctor_name}</Typography>
            <Typography sx={{ opacity: 0.75 }}>
              Generated on {formatDate(bill.bill_date)}
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Box>
            <Typography sx={{ opacity: 0.72 }}>Amount</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {formatAmount(bill.amount)}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.2)" }} />
          <Typography sx={{ color: statusColor, fontWeight: 800 }}>
            {bill.payment_status}
          </Typography>
          {action}
        </Stack>
      </Stack>
    </Box>
  );
}

export default BillingPage;
