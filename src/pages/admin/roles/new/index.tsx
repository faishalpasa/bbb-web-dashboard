import { RoleForm } from '@/components/molecules/role-form';
import { useRoleEditor } from '@/hooks/useRoleEditor';
import { useTitle } from '@/hooks/useTitle';

export const PageRoleNew = () => {
    useTitle('Buat role');
    return <RoleForm editor={useRoleEditor()} />;
};
