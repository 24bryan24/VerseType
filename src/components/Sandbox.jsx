import React, { useState, useEffect, useRef } from 'react';
import { WebContainer } from '@webcontainer/api';
import { Loader2, AlertCircle, Globe } from 'lucide-react';

/** WebContainers require Chromium (Chrome, Edge) and cross-origin isolation. Safari and Firefox are not supported. */
function isWebContainerSupported() {
  if (typeof window === 'undefined') return false;
  if (!window.crossOriginIsolated) return false;
  const ua = navigator.userAgent;
  const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|Edg|FxiOS/.test(ua);
  const isFirefox = /Firefox|FxiOS/.test(ua);
  return !isSafari && !isFirefox;
}

function getMainSiteUrl() {
  if (typeof window === 'undefined') return '/';
  const { protocol, hostname, port } = window.location;
  const hasPort = port && port !== '80' && port !== '443';
  if (hostname === 'editor.localhost' || hostname.endsWith('.localhost')) {
    const mainHost = hostname === 'editor.localhost' ? 'localhost' : hostname.replace(/^editor\./, '');
    return `${protocol}//${mainHost}${hasPort ? `:${port}` : ''}`;
  }
  const mainHost = hostname.replace(/^editor\./, '').replace(/^editor-/, '');
  return `${protocol}//${mainHost}${hasPort ? `:${port}` : ''}`;
}

/** Static project: no npm install, just npx serve. Avoids npm registry issues in the container. */
const DEFAULT_PROJECT = {
  'index.html': {
    file: {
      contents: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Live Edit Sandbox</title>
</head>
<body>
  <div style="font-family: system-ui; padding: 2rem; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #b45309;">Live Edit Sandbox</h1>
    <p>This page is running inside a WebContainer — a Node.js environment in your browser.</p>
    <p>Edit files in the project to see changes.</p>
  </div>
</body>
</html>
`,
    },
  },
};

const LOADING_STEPS = {
  boot: 'Booting WebContainer…',
  mount: 'Loading project…',
  serve: 'Starting server…',
};

export default function Sandbox() {
  const [status, setStatus] = useState(() => (isWebContainerSupported() ? 'loading' : 'fallback'));
  const [loadingStep, setLoadingStep] = useState(LOADING_STEPS.boot);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const iframeRef = useRef(null);
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (!isWebContainerSupported()) return;
    let mounted = true;
    let unsubServerReady = () => {};
    let unsubPort = () => {};
    let timeoutId = null;

    const TIMEOUT_MS = 120000; // 2 minutes
    timeoutId = setTimeout(() => {
      if (mounted && !resolvedRef.current) {
        setErrorMessage('The sandbox is taking too long to start. Try refreshing the page. If it still doesn’t load, use Chrome or Edge and ensure you’re on the editor site (e.g. editor-scripturetype.web.app).');
        setStatus('error');
      }
    }, TIMEOUT_MS);

    async function start() {
      try {
        setLoadingStep(LOADING_STEPS.boot);
        const instance = await WebContainer.boot();
        if (!mounted) return;

        const setUrl = (url) => {
          if (mounted && url) {
            resolvedRef.current = true;
            setPreviewUrl(url);
          }
        };
        unsubServerReady = instance.on('server-ready', (port, url) => setUrl(url));
        unsubPort = instance.on('port', (port, type, url) => {
          if (type === 'open' && url) setUrl(url);
        });

        instance.on('error', (err) => {
          if (mounted) {
            resolvedRef.current = true;
            setErrorMessage(err?.message || 'WebContainer error');
            setStatus('error');
          }
        });

        setLoadingStep(LOADING_STEPS.mount);
        await instance.mount(DEFAULT_PROJECT);
        if (!mounted) return;

        setLoadingStep(LOADING_STEPS.serve);
        await instance.spawn('npx', ['-y', 'serve', '.', '-l', '3000']);
        if (mounted && status === 'loading' && !previewUrl) setStatus('ready');
      } catch (err) {
        if (mounted) {
          resolvedRef.current = true;
          setErrorMessage(err?.message || String(err));
          setStatus('error');
        }
      }
    }

    start();
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      unsubServerReady();
      unsubPort();
    };
  }, []);

  useEffect(() => {
    if (previewUrl && status === 'loading') setStatus('ready');
  }, [previewUrl, status]);

  const handleExit = () => {
    window.location.assign(getMainSiteUrl());
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] text-stone-900">
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex justify-end shrink-0">
        <button
          type="button"
          onClick={handleExit}
          className="px-4 py-2 rounded-xl font-bold text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition"
        >
          Back to Main Site
        </button>
      </header>
      <main className="flex-1 flex flex-col min-h-0 p-4">
        {status === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-stone-500">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <p className="font-medium">{loadingStep}</p>
            <p className="text-sm">This may take a minute or two on first load.</p>
          </div>
        )}
        {status === 'fallback' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-stone-600 max-w-md mx-auto text-center px-4">
            <Globe className="w-14 h-14 text-amber-500" />
            <div className="space-y-2">
              <p className="font-semibold text-stone-800">Live Edit isn’t available in this browser</p>
              <p className="text-sm text-stone-500">
                The sandbox uses WebContainers, which only work in <strong>Chrome</strong> or <strong>Edge</strong>. Safari and Firefox aren’t supported.
              </p>
              <p className="text-sm text-stone-500">
                You can keep using the main site here in Safari — everything else (typing, stats, library) works as usual.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExit}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-amber-500 text-white hover:bg-amber-600 transition"
            >
              Back to Main Site
            </button>
          </div>
        )}
        {status === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-stone-600 max-w-md mx-auto text-center">
            <AlertCircle className="w-12 h-12 text-amber-500" />
            <p className="font-semibold">Could not start the sandbox</p>
            <p className="text-sm text-stone-500">{errorMessage}</p>
            <p className="text-xs text-stone-400">
              WebContainers require a Chromium-based browser (Chrome, Edge) and the editor subdomain must be served with COEP/COOP headers (e.g. over HTTPS).
            </p>
            <button
              type="button"
              onClick={handleExit}
              className="mt-2 px-4 py-2 rounded-xl font-bold text-sm text-stone-600 hover:bg-stone-100 transition"
            >
              Back to Main Site
            </button>
          </div>
        )}
        {status === 'ready' && (
          <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-stone-200 bg-white shadow-sm">
            {previewUrl ? (
              <iframe
                ref={iframeRef}
                src={previewUrl}
                title="Live Edit Preview"
                className="w-full h-full min-h-[400px] border-0"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="w-full h-full min-h-[400px] flex items-center justify-center text-stone-500">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
