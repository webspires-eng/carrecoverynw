import ThankYouClient from "./ThankYouClient";
import Footer from "@/components/Footer";

// Server shell: the interactive page lives in ThankYouClient (client component),
// while Footer stays a server component so its code and the settings fetch
// never ship in the client JS bundle.
export default function Page() {
    return (
        <>
            <ThankYouClient />
            <Footer />
        </>
    );
}
