# Masterlist import mock contract

Status: **mock v1**. This enables frontend work before an anonymized real masterlist sample exists. It is not a claim about the final spreadsheet columns.

## Boundary

The import UI talks to an adapter exposing the operations below. During frontend development the adapter returns fixtures. When the real file arrives, preserve UI-facing response shapes and update the parser/mapping layer.

## Input

Accepted UI placeholder formats: `.csv` and `.xlsx`, maximum 10 MB. The mock does not upload member data to an external service.

## Preview request

```ts
type MasterlistPreviewRequest = {
  file: File;
  mapping?: Partial<Record<MasterlistField, string>>;
};

type MasterlistField =
  | 'email'
  | 'name'
  | 'birth_year'
  | 'phone_wa'
  | 'participation_preference'
  | 'province_code'
  | 'regency_code'
  | 'district_code'
  | 'postal_code'
  | 'consented_at'
  | 'rules_version';
```

## Preview response

```ts
type MasterlistPreview = {
  import_id: string;
  filename: string;
  detected_columns: string[];
  suggested_mapping: Partial<Record<MasterlistField, string>>;
  summary: {
    total_rows: number;
    valid_rows: number;
    warning_rows: number;
    invalid_rows: number;
  };
  rows: MasterlistPreviewRow[];
};

type MasterlistPreviewRow = {
  row_number: number;
  values: Partial<Record<MasterlistField, string | number | null>>;
  issues: Array<{
    field: MasterlistField | 'row';
    severity: 'warning' | 'error';
    code: string;
    message: string;
  }>;
};
```

## Confirm request and result

```ts
type MasterlistConfirmRequest = {
  import_id: string;
  mapping: Record<MasterlistField, string | null>;
  skip_invalid_rows: boolean;
};

type MasterlistImportResult = {
  import_id: string;
  status: 'completed' | 'completed_with_errors' | 'failed';
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  error_report_url: string | null;
};
```

## Mock scenarios

- Clean import with all fields.
- Missing required-column mapping.
- Rows missing district/postal code (invalid under the confirmed migration-completion rule).
- Duplicate email, duplicate WhatsApp number, malformed email, non-Indonesian phone, unknown regional code, and under-17 birth year.
- Existing member match requiring review; do not silently overwrite existing records.

## Later decisions after sample arrives

- Actual source headers and date/phone formats.
- Whether blank legacy values remain nullable until first login.
- Duplicate resolution and update policy.
- Consent evidence available in legacy data.
- Maximum practical batch size on Hostinger shared hosting.

