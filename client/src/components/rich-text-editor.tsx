import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link2,
  LinkOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ChevronDown,
  Image as ImageIcon,
  Highlighter,
  Palette,
  Undo,
  Redo,
  Minus,
  CheckSquare,
  FileText,
  Sparkles,
  Info,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Video,
  Download
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing your lesson content...",
  className,
  readOnly = false
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-md my-4',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'px-1 py-0.5 rounded',
        },
      }),
      Color,
      TextStyle,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const insertTemplate = (type: string) => {
    let content = '';
    
    switch (type) {
      case 'key-concept':
        content = `
<div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded">
  <h3 class="font-bold text-blue-900 flex items-center gap-2 mb-2">
    💡 Key Concept
  </h3>
  <p>Explain the important concept here...</p>
</div>`;
        break;
      case 'example':
        content = `
<div class="bg-green-50 border-l-4 border-green-500 p-4 my-4 rounded">
  <h3 class="font-bold text-green-900 flex items-center gap-2 mb-2">
    📘 Example
  </h3>
  <p>Provide a real-world example here...</p>
</div>`;
        break;
      case 'warning':
        content = `
<div class="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded">
  <h3 class="font-bold text-red-900 flex items-center gap-2 mb-2">
    ⚠️ Important Warning
  </h3>
  <p>Highlight important warnings or common mistakes...</p>
</div>`;
        break;
      case 'tip':
        content = `
<div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded">
  <h3 class="font-bold text-yellow-900 flex items-center gap-2 mb-2">
    💡 Pro Tip
  </h3>
  <p>Share helpful tips and best practices...</p>
</div>`;
        break;
      case 'exercise':
        content = `
<div class="bg-purple-50 border-l-4 border-purple-500 p-4 my-4 rounded">
  <h3 class="font-bold text-purple-900 flex items-center gap-2 mb-2">
    ✏️ Exercise
  </h3>
  <p><strong>Task:</strong> Describe the exercise here...</p>
  <ol class="list-decimal list-inside mt-2 space-y-1">
    <li>Step 1</li>
    <li>Step 2</li>
    <li>Step 3</li>
  </ol>
</div>`;
        break;
      case 'summary':
        content = `
<div class="bg-gray-50 border-l-4 border-gray-500 p-4 my-4 rounded">
  <h3 class="font-bold text-gray-900 flex items-center gap-2 mb-2">
    📋 Summary
  </h3>
  <ul class="list-disc list-inside space-y-1">
    <li>Key point 1</li>
    <li>Key point 2</li>
    <li>Key point 3</li>
  </ul>
</div>`;
        break;
    }
    
    editor.chain().focus().insertContent(content).run();
  };

  if (readOnly) {
    return (
      <div className={cn("prose prose-lg max-w-none", className)}>
        <EditorContent editor={editor} />
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1 items-center">
        {/* Text Format */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <FileText className="w-4 h-4 mr-1" />
                Format
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
                Normal Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                <Heading1 className="w-4 h-4 mr-2" />
                Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 className="w-4 h-4 mr-2" />
                Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <Heading3 className="w-4 h-4 mr-2" />
                Heading 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Basic Formatting */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('bold') && "bg-gray-200")}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('italic') && "bg-gray-200")}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('underline') && "bg-gray-200")}
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('strike') && "bg-gray-200")}
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef3c7' }).run()}
            className={cn("h-8 w-8 p-0", editor.isActive('highlight') && "bg-gray-200")}
          >
            <Highlighter className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Alignment */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'left' }) && "bg-gray-200")}
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'center' }) && "bg-gray-200")}
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'right' }) && "bg-gray-200")}
          >
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('bulletList') && "bg-gray-200")}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('orderedList') && "bg-gray-200")}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('blockquote') && "bg-gray-200")}
          >
            <Quote className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('codeBlock') && "bg-gray-200")}
          >
            <Code className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Insert */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={addLink}
            className="h-8 w-8 p-0"
          >
            <Link2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={addImage}
            className="h-8 w-8 p-0"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="h-8 w-8 p-0"
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Templates */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Sparkles className="w-4 h-4 mr-1" />
              Templates
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => insertTemplate('key-concept')}>
              <Lightbulb className="w-4 h-4 mr-2 text-blue-600" />
              Key Concept Box
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertTemplate('example')}>
              <BookOpen className="w-4 h-4 mr-2 text-green-600" />
              Example Box
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertTemplate('warning')}>
              <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
              Warning Box
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertTemplate('tip')}>
              <Info className="w-4 h-4 mr-2 text-yellow-600" />
              Pro Tip Box
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertTemplate('exercise')}>
              <CheckSquare className="w-4 h-4 mr-2 text-purple-600" />
              Exercise Box
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertTemplate('summary')}>
              <FileText className="w-4 h-4 mr-2 text-gray-600" />
              Summary Box
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="p-4 min-h-[400px]">
        <EditorContent 
          editor={editor} 
          className="prose prose-lg max-w-none focus:outline-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-ul:list-disc prose-ul:pl-6
            prose-ol:list-decimal prose-ol:pl-6
            prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic
            prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm
            prose-pre:bg-gray-900 prose-pre:text-gray-100
            prose-img:rounded-lg prose-img:shadow-md
            [&_.ProseMirror-placeholder]:text-gray-400
            [&_.ProseMirror-placeholder]:before:content-[attr(data-placeholder)]
            [&_.ProseMirror-placeholder]:before:absolute
            [&_.ProseMirror-placeholder]:before:pointer-events-none"
        />
      </div>
    </div>
  );
}