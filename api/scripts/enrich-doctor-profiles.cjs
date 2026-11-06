const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DOCTOR_AVATARS = [
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1594824813637-b98e1694f693?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1637059824899-a441006a6875?w=400&auto=format&fit=crop&q=80',
];

const SPECIALTY_DATA = {
    Cardiology: {
        degree: 'MBBS, MD (Cardiology), DM (Interventional Cardiology)',
        college: 'All India Institute of Medical Sciences (AIIMS), New Delhi',
        designation: 'Senior Interventional Cardiologist',
        services: 'Angioplasty, Echocardiogram, ECG, Cardiac Holter, Heart Failure Management, Hypertension Clinic',
        clinicName: 'CardioCare Advanced Heart Center',
        bio: 'Dr. Rahul Sharma is a board-certified Interventional Cardiologist with 14+ years of clinical excellence in complex coronary interventions, preventive cardiology, and adult congenital heart care.'
    },
    Dermatology: {
        degree: 'MBBS, MD (Dermatology, Venereology & Leprosy), DNB',
        college: 'Christian Medical College (CMC), Vellore',
        designation: 'Head of Clinical Dermatology',
        services: 'Acne Scar Laser Therapy, Chemical Peels, Psoriasis Management, Hair Loss PRPs, Pediatric Dermatology',
        clinicName: 'DermaGlow Aesthetic & Clinical Dermatology',
        bio: 'Dr. Priya Reddy is an internationally trained dermatologist specializing in clinical dermatology, advanced laser procedures, anti-aging therapies, and persistent chronic skin conditions.'
    },
    Neurology: {
        degree: 'MBBS, MD (General Medicine), DM (Neurology)',
        college: 'NIMHANS, Bangalore',
        designation: 'Chief Consultant Neurologist',
        services: 'Migraine & Headache Clinic, Stroke Rehabilitation, Epilepsy Monitoring, Neuropathy Care, Parkinson Management',
        clinicName: 'NeuroSpine Comprehensive Brain Center',
        bio: 'Dr. Arjun Patel is a distinguished Neurologist with over 16 years of expertise treating neuromuscular disorders, stroke prevention, neurodegenerative conditions, and complex chronic migraines.'
    },
    Pediatrics: {
        degree: 'MBBS, MD (Pediatrics), Fellowship in Neonatology',
        college: 'Postgraduate Institute of Medical Education and Research (PGIMER), Chandigarh',
        designation: 'Lead Pediatrician & Neonatologist',
        services: 'Well-Baby Checkups, Immunization & Vaccination, Childhood Asthma, Pediatric Nutrition, Developmental Milestones Assessment',
        clinicName: 'Little Angels Children & Adolescent Clinic',
        bio: 'Dr. Sneha Rao is a compassionate pediatrician dedicated to comprehensive child wellness from newborn care through adolescence, with a strong focus on developmental pediatrics and preventative immunizations.'
    },
    Orthopedics: {
        degree: 'MBBS, MS (Orthopedics), M.Ch (Joint Replacement)',
        college: 'King George\'s Medical University (KGMU), Lucknow',
        designation: 'Senior Joint Replacement & Sports Surgeon',
        services: 'Total Knee Replacement, Hip Arthroplasty, Arthroscopic ACL Repair, Fracture Fixation, Spine Care',
        clinicName: 'OrthoPro Bone & Joint Clinic',
        bio: 'Dr. Kiran Verma is an accomplished orthopedic surgeon specializing in robotic joint replacements, sports injuries, and minimally invasive trauma surgery with over 15 years of surgical practice.'
    },
    Ophthalmology: {
        degree: 'MBBS, MS (Ophthalmology), FICO (UK)',
        college: 'Sankara Nethralaya, Chennai',
        designation: 'Senior Cornea & Refractive Specialist',
        services: 'LASIK & Refractive Surgery, Cataract Phacoemulsification, Glaucoma Management, Diabetic Retinopathy Screening',
        clinicName: 'VisionClear Eye & Laser Hospital',
        bio: 'Dr. Ananya Gupta is an esteemed ophthalmologist focusing on precision refractive surgery, advanced micro-incision cataract surgery, and anterior segment laser procedures.'
    },
    Gynecology: {
        degree: 'MBBS, MS (Obstetrics & Gynecology), DGO',
        college: 'Madras Medical College, Chennai',
        designation: 'Senior Consultant Obstetrician & Gynecologist',
        services: 'High-Risk Pregnancy Care, Laparoscopic Hysterectomy, PCOS/PCOD Clinic, Infertility Workup, Menopause Care',
        clinicName: 'Matrika Women\'s Health & Maternity Clinic',
        bio: 'Dr. Meera Nair brings 18 years of warm, patient-centered obstetrical and gynecological expertise, specializing in high-risk pregnancies and minimally invasive gynecological laparoscopic surgery.'
    },
    Psychiatry: {
        degree: 'MBBS, MD (Psychiatry)',
        college: 'Central Institute of Psychiatry (CIP), Ranchi',
        designation: 'Consultant Neuropsychiatrist',
        services: 'Depression & Anxiety Management, Cognitive Behavioral Therapy, Adult ADHD, Sleep Disorder Management, Bipolar Disorder Care',
        clinicName: 'MindWell Behavioral Health & Counseling',
        bio: 'Dr. Rohan Das is a compassionate psychiatrist passionate about destigmatizing mental health, offering evidence-based psychiatric evaluations, psychopharmacology, and integrative psychotherapy.'
    },
    'General Medicine': {
        degree: 'MBBS, MD (General Medicine), FICP',
        college: 'Bangalore Medical College and Research Institute (BMCRI)',
        designation: 'Senior Physician & Internal Medicine Specialist',
        services: 'Diabetes Management, Hypertension Control, Infectious Disease Care, Comprehensive Health Checkups, Geriatric Care',
        clinicName: 'Apex Family Internal Medicine Clinic',
        bio: 'Dr. Divya Singh provides comprehensive primary and preventative medical care, dedicated to holistic lifestyle medicine, chronic disease management, and prompt diagnostic evaluation.'
    },
    ENT: {
        degree: 'MBBS, MS (Otorhinolaryngology)',
        college: 'Grant Medical College & Sir JJ Group of Hospitals, Mumbai',
        designation: 'Senior ENT Surgeon',
        services: 'Endoscopic Sinus Surgery (FESS), Micro-Ear Surgery, Tonsillectomy, Vertigo Clinic, Snoring & Sleep Apnea Care',
        clinicName: 'Aura ENT & Audiology Care',
        bio: 'Dr. Aditya Jain is an experienced ENT surgeon delivering modern microscopic and endoscopic care for ear, nose, and throat ailments with an emphasis on minimally invasive interventions.'
    },
    Dentistry: {
        degree: 'BDS, MDS (Conservative Dentistry & Endodontics)',
        college: 'Manipal College of Dental Sciences (MCODS), Manipal',
        designation: 'Chief Dental Surgeon & Endodontist',
        services: 'Microscopic Root Canal Treatment, Ceramic Veneers, Teeth Whitening, Dental Implants, Invisible Aligners, Pediatric Dental Care',
        clinicName: 'MediConnect Prime Dental & Smile Studio',
        bio: 'Dr. Bhavan Kumar is a premier cosmetic and restorative dentist specializing in painless microscopic root canals, smile design, aesthetic ceramic veneers, and comprehensive family oral healthcare.'
    },
};

