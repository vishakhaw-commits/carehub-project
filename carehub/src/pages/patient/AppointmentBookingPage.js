import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import {
  AccessTime,
  CalendarMonth,
  LocalHospital,
  PersonSearch,
} from "@mui/icons-material";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useNavigate, useLocation } from "react-router-dom";

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

const formatTime = (time) =>
  new Date(`1970-01-01T${time}`).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const todayKey = formatDateKey(new Date());

function AppointmentBookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSlot, setBookingSlot] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedDoctorInfo = useMemo(
    () =>
      doctors.find(
        (doctor) => String(doctor.doctor_id) === String(selectedDoctor)
      ),
    [doctors, selectedDoctor]
  );

  const upcoming = appointments.filter((a) => a.status === "Booked");
  const previous = appointments.filter((a) => a.status === "Completed");

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

  const loadAppointments = useCallback(() => {
    if (!user?.user_id) return;

    axios
      .get(`${API_URL}/patient/appointments/${user.user_id}`)
      .then((res) => setAppointments(res.data))
      .catch((err) => console.log(err));
  }, [user?.user_id]);

  const loadSlots = async (doctorId, dateKey) => {
    if (!doctorId || !dateKey) {
      setSlots([]);
      return;
    }

    setLoadingSlots(true);
    setError("");

    try {
      const res = await axios.get(
        `${API_URL}/doctor/slots/${doctorId}?date=${dateKey}`
      );
      setSlots(res.data);
    } catch (err) {
      console.log(err);
      setSlots([]);
      setError("Unable to load slots for this date.");
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    axios
      .get(`${API_URL}/doctors`)
      .then((res) => setDoctors(res.data))
      .catch((err) => console.log(err));

    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    if (selectedDoctor) {
      loadSlots(selectedDoctor, selectedDate);
    }
  }, [selectedDoctor, selectedDate]);

  const handleDoctorChange = (doctorId) => {
    setSelectedDoctor(doctorId);
    setSlots([]);
    setMessage("");
    setError("");
  };

  const bookAppointment = async (slotId) => {
    setBookingSlot(slotId);
    setMessage("");
    setError("");

    try {
      await axios.post(`${API_URL}/patient/book`, {
        patientId: user.user_id,
        slotId,
      });

      setMessage("Appointment booked successfully.");
      await loadSlots(selectedDoctor, selectedDate);
      loadAppointments();
    } catch (err) {
      console.log(err);
      setError(
        err.response?.status === 409
          ? "This slot is no longer available. Please select another slot."
          : "Unable to book appointment."
      );
    } finally {
      setBookingSlot("");
    }
  };

  const cardStyle = {
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
          onClick={handleLogout}
          sx={{ mt: 4, background: "linear-gradient(90deg,#4b6cb7,#182848)" }}
        >
          LOGOUT
        </Button>
      </Box>

      <Box sx={{ flex: 1, padding: "40px", color: "white" }}>
        <Typography variant="h3" sx={{ fontWeight: 800 }}>
          Book Appointment
        </Typography>
        <Typography sx={{ opacity: 0.75, mt: 1, mb: 4 }}>
          Select a doctor, choose a date, and confirm an available consultation slot.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "360px 1fr" },
            gap: 3,
          }}
        >
          <Stack spacing={3}>
            <Paper sx={{ ...cardStyle, p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <PersonSearch />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Select Doctor
                </Typography>
              </Stack>

              <FormControl fullWidth>
                <Select
                  value={selectedDoctor}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                  displayEmpty
                  sx={{
                    background: "white",
                    borderRadius: "8px",
                    "& .MuiSelect-select": { py: 1.4 },
                  }}
                >
                  <MenuItem value="">Choose a doctor</MenuItem>
                  {doctors.map((doc) => (
                    <MenuItem key={doc.doctor_id} value={doc.doctor_id}>
                      {doc.name} ({doc.specialization})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedDoctorInfo && (
                <Box sx={{ mt: 2, p: 2, borderRadius: "8px", background: "rgba(255,255,255,0.08)" }}>
                  <Typography sx={{ fontWeight: 800 }}>
                    {selectedDoctorInfo.name}
                  </Typography>
                  <Typography sx={{ opacity: 0.7 }}>
                    {selectedDoctorInfo.specialization}
                  </Typography>
                </Box>
              )}
            </Paper>

            {selectedDoctor && (
              <Paper
                sx={{
                  ...cardStyle,
                  p: 2,
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
                    { background: "rgba(255,255,255,0.12)" },
                  "& .react-calendar__month-view__days__day": {
                    color: "white",
                    borderRadius: "6px",
                  },
                  "& .react-calendar__month-view__days__day--weekend": {
                    color: "#90caf9",
                  },
                  "& .react-calendar__tile:disabled": {
                    background: "transparent",
                    color: "rgba(255,255,255,0.28)",
                  },
                  "& .react-calendar__tile:enabled:hover, & .react-calendar__tile:enabled:focus":
                    { background: "rgba(75,108,183,0.45)" },
                  "& .react-calendar__tile--active": {
                    background: "linear-gradient(90deg,#4b6cb7,#182848)",
                    color: "white",
                  },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <CalendarMonth />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Select Date
                  </Typography>
                </Stack>

                <Calendar
                  value={new Date(`${selectedDate}T00:00:00`)}
                  minDate={new Date(`${todayKey}T00:00:00`)}
                  onClickDay={(value) => {
                    setSelectedDate(formatDateKey(value));
                    setMessage("");
                    setError("");
                  }}
                />
              </Paper>
            )}
          </Stack>

          <Stack spacing={3}>
            <Paper sx={{ ...cardStyle, p: 3, minHeight: 260 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    Available Slots
                  </Typography>
                  <Typography sx={{ opacity: 0.7 }}>
                    {selectedDoctor
                      ? formatDisplayDate(selectedDate)
                      : "Choose a doctor to view the calendar"}
                  </Typography>
                </Box>

                <Chip
                  icon={<LocalHospital />}
                  label="Hospital hours"
                  sx={{
                    background: "rgba(255,255,255,0.12)",
                    color: "white",
                    "& .MuiChip-icon": { color: "white" },
                  }}
                />
              </Stack>

              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
                  Consultation schedule
                </Typography>
                <Typography sx={{ opacity: 0.72 }}>
                  Mon-Fri: 10 AM-1 PM, 3 PM-7 PM. Sat-Sun: 10 AM-1 PM.
                </Typography>
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

              {!selectedDoctor ? (
                <Box sx={{ textAlign: "center", py: 5, opacity: 0.75 }}>
                  <PersonSearch sx={{ fontSize: 42, mb: 1 }} />
                  <Typography>Select a doctor to continue booking.</Typography>
                </Box>
              ) : loadingSlots ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : slots.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 5, opacity: 0.75 }}>
                  <AccessTime sx={{ fontSize: 42, mb: 1 }} />
                  <Typography>No available slots for this date.</Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                      xl: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: 2,
                  }}
                >
                  {slots.map((slot) => (
                    <Box
                      key={slot.slot_id}
                      sx={{
                        p: 2,
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.16)",
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTime fontSize="small" />
                        <Typography sx={{ fontWeight: 800 }}>
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </Typography>
                      </Stack>

                      <Button
                        fullWidth
                        variant="contained"
                        disabled={bookingSlot === slot.slot_id}
                        onClick={() => bookAppointment(slot.slot_id)}
                        sx={{
                          mt: 2,
                          background: "linear-gradient(90deg,#4b6cb7,#182848)",
                          textTransform: "none",
                          fontWeight: 800,
                        }}
                      >
                        {bookingSlot === slot.slot_id ? "Booking..." : "Book Slot"}
                      </Button>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
              }}
            >
              <AppointmentList title="Upcoming Appointments" items={upcoming} />
              <AppointmentList title="Previous Appointments" items={previous} />
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

function AppointmentList({ title, items }) {
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: "12px",
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "white",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
        {title}
      </Typography>

      {items.length === 0 ? (
        <Typography sx={{ opacity: 0.7 }}>No appointments</Typography>
      ) : (
        <Stack spacing={1.5}>
          {items.slice(0, 4).map((appointment) => (
            <Box
              key={appointment.appointment_id}
              sx={{
                p: 1.5,
                borderRadius: "8px",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <Typography sx={{ fontWeight: 800 }}>
                {appointment.doctor_name}
              </Typography>
              <Typography sx={{ opacity: 0.72 }}>
                {new Date(appointment.appointment_date).toLocaleDateString("en-IN")} at{" "}
                {formatTime(appointment.appointment_time)}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export default AppointmentBookingPage;
