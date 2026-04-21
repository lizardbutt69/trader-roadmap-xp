import React from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead.jsx'

export default function PrivacyPolicy() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b0d13',
      color: '#eaebf0',
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
    }}>
      <SEOHead title="Privacy Policy" description="TradeSharp privacy policy." noIndex={true} />
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '20px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: 'rgba(11,13,19,0.85)',
        backdropFilter: 'blur(20px)',
        zIndex: 50,
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: '#eaebf0' }}>
            Trade<span style={{ color: '#22d3ee' }}>Sharp</span>
          </span>
        </Link>
        <Link to="/" style={{
          fontSize: 13, color: '#6b6e84', textDecoration: 'none',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '6px 14px', borderRadius: 6,
          transition: 'color 0.2s',
        }}
          onMouseEnter={e => e.target.style.color = '#22d3ee'}
          onMouseLeave={e => e.target.style.color = '#6b6e84'}
        >
          ← Back to Home
        </Link>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 100px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: '#6b6e84', marginBottom: 48 }}>
          Last updated: January 1, 2025
        </p>

        <Section title="1. Introduction">
          <p>Welcome to TradeSharp ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website at <strong>tradesharp.xyz</strong> and our TradeSharp application (collectively, the "Service").</p>
          <p>Please read this policy carefully. If you disagree with its terms, please discontinue use of our Service.</p>
        </Section>

        <Section title="2. Information We Collect">
          <p>We collect information you provide directly to us, including:</p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, and password when you create an account.</li>
            <li><strong>Profile Information:</strong> Display name, avatar image, and any optional profile details you choose to provide.</li>
            <li><strong>Trading Data:</strong> Trade journal entries, trade plans, checklists, performance notes, and related data you input into the Service.</li>
            <li><strong>Integration Credentials:</strong> API keys (e.g., Anthropic API key) or third-party service URLs you optionally connect to the Service. These are stored encrypted and used solely to power features you enable.</li>
            <li><strong>Communications:</strong> Messages or feedback you send us directly.</li>
          </ul>
          <p>We also collect certain information automatically when you use the Service:</p>
          <ul>
            <li><strong>Usage Data:</strong> Pages viewed, features used, time spent, and interactions within the app.</li>
            <li><strong>Device & Technical Data:</strong> Browser type, operating system, IP address, and referring URLs.</li>
            <li><strong>Cookies & Local Storage:</strong> We use cookies and browser local storage to maintain your session, remember preferences (such as privacy mode and theme), and improve your experience.</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, operate, and maintain the TradeSharp Service.</li>
            <li>Create and manage your user account.</li>
            <li>Store and display your trading journal, roadmap progress, and performance data.</li>
            <li>Enable AI-powered features (such as trading summaries) using API keys you provide.</li>
            <li>Send you transactional emails (account confirmation, password reset).</li>
            <li>Respond to your comments, questions, and support requests.</li>
            <li>Monitor and analyze usage to improve the Service.</li>
            <li>Detect, prevent, and address technical issues or fraudulent activity.</li>
            <li>Comply with legal obligations.</li>
          </ul>
          <p>We do <strong>not</strong> sell your personal information or your trading data to third parties. We do not use your trading data to train AI models or share it with financial institutions.</p>
        </Section>

        <Section title="4. Data Storage and Security">
          <p>Your data is stored securely using <strong>Supabase</strong>, a hosted database platform with enterprise-grade security. All data is encrypted in transit (TLS/SSL) and at rest. We implement row-level security policies so that each user can only access their own data.</p>
          <p>While we take reasonable measures to protect your information, no method of transmission over the Internet or method of electronic storage is 100% secure. We cannot guarantee absolute security.</p>
          <p>You are responsible for maintaining the confidentiality of your account credentials. Please notify us immediately at <a href="mailto:tradesharpxyz@gmail.com" style={{ color: '#22d3ee' }}>tradesharpxyz@gmail.com</a> if you suspect any unauthorized use of your account.</p>
        </Section>

        <Section title="5. Third-Party Services">
          <p>The Service integrates with third-party services that have their own privacy policies:</p>
          <ul>
            <li><strong>Supabase:</strong> Database, authentication, and file storage.</li>
            <li><strong>Vercel:</strong> Hosting and deployment infrastructure.</li>
            <li><strong>Anthropic (optional):</strong> AI-powered analysis features, using an API key you supply. Your trading data sent to Anthropic is governed by Anthropic's privacy policy.</li>
          </ul>
          <p>We are not responsible for the privacy practices of these third parties. We encourage you to review their respective privacy policies.</p>
        </Section>

        <Section title="6. Cookies and Tracking Technologies">
          <p>We use the following types of cookies and local storage:</p>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for authentication and to keep you logged in.</li>
            <li><strong>Preference Storage:</strong> Browser local storage to remember settings like dark/light mode and privacy mode.</li>
            <li><strong>Analytics (if enabled):</strong> Anonymous usage data to understand how the Service is used.</li>
          </ul>
          <p>You can control cookies through your browser settings. Note that disabling essential cookies may prevent you from using parts of the Service.</p>
        </Section>

        <Section title="7. Data Retention">
          <p>We retain your account data and trading records for as long as your account is active. If you delete your account, we will delete or anonymize your personal data within 30 days, except where retention is required by law or for legitimate business purposes (such as fraud prevention).</p>
          <p>You may export your trade data at any time using the CSV export feature in the Journal view.</p>
        </Section>

        <Section title="8. Your Rights and Choices">
          <p>Depending on your location, you may have the following rights regarding your personal data:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data ("right to be forgotten").</li>
            <li><strong>Portability:</strong> Request your data in a portable format (CSV export is available in-app).</li>
            <li><strong>Objection:</strong> Object to certain processing of your data.</li>
          </ul>
          <p>To exercise any of these rights, contact us at <a href="mailto:tradesharpxyz@gmail.com" style={{ color: '#22d3ee' }}>tradesharpxyz@gmail.com</a>. We will respond within 30 days.</p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child under 18 has provided us with personal information, we will take steps to delete such information. If you believe a child has provided us their information, please contact us at <a href="mailto:tradesharpxyz@gmail.com" style={{ color: '#22d3ee' }}>tradesharpxyz@gmail.com</a>.</p>
        </Section>

        <Section title="10. Changes to This Privacy Policy">
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated "Last updated" date. For material changes, we may also send an email notification. We encourage you to review this policy periodically.</p>
          <p>Your continued use of the Service after any changes constitutes your acceptance of the updated Privacy Policy.</p>
        </Section>

        <Section title="11. Contact Us">
          <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
          <p>
            <strong>TradeSharp</strong><br />
            Website: <strong>tradesharp.xyz</strong><br />
            Email: <a href="mailto:tradesharpxyz@gmail.com" style={{ color: '#22d3ee' }}>tradesharpxyz@gmail.com</a>
          </p>
        </Section>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <p style={{ fontSize: 13, color: '#6b6e84', margin: 0 }}>
          © {new Date().getFullYear()} TradeSharp. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link to="/privacy" style={{ fontSize: 13, color: '#6b6e84', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = '#22d3ee'}
            onMouseLeave={e => e.target.style.color = '#6b6e84'}
          >Privacy Policy</Link>
          <Link to="/terms" style={{ fontSize: 13, color: '#6b6e84', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = '#22d3ee'}
            onMouseLeave={e => e.target.style.color = '#6b6e84'}
          >Terms & Conditions</Link>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{
        fontSize: 18,
        fontWeight: 700,
        color: '#eaebf0',
        marginBottom: 14,
        paddingBottom: 10,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>{title}</h2>
      <div style={{ fontSize: 15, color: '#9ca3af', lineHeight: 1.75 }}>
        {children}
      </div>
    </section>
  )
}
