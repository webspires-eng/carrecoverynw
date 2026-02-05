import BasicPage from '@/components/BasicPage';

export const metadata = {
    title: 'Privacy Policy | Car Recovery UK',
};

export default function PrivacyPolicy() {
    return (
        <BasicPage
            title="Privacy Policy"
            content={
                <>
                    <p>Last updated: February 2026</p>
                    <p>At Car Recovery UK, we take your privacy seriously. This policy describes how we collect, use, and handle your information when you use our services.</p>

                    <h2 style={{ marginTop: '30px' }}>Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as your name, phone number, location, and vehicle details when you request a recovery service.</p>

                    <h2 style={{ marginTop: '30px' }}>How We Use Your Information</h2>
                    <p>We use your information to provide the requested recovery services, communicate ETAs, and process payments.</p>

                    <h2 style={{ marginTop: '30px' }}>Data Security</h2>
                    <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing.</p>
                </>
            }
        />
    );
}
