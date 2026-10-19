import {
    closestCenter,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, GripVertical, LockKeyhole, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { AlertMessage } from '@/components/molecules/alert-message';
import { FormField } from '@/components/molecules/form-field';
import { RegistrationFormPreview } from '@/components/molecules/registration-form-preview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { REGISTRATION_FORM_LIMITS as LIMITS, REGISTRATION_FIELD_TYPES } from '@/constants/registration-form';
import type { RegistrationFormBuilder as Builder } from '@/hooks/useRegistrationFormBuilder';
import { cn } from '@/lib/utils';
import type { RegistrationField, RegistrationFieldType } from '@/types/registration-form';
import { hasRegistrationOptions } from '@/utils/registration-form';

interface FieldEditorProps {
    field: RegistrationField;
    index: number;
    builder: Builder;
    disabled: boolean;
    move: (id: string, direction: -1 | 1) => void;
}

const FieldEditor = ({ field, index, builder, disabled, move }: FieldEditorProps) => {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: field.id, disabled });
    const error = (key: string) => builder.errors[`field.${field.id}.${key}`];
    const labelId = `registration-${field.id}-label`;

    return (
        <fieldset
            ref={setNodeRef}
            disabled={disabled}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn('border-border bg-card min-w-0 space-y-4 rounded-lg border p-4', isDragging && 'opacity-30')}
            data-test-id={`registration_field_${field.id}`}
        >
            <legend className="sr-only">Pertanyaan {index + 1}</legend>
            <div className="flex items-center gap-1">
                <Button
                    {...attributes}
                    {...listeners}
                    ref={setActivatorNodeRef}
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    className="size-11 shrink-0 cursor-grab touch-none active:cursor-grabbing"
                    aria-label={`Geser pertanyaan ${index + 1}`}
                    data-test-id={`registration_drag_${field.id}`}
                >
                    <GripVertical />
                </Button>
                <h3 className="min-w-0 flex-1 text-xs font-semibold break-words sm:text-sm">Pertanyaan {index + 1}</h3>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0"
                    disabled={disabled || index === 0}
                    onClick={() => move(field.id, -1)}
                    aria-label={`Naikkan pertanyaan ${index + 1}`}
                    data-test-id={`registration_up_${field.id}`}
                >
                    <ArrowUp />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0"
                    disabled={disabled || index === builder.definition.fields.length - 1}
                    onClick={() => move(field.id, 1)}
                    aria-label={`Turunkan pertanyaan ${index + 1}`}
                    data-test-id={`registration_down_${field.id}`}
                >
                    <ArrowDown />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive size-11 shrink-0"
                    disabled={disabled}
                    onClick={() => builder.removeField(field.id)}
                    aria-label={`Hapus pertanyaan ${index + 1}`}
                    data-test-id={`registration_remove_${field.id}`}
                >
                    <Trash2 />
                </Button>
            </div>
            {(error('id') || error('required')) && (
                <AlertMessage data-test-id={`registration_field_error_${field.id}`}>{error('id') ?? error('required')}</AlertMessage>
            )}
            <FormField id={labelId} label="Label pertanyaan" error={error('label')} data-test-id={`registration_label_${field.id}`}>
                <Input
                    id={labelId}
                    className="bg-card h-11"
                    value={field.label}
                    maxLength={LIMITS.label}
                    aria-required
                    aria-invalid={Boolean(error('label'))}
                    disabled={disabled}
                    onChange={(event) => builder.updateField(field.id, { label: event.target.value })}
                    data-test-id={`registration_input_label_${field.id}`}
                />
            </FormField>
            <div className="grid items-end gap-4 sm:grid-cols-2">
                <FormField
                    id={`registration-${field.id}-type`}
                    label="Jenis isian"
                    hint="Mengubah ke Input/Textarea akan menghapus pilihan pada pertanyaan ini."
                    error={error('type')}
                    data-test-id={`registration_type_${field.id}`}
                >
                    <NativeSelect
                        id={`registration-${field.id}-type`}
                        value={field.type}
                        className="h-11"
                        disabled={disabled}
                        aria-required
                        onChange={(event) => builder.setType(field.id, event.target.value as RegistrationFieldType)}
                        data-test-id={`registration_select_type_${field.id}`}
                    >
                        {REGISTRATION_FIELD_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </NativeSelect>
                </FormField>
                <div className="flex min-h-11 items-center gap-3">
                    <Switch
                        id={`registration-${field.id}-required`}
                        checked={field.required}
                        disabled={disabled}
                        onCheckedChange={(required) => builder.updateField(field.id, { required })}
                        data-test-id={`registration_required_${field.id}`}
                    />
                    <Label htmlFor={`registration-${field.id}-required`}>Wajib diisi</Label>
                </div>
            </div>
            {hasRegistrationOptions(field.type) && (
                <div className="space-y-3" role="group" aria-label={`Pilihan pertanyaan ${index + 1}`}>
                    {error('options') && <AlertMessage data-test-id={`registration_options_error_${field.id}`}>{error('options')}</AlertMessage>}
                    {field.options.map((option, optionIndex) => (
                        <div key={option.id} className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                                <FormField
                                    id={`registration-option-${option.id}`}
                                    label={`Pilihan ${optionIndex + 1}`}
                                    error={builder.errors[`option.${option.id}.label`] ?? builder.errors[`option.${option.id}.id`]}
                                    data-test-id={`registration_option_${option.id}`}
                                >
                                    <Input
                                        id={`registration-option-${option.id}`}
                                        className="bg-card h-11"
                                        value={option.label}
                                        maxLength={LIMITS.label}
                                        aria-required
                                        disabled={disabled}
                                        onChange={(event) => builder.updateOption(field.id, option.id, event.target.value)}
                                        data-test-id={`registration_input_option_${option.id}`}
                                    />
                                </FormField>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mt-6 size-11 shrink-0"
                                disabled={disabled}
                                onClick={() => builder.removeOption(field.id, option.id)}
                                aria-label={`Hapus pilihan ${optionIndex + 1} pertanyaan ${index + 1}`}
                                data-test-id={`registration_remove_option_${option.id}`}
                            >
                                <Trash2 />
                            </Button>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        className="min-h-11"
                        disabled={disabled || field.options.length >= LIMITS.options}
                        onClick={() => builder.addOption(field.id)}
                        data-test-id={`registration_add_option_${field.id}`}
                    >
                        <Plus />
                        Tambah pilihan
                    </Button>
                    <p className="text-muted-foreground text-xs">
                        Minimal 1, maksimal {LIMITS.options} pilihan. Label maksimal {LIMITS.label} karakter.
                    </p>
                </div>
            )}
        </fieldset>
    );
};

interface RegistrationFormBuilderProps {
    builder: Builder;
    disabled?: boolean;
}

export const RegistrationFormBuilder = ({ builder, disabled = false }: RegistrationFormBuilderProps) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [moveNotice, setMoveNotice] = useState('');
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );
    const readOnly = disabled || builder.readOnly;
    const fields = builder.definition.fields;
    const activeField = fields.find((field) => field.id === activeId);
    const move = (id: string, direction: -1 | 1) => {
        const index = fields.findIndex((field) => field.id === id);
        const target = fields[index + direction];
        if (readOnly || !target) return;
        builder.reorder(id, target.id);
        setMoveNotice(`Pertanyaan dipindahkan ke urutan ${index + direction + 1}.`);
    };
    const onDragEnd = ({ active, over }: DragEndEvent) => {
        setActiveId(null);
        if (readOnly || !over || active.id === over.id) return;
        builder.reorder(String(active.id), String(over.id));
        setMoveNotice(`Pertanyaan dipindahkan ke urutan ${fields.findIndex((field) => field.id === over.id) + 1}.`);
    };

    return (
        <section className="border-border bg-card min-w-0 space-y-4 rounded-lg border p-4 sm:p-5" data-test-id="registration_form_builder">
            <div className="space-y-2">
                <h2 className="font-semibold">Registration Form</h2>
                <p className="text-muted-foreground text-sm">
                    Nama dan Email selalu wajib. Tambahkan pertanyaan sesuai kebutuhan, lalu geser pegangan atau gunakan tombol naik/turun untuk
                    mengatur urutan.
                </p>
                <p className="text-muted-foreground text-xs">
                    {fields.length}/{LIMITS.fields} pertanyaan tambahan · Versi {builder.definition.version}
                </p>
            </div>
            {!builder.available && (
                <AlertMessage data-test-id="registration_form_unavailable">
                    API belum menyediakan konfigurasi formulir. Bagian ini tidak dapat diubah; data kegiatan lain tetap bisa disimpan.
                </AlertMessage>
            )}
            {builder.lockedAt && (
                <p role="status" className="bg-secondary flex items-start gap-2 rounded-md p-3 text-sm" data-test-id="registration_form_locked">
                    <LockKeyhole className="size-4 shrink-0" />
                    Formulir terkunci karena kegiatan sudah pernah menerima pendaftaran. Detail kegiatan lain tetap dapat diubah.
                </p>
            )}
            {builder.errors.form && <AlertMessage data-test-id="registration_form_error">{builder.errors.form}</AlertMessage>}
            {builder.requiresReload && (
                <div className="space-y-2">
                    <p className="text-sm">
                        Perubahan belum disimpan. Muat ulang untuk memakai versi terbaru; perubahan lokal di halaman ini akan dibuang.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        className="min-h-11"
                        onClick={() => window.location.reload()}
                        data-test-id="registration_form_reload"
                    >
                        Muat ulang halaman
                    </Button>
                </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2" data-test-id="registration_form_system_fields">
                <label className="grid gap-2 text-sm font-medium">
                    Nama *<Input disabled readOnly placeholder="Nama peserta" className="bg-card h-11" data-test-id="registration_system_name" />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                    Email *
                    <Input
                        disabled
                        readOnly
                        type="email"
                        placeholder="nama@email.com"
                        className="bg-card h-11"
                        data-test-id="registration_system_email"
                    />
                </label>
            </div>
            <p className="text-muted-foreground text-xs">
                Kedua field sistem tidak dapat dihapus atau dipindahkan. Nilainya otomatis terisi dan terkunci saat member mendaftar.
            </p>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={({ active }) => setActiveId(String(active.id))}
                onDragCancel={() => setActiveId(null)}
                onDragEnd={onDragEnd}
                accessibility={{
                    screenReaderInstructions: {
                        draggable:
                            'Tekan Spasi atau Enter untuk mengangkat pertanyaan, panah atas/bawah untuk memindahkan, Spasi atau Enter untuk meletakkan, Escape untuk membatalkan.',
                    },
                    announcements: {
                        onDragStart: () => 'Pertanyaan diangkat.',
                        onDragOver: ({ over }) =>
                            over ? `Urutan tujuan ${fields.findIndex((field) => field.id === over.id) + 1}.` : 'Di luar daftar pertanyaan.',
                        onDragEnd: ({ over }) =>
                            over
                                ? `Pertanyaan diletakkan pada urutan ${fields.findIndex((field) => field.id === over.id) + 1}.`
                                : 'Urutan tidak berubah.',
                        onDragCancel: () => 'Pemindahan dibatalkan.',
                    },
                }}
            >
                <SortableContext items={fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <FieldEditor key={field.id} field={field} index={index} builder={builder} disabled={readOnly} move={move} />
                        ))}
                    </div>
                </SortableContext>
                <DragOverlay>
                    {activeField ? (
                        <div className="border-primary bg-card rounded-lg border p-4 shadow-lg">{activeField.label || 'Pertanyaan tambahan'}</div>
                    ) : null}
                </DragOverlay>
            </DndContext>
            <p role="status" className="sr-only">
                {moveNotice}
            </p>
            {fields.length === 0 && (
                <p className="text-muted-foreground text-sm" data-test-id="registration_form_empty">
                    Belum ada pertanyaan tambahan. Peserta tetap mengisi Nama dan Email.
                </p>
            )}
            <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={readOnly || fields.length >= LIMITS.fields}
                onClick={builder.addField}
                data-test-id="registration_add_field"
            >
                <Plus />
                Tambah pertanyaan
            </Button>
            <RegistrationFormPreview definition={builder.definition} />
        </section>
    );
};
