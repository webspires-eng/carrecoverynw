import BasicPage from '@/components/BasicPage';

export const metadata = {
    title: 'About Us | Car Recovery UK',
    description: 'Learn more about the UK\'s most reliable 24/7 vehicle recovery and breakdown service.',
};

export default function AboutUs() {
    return (
        <BasicPage
            title="About Us"
            content={
                <>
                    <p>Welcome to Car Recovery UK, your premier choice for professional vehicle recovery and breakdown assistance. With years of experience serving the West Midlands and beyond, we have established ourselves as a leader in the industry.</p>

                    <h2 style={{ marginTop: '30px' }}>Our Mission</h2>
                    <p>Our mission is simple: to provide fast, safe, and reliable vehicle recovery services to our community. We understand that being stranded on the roadside is a stressful experience, and we are dedicated to minimizing your downtime and ensuring your safety.</p>

                    <h2 style={{ marginTop: '30px' }}>Our Team</h2>
                    <p>Our team consists of highly trained recovery specialists who are equipped with the latest technology and tow trucks. Each member of our team is committed to delivering exceptional customer service and technical expertise.</p>

                    <h2 style={{ marginTop: '30px' }}>Editorial Guidelines</h2>
                    <p>Information provided on our website is reviewed by our recovery experts to ensure accuracy and relevance. We aim to provide helpful guides and information regarding vehicle safety and breakdown prevention.</p>
                </>
            }
        />
    );
}
