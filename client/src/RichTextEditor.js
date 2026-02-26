// frontend/src/RichTextEditor.js
// FIXED: Real-time sync working properly

import React, { useCallback, useMemo, useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { createEditor, Transforms, Editor, Element as SlateElement } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { 
  Bold, Italic, Underline, Code, Highlighter, Type,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Heading1, Heading2, Quote,
  Link, Undo, Redo, Download, Share2, Save
} from 'lucide-react';
import './RichTextEditor.css';

const LIST_TYPES = ['numbered-list', 'bulleted-list'];
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];

const CustomEditor = {
  isBoldMarkActive(editor) {
    const marks = Editor.marks(editor);
    return marks ? marks.bold === true : false;
  },

  isItalicMarkActive(editor) {
    const marks = Editor.marks(editor);
    return marks ? marks.italic === true : false;
  },

  isUnderlineMarkActive(editor) {
    const marks = Editor.marks(editor);
    return marks ? marks.underline === true : false;
  },

  isCodeMarkActive(editor) {
    const marks = Editor.marks(editor);
    return marks ? marks.code === true : false;
  },

  toggleBoldMark(editor) {
    const isActive = CustomEditor.isBoldMarkActive(editor);
    if (isActive) {
      Editor.removeMark(editor, 'bold');
    } else {
      Editor.addMark(editor, 'bold', true);
    }
  },

  toggleItalicMark(editor) {
    const isActive = CustomEditor.isItalicMarkActive(editor);
    if (isActive) {
      Editor.removeMark(editor, 'italic');
    } else {
      Editor.addMark(editor, 'italic', true);
    }
  },

  toggleUnderlineMark(editor) {
    const isActive = CustomEditor.isUnderlineMarkActive(editor);
    if (isActive) {
      Editor.removeMark(editor, 'underline');
    } else {
      Editor.addMark(editor, 'underline', true);
    }
  },

  toggleCodeMark(editor) {
    const isActive = CustomEditor.isCodeMarkActive(editor);
    if (isActive) {
      Editor.removeMark(editor, 'code');
    } else {
      Editor.addMark(editor, 'code', true);
    }
  },

  isBlockActive(editor, format, blockType = 'type') {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: n =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          n[blockType] === format,
      })
    );

    return !!match;
  },

  toggleBlock(editor, format) {
    const isActive = CustomEditor.isBlockActive(
      editor,
      format,
      TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
    );
    const isList = LIST_TYPES.includes(format);

    Transforms.unwrapNodes(editor, {
      match: n =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        LIST_TYPES.includes(n.type) &&
        !TEXT_ALIGN_TYPES.includes(format),
      split: true,
    });

    let newProperties;
    if (TEXT_ALIGN_TYPES.includes(format)) {
      newProperties = {
        align: isActive ? undefined : format,
      };
    } else {
      newProperties = {
        type: isActive ? 'paragraph' : isList ? 'list-item' : format,
      };
    }

    Transforms.setNodes(editor, newProperties);

    if (!isActive && isList) {
      const block = { type: format, children: [] };
      Transforms.wrapNodes(editor, block);
    }
  },

  insertImage(editor, url) {
    const text = { text: '' };
    const image = { type: 'image', url, children: [text] };
    Transforms.insertNodes(editor, image);
    Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] });
  },
};

