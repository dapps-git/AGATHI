const quotes = [
  'Gained 5 kgs in 35 days naturally!',
  'Improved appetite & energy levels within a week.',
  'Natural & effective. No side effects at all.',
  'Gained 4 kgs cleanly without bloating.',
  'Very good Ayurvedic medicine for appetite stimulation.',
  'My digestion has improved so much. Gained 6 kgs total.',
  'Great results, taste is very natural and earthy.',
  'Worked wonders for my weight gain journey.',
  'Natural weight gain powder without any chemicals.',
  'Noticeable difference in appetite within one week!',
  'Gained 3.5 kgs naturally. Tastes very authentic.',
  'Best Ayurvedic weight gain choornam I have used.',
  'Helped me build body confidence naturally.',
  'Super fast delivery and authentic herbs!',
  'Consistently gained healthy weight without fat.',
  'Appetite restored within a few days of taking it.',
  '100% safe and effective weight gain formula.',
  'My body feels energetic and healthy every morning.',
  'Highly satisfied with the product results!',
  'Pure natural herbs, no side effects observed.',
  'Gained 5 kgs in 2 months. Absolutely genuine!',
  'Very effective choornam for weak metabolism.',
  'Appetite booster that actually works.',
  'Natural ingredients and trustworthy quality.',
  'Gained clean muscle mass naturally.',
  'Loved the product! Reordering my 2nd pouch.',
  'Excellent digestive support and weight gain.',
  'Visible weight gain in just 3 weeks!',
  'Trusted product recommended by Ayurvedic advisor.',
  'Safe for daily use with lukewarm milk.',
  'Gained healthy appetite and steady weight.',
  '100% natural, very happy with my progress!',
  'Highly recommended for anyone struggling with underweight.'
];

const durations = [
  '0:45', '0:38', '0:51', '0:42', '0:48', '0:35', '0:40', '0:55',
  '0:32', '0:36', '0:44', '0:50', '0:41', '0:39', '0:52', '0:37',
  '0:47', '0:46', '0:43', '0:40', '0:54', '0:33', '0:42', '0:30',
  '0:53', '0:51', '0:44', '0:31', '0:42', '0:48', '0:38', '0:38', '0:36'
];

const waAudioFiles = [
  'WhatsApp Audio 2026-08-22 at 5.34.47 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.34.48 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.34.49 PM (1).ogg',
  'WhatsApp Audio 2026-08-22 at 5.34.49 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.34.50 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.34.55 PM (1).ogg',
  'WhatsApp Audio 2026-08-22 at 5.34.55 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.34.56 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.34.57 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.34.58 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.34.59 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.00 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.01 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.03 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.04 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.05 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.06 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.07 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.09 PM (1).ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.09 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.10 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.11 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.12 PM (1).ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.12 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.13 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.14 PM (1).ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.14 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.15 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.16 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.17 PM (1).ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.17 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.18 PM (1).ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.18 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.19 PM.ogg',
  'WhatsApp Audio 2026-08-22 at 5.35.20 PM.ogg',
  'WhatsApp Audio 2026-08-29 at 6.51.22 AM.ogg',
  'WhatsApp Audio 2026-08-29 at 6.51.22 AM (1).ogg'
];

// 33 static audio reviews
const staticAudioReviews = Array.from({ length: 33 }, (_, i) => {
  const index = i + 1;
  return {
    _id: `audiorev-static-${index}`,
    name: 'Verified Review',
    photo: '/contact.webp',
    audioUrl: `/images/customer${index}.mp3`,
    duration: durations[i % durations.length],
    quote: quotes[i % quotes.length],
    location: 'Kerala',
    rating: 5,
    order: index,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
});

// 35 WhatsApp audio reviews
const waAudioReviews = waAudioFiles.map((file, i) => {
  const index = i + 1;
  return {
    _id: `audiorev-wa-${index}`,
    name: 'Verified Review',
    photo: '/contact.webp',
    audioUrl: `/audioreview/${file}`,
    duration: durations[(i + 5) % durations.length],
    quote: quotes[(i + 3) % quotes.length],
    location: 'Kerala',
    rating: 5,
    order: 33 + index,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
});

export const defaultAudioReviews = [...staticAudioReviews, ...waAudioReviews];
export default defaultAudioReviews;
