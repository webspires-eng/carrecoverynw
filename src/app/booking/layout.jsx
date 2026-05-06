import { canonicalUrl } from '@/lib/seoSettings';

export async function generateMetadata() {
    return {
        title: 'Book Now | 24/7 Car Recovery Service UK',
        description: 'Book your car recovery service online. Fast response, nationwide coverage, 24/7 availability. Fill in the form and we\'ll dispatch a truck within minutes.',
        alternates: {
            canonical: await canonicalUrl('/booking'),
        },
    };
}

export default function BookingLayout({ children }) {
    return children;
}
