import BasicPage from '@/components/BasicPage';
import PageSchemaMarkup from '@/components/PageSchemaMarkup';
import { getSettings } from '@/lib/settings';

export const metadata = {
    title: 'Contact Us | Car Recovery UK',
    description: 'Get in touch with us for 24/7 emergency car recovery and towing services.',
};

export default async function ContactUs() {
    const settings = await getSettings();

    return (
        <BasicPage
            title="Contact Us"
            schemaMarkup={<PageSchemaMarkup pageType="contact" settings={settings} />}
            content={
                <>
                    <p>If you are in need of immediate assistance, please call our 24/7 emergency line at <strong>0736 054 4819</strong>.</p>

                    <div style={{ marginTop: '40px', padding: '30px', background: '#f8fafc', borderRadius: '12px' }}>
                        <h3>Emergency Hotline</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ed4705' }}>0736 054 4819</p>

                        <h3 style={{ marginTop: '20px' }}>Headquarters</h3>
                        <p>West Midlands, UK</p>
                    </div>
                </>
            }
        />
    );
}
