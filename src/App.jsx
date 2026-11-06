import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignInForm from './components/Login/SignInForm';
import DoctorBooking from './components/Booking/DoctorBooking/DoctorBooking';
import BookingSuccess from './components/Booking/BookingSuccess';
import BookingInvoice from './components/Booking/BookingInvoice/BookingInvoice';
import DoctorProfile from './components/Doctor/DoctorProfile/DoctorProfile';
import Appointments from './components/Doctor/Appointments/Appointments';
import MyPatients from './components/Doctor/MyPatients/MyPatients';
import Reviews from './components/Doctor/Reviews/Reviews';
import Schedule from './components/Doctor/Schedule/Schedule';
import ProfileSetting from './components/Doctor/ProfileSetting/ProfileSetting';
import ChangePassword from './components/Doctor/ChangePassword/ChangePassword';
import AdminDashboard from './components/Admin/Dashboard/Dashboard';
import AdminAppointments from './components/Admin/Appointments/Appointments';
import Doctors from './components/Admin/Doctors/Doctors';
import Patients from './components/Admin/Patients/Patients';
import Profile from './components/Admin/Profile/Profile';
import Transactions from './components/Admin/Transactions/Transactions';
import Specialites from './components/Admin/Specialites/Specialites';
import AdminReviews from './components/Admin/Reviews/Reviews'
import PatientFavouriteDoctor from './components/Doctor/PatientFavourite/PatientFavourite';
import DoctorInvoice from './components/Doctor/Invoice/DoctorInvoice';
import SearchDoctor from './components/Doctor/SearchDoctor/SearchDoctor';
import Blogs from './components/Doctor/Blogs/Blogs';
import BlogsEdit from './components/Doctor/Blogs/BlogsEdit';
import AddBlog from './components/Doctor/Blogs/AddBlog';
import Blog from './components/Blog/Blog';
import BlogDetails from './components/Blog/BlogDetails';
import Contact from './components/Contact/Contact';
import About from './components/About/About';
import Service from './components/Service/Service';
import AppointmentPage from './components/Appointment/AppointmentPage';
import TrackAppointment from './components/TrackAppointment/TrackAppointment';
import Treatment from './components/Doctor/Treatment/Treatment';
import Prescription from './components/Doctor/Prescription/Prescription';
import PrescriptionView from './components/Doctor/Prescription/PrescriptionView';
import Reports from './components/Doctor/Reports/Reports';
import TreatmentEdit from './components/Doctor/Treatment/TreatmentEdit';
import ViewAppointment from './components/Doctor/Appointments/ViewAppointment';
import ForgotPassword from './components/Login/ForgotPassword';
import ForgotPasswordPage from './components/Login/ForgotPasswordPage';
import ResetPasswordPage from './components/Login/ResetPasswordPage';
import Dashboard from './components/Doctor/Dashboard/Dashboard';
import PatientProfileView from './components/Patient/PatientProfileView';
import MedicalHistory from './components/Patient/MedicalRecords/MedicalHistory';
import ImagingReports from './components/Patient/MedicalRecords/ImagingReports';
import LabReports from './components/Patient/MedicalRecords/LabReports';
import PrivateOutlet from './components/Shared/PrivateOutlet';
import AdminPrivateOutlet from './components/Shared/AdminPrivateOutlet';
import SuperAdminPrivateOutlet from './components/Shared/SuperAdminPrivateOutlet';
import SuperAdminLogin from './components/SuperAdmin/SuperAdminLogin';
import SuperAdminLayout from './components/SuperAdmin/SuperAdminLayout';
import SuperAdminPages from './components/SuperAdmin/SuperAdminPages';
import NotFound from './components/UI/NotFound';
import MediBot from './components/Chatbot/MediBot';
import { useLocation } from 'react-router-dom';
import { getUserInfo } from './service/auth.service';
import './PatientTheme.css';

