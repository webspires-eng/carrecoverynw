"use client";

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="editor-placeholder">Loading Editor...</div>,
});

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link', 'clean'],
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list',
  'link', 'color', 'background'
];

export default function RichTextEditor({ value, onChange, placeholder }) {
  return (
    <div className="rich-text-editor-wrapper">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style jsx global>{`
        .rich-text-editor-wrapper {
          background: white;
          border-radius: 8px;
          margin-bottom: 10px;
        }
        .ql-container {
          min-height: 250px;
          font-size: 16px;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        .ql-toolbar {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          background: #f8fafc;
        }
        .ql-editor {
          min-height: 250px;
        }
        .editor-placeholder {
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #64748b;
        }
      `}</style>
    </div>
  );
}
