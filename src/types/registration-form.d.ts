export type RegistrationFieldType = 'input' | 'textarea' | 'select' | 'radio';
export interface RegistrationFormData {
    registrationForm: RegistrationFormDefinition;
    identity: { name: string; email: string };
}
export interface RegistrationSubmissionInput {
    formVersion: number;
    answers: { fieldId: string; value: string | null }[];
}

export interface RegistrationOption {
    id: string;
    label: string;
}

export interface RegistrationField {
    id: string;
    type: RegistrationFieldType;
    label: string;
    required: boolean;
    options: RegistrationOption[];
}

export interface RegistrationFormDefinition {
    version: number;
    fields: RegistrationField[];
}

export interface AdminRegistrationForm extends RegistrationFormDefinition {
    lockedAt: string | null;
}

// A snapshot of one answer as it was submitted; labels and options are frozen at that moment.
export interface RegistrationAnswerSnapshot {
    fieldId: string;
    type: RegistrationFieldType;
    label: string;
    required: boolean;
    options: RegistrationOption[];
    value: string | null;
    displayValue: string | null;
}

export interface RegistrationResponse {
    id: string;
    formVersion: number;
    name: string;
    email: string;
    submittedAt: string;
    answers: RegistrationAnswerSnapshot[];
}
