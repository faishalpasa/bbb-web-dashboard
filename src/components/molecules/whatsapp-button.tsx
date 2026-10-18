import { Button } from '@/components/ui/button';

interface WhatsappButtonProps {
    href: string;
    label: string;
    // Visible text next to the icon; without it the button is icon only and `label` is its accessible name.
    text?: string;
    // Height of the labeled button, to sit level with its neighbours (a table row uses the small buttons).
    size?: 'default' | 'sm';
    'data-test-id': string;
}

// Opens a WhatsApp chat in a new tab; a link, not a click handler, so it also works with the keyboard.
export const WhatsappButton = ({ href, label, text, size = 'default', 'data-test-id': testId }: WhatsappButtonProps) => (
    <Button asChild variant="outline" size={text ? size : 'icon'} className={text ? 'bg-card' : 'bg-card size-9'}>
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} data-test-id={testId}>
            <img src="/images/whatsapp.png" alt="" aria-hidden="true" className="size-5 shrink-0" />
            {text}
        </a>
    </Button>
);
