import React from 'react';

/**
 * Builds the editor subdomain URL from the current origin.
 * - Production: scripturetype.web.app -> editor-scripturetype.web.app (or editor.scripturetype.web.app)
 * - Localhost: localhost:5173 -> editor.localhost:5173
 */
function getEditorUrl() {
  if (typeof window === 'undefined') return '#';
  const { protocol, hostname, port } = window.location;
  const hasPort = port && port !== '80' && port !== '443';

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    const base = hostname === 'localhost' ? 'editor.localhost' : `editor.${hostname}`;
    return `${protocol}//${base}${hasPort ? `:${port}` : ''}`;
  }

  // Production: editor-<site> (e.g. editor-scripturetype.web.app) or editor.<site>
  const editorHost = hostname.startsWith('www.')
    ? `editor.${hostname.slice(4)}`
    : `editor-${hostname}`;
  return `${protocol}//${editorHost}${hasPort ? `:${port}` : ''}`;
}

export default function LiveEditButton() {
  const handleClick = () => {
    window.location.assign(getEditorUrl());
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="hover:text-amber-600 transition font-medium"
    >
      Live Edit
    </button>
  );
}