const DEFAULT_SPECIALTY = {
    degree: 'MBBS, MD, Fellow of Royal College of Physicians',
    college: 'Bangalore Medical College and Research Institute',
    designation: 'Senior Specialist Consultant',
    services: 'Diagnostic Consultation, Preventative Healthcare, Disease Management, Second Opinions, Follow-up Monitoring',
    clinicName: 'MediConnect Specialist PolyClinic',
    bio: 'Dedicated healthcare practitioner with more than a decade of inpatient and outpatient experience, committed to evidence-based medicine and patient safety.'
};

async function main() {
    console.log('--- ENRICHING DOCTOR PROFILES ---');
    const doctors = await prisma.doctor.findMany();

    let avatarIndex = 0;
    for (const doc of doctors) {
        const specName = doc.specialization || 'General Medicine';
        const specProfile = SPECIALTY_DATA[specName] || DEFAULT_SPECIALTY;

        const avatar = doc.img && doc.img.trim().length > 0 && !doc.img.includes('defaultAvatar')
            ? doc.img
            : DOCTOR_AVATARS[avatarIndex % DOCTOR_AVATARS.length];
        avatarIndex++;

        const phone = doc.phone || `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`;

        await prisma.doctor.update({
            where: { id: doc.id },
            data: {
                img: avatar,
                phone: phone,
                gender: doc.gender || (avatarIndex % 2 === 0 ? 'female' : 'male'),
                dob: doc.dob || '1984-06-15',
                degree: doc.degree && doc.degree.length > 5 ? doc.degree : specProfile.degree,
                college: doc.college && doc.college.length > 5 ? doc.college : specProfile.college,
                designation: doc.designation && doc.designation.length > 4 ? doc.designation : specProfile.designation,
                biography: doc.biography && doc.biography.length > 25 ? doc.biography : specProfile.bio,
                clinicName: doc.clinicName || specProfile.clinicName,
                clinicAddress: doc.clinicAddress || '42, 100 Feet Road, Indiranagar, Near Metro Pillar 12',
                city: doc.city || 'Bangalore',
                state: doc.state || 'Karnataka',
                country: doc.country || 'India',
                postalCode: doc.postalCode || '560038',
                price: doc.price || '800',
                services: doc.services || specProfile.services,
                experience: doc.experience || '12',
                languages: doc.languages || 'English, Hindi, Kannada',
                registrationCouncil: doc.registrationCouncil || 'Karnataka Medical Council',
                registration: doc.registration || `KMC-${Math.floor(10000 + Math.random() * 90000)}`,
                onlineConsultation: true,
                inPersonConsultation: true,
                approvalStatus: 'APPROVED',
                verified: true,
            }
        });

        // Ensure DoctorEducation exists
        const eduCount = await prisma.doctorEducation.count({ where: { doctorId: doc.id } });
        if (eduCount === 0) {
            await prisma.doctorEducation.createMany({
                data: [
                    {
                        doctorId: doc.id,
                        degree: 'MBBS (Bachelor of Medicine & Surgery)',
                        specialization: 'Medicine & Surgery',
                        college: specProfile.college,
                        startYear: '2004',
                        completionYear: '2009',
                    },
                    {
                        doctorId: doc.id,
                        degree: specProfile.degree.split(',')[1]?.trim() || 'MD / Post Graduate Degree',
                        specialization: specName,
                        college: 'National Premier Institute of Medical Sciences',
                        startYear: '2010',
                        completionYear: '2013',
                    }
                ]
            });
        }

        // Ensure DoctorExperience exists
        const expCount = await prisma.doctorExperience.count({ where: { doctorId: doc.id } });
        if (expCount === 0) {
            await prisma.doctorExperience.createMany({
                data: [
                    {
                        doctorId: doc.id,
                        hospitalName: 'Apollo Super Speciality Hospital',
                        organization: 'Apollo Healthcare Group',
                        designation: 'Senior Registrar & Fellow',
                        department: specName,
                        startDate: '2013-08-01',
                        endDate: '2017-06-30',
                        isCurrent: false,
                        description: 'Managed complex critical inpatients, clinical rounds, and resident training programs.',
                    },
                    {
                        doctorId: doc.id,
                        hospitalName: specProfile.clinicName,
                        organization: 'MediConnect Prime Clinics',
                        designation: specProfile.designation,
                        department: specName,
                        startDate: '2017-07-01',
                        endDate: null,
                        isCurrent: true,
                        description: 'Chief consultant leading outpatient clinics, telehealth sessions, and patient management protocols.',
                    }
                ]
            });
        }

        // Ensure DoctorAward exists
        const awardCount = await prisma.doctorAward.count({ where: { doctorId: doc.id } });
        if (awardCount === 0) {
            await prisma.doctorAward.createMany({
                data: [
                    {
                        doctorId: doc.id,
                        title: 'Healthcare Excellence in ' + specName,
                        organization: 'Indian Medical Association (IMA)',
                        year: '2022',
                    },
                    {
                        doctorId: doc.id,
                        title: 'Outstanding Clinical Research Award',
                        organization: 'National Medical Forum',
                        year: '2024',
                    }
                ]
            });
        }
    }
    console.log(`Successfully enriched ${doctors.length} doctors with full profiles, educations, experiences, and awards.`);

    console.log('--- ENRICHING PATIENT MEDICAL PROFILES & REPORTS ---');
    const patients = await prisma.patient.findMany();
    const primaryDoctor = doctors[0];

    const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-'];
    let pIdx = 0;

    for (const pat of patients) {
        const bg = pat.bloodGroup || BLOOD_GROUPS[pIdx % BLOOD_GROUPS.length];
        pIdx++;

        await prisma.patient.update({
            where: { id: pat.id },
            data: {
                mobile: pat.mobile || `+91 91${Math.floor(10000000 + Math.random() * 90000000)}`,
                gender: pat.gender || (pIdx % 2 === 0 ? 'female' : 'male'),
                dateOfBirth: pat.dateOfBirth || new Date('1995-04-12'),
                bloodGroup: bg,
                city: pat.city || 'Bangalore',
                state: pat.state || 'Karnataka',
                country: pat.country || 'India',
                address: pat.address || '7th Main, Koramangala 4th Block, Bangalore',
                zipCode: pat.zipCode || '560034',
                isActive: true,
            }
        });

        // Upsert PatientMedicalHistory
        await prisma.patientMedicalHistory.upsert({
            where: { patientId: pat.id },
            update: {
                bloodGroup: bg,
                allergies: 'Penicillin (mild cutaneous rash), Pollen, House Dust Mites',
                previousDiseases: 'Seasonal Bronchitis (2021), Childhood Chickenpox (2003)',
                existingConditions: 'Mild Essential Hypertension (controlled on medication)',
                currentMedications: 'Telmisartan 20mg Once Daily (morning after breakfast), Multivitamin capsules',
                previousSurgeries: 'Laparoscopic Appendectomy (2019, uneventful recovery)',
                familyHistory: 'Father: Type 2 Diabetes; Mother: Mild Hypertension',
                previousTreatments: 'Physiotherapy for lower back strain (March 2024)',
                notes: 'Patient advised regular moderate exercise, hydration, and salt restriction.',
            },
            create: {
                patientId: pat.id,
                bloodGroup: bg,
                allergies: 'Penicillin (mild cutaneous rash), Pollen, House Dust Mites',
                previousDiseases: 'Seasonal Bronchitis (2021), Childhood Chickenpox (2003)',
                existingConditions: 'Mild Essential Hypertension (controlled on medication)',
                currentMedications: 'Telmisartan 20mg Once Daily (morning after breakfast), Multivitamin capsules',
                previousSurgeries: 'Laparoscopic Appendectomy (2019, uneventful recovery)',
                familyHistory: 'Father: Type 2 Diabetes; Mother: Mild Hypertension',
                previousTreatments: 'Physiotherapy for lower back strain (March 2024)',
                notes: 'Patient advised regular moderate exercise, hydration, and salt restriction.',
            }
        });

        // Ensure sample medical reports exist for each patient
        const existingReports = await prisma.medicalReport.count({ where: { patientId: pat.id } });
        if (existingReports === 0) {
            await prisma.medicalReport.createMany({
                data: [
                    {
                        patientId: pat.id,
                        doctorId: primaryDoctor ? primaryDoctor.id : null,
                        category: 'IMAGING',
                        reportType: 'X-Ray',
                        reportTitle: 'Digital Chest X-Ray (PA View)',
                        hospitalOrLab: 'Manipal Diagnostic Imaging Center',
                        testDate: new Date('2026-09-14'),
                        reportDate: new Date('2026-09-15'),
                        description: 'High-resolution digital radiograph of chest PA view evaluating persistent seasonal cough.',
                        doctorComments: 'Bilateral lung fields clear. Bronchovascular markings normal. Cardiac silhouette within normal limits. Costophrenic angles sharp.',
                        status: 'completed',
                        uploadedBy: 'doctor',
                        fileUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1000&auto=format&fit=crop&q=80',
                        fileName: 'chest-xray-pa-view-digital.jpg',
                        fileMimeType: 'image/jpeg',
                        fileSize: 1845200,
                    },
                    {
                        patientId: pat.id,
                        doctorId: primaryDoctor ? primaryDoctor.id : null,
                        category: 'IMAGING',
                        reportType: 'MRI',
                        reportTitle: 'Lumbar Spine MRI (L1-S1 Scan)',
                        hospitalOrLab: 'Apex Neuro & Diagnostic Imaging',
                        testDate: new Date('2026-08-20'),
                        reportDate: new Date('2026-08-21'),
                        description: 'Multi-sequence sagittal and axial MRI of lumbar spine to evaluate intermittent lower back soreness.',
                        doctorComments: 'Mild disc desiccation at L4-L5 level with slight posterior disc bulge. No focal canal stenosis or nerve root impingement observed.',
                        status: 'completed',
                        uploadedBy: 'doctor',
                        fileUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1000&auto=format&fit=crop&q=80',
                        fileName: 'lumbar-spine-mri-scan.jpg',
                        fileMimeType: 'image/jpeg',
                        fileSize: 3412000,
                    },
                    {
                        patientId: pat.id,
                        doctorId: primaryDoctor ? primaryDoctor.id : null,
                        category: 'LABORATORY',
                        reportType: 'Complete Blood Count (CBC)',
                        reportTitle: 'Comprehensive Hematology Panel (CBC with ESR)',
                        hospitalOrLab: 'MediConnect Central Pathology Labs',
                        testDate: new Date('2026-10-02'),
                        reportDate: new Date('2026-10-02'),
                        description: 'Routine complete blood count panel and erythrocyte sedimentation rate evaluation.',
                        doctorComments: 'All hematological parameters within healthy biological reference intervals. No anemia or leukocytosis.',
                        recordResults: {
                            'Hemoglobin (Hb)': '14.5 g/dL (Normal: 13.0 - 17.0)',
                            'Total Leukocyte Count (WBC)': '6,800 /mcL (Normal: 4,000 - 11,000)',
                            'Platelet Count': '245,000 /mcL (Normal: 150,000 - 450,000)',
                            'Packed Cell Volume (PCV)': '43.2 % (Normal: 40 - 50)',
                            'Erythrocyte Sedimentation Rate (ESR)': '9 mm/hr (Normal: < 15)'
                        },
                        status: 'completed',
                        uploadedBy: 'doctor',
                        fileUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
                        fileName: 'hematology-cbc-report.pdf',
                        fileMimeType: 'application/pdf',
                        fileSize: 842100,
                    },
                    {
                        patientId: pat.id,
                        doctorId: primaryDoctor ? primaryDoctor.id : null,
                        category: 'LABORATORY',
                        reportType: 'Metabolic & Lipid Profile',
                        reportTitle: 'Fasting Lipid & Glycemic Health Panel',
                        hospitalOrLab: 'MediConnect Central Pathology Labs',
                        testDate: new Date('2026-10-18'),
                        reportDate: new Date('2026-10-18'),
                        description: 'Overnight fasting lipid panel and HbA1c screening for preventative metabolic health.',
                        doctorComments: 'Excellent glycemic control. HDL is optimal. Maintain current dietary fiber intake and cardio routine.',
                        recordResults: {
                            'Fasting Plasma Glucose (FBS)': '92 mg/dL (Normal: 70 - 99)',
                            'Glycated Hemoglobin (HbA1c)': '5.3 % (Normal: < 5.7)',
                            'Total Cholesterol': '176 mg/dL (Desirable: < 200)',
                            'HDL Cholesterol (Good)': '54 mg/dL (Normal: > 40)',
                            'LDL Cholesterol': '98 mg/dL (Optimal: < 100)',
                            'Serum Triglycerides': '120 mg/dL (Normal: < 150)'
                        },
                        status: 'completed',
                        uploadedBy: 'doctor',
                        fileUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&auto=format&fit=crop&q=80',
                        fileName: 'lipid-metabolic-profile.pdf',
                        fileMimeType: 'application/pdf',
                        fileSize: 712000,
                    }
                ]
            });
        }
    }

    console.log(`Successfully enriched ${patients.length} patients with medical history, imaging records, and lab panels.`);
    console.log('--- ENRICHMENT COMPLETED SUCCESSFULLY ---');
}

main()
    .catch((e) => {
        console.error('Error during enrichment:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
