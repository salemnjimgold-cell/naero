const KNOWLEDGE = {
  immigration: {
    work: {
      title: 'Work Visa & Residency',
      steps: [
        'Secure a job offer from a Hungarian employer',
        'Employer applies for work permit via immigration authorities',
        'Apply for residency permit at Hungarian embassy in your home country',
        'Upon arrival, register address at local kormanyablak (government window)',
        'Apply for TAJ (social security number) at the health insurance office',
        'Open a bank account (require passport and address card)',
      ],
      tips: 'The whole process takes 4-8 weeks. Your employer should guide you through most of it.',
      offices: 'Budapest Immigration Office: 1143 Budapest, Stefania ut 14.\nOpen Mon-Thu 8AM-4PM, Fri 8AM-2PM.',
    },
    study: {
      title: 'Student Residency',
      steps: [
        'Get acceptance letter from a Hungarian university',
        'Apply for student visa at Hungarian embassy',
        'Upon arrival, register address within 3 days',
        'Get student ID from the university (Neptun code)',
        'Apply for TAJ number (health insurance for students)',
        'Open a student bank account (many banks offer fee-free accounts)',
      ],
      tips: 'Student residence permits are typically valid for 1 year and renewable. You can work part-time (max 24 hours/week) with a student permit.',
      offices: 'Visit your university international office first - they handle most paperwork.',
    },
    family: {
      title: 'Family Reunification',
      steps: [
        'Your family member in Hungary must have valid residency',
        'Submit family reunification application at embassy',
        'Provide proof of relationship (marriage/birth certificates, translated)',
        'Proof of accommodation and sufficient income',
        'Health insurance for all family members',
      ],
      tips: 'Family members can work and study freely once they have residency.',
      offices: 'Apply at the Hungarian embassy in your home country first.',
    },
    refugee: {
      title: 'Asylum & International Protection',
      steps: [
        'Register asylum claim at the Immigration Office upon arrival',
        'You will be assigned a case officer and interpreter',
        'Receive temporary accommodation and basic support',
        'Attend interviews and provide documentation',
        'Decision typically within 6 months',
      ],
      tips: 'Hungary has strict asylum procedures. Contact UNHCR or NGO support organizations for assistance.',
      offices: 'Beorndosi ut 12-14, Budapest.\nNGO support: Hungarian Helsinki Committee, Menedek.',
    },
    general: {
      title: 'General Residency Guidance',
      steps: [
        'Determine which visa/permit type applies to your situation',
        'Gather required documents (passport, photos, proof of funds, etc.)',
        'Submit application at Hungarian embassy (from abroad) or Immigration Office (inside Hungary)',
        'Wait for processing (typically 30-60 days)',
        'Upon approval, register address and get ID card',
      ],
      tips: 'Always keep copies of all documents. Official translations may be required for non-Hungarian documents.',
      offices: 'National Directorate-General for Aliens Policing (Bevandorlasi Hivatal)\n1143 Budapest, Stefania ut 14.',
    },
  },

  costOfLiving: {
    budapest: {
      title: 'Cost of Living in Budapest',
      rent: {
        'studio': 'Studio apartment (city center): EUR 400-600/month',
        '1bed': '1-bedroom (city center): EUR 500-750/month',
        '3bed': '3-bedroom (city center): EUR 900-1400/month',
        'studio_outer': 'Studio (outer district): EUR 300-450/month',
      },
      utilities: 'Utilities (electricity, heating, water, garbage): EUR 120-200/month for 85m2',
      internet: 'Internet (60 Mbps+): EUR 12-18/month',
      transport: {
        monthly: 'Monthly public transport pass: EUR 30',
        single: 'Single ticket: EUR 1.20',
        student: 'Student monthly pass: EUR 15',
      },
      food: {
        groceries: 'Monthly groceries (1 person): EUR 200-300',
        mealInexpensive: 'Inexpensive restaurant meal: EUR 8-12',
        mealMid: 'Mid-range restaurant (3-course for 2): EUR 40-60',
        coffee: 'Cappuccino: EUR 2-3',
        beer: 'Local beer (0.5L): EUR 1.50-2.50',
        water: 'Water (1.5L bottle): EUR 0.80-1.20',
      },
      dining: {
        budget: 'Budget lunch menu: EUR 6-9',
        fastFood: 'Fast food combo: EUR 7-9',
      },
      summary: 'A single person needs approximately EUR 600-900/month (excluding rent) for a moderate lifestyle in Budapest.',
    },
    general: {
      title: 'General Cost Tips',
      tips: [
        'Hungary uses the Forint (HUF). Check exchange rates before transferring money.',
        'Wise and Revolut offer better rates than traditional banks for international transfers.',
        'Shopping at local markets (piac) is cheaper than supermarkets for fresh produce.',
        'Second-hand stores (turkalodes) are great for affordable clothing and furniture.',
        'Utilities and internet are cheaper if you sign annual contracts.',
        'Students get discounts on transport, museums, and some restaurants.',
      ],
    },
  },

  housing: {
    title: 'Housing Assistance',
    districts: {
      '5': 'District 5 (Belvaros): City center, expensive, mostly historic buildings. 1-bed: EUR 600-900.',
      '6': 'District 6 (Terézvaros): Central, lively, tourist area. 1-bed: EUR 500-750.',
      '7': 'District 7 (Erzsebetvaros): Jewish Quarter, nightlife, young crowd. 1-bed: EUR 450-650.',
      '8': 'District 8 (Jozsefvaros): Up-and-coming, diverse, affordable. 1-bed: EUR 350-500.',
      '9': 'District 9 (Ferencvaros): Near university, developing. 1-bed: EUR 400-550.',
      '13': 'District 13 (Ujlipotvaros): Modern, expat-friendly, good transport. 1-bed: EUR 500-700.',
      '14': 'District 14 (Zuglo): Quiet, green, family-friendly. 1-bed: EUR 400-550.',
    },
    websites: [
      'ingatlan.com - largest rental portal',
      'alberlet.hu - dedicated rentals',
      'facebook.com/groups - Budapest Expats / Rentals groups',
      'flatfox.hu - student-friendly',
    ],
    tips: [
      'Deposit is typically 2 months rent + 1 month advance',
      'Agency fee: usually 1 month rent (negotiable)',
      'Contracts are typically 1 year, renewable',
      'Utilities may or may not be included - always ask',
      'You need a Magyarorszagi lakcim (Hungarian address) for official registration',
      'Landlords prefer tenants with a magyar adoszam (tax ID) or proof of employment',
      'Visit apartments in person before signing - photos can be misleading',
    ],
    contract: 'Key contract terms:\n- Monthly rent amount and payment date\n- Utility costs (included or separate)\n- Notice period (usually 30-60 days)\n- Deposit conditions for return\n- Who handles repairs\n- Subletting policy',
  },

  jobs: {
    title: 'Job Search Assistance',
    permits: {
      eu: 'EU/EEA citizens: No work permit needed. Register address and get TAJ number.',
      non_eu: 'Non-EU citizens: Employer must obtain work permit. The process takes 4-8 weeks. You need a residency permit that allows work.',
      student: 'Students: Can work up to 24 hours/week during studies, full-time during breaks.',
    },
    websites: [
      'profession.hu - largest Hungarian job portal',
      'linkedin.com - international jobs, networking',
      'indeed.hu - aggregator',
      'facebook.com/groups - Budapest Jobs, English Jobs in Budapest',
      'nofluffjobs.com - IT and tech roles',
      'cvonline.hu - local Hungarian jobs',
    ],
    industries: {
      it: 'IT & Tech: Strong demand. English sufficient at many companies. Avg salary: EUR 2000-4000/month.',
      teaching: 'Teaching English: TEFL certificate helpful. Avg salary: EUR 800-1500/month.',
      hospitality: 'Hospitality & Tourism: Seasonal work available. Avg salary: EUR 800-1200/month + tips.',
      customer: 'Customer Service: Multilingual roles (English + another language). Avg salary: EUR 1200-1800/month.',
      construction: 'Construction & Labor: Physical work, Hungarian usually required. Avg salary: EUR 1000-1500/month.',
      remote: 'Remote Work: Increasingly common. You may need to register as a contractor (vallalkozo).',
    },
    cv: 'Hungarian CV tips:\n- Include a professional photo (standard here)\n- Use Europass format or local template\n- Include: personal details, education, work experience, languages, skills\n- Mention magyar adoszam (tax ID) if you have one\n- List references with contact info',
    interview: 'Interview tips:\n- Punctuality is very important\n- Dress formally for corporate roles\n- First meetings often include small talk about background\n- Contracts are typically detailed and in Hungarian - get a translation',
  },

  city: {
    budapest: {
      title: 'Budapest City Guide',
      districts: 'Budapest has 23 districts. Central: 5, 6, 7. Residential: 2, 12. Affordable: 8, 9, 10. Modern: 13, 11.',
      transport: 'BKK operates metro (M1-M4), trams, buses, and suburban trains. Single ticket: EUR 1.20. Monthly pass: EUR 30. Night buses run on main routes.',
      emergency: 'Emergency: 112. Police: 107. Ambulance: 104. Fire: 105.',
      hospitals: 'Major hospitals: Semmelweis University clinics, Uzsoki Street Hospital, Szent Janos Hospital.',
      supermarkets: 'Supermarket chains: Spar, Auchan, Tesco, Lidl, Aldi, Penny Market. Open Mon-Sat 6AM-10PM, Sun 8AM-8PM.',
      simcard: 'Mobile operators: Telekom, Telenor (Yettel), Vodafone. Prepaid SIM from ~EUR 5. ID required for purchase.',
      banks: 'Major banks: OTP, K&H, Erste, Raiffeisen, Unicredit. Accounts available for non-residents with passport.',
      language: 'Hungarian is the official language. English is common in central Budapest. German and Russian also useful.',
      weather: 'Continental climate. Summers: 25-35C. Winters: -5 to 5C. Rain throughout year. Heating season: October-April.',
    },
  },

  checklist: {
    week1: [
      'Register your address at the local kormanyablak (within 3 days of arrival)',
      'Get a Hungarian SIM card for your phone',
      'Open a Hungarian bank account',
      'Apply for TAJ (social security number)',
      'Buy a BKK monthly public transport pass',
      'Get a Reka card (electronic student/public transport card if applicable)',
    ],
    week2: [
      'Apply for tax ID (adoszam) at NAV (tax office)',
      'Register with a general practitioner (haziorvos)',
      'Explore your local district - find supermarkets, pharmacy, ATM',
      'Set up utilities if renting (electricity, gas, internet)',
      'Download useful apps: BKK FUTAR, Google Maps, Revolut/Wise',
    ],
    month1: [
      'Apply for residence permit if not already done',
      'Get health insurance (if not covered by TAJ)',
      'Join local Facebook expat groups',
      'Find a language course (Magyar) or conversation group',
      'Register for Neptun (student system) if studying',
      'Set up monthly budget based on local costs',
      'Visit the local piac (market) for affordable fresh food',
    ],
    month3: [
      'Check your residence permit status',
      'Renew any expiring documents',
      'Build emergency savings (3 months expenses recommended)',
      'Explore nearby cities (Szentendre, Eger, Pecs are great day trips)',
      'Consider professional networking events in your field',
      'Review your budget and adjust spending habits',
    ],
  },
};

