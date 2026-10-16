import { usePageContext } from '../_context';
import { Panel } from './panel';
import { ProgressBar } from './progress-bar';

export const ProvinceCard = () => {
    const { dashboard } = usePageContext();
    const provinces = dashboard?.provinces ?? [];

    return (
        <Panel title="Sebaran Provinsi" description="5 teratas dari member aktif" data-test-id="dashboard_panel_provinces">
            <ul className="space-y-3 p-4">
                {provinces.map((province) => (
                    <li key={province.name} className="flex items-center gap-3 text-sm">
                        <span className="w-24 shrink-0">{province.name}</span>
                        <ProgressBar className="flex-1" percent={province.percent} label={`Persentase member di ${province.name}`} />
                        <span className="w-9 shrink-0 text-right font-mono">{province.percent}%</span>
                    </li>
                ))}
            </ul>
        </Panel>
    );
};
