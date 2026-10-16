import { usePageContext } from '../_context';

export const MemberStats = () => {
    const { member } = usePageContext();

    if (!member) return null;

    const stats = [
        { key: 'joined', label: 'Ikut', value: member.statistics.joined },
        { key: 'attended', label: 'Hadir', value: member.statistics.attended },
        { key: 'absent', label: 'Tidak hadir', value: member.statistics.absent },
    ];

    return (
        <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
                <section key={stat.key} className="border-border bg-card rounded-lg border p-4" data-test-id={`member_detail_card_${stat.key}`}>
                    <h2 className="text-sm">{stat.label}</h2>
                    <p className="font-mono text-2xl font-semibold">{stat.value}</p>
                </section>
            ))}
        </div>
    );
};
