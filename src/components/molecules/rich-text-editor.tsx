import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Heading2, Italic, Link2, List, ListOrdered, Redo2, Underline, Undo2 } from 'lucide-react';
import { useEffect } from 'react';

import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    id: string;
    value: string;
    onChange: (html: string) => void;
    'aria-label': string;
    'data-test-id': string;
}

interface ToolButtonProps {
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    'data-test-id': string;
    children: React.ReactNode;
}

const ToolButton = ({ label, active = false, disabled = false, onClick, 'data-test-id': testId, children }: ToolButtonProps) => (
    <button
        type="button"
        aria-label={label}
        title={label}
        aria-pressed={active}
        disabled={disabled}
        // Keep the selection in the editor when a toolbar button is pressed.
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
        className={cn(
            'focus-visible:ring-ring flex size-9 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40',
            active ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary',
        )}
        data-test-id={testId}
    >
        {children}
    </button>
);

/**
 * A small WYSIWYG editor for the settings texts: bold, italic, underline, one heading level, bullet and numbered
 * lists and links. It produces plain HTML; the API strips anything else before storing it.
 */
export const RichTextEditor = ({ id, value, onChange, 'aria-label': ariaLabel, 'data-test-id': testId }: RichTextEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2] },
                blockquote: false,
                code: false,
                codeBlock: false,
                horizontalRule: false,
                strike: false,
                link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } },
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                id,
                role: 'textbox',
                'aria-multiline': 'true',
                'aria-label': ariaLabel,
                class: 'rich-content min-h-40 px-3 py-2 outline-none',
            },
        },
        onUpdate: ({ editor: current }) => onChange(current.isEmpty ? '' : current.getHTML()),
    });

    // A reload of the settings replaces the text from outside; typing in the editor already matches `value`.
    useEffect(() => {
        if (editor && value !== (editor.isEmpty ? '' : editor.getHTML())) editor.commands.setContent(value, { emitUpdate: false });
    }, [editor, value]);

    if (!editor) return null;

    const setLink = () => {
        const previous = (editor.getAttributes('link').href as string | undefined) ?? '';
        const url = window.prompt('Alamat link (https://…). Kosongkan untuk menghapus link.', previous);

        if (url === null) return;
        if (url.trim() === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    };

    return (
        <div className="bg-card border-input focus-within:ring-ring rounded-md border focus-within:ring-2" data-test-id={testId}>
            <div className="border-border flex flex-wrap gap-1 border-b p-1" role="toolbar" aria-label="Format teks">
                <ToolButton
                    label="Tebal"
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    data-test-id={`${testId}_bold`}
                >
                    <Bold className="size-4" />
                </ToolButton>
                <ToolButton
                    label="Miring"
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    data-test-id={`${testId}_italic`}
                >
                    <Italic className="size-4" />
                </ToolButton>
                <ToolButton
                    label="Garis bawah"
                    active={editor.isActive('underline')}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    data-test-id={`${testId}_underline`}
                >
                    <Underline className="size-4" />
                </ToolButton>
                <ToolButton
                    label="Judul"
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    data-test-id={`${testId}_heading`}
                >
                    <Heading2 className="size-4" />
                </ToolButton>
                <ToolButton
                    label="Daftar poin"
                    active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    data-test-id={`${testId}_bullets`}
                >
                    <List className="size-4" />
                </ToolButton>
                <ToolButton
                    label="Daftar angka"
                    active={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    data-test-id={`${testId}_numbers`}
                >
                    <ListOrdered className="size-4" />
                </ToolButton>
                <ToolButton label="Link" active={editor.isActive('link')} onClick={setLink} data-test-id={`${testId}_link`}>
                    <Link2 className="size-4" />
                </ToolButton>
                <ToolButton
                    label="Urungkan"
                    disabled={!editor.can().undo()}
                    onClick={() => editor.chain().focus().undo().run()}
                    data-test-id={`${testId}_undo`}
                >
                    <Undo2 className="size-4" />
                </ToolButton>
                <ToolButton
                    label="Ulangi"
                    disabled={!editor.can().redo()}
                    onClick={() => editor.chain().focus().redo().run()}
                    data-test-id={`${testId}_redo`}
                >
                    <Redo2 className="size-4" />
                </ToolButton>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
};
