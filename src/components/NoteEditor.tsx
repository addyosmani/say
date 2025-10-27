import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { IoCopyOutline } from 'react-icons/io5';
import { AiOutlineRobot } from 'react-icons/ai';
import Transcript from './Transcript';
import TextSummary from './TextSummary';
import { Transcriber } from "../hooks/useTranscriber";
import { useSummarizer } from '../hooks/useSummarizer';

interface NoteVersion {
  content: string;
  timestamp: number;
  description: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  versions: NoteVersion[];
  created: number;
  lastEdited: number;
}

interface NoteEditorProps {
  note: Note;
  onUpdateNote: (updatedNote: Note) => void;
  onSaveVersion: (noteId: string, description: string) => void;
  onRestoreVersion: (noteId: string, version: NoteVersion) => void;
  onUpdateTags: (noteId: string, tags: string[]) => void;
  transcriber: Transcriber;
  hasMicrophonePermission: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ 
  note, 
  onUpdateNote, 
  onSaveVersion,
  onRestoreVersion,
  onUpdateTags,
  transcriber, 
  hasMicrophonePermission 
}) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tagInput, setTagInput] = useState('');
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionDescription, setVersionDescription] = useState('');
  const lastTranscriptRef = useRef('');
  const editorRef = useRef<any>(null);
  const {
    isLoading,
    progress,
    summary,
    model,
    summarize,
    clearSummary,
    changeModel,
  } = useSummarizer();

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  const cleanText = (text: string) => {
    return text
      .replace(/\s+/g, ' ')
      .replace(/([.,!?])([^\s])/g, '$1 $2')
      .replace(/\s+([.,!?])/g, '$1')
      .trim();
  };

  const handleTranscriptionUpdate = useCallback((newTranscript: string) => {
    if (newTranscript !== lastTranscriptRef.current) {
      console.log('New transcript received:', newTranscript);
      const newContent = newTranscript.slice(lastTranscriptRef.current.length);
      const cleanedContent = cleanText(newContent);
      
      if (editorRef.current) {
        const editor = editorRef.current;
        editor.execCommand('mceInsertContent', false, ' ' + cleanedContent);
        const updatedContent = editor.getContent();
        setContent(updatedContent);
        onUpdateNote({ ...note, content: updatedContent });
      }
      
      lastTranscriptRef.current = newTranscript;
    }
  }, [note, onUpdateNote]);

  useEffect(() => {
    if (transcriber.output && transcriber.output.text) {
      handleTranscriptionUpdate(transcriber.output.text);
    }
  }, [transcriber.output, handleTranscriptionUpdate]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (note) {
      onUpdateNote({ ...note, title: newTitle });
    }
  };

  const handleEditorChange = (newContent: string) => {
    setContent(newContent);
    if (note) {
      onUpdateNote({ ...note, content: newContent });
    }
  };

  const handleSummarize = async () => {
    if (editorRef.current) {
      const textContent = editorRef.current.getContent({ format: 'text' });
      if (textContent.trim()) {
        await summarize(textContent);
      }
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() && note) {
      const newTag = tagInput.trim();
      if (!note.tags.includes(newTag)) {
        const newTags = [...note.tags, newTag];
        onUpdateTags(note.id, newTags);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (note) {
      const newTags = note.tags.filter(tag => tag !== tagToRemove);
      onUpdateTags(note.id, newTags);
    }
  };

  const handleSaveVersion = () => {
    if (note && versionDescription.trim()) {
      onSaveVersion(note.id, versionDescription.trim());
      setVersionDescription('');
      setShowVersionModal(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.getContent();
      const textContent = editorRef.current.getContent({format: 'text'});
      
      try {
        const clipboardData = new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([textContent], { type: 'text/plain' })
        });
        navigator.clipboard.write([clipboardData]).then(() => {
          const button = document.getElementById('copyButton');
          if (button) {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
              button.textContent = originalText;
            }, 2000);
          }
        });
      } catch (err) {
        navigator.clipboard.writeText(textContent).then(() => {
          const button = document.getElementById('copyButton');
          if (button) {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
              button.textContent = originalText;
            }, 2000);
          }
        });
      }
    }
  };

  const getWordCount = (text: string) => {
    const strippedText = text.replace(/<[^>]*>/g, ' ');
    return strippedText.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = (text: string) => {
    const strippedText = text.replace(/<[^>]*>/g, '');
    return strippedText.length;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!note) {
    return null;
  }

  return (
    <div className="note-editor">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="text-2xl font-bold w-2/3 p-2 border rounded"
          placeholder="Note Title"
        />
        <div className="text-sm text-gray-500 space-y-1">
          <div>Words: {getWordCount(content)}</div>
          <div>Characters: {getCharacterCount(content)}</div>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-4 space-y-1">
        <div>Created: {formatDate(note.created)}</div>
        <div>Last edited: {formatDate(note.lastEdited)}</div>
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-2">
          {note.tags.map(tag => (
            <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center">
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyPress={handleAddTag}
          placeholder="Add tags (press Enter)"
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <Editor
        apiKey='hs3cwcc85xer8s856zt0id82ropre2dgte3zc2p9gn82978o'
        onInit={(evt, editor) => editorRef.current = editor}
        value={content}
        onEditorChange={handleEditorChange}
        init={{
          height: 400,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px }',
          skin: 'oxide',
          statusbar: false
        }}
      />

      <TextSummary
        summary={summary}
        isLoading={isLoading}
        progress={progress}
        onClose={clearSummary}
        model={model}
        onModelChange={changeModel}
      />

      <div className="flex gap-2 mt-4 mb-4">
        <button
          onClick={handleSummarize}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <AiOutlineRobot className="w-5 h-5" />
          AI Summary
        </button>
        <button
          id="copyButton"
          onClick={handleCopyToClipboard}
          className="flex items-center gap-2 px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors"
        >
          <IoCopyOutline className="w-5 h-5" />
          Copy Note
        </button>
        <button
          onClick={() => setShowVersionModal(true)}
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          Save Version
        </button>
      </div>

      {showVersionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Save Version</h3>
            <input
              type="text"
              value={versionDescription}
              onChange={(e) => setVersionDescription(e.target.value)}
              placeholder="Version description"
              className="w-full px-3 py-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowVersionModal(false)}
                className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVersion}
                className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto">
        <Transcript transcript={transcriber.output?.text || ''} />
      </div>

      {note.versions.length > 0 && (
        <div className="mt-8 border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Version History</h3>
          <div className="space-y-2">
            {note.versions.map((version, index) => (
              <div key={version.timestamp} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                <div>
                  <div className="font-medium">{version.description}</div>
                  <div className="text-sm text-gray-500">{formatDate(version.timestamp)}</div>
                </div>
                <button
                  onClick={() => onRestoreVersion(note.id, version)}
                  className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteEditor;
