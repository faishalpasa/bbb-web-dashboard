import { usePageContext } from '../_context';

export const StatCards = () => {
    const { statCards } = usePageContext();

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map((card) => (
                <section key={card.key} className="border-border bg-card rounded-lg border p-4" data-test-id={`dashboard_card_${card.key}`}>
                    <h2 className="text-sm">{card.label}</h2>
                    <p className="mt-1 font-mono text-3xl font-semibold" data-test-id={`dashboard_text_${card.key}_value`}>
                        {card.value}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">{card.hint}</p>
                </section>
            ))}
        </div>
    );
};
