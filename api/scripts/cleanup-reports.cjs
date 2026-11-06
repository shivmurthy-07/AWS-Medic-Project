const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- ENFORCING STRICT APPOINTMENT-TO-REPORT LINKAGE ---');

    // 1. Get Pramod's Chest appointment
    const chestAppt = await prisma.appointments.findFirst({
        where: {
            trackingId: 'CHEST-APT-5BZTYET1'
        }
    });

    // 2. Get Bhoomika's Completed appointment with Dr. Isha
    const bhoomikaAppt = await prisma.appointments.findFirst({
        where: {
            trackingId: '43B3466BE715CB5CEC1103EA46A42EE6'
        }
    });

    // 3. Get Shava's appointment
    const shavaAppt = await prisma.appointments.findFirst({
        where: {
            trackingId: '3388F2CBE34A19BE12312D983CBB7C28'
        }
    });

    // Delete all doctor reports that do not belong to real appointments
    const deletedReports = await prisma.medicalReport.deleteMany({
        where: {
            appointmentId: null
        }
    });
    console.log(`Deleted ${deletedReports.count} unlinked/phantom reports that had no appointment.`);

    // If chestAppt exists, ensure its Digital Chest X-Ray report is created/updated
    if (chestAppt) {
        // Check if report exists for this appointment
        const existingChestReport = await prisma.medicalReport.findFirst({
            where: { appointmentId: chestAppt.id }
        });

        if (!existingChestReport) {
            await prisma.medicalReport.create({
                data: {
                    appointmentId: chestAppt.id,
                    patientId: chestAppt.patientId,
                    doctorId: chestAppt.doctorId,
                    reportType: 'X-Ray',
                    reportTitle: 'Digital Chest X-Ray (PA View)',
                    category: 'IMAGING',
                    hospitalOrLab: 'Apex Radio-Diagnostic & Imaging Center',
                    testDate: new Date('2026-11-06'),
                    reportDate: new Date('2026-11-06'),
                    fileUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1200&auto=format&fit=crop&q=80',
                    fileName: 'digital-chest-xray-pa-view.jpg',
                    fileMimeType: 'image/jpeg',
                    fileSize: 2048500,
                    status: 'completed',
                    uploadedBy: 'doctor',
                    description: 'Digital Radiograph of Chest PA View evaluating substernal chest discomfort and persistent dry cough.',
                    doctorComments: 'Bilateral lung fields clear and well-aerated without consolidation or pleural effusion. Normal cardiothoracic ratio (CTR 0.46). Bony thorax and bilateral costophrenic angles normal.',
                }
            });
            console.log(`Created verified Digital Chest X-Ray for Appointment #${chestAppt.trackingId}`);
        } else {
            await prisma.medicalReport.update({
                where: { id: existingChestReport.id },
                data: {
                    reportType: 'X-Ray',
                    reportTitle: 'Digital Chest X-Ray (PA View)',
                    category: 'IMAGING',
                    fileUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1200&auto=format&fit=crop&q=80',
                    fileName: 'digital-chest-xray-pa-view.jpg',
                    doctorComments: 'Bilateral lung fields clear and well-aerated without consolidation or pleural effusion. Normal cardiothoracic ratio (CTR 0.46). Bony thorax and bilateral costophrenic angles normal.',
                }
            });
            console.log(`Updated Digital Chest X-Ray for Appointment #${chestAppt.trackingId}`);
        }
    }

    // For Bhoomika's completed appointment with Dr. Isha
    if (bhoomikaAppt) {
        const existingBhoomikaReport = await prisma.medicalReport.findFirst({
            where: { appointmentId: bhoomikaAppt.id }
        });

        if (!existingBhoomikaReport) {
            await prisma.medicalReport.create({
                data: {
                    appointmentId: bhoomikaAppt.id,
                    patientId: bhoomikaAppt.patientId,
                    doctorId: bhoomikaAppt.doctorId, // Dr. Isha Malhotra
                    reportType: 'Lab Test',
                    reportTitle: 'Comprehensive Hematology Panel (CBC with ESR)',
                    category: 'LAB',
                    hospitalOrLab: 'Apollo Clinical Diagnostics & Pathology Lab',
                    testDate: new Date(bhoomikaAppt.scheduleDate || '2026-10-25'),
                    reportDate: new Date(bhoomikaAppt.scheduleDate || '2026-10-25'),
                    status: 'completed',
                    uploadedBy: 'doctor',
                    description: 'Comprehensive complete blood count to evaluate post-consultation recovery.',
                    recordResults: {
                        'Hemoglobin (Hb)': '13.8 g/dL (Normal: 12.0 - 15.5)',
                        'Total Leukocyte Count (WBC)': '6,400 /mcL (Normal: 4,000 - 11,000)',
                        'Platelet Count': '220,000 /mcL (Normal: 150,000 - 450,000)',
                        'Erythrocyte Sedimentation Rate (ESR)': '8 mm/1st hr (Normal: < 20)',
                        'Neutrophils': '60 % (Normal: 40 - 70)',
                        'Lymphocytes': '32 % (Normal: 20 - 40)',
                    },
                    doctorComments: 'All hematological parameters within healthy biological reference intervals. Patient stable.',
                }
            });
            console.log(`Created Hematology Report for Bhoomika's Completed Appointment #${bhoomikaAppt.trackingId} with Dr. Isha`);
        }
    }

    // Verify current state
    const allReports = await prisma.medicalReport.findMany({
        include: {
            doctor: { select: { firstName: true, email: true } },
            patient: { select: { firstName: true, email: true } },
            appointment: { select: { trackingId: true, status: true } }
        }
    });

    console.log(`\n=== FINAL VERIFIED REPORTS IN SYSTEM: ${allReports.length} ===`);
    allReports.forEach(r => {
        console.log(`Report [${r.id.substring(0, 8)}] | ${r.reportTitle} | Dr. ${r.doctor?.firstName} (${r.doctor?.email}) -> Patient: ${r.patient?.firstName} (${r.patient?.email}) | Appt: #${r.appointment?.trackingId || 'NONE'}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
