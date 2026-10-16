// Visual marker for mandatory fields; screen readers get the same information from aria-required on the control.
export const RequiredMark = () => <span aria-hidden="true"> *</span>;

export const RequiredNote = () => (
    <p className="text-muted-foreground text-xs" data-test-id="required_note">
        Tanda * berarti wajib diisi.
    </p>
);
