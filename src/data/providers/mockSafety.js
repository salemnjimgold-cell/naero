export const mockSafetyTips = [
  {
    id: 'st1', title: 'Emergency Numbers', category: 'emergency',
    content: 'Keep these numbers saved:\n\nPolice: 112 (EU-wide emergency)\nAmbulance: 104\nFire: 105\n\nNon-emergency police: 107\nTourist Police: +36 1 438 8080\n\nAll emergency operators speak English.',
    severity: 'critical', city: null,
    verified: true, source: 'authority', lastUpdated: '2026-01-01', demo: false,
  },
  {
    id: 'st2', title: 'Public Transport Safety', category: 'transportTips',
    content: '• Always validate your ticket before boarding\n• Keep valuables in front pockets\n• Night buses run every 30-60 mins\n• Metro lines close at 11PM\n• Use BKK app for real-time info\n• Beware of pickpockets on busy lines (especially Metro 4)',
    severity: 'info', city: 'Budapest',
    verified: true, source: 'authority', lastUpdated: '2026-02-15', demo: false,
  },
  {
    id: 'st3', title: 'Know Your Rights', category: 'localLaws',
    content: 'As a foreigner in Hungary:\n\n• Carry passport or residence permit at all times\n• Police can ask for ID without reason\n• You have the right to an interpreter\n• Free legal aid for asylum seekers\n• Report discrimination to Equal Treatment Authority\n• Hungary is EU member - many EU laws apply',
    severity: 'important', city: null,
    verified: true, source: 'authority', lastUpdated: '2026-03-01', demo: false,
  },
  {
    id: 'st4', title: 'Healthcare Access', category: 'healthTips',
    content: 'Healthcare tips:\n\n• Emergency care provided regardless of insurance\n• Register with a GP (háziorvos) in your district\n• EU citizens use EHIC card\n• Non-EU citizens need private insurance\n• Pharmacies (gyógyszertár) open 24/7 in city center\n• Emergency dental: +36 1 267 4602',
    severity: 'info', city: 'Budapest',
    verified: true, source: 'authority', lastUpdated: '2026-04-10', demo: false,
  },
  {
    id: 'st5', title: 'Common Scams to Avoid', category: 'scamAlert',
    content: 'Scams targeting newcomers:\n\n1. "Immigration fee" calls - officials never ask for money over phone\n2. Fake landlords - never pay deposit without seeing property\n3. Job offer scams - legitimate employers don\'t ask for upfront fees\n4. Currency exchange tricks - always check rate first\n5. "Free" language courses that lock you into contracts\n\nWhen in doubt, ask on Naero Community!',
    severity: 'critical', city: null,
    verified: true, source: 'ngo', lastUpdated: '2026-05-20', demo: false,
  },
  {
    id: 'st6', title: 'Winter Safety', category: 'healthTips',
    content: 'Winter in Hungary (Nov-Mar):\n\n• Temperatures can drop to -15°C\n• Wear thermal layers, hat, gloves, scarf\n• Sidewalks can be icy - walk carefully\n• Public transport runs normally in snow\n• Heating included in most rentals\n• Vitamin D supplements recommended\n• Free warm shelters available for homeless',
    severity: 'info', city: null,
    verified: true, source: 'authority', lastUpdated: '2026-04-01', demo: false,
  },
  {
    id: 'st7', title: 'Safe Places in Budapest', category: 'safePlaces',
    content: 'Well-lit and safe areas:\n\n• District 5 (Belváros) - police patrol regularly\n• District 13 (Újlipótváros) - family-friendly\n• Andrássy út area\n• Buda Castle district\n• Városliget (City Park)\n\nAreas to be cautious at night:\n• Certain parts of District 8 (Józsefváros)\n• Underpasses at major junctions\n• Dark side streets in District 7',
    severity: 'info', city: 'Budapest',
    verified: true, source: 'community', lastUpdated: '2026-05-10', demo: false,
  },
];

export const mockEmergencyContacts = [
  { id: 'ec1', name: 'General Emergency', number: '112', icon: 'call', category: 'general', language: 'English' },
  { id: 'ec2', name: 'Ambulance', number: '104', icon: 'medkit', category: 'medical', language: 'Hungarian/English' },
  { id: 'ec3', name: 'Police', number: '107', icon: 'shield', category: 'police', language: 'Hungarian/English' },
  { id: 'ec4', name: 'Fire Department', number: '105', icon: 'flame', category: 'fire', language: 'Hungarian' },
  { id: 'ec5', name: 'Tourist Police', number: '+36 1 438 8080', icon: 'globe', category: 'police', language: 'English' },
  { id: 'ec6', name: 'Emergency Dental', number: '+36 1 267 4602', icon: 'medkit', category: 'medical', city: 'Budapest', language: 'English' },
  { id: 'ec7', name: 'Poison Control', number: '+36 80 201 199', icon: 'warning', category: 'medical', language: 'Hungarian' },
  { id: 'ec8', name: 'UNHCR Hotline', number: '+36 80 123 456', icon: 'people', category: 'ngo', language: 'Arabic/English/French' },
];
