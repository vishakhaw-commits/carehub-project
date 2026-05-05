import { BrowserRouter, Routes, Route } from "react-router-dom";

// AUTH
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// DASHBOARDS
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import PatientDashboard from "./pages/patient/PatientDashboard";

// DOCTOR PAGES
import SelectPatientPage from "./pages/doctor/SelectPatientPage";
import SlotsPage from "./pages/doctor/SlotsPage";
import PrescriptionsPage from "./pages/doctor/PrescriptionsPage";
import PatientVitalsPage from "./pages/doctor/PatientVitalsPage";
import AppointmentsPage  from "./pages/doctor/AppointmentsPage";
import PatientBillingPage from "./pages/doctor/PatientBillingPage";

// PATIENT PAGES
import MyProfilePage from "./pages/patient/MyProfilePage";
import AppointmentBookingPage from "./pages/patient/AppointmentBookingPage";
import MyVitalsPage from "./pages/patient/MyVitalsPage";
import MyPrescriptionPage from "./pages/patient/MyPrescriptionPage";
import BillingPage from "./pages/patient/BillingPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* AUTH */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* DASHBOARDS */}
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/patient" element={<PatientDashboard />} />

        {/* DOCTOR PAGES */}
        <Route path="/patientprofile" element={<SelectPatientPage />} />
        <Route path="/slots" element={<SlotsPage />} />
        <Route path="/prescriptions/:id" element={<PrescriptionsPage />} />
        <Route path="/doctor/vitals/:id" element={<PatientVitalsPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/doctor/billing/:patientId" element={<PatientBillingPage />} />

        {/* PATIENT PAGES */}
        <Route path="/patient/profile" element={<MyProfilePage />} />
        <Route path="/patient/appointments" element={<AppointmentBookingPage />} />
        <Route path="/patient/vitals" element={<MyVitalsPage />} />
        <Route path="/patient/prescriptions" element={<MyPrescriptionPage />} />
        <Route path="/patient/billing" element={<BillingPage />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;