import { Popover } from "antd"
import { Link, NavLink } from "react-router-dom"
import { FaBars } from "react-icons/fa";
import { Drawer, Button } from 'antd';
import { FaHome, FaPhoneAlt, FaWrench, FaUserMd, FaAddressBook, FaBloggerB, FaSignInAlt, FaThLarge } from "react-icons/fa";

const HeaderNav = ({ open, setOpen, isLoggedIn, role, dashboardPath = '/dashboard', data, avatar, content, popoverTitle }) => {
    const showBlogLink = role !== 'doctor' && role !== 'patient';
    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };
    return (
        <>
            <nav id="navbar" className="navbar order-last order-lg-0">
                <ul>
                    <li><NavLink to={'/'} className={({ isActive }) => isActive ? "nav-link scrollto active" : ""}>Home</NavLink></li>
                    <li><NavLink to={'/about'} className={({ isActive }) => isActive ? "nav-link scrollto active" : ""}>About</NavLink></li>
                    <li><NavLink to={'/service'} className={({ isActive }) => isActive ? "nav-link scrollto active" : ""}>Service</NavLink></li>
                    <li><NavLink to={'/doctors'} className={({ isActive }) => isActive ? "nav-link scrollto active" : ""}>Doctors</NavLink></li>
                    <li><NavLink to={'/contact'} className={({ isActive }) => isActive ? "nav-link scrollto active" : ""}>Contact</NavLink></li>
                    {showBlogLink && <li><NavLink to={'/blog'} className={({ isActive }) => isActive ? "nav-link scrollto active" : ""}>Blog</NavLink></li>}
                    {isLoggedIn && (
                        <li>
                            <NavLink to={dashboardPath} className={({ isActive }) => isActive ? "nav-link scrollto active" : ""}>
                                Dashboard
                            </NavLink>
                        </li>
                    )}
                    {!isLoggedIn && <li><Link to={'/login'} className="nav-link scrollto">Login</Link></li>}
                </ul>
                {isLoggedIn && (
                    <div>
                        <Popover
                            title={popoverTitle}
                            content={content}
                            placement="bottom"
                            trigger="hover"
                            mouseEnterDelay={0.12}
                            overlayClassName="header-user-popover"
                        >
                            <div className="profileImage" role="button" tabIndex={0} aria-haspopup="true">
                                <img
                                    src={data?.img ? data.img : avatar}
                                    alt=""
                                    className="profileImage shadow img-fluid"
                                />
                            </div>
                        </Popover>
                    </div>
                )}
                <FaBars className='mobile-nav-toggle' onClick={showDrawer} />
            </nav>
            <Drawer
                placement={'left'}
                width={500}
                onClose={onClose}
                open={open}
                size={"default"}
                extra={<Button type="primary" onClick={onClose}> Close</Button>}
            >
                <ul className="mobile-menu-nav">
                    <li><NavLink to={'/'} className={({ isActive }) => isActive ? "nav-link scrollto active" : ""}><FaHome className="icon" />Home</NavLink></li>
                    <li><NavLink to={'/about'} className={({ isActive }) => isActive ? "nav-link scrollto active" : ""}><FaAddressBook className="icon" />About</NavLink></li>
                    <li><NavLink to={'/service'} className={({ isActive }) => isActive ? "nav-link scrollto active" : ""}><FaWrench className="icon" />Service</NavLink></li>
                    <li><NavLink to={'/doctors'} className={({ isActive }) => isActive ? "nav-link scrollto active" : ""}><FaUserMd className="icon" />Doctors</NavLink></li>
                    <li><NavLink to={'/contact'} className={({ isActive }) => isActive ? "nav-link scrollto active" : ""}><FaPhoneAlt className="icon" />Contact</NavLink></li>
                    {showBlogLink && <li><NavLink to={'/blog'} onClick={onClose} className={({ isActive }) => isActive ? "nav-link scrollto active" : ""}><FaBloggerB className="icon" />Blog</NavLink></li>}
                    {isLoggedIn && (
                        <li>
                            <NavLink to={dashboardPath} onClick={onClose} className={({ isActive }) => isActive ? "nav-link scrollto active" : ""}>
                                <FaThLarge className="icon" />Dashboard
                            </NavLink>
                        </li>
                    )}
                    {!isLoggedIn && <li><Link to={'/login'} onClick={onClose} className="nav-link scrollto"><FaSignInAlt className="icon" />Login</Link></li>}
                </ul>
            </Drawer>
        </>
    )
}

export default HeaderNav