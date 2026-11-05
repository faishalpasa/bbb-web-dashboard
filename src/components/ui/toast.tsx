import { Toast as ToastPrimitive } from '@base-ui/react/toast';
import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert, X } from 'lucide-react';

import { cn } from '@/lib/utils';

// Same shadcn Base UI composition as the member app; dashboard has no bottom navigation.
export const toast = ToastPrimitive.createToastManager();

const STATUS_ICONS = { error: CircleAlert, success: CircleCheck, info: Info, warning: TriangleAlert, loading: LoaderCircle };

const ToastList = () => {
    const { toasts } = ToastPrimitive.useToastManager();

    return toasts.map((item) => {
        const Icon = STATUS_ICONS[item.type as keyof typeof STATUS_ICONS];
        return (
            <ToastPrimitive.Root
                key={item.id}
                toast={item}
                data-slot="toast"
                data-test-id="feedback_toast"
                className={cn(
                    'bg-toast text-toast-foreground border-toast-border pointer-events-auto relative w-full rounded-lg border shadow-lg outline-none',
                    'transition-[opacity,transform] duration-200 data-starting-style:translate-y-2 data-starting-style:opacity-0 data-ending-style:translate-y-2 data-ending-style:opacity-0 data-limited:hidden motion-reduce:transition-none',
                    item.type === 'error' && 'border-toast-error',
                )}
            >
                <ToastPrimitive.Content className="flex items-center gap-3 p-3">
                    {Icon && <Icon aria-hidden className={cn('size-5 shrink-0', item.type === 'error' && 'text-toast-error', item.type === 'loading' && 'animate-spin motion-reduce:animate-none')} />}
                    <div className="min-w-0 flex-1 space-y-1">
                        <ToastPrimitive.Title className="text-sm leading-5 font-semibold wrap-break-word" />
                        {item.description && <ToastPrimitive.Description className="text-toast-muted text-sm leading-5 wrap-break-word" />}
                    </div>
                    <ToastPrimitive.Close
                        aria-label="Tutup notifikasi"
                        className="focus-visible:ring-toast-foreground flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-white/10 focus-visible:ring-2"
                        data-test-id="feedback_toast_close"
                    >
                        <X aria-hidden className="size-4" />
                    </ToastPrimitive.Close>
                </ToastPrimitive.Content>
            </ToastPrimitive.Root>
        );
    });
};

export const Toaster = () => (
    <ToastPrimitive.Provider toastManager={toast} timeout={5000} limit={3}>
        <ToastPrimitive.Portal>
            <ToastPrimitive.Viewport
                aria-label="Notifikasi"
                data-slot="toast-viewport"
                className="pointer-events-none fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] z-[100] mx-auto grid max-w-sm gap-2 outline-none"
            >
                <ToastList />
            </ToastPrimitive.Viewport>
        </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
);
