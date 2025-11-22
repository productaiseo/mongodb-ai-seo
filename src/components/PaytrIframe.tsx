'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';

interface Props {
  iframeToken: string;
}

export default function PaytrIframe({ iframeToken }: Readonly<Props>) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (scriptLoaded && iframeRef.current && window.iFrameResize) {
      window.iFrameResize({}, '#paytriframe');
    }
  }, [scriptLoaded, iframeToken]);

  return (
    <div className="max-w-4xl mx-auto">
      <Script
        src="https://www.paytr.com/js/iframeResizer.min.js"
        onLoad={() => setScriptLoaded(true)}
        strategy="afterInteractive"
      />
      
      <div className="bg-white rounded-lg shadow-lg p-4">
        <iframe
          ref={iframeRef}
          id="paytriframe"
          src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
          frameBorder="0"
          scrolling="no"
          style={{ width: '100%', minHeight: '600px' }}
        />
      </div>
    </div>
  );
}

// Add type declaration for iFrameResize
declare global {
  interface Window {
    iFrameResize: (options: any, selector: string) => void;
  }
}
