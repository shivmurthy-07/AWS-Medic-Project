import prisma from '../../../shared/prisma';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    reply: string;
    isEmergency?: boolean;
    doctors?: Array<{
        id: string;
        name: string;
        specialization: string;
        degree: string | null;
        clinicName: string | null;
        clinicAddress: string | null;
        city: string | null;
        price: string | null;
        img: string | null;
        phone: string | null;
    }>;
    quickReplies?: string[];
    actions?: Array<{
        label: string;
        link: string;
        type: 'primary' | 'secondary' | 'danger';
    }>;
}

const SPECIALTY_KEYWORDS: Record<string, string[]> = {
    Cardiology: ['heart', 'cardiac', 'cardiology', 'cardiologist', 'chest pain', 'palpitation', 'palpitations', 'cholesterol', 'blood pressure', 'hypertension', 'ecg', 'angioplasty', 'arrhythmia', 'heart problem'],
    Dentistry: ['tooth', 'teeth', 'dental', 'dentist', 'dentistry', 'cavity', 'root canal', 'gums', 'implant', 'orthodontics', 'braces', 'oral', 'smile', 'toothache', 'tooth ache', 'teeth pain'],
    Dermatology: ['skin', 'rash', 'acne', 'pimples', 'eczema', 'psoriasis', 'derma', 'dermatology', 'dermatologist', 'hair loss', 'scalp', 'allergy', 'itching'],
    Neurology: ['brain', 'neuro', 'neurology', 'neurologist', 'headache', 'migraine', 'nerve', 'seizure', 'epilepsy', 'stroke', 'paralysis', 'tremor'],
    Pediatrics: ['child', 'children', 'baby', 'infant', 'pediatric', 'pediatrics', 'pediatrician', 'kid', 'kids', 'vaccination', 'newborn', 'measles'],
    Orthopedics: ['bone', 'joint', 'ortho', 'orthopedic', 'orthopedics', 'fracture', 'knee', 'knee pain', 'spine', 'back pain', 'backache', 'arthritis', 'shoulder', 'ligament'],
    Ophthalmology: ['eye', 'vision', 'cataract', 'glaucoma', 'ophthalmology', 'ophthalmologist', 'eye doctor', 'retina', 'lasik', 'blurry', 'specs', 'glasses', 'eye pain'],
    Gynecology: ['women', 'pregnancy', 'pregnant', 'gynec', 'gynecology', 'gynecologist', 'pcos', 'pcod', 'period', 'menstruation', 'maternity', 'fertility'],
    Psychiatry: ['mental', 'depression', 'anxiety', 'stress', 'psychiatrist', 'psychiatry', 'panic', 'adhd', 'sleep', 'insomnia', 'bipolar', 'counseling'],
    'General Medicine': ['fever', 'cold', 'cough', 'flu', 'general physician', 'checkup', 'weakness', 'fatigue', 'internal medicine', 'physician', 'body pain'],
    ENT: ['ear', 'nose', 'throat', 'ent', 'hearing', 'sinus', 'tonsil', 'voice', 'vertigo', 'sinusitis', 'ear pain', 'sore throat'],
    Oncology: ['cancer', 'tumor', 'oncology', 'oncologist', 'chemotherapy', 'biopsy', 'radiation'],
    Urology: ['urine', 'kidney stone', 'bladder', 'prostate', 'urinary', 'urology', 'urologist'],
    Gastroenterology: ['stomach', 'gastric', 'liver', 'digestion', 'acid', 'acidity', 'endoscopy', 'gut', 'gastro', 'colon', 'gastroenterology', 'gastroenterologist', 'stomach pain'],
    Pulmonology: ['lungs', 'breath', 'breathing', 'asthma', 'coughing', 'copd', 'respiratory', 'wheezing', 'pulmonology', 'pulmonologist'],
    Endocrinology: ['diabetes', 'thyroid', 'hormone', 'sugar', 'insulin', 'endocrine', 'endocrinology', 'endocrinologist'],
    Nephrology: ['kidney', 'dialysis', 'creatinine', 'renal', 'nephro', 'nephrology', 'nephrologist'],
    'Emergency Medicine': ['emergency', 'urgent', 'casualty', 'accident', 'trauma'],
};

