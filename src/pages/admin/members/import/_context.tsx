import { useNavigate, useSearch } from '@tanstack/react-router';
import { createContext, type PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';

import { PERMISSIONS as P } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import { usePermissions } from '@/hooks/usePermissions';
import { getMasterlistPreview, postMasterlistPreview } from '@/services/masterlist';
import type { MasterlistField, MasterlistMapping, MasterlistPreview, MasterlistRow } from '@/types/masterlist';
import { errorMessage, fieldErrorMessage } from '@/utils/error';

interface PageContextValue {
    preview: MasterlistPreview | null;
    file: File | null;
    columns: string[];
    mapping: MasterlistMapping;
    busy: boolean;
    perPage: number;
    changePerPage: (size: number) => void;
    failure: string | null;
    fileError: string | undefined;
    detail: MasterlistRow | null;
    selectFile: (file: File | null) => void;
    setMapping: (field: MasterlistField, header: string) => void;
    submit: () => Promise<void>;
    goToPage: (page: number) => Promise<void>;
    setDetail: (row: MasterlistRow | null) => void;
    retry: () => void;
}
const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const [preview, setPreview] = useState<MasterlistPreview | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [mapping, setMappingState] = useState<MasterlistMapping>({});
    const [columns, setColumns] = useState<string[]>([]);
    const [reload, setReload] = useState(0);
    const [busy, setBusy] = useState(false);
    const [perPage, setPerPage] = useState(25);
    const [failure, setFailure] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string>();
    const [detail, setDetail] = useState<MasterlistRow | null>(null);
    const { previewId } = useSearch({ strict: false });
    const navigate = useNavigate();
    const latest = useRef(0);
    const currentPreview = useRef<string | null>(null);
    const { can } = usePermissions();
    const allowed = can(P.MEMBER_IMPORT_PREVIEW);

    useEffect(() => {
        if (!allowed) {
            latest.current++;
            setPreview(null);
            setDetail(null);
            setFile(null);
            setColumns([]);
            setBusy(false);
            return;
        }
        if (!previewId || currentPreview.current === previewId) return;
        const request = ++latest.current;
        setBusy(true);
        setPreview(null);
        void getMasterlistPreview(previewId)
            .then(({ data }) => {
                if (latest.current !== request) return;
                currentPreview.current = data.import_id;
                setPreview(data);
                setMappingState(data.suggested_mapping);
                setColumns(data.detected_columns);
                setFailure(null);
            })
            .catch((error: unknown) => {
                if (latest.current === request) setFailure(errorMessage(error));
            })
            .finally(() => {
                if (latest.current === request) setBusy(false);
            });
        const requestSequence = latest;
        return () => {
            requestSequence.current++;
        };
    }, [previewId, allowed, reload]);

    const selectFile = (next: File | null) => {
        setFile(next);
        setMappingState({});
        setColumns([]);
        setPreview(null);
        setDetail(null);
        setFailure(null);
        setFileError(undefined);
        currentPreview.current = null;
        void navigate({ to: ROUTES.memberImport, search: {}, replace: true });
    };
    const submit = async () => {
        if (!allowed || busy) return;
        if (!file) {
            setFileError('Pilih file masterlist terlebih dahulu.');
            return;
        }
        if (file.size > 10 * 1024 * 1024 || !/\.(csv|xlsx)$/i.test(file.name)) {
            setFileError('Gunakan CSV/XLSX maksimal 10 MB.');
            return;
        }
        const request = ++latest.current;
        setBusy(true);
        setFailure(null);
        setFileError(undefined);
        setPreview(null);
        setDetail(null);
        try {
            const { data } = await postMasterlistPreview(file, mapping, perPage);
            if (latest.current !== request) return;
            currentPreview.current = data.import_id;
            setPreview(data);
            setMappingState(data.suggested_mapping);
            setColumns(data.detected_columns);
            void navigate({ to: ROUTES.memberImport, search: { previewId: data.import_id }, replace: true });
        } catch (error) {
            if (latest.current !== request) return;
            setFailure(errorMessage(error));
            setFileError(fieldErrorMessage(error, 'file'));
        } finally {
            if (latest.current === request) setBusy(false);
        }
    };
    const goToPage = async (page: number, size = perPage) => {
        if (!allowed || busy || !preview) return;
        const request = ++latest.current;
        setBusy(true);
        setFailure(null);
        setDetail(null);
        try {
            const { data } = await getMasterlistPreview(preview.import_id, page, size);
            if (latest.current === request) setPreview(data);
        } catch (error) {
            if (latest.current === request) {
                setFailure(errorMessage(error));
                setPreview(null);
            }
        } finally {
            if (latest.current === request) setBusy(false);
        }
    };
    return (
        <PageContext.Provider
            value={{
                preview,
                file,
                columns,
                mapping,
                busy,
                perPage,
                changePerPage: (size) => {
                    setPerPage(size);
                    void goToPage(1, size);
                },
                failure,
                fileError,
                detail,
                selectFile,
                setMapping: (field, header) => setMappingState((previous) => ({ ...previous, [field]: header || null })),
                submit,
                goToPage,
                setDetail,
                retry: () => {
                    currentPreview.current = null;
                    setReload((previous) => previous + 1);
                },
            }}
        >
            {children}
        </PageContext.Provider>
    );
};

export const usePageContext = () => {
    const value = useContext(PageContext);
    if (!value) throw new Error('Member import context is missing.');
    return value;
};
