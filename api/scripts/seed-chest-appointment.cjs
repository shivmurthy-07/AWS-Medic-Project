const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Seeding Realistic Chest Chief Complaint Appointment for Pramod ---');

    const pramod = await prisma.patient.findFirst({
        where: { email: 'pramod@gmail.com' }
    });

    if (!pramod) {
        console.error('Patient pramod@gmail.com not found!');
        return;
    }

    const doctor = await prisma.doctor.findFirst({
        where: { approvalStatus: 'APPROVED' }
    });

    if (!doctor) {
        console.error('No approved doctor found!');
        return;
    }

    // Check if chest appointment already exists for Pramod
    const existingChestAppt = await prisma.appointments.findFirst({
        where: {
            patientId: pramod.id,
            reasonForVisit: { contains: 'Chest' }
        }
    });

    let apptId = null;
    if (!existingChestAppt) {
        const newAppt = await prisma.appointments.create({
            data: {
                patientId: pramod.id,
                doctorId: doctor.id,
                trackingId: 'CHEST-APT-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                firstName: pramod.firstName,
                lastName: pramod.lastName,
                email: pramod.email,
                phone: pramod.mobile || '+91 9845123456',
                address: pramod.address || 'Indiranagar, Bangalore',
                scheduleDate: '2026-11-08 10:30:00',
                scheduleTime: '10:30 AM',
                reasonForVisit: 'Acute Chest Pain & Persistent Dry Cough',
                description: 'Substernal chest pain and dry cough for 4 days. Rule out pleuritis.',
                status: 'confirmed',
                paymentStatus: 'paid',
                prescriptionStatus: 'issued',
                patientType: 'Outpatient (OPD)',
                consultationMode: 'IN_PERSON',
            }
        });
        apptId = newAppt.id;
        console.log(`Created new Chest Chief Complaint appointment with ID: ${newAppt.id}, Tracking: ${newAppt.trackingId}`);
    } else {
        apptId = existingChestAppt.id;
        console.log(`Found existing Chest appointment: ${existingChestAppt.id}`);
    }

    // Ensure Pramod's Digital Chest X-Ray report is specifically tied to this chest complaint
    const chestReport = await prisma.medicalReport.findFirst({
        where: {
            patientId: pramod.id,
            OR: [
                { reportType: { contains: 'X-Ray' } },
                { reportTitle: { contains: 'Chest' } },
            ]
        }
    });

    if (chestReport) {
        await prisma.medicalReport.update({
            where: { id: chestReport.id },
            data: {
                doctorId: doctor.id,
                reportTitle: 'Digital Chest X-Ray (PA View)',
                reportType: 'X-Ray',
                category: 'IMAGING',
                hospitalOrLab: 'Apex Radio-Diagnostic & Imaging Center',
                description: 'Clinical Indication: Sharp chest discomfort on inspiration and persistent cough. High-resolution digital radiograph of chest PA view evaluating cardiopulmonary parenchyma and thoracic cage.',
                doctorComments: 'Bilateral lung fields are well-expanded with normal bronchovascular markings. Trachea is centrally located. Costophrenic and cardiophrenic angles are acute and clear. Cardiothoracic ratio is normal (CTR 0.46). No focal parenchymal consolidation, pneumothorax, or pleural effusion detected.',
                fileUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1200&auto=format&fit=crop&q=80',
                fileName: 'digital-chest-xray-pa-view.jpg',
                status: 'completed'
            }
        });
        console.log(`Updated Pramod's Chest X-Ray report (${chestReport.id}) with verified chest indications and findings.`);
    }

    console.log('--- Seeding Completed Successfully ---');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
