import React, { useState } from 'react';
import SubHeader from '../Shared/SubHeader';
import Footer from '../Shared/Footer/Footer';
import Header from '../Shared/Header/Header';
import { Link } from 'react-router-dom';
import {
  FaHeartbeat,
  FaBaby,
  FaBone,
  FaBrain,
  FaSpa,
  FaTooth,
  FaUserMd,
  FaVideo,
  FaEye,
  FaFemale,
  FaAssistiveListeningSystems,
  FaSmile,
  FaCheck,
  FaCalendarCheck,
  FaShieldAlt,
  FaArrowRight,
  FaSearch,
  FaHospital,
  FaFileMedical,
} from 'react-icons/fa';
import './Service.css';

// Local medical images for immediate fallback
import babyImg from '../../images/features/baby.png';
import doc1 from '../../images/doc/doc1.jpg';
import doc4 from '../../images/doc/doc4.jpg';
import doc3 from '../../images/doc/doctor 3.jpg';
import doc5 from '../../images/doc/doctor 5.jpg';
import docChair from '../../images/doc/doctor chair 2.jpg';
import feat1 from '../../images/features/feature-01.jpg';
import feat2 from '../../images/features/feature-02.jpg';
import feat5 from '../../images/features/feature-05.jpg';
import feat6 from '../../images/features/feature-06.jpg';