const RichTextEditor = forwardRef(({ value, onChange, placeholder, onSave, onShare, onExport }, ref) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  
  useImperativeHandle(ref, () => ({
    insertImage: (imageUrl) => {
      CustomEditor.insertImage(editor, imageUrl);
    }
  }));

  const parseValue = useCallback((val) => {
    if (!val || val === '') {
      return [{ type: 'paragraph', children: [{ text: '' }] }];
    }
    
    if (typeof val === 'object' && Array.isArray(val)) {
      return val;
    }
    
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        // Not JSON
      }
      
      const lines = val.split('\n');
      return lines.map(line => ({
        type: 'paragraph',
        children: [{ text: line }]
      }));
    }
    
    return [{ type: 'paragraph', children: [{ text: '' }] }];
  }, []);

  const [editorValue, setEditorValue] = useState(() => parseValue(value));
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isLocalChange, setIsLocalChange] = useState(false);

  // CRITICAL: Update editor when external value changes
  useEffect(() => {
    if (!isLocalChange && value !== undefined) {
      const newValue = parseValue(value);
      const currentValue = JSON.stringify(editorValue);
      const incomingValue = JSON.stringify(newValue);
      
      // Only update if the content actually changed
      if (currentValue !== incomingValue) {
        console.log('🔄 Updating editor with external changes');
        setEditorValue(newValue);
        
        // Update the editor's children directly
        try {
          editor.children = newValue;
          Editor.normalize(editor, { force: true });
        } catch (e) {
          console.error('Error updating editor:', e);
        }
      }
    }
  }, [value, isLocalChange, parseValue]);

  const renderLeaf = useCallback(props => <Leaf {...props} />, []);
  const renderElement = useCallback(props => <Element {...props} />, []);

  const handleKeyDown = useCallback((event) => {
    if (!event.ctrlKey && !event.metaKey) return;

    switch (event.key) {
      case 'b': {
        event.preventDefault();
        CustomEditor.toggleBoldMark(editor);
        break;
      }
      case 'i': {
        event.preventDefault();
        CustomEditor.toggleItalicMark(editor);
        break;
      }
      case 'u': {
        event.preventDefault();
        CustomEditor.toggleUnderlineMark(editor);
        break;
      }
      case '`': {
        event.preventDefault();
        CustomEditor.toggleCodeMark(editor);
        break;
      }
      case 's': {
        event.preventDefault();
        if (onSave) onSave();
        break;
      }
      case 'z': {
        event.preventDefault();
        editor.undo();
        break;
      }
      case 'y': {
        event.preventDefault();
        editor.redo();
        break;
      }
    }
  }, [editor, onSave]);

  const handleChange = useCallback((newValue) => {
    setEditorValue(newValue);
    setIsLocalChange(true);
    
    const content = JSON.stringify(newValue);
    onChange(content);
    
    // Reset flag after a short delay
    setTimeout(() => setIsLocalChange(false), 100);
  }, [onChange]);

  const insertLink = useCallback(() => {
    if (linkUrl) {
      const { selection } = editor;
      const isCollapsed = selection && selection.anchor.offset === selection.focus.offset;

      if (isCollapsed) {
        Transforms.insertNodes(editor, {
          type: 'link',
          url: linkUrl,
          children: [{ text: linkUrl }],
        });
      } else {
        Transforms.wrapNodes(
          editor,
          { type: 'link', url: linkUrl, children: [] },
          { split: true }
        );
      }
      
      setShowLinkInput(false);
      setLinkUrl('');
    }
  }, [editor, linkUrl]);

  return (
    <div className="slate-editor-container">
      <Slate 
        editor={editor} 
        initialValue={editorValue}
        value={editorValue}
        onChange={handleChange}
      >
        <div className="slate-toolbar">
          <div className="toolbar-group">
            <button className="toolbar-btn" onClick={onSave} title="Save (Ctrl+S)">
              <Save size={18} />
            </button>
            <button className="toolbar-btn" onClick={onExport} title="Download">
              <Download size={18} />
            </button>
            <button className="toolbar-btn" onClick={onShare} title="Share">
              <Share2 size={18} />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button className="toolbar-btn" onClick={() => editor.undo()} title="Undo (Ctrl+Z)">
              <Undo size={18} />
            </button>
            <button className="toolbar-btn" onClick={() => editor.redo()} title="Redo (Ctrl+Y)">
              <Redo size={18} />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <BlockButton format="heading-one" icon={<Heading1 size={18} />} editor={editor} />
            <BlockButton format="heading-two" icon={<Heading2 size={18} />} editor={editor} />
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <MarkButton format="bold" icon={<Bold size={18} />} editor={editor} />
            <MarkButton format="italic" icon={<Italic size={18} />} editor={editor} />
            <MarkButton format="underline" icon={<Underline size={18} />} editor={editor} />
            <MarkButton format="code" icon={<Code size={18} />} editor={editor} />
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <BlockButton format="left" icon={<AlignLeft size={18} />} editor={editor} />
            <BlockButton format="center" icon={<AlignCenter size={18} />} editor={editor} />
            <BlockButton format="right" icon={<AlignRight size={18} />} editor={editor} />
            <BlockButton format="justify" icon={<AlignJustify size={18} />} editor={editor} />
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <BlockButton format="bulleted-list" icon={<List size={18} />} editor={editor} />
            <BlockButton format="numbered-list" icon={<ListOrdered size={18} />} editor={editor} />
            <BlockButton format="block-quote" icon={<Quote size={18} />} editor={editor} />
          </div>

          <div className="toolbar-divider" />

          <ColorPicker editor={editor} icon={<Type size={18} />} />
          <HighlightPicker editor={editor} icon={<Highlighter size={18} />} />

          <div className="toolbar-divider" />

          <button className="toolbar-btn" onClick={() => setShowLinkInput(!showLinkInput)} title="Insert Link">
            <Link size={18} />
          </button>
        </div>

        {showLinkInput && (
          <div className="link-input-bar">
            <input
              type="url"
              placeholder="Enter URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && insertLink()}
              className="link-input"
              autoFocus
            />
            <button className="btn btn-primary btn-sm" onClick={insertLink}>Insert</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowLinkInput(false)}>Cancel</button>
          </div>
        )}

        <Editable
          renderLeaf={renderLeaf}
          renderElement={renderElement}
          placeholder={placeholder || "Start typing..."}
          onKeyDown={handleKeyDown}
          className="slate-editor"
          spellCheck
        />
      </Slate>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

