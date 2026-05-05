import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Block,
  CalendarMonth,
  CheckCircle,
  DeleteOutline,
  EventAvailable,
  EventBusy,
  Home,
  Logout,
  PeopleAlt,
  Refresh,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const formatDateKey = (value) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateKey) =>
  new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatTime = (time) => {
  if (!time) return "-";

  return new Date(`1970-01-01T${time}`).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusChip = (status) => {
  const normalized = status?.toLowerCase();

  if (normalized === "booked") {
    return {
      color: "#fff4d6",
      background: "#8a5a00",
      icon: <EventBusy fontSize="small" />,
      label: "Booked",
    };
  }

  if (normalized === "blocked") {
    return {
      color: "#f8fafc",
      background: "#64748b",
      icon: <Block fontSize="small" />,
      label: "Blocked",
    };
  }

  return {
    color: "#dcfce7",
    background: "#166534",
    icon: <CheckCircle fontSize="small" />,
    label: "Available",
  };
};

function SlotsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSlots = useCallback(async () => {
    if (!selectedDate || !user?.user_id) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.get(
        `${API_URL}/doctor/${user.user_id}/slots?date=${selectedDate}`
      );
      setSlots(res.data);
    } catch (err) {
      console.log(err);
      setError("Unable to load slots. Please try again.");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, user?.user_id]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const stats = useMemo(
    () => ({
      available: slots.filter((slot) => slot.status === "available").length,
      booked: slots.filter((slot) => slot.status === "booked").length,
      total: slots.length,
    }),
    [slots]
  );

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleToggle = async (slot) => {
    if (slot.status === "booked") return;

    setMessage("");
    setError("");

    try {
      if (slot.status === "available") {
        await axios.post(`${API_URL}/block-slot`, {
          doctorId: user.user_id,
          date: selectedDate,
          time: slot.time,
        });
        setMessage("Slot blocked successfully.");
      } else if (slot.status === "blocked") {
        await axios.delete(`${API_URL}/block-slot`, {
          data: {
            doctorId: user.user_id,
            date: selectedDate,
            time: slot.time,
          },
        });
        setMessage("Slot reopened successfully.");
      }

      loadSlots();
    } catch (err) {
      console.log(err);
      setError("Unable to update slot status.");
    }
  };

  const deleteSlot = async (slot) => {
    if (slot.status === "booked") return;

    const confirmed = window.confirm(
      `Delete the ${formatTime(slot.time)} slot? This cannot be undone.`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await axios.delete(`${API_URL}/doctor/${user.user_id}/slots/${slot.slot_id}`);
      setMessage("Slot deleted successfully.");
      loadSlots();
    } catch (err) {
      console.log(err);
      setError(
        err.response?.status === 409
          ? "This slot has already been booked and cannot be deleted."
          : "Unable to delete slot."
      );
    }
  };

  const navItemStyle = (path) => ({
    mb: 1,
    cursor: "pointer",
    padding: "10px 12px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: 1,
    color: "white",
    background:
      location.pathname === path
        ? "rgba(14,165,233,0.24)"
        : "transparent",
    border:
      location.pathname === path
        ? "1px solid rgba(125,211,252,0.35)"
        : "1px solid transparent",
  });

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
      }}
    >
      <Box
        sx={{
          width: "260px",
          padding: "30px",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          color: "white",
          borderRight: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
          CareHub
        </Typography>

        <Typography sx={navItemStyle("/doctor")} onClick={() => navigate("/doctor")}>
          <Home fontSize="small" /> Home
        </Typography>

        <Typography
          sx={navItemStyle("/patientprofile")}
          onClick={() => navigate("/patientprofile")}
        >
          <PeopleAlt fontSize="small" /> Patients
        </Typography>

        <Typography sx={navItemStyle("/slots")} onClick={() => navigate("/slots")}>
          <CalendarMonth fontSize="small" /> Slots
        </Typography>

        <Typography
          sx={navItemStyle("/appointments")}
          onClick={() => navigate("/appointments")}
        >
          <EventAvailable fontSize="small" /> Upcoming Appointments
        </Typography>

        <Button
          fullWidth
          variant="contained"
          startIcon={<Logout />}
          onClick={handleLogout}
          sx={{
            mt: 4,
            background: "#0ea5e9",
            textTransform: "none",
            fontWeight: 700,
            "&:hover": { background: "#0284c7" },
          }}
        >
          Logout
        </Button>
      </Box>

      <Box sx={{ flex: 1, padding: "40px", color: "white" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          gap={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Slot Management
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.72)", mt: 0.5 }}>
              {formatDisplayDate(selectedDate)}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
            onClick={loadSlots}
            disabled={loading}
            sx={{
              borderColor: "rgba(255,255,255,0.35)",
              color: "white",
              textTransform: "none",
              fontWeight: 700,
              "&:hover": {
                borderColor: "#00c6ff",
                background: "rgba(0,198,255,0.1)",
              },
            }}
          >
            Refresh
          </Button>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "320px 1fr" },
            gap: 3,
          }}
        >
          <Paper
            sx={{
              p: 2,
              borderRadius: "8px",
              alignSelf: "start",
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white",
              "& .react-calendar": {
                width: "100%",
                background: "transparent",
                border: 0,
                color: "white",
              },
              "& .react-calendar__navigation button": {
                color: "white",
                borderRadius: "6px",
              },
              "& .react-calendar__navigation button:enabled:hover, & .react-calendar__navigation button:enabled:focus":
                {
                  background: "rgba(255,255,255,0.12)",
                },
              "& .react-calendar__month-view__days__day": {
                color: "white",
                borderRadius: "6px",
              },
              "& .react-calendar__month-view__days__day--weekend": {
                color: "#7dd3fc",
              },
              "& .react-calendar__tile:enabled:hover, & .react-calendar__tile:enabled:focus":
                {
                  background: "rgba(0,198,255,0.2)",
                },
              "& .react-calendar__tile--active": {
                background: "linear-gradient(90deg, #00c6ff, #0072ff)",
                color: "white",
              },
            }}
          >
            <Typography sx={{ fontWeight: 800, mb: 2 }}>Select Date</Typography>
            <Calendar
              value={new Date(`${selectedDate}T00:00:00`)}
              onClickDay={(value) => {
                setSelectedDate(formatDateKey(value));
                setMessage("");
                setError("");
              }}
            />
          </Paper>

          <Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2,
                mb: 2,
              }}
            >
              {[
                ["Total", stats.total, "white"],
                ["Available", stats.available, "#67e8f9"],
                ["Booked", stats.booked, "#fbbf24"],
              ].map(([label, value, color]) => (
                <Paper
                  key={label}
                  sx={{
                    p: 2,
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                  }}
                >
                  <Typography
                    sx={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}
                  >
                    {label}
                  </Typography>
                  <Typography variant="h4" sx={{ color, fontWeight: 800 }}>
                    {value}
                  </Typography>
                </Paper>
              ))}
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

            <TableContainer
              component={Paper}
              sx={{
                borderRadius: "8px",
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ background: "rgba(255,255,255,0.08)" }}>
                    <TableCell sx={{ fontWeight: 800, color: "white" }}>
                      Time
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "white" }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "white" }}>
                      Patient
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "white" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  ) : slots.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <Typography sx={{ fontWeight: 700, color: "white" }}>
                          No slots available for this date
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.68)" }}>
                          Create slots from your hospital scheduling system to manage them here.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    slots.map((slot) => {
                      const status = getStatusChip(slot.status);
                      const isBooked = slot.status === "booked";

                      return (
                        <TableRow
                          key={slot.slot_id || slot.time}
                          hover
                          sx={{
                            "& td": {
                              color: "white",
                              borderColor: "rgba(255,255,255,0.12)",
                            },
                            "&:hover": {
                              background: "rgba(255,255,255,0.08)",
                            },
                          }}
                        >
                          <TableCell>
                            <Typography sx={{ fontWeight: 800 }}>
                              {formatTime(slot.time)}
                              {slot.end_time ? ` - ${formatTime(slot.end_time)}` : ""}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Chip
                              icon={status.icon}
                              label={status.label}
                              size="small"
                              sx={{
                                background: status.background,
                                color: status.color,
                                fontWeight: 800,
                                "& .MuiChip-icon": { color: status.color },
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            {slot.patient_name ? (
                              <Typography sx={{ fontWeight: 700 }}>
                                {slot.patient_name}
                              </Typography>
                            ) : (
                              <Typography sx={{ color: "rgba(255,255,255,0.55)" }}>
                                Unassigned
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell align="right">
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="flex-end"
                            >
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={isBooked}
                                onClick={() => handleToggle(slot)}
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 700,
                                  borderColor: "rgba(255,255,255,0.35)",
                                  color: "white",
                                }}
                              >
                                {slot.status === "blocked" ? "Reopen" : "Block"}
                              </Button>

                              <Tooltip
                                title={
                                  isBooked
                                    ? "Booked slots cannot be deleted"
                                    : "Delete slot"
                                }
                              >
                                <span>
                                  <IconButton
                                    color="error"
                                    disabled={isBooked}
                                    onClick={() => deleteSlot(slot)}
                                  >
                                    <DeleteOutline />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default SlotsPage;
