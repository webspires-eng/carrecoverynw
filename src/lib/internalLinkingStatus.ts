export type LinkStatus = 'green' | 'yellow' | 'red';

export type LinkStats = {
    outbound: number;
    inbound: number;
    status: LinkStatus;
    label: string;
};

export function classifyLinkStatus(outbound: number, inbound: number): LinkStats {
    if (outbound >= 6 && inbound >= 3) {
        return { outbound, inbound, status: 'green', label: 'Fully linked' };
    }
    if (outbound > 0 || inbound > 0) {
        return {
            outbound,
            inbound,
            status: 'yellow',
            label:
                inbound < 3
                    ? `Few inbound links (${inbound})`
                    : `Few outbound links (${outbound})`,
        };
    }
    return { outbound, inbound, status: 'red', label: 'No internal links yet' };
}
