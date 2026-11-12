/**
 * Clinical Problem Matcher & Post-Consultation Diagnostic Draft Utilities
 * Aligns post-consultation reports accurately with each patient's actual clinical complaint,
 * specialty assessment, and physician-authored findings without placeholder stock images.
 */

export const CLINICAL_PROBLEM_TYPES = {
    ALL: 'ALL',
    GENERAL_CONSULTATION: 'GENERAL_CONSULTATION',
    CHEST: 'CHEST',
    SPINE: 'SPINE',
    ABDOMEN: 'ABDOMEN',
    BLOOD_METABOLIC: 'BLOOD_METABOLIC',
};

export const STOCK_PLACEHOLDER_IMAGE_PATTERNS = [
    'images.unsplash.com/photo-1530497610245-94d3c16cda28',
    'images.unsplash.com/photo-1579684385127-1ef15d508118',
    'images.unsplash.com/photo-1559757175-5700dde675bc',
    'images.unsplash.com/photo-1576091160399-112ba8d25d1d',
];

export function isStockPlaceholderUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return STOCK_PLACEHOLDER_IMAGE_PATTERNS.some((pattern) => url.includes(pattern));
}

export function getSanitizedReportFileUrl(report) {
    const raw = report?.fileUrl;
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed || isStockPlaceholderUrl(trimmed)) return null;
    return trimmed;
}

