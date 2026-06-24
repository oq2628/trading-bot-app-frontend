import React from 'react';
import { Shield, Cpu, Zap, Target } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
      <header style={{ textAlign: 'center', margin: '2rem 0 3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(135deg, #fff 30%, var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          About AlgoForge
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
          Empowering quantitative traders with institutional-grade automation tools and expert execution systems.
        </p>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <section className="glass-panel" style={{ padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fff' }}>
            <Target size={22} color="var(--primary-solid)" />
            Our Mission
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
            At AlgoForge, we bridge the gap between retail trading and high-frequency quantitative execution. We design and compile cutting-edge trading bots, Expert Advisors (EAs), and precise indicators for the MetaTrader 5 platform, helping traders automate their strategy execution with minimal latency and maximum reliability.
          </p>
        </section>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Feature 1 */}
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
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
              <Cpu size={24} color="#06b6d4" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0 0.25rem' }}>Institutional Algorithms</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Expert Advisors backtested on extensive historical tick data with real spread and slippage simulation.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
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
              <Zap size={24} color="var(--primary-solid)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0 0.25rem' }}>Ultra-Low Latency</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Optimized MQL5 source code designed for rapid order execution and minimal terminal overhead.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
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
              <Shield size={24} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0 0.25rem' }}>Secure Licensing</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Our custom-built secure API key verification validates your license directly against our secure servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
