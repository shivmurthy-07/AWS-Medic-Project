/**
 * Utility for clinical classification of patient problems, complaints, and
 * matching them strictly with valid medical diagnostic reports.
 */

export const CLINICAL_PROBLEM_TYPES = {
    CHEST: 'CHEST',
    SPINE: 'SPINE',
    ABDOMEN: 'ABDOMEN',
    BLOOD_METABOLIC: 'BLOOD_METABOLIC',
    ALL: 'ALL',
};

export const CLINICAL_PROBLEMS = [
    {
        key: CLINICAL_PROBLEM_TYPES.CHEST,
        label: 'Chest & Respiratory Problem',
        subLabel: 'Chest Pain, Chronic Cough, Shortness of Breath, Bronchitis',
        icon: '🫁',
        keywords: [
            'chest',
            'cough',
            'breath',
            'breathing',
            'respiratory',
            'lung',
            'lungs',
            'bronchitis',
            'pneumonia',
            'asthma',
            'wheezing',
            'dyspnea',
            'pleur',
            'angina',
            'heart',
            'cardio',
            'cardiac',
            'rib',
            'palpitation',
            'sputum',
            'thorax',
            'thoracic'
        ],
        allowedReportTypes: ['x-ray', 'xray', 'ecg', 'ekg', 'chest ct', 'pulmonary', 'chest'],
        generatorTemplate: {
            reportType: 'X-Ray',
            reportTitle: 'Digital Chest X-Ray (PA View)',
            category: 'IMAGING',
            hospitalOrLab: 'Apex Radio-Diagnostic & Imaging Center',
            description: 'High-resolution digital radiograph of chest PA view evaluating acute/subacute chest discomfort, persistent cough, and exertional shortness of breath.',
            findingsText: 'Trachea is centrally located. Bilateral lung fields appear well-expanded with normal bronchovascular markings. No focal pulmonary consolidation, pneumothorax, or active tubercular lesions. Bilateral costophrenic and cardiophrenic angles are acute and clear. Cardiac silhouette is normal (CTR 0.46). Bony cage intact.',
            doctorComments: 'Normal digital chest radiograph. No acute cardiopulmonary parenchymal abnormality detected. Advised symptomatic support, hydration, and follow-up if symptoms persist.',
            fileUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1200&auto=format&fit=crop&q=80',
            fileName: 'digital-chest-xray-pa-view.jpg',
        }
    },
    {
        key: CLINICAL_PROBLEM_TYPES.SPINE,
        label: 'Spine & Orthopedic Problem',
        subLabel: 'Lower Back Pain, Lumbar Stiffness, Sciatica, Disc Soreness',
        icon: '🦴',
        keywords: [
            'back',
            'spine',
            'lumbar',
            'neck',
            'vertebra',
            'sciatica',
            'disc',
            'ortho',
            'orthopedic',
            'joint',
            'cervical',
            'spondylosis'
        ],
        allowedReportTypes: ['mri', 'spine', 'orthopedic', 'lumbar'],
        generatorTemplate: {
            reportType: 'MRI',
            reportTitle: 'Lumbar Spine MRI (L1-S1 Scan)',
            category: 'IMAGING',
            hospitalOrLab: 'Apex Neuro & Diagnostic Imaging',
            description: 'Multi-planar sagittal and axial T1/T2 MRI of lumbosacral spine evaluating chronic lower back pain and intermittent radicular discomfort.',
            findingsText: 'Physiological lumbar lordosis is maintained. Mild disc desiccation at L4-L5 level with subtle posterior disc bulge. Bilateral neural exit foramina remain widely patent with free exiting nerve roots.',
            doctorComments: 'Mild degenerative changes at L4-L5. No critical spinal canal stenosis or focal compressive radiculopathy detected.',
            fileUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&auto=format&fit=crop&q=80',
            fileName: 'lumbar-spine-mri-multiplanar.jpg',
        }
    },
    {
        key: CLINICAL_PROBLEM_TYPES.ABDOMEN,
        label: 'Abdominal & Digestive Problem',
        subLabel: 'Stomach Ache, Liver, Gallbladder, Renal/Kidney Screening',
        icon: '🩺',
        keywords: [
            'abdomen',
            'abdominal',
            'stomach',
            'liver',
            'gallbladder',
            'kidney',
            'gastric',
            'digestive',
            'bowel',
            'visceral',
            'splen'
        ],
        allowedReportTypes: ['ultrasound', 'usg', 'sonogram', 'abdomen'],
        generatorTemplate: {
            reportType: 'Ultrasound',
            reportTitle: 'High-Resolution Abdominal Ultrasound (USG Abdomen)',
            category: 'IMAGING',
            hospitalOrLab: 'Apex Radio-Diagnostic & Imaging Center',
            description: 'High-resolution transabdominal ultrasound examining hepatobiliary axis, pancreas, spleen, kidneys, and urinary bladder.',
            findingsText: 'Liver is normal in size and homogeneous in texture. Gallbladder is well distended, thin-walled, and calculus-free. Bilateral kidneys show normal cortical thickness without hydronephrosis.',
            doctorComments: 'Normal ultrasound examination of upper and lower abdomen. No focal visceral mass lesion or calculus detected.',
            fileUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&auto=format&fit=crop&q=80',
            fileName: 'abdominal-ultrasound-sonogram.jpg',
        }
    },
    {
        key: CLINICAL_PROBLEM_TYPES.BLOOD_METABOLIC,
        label: 'Blood & Metabolic Health Problem',
        subLabel: 'Fever, Fatigue, General Weakness, Diabetes, Lipid Screening',
        icon: '🩸',
        keywords: [
            'blood',
            'fever',
            'fatigue',
            'weakness',
            'infection',
            'diabetes',
            'glucose',
            'cholesterol',
            'lipid',
            'metabolic',
            'cbc',
            'hematology'
        ],
        allowedReportTypes: ['blood test', 'cbc', 'complete blood count', 'lipid', 'metabolic', 'hematology'],
        generatorTemplate: {
            reportType: 'Complete Blood Count (CBC)',
            reportTitle: 'Comprehensive Hematology Panel (CBC with ESR)',
            category: 'LABORATORY',
            hospitalOrLab: 'Apollo Clinical Diagnostics & Pathology Lab',
            description: 'Evaluation of full blood count, differential leukocyte count, and erythrocyte sedimentation rate for fatigue/infection screening.',
            findingsText: 'Automated 5-part differential hematology analysis with normal cell morphology.',
            doctorComments: 'All hematological parameters within healthy biological reference intervals. Red cell indices show normocytic normochromic morphology.',
            fileUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200&auto=format&fit=crop&q=80',
            fileName: 'comprehensive-hematology-cbc.pdf',
        }
    }
];