const consultationServices = [
  {
    id: 1,
    title: 'Cardiology & Heart Care',
    category: 'Cardiology',
    filterCategory: 'specialized',
    doctorSpecialist: 'Cardiologist',
    image: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600&auto=format&fit=crop&q=80',
    fallbackImg: doc1,
    icon: FaHeartbeat,
    mode: 'In-Person & Video',
    modeType: 'both',
    fee: '₹900 - ₹1,000',
    duration: '30-45 mins',
    description: 'Comprehensive cardiovascular assessment, chest pain triage, ECG and Echocardiogram review, blood pressure regulation, and coronary care.',
    highlights: [
      '12-Lead ECG & Echo report evaluation',
      'Hypertension & cholesterol management',
      'Chest pain & coronary risk triage',
    ],
  },
  {
    id: 2,
    title: 'Pediatrics & Child Care',
    category: 'Pediatrics',
    filterCategory: 'family',
    doctorSpecialist: 'Pediatrician',
    image: babyImg,
    fallbackImg: babyImg,
    icon: FaBaby,
    mode: 'In-Person & Video',
    modeType: 'both',
    fee: '₹600',
    duration: '20-30 mins',
    description: 'Compassionate medical care for infants, toddlers, and teenagers covering developmental milestones, vaccination schedules, and acute illness.',
    highlights: [
      'Newborn growth & developmental tracking',
      'Routine childhood vaccinations & records',
      'Pediatric respiratory & fever triage',
    ],
  },
  {
    id: 3,
    title: 'Orthopedics & Joint Care',
    category: 'Orthopedics',
    filterCategory: 'specialized',
    doctorSpecialist: 'Orthopedic',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80',
    fallbackImg: feat1,
    icon: FaBone,
    mode: 'In-Person & Video',
    modeType: 'both',
    fee: '₹800 - ₹900',
    duration: '30 mins',
    description: 'Clinical evaluation and rehabilitation for joint pain, bone fractures, ligament sprains, osteoarthritis, spinal alignment, and athletic injuries.',
    highlights: [
      'Knee, hip & shoulder mobility assessment',
      'Spine alignment & chronic back pain relief',
      'Post-fracture & sports injury rehabilitation',
    ],
  },
  {
    id: 4,
    title: 'Neurology & Brain Wellness',
    category: 'Neurology',
    filterCategory: 'specialized',
    doctorSpecialist: 'Neurologist',
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&auto=format&fit=crop&q=80',
    fallbackImg: doc4,
    icon: FaBrain,
    mode: 'In-Person & Video',
    modeType: 'both',
    fee: '₹1,200',
    duration: '40 mins',
    description: 'Specialized diagnostic consultations for persistent migraines, nerve compression, numbness, tremors, seizure disorders, and neuropathy.',
    highlights: [
      'Chronic migraine & cluster headache clinic',
      'Peripheral neuropathy & nerve health review',
      'Stroke prevention & cognitive assessments',
    ],
  },
  {
    id: 5,
    title: 'Dermatology & Skin Wellness',
    category: 'Dermatology',
    filterCategory: 'specialized',
    doctorSpecialist: 'Dermatologist',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
    fallbackImg: feat2,
    icon: FaSpa,
    mode: 'In-Person & Video',
    modeType: 'both',
    fee: '₹650 - ₹700',
    duration: '20-30 mins',
    description: 'Targeted clinical therapies for allergic rashes, severe acne, eczema, psoriasis flare-ups, suspicious skin lesions, and aesthetic skin care.',
    highlights: [
      'Acne, eczema & inflammatory dermatitis care',
      'Skin allergy triage & patch evaluation',
      'Preventive mole & lesion examination',
    ],
  },
  {
    id: 6,
    title: 'Dentistry & Oral Health',
    category: 'Dentistry',
    filterCategory: 'family',
    doctorSpecialist: 'Dentist',
    image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&auto=format&fit=crop&q=80',
    fallbackImg: docChair,
    icon: FaTooth,
    mode: 'In-Person Clinic',
    modeType: 'in_person',
    fee: '₹500 - ₹600',
    duration: '30 mins',
    description: 'Complete oral cavity examinations, ultrasonic teeth scaling, cavity fillings, root canal therapy, painless dental restorations, and dental hygiene.',
    highlights: [
      'Oral cavity examination & digital checkup',
      'Toothache relief & root canal consultations',
      'Ultrasonic cleaning & preventive hygiene',
    ],
  },
  {
    id: 7,
    title: 'General Medicine & Primary Care',
    category: 'General Medicine',
    filterCategory: 'family',
    doctorSpecialist: 'General Medicine',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
    fallbackImg: doc5,
    icon: FaUserMd,
    mode: 'In-Person & Video',
    modeType: 'both',
    fee: '₹450 - ₹500',
    duration: '20 mins',
    description: 'First-contact medical care for acute fevers, respiratory symptoms, diabetes control, thyroid disorders, seasonal illnesses, and routine health checks.',
    highlights: [
      'Comprehensive vitals & physical checkup',
      'Type-2 diabetes & thyroid regulation',
      'Prompt symptom triage & lab prescription',
    ],
  },
  {
    id: 8,
    title: 'Telehealth Remote Video Consult',
    category: 'Telemedicine',
    filterCategory: 'online',
    doctorSpecialist: '',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80',
    fallbackImg: doc3,
    icon: FaVideo,
    mode: 'Online HD Video',
    modeType: 'online',
    fee: '₹450 - ₹900',
    duration: '20-30 mins',
    description: 'Connect directly from home with verified doctors across all specialties via high-definition video, live chat, instant e-prescriptions, and digital follow-ups.',
    highlights: [
      '1-on-1 private HD video call session',
      'Instant downloadable digital prescription',
      'Direct PACS imaging & report sharing',
    ],
  },
  {
    id: 9,
    title: 'Ophthalmology & Vision Care',
    category: 'Ophthalmology',
    filterCategory: 'specialized',
    doctorSpecialist: 'Ophthalmologist',
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80',
    fallbackImg: feat5,
    icon: FaEye,
    mode: 'In-Person Clinic',
    modeType: 'in_person',
    fee: '₹500 - ₹600',
    duration: '25 mins',
    description: 'Comprehensive eye assessments, visual acuity refraction, intraocular pressure testing for glaucoma, cataract evaluations, and dry eye relief.',
    highlights: [
      'Visual acuity & digital refractive testing',
      'Glaucoma ocular pressure screening',
      'Cataract & diabetic retinopathy assessment',
    ],
  },
  {
    id: 10,
    title: "Gynecology & Women's Health",
    category: 'Gynecology',
    filterCategory: 'specialized',
    doctorSpecialist: 'Gynecologist',
    image: 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=600&auto=format&fit=crop&q=80',
    fallbackImg: feat2,
    icon: FaFemale,
    mode: 'In-Person & Video',
    modeType: 'both',
    fee: '₹700',
    duration: '30 mins',
    description: "Patient-centered healthcare for women covering PCOS/PCOD management, prenatal and pregnancy guidance, menstrual disorders, and pelvic wellness.",
    highlights: [
      'PCOS, hormonal balance & cycle regulation',
      'Prenatal, maternity & postnatal reviews',
      'Preventive cervical & pelvic health checks',
    ],
  },
  {
    id: 11,
    title: 'ENT (Ear, Nose & Throat)',
    category: 'ENT',
    filterCategory: 'specialized',
    doctorSpecialist: 'ENT',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80',
    fallbackImg: feat6,
    icon: FaAssistiveListeningSystems,
    mode: 'In-Person Clinic',
    modeType: 'in_person',
    fee: '₹600',
    duration: '25 mins',
    description: 'Specialized clinical evaluation for sinus infections, allergic rhinitis, hearing difficulties, chronic ear discharge, sore throat, and vertigo.',
    highlights: [
      'Endoscopic sinus & nasal passageway check',
      'Middle ear infection & audiometry review',
      'Tonsillitis & persistent vertigo triage',
    ],
  },
  {
    id: 12,
    title: 'Mental Health & Psychiatric Wellness',
    category: 'Psychiatry',
    filterCategory: 'specialized',
    doctorSpecialist: 'Psychiatrist',
    image: 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=600&auto=format&fit=crop&q=80',
    fallbackImg: doc1,
    icon: FaSmile,
    mode: 'In-Person & Video',
    modeType: 'both',
    fee: '₹1,000',
    duration: '45 mins',
    description: 'Empathetic, confidential psychiatric counseling and therapy for anxiety, clinical depression, work stress, insomnia, and mood stabilization.',
    highlights: [
      '1-on-1 confidential psychiatric consultation',
      'Anxiety, panic & stress resilience care',
      'Sleep health & cognitive behavior support',
    ],
  },
];

