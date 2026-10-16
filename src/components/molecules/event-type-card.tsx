import { useRef, useState } from 'react';

import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/ui/button';
import { PUBLIC_WEB_URL } from '@/constants/env';
import type { EventForm } from '@/hooks/useEventForm';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/utils/clipboard';

interface EventTypeCardProps {
    form: EventForm;
    // An existing event keeps its link, because it may already have been shared.
    isSlugLocked: boolean;
    'data-test-id': string;
}

const TYPE_OPTIONS = [
    { value: false, label: 'Internal', description: 'Hanya member yang bisa mendaftar.' },
    { value: true, label: 'Terbuka untuk external', description: 'Non-member juga bisa mendaftar lewat halaman publik.' },
];

// Side card under "Status": who may join, and the public registration link that goes with an open event.
export const EventTypeCard = ({ form, isSlugLocked, 'data-test-id': testId }: EventTypeCardProps) => {
    const { fields, errors, setField, setSlug } = form;
    const [isEditingSlug, setIsEditingSlug] = useState(false);
    const slugInput = useRef<HTMLInputElement>(null);
    const baseUrl = `${PUBLIC_WEB_URL || '[domain]'}/e/`;

    const toggleSlugEditing = () => {
        const next = !isEditingSlug;

        setIsEditingSlug(next);

        if (next) window.setTimeout(() => slugInput.current?.focus(), 0);
    };

    return (
        <section className="border-border bg-card space-y-4 rounded-lg border p-5" data-test-id={testId}>
            <h2 className="font-semibold">Tipe kegiatan</h2>

            <fieldset className="grid gap-2" data-test-id={`${testId}_type`}>
                <legend className="sr-only">Tipe kegiatan</legend>
                {TYPE_OPTIONS.map((option) => (
                    <label
                        key={String(option.value)}
                        className="border-input bg-card has-[:checked]:border-foreground has-[:checked]:bg-secondary has-[:focus-visible]:ring-ring flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm has-[:focus-visible]:ring-2"
                    >
                        <input
                            type="radio"
                            name="allowsNonMember"
                            checked={fields.allowsNonMember === option.value}
                            onChange={() => setField('allowsNonMember', option.value)}
                            className="accent-foreground mt-0.5 size-4"
                            data-test-id={`${testId}_radio_${option.value ? 'external' : 'internal'}`}
                        />
                        <span>
                            <span className="block font-medium">{option.label}</span>
                            <span className="text-muted-foreground block">{option.description}</span>
                        </span>
                    </label>
                ))}
            </fieldset>

            {fields.allowsNonMember && (
                <FormField
                    id="slug"
                    label="Link pendaftaran publik"
                    isOptional
                    hint={
                        isSlugLocked
                            ? 'Link tidak bisa diubah setelah kegiatan dibuat.'
                            : 'Dibuat otomatis dari judul. Klik Edit untuk mengubah; hanya huruf kecil, angka, dan tanda hubung.'
                    }
                    error={errors.slug}
                    data-test-id={`${testId}_slug`}
                >
                    <div className="space-y-2">
                        <div
                            className={cn(
                                'border-input flex min-h-11 flex-wrap items-center rounded-md border px-3 font-mono text-xs',
                                isEditingSlug ? 'bg-card' : 'bg-secondary/60',
                            )}
                        >
                            <span className="text-muted-foreground shrink-0">{baseUrl}</span>
                            <input
                                ref={slugInput}
                                id="slug"
                                value={fields.slug}
                                readOnly={!isEditingSlug}
                                placeholder="[slug]"
                                onChange={(event) => setSlug(event.target.value)}
                                className="min-w-24 flex-1 bg-transparent py-2 outline-hidden read-only:cursor-default"
                                data-test-id={`${testId}_input_slug`}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {!isSlugLocked && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="bg-card"
                                    onClick={toggleSlugEditing}
                                    data-test-id={`${testId}_button_edit_slug`}
                                >
                                    {isEditingSlug ? 'Selesai' : 'Edit'}
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="bg-card"
                                disabled={!fields.slug}
                                onClick={() => void copyToClipboard(`${baseUrl}${fields.slug}`)}
                                data-test-id={`${testId}_button_copy_link`}
                            >
                                Salin link
                            </Button>
                            <Button asChild variant="outline" size="sm" className="bg-card">
                                <a
                                    href={PUBLIC_WEB_URL ? `${baseUrl}${fields.slug}` : undefined}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-disabled={!PUBLIC_WEB_URL || !fields.slug}
                                    data-test-id={`${testId}_link_public_page`}
                                >
                                    Lihat halaman
                                </a>
                            </Button>
                        </div>
                    </div>
                </FormField>
            )}
        </section>
    );
};
