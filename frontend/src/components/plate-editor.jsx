'use client';

import { normalizeStaticValue } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';
import { BasicNodesKit } from "./basic-nodes-kit";
import { Editor, EditorContainer } from "./ui/editor";

export function PlateEditor({ initialValue, onChange, readOnly = false }) { 
  // Failsafe 1: Ensure it ALWAYS has a valid text block, even if the database is slow
  const safeValue = initialValue && initialValue.length > 0 
    ? initialValue 
    : [{ type: "p", children: [{ text: "" }] }];

  const editor = usePlateEditor({
    plugins: BasicNodesKit,
    value: safeValue, 
  });

  return (
    <Plate 
      editor={editor} 
      // THE FIX: Notice the curly braces around { value }!
      // This plucks ONLY the clean JSON array out of the massive event object.
      onChange={({ value }) => {
        if (onChange) {
          onChange(value);
        }
      }}
    >
      <EditorContainer>
        <Editor 
          variant="demo" 
          placeholder={readOnly ? "" : "Type..."} 
          readOnly={readOnly} 
        />
      </EditorContainer>
    </Plate>
  );
}

const value = normalizeStaticValue([
  {
    children: [{ text: 'Basic Editor' }],
    type: 'h1',
  },
  {
    children: [{ text: 'Heading 2' }],
    type: 'h2',
  },
  {
    children: [{ text: 'Heading 3' }],
    type: 'h3',
  },
  {
    children: [
      {
        children: [{ text: 'This blockquote contains more than one block.' }],
        type: 'p',
      },
      {
        children: [
          {
            text: 'It can also wrap nested quotes instead of flattening them.',
          },
        ],
        type: 'p',
      },
      {
        children: [
          {
            children: [
              {
                text: 'Nested blockquotes keep the quote hierarchy intact.',
              },
            ],
            type: 'p',
          },
        ],
        type: 'blockquote',
      },
    ],
    type: 'blockquote',
  },
  {
    children: [
      { text: 'Basic marks: ' },
      { bold: true, text: 'bold' },
      { text: ', ' },
      { italic: true, text: 'italic' },
      { text: ', ' },
      { text: 'underline', underline: true },
      { text: ', ' },
      { strikethrough: true, text: 'strikethrough' },
      { text: '.' },
    ],
    type: 'p',
  },
]);
