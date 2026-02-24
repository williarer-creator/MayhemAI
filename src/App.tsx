/**
 * MayhemAI - Main Application
 *
 * AI-powered engineering system
 */

import { useState, useEffect } from 'react';
import { initKernel, isKernelReady } from './core/kernel';

function App() {
  const [kernelStatus, setKernelStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    initKernel()
      .then(() => setKernelStatus('ready'))
      .catch((error) => {
        console.error('Failed to initialize kernel:', error);
        setKernelStatus('error');
      });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem',
    }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
          MayhemAI
        </h1>
        <p style={{ color: '#888', fontSize: '1.2rem' }}>
          AI-Powered Engineering System
        </p>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          From requirements to production files
        </p>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Kernel Status */}
        <section style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>System Status</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: kernelStatus === 'ready' ? '#4ade80' :
                         kernelStatus === 'loading' ? '#fbbf24' : '#f87171',
            }} />
            <span>
              OpenCascade Kernel: {
                kernelStatus === 'ready' ? 'Ready' :
                kernelStatus === 'loading' ? 'Loading...' : 'Error'
              }
            </span>
          </div>
        </section>

        {/* Pipeline Overview */}
        <section style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>AI Pipeline</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            {[
              { name: 'Vision', desc: 'Scan & Image Processing', status: 'planned' },
              { name: 'Reasoning', desc: 'Engineering Decisions', status: 'planned' },
              { name: 'Generation', desc: '3D Geometry Creation', status: 'skeleton' },
              { name: 'Outputs', desc: 'Manufacturing Files', status: 'planned' },
            ].map((module) => (
              <div key={module.name} style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '1rem',
              }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{module.name}</h3>
                <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  {module.desc}
                </p>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  background: module.status === 'skeleton' ? '#3b82f6' : '#374151',
                  color: '#fff',
                }}>
                  {module.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Output Types */}
        <section style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Manufacturing Outputs</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
          }}>
            {[
              { name: 'CNC Mill', icon: '🔧', formats: 'G-code, Setup Sheets' },
              { name: 'CNC Lathe', icon: '⚙️', formats: 'G-code, Tooling' },
              { name: 'Laser Cut', icon: '✂️', formats: 'DXF, Nesting' },
              { name: 'Drawings', icon: '📐', formats: 'PDF, GD&T' },
              { name: '3D Print', icon: '🖨️', formats: 'STL, Slicing' },
              { name: 'Welding', icon: '🔥', formats: 'WPS, Drawings' },
            ].map((output) => (
              <div key={output.name} style={{
                textAlign: 'center',
                padding: '1rem',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{output.icon}</div>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{output.name}</div>
                <div style={{ color: '#666', fontSize: '0.75rem' }}>{output.formats}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Getting Started */}
        <section style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Development Status</h2>
          <p style={{ color: '#888', lineHeight: '1.6' }}>
            This is the foundation of MayhemAI. The OpenCascade geometry kernel from 3DMayhem
            is integrated and ready. Next steps:
          </p>
          <ul style={{ color: '#888', lineHeight: '1.8', marginTop: '1rem', paddingLeft: '1.5rem' }}>
            <li>Implement AI orchestration pipeline</li>
            <li>Add point cloud processing for environment scans</li>
            <li>Build image-to-3D feature extraction</li>
            <li>Create G-code post-processor framework</li>
            <li>Develop DXF export with nesting optimization</li>
            <li>Build drawing generation system</li>
          </ul>
        </section>
      </main>

      <footer style={{ textAlign: 'center', marginTop: '3rem', color: '#666' }}>
        <p>MayhemAI - Sister project to 3DMayhem</p>
        <p style={{ fontSize: '0.8rem' }}>Sharing OpenCascade.js geometry kernel</p>
      </footer>
    </div>
  );
}

export default App;
