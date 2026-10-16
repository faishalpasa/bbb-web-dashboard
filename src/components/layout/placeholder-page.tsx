interface PlaceholderPageProps {
    title: string;
    testId: string;
}

// Stands in for admin screens whose flow is not implemented yet; replace it when the page lands.
export const PlaceholderPage = ({ title, testId }: PlaceholderPageProps) => (
    <div className="space-y-2" data-test-id={testId}>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">Halaman ini belum diimplementasikan.</p>
    </div>
);
