const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REAL_IMAGES = {
    xray: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1200&auto=format&fit=crop&q=80',
    mri: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&auto=format&fit=crop&q=80',
    ecg: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80',
    ultrasound: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&auto=format&fit=crop&q=80',
};

async function main() {
    console.log('--- Updating Medical Reports with Authentic Clinical Radiographs & Lab Panels ---');

    // 1. Update all existing X-Ray reports
    const xrayUpdate = await prisma.medicalReport.updateMany({
        where: {
            OR: [
                { reportType: { contains: 'X-Ray' } },
                { reportTitle: { contains: 'X-Ray' } },
                { reportType: { contains: 'xray' } },
            ]
        },
        data: {
            fileUrl: REAL_IMAGES.xray,
            fileName: 'digital-chest-xray-pa-view.jpg',
            fileMimeType: 'image/jpeg',
            hospitalOrLab: 'Apex Radio-Diagnostic & Imaging Center',
            doctorComments: 'Bilateral lung fields well aerated with clear costophrenic angles. Cardiothoracic ratio 0.46 (Normal < 0.50). Trachea midline. Thoracic cage intact without acute fracture or focal consolidation.',
            status: 'completed',
        }
    });
    console.log(`Updated ${xrayUpdate.count} X-Ray report(s) with real radiographs.`);

    // 2. Update all existing MRI reports
    const mriUpdate = await prisma.medicalReport.updateMany({
        where: {
            OR: [
                { reportType: { contains: 'MRI' } },
                { reportTitle: { contains: 'MRI' } },
            ]
        },
        data: {
            fileUrl: REAL_IMAGES.mri,
            fileName: 'lumbar-spine-mri-multiplanar.jpg',
            fileMimeType: 'image/jpeg',
            hospitalOrLab: 'Apex Neuro & Diagnostic Imaging',
            doctorComments: 'Multi-sequence sagittal & axial T1/T2 MRI of lumbar spine shows physiological lordosis. L4-L5 demonstrates mild disc desiccation with subtle posterior disc bulge; neural exit foramina remain widely patent bilaterally.',
            status: 'completed',
        }
    });
    console.log(`Updated ${mriUpdate.count} MRI report(s) with real scan images.`);

    // 3. Update CBC blood reports with rich parameters
    const allCbcReports = await prisma.medicalReport.findMany({
        where: {
            OR: [
                { reportTitle: { contains: 'CBC' } },
                { reportTitle: { contains: 'Hematology' } },
                { reportType: { contains: 'CBC' } },
                { reportType: { contains: 'Blood' } },
            ]
        }
    });
    for (const rep of allCbcReports) {
        await prisma.medicalReport.update({
            where: { id: rep.id },
            data: {
                hospitalOrLab: 'Apollo Clinical Diagnostics & Pathology Lab',
                recordResults: {
                    'Hemoglobin (Hb)': '14.5 g/dL (Normal: 13.0 - 17.0)',
                    'Total Leukocyte Count (WBC)': '6,800 /mcL (Normal: 4,000 - 11,000)',
                    'Platelet Count': '245,000 /mcL (Normal: 150,000 - 450,000)',
                    'Packed Cell Volume (PCV)': '43.2 % (Normal: 40 - 50)',
                    'Erythrocyte Sedimentation Rate (ESR)': '9 mm/1st hr (Normal: < 15)',
                    'Neutrophils': '62 % (Normal: 40 - 70)',
                    'Lymphocytes': '28 % (Normal: 20 - 40)',
                    'Eosinophils': '3 % (Normal: 1 - 6)',
                    'Monocytes': '5 % (Normal: 2 - 8)',
                    'Basophils': '0.8 % (Normal: 0.5 - 1.0)',
                },
                doctorComments: 'All hematological parameters within healthy biological reference intervals. Red cell indices show normocytic normochromic morphology.',
            }
        });
    }
    console.log(`Updated ${allCbcReports.length} Hematology report(s) with detailed clinical parameters.`);

    // 4. Update Lipid & Metabolic reports
    const allLipidReports = await prisma.medicalReport.findMany({
        where: {
            OR: [
                { reportTitle: { contains: 'Lipid' } },
                { reportTitle: { contains: 'Metabolic' } },
                { reportType: { contains: 'Lipid' } },
            ]
        }
    });
    for (const rep of allLipidReports) {
        await prisma.medicalReport.update({
            where: { id: rep.id },
            data: {
                hospitalOrLab: 'Apollo Clinical Diagnostics & Pathology Lab',
                recordResults: {
                    'Fasting Plasma Glucose (FBS)': '92 mg/dL (Normal: 70 - 99)',
                    'Glycated Hemoglobin (HbA1c)': '5.3 % (Normal: < 5.7)',
                    'Total Serum Cholesterol': '176 mg/dL (Desirable: < 200)',
                    'HDL Cholesterol (Good)': '54 mg/dL (Normal: > 40)',
                    'LDL Cholesterol (Bad)': '98 mg/dL (Optimal: < 100)',
                    'Serum Triglycerides': '120 mg/dL (Normal: < 150)',
                    'VLDL Cholesterol': '24 mg/dL (Normal: 5 - 30)',
                    'Total Cholesterol / HDL Ratio': '3.2 (Normal: < 4.5)',
                },
                doctorComments: 'Optimal metabolic profile. Fasting plasma glucose and HbA1c reflect normal glycemic control. Lipid fractions are in the cardio-protective range.',
            }
        });
    }
    console.log(`Updated ${allLipidReports.length} Lipid profile report(s) with detailed clinical parameters.`);

    // 5. Ensure Ultrasound and ECG reports are also present for each patient
    const patients = await prisma.patient.findMany({
        select: { id: true, firstName: true, lastName: true }
    });
    const defaultDoctor = await prisma.doctor.findFirst({
        where: { approvalStatus: 'APPROVED' }
    });

    let addedImagingCount = 0;
    for (const patient of patients) {
        // Check for Ultrasound
        const hasUltrasound = await prisma.medicalReport.count({
            where: {
                patientId: patient.id,
                OR: [
                    { reportType: { contains: 'Ultrasound' } },
                    { reportTitle: { contains: 'Ultrasound' } },
                ]
            }
        });
        if (hasUltrasound === 0) {
            await prisma.medicalReport.create({
                data: {
                    patientId: patient.id,
                    doctorId: defaultDoctor ? defaultDoctor.id : null,
                    category: 'IMAGING',
                    reportType: 'Ultrasound',
                    reportTitle: 'High-Resolution Abdominal Ultrasound (USG Abdomen)',
                    hospitalOrLab: 'Apex Radio-Diagnostic & Imaging Center',
                    testDate: new Date('2026-07-10'),
                    reportDate: new Date('2026-07-10'),
                    description: 'Ultrasonic sonogram evaluation of hepatobiliary system, spleen, kidneys, and urinary bladder.',
                    doctorComments: 'Liver is normal size with homogeneous echotexture. Gallbladder thin-walled and calculus-free. Bilateral kidneys show normal cortical thickness without hydronephrosis.',
                    status: 'completed',
                    uploadedBy: 'doctor',
                    fileUrl: REAL_IMAGES.ultrasound,
                    fileName: 'abdominal-ultrasound-sonogram.jpg',
                    fileMimeType: 'image/jpeg',
                    fileSize: 2240100,
                }
            });
            addedImagingCount++;
        }

        // Check for ECG
        const hasEcg = await prisma.medicalReport.count({
            where: {
                patientId: patient.id,
                OR: [
                    { reportType: { contains: 'ECG' } },
                    { reportTitle: { contains: 'ECG' } },
                ]
            }
        });
        if (hasEcg === 0) {
            await prisma.medicalReport.create({
                data: {
                    patientId: patient.id,
                    doctorId: defaultDoctor ? defaultDoctor.id : null,
                    category: 'IMAGING',
                    reportType: 'ECG / EKG',
                    reportTitle: '12-Lead Standard Electrocardiogram (Resting ECG)',
                    hospitalOrLab: 'Apex Cardiology & Heart Care Center',
                    testDate: new Date('2026-08-05'),
                    reportDate: new Date('2026-08-05'),
                    description: 'Standard 12-lead surface ECG recorded at 25 mm/s, 10 mm/mV evaluating heart rate, rhythm, and cardiac electrical conduction.',
                    doctorComments: 'Normal Sinus Rhythm at 74 bpm. PR interval 142 ms, QRS duration 86 ms, QTc 412 ms. Normal axis. No ST-T segment elevation or pathological Q waves.',
                    status: 'completed',
                    uploadedBy: 'doctor',
                    fileUrl: REAL_IMAGES.ecg,
                    fileName: '12-lead-standard-resting-ecg.jpg',
                    fileMimeType: 'image/jpeg',
                    fileSize: 1680500,
                }
            });
            addedImagingCount++;
        }
    }
    console.log(`Added ${addedImagingCount} new authentic Ultrasound / ECG imaging records across patients.`);

    console.log('--- Clinical Reports Database Update Completed Successfully ---');
}

main()
    .catch((e) => {
        console.error('Error running update-real-reports:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