export const CLINICAL_PROBLEMS = [
    {
        key: CLINICAL_PROBLEM_TYPES.CHEST,
        label: 'Chest & Respiratory Assessment',
        subLabel: 'Chest Pain, Persistent Cough, Dyspnea, Bronchitis, Cardiac Screening',
        keywords: [
            'chest', 'cough', 'breath', 'breathing', 'respiratory', 'lung', 'lungs',
            'bronchitis', 'pneumonia', 'asthma', 'wheezing', 'dyspnea', 'pleur',
            'angina', 'heart', 'cardio', 'cardiac', 'rib', 'palpitation', 'sputum',
            'thorax', 'thoracic', 'ecg', 'ekg', 'x-ray', 'xray'
        ],
        allowedReportTypes: ['x-ray', 'xray', 'ecg', 'ekg', 'chest ct', 'pulmonary', 'chest', 'cardiac'],
        generatorTemplate: {
            reportType: 'X-Ray',
            reportTitle: 'Thoracic & Cardiopulmonary Clinical Evaluation',
            category: 'IMAGING',
            hospitalOrLab: 'MediConnect Radio-Diagnostic & Chest Clinic',
            description: 'Focused cardiopulmonary and thoracic evaluation addressing patient respiratory/chest symptoms.',
            doctorComments: 'Clinical & radiographic evaluation reviewed post-consultation. Correlate with physical auscultation and pulse oximetry.',
            defaultFindings: [
                { parameter: 'Trachea & Mediastinum', finding: 'Central trachea; mediastinal contours within normal limits', status: 'Normal' },
                { parameter: 'Lung Parenchyma', finding: 'Clear bilateral lung fields without focal consolidation or effusion', status: 'Normal' },
                { parameter: 'Costophrenic Angles', finding: 'Bilateral angles sharp and clear', status: 'Normal' },
                { parameter: 'Cardiac Silhouette', finding: 'Normal cardiothoracic configuration', status: 'Normal' },
                { parameter: 'Thoracic Bony Cage', finding: 'Visualized ribs and clavicles intact', status: 'Normal' },
            ],
            fileUrl: null,
            fileName: null,
        }
    },
    {
        key: CLINICAL_PROBLEM_TYPES.SPINE,
        label: 'Neurology & Spine Evaluation',
        subLabel: 'Back Pain, Sciatica, Disc Bulge, Migraine, Radiculopathy',
        keywords: [
            'spine', 'spinal', 'back', 'backache', 'lumbar', 'cervical', 'sciatica',
            'disc', 'nerve', 'neuro', 'neurology', 'headache', 'migraine', 'vertigo',
            'numbness', 'tingling', 'neck', 'joint', 'knee', 'ortho', 'orthopedic', 'mri'
        ],
        allowedReportTypes: ['mri', 'ct', 'spine', 'neuro', 'brain', 'orthopedic', 'x-ray'],
        generatorTemplate: {
            reportType: 'MRI',
            reportTitle: 'Musculoskeletal & Neuro-Spinal Diagnostic Report',
            category: 'IMAGING',
            hospitalOrLab: 'MediConnect Neuro-Spine & MRI Centre',
            description: 'Targeted neuro-orthopedic assessment of reported musculoskeletal or neurological symptoms.',
            doctorComments: 'Spinal alignment and nerve-root assessment completed post-consultation. Continue guided physiotherapy and ergonomics.',
            defaultFindings: [
                { parameter: 'Alignment & Curvature', finding: 'Preserved sagittal curvature without spondylolisthesis', status: 'Normal' },
                { parameter: 'Vertebral Bodies', finding: 'Normal marrow signal and vertebral heights', status: 'Normal' },
                { parameter: 'Intervertebral Discs', finding: 'No high-grade canal stenosis or cord compression identified', status: 'Normal' },
                { parameter: 'Neural Foramina & Cord', finding: 'Preserved conus and cauda equina nerve roots', status: 'Normal' },
            ],
            fileUrl: null,
            fileName: null,
        }
    },
    {
        key: CLINICAL_PROBLEM_TYPES.ABDOMEN,
        label: 'Abdominal & GI Sonography',
        subLabel: 'Abdominal Pain, Gastritis, Liver/Kidney Screening, Ultrasound',
        keywords: [
            'abdomen', 'abdominal', 'stomach', 'gastric', 'acidity', 'ulcer', 'liver',
            'hepatic', 'fatty liver', 'kidney', 'renal', 'stone', 'gallbladder', 'pelvis',
            'ultrasound', 'sonography', 'usg', 'nausea', 'vomiting', 'bowel', 'digestive', 'gi'
        ],
        allowedReportTypes: ['ultrasound', 'usg', 'sonography', 'abdomen', 'ct', 'gi'],
        generatorTemplate: {
            reportType: 'Ultrasound',
            reportTitle: 'Abdominal & Pelvis Clinical Sonography Report',
            category: 'IMAGING',
            hospitalOrLab: 'MediConnect Sonography & GI Diagnostics',
            description: 'Focused abdominal and gastrointestinal assessment based on patient symptoms.',
            doctorComments: 'Hepatobiliary and renal sonographic screening completed. Advised dietary moderation and hydration.',
            defaultFindings: [
                { parameter: 'Liver & Gallbladder', finding: 'Normal size and homogeneous echotexture; no biliary dilatation or calculus', status: 'Normal' },
                { parameter: 'Pancreas & Spleen', finding: 'Normal size and outline; no focal lesion', status: 'Normal' },
                { parameter: 'Kidneys (Bilateral)', finding: 'Normal corticomedullary differentiation; no hydronephrosis or calculus', status: 'Normal' },
                { parameter: 'Urinary Bladder & Pelvis', finding: 'Adequately distended with smooth wall contour; no free fluid', status: 'Normal' },
            ],
            fileUrl: null,
            fileName: null,
        }
    },
    {
        key: CLINICAL_PROBLEM_TYPES.BLOOD_METABOLIC,
        label: 'Hematology & Metabolic Lab Panel',
        subLabel: 'CBC, Blood Glucose, HbA1c, Thyroid, Lipid & Renal Profile',
        keywords: [
            'blood', 'cbc', 'hemoglobin', 'anemia', 'platelet', 'thyroid', 'tsh',
            'sugar', 'glucose', 'hba1c', 'cholesterol', 'lipid', 'triglyceride',
            'fatigue', 'weakness', 'vitamin', 'infection', 'wbc', 'creatinine', 'lab'
        ],
        allowedReportTypes: ['lab test', 'blood', 'cbc', 'biochemistry', 'panel', 'pathology'],
        generatorTemplate: {
            reportType: 'Lab Test',
            reportTitle: 'Comprehensive Hematology & Metabolic Biomarker Report',
            category: 'LAB',
            hospitalOrLab: 'MediConnect NABL Pathology Laboratory',
            description: 'Quantitative hematological and metabolic biomarker analysis ordered following clinical evaluation.',
            doctorComments: 'Laboratory biomarkers reviewed against age-adjusted reference intervals. Correlate with clinical history.',
            defaultFindings: [
                { parameter: 'Hemoglobin (Hb)', finding: '13.8 g/dL', reference: '12.0 - 16.0 g/dL', status: 'Normal' },
                { parameter: 'Total Leukocyte Count (WBC)', finding: '7,200 /cumm', reference: '4,000 - 11,000 /cumm', status: 'Normal' },
                { parameter: 'Platelet Count', finding: '245,000 /cumm', reference: '150,000 - 450,000 /cumm', status: 'Normal' },
                { parameter: 'Fasting Blood Glucose', finding: '94 mg/dL', reference: '70 - 100 mg/dL', status: 'Normal' },
                { parameter: 'Serum Creatinine', finding: '0.9 mg/dL', reference: '0.6 - 1.2 mg/dL', status: 'Normal' },
            ],
            fileUrl: null,
            fileName: null,
        }
    },
    {
        key: CLINICAL_PROBLEM_TYPES.GENERAL_CONSULTATION,
        label: 'General Consultation & Chronic / Preventive Care',
        subLabel: 'Chronic Care Management, Vaccination, Pediatrics, Primary Evaluation',
        keywords: [
            'chronic', 'management', 'vaccination', 'vaccine', 'immunization', 'preventive',
            'diabetes', 'hypertension', 'blood pressure', 'child', 'pediatric', 'fever',
            'general', 'checkup', 'follow-up', 'followup', 'consultation', 'skin', 'ent', 'dental'
        ],
        allowedReportTypes: ['consultation summary', 'clinical note', 'immunization', 'general', 'chronic care', 'checkup'],
        generatorTemplate: {
            reportType: 'Consultation Summary',
            reportTitle: 'Post-Consultation Clinical Evaluation & Care Summary',
            category: 'GENERAL',
            hospitalOrLab: 'MediConnect Outpatient Consultation Clinic',
            description: 'Structured physician-verified post-consultation evaluation, vital signs review, and ongoing care plan.',
            doctorComments: 'Patient evaluated thoroughly during consultation. Advised medication adherence, lifestyle counseling, and scheduled follow-up.',
            defaultFindings: [
                { parameter: 'General Appearance & Vitals', finding: 'Alert, oriented, hemodynamically stable during visit', reference: 'Afebrile / Stable', status: 'Normal' },
                { parameter: 'Blood Pressure & Pulse', finding: '120/78 mmHg · 76 bpm regular', reference: '<130/80 mmHg · 60-100 bpm', status: 'Normal' },
                { parameter: 'Systemic Physical Exam', finding: 'No acute distress; systems examined per chief complaint', reference: 'WNL', status: 'Normal' },
                { parameter: 'Clinical Management Plan', finding: 'Therapeutic guidance and follow-up schedule discussed with patient', reference: 'Post-Visit Plan', status: 'Reviewed' },
            ],
            fileUrl: null,
            fileName: null,
        }
    }
];

