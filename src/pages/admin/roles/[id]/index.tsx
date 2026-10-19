import { useParams } from '@tanstack/react-router';

import { RoleForm } from '@/components/molecules/role-form';
import { useRoleEditor } from '@/hooks/useRoleEditor';
import { useTitle } from '@/hooks/useTitle';

export const PageRoleDetail = () => {
    const { roleId } = useParams({ strict: false });
    useTitle('Detail role');
    return <RoleForm editor={useRoleEditor(roleId)} />;
};
