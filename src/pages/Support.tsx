import React, { useEffect } from 'react';
import { HelpCircle, Mail, MessageSquare } from 'lucide-react';

export const Support: React.FC = () => {
  useEffect(() => {
    const CRISP_WEBSITE_ID = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";
    const win = window as any;
    win.$crisp = win.$crisp || [];
    win.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

    let script = document.getElementById('crisp-inject') as HTMLScriptElement | null;
    if (!script) {
      const newScript = document.createElement('script');
      newScript.id = 'crisp-inject';
      newScript.src = 'https://client.crisp.chat/l.js';
      newScript.async = true;
      document.head.appendChild(newScript);
    }

    // Show chat on mount
    try {
      if (win.$crisp && typeof win.$crisp.push === 'function') {
        win.$crisp.push(["do", "chat:show"]);
      }
    } catch (e) {
      console.warn("Failed to show Crisp chat launcher:", e);
    }

    // Hide chat on unmount
    return () => {
      try {
        if (win.$crisp && typeof win.$crisp.push === 'function') {
          win.$crisp.push(["do", "chat:hide"]);
        }
      } catch (e) {
        console.warn("Failed to hide Crisp chat launcher:", e);
      }
    };
  }, []);

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
      <header style={{ textAlign: 'center', margin: '2rem 0 3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(135deg, #fff 30%, var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Customer Support
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
          Have questions or need technical assistance with your trading bot? Our dedicated team of quantitative engineers is here to help.
        </p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        marginTop: '2rem'
      }}>
        {/* Support Card 1 */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageSquare size={24} color="var(--primary-solid)" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Live Discord Community</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
            Join our professional quant discord server for real-time discussion, setups sharing, and direct developer help.
          </p>
          <a href="#" className="btn-secondary" style={{ marginTop: 'auto', width: '100%', padding: '0.5rem', fontSize: '0.85rem', textDecoration: 'none', textAlign: 'center' }}>
            Join Server
          </a>
        </div>

        {/* Support Card 2 */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Mail size={24} color="#06b6d4" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Email Helpdesk</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
            Send us a technical query or license binding request. We respond to all inquiries within 24 business hours.
          </p>
          <a href="mailto:support@algoforge.com" className="btn-secondary" style={{ marginTop: 'auto', width: '100%', padding: '0.5rem', fontSize: '0.85rem', textDecoration: 'none', textAlign: 'center' }}>
            Email Us
          </a>
        </div>

        {/* Support Card 3 */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <HelpCircle size={24} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>FAQ & Documentation</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
            Read instructions on how to install EX5 files in MT5, configure terminal WebRequests, and troubleshoot session tokens.
          </p>
          <a href="#" className="btn-secondary" style={{ marginTop: 'auto', width: '100%', padding: '0.5rem', fontSize: '0.85rem', textDecoration: 'none', textAlign: 'center' }}>
            Browse Guides
          </a>
        </div>
      </div>
    </div>
  );
};
