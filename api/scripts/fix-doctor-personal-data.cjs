const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DOCTOR_FIXES = {
    'bhavan.dentistry@medidoc.com': {
        dob: '1986-04-14',
        phone: '+91 9035762007',
        gender: 'male',
        degree: 'BDS, MDS (Endodontics & Restorative Dentistry)',
        college: 'Manipal College of Dental Sciences (MCODS), Manipal',
        designation: 'Chief Dental Surgeon & Endodontist',
        specialization: 'Dentistry',
        biography: 'Dr. Bhavan Kumar is an experienced chief dental specialist and endodontist with 12+ years of clinical excellence in microscopic root canals, smile design, aesthetic ceramic veneers, and comprehensive family oral healthcare.',
    },
    'murthyshiva2027@gmail.com': {
        dob: '1981-08-22',
        phone: '+91 9845123980',
        gender: 'male',
        degree: 'MBBS, MD (General Medicine)',
        college: 'Bangalore Medical College and Research Institute (BMCRI)',
        designation: 'Senior Consultant Physician',
        specialization: 'General Medicine',
        biography: 'Dr. Shivmurthy S is an accomplished medical specialist with 18+ years of extensive clinical training across tertiary hospitals, dedicated to accurate patient diagnostics, ethical chronic disease management, and holistic preventive healthcare.',
    },
    'shreya.dentistry@medidoc.com': {
        dob: '1990-11-05',
        phone: '+91 9880145290',
        gender: 'female',
        degree: 'BDS, MDS (Periodontics & Implantology)',
        college: 'Manipal College of Dental Sciences, Mangalore',
        designation: 'Senior Consultant Periodontist & Implantologist',
        specialization: 'Dentistry',
        biography: 'Dr. Shreya Shetty is a skilled dental surgeon and periodontist with 9+ years of dedicated clinical experience in gum therapy, advanced dental implants, laser periodontal procedures, and comprehensive preventive smile care.',
    },
    'rahul.cardiology@medidoc.com': {
        dob: '1982-03-19',
        phone: '+91 9871683096',
        gender: 'male',
        biography: 'Dr. Rahul Sharma is a board-certified Interventional Cardiologist with 14+ years of clinical excellence in complex coronary interventions, preventive cardiology, echocardiography, and adult heart care.',
    },
    'priya.dermatology@medidoc.com': {
        dob: '1988-07-25',
        phone: '+91 9886675135',
        gender: 'female',
        biography: 'Dr. Priya Reddy is an internationally trained dermatologist specializing in clinical dermatology, advanced laser skin procedures, anti-aging therapies, and persistent chronic dermatological conditions.',
    },
    'arjun.neurology@medidoc.com': {
        dob: '1979-10-12',
        phone: '+91 9827660421',
        gender: 'male',
        biography: 'Dr. Arjun Patel is a distinguished Consultant Neurologist with over 16 years of expertise treating neuromuscular disorders, stroke management, neurodegenerative conditions, and complex chronic migraines.',
    },
    'sneha.pediatrics@medidoc.com': {
        dob: '1987-12-08',
        phone: '+91 9871179011',
        gender: 'female',
        biography: 'Dr. Sneha Rao is a compassionate pediatrician dedicated to comprehensive child wellness from newborn care through adolescence, with a strong focus on developmental pediatrics and preventative immunizations.',
    },
    'kiran.orthopedics@medidoc.com': {
        dob: '1980-05-18',
        phone: '+91 9892331130',
        gender: 'male',
        biography: 'Dr. Kiran Verma is an accomplished orthopedic surgeon specializing in robotic joint replacements, sports injuries, arthroscopic surgeries, and minimally invasive trauma surgery with over 15 years of surgical practice.',
    },
    'ananya.ophthalmology@medidoc.com': {
        dob: '1989-02-14',
        phone: '+91 9863234075',
        gender: 'female',
        biography: 'Dr. Ananya Gupta is an esteemed ophthalmologist focusing on precision refractive surgery, advanced micro-incision cataract surgery, glaucoma management, and anterior segment laser procedures.',
    },
    'meera.gynecology@medidoc.com': {
        dob: '1978-09-30',
        phone: '+91 9825113304',
        gender: 'female',
        biography: 'Dr. Meera Nair brings 18 years of warm, patient-centered obstetrical and gynecological expertise, specializing in high-risk pregnancies, PCOS/PCOD clinics, and minimally invasive gynecological laparoscopic surgery.',
    },
    'rohan.psychiatry@medidoc.com': {
        dob: '1985-06-22',
        phone: '+91 9834321728',
        gender: 'male',
        biography: 'Dr. Rohan Das is a compassionate neuropsychiatrist passionate about evidence-based psychiatric evaluations, psychopharmacology, cognitive behavioral therapy, and adult ADHD and depression management.',
    },
    'divya.generalmedicine@medidoc.com': {
        dob: '1986-11-17',
        phone: '+91 9854062008',
        gender: 'female',
        biography: 'Dr. Divya Singh provides comprehensive primary and preventative internal medicine care, dedicated to lifestyle medicine, hypertension and diabetes management, and prompt clinical diagnostic evaluation.',
    },
    'aditya.ent@medidoc.com': {
        dob: '1983-04-05',
        phone: '+91 9840937030',
        gender: 'male',
        biography: 'Dr. Aditya Jain is an experienced ENT surgeon delivering modern microscopic and endoscopic care for ear, nose, and throat ailments with an emphasis on minimally invasive sinonasal interventions.',
    },
    'kavya.oncology@medidoc.com': {
        dob: '1984-08-11',
        phone: '+91 9841874707',
        gender: 'female',
        biography: 'Dr. Kavya Menon is a dedicated medical oncologist committed to personalized targeted cancer therapies, multidisciplinary tumor board care, and compassionate patient-centric oncology support.',
    },
    'nikhil.urology@medidoc.com': {
        dob: '1981-01-29',
        phone: '+91 9876140640',
        gender: 'male',
        biography: 'Dr. Nikhil Shah is a senior consultant urologist with 15+ years of surgical experience in endourology, laser prostate procedures, kidney stone management, and minimally invasive reconstructive urology.',
    },
    'pooja.gastroenterology@medidoc.com': {
        dob: '1987-03-16',
        phone: '+91 9827179872',
        gender: 'female',
        biography: 'Dr. Pooja Iyer is a consultant medical gastroenterologist and hepatologist with expertise in diagnostic and therapeutic upper GI endoscopy, colonoscopy, IBD, and chronic liver diseases.',
    },
    'varun.pulmonology@medidoc.com': {
        dob: '1983-12-04',
        phone: '+91 9891928052',
        gender: 'male',
        biography: 'Dr. Varun Joshi is a respiratory medicine specialist dedicated to the comprehensive management of adult asthma, COPD, interstitial lung diseases, sleep apnea, and post-COVID pulmonary rehabilitation.',
    },
    'asha.endocrinology@medidoc.com': {
        dob: '1980-07-19',
        phone: '+91 9846031979',
        gender: 'female',
        biography: 'Dr. Asha Kulkarni is an experienced consultant endocrinologist specializing in complex diabetes management, thyroid disorders, pituitary diseases, and osteoporosis management.',
    },
    'vivek.nephrology@medidoc.com': {
        dob: '1979-05-23',
        phone: '+91 9830171389',
        gender: 'male',
        biography: 'Dr. Vivek Mishra is a senior nephrologist with 17+ years of experience in clinical nephrology, dialysis management, acute kidney injury interventions, and preventative renal medicine.',
    },
    'neha.radiology@medidoc.com': {
        dob: '1988-10-14',
        phone: '+91 9841466214',
        gender: 'female',
        biography: 'Dr. Neha Chopra is a diagnostic radiologist specializing in musculoskeletal MRI, cross-sectional abdominal CT imaging, high-resolution ultrasound, and breast imaging diagnostics.',
    },
    'sanjay.anesthesiology@medidoc.com': {
        dob: '1977-02-08',
        phone: '+91 9840995548',
        gender: 'male',
        biography: 'Dr. Sanjay Raman is a senior consultant anesthesiologist and critical care physician with extensive experience in neuro-anesthesia, cardiac anesthesia, and advanced acute perioperative care.',
    },
    'isha.emergencymedicine@medidoc.com': {
        dob: '1989-09-02',
        phone: '+91 9858325357',
        gender: 'female',
        biography: 'Dr. Isha Malhotra is an emergency medicine specialist certified in advanced trauma life support, resuscitation, acute emergency toxicology, and critical medical emergencies.',
    },
};

