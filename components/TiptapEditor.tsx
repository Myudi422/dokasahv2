"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Strikethrough,
  Underline,
  Image as ImageIcon,
  Brain, // Icon untuk AI, pastikan lucide-react versi terbaru atau gunakan icon lain misalnya Cpu
} from "lucide-react";

const TiptapToolbar = ({ editor, openAiModal }: { editor: any; openAiModal: () => void; }) => {
  if (!editor) return null;

  // Fungsi untuk memasukkan gambar melalui prompt URL
  const addImage = () => {
    const url = window.prompt("Masukkan URL gambar");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border border-gray-200 rounded-t-lg">
      {/* Heading 1 */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={
          editor.isActive("heading", { level: 1 })
            ? "bg-gray-200 p-2 rounded"
            : "p-2 hover:bg-gray-100 rounded"
        }
      >
        <Heading1 className="w-5 h-5" />
      </button>

      {/* Heading 2 */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={
          editor.isActive("heading", { level: 2 })
            ? "bg-gray-200 p-2 rounded"
            : "p-2 hover:bg-gray-100 rounded"
        }
      >
        <Heading2 className="w-5 h-5" />
      </button>

      {/* Heading 3 */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={
          editor.isActive("heading", { level: 3 })
            ? "bg-gray-200 p-2 rounded"
            : "p-2 hover:bg-gray-100 rounded"
        }
      >
        <Heading3 className="w-5 h-5" />
      </button>

      {/* Bold */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={
          editor.isActive("bold")
            ? "bg-gray-200 p-2 rounded"
            : "p-2 hover:bg-gray-100 rounded"
        }
      >
        <Bold className="w-5 h-5" />
      </button>

      {/* Italic */}
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={
          editor.isActive("italic")
            ? "bg-gray-200 p-2 rounded"
            : "p-2 hover:bg-gray-100 rounded"
        }
      >
        <Italic className="w-5 h-5" />
      </button>

      {/* Underline */}
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={
          editor.isActive("underline")
            ? "bg-gray-200 p-2 rounded"
            : "p-2 hover:bg-gray-100 rounded"
        }
      >
        <Underline className="w-5 h-5" />
      </button>

      {/* Strikethrough */}
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={
          editor.isActive("strike")
            ? "bg-gray-200 p-2 rounded"
            : "p-2 hover:bg-gray-100 rounded"
        }
      >
        <Strikethrough className="w-5 h-5" />
      </button>

      {/* Bullet List */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={
          editor.isActive("bulletList")
            ? "bg-gray-200 p-2 rounded"
            : "p-2 hover:bg-gray-100 rounded"
        }
      >
        <List className="w-5 h-5" />
      </button>

      {/* Ordered List */}
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={
          editor.isActive("orderedList")
            ? "bg-gray-200 p-2 rounded"
            : "p-2 hover:bg-gray-100 rounded"
        }
      >
        <ListOrdered className="w-5 h-5" />
      </button>

      {/* Blockquote */}
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={
          editor.isActive("blockquote")
            ? "bg-gray-200 p-2 rounded"
            : "p-2 hover:bg-gray-100 rounded"
        }
      >
        <Quote className="w-5 h-5" />
      </button>

      {/* Insert Image */}
      <button
        onClick={addImage}
        className="p-2 hover:bg-gray-100 rounded"
        title="Insert Image"
      >
        <ImageIcon className="w-5 h-5" />
      </button>

      {/* AI Generate */}
      <button
        onClick={openAiModal}
        className="p-2 hover:bg-gray-100 rounded"
        title="Generate Konten AI"
      >
        <Brain className="w-5 h-5" />
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
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: content,
    editorProps: {
      attributes: {
        class:
          "prose max-w-none focus:outline-none min-h-[500px] bg-white p-4 rounded-b-lg shadow-sm border border-gray-200 border-t-0",
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

// Fungsi untuk mengirim prompt ke backend AI
const generateContent = async () => {
  if (!aiPrompt) return;
  setIsGenerating(true);
  try {
    const res = await fetch("https://dev.dokasah.web.id/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: aiPrompt }),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Gagal generate konten AI");
    }
    
    const data = await res.json();
    
    // Bersihkan HTML
    const cleanedHtml = data.html
      .replace(/```html/g, '') // Hapus markdown code block
      .replace(/```/g, '') 
      .replace(/\n/g, '') // Hapus newline
      .replace(/\\n/g, '')
      .replace(/>\s+</g, '><') // Hapus spasi antara tag
      .replace(/\s+/g, ' ') // Hapus multiple spaces
      .trim();

    // Validasi dasar
    if (!cleanedHtml.includes('<h1>') || !cleanedHtml.includes('</h1>')) {
      throw new Error("Format konten tidak valid");
    }

    // Masukkan ke editor
    editor.chain().focus().insertContent(cleanedHtml).run();
    
    setShowAiModal(false);
    setAiPrompt("");
  } catch (error: any) {
    alert(error.message || "Terjadi kesalahan saat generate konten AI");
  } finally {
    setIsGenerating(false);
  }
};

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  return (
    <div>
      <TiptapToolbar editor={editor} openAiModal={() => setShowAiModal(true)} />
      <EditorContent editor={editor} />

      {/* Modal AI */}
      {showAiModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Generate Konten AI</h2>
            <textarea
              className="w-full p-2 border border-gray-300 rounded mb-4"
              rows={4}
              placeholder="Masukkan prompt untuk generate konten..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAiModal(false);
                  setAiPrompt("");
                }}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                disabled={isGenerating}
              >
                Batal
              </button>
              <button
                onClick={generateContent}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
