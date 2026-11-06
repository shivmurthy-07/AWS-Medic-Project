const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const docs = await prisma.doctor.findMany({
        select: { id: true, firstName: true, lastName: true, email: true }
    });
    const patients = await prisma.patient.findMany({
        select: { id: true, firstName: true, lastName: true, email: true }
    });
    const apts = await prisma.appointments.findMany({
        select: { id: true, doctorId: true, patientId: true, status: true, trackingId: true }
    });
    const reports = await prisma.medicalReport.findMany({
        select: {
            id: true,
            reportTitle: true,
            doctorId: true,
            patientId: true,
            uploadedBy: true,
            patient: { select: { firstName: true, lastName: true, email: true } },
            doctor: { select: { firstName: true, lastName: true, email: true } }
        }
    });

    console.log('=== DOCTORS (' + docs.length + ') ===');
    docs.forEach(d => console.log(`Doctor: ${d.id} | ${d.firstName} ${d.lastName} (${d.email})`));

    console.log('\n=== PATIENTS (' + patients.length + ') ===');
    patients.forEach(p => console.log(`Patient: ${p.id} | ${p.firstName} ${p.lastName} (${p.email})`));

    console.log('\n=== APPOINTMENTS (' + apts.length + ') ===');
    apts.forEach(a => console.log(`Appt: ${a.id} | Doctor: ${a.doctorId} | Patient: ${a.patientId} | Status: ${a.status}`));

    console.log('\n=== MEDICAL REPORTS (' + reports.length + ') ===');
    reports.forEach(r => console.log(`Report: ${r.id} | Title: ${r.reportTitle} | DocId: ${r.doctorId} (${r.doctor?.email}) | PatId: ${r.patientId} (${r.patient?.email}) | UploadedBy: ${r.uploadedBy}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());