function getImmigrationGuide(reason) {
  const guide = KNOWLEDGE.immigration[reason] || KNOWLEDGE.immigration.general;
  let text = guide.title + '\n\nSteps to follow:\n';
  guide.steps.forEach((s, i) => {
    text += (i + 1) + '. ' + s + '\n';
  });
  text += '\n' + guide.tips;
  if (guide.offices) text += '\n\n' + guide.offices;
  return text;
}

function getCostOfLiving(city = 'budapest') {
  const data = KNOWLEDGE.costOfLiving[city] || KNOWLEDGE.costOfLiving.budapest;
  let text = data.title + '\n\nRent:\n';
  Object.values(data.rent || {}).forEach((v) => { text += '- ' + v + '\n'; });
  text += '\nUtilities: ' + data.utilities;
  text += '\n\nTransport:\n';
  Object.values(data.transport || {}).forEach((v) => { text += '- ' + v + '\n'; });
  text += '\n\nFood:\n';
  Object.values(data.food || {}).forEach((v) => { text += '- ' + v + '\n'; });
  if (data.summary) text += '\n' + data.summary;
  return text;
}

function getHousingGuide(district) {
  let text = KNOWLEDGE.housing.title + '\n\n';
  if (district && KNOWLEDGE.housing.districts[district]) {
    text += KNOWLEDGE.housing.districts[district] + '\n\n';
  } else {
    text += 'Popular districts:\n';
    Object.values(KNOWLEDGE.housing.districts).forEach((v) => { text += '- ' + v + '\n'; });
  }
  text += '\nRental websites:\n';
  KNOWLEDGE.housing.websites.forEach((w) => { text += '- ' + w + '\n'; });
  text += '\nImportant tips:\n';
  KNOWLEDGE.housing.tips.forEach((t) => { text += '- ' + t + '\n'; });
  text += '\n' + KNOWLEDGE.housing.contract;
  return text;
}

