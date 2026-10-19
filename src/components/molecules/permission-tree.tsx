import { Checkbox } from '@/components/ui/checkbox';
import type { PermissionOption } from '@/types/role';
import { canEnablePermission, permissionGroupState } from '@/utils/permission-tree';

interface TreeRow {
    option: PermissionOption;
    depth: number;
}

// An action nests under the permission it requires inside the same module, so View sits above Create/Update.
const rowsOf = (catalog: readonly PermissionOption[], group: string): TreeRow[] => {
    const options = catalog.filter((option) => option.group === group);
    const names = new Set(options.map((option) => option.name));
    const parentOf = (option: PermissionOption) => option.requires.find((name) => names.has(name));
    const rows: TreeRow[] = [];
    const visit = (option: PermissionOption, depth: number) => {
        rows.push({ option, depth });
        options.filter((child) => parentOf(child) === option.name).forEach((child) => visit(child, depth + 1));
    };
    options.filter((option) => !parentOf(option)).forEach((option) => visit(option, 0));
    return rows;
};

interface PermissionTreeProps {
    catalog: PermissionOption[];
    selected: string[];
    disabled: boolean;
    onToggle: (id: string, enabled: boolean) => void;
    onToggleGroup: (group: string, enabled: boolean) => void;
}

export const PermissionTree = ({ catalog, selected, disabled, onToggle, onToggleGroup }: PermissionTreeProps) => (
    <div className="max-h-[560px] space-y-3 overflow-y-auto pr-2" role="tree" aria-label="Permission" data-test-id="roles_permission_tree">
        {[...new Set(catalog.map((option) => option.group))].map((group) => {
            const state = permissionGroupState(catalog, selected, group);
            const key = group.toLowerCase().replaceAll(' ', '_');
            return (
                <div key={group} role="group" aria-label={`Permission ${group}`}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
                        <Checkbox
                            checked={state.partial ? 'indeterminate' : state.checked}
                            disabled={disabled || state.disabled}
                            onCheckedChange={(checked) => onToggleGroup(group, checked === true)}
                            aria-label={`${group}: semua permission yang dapat diatur`}
                            data-test-id={`roles_checkbox_group_${key}`}
                        />
                        <span>{group}</span>
                        <span className="text-muted-foreground text-xs font-normal" data-test-id={`roles_group_state_${key}`}>
                            {state.count}/{state.total} aktif
                        </span>
                    </label>
                    <ul>
                        {rowsOf(catalog, group).map(({ option, depth }) => (
                            <li key={option.id} style={{ paddingLeft: `${(depth + 1) * 24}px` }}>
                                <label className="flex min-h-11 cursor-pointer items-center gap-3 py-1 text-sm">
                                    <Checkbox
                                        checked={selected.includes(option.id)}
                                        disabled={disabled || !canEnablePermission(catalog, option.id)}
                                        onCheckedChange={(checked) => onToggle(option.id, checked === true)}
                                        aria-label={option.label}
                                        data-test-id={`roles_checkbox_${option.name.replaceAll('-', '_')}`}
                                    />
                                    <span className="min-w-0">
                                        <span className="block">{option.label}</span>
                                        {option.description && (
                                            <span
                                                className="text-muted-foreground block text-xs"
                                                data-test-id={`roles_description_${option.name.replaceAll('-', '_')}`}
                                            >
                                                {option.description}
                                            </span>
                                        )}
                                        {!option.isAssignable && <span className="text-muted-foreground block text-xs">Di luar izin akun Anda.</span>}
                                    </span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        })}
    </div>
);
