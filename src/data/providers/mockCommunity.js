export const mockCommunityPosts = [
  {
    id: 'c1', author: 'Amina K.', avatar: null,
    content: 'Just arrived in Budapest last week! Alhamdulillah, I found a mosque near my apartment thanks to this app. Does anyone know where to find halal meat near District 8?',
    city: 'Budapest', likes: 24, comments: [
      { id: 'cm1', postId: 'c1', author: 'Fatima R.', content: 'Try the halal shop at József körút 52! Good quality.', timestamp: '2026-06-20T12:00:00Z', likes: 5 },
      { id: 'cm2', postId: 'c1', author: 'Omar H.', content: 'There is a good butcher in District 7 near Kazinczy utca.', timestamp: '2026-06-20T13:00:00Z', likes: 3 },
    ],
    timestamp: '2026-06-20T10:00:00Z', type: 'post', tags: ['halal', 'district8'],
    verified: false, demo: false,
  },
  {
    id: 'c2', author: 'Pierre L.', avatar: null,
    content: 'Went to Migration Aid today for help with my residence permit. The volunteers spoke perfect French. Highly recommend! They\'re on Király utca 78.',
    city: 'Budapest', likes: 18, comments: [
      { id: 'cm3', postId: 'c2', author: 'Lena M.', content: 'Can confirm! They helped me too with my work visa.', timestamp: '2026-06-19T15:00:00Z', likes: 7 },
    ],
    timestamp: '2026-06-20T08:00:00Z', type: 'review', tags: ['migration-aid', 'residence-permit'],
    verified: false, demo: false,
  },
  {
    id: 'c3', author: 'Fatima R.', avatar: null,
    content: 'Tip for newcomers: Get the BKK monthly pass at the student rate if you\'re studying. It\'s only 3,450 HUF (about €9)! That\'s 50% off the normal price.',
    city: 'Budapest', likes: 42, comments: [
      { id: 'cm4', postId: 'c3', author: 'Ahmed S.', content: 'Great tip! Also students get discounts at museums.', timestamp: '2026-06-19T10:00:00Z', likes: 12 },
    ],
    timestamp: '2026-06-19T08:00:00Z', type: 'tip', tags: ['bkk', 'transport', 'student'],
    verified: false, demo: false,
  },
  {
    id: 'c4', author: 'Ahmed S.', avatar: null,
    content: 'Just finished the Hungarian language course at Balassi Institute. It\'s free for refugees and the teachers are amazing! I can now have basic conversations after 3 months.',
    city: 'Budapest', likes: 36, comments: [
      { id: 'cm5', postId: 'c4', author: 'Fatima R.', content: 'How do I register? Is there a waiting list?', timestamp: '2026-06-18T14:00:00Z', likes: 4 },
      { id: 'cm6', postId: 'c4', author: 'Ahmed S.', content: 'You can apply online on their website. Took me 2 weeks to get in.', timestamp: '2026-06-18T15:00:00Z', likes: 6 },
    ],
    timestamp: '2026-06-18T10:00:00Z', type: 'review', tags: ['language', 'balassi', 'free'],
    verified: false, demo: false,
  },
  {
    id: 'c5', author: 'Lena M.', avatar: null,
    content: 'Does anyone know a good family doctor who speaks Arabic in the 13th district? My daughter needs a checkup.',
    city: 'Budapest', likes: 15, comments: [
      { id: 'cm7', postId: 'c5', author: 'Omar H.', content: 'Dr. Ahmed at International Health Center speaks Arabic. +36 1 234 5678', timestamp: '2026-06-17T16:00:00Z', likes: 8 },
    ],
    timestamp: '2026-06-17T12:00:00Z', type: 'post', tags: ['doctor', 'arabic', 'district13'],
    verified: false, demo: false,
  },
  {
    id: 'c6', author: 'Omar H.', avatar: null,
    content: 'IMPORTANT: There\'s a new phone scam where someone calls pretending to be from immigration. They ask for money to process your application. THIS IS A SCAM. Immigration NEVER asks for payment over the phone.',
    city: 'Budapest', likes: 89, comments: [
      { id: 'cm8', postId: 'c6', author: 'Amina K.', content: 'Thanks for the warning! I almost fell for this.', timestamp: '2026-06-16T09:00:00Z', likes: 23 },
      { id: 'cm9', postId: 'c6', author: 'Pierre L.', content: 'Report this to the police too.', timestamp: '2026-06-16T10:00:00Z', likes: 15 },
    ],
    timestamp: '2026-06-16T08:00:00Z', type: 'alert', tags: ['scam', 'immigration', 'warning'],
    verified: false, demo: false,
  },
  {
    id: 'c7', author: 'Yusuf M.', avatar: null,
    content: 'Has anyone found work in Győr at the Audi factory? I have mechanical engineering background and speak some German. What\'s the application process like?',
    city: 'Győr', likes: 22, comments: [
      { id: 'cm10', postId: 'c7', author: 'Lena M.', content: 'Apply directly on their careers page. They have English HR.', timestamp: '2026-06-15T11:00:00Z', likes: 9 },
    ],
    timestamp: '2026-06-15T09:00:00Z', type: 'question', tags: ['jobs', 'gyor', 'audi'],
    verified: false, demo: false,
  },
  {
    id: 'c8', author: 'Mariam K.', avatar: null,
    content: 'Looking for Arabic-speaking community in Debrecen. Just moved here and feeling a bit isolated. Any groups or events?',
    city: 'Debrecen', likes: 31, comments: [
      { id: 'cm11', postId: 'c8', author: 'Ahmed S.', content: 'There is a small but active Arabic community. Check Facebook group "Arabok Debrecenben".', timestamp: '2026-06-14T14:00:00Z', likes: 11 },
    ],
    timestamp: '2026-06-14T10:00:00Z', type: 'post', tags: ['community', 'debrecen', 'arabic'],
    verified: false, demo: false,
  },
];
