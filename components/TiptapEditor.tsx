"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Undo, Redo, Strikethrough, Underline } from "lucide-react";

const TiptapToolbar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border border-gray-200 rounded-t-lg">
      {/* Heading 1 */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? "bg-gray-200 p-2 rounded" : "p-2 hover:bg-gray-100 rounded"}
      >
        <Heading1 className="w-5 h-5" />
      </button>

      {/* Heading 2 */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? "bg-gray-200 p-2 rounded" : "p-2 hover:bg-gray-100 rounded"}
      >
        <Heading2 className="w-5 h-5" />
      </button>

      {/* Heading 3 */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive('heading', { level: 3 }) ? "bg-gray-200 p-2 rounded" : "p-2 hover:bg-gray-100 rounded"}
      >
        <Heading3 className="w-5 h-5" />
      </button>

      {/* Bold */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? "bg-gray-200 p-2 rounded" : "p-2 hover:bg-gray-100 rounded"}
      >
        <Bold className="w-5 h-5" />
      </button>

      {/* Italic */}
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? "bg-gray-200 p-2 rounded" : "p-2 hover:bg-gray-100 rounded"}
      >
        <Italic className="w-5 h-5" />
      </button>

      {/* Underline */}
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive('underline') ? "bg-gray-200 p-2 rounded" : "p-2 hover:bg-gray-100 rounded"}
      >
        <Underline className="w-5 h-5" />
      </button>

      {/* Strikethrough */}
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? "bg-gray-200 p-2 rounded" : "p-2 hover:bg-gray-100 rounded"}
      >
        <Strikethrough className="w-5 h-5" />
      </button>

      {/* Bullet List */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? "bg-gray-200 p-2 rounded" : "p-2 hover:bg-gray-100 rounded"}
      >
        <List className="w-5 h-5" />
      </button>

      {/* Ordered List */}
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? "bg-gray-200 p-2 rounded" : "p-2 hover:bg-gray-100 rounded"}
      >
        <ListOrdered className="w-5 h-5" />
      </button>

      {/* Blockquote */}
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? "bg-gray-200 p-2 rounded" : "p-2 hover:bg-gray-100 rounded"}
      >
        <Quote className="w-5 h-5" />
      </button>

      {/* Undo */}
      <button
        onClick={() => editor.chain().focus().undo().run()}
        className="p-2 hover:bg-gray-100 rounded"
      >
        <Undo className="w-5 h-5" />
      </button>

      {/* Redo */}
      <button
        onClick={() => editor.chain().focus().redo().run()}
        className="p-2 hover:bg-gray-100 rounded"
      >
        <Redo className="w-5 h-5" />
      </button>
    </div>
  );
};

export default function Tiptap({
  content,
  onUpdate,
}: {
  content: string;
  onUpdate: (content: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[500px] bg-white p-4 rounded-b-lg shadow-sm border border-gray-200 border-t-0",
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  return (
    <div>
      <TiptapToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}