/**
 * Matches an appointment's complaint/type text accurately against clinical domains.
 * Defaults to GENERAL_CONSULTATION (never mistakenly forces Chest X-Ray on chronic care or vaccination).
 */
export function detectProblemCategory(problemText) {
    if (!problemText || typeof problemText !== 'string') {
        return CLINICAL_PROBLEM_TYPES.GENERAL_CONSULTATION;
    }
    const lower = problemText.toLowerCase();

    // Check specific diagnostic domains before falling back to general consultation
    const orderedKeys = [
        CLINICAL_PROBLEM_TYPES.CHEST,
        CLINICAL_PROBLEM_TYPES.SPINE,
        CLINICAL_PROBLEM_TYPES.ABDOMEN,
        CLINICAL_PROBLEM_TYPES.BLOOD_METABOLIC,
        CLINICAL_PROBLEM_TYPES.GENERAL_CONSULTATION,
    ];

    for (const key of orderedKeys) {
        const prob = CLINICAL_PROBLEMS.find((p) => p.key === key);
        if (prob && prob.keywords.some((kw) => lower.includes(kw))) {
            return prob.key;
        }
    }
    return CLINICAL_PROBLEM_TYPES.GENERAL_CONSULTATION;
}

/**
 * Returns the base template object for a given problem category key.
 */
export function getGeneratorTemplateForProblem(problemKey) {
    const found = CLINICAL_PROBLEMS.find((p) => p.key === problemKey);
    return (found || CLINICAL_PROBLEMS.find((p) => p.key === CLINICAL_PROBLEM_TYPES.GENERAL_CONSULTATION)).generatorTemplate;
}

/**
 * Builds a customized, consultation-specific report draft tailored to the patient & visit.
 */