/**
 * Detects the clinical category of a patient problem or symptom string.
 */
export function detectProblemCategory(problemText) {
    if (!problemText || typeof problemText !== 'string') {
        return CLINICAL_PROBLEM_TYPES.CHEST; // Default to Chest problem per user focus
    }

    const lower = problemText.toLowerCase();

    // Check each category's keywords
    for (const prob of CLINICAL_PROBLEMS) {
        if (prob.keywords.some((kw) => lower.includes(kw))) {
            return prob.key;
        }
    }

    return CLINICAL_PROBLEM_TYPES.CHEST;
}

/**
 * Determines whether a given medical report matches a specified clinical problem category.
 */
export function isReportMatchingProblem(report, problemKey) {
    if (!report || !problemKey || problemKey === CLINICAL_PROBLEM_TYPES.ALL) {
        return true;
    }

    const config = CLINICAL_PROBLEMS.find((p) => p.key === problemKey);
    if (!config) return true;

    const reportTitle = (report.reportTitle || '').toLowerCase();
    const reportType = (report.reportType || '').toLowerCase();
    const description = (report.description || '').toLowerCase();
    const combined = `${reportTitle} ${reportType} ${description}`;

    // Specific check for CHEST: must match chest modalities (X-Ray, ECG, chest), and exclude spine/abdomen
    if (problemKey === CLINICAL_PROBLEM_TYPES.CHEST) {
        const isChestModality =
            reportType.includes('x-ray') ||
            reportType.includes('xray') ||
            reportType.includes('ecg') ||
            reportType.includes('ekg') ||
            reportTitle.includes('chest') ||
            combined.includes('chest') ||
            combined.includes('respiratory') ||
            combined.includes('pulmonary');

        const isUnrelated =
            reportTitle.includes('lumbar') ||
            reportTitle.includes('spine') ||
            reportTitle.includes('mri') ||
            reportTitle.includes('ultrasound') ||
            reportTitle.includes('usg abdomen');

        return isChestModality && !isUnrelated;
    }

    // Specific check for SPINE
    if (problemKey === CLINICAL_PROBLEM_TYPES.SPINE) {
        return (
            reportTitle.includes('lumbar') ||
            reportTitle.includes('spine') ||
            reportTitle.includes('mri') ||
            reportType.includes('mri') ||
            combined.includes('vertebra')
        );
    }

    // Specific check for ABDOMEN
    if (problemKey === CLINICAL_PROBLEM_TYPES.ABDOMEN) {
        return (
            reportTitle.includes('ultrasound') ||
            reportTitle.includes('usg') ||
            reportTitle.includes('abdomen') ||
            reportType.includes('ultrasound')
        );
    }

    // Specific check for BLOOD_METABOLIC
    if (problemKey === CLINICAL_PROBLEM_TYPES.BLOOD_METABOLIC) {
        return (
            reportTitle.includes('cbc') ||
            reportTitle.includes('hematology') ||
            reportTitle.includes('lipid') ||
            reportTitle.includes('metabolic') ||
            reportType.includes('blood') ||
            report.category === 'LABORATORY'
        );
    }

    return true;
}

/**
 * Filter an array of reports to strictly include only those relevant to the patient's problem.
 */
export function filterReportsByProblem(reports, problemKey) {
    if (!Array.isArray(reports)) return [];
    if (!problemKey || problemKey === CLINICAL_PROBLEM_TYPES.ALL) return reports;

    return reports.filter((r) => isReportMatchingProblem(r, problemKey));
}

/**
 * Get pre-filled template data for generating a valid report for a specific problem.
 */
export function getGeneratorTemplateForProblem(problemKey) {
    const config = CLINICAL_PROBLEMS.find((p) => p.key === problemKey) || CLINICAL_PROBLEMS[0];
    return config.generatorTemplate;
}