const EMERGENCY_PATTERNS = [
    /\b(?:severe chest pain|heart attack|crushing chest)\b/i,
    /\b(?:cannot breathe|unable to breathe|severe shortness of breath)\b/i,
    /\b(?:unconscious|passed out|fainted and unresponsive)\b/i,
    /\b(?:stroke|facial drooping|arm numbness|speech slurred)\b/i,
    /\b(?:profuse bleeding|heavy bleeding|hemorrhage)\b/i,
    /\b(?:poison|poisoning|overdose)\b/i,
];

const matchKeyword = (text: string, kw: string): boolean => {
    // If keyword is a short acronym (<= 3 chars, e.g. 'ent', 'flu', 'ecg'), use word boundary
    if (kw.length <= 3) {
        const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(text);
    }
    return text.includes(kw);
};

export const processChatMessage = async (
    userMessage: string,
    history?: ChatMessage[]
): Promise<ChatResponse> => {
    const raw = userMessage.trim();
    const lower = raw.toLowerCase();

    // 1. Critical Emergency Alert
    const isEmergency = EMERGENCY_PATTERNS.some((pattern) => pattern.test(lower));
    if (isEmergency) {
        return {
            reply: `🚨 **MEDICAL EMERGENCY ALERT**\n\nBased on the symptoms you described, **immediate medical attention is required!**\n\n- **Call Emergency Services immediately:** Dial **112** (All India Emergency) or **108** (Ambulance).\n- Head immediately to the nearest Emergency Department.\n- Do not attempt to drive yourself.\n\nOur affiliated 24x7 Emergency Units include:\n• **Apollo Speciality Hospital Emergency Unit** — 21/2, 14th Cross, Jayanagar\n• **Manipal Hospital 24/7 Trauma Care** — HAL Old Airport Road\n• **Aster CMI Hospital Emergency** — NH 44, Hebbal`,
            isEmergency: true,
            quickReplies: ['Call Emergency (112)', 'Emergency Hospitals', 'Find an Ambulance'],
            actions: [
                { label: 'View Emergency Departments', link: '/doctors?search=Emergency', type: 'danger' },
                { label: 'Find Available Doctors', link: '/doctors', type: 'primary' },
            ],
        };
    }

    // 2. Doctor List / General Doctor Search ("doctor list", "doctors list", "show doctors", "all doctors", "who are the doctors")
    const isDoctorListQuery = /\b(?:doctor\s*list|doctors\s*list|list\s*of\s*doctors|all\s*doctors|show\s*doctors|view\s*doctors|find\s*doctors|available\s*doctors|who\s*are\s*the\s*doctors)\b/i.test(lower);
    if (isDoctorListQuery) {
        const topDoctors = await prisma.doctor.findMany({
            where: { approvalStatus: 'APPROVED' },
            take: 4,
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                specialization: true,
                degree: true,
                clinicName: true,
                clinicAddress: true,
                city: true,
                price: true,
                img: true,
                phone: true,
            },
        });

        const docList = topDoctors.map((d) => ({
            id: d.id,
            name: `Dr. ${d.firstName} ${d.lastName}`,
            specialization: d.specialization || 'Specialist',
            degree: d.degree,
            clinicName: d.clinicName,
            clinicAddress: d.clinicAddress,
            city: d.city,
            price: d.price,
            img: d.img,
            phone: d.phone,
        }));

        return {
            reply: `👨‍⚕️ **Verified Doctors on MediConnect:**\n\nHere are some of our top specialists currently available for both **In-Person** clinic visits and **Online Video** consultations:\n\n• **Dr. Bhavan Kumar** — Dentistry (MDS Endodontics)\n• **Dr. Rahul Sharma** — Cardiology (MD, DM Interventional)\n• **Dr. Priya Reddy** — Dermatology (MD, DNB)\n• **Dr. Arjun Patel** — Neurology (MD, DM Neurology)\n\nYou can click **"Book Now"** on any doctor below, or view our complete medical directory:`,
            doctors: docList,
            quickReplies: ['Cardiology', 'Dentistry', 'Dermatology', 'Pediatrics', 'Orthopedics', 'View All 22 Doctors'],
            actions: [
                { label: 'Browse All 22 Doctors', link: '/doctors', type: 'primary' },
                { label: 'My Appointments', link: '/dashboard/appointments', type: 'secondary' },
            ],
        };
    }

    // 3. Navigation & Platform Inquiries (Check booking, reports, fees, prescriptions BEFORE specialty so "how to book" doesn't clash)
    if (/\b(?:book|booking|appointment|appointments|schedule|time\s*slot|slots)\b/i.test(lower) && !/\b(?:cancel|cancelling)\b/i.test(lower)) {
        return {
            reply: `📅 **How to Book an Appointment on MediConnect:**\n\n1. Go to **[Find Doctors](/doctors)** and choose your specialty or doctor.\n2. Select your preferred **Date & Time Slot**.\n3. Choose your **Consultation Type** (Initial Consultation, Follow-up, Routine Checkup) & Mode (In-Person or Online Video).\n4. Confirm patient information and review the dynamic fee breakdown.\n5. Complete payment (simulated card or pay at clinic cash) and your appointment is scheduled immediately!`,
            quickReplies: ['Find Doctors', 'My Appointments', 'Consultation Fees', 'Help'],
            actions: [
                { label: 'Explore Doctors Now', link: '/doctors', type: 'primary' },
                { label: 'My Appointments', link: '/dashboard/appointments', type: 'secondary' },
            ],
        };
    }

    if (/\b(?:report|reports|xray|x-ray|mri|ct\s*scan|ultrasound|ecg|lab|laboratory|blood\s*test|lipid|cbc|sugar)\b/i.test(lower)) {
        return {
            reply: `📑 **Accessing Your Medical Records & Diagnostic Reports:**\n\nPatients can view and download all diagnostic documents securely:\n\n• **[X-Ray & Imaging Reports](/dashboard/imaging-reports)**: Digital X-Rays, MRIs, CT Scans, Ultrasounds, and ECGs.\n• **[Laboratory Reports](/dashboard/lab-reports)**: CBC, Blood Sugar, Lipid panels, Kidney/Liver panels with reference ranges.\n• **[Medical History](/dashboard/medical-records)**: Chronic conditions, allergies, medications, and surgical history.`,
            quickReplies: ['Imaging Reports', 'Lab Reports', 'Medical History', 'My Prescriptions'],
            actions: [
                { label: 'View Imaging Reports', link: '/dashboard/imaging-reports', type: 'primary' },
                { label: 'View Lab Reports', link: '/dashboard/lab-reports', type: 'secondary' },
                { label: 'Medical History', link: '/dashboard/medical-records', type: 'secondary' },
            ],
        };
    }

    if (/\b(?:fee|fees|price|pricing|cost|how\s*much|rate|rates|charges|payment|payments|pay)\b/i.test(lower)) {
        return {
            reply: `💳 **MediConnect Dynamic Consultation Fees:**\n\nOur platform calculates transparent, specialization-based consultation fees:\n\n• **Routine Checkups & Follow-ups:** ₹350 - ₹600\n• **Specialist Initial Consultations:** ₹600 - ₹1,200\n• **Super-Speciality Consultations (Cardiology, Neurology, Oncology):** ₹800 - ₹1,800\n• **Standard Booking Convenience Fee:** ₹10\n• **Applicable Healthcare VAT/GST:** 15%\n\nFees are computed automatically before confirmation so you never encounter hidden charges.`,
            quickReplies: ['Find Doctors', 'Book Appointment', 'Payment History', 'Super Admin Fees'],
            actions: [
                { label: 'Browse Doctors & Fees', link: '/doctors', type: 'primary' },
                { label: 'Payment History', link: '/dashboard/payment-history', type: 'secondary' },
            ],
        };
    }

    if (/\b(?:prescription|prescriptions|medicine|medicines|dosage|drugs|medication|tablets)\b/i.test(lower)) {
        return {
            reply: `💊 **Digital Prescriptions:**\n\nAfter your consultation, your doctor issues a digital prescription that includes prescribed medicines, dosage, frequency, duration, and instructions.\n\nYou can view and download all past and active prescriptions under **[Prescriptions](/dashboard/prescription)** in your dashboard.`,
            quickReplies: ['View Prescriptions', 'Book Follow-up', 'My Dashboard'],
            actions: [
                { label: 'Open Prescriptions', link: '/dashboard/prescription', type: 'primary' },
                { label: 'Go to Dashboard', link: '/dashboard', type: 'secondary' },
            ],
        };
    }

    // 4. Direct Doctor Search by name
    const doctorNameMatch = await prisma.doctor.findFirst({
        where: {
            approvalStatus: 'APPROVED',
            OR: [
                { firstName: { contains: lower } },
                { lastName: { contains: lower } },
            ],
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
            degree: true,
            clinicName: true,
            clinicAddress: true,
            city: true,
            price: true,
            img: true,
            phone: true,
        },
    });

    if (doctorNameMatch && (matchKeyword(lower, doctorNameMatch.firstName) || matchKeyword(lower, doctorNameMatch.lastName))) {
        return {
            reply: `Here are the verified details for **Dr. ${doctorNameMatch.firstName} ${doctorNameMatch.lastName}** (${doctorNameMatch.specialization || 'Specialist'}):\n\n• **Degree:** ${doctorNameMatch.degree || 'MD'}\n• **Clinic:** ${doctorNameMatch.clinicName || 'MediConnect Clinic'} (${doctorNameMatch.clinicAddress || doctorNameMatch.city})\n• **Consultation Fee:** ₹${doctorNameMatch.price || '500'}\n• **Phone:** ${doctorNameMatch.phone || '+91 9876543210'}\n\nYou can book an online or in-person consultation directly below:`,
            doctors: [
                {
                    id: doctorNameMatch.id,
                    name: `Dr. ${doctorNameMatch.firstName} ${doctorNameMatch.lastName}`,
                    specialization: doctorNameMatch.specialization || 'Specialist',
                    degree: doctorNameMatch.degree,
                    clinicName: doctorNameMatch.clinicName,
                    clinicAddress: doctorNameMatch.clinicAddress,
                    city: doctorNameMatch.city,
                    price: doctorNameMatch.price,
                    img: doctorNameMatch.img,
                    phone: doctorNameMatch.phone,
                },
            ],
            quickReplies: ['Book Appointment', 'Check Time Slots', 'View Profile', 'Other Doctors'],
            actions: [
                { label: `Book Dr. ${doctorNameMatch.firstName}`, link: `/booking/${doctorNameMatch.id}`, type: 'primary' },
                { label: 'View Profile', link: `/doctors/profile/${doctorNameMatch.id}`, type: 'secondary' },
            ],
        };
    }

    // 5. Identify Medical Specialization with word boundary matching
    let detectedSpecialty: string | null = null;
    for (const [specialty, keywords] of Object.entries(SPECIALTY_KEYWORDS)) {
        if (keywords.some((kw) => matchKeyword(lower, kw))) {
            detectedSpecialty = specialty;
            break;
        }
    }

    if (detectedSpecialty) {
        const matchingDoctors = await prisma.doctor.findMany({
            where: {
                approvalStatus: 'APPROVED',
                OR: [
                    { specialization: { contains: detectedSpecialty } },
                    { services: { contains: detectedSpecialty } },
                ],
            },
            take: 3,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                specialization: true,
                degree: true,
                clinicName: true,
                clinicAddress: true,
                city: true,
                price: true,
                img: true,
                phone: true,
            },
        });

        const docList = matchingDoctors.map((d) => ({
            id: d.id,
            name: `Dr. ${d.firstName} ${d.lastName}`,
            specialization: d.specialization || detectedSpecialty || 'Specialist',
            degree: d.degree,
            clinicName: d.clinicName,
            clinicAddress: d.clinicAddress,
            city: d.city,
            price: d.price,
            img: d.img,
            phone: d.phone,
        }));

        return {
            reply: `I found verified **${detectedSpecialty}** specialists on MediConnect for your concern.\n\nOur doctors offer In-Person clinic consultations as well as secure Online Teleconsultations. Tap **"Book Now"** on any specialist below:`,
            doctors: docList,
            quickReplies: ['Book Appointment', 'Consultation Fees', 'View All Doctors', 'Check Available Slots'],
            actions: [
                { label: `View All ${detectedSpecialty} Doctors`, link: `/doctors?specialist=${encodeURIComponent(detectedSpecialty)}`, type: 'primary' },
                { label: 'Patient Dashboard', link: '/dashboard', type: 'secondary' },
            ],
        };
    }

    if (lower.includes('profile') || lower.includes('address') || lower.includes('phone') || lower.includes('dob') || lower.includes('my profile')) {
        return {
            reply: `👤 **Patient Profile Management:**\n\nUnder **[My Profile](/dashboard/my-profile)**, you can:\n\n• Update your residential street address, city, and PIN code.\n• Update your contact mobile number.\n• Record your blood group and date of birth.\n• Manage account settings.\n\nYour profile details are automatically linked to your consultations and diagnostic reports.`,
            quickReplies: ['My Profile', 'Medical Records', 'Go to Dashboard'],
            actions: [
                { label: 'Go to My Profile', link: '/dashboard/my-profile', type: 'primary' },
                { label: 'Patient Dashboard', link: '/dashboard', type: 'secondary' },
            ],
        };
    }

    if (lower.includes('what is') || lower.includes('about') || lower.includes('mediconnect') || lower.includes('project') || lower.includes('platform')) {
        return {
            reply: `🏥 **About MediConnect Healthcare Platform:**\n\nMediConnect is a comprehensive healthcare appointment and medical records scheduling platform:\n\n• 👨‍⚕️ **22 Verified Specialists** across 18 medical disciplines.\n• 📅 **Seamless Booking**: In-Person clinic visits or secure Online Video consultations.\n• 📑 **Digital Diagnostic Hub**: Instant access to X-Rays, MRIs, and Laboratory panels.\n• 💳 **Dynamic Transparent Pricing**: Tailored fees by specialty and consultation type.\n• 🔒 **Strict Medical Privacy**: Encrypted data storage and authenticated document access.`,
            quickReplies: ['Doctor List', 'Book Appointment', 'View Reports', 'Consultation Fees'],
            actions: [
                { label: 'Find Doctors', link: '/doctors', type: 'primary' },
                { label: 'Patient Dashboard', link: '/dashboard', type: 'secondary' },
            ],
        };
    }

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('help')) {
        return {
            reply: `👋 **Hello! I'm MediBot, your MediConnect Healthcare Assistant.**\n\nHow can I help you today?\n\n• 👨‍⚕️ **Doctors List**: Ask *"show me doctors"* or *"I need a cardiologist"*\n• 📅 **Book an Appointment**: Ask *"how to book"* or choose a specialty\n• 📑 **Diagnostic Reports**: Access X-Rays, MRIs, and Blood tests\n• 💳 **Fees & Charges**: Check transparent consultation fees\n\nSelect a quick option below or describe your health concern:`,
            quickReplies: [
                '👨‍⚕️ Doctors List',
                '❤️ Heart Care',
                '🦷 Dental Care',
                '👶 Child Health',
                '🦴 Bone & Joint',
                '📅 Book Appointment',
                '📑 My Reports',
                '💳 Consultation Fees',
            ],
            actions: [
                { label: 'Browse All Doctors', link: '/doctors', type: 'primary' },
                { label: 'Patient Dashboard', link: '/dashboard', type: 'secondary' },
            ],
        };
    }

    // Default Fallback with Helpful Guidance
    return {
        reply: `I understand you are asking about: *" ${raw} "*. \n\nAs your MediConnect Assistant, I can match you with verified medical specialists, guide you through booking appointments, or help you locate diagnostic reports.\n\nCould you specify your health concern or symptom (e.g. *doctor list, fever, chest pain, toothache, skin rash, child health*), or select a quick option below?`,
        quickReplies: [
            '👨‍⚕️ Doctors List',
            'Book an Appointment',
            'View Medical Reports',
            'Consultation Fees',
            'Emergency Help',
        ],
        actions: [
            { label: 'Find a Doctor', link: '/doctors', type: 'primary' },
            { label: 'Go to Dashboard', link: '/dashboard', type: 'secondary' },
        ],
    };
};

export const ChatbotService = {
    processChatMessage,
};