export function buildConsultationReportDraft(appointment, explicitProblemKey = null) {
    const reasonText = [
        appointment?.reasonForVisit,
        appointment?.description,
        appointment?.consultationType,
    ]
        .filter(Boolean)
        .join(' ');

    const problemKey =
        explicitProblemKey && explicitProblemKey !== CLINICAL_PROBLEM_TYPES.ALL
            ? explicitProblemKey
            : detectProblemCategory(reasonText);

    const base = getGeneratorTemplateForProblem(problemKey);
    const lowerReason = reasonText.toLowerCase();

    let reportTitle = base.reportTitle;
    let reportType = base.reportType;
    let category = base.category;
    let defaultFindings = base.defaultFindings.map((row) => ({ ...row }));
    let description = base.description;
    let doctorComments = base.doctorComments;

    if (lowerReason.includes('vaccin') || lowerReason.includes('immuniz')) {
        reportTitle = 'Preventive Immunization & Post-Vaccination Consultation Record';
        reportType = 'Immunization Record';
        category = 'GENERAL';
        description = `Clinical pre-screening and post-vaccination observation summary for visit reason: "${appointment?.reasonForVisit || 'Vaccination / immunization'}".`;
        defaultFindings = [
            { parameter: 'Pre-Vaccination Triage', finding: 'Afebrile, no contraindications or acute allergic history reported', reference: 'Cleared', status: 'Normal' },
            { parameter: 'Vital Signs (Post-Dose)', finding: 'BP 118/76 mmHg · Pulse 74 bpm · SpO2 99%', reference: 'Stable', status: 'Normal' },
            { parameter: '15-Min Observation', finding: 'No immediate local reaction or hypersensitivity observed', reference: 'No Reaction', status: 'Normal' },
            { parameter: 'Follow-Up Guidance', finding: 'Advised hydration, cold compress if mild soreness, and next booster schedule', reference: 'Reviewed', status: 'Reviewed' },
        ];
        doctorComments = 'Vaccination consultation completed uneventfully. Patient tolerated visit well and received after-care instructions.';
    } else if (lowerReason.includes('chronic')) {
        reportTitle = 'Chronic Care Management & Longitudinal Review Report';
        reportType = 'Chronic Care Summary';
        category = 'GENERAL';
        description = `Post-consultation chronic disease review and therapeutic optimization for complaint: "${appointment?.reasonForVisit || 'Chronic care management'}".`;
        defaultFindings = [
            { parameter: 'Vitals & Hemodynamics', finding: 'BP 126/80 mmHg · HR 78 bpm · Weight stable', reference: '<130/80 mmHg', status: 'Normal' },
            { parameter: 'Symptom Control Review', finding: 'Reviewed baseline symptoms, trigger control, and treatment adherence', reference: 'Evaluated', status: 'Reviewed' },
            { parameter: 'Medication Reconciliation', finding: 'Maintenance regimen verified; no adverse drug effects reported', reference: 'Verified', status: 'Normal' },
            { parameter: 'Care & Follow-Up Plan', finding: 'Continue prescribed therapy, daily monitoring log, and scheduled review visit', reference: 'Active Plan', status: 'Reviewed' },
        ];
        doctorComments = 'Chronic disease management consultation completed. Patient counseled on preventive lifestyle habits and follow-up timeline.';
    } else if (appointment?.reasonForVisit) {
        description = `${base.description} Evaluated chief complaint: "${appointment.reasonForVisit}".`;
    }

    const clinicName =
        appointment?.doctor?.hospitalName ||
        appointment?.doctor?.clinicName ||
        base.hospitalOrLab;

    return {
        problemKey,
        reportType,
        reportTitle,
        category,
        hospitalOrLab: clinicName,
        description,
        doctorComments,
        findings: defaultFindings,
        fileUrl: null,
        fileName: null,
    };
}

/**
 * Checks whether a given report matches a specific clinical problem category.
 */
export function isReportMatchingProblem(report, problemKey) {
    if (!problemKey || problemKey === CLINICAL_PROBLEM_TYPES.ALL) return true;

    if (report?.recordResults?.problemKey === problemKey) {
        return true;
    }

    const prob = CLINICAL_PROBLEMS.find((p) => p.key === problemKey);
    if (!prob) return true;

    const hay = [
        report?.reportType,
        report?.reportTitle,
        report?.description,
        report?.doctorComments,
        report?.hospitalOrLab,
        report?.appointment?.reasonForVisit,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    if (prob.keywords.some((kw) => hay.includes(kw))) return true;
    if (prob.allowedReportTypes.some((rt) => (report?.reportType || '').toLowerCase().includes(rt))) return true;
    if (problemKey === CLINICAL_PROBLEM_TYPES.BLOOD_METABOLIC && (report?.category === 'LAB' || report?.category === 'LABORATORY')) return true;
    if (problemKey === CLINICAL_PROBLEM_TYPES.GENERAL_CONSULTATION && report?.category === 'GENERAL') return true;
    return false;
}

/**
 * Filters a list of medical reports to those matching the active problem category.
 */
export function filterReportsByProblem(reports, problemKey) {
    if (!Array.isArray(reports)) return [];
    if (!problemKey || problemKey === CLINICAL_PROBLEM_TYPES.ALL) return reports;
    return reports.filter((r) => isReportMatchingProblem(r, problemKey));
}