function AppRoutes() {
  const location = useLocation();
  const role = getUserInfo()?.role;
  const themeClass = role === 'patient' ? 'patient-app-theme' : role === 'doctor' ? 'doctor-app-theme' : '';

  return (
    <div className={themeClass}>
      <Routes location={location}>
        <Route element={<PrivateOutlet />}>
          <Route path='/dashboard/blogs' element={<Blogs />} />
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path='/dashboard/my-profile' element={<PatientProfileView />} />
          <Route path='/dashboard/medical-records' element={<MedicalHistory />} />
          <Route path='/dashboard/imaging-reports' element={<ImagingReports />} />
          <Route path='/dashboard/lab-reports' element={<LabReports />} />
          <Route path='/dashboard/my-patients' element={<MyPatients />} />
          <Route path='/dashboard/reviews' element={<Reviews />} />
          <Route path='/dashboard/schedule' element={<Schedule />} />
          <Route path='/dashboard/appointments' element={<Appointments />} />
          <Route path='/dashboard/appointments/:id' element={<ViewAppointment />} />
          <Route path='/dashboard/prescription' element={<Prescription />} />
          <Route path='/dashboard/prescription/:id' element={<PrescriptionView />} />
          <Route path='/dashboard/appointment/treatment/:id' element={<Treatment />} />
          <Route path='/dashboard/appointment/treatment/edit/:id' element={<TreatmentEdit />} />
          <Route path='/dashboard/change-password' element={<ChangePassword />} />
          <Route path='/dashboard/profile-setting' element={<ProfileSetting />} />
          <Route path='/dashboard/favourite' element={<PatientFavouriteDoctor />} />
          <Route path='/dashboard/invoices' element={<DoctorInvoice />} />
          <Route path='/dashboard/reports' element={<Reports />} />
        </Route>
        <Route path='/login' element={<SignInForm />} />
        <Route path='/super-admin/login' element={<SuperAdminLogin />} />
        <Route path='/' element={<Navigate to='/login' replace />} />
        <Route path='/blog' element={<Blog />} />
        <Route path='/blog/:id' element={<BlogDetails />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/about' element={<About />} />
        <Route path='/service' element={<Service />} />
        <Route path='/forgot-password' element={<ForgotPasswordPage />} />
        <Route path='/reset-password' element={<ResetPasswordPage />} />
        <Route path='/reset-password/:userId/:uniqueString' element={<ResetPasswordPage />} />
        <Route path='/appointment' element={<AppointmentPage />} />
        <Route path='/track-appointment' element={<TrackAppointment />} />
        <Route path='/doctors' element={<SearchDoctor />} />
        <Route path='/doctors/profile/:id' element={<DoctorProfile />} />
        <Route path='/dashboard/blogs/:id' element={<BlogsEdit />} />
        <Route path='/dashboard/blogs/create' element={<AddBlog />} />
        <Route path='/booking/:doctorId' element={<DoctorBooking />} />
        <Route path='/booking/success/:id' element={<BookingSuccess />} />
        <Route path='/booking/invoice/:id' element={<BookingInvoice />} />
        <Route element={<AdminPrivateOutlet />}>
          <Route path='/admin/dashboard' element={<AdminDashboard />} />
          <Route path='/admin/appointments' element={<AdminAppointments />} />
          <Route path='/admin/doctors' element={<Doctors />} />
          <Route path='/admin/patients' element={<Patients />} />
          <Route path='/admin/profile' element={<Profile />} />
          <Route path='/admin/reviews' element={<AdminReviews />} />
          <Route path='/admin/transaction' element={<Transactions />} />
          <Route path='/admin/specialites' element={<Specialites />} />
        </Route>
        <Route element={<SuperAdminPrivateOutlet />}>
          <Route element={<SuperAdminLayout />}>
            <Route path='/super-admin/dashboard' element={<SuperAdminPages section='dashboard' />} />
            <Route path='/super-admin/doctors' element={<SuperAdminPages section='doctors' />} />
            <Route path='/super-admin/fees' element={<SuperAdminPages section='fees' />} />
            <Route path='/super-admin/patients' element={<SuperAdminPages section='patients' />} />
            <Route path='/super-admin/users' element={<SuperAdminPages section='users' />} />
            <Route path='/super-admin/appointments' element={<SuperAdminPages section='appointments' />} />
            <Route path='/super-admin/activity' element={<SuperAdminPages section='activity' />} />
          </Route>
        </Route>

        <Route path='*' element={<NotFound/>}/>
      </Routes>
      <MediBot />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router >
  );
}
export default App;
