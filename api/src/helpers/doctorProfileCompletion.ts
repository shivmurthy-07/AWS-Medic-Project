export type DoctorProfileInput = {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    gender?: string | null;
    dob?: string | null;
    city?: string | null;
    specialization?: string | null;
    designation?: string | null;
    registration?: string | null;
    biography?: string | null;
    degree?: string | null;
    college?: string | null;
    experience?: string | null;
    clinicName?: string | null;
    clinicAddress?: string | null;
    price?: string | null;
    img?: string | null;
    education?: any[] | null;
    workExperience?: any[] | null;
    awardsCertifications?: any[] | null;
};

export const getDoctorProfileProgress = (doctor?: DoctorProfileInput | null) => {
    if (!doctor) {
        return {
            percent: 0,
            complete: false,
            breakdown: { personal: 0, professional: 0, education: 0, experience: 0, clinic: 0, picture: 0 },
            missingFields: ['Personal details', 'Professional details', 'Education', 'Experience', 'Clinic details', 'Profile picture'],
        };
    }

    const missingFields: string[] = [];

    // 1. Personal details: 20%
    // Needs firstName, lastName, phone, gender, city/address
    let personalCount = 0;
    if (doctor.firstName?.trim() && doctor.lastName?.trim()) personalCount++;
    if (doctor.phone?.trim()) personalCount++; else missingFields.push('Phone number');
    if (doctor.gender) personalCount++; else missingFields.push('Gender');
    if (doctor.city?.trim() || doctor.dob?.trim()) personalCount++; else missingFields.push('City or Date of Birth');
    const personalScore = Math.round((personalCount / 4) * 20);

    // 2. Professional details: 25%
    // Needs specialization, designation, registration, biography
    let profCount = 0;
    if (doctor.specialization?.trim()) profCount++; else missingFields.push('Primary Specialization');
    if (doctor.designation?.trim()) profCount++; else missingFields.push('Designation');
    if (doctor.registration?.trim()) profCount++; else missingFields.push('Medical Registration Number');
    if (doctor.biography?.trim() && doctor.biography.trim().length >= 20) profCount++; else missingFields.push('Professional Biography');
    const professionalScore = Math.round((profCount / 4) * 25);

    // 3. Education: 15%
    // Has degree & college or has education list items
    const hasEducation = (doctor.education && doctor.education.length > 0) ||
        (Boolean(doctor.degree?.trim()) && Boolean(doctor.college?.trim()));
    if (!hasEducation) missingFields.push('Degree and Medical College');
    const educationScore = hasEducation ? 15 : (doctor.degree?.trim() ? 8 : 0);

    // 4. Experience: 15%
    // Has experience field or workExperience list
    const hasExperience = (doctor.workExperience && doctor.workExperience.length > 0) || Boolean(doctor.experience?.trim());
    if (!hasExperience) missingFields.push('Work Experience');
    const experienceScore = hasExperience ? 15 : 0;

    // 5. Clinic details: 15%
    // Has clinicName, clinicAddress, price
    let clinicCount = 0;
    if (doctor.clinicName?.trim()) clinicCount++; else missingFields.push('Clinic Name');
    if (doctor.clinicAddress?.trim()) clinicCount++; else missingFields.push('Clinic Address');
    if (doctor.price?.trim()) clinicCount++; else missingFields.push('Consultation Fee');
    const clinicScore = Math.round((clinicCount / 3) * 15);

    // 6. Profile picture: 10%
    const hasImg = Boolean(doctor.img?.trim());
    if (!hasImg) missingFields.push('Profile Picture');
    const pictureScore = hasImg ? 10 : 0;

    const totalPercent = Math.min(100, personalScore + professionalScore + educationScore + experienceScore + clinicScore + pictureScore);

    return {
        percent: totalPercent,
        complete: totalPercent >= 80,
        breakdown: {
            personal: personalScore,
            professional: professionalScore,
            education: educationScore,
            experience: experienceScore,
            clinic: clinicScore,
            picture: pictureScore,
        },
        missingFields,
    };
};