const Service = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServices = consultationServices.filter((service) => {
    const matchesTab =
      activeTab === 'all'
        ? true
        : activeTab === 'online'
        ? service.modeType === 'online' || service.modeType === 'both'
        : activeTab === 'in_person'
        ? service.modeType === 'in_person' || service.modeType === 'both'
        : service.filterCategory === activeTab;

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      service.title.toLowerCase().includes(query) ||
      service.category.toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query) ||
      service.highlights.some((h) => h.toLowerCase().includes(query));

    return matchesTab && matchesSearch;
  });

  return (
    <div className="service-page-wrapper">
      <Header />
      <SubHeader
        title="Consultation Services"
        subtitle="Explore specialized healthcare consultations with certified medical doctors, available in-clinic and via secure online video sessions."
      />

      {/* Trust & Quality Pillars */}
      <section className="service-trust-bar">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-3 col-sm-6">
              <div className="service-trust-item">
                <div className="service-trust-icon">
                  <FaUserMd />
                </div>
                <div className="service-trust-text">
                  <h5>Board-Certified Doctors</h5>
                  <p>Pre-verified clinical credentials</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-sm-6">
              <div className="service-trust-item">
                <div className="service-trust-icon">
                  <FaVideo />
                </div>
                <div className="service-trust-text">
                  <h5>Integrated Video Calls</h5>
                  <p>Encrypted 1-on-1 HD sessions</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-sm-6">
              <div className="service-trust-item">
                <div className="service-trust-icon">
                  <FaFileMedical />
                </div>
                <div className="service-trust-text">
                  <h5>PACS & Lab Reports</h5>
                  <p>Unified medical records & imaging</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-sm-6">
              <div className="service-trust-item">
                <div className="service-trust-icon">
                  <FaShieldAlt />
                </div>
                <div className="service-trust-text">
                  <h5>Private & Confidential</h5>
                  <p>Strict patient data protection</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="container">
        <div className="service-controls-card">
          <div className="row align-items-center g-3">
            <div className="col-lg-8 col-md-7">
              <div className="service-filter-pills">
                <button
                  type="button"
                  className={`service-filter-btn ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All Consultations{' '}
                  <span className="service-filter-count">{consultationServices.length}</span>
                </button>
                <button
                  type="button"
                  className={`service-filter-btn ${activeTab === 'online' ? 'active' : ''}`}
                  onClick={() => setActiveTab('online')}
                >
                  <FaVideo /> Online Video Consults{' '}
                  <span className="service-filter-count">
                    {consultationServices.filter((s) => s.modeType === 'online' || s.modeType === 'both').length}
                  </span>
                </button>
                <button
                  type="button"
                  className={`service-filter-btn ${activeTab === 'specialized' ? 'active' : ''}`}
                  onClick={() => setActiveTab('specialized')}
                >
                  Specialized Medicine{' '}
                  <span className="service-filter-count">
                    {consultationServices.filter((s) => s.filterCategory === 'specialized').length}
                  </span>
                </button>
                <button
                  type="button"
                  className={`service-filter-btn ${activeTab === 'family' ? 'active' : ''}`}
                  onClick={() => setActiveTab('family')}
                >
                  Primary & Family Care{' '}
                  <span className="service-filter-count">
                    {consultationServices.filter((s) => s.filterCategory === 'family').length}
                  </span>
                </button>
              </div>
            </div>
            <div className="col-lg-4 col-md-5">
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control service-search-input pe-5"
                  placeholder="Search consultation or symptom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <FaSearch
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Consultations Grid */}
        <div className="row g-4">
          {filteredServices.length > 0 ? (
            filteredServices.map((consultation) => {
              const IconComp = consultation.icon;
              const doctorLink = consultation.doctorSpecialist
                ? `/doctors?specialist=${encodeURIComponent(consultation.doctorSpecialist)}`
                : '/doctors';

              return (
                <div className="col-lg-4 col-md-6" key={consultation.id}>
                  <div className="consultation-card">
                    <div className="consultation-card-image-wrap">
                      <img
                        src={consultation.image}
                        alt={consultation.title}
                        className="consultation-card-image"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = consultation.fallbackImg;
                        }}
                      />
                      <span className="consultation-specialty-badge">
                        <IconComp /> {consultation.category}
                      </span>
                      <span
                        className={`consultation-mode-badge ${
                          consultation.modeType === 'both'
                            ? 'mode-badge-both'
                            : consultation.modeType === 'online'
                            ? 'mode-badge-online'
                            : 'mode-badge-inperson'
                        }`}
                      >
                        {consultation.modeType === 'online' ? (
                          <FaVideo />
                        ) : consultation.modeType === 'in_person' ? (
                          <FaHospital />
                        ) : (
                          <FaCalendarCheck />
                        )}
                        {consultation.mode}
                      </span>
                    </div>

                    <div className="consultation-card-body">
                      <h4 className="consultation-card-title">{consultation.title}</h4>
                      <p className="consultation-card-desc">{consultation.description}</p>

                      <ul className="consultation-highlights-list">
                        {consultation.highlights.map((point, idx) => (
                          <li key={idx}>
                            <FaCheck />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="consultation-card-footer">
                        <div className="consultation-fee-wrap">
                          <span className="consultation-fee-label">Consultation Fee</span>
                          <span className="consultation-fee-amount">{consultation.fee}</span>
                        </div>
                        <Link to={doctorLink} className="btn-book-consultation">
                          Book Consultation <FaArrowRight />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-12 py-5 text-center">
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '48px 24px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <FaSearch style={{ fontSize: '36px', color: '#94a3b8', marginBottom: '16px' }} />
                <h4>No Consultations Match Your Query</h4>
                <p className="text-muted mb-3">
                  Try clearing your search term or selecting "All Consultations" to view all available clinical offerings.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setActiveTab('all');
                    setSearchQuery('');
                  }}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA Banner */}
        <section className="service-cta-banner">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h2>Need Guidance on Which Consultation to Choose?</h2>
              <p>
                Our verified healthcare specialists and patient coordination desk are ready to assist you.
                Book a consultation online in under 2 minutes or reach out for assistance with your clinical symptoms.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/doctors" className="btn-cta-primary">
                  Find Your Doctor <FaArrowRight />
                </Link>
                <Link to="/contact" className="btn-cta-secondary">
                  Contact Care Desk
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Service;
