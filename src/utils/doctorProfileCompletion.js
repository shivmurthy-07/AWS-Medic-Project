/**
 * Calculated professional profile progress for doctors.
 * Breakdown based on Module 5 specifications:
 * - Personal details: 20%
 * - Professional details: 25%
 * - Education: 15%
 * - Experience: 15%
 * - Clinic details: 15%
 * - Profile picture and documents: 10%
 */
export function getDoctorProfileProgress(doctor) {
    if (!doctor) {
        return {
            percent: 0,
            missing: ['Personal details', 'Professional details', 'Education', 'Experience', 'Clinic details', 'Profile picture'],
            complete: false,
            breakdown: { personal: 0, professional: 0, education: 0, experience: 0, clinic: 0, picture: 0 },
        };
    }

    const missing = [];

    // 1. Personal details: 20%
    let personalCount = 0;
    if (doctor.firstName?.trim() && doctor.lastName?.trim()) personalCount++;
    if (doctor.phone?.trim()) personalCount++; else missing.push('Phone number');
    if (doctor.gender) personalCount++; else missing.push('Gender');
    if (doctor.city?.trim() || doctor.dob?.trim()) personalCount++; else missing.push('City or Date of Birth');
    const personalScore = Math.round((personalCount / 4) * 20);

    // 2. Professional details: 25%
    let profCount = 0;
    if (doctor.specialization?.trim()) profCount++; else missing.push('Primary Specialization');
    if (doctor.designation?.trim()) profCount++; else missing.push('Designation');
    if (doctor.registration?.trim()) profCount++; else missing.push('Medical Registration Number');
    if (doctor.biography?.trim() && doctor.biography.trim().length >= 20) profCount++; else missing.push('Professional Biography (min 20 chars)');
    const professionalScore = Math.round((profCount / 4) * 25);

    // 3. Education: 15%
    const hasEducation = (doctor.education && doctor.education.length > 0) ||
        (Boolean(doctor.degree?.trim()) && Boolean(doctor.college?.trim()));
    if (!hasEducation) missing.push('Degree and Medical College');
    const educationScore = hasEducation ? 15 : (doctor.degree?.trim() ? 8 : 0);

    // 4. Experience: 15%
    const hasExperience = (doctor.workExperience && doctor.workExperience.length > 0) || Boolean(doctor.experience?.trim());
    if (!hasExperience) missing.push('Work Experience');
    const experienceScore = hasExperience ? 15 : 0;

    // 5. Clinic details: 15%
    let clinicCount = 0;
    if (doctor.clinicName?.trim()) clinicCount++; else missing.push('Clinic Name');
    if (doctor.clinicAddress?.trim()) clinicCount++; else missing.push('Clinic Address');
    if (doctor.price != null && String(doctor.price).trim()) clinicCount++; else missing.push('Consultation Fee');
    const clinicScore = Math.round((clinicCount / 3) * 15);

    // 6. Profile picture: 10%
    const hasImg = Boolean(doctor.img?.trim());
    if (!hasImg) missing.push('Profile Picture');
    const pictureScore = hasImg ? 10 : 0;

    const totalPercent = Math.min(100, personalScore + professionalScore + educationScore + experienceScore + clinicScore + pictureScore);

    return {
        percent: totalPercent,
        missing,
        complete: totalPercent >= 80,
        breakdown: {
            personal: personalScore,
            professional: professionalScore,
            education: educationScore,
            experience: experienceScore,
            clinic: clinicScore,
            picture: pictureScore,
        },
    };
}