function getJobGuide(topic) {
  let text = KNOWLEDGE.jobs.title + '\n\n';
  if (topic === 'permits' || !topic) {
    text += 'Work permits:\n';
    Object.entries(KNOWLEDGE.jobs.permits).forEach(([k, v]) => { text += '- ' + v + '\n'; });
  }
  if (!topic || topic === 'websites') {
    text += '\nJob portals:\n';
    KNOWLEDGE.jobs.websites.forEach((w) => { text += '- ' + w + '\n'; });
  }
  if (!topic || topic === 'industries') {
    text += '\nIndustries:\n';
    Object.values(KNOWLEDGE.jobs.industries).forEach((v) => { text += '- ' + v + '\n'; });
  }
  if (!topic || topic === 'cv') {
    text += '\n' + KNOWLEDGE.jobs.cv + '\n';
  }
  if (!topic || topic === 'interview') {
    text += '\n' + KNOWLEDGE.jobs.interview;
  }
  return text;
}

function getChecklist(period) {
  const data = KNOWLEDGE.checklist[period];
  if (!data) {
    let text = 'Newcomer Daily Checklist\n\n';
    Object.entries(KNOWLEDGE.checklist).forEach(([p, items]) => {
      text += p.toUpperCase() + ':\n';
      items.forEach((item) => { text += '- ' + item + '\n'; });
      text += '\n';
    });
    return text;
  }
  let text = period.charAt(0).toUpperCase() + period.slice(1) + ' Checklist\n\n';
  data.forEach((item) => { text += '- ' + item + '\n'; });
  return text;
}

function getCityGuide() {
  const city = KNOWLEDGE.city.budapest;
  let text = city.title + '\n\n';
  text += 'Districts: ' + city.districts + '\n\n';
  text += 'Transport: ' + city.transport + '\n\n';
  text += 'Emergency: ' + city.emergency + '\n\n';
  text += 'Hospitals: ' + city.hospitals + '\n\n';
  text += 'Supermarkets: ' + city.supermarkets + '\n\n';
  text += 'Mobile: ' + city.simcard + '\n\n';
  text += 'Banks: ' + city.banks + '\n\n';
  text += 'Language: ' + city.language + '\n\n';
  text += 'Weather: ' + city.weather;
  return text;
}

export {
  KNOWLEDGE,
  getImmigrationGuide,
  getCostOfLiving,
  getHousingGuide,
  getJobGuide,
  getChecklist,
  getCityGuide,
};
