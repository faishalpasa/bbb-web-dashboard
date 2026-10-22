import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { REGISTRATION_FORM_LIMITS as LIMITS } from '@/constants/registration-form';
import type { RegistrationFormDefinition } from '@/types/registration-form';

interface RegistrationFormPreviewProps {
    definition: RegistrationFormDefinition;
}

export const RegistrationFormPreview = ({ definition }: RegistrationFormPreviewProps) => (
    <details className="border-border rounded-lg border p-4" data-test-id="registration_form_preview">
        <summary className="min-h-11 cursor-pointer font-medium" data-test-id="registration_form_preview_toggle">
            Pratinjau form
        </summary>
        <p className="text-muted-foreground mb-4 text-sm">
            Pratinjau saja, bukan formulir pendaftaran aktif. Nama dan Email otomatis terisi untuk member yang sudah login.
        </p>
        {/* Text fields are read-only (nothing can be typed); selects and radios stay usable so the choices can be opened and tried. */}
        <fieldset className="space-y-4" aria-label="Pratinjau formulir pendaftaran">
            <label className="grid gap-2 text-sm">
                Nama *<Input className="bg-card" placeholder="Nama peserta" readOnly />
            </label>
            <label className="grid gap-2 text-sm">
                Email *<Input className="bg-card" type="email" placeholder="nama@email.com" readOnly />
            </label>
            {definition.fields.map((field, index) => (
                <div key={field.id} className="grid gap-2 text-sm">
                    <span id={`preview-label-${field.id}`}>
                        {field.label || `Pertanyaan ${index + 1}`}
                        {field.required ? ' *' : ' (opsional)'}
                    </span>
                    {field.type === 'input' && (
                        <Input
                            className="bg-card"
                            aria-labelledby={`preview-label-${field.id}`}
                            placeholder="Jawaban singkat"
                            maxLength={LIMITS.input}
                            readOnly
                        />
                    )}
                    {field.type === 'textarea' && (
                        <Textarea
                            className="bg-card"
                            aria-labelledby={`preview-label-${field.id}`}
                            placeholder="Jawaban panjang"
                            maxLength={LIMITS.textarea}
                            readOnly
                        />
                    )}
                    {field.type === 'select' && (
                        <NativeSelect aria-labelledby={`preview-label-${field.id}`} defaultValue="">
                            <option value="">Pilih jawaban</option>
                            {field.options.map((option, optionIndex) => (
                                <option key={option.id} value={option.id}>
                                    {option.label || `Pilihan ${optionIndex + 1}`}
                                </option>
                            ))}
                        </NativeSelect>
                    )}
                    {field.type === 'radio' && (
                        <div role="radiogroup" aria-labelledby={`preview-label-${field.id}`}>
                            {field.options.map((option, optionIndex) => (
                                <label key={option.id} className="flex min-h-11 items-center gap-2">
                                    <input type="radio" name={`preview-${field.id}`} value={option.id} />
                                    {option.label || `Pilihan ${optionIndex + 1}`}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </fieldset>
    </details>
);