async function main() {
    console.log('--- FIXING DOCTOR DATES OF BIRTH, BIOGRAPHIES, AND PHONES ---');
    const doctors = await prisma.doctor.findMany();

    for (const doc of doctors) {
        const fix = DOCTOR_FIXES[doc.email];
        if (fix) {
            await prisma.doctor.update({
                where: { id: doc.id },
                data: fix,
            });
            console.log(`Updated ${doc.firstName} ${doc.lastName} (${doc.email}): DOB=${fix.dob}, Phone=${fix.phone}, Bio=${fix.biography.length} chars`);
        } else {
            // General safety fallback if any unknown doctor exists
            const dob = doc.dob && !doc.dob.startsWith('202') ? doc.dob : '1985-05-15';
            const phone = doc.phone && doc.phone.length >= 10 ? doc.phone : '+91 9876543210';
            const bio = doc.biography && doc.biography.length >= 30 ? doc.biography : 'Experienced clinical practitioner dedicated to evidence-based healthcare, preventative medicine, and comprehensive patient consultations.';
            await prisma.doctor.update({
                where: { id: doc.id },
                data: { dob, phone, biography: bio },
            });
            console.log(`Fallback updated ${doc.firstName} ${doc.lastName}`);
        }
    }
    console.log('--- ALL DOCTOR PERSONAL DATA FIXED SUCCESSFULLY ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());

