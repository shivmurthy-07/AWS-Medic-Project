import { useState } from 'react';
import { Button, message } from 'antd';
import { FaBars, FaCalendarCheck, FaChartLine, FaClipboardList, FaSignOutAlt, FaUserMd, FaUsers, FaTimes, FaUserCog, FaRupeeSign } from 'react-icons/fa';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { loggedOut } from '../../service/auth.service';
import { useSuperAdminLogoutMutation } from '../../redux/api/superAdminApi';
import BackButton from '../UI/BackButton';
import './SuperAdmin.css';

const navigation = [
    { to: '/super-admin/dashboard', label: 'Overview', icon: <FaChartLine /> },
    { to: '/super-admin/doctors', label: 'Doctor approvals', icon: <FaUserMd /> },
    { to: '/super-admin/fees', label: 'Fees & Services', icon: <FaRupeeSign /> },
    { to: '/super-admin/patients', label: 'Patients', icon: <FaUsers /> },
    { to: '/super-admin/users', label: 'Users and roles', icon: <FaUserCog /> },
    { to: '/super-admin/appointments', label: 'Appointments', icon: <FaCalendarCheck /> },
    { to: '/super-admin/activity', label: 'Activity log', icon: <FaClipboardList /> },
];

const SuperAdminLayout = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [logoutRequest, { isLoading }] = useSuperAdminLogoutMutation();
    const navigate = useNavigate();

    const logout = async () => {
        try {
            await logoutRequest().unwrap();
        } catch (error) {
            message.warning(error?.data?.message || 'Could not record the logout event. You have been signed out locally.');
        } finally {
            loggedOut();
            navigate('/super-admin/login', { replace: true });
        }
    };

    return (
        <div className="super-admin">
            <header className="super-admin__topbar">
                <div className="d-flex align-items-center gap-3">
                    <button className="super-admin__menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
                        {menuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                    <BackButton />
                    <NavLink to="/super-admin/dashboard" className="super-admin__brand">MediConnect <span>Platform</span></NavLink>
                </div>
                <div className="super-admin__identity">
                    <span><FaUserMd /> Super Admin</span>
                    <Button type="text" icon={<FaSignOutAlt />} loading={isLoading} onClick={logout}>Sign out</Button>
                </div>
            </header>
            <aside className={`super-admin__sidebar ${menuOpen ? 'is-open' : ''}`}>
                <div className="super-admin__sidebar-title">Platform management</div>
                <nav>
                    {navigation.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end
                            className={({ isActive }) => `super-admin__nav-link ${isActive ? 'is-active' : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            {item.icon}<span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <p className="super-admin__sidebar-note">Administrative access is audited. Patient medical details are not shown here.</p>
            </aside>
            {menuOpen && <button className="super-admin__overlay" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
            <main className="super-admin__main"><Outlet /></main>
        </div>
    );
};

export default SuperAdminLayout;
