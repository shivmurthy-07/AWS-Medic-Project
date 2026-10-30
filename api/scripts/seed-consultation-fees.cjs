const path = require('path');
const { PrismaClient, Prisma } = require('@prisma/client');
const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath });

const prisma = new PrismaClient();

const specializationsData = [
    { name: 'Cardiology', description: 'Heart, blood vessels, and cardiovascular health care.' },
    { name: 'Dermatology', description: 'Skin, hair, nail conditions, and aesthetic dermatology.' },
    { name: 'Orthopedics', description: 'Bones, joints, ligaments, tendons, and musculoskeletal treatments.' },
    { name: 'Dentistry', description: 'Teeth, oral hygiene, dental surgeries, and restorations.' },
    { name: 'Neurology', description: 'Brain, spinal cord, nerves, and neurological disorders.' },
    { name: 'Pediatrics', description: 'Medical care for infants, children, and adolescents.' },
    { name: 'Ophthalmology', description: 'Eye health, vision testing, and ocular diseases.' },
    { name: 'General Medicine', description: 'Comprehensive primary health care, diagnostics, and chronic disease management.' },
    { name: 'Gynecology', description: 'Female reproductive health, prenatal, and postnatal care.' },
    { name: 'ENT', description: 'Ear, nose, and throat disorders and head/neck diagnostics.' },
];

const consultationServicesData = [
    { name: 'First Consultation', code: 'first_consultation', appointmentMode: 'BOTH', description: 'Initial comprehensive consultation for new medical concerns or new patients.' },
    { name: 'Follow-up Consultation', code: 'follow_up', appointmentMode: 'BOTH', description: 'Follow-up review for existing treatments or post-investigation evaluations.' },
    { name: 'Regular Checkup', code: 'regular_checkup', appointmentMode: 'BOTH', description: 'Routine preventive health screening and health maintenance checkup.' },
    { name: 'General Consultation', code: 'general_consultation', appointmentMode: 'BOTH', description: 'General medical consultation for common symptoms and clinical assessment.' },
    { name: 'Emergency Consultation', code: 'emergency_consultation', appointmentMode: 'IN_PERSON', description: 'Urgent medical attention and clinical triage consultation.' },
    { name: 'Online Consultation', code: 'online_consultation', appointmentMode: 'ONLINE', description: 'Telehealth remote video or audio consultation.' },
    { name: 'In-person Consultation', code: 'in_person_consultation', appointmentMode: 'IN_PERSON', description: 'Standard in-clinic consultation with physical examination.' },
    { name: 'Other Custom Services', code: 'custom_services', appointmentMode: 'BOTH', description: 'Specialized clinical procedures, counseling, or diagnostic reviews.' },
];

const feeMatrix = [
    { spec: 'Cardiology', service: 'First Consultation', mode: 'IN_PERSON', fee: 1000 },
    { spec: 'Cardiology', service: 'First Consultation', mode: 'ONLINE', fee: 900 },
    { spec: 'Cardiology', service: 'Follow-up Consultation', mode: 'IN_PERSON', fee: 500 },
    { spec: 'Cardiology', service: 'Follow-up Consultation', mode: 'ONLINE', fee: 450 },
    { spec: 'Cardiology', service: 'Regular Checkup', mode: 'IN_PERSON', fee: 700 },

    { spec: 'Dermatology', service: 'First Consultation', mode: 'IN_PERSON', fee: 700 },
    { spec: 'Dermatology', service: 'First Consultation', mode: 'ONLINE', fee: 650 },
    { spec: 'Dermatology', service: 'Follow-up Consultation', mode: 'IN_PERSON', fee: 350 },
    { spec: 'Dermatology', service: 'Regular Checkup', mode: 'IN_PERSON', fee: 500 },

    { spec: 'Orthopedics', service: 'First Consultation', mode: 'IN_PERSON', fee: 900 },
    { spec: 'Orthopedics', service: 'First Consultation', mode: 'ONLINE', fee: 800 },
    { spec: 'Orthopedics', service: 'Follow-up Consultation', mode: 'IN_PERSON', fee: 450 },

    { spec: 'Dentistry', service: 'First Consultation', mode: 'IN_PERSON', fee: 600 },
    { spec: 'Dentistry', service: 'Regular Checkup', mode: 'IN_PERSON', fee: 400 },
    { spec: 'Dentistry', service: 'Follow-up Consultation', mode: 'IN_PERSON', fee: 300 },

    { spec: 'Neurology', service: 'First Consultation', mode: 'IN_PERSON', fee: 1200 },
    { spec: 'Neurology', service: 'Follow-up Consultation', mode: 'IN_PERSON', fee: 600 },

    { spec: 'Pediatrics', service: 'General Consultation', mode: 'IN_PERSON', fee: 600 },
    { spec: 'Pediatrics', service: 'First Consultation', mode: 'IN_PERSON', fee: 600 },
    { spec: 'Pediatrics', service: 'Follow-up Consultation', mode: 'IN_PERSON', fee: 350 },

    { spec: 'Ophthalmology', service: 'Regular Checkup', mode: 'IN_PERSON', fee: 500 },
    { spec: 'Ophthalmology', service: 'First Consultation', mode: 'IN_PERSON', fee: 600 },

    { spec: 'General Medicine', service: 'First Consultation', mode: 'IN_PERSON', fee: 500 },
    { spec: 'General Medicine', service: 'Follow-up Consultation', mode: 'IN_PERSON', fee: 300 },
    { spec: 'General Medicine', service: 'General Consultation', mode: 'IN_PERSON', fee: 450 },
];

async function seed() {
    console.log('Seeding Specializations and Consultation Services...');

    const specMap = new Map();
    for (const s of specializationsData) {
        const record = await prisma.specialization.upsert({
            where: { name: s.name },
            update: { description: s.description, isActive: true },
            create: { name: s.name, description: s.description, isActive: true },
        });
        specMap.set(s.name, record.id);
    }

    const serviceMap = new Map();
    for (const cs of consultationServicesData) {
        const record = await prisma.consultationService.upsert({
            where: { name: cs.name },
            update: { code: cs.code, appointmentMode: cs.appointmentMode, description: cs.description, isActive: true },
            create: { name: cs.name, code: cs.code, appointmentMode: cs.appointmentMode, description: cs.description, isActive: true },
        });
        serviceMap.set(cs.name, record.id);
    }

    for (const item of feeMatrix) {
        const specId = specMap.get(item.spec);
        const servId = serviceMap.get(item.service);
        if (!specId || !servId) continue;

        const existing = await prisma.specializationFee.findFirst({
            where: {
                specializationId: specId,
                serviceId: servId,
                mode: item.mode,
            },
        });

        if (existing) {
            await prisma.specializationFee.update({
                where: { id: existing.id },
                data: { fee: new Prisma.Decimal(item.fee), isActive: true },
            });
        } else {
            await prisma.specializationFee.create({
                data: {
                    specializationId: specId,
                    serviceId: servId,
                    mode: item.mode,
                    fee: new Prisma.Decimal(item.fee),
                    isActive: true,
                },
            });
        }
    }

    console.log('Seeded Specializations, Services, and Fee Matrix successfully.');
}

seed()
    .catch((err) => {
        console.error('Error seeding fees:', err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());

