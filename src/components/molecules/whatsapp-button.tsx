import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WhatsappButtonProps {
    href: string;
    label: string;
    // Visible text next to the icon; without it the button is icon only and `label` is its accessible name.
    text?: string;
    // Height of the labeled button, to sit level with its neighbours (a table row uses the small buttons).
    size?: 'default' | 'sm';
    className?: string;
    iconClassName?: string;
    'data-test-id': string;
}

// Opens a WhatsApp chat in a new tab; a link, not a click handler, so it also works with the keyboard.
export const WhatsappButton = ({ href, label, text, size = 'default', className, iconClassName, 'data-test-id': testId }: WhatsappButtonProps) => (
    <Button asChild variant="outline" size={text ? size : 'icon'} className={cn(text ? 'bg-card' : 'bg-card size-9', className)}>
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} data-test-id={testId}>
            <img src="/images/whatsapp.png" alt="" aria-hidden="true" className={cn('size-5 shrink-0', iconClassName)} />
            {text}
        </a>
    </Button>
);
