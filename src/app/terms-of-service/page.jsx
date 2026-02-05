import BasicPage from '@/components/BasicPage';

export const metadata = {
    title: 'Terms of Service | Car Recovery UK',
};

export default function TermsOfService() {
    return (
        <BasicPage
            title="Terms of Service"
            content={
                <>
                    <p>Last updated: February 2026</p>
                    <p>By using the services of Car Recovery UK, you agree to the following terms and conditions.</p>

                    <h2 style={{ marginTop: '30px' }}>Service Provision</h2>
                    <p>We provide vehicle recovery and breakdown assistance. While we aim for rapid response times, ETAs are estimates and may vary due to traffic or weather conditions.</p>

                    <h2 style={{ marginTop: '30px' }}>Customer Responsibility</h2>
                    <p>Customers must provide accurate location and vehicle information. It is the customer's responsibility to remain in a safe location until our recovery vehicle arrives.</p>

                    <h2 style={{ marginTop: '30px' }}>Payment</h2>
                    <p>Payment is due upon completion of the service unless otherwise agreed. We accept cash, card, and bank transfers.</p>
                </>
            }
        />
    );
}