// All the component helpers below (MarkButton, BlockButton, etc.) remain the same...

const MarkButton = ({ format, icon, editor }) => {
  const isActive = format === 'bold' ? CustomEditor.isBoldMarkActive(editor)
    : format === 'italic' ? CustomEditor.isItalicMarkActive(editor)
    : format === 'underline' ? CustomEditor.isUnderlineMarkActive(editor)
    : CustomEditor.isCodeMarkActive(editor);

  return (
    <button
      className={`toolbar-btn ${isActive ? 'active' : ''}`}
      onMouseDown={(e) => {
        e.preventDefault();
        if (format === 'bold') CustomEditor.toggleBoldMark(editor);
        else if (format === 'italic') CustomEditor.toggleItalicMark(editor);
        else if (format === 'underline') CustomEditor.toggleUnderlineMark(editor);
        else CustomEditor.toggleCodeMark(editor);
      }}
    >
      {icon}
    </button>
  );
};

const BlockButton = ({ format, icon, editor }) => {
  const isActive = CustomEditor.isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
  );

  return (
    <button
      className={`toolbar-btn ${isActive ? 'active' : ''}`}
      onMouseDown={(e) => {
        e.preventDefault();
        CustomEditor.toggleBlock(editor, format);
      }}
    >
      {icon}
    </button>
  );
};

const ColorPicker = ({ editor, icon }) => {
  const [showPicker, setShowPicker] = useState(false);
  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Red', value: '#e74c3c' },
    { name: 'Blue', value: '#3498db' },
    { name: 'Green', value: '#2ecc71' },
    { name: 'Orange', value: '#f39c12' },
    { name: 'Purple', value: '#9b59b6' },
  ];
  
  return (
    <div className="picker-wrapper">
      <button className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); setShowPicker(!showPicker); }}>
        {icon}
      </button>
      {showPicker && (
        <div className="color-picker-dropdown">
          <div className="picker-title">Text Color</div>
          <div className="color-grid">
            {colors.map(color => (
              <button
                key={color.value}
                className="color-option"
                style={{ backgroundColor: color.value }}
                title={color.name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  Editor.addMark(editor, 'color', color.value);
                  setShowPicker(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const HighlightPicker = ({ editor, icon }) => {
  const [showPicker, setShowPicker] = useState(false);
  const highlights = [
    { name: 'None', value: 'transparent' },
    { name: 'Yellow', value: '#fff59d' },
    { name: 'Green', value: '#a7ffeb' },
    { name: 'Pink', value: '#f8bbd0' },
    { name: 'Purple', value: '#d1c4e9' },
  ];
  
  return (
    <div className="picker-wrapper">
      <button className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); setShowPicker(!showPicker); }}>
        {icon}
      </button>
      {showPicker && (
        <div className="color-picker-dropdown">
          <div className="picker-title">Highlight</div>
          <div className="color-grid">
            {highlights.map(color => (
              <button
                key={color.value}
                className="color-option"
                style={{ backgroundColor: color.value, border: color.value === 'transparent' ? '2px solid #ccc' : 'none' }}
                title={color.name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (color.value === 'transparent') {
                    Editor.removeMark(editor, 'highlight');
                  } else {
                    Editor.addMark(editor, 'highlight', color.value);
                  }
                  setShowPicker(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) children = <strong>{children}</strong>;
  if (leaf.italic) children = <em>{children}</em>;
  if (leaf.underline) children = <u>{children}</u>;
  if (leaf.code) children = <code className="inline-code">{children}</code>;

  const style = {};
  if (leaf.color) style.color = leaf.color;
  if (leaf.highlight) {
    style.backgroundColor = leaf.highlight;
    style.padding = '2px 4px';
    style.borderRadius = '3px';
  }

  return (
    <span {...attributes} style={style}>
      {children}
    </span>
  );
};

const Element = ({ attributes, children, element }) => {
  const style = { textAlign: element.align };
  
  switch (element.type) {
    case 'heading-one':
      return <h1 style={style} {...attributes}>{children}</h1>;
    case 'heading-two':
      return <h2 style={style} {...attributes}>{children}</h2>;
    case 'block-quote':
      return <blockquote style={style} {...attributes}>{children}</blockquote>;
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>;
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>;
    case 'list-item':
      return <li style={style} {...attributes}>{children}</li>;
    case 'link':
      return (
        <a href={element.url} {...attributes} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    case 'image':
      return (
        <div {...attributes}>
          <div contentEditable={false} style={{ position: 'relative', margin: '16px 0' }}>
            <img 
              src={element.url} 
              alt="Inserted" 
              style={{ 
                maxWidth: '100%', 
                height: 'auto', 
                borderRadius: '8px',
                display: 'block',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
          </div>
          {children}
        </div>
      );
    default:
      return <p style={style} {...attributes}>{children}</p>;
  }
};

export default RichTextEditor;