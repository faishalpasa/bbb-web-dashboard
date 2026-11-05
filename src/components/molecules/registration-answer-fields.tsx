import { FormField } from '@/components/molecules/form-field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import type { RegistrationFormDefinition } from '@/types/registration-form';

interface RegistrationAnswerFieldsProps {
    definition: RegistrationFormDefinition;
    values: Record<string, string | string[]>;
    errors: Record<string, string | undefined>;
    disabled?: boolean;
    onChange: (id: string, value: string | string[]) => void;
}
export const RegistrationAnswerFields = ({ definition, values, errors, disabled = false, onChange }: RegistrationAnswerFieldsProps) => (
    <div className="space-y-4" data-test-id="registration_answer_fields">
        {definition.fields.map((field) => {
            const id = `answer-${field.id}`;
            const common = {
                id,
                disabled,
                'aria-required': field.required,
                'aria-invalid': Boolean(errors[field.id]),
                'aria-describedby': errors[field.id] ? `${id}-error` : undefined,
                'data-test-id': `registration_answer_${field.id}`,
            };
            return (
                <FormField
                    key={field.id}
                    id={id}
                    label={field.label}
                    isOptional={!field.required}
                    error={errors[field.id]}
                    data-test-id={`registration_field_${field.id}`}
                >
                    {field.type === 'file' && (
                        <p className="text-muted-foreground text-sm" data-test-id={`registration_answer_${field.id}`}>
                            Berkas diunggah langsung oleh peserta saat mendaftar sendiri, jadi tidak diisi di sini.
                        </p>
                    )}
                    {field.type === 'input' && (
                        <Input
                            {...common}
                            value={typeof values[field.id] === 'string' ? values[field.id] : ''}
                            maxLength={255}
                            onChange={(e) => onChange(field.id, e.target.value)}
                            className="bg-card h-11"
                        />
                    )}
                    {field.type === 'textarea' && (
                        <Textarea
                            className="bg-card"
                            {...common}
                            value={typeof values[field.id] === 'string' ? values[field.id] : ''}
                            maxLength={5000}
                            onChange={(e) => onChange(field.id, e.target.value)}
                        />
                    )}
                    {field.type === 'select' && (
                        <NativeSelect
                            {...common}
                            value={typeof values[field.id] === 'string' ? values[field.id] : ''}
                            onChange={(e) => onChange(field.id, e.target.value)}
                        >
                            <option value="">Pilih jawaban</option>
                            {field.options.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.label}
                                </option>
                            ))}
                        </NativeSelect>
                    )}
                    {field.type === 'radio' && (
                        <div {...common} role="radiogroup" aria-label={field.label}>
                            {field.options.map((option) => (
                                <label key={option.id} className="flex min-h-11 items-center gap-3">
                                    <input
                                        type="radio"
                                        name={id}
                                        value={option.id}
                                        disabled={disabled}
                                        checked={values[field.id] === option.id}
                                        onChange={() => onChange(field.id, option.id)}
                                        data-test-id={`registration_option_${option.id}`}
                                    />
                                    {option.label}
                                </label>
                            ))}
                            {!field.required && (
                                <button
                                    type="button"
                                    disabled={disabled}
                                    className="min-h-11 text-sm underline"
                                    onClick={() => onChange(field.id, '')}
                                    data-test-id={`registration_clear_${field.id}`}
                                >
                                    Kosongkan pilihan
                                </button>
                            )}
                        </div>
                    )}
                    {field.type === 'checkbox' && (
                        <div {...common} role="group" aria-label={field.label}>
                            {field.options.map((option) => {
                                const currentValue = values[field.id];
                                const selected: string[] = Array.isArray(currentValue) ? currentValue : [];
                                return (
                                    <label key={option.id} className="flex min-h-11 items-center gap-3">
                                        <input
                                            type="checkbox"
                                            name={id}
                                            value={option.id}
                                            disabled={disabled}
                                            checked={selected.includes(option.id)}
                                            onChange={(e) =>
                                                onChange(
                                                    field.id,
                                                    e.target.checked
                                                        ? [...selected, option.id]
                                                        : selected.filter((selectedId) => selectedId !== option.id),
                                                )
                                            }
                                            data-test-id={`registration_option_${option.id}`}
                                        />
                                        {option.label}
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </FormField>
            );
        })}
    </div>
);
