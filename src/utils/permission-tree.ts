import type { PermissionOption } from '@/types/role';

// UX dependencies come from the API catalog. The server still validates the complete selection on save.
export const canEnablePermission = (catalog: readonly PermissionOption[], id: string): boolean => {
    const byName = new Map(catalog.map((option) => [option.name, option]));
    const visit = (option: PermissionOption | undefined, trail: Set<string>): boolean => {
        if (!option?.isAssignable || trail.has(option.id)) return false;
        const next = new Set(trail).add(option.id);
        return option.requires.every((name) => visit(byName.get(name), next));
    };
    return visit(
        catalog.find((option) => option.id === id),
        new Set(),
    );
};

export const togglePermission = (catalog: readonly PermissionOption[], selected: readonly string[], id: string, enabled: boolean): string[] => {
    const choice = catalog.find((option) => option.id === id);
    if (!choice?.isAssignable) return [...selected];
    const next = new Set(selected);
    const byName = new Map(catalog.map((option) => [option.name, option]));
    if (enabled) {
        if (!canEnablePermission(catalog, id)) return [...selected];
        const visited = new Set<string>();
        const add = (option: PermissionOption) => {
            if (visited.has(option.id)) return;
            visited.add(option.id);
            for (const dependency of option.requires) add(byName.get(dependency)!);
            next.add(option.id);
        };
        // Re-expand dependencies even when the selected state came from an incomplete legacy role.
        add(choice);
    } else {
        const removed = new Set([choice.name]);
        next.delete(id);
        let changed = true;
        while (changed) {
            changed = false;
            for (const option of catalog) {
                if (option.isAssignable && next.has(option.id) && option.requires.some((name) => removed.has(name))) {
                    next.delete(option.id);
                    removed.add(option.name);
                    changed = true;
                }
            }
        }
    }
    return [...next];
};

export const togglePermissionGroup = (catalog: readonly PermissionOption[], selected: readonly string[], group: string, enabled: boolean): string[] =>
    catalog
        .filter((option) => option.group === group && option.isAssignable)
        .reduce((next, option) => togglePermission(catalog, next, option.id, enabled), [...selected]);

export const permissionGroupState = (catalog: readonly PermissionOption[], selected: readonly string[], group: string) => {
    const options = catalog.filter((option) => option.group === group);
    const selectable = options.filter((option) => canEnablePermission(catalog, option.id));
    const count = options.filter((option) => selected.includes(option.id)).length;
    return {
        checked: selectable.length > 0 && selectable.every((option) => selected.includes(option.id)),
        partial: count > 0 && count < options.length,
        count,
        total: options.length,
        disabled: selectable.length === 0,
    };
};
