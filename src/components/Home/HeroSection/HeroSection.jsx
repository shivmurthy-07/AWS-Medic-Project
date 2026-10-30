import React from 'react';
import './index.css';
import { Link } from 'react-router-dom';
import { getUserInfo } from '../../../service/auth.service';

const HeroSection = () => {
    const role = getUserInfo()?.role;
    const heroTheme = role === 'patient' || role === 'doctor' ? `hero--${role}` : '';

    return (
        <section id="hero" className={`d-flex align-items-center ${heroTheme}`}>
            <div className="container">
                <div>
                    <small>TOTAL HEALTH CARE SOLUTION</small>
                    <h1>Your Most Trusted <br />Health Partner</h1>
                    <small>A repudiandae ipsam labore ipsa voluptatum quidem quae laudantium quisquam aperiam maiores sunt fugit, deserunt rem suscipit placeat.</small>
                </div>
                <div className="hero-actions">
                    <Link to={'/doctors'} className="btn-get-started scrollto">Get Started</Link>
                    <Link to={'/track-appointment'} className="btn-get-started scrollto">Track Appointment</Link>
                </div>
            </div>
        </section>
    )
}
export default HeroSection;