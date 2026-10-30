require('dotenv/config');

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleBlogs = [
    {
        title: 'Small Daily Habits for a Healthier Heart',
        description: `Heart health is shaped by the small choices we make every day. Aim for regular movement, choose more vegetables, fruits, whole grains and pulses, and make time for sleep and stress management.

        Keep track of your blood pressure and cholesterol as advised by your doctor. If you smoke, ask a healthcare professional for support to quit. These general steps are a starting point, not a substitute for personalised medical advice.`,
        img: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
    },
    {
        title: 'Making Preventive Health Checkups Work for You',
        description: `Preventive checkups can help you and your doctor understand your health before a concern becomes urgent. The right tests and schedule depend on factors such as your age, medical history, family history and lifestyle.

        Before your visit, note any symptoms, medicines and questions you want to discuss. Ask which screenings are appropriate for you and when you should follow up. Avoid ordering tests based only on online lists; your clinician can help you choose what is useful.`,
        img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    },
    {
        title: 'Everyday Nutrition: Building a Balanced Plate',
        description: `A balanced meal does not need to be complicated. Try to include a variety of vegetables and fruit, a source of protein such as beans, lentils, eggs or fish, and whole grains where available. Drink water regularly and notice how different meals make you feel.

        There is no single diet that suits everyone. Allergies, medical conditions, culture and access to food all matter. If you need a specific eating plan, speak with a registered dietitian or your doctor rather than following restrictive advice from social media.`,
        img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
    },
    {
        title: 'Understanding Stress and Looking After Your Mental Wellbeing',
        description: `Stress can affect sleep, concentration, mood and physical wellbeing. Regular routines, gentle activity, time with supportive people and short breaks can help some people manage everyday stress.

        You do not have to handle persistent distress alone. Consider speaking with a qualified mental health professional or your doctor, especially if symptoms are affecting daily life. If you or someone else is in immediate danger, contact local emergency services.`,
        img: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=80',
    },
];

async function seedBlogs() {
    const doctor = await prisma.doctor.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true, firstName: true, lastName: true },
    });

    if (!doctor) {
        throw new Error('No doctor account exists yet. Create a doctor account before seeding blog posts.');
    }

    let createdCount = 0;
    for (const blog of sampleBlogs) {
        const existingBlog = await prisma.blogs.findFirst({
            where: { userId: doctor.id, title: blog.title },
            select: { id: true },
        });

        if (existingBlog) {
            continue;
        }

        await prisma.blogs.create({
            data: { ...blog, userId: doctor.id },
        });
        createdCount += 1;
    }

    console.log(`Added ${createdCount} sample blog post(s) for Dr. ${doctor.firstName} ${doctor.lastName}.`);
    console.log(`Skipped ${sampleBlogs.length - createdCount} existing sample post(s).`);
}

seedBlogs()
    .catch((error) => {
        console.error('Unable to seed blog posts:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
