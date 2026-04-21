import React from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead.jsx'

export default function TermsAndConditions() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b0d13',
      color: '#eaebf0',
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
    }}>
      <SEOHead title="Terms & Conditions" description="TradeSharp terms and conditions." noIndex={true} />
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
          Terms & Conditions
        </h1>
        <p style={{ fontSize: 13, color: '#6b6e84', marginBottom: 48 }}>
          Last updated: January 1, 2025
        </p>

        <Section title="1. Agreement to Terms">
          <p>By accessing or using the TradeSharp application and website at <strong>tradesharp.xyz</strong> (the "Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use the Service.</p>
          <p>These Terms apply to all users, visitors, and others who access or use the Service. We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>TradeSharp is a personal trading performance tracker and journal application designed to help futures and other traders:</p>
          <ul>
            <li>Log and review trade journal entries.</li>
            <li>Track progress through a gamified trading roadmap.</li>
            <li>Complete pre-trade checklists and daily plans.</li>
            <li>Analyze trading statistics and performance metrics.</li>
            <li>Access educational resources and notes.</li>
          </ul>
          <p>TradeSharp is a <strong>personal productivity and journaling tool only</strong>. It is not a brokerage, financial advisor, investment advisor, or trading platform. Nothing in the Service constitutes financial advice, investment advice, trading advice, or any other type of advice.</p>
        </Section>

        <Section title="3. Eligibility">
          <p>You must be at least 18 years of age to use the Service. By using the Service, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms.</p>
          <p>The Service is not intended for use in jurisdictions where its use would be illegal or unlawful. You are responsible for compliance with your local laws and regulations.</p>
        </Section>

        <Section title="4. User Accounts">
          <p>To access certain features of the Service, you must create an account. You agree to:</p>
          <ul>
            <li>Provide accurate, complete, and current account information.</li>
            <li>Maintain the security of your password and accept responsibility for all activity under your account.</li>
            <li>Notify us immediately at <a href="mailto:tradesharpxyz@gmail.com" style={{ color: '#22d3ee' }}>tradesharpxyz@gmail.com</a> of any unauthorized access or security breach.</li>
            <li>Not share your account credentials with any third party.</li>
          </ul>
          <p>We reserve the right to terminate accounts, remove content, or deny access to the Service at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, third parties, or the Service.</p>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
          <ul>
            <li>Use the Service in any way that violates applicable local, national, or international law or regulation.</li>
            <li>Attempt to gain unauthorized access to any part of the Service or its related systems or networks.</li>
            <li>Use automated scripts, bots, or other tools to scrape, crawl, or extract data from the Service.</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Service.</li>
            <li>Transmit any unsolicited or unauthorized advertising, promotional material, or spam.</li>
            <li>Upload or transmit viruses or any other malicious code.</li>
            <li>Impersonate or attempt to impersonate TradeSharp, a TradeSharp employee, another user, or any other person or entity.</li>
            <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service.</li>
          </ul>
        </Section>

        <Section title="6. Intellectual Property">
          <p>The Service and its original content (excluding user-submitted data), features, functionality, branding, and design are and will remain the exclusive property of TradeSharp and its licensors. The Service is protected by copyright, trademark, and other applicable intellectual property laws.</p>
          <p>You are granted a limited, non-exclusive, non-transferable, revocable license to use the Service solely for your personal, non-commercial use in accordance with these Terms.</p>
          <p>You retain ownership of all trading data, journal entries, and notes you submit to the Service. By submitting data, you grant TradeSharp a limited license to store and display that data solely to provide the Service to you.</p>
        </Section>

        <Section title="7. No Financial Advice Disclaimer">
          <p><strong>IMPORTANT: TradeSharp is not a financial advisor, broker, dealer, or investment advisor registered with any regulatory authority.</strong></p>
          <p>All content, tools, features, and information provided by the Service — including trade tracking, performance statistics, roadmap guidance, educational materials, and AI-generated summaries — are for <strong>informational and personal record-keeping purposes only</strong>. Nothing in the Service should be construed as:</p>
          <ul>
            <li>A recommendation to buy, sell, or hold any financial instrument.</li>
            <li>Investment advice or financial planning advice.</li>
            <li>A guarantee of trading performance or profitability.</li>
          </ul>
          <p>Trading futures, options, and other financial instruments involves substantial risk of loss and is not suitable for all investors. Past performance tracked in TradeSharp does not guarantee future results. You are solely responsible for your own trading decisions.</p>
          <p>Always consult with a qualified financial advisor or licensed professional before making any trading or investment decisions.</p>
        </Section>

        <Section title="8. Third-Party Integrations">
          <p>The Service may allow you to connect optional third-party services (such as an Anthropic API key for AI features or a Google Sheets URL). Your use of such third-party services is governed by their respective terms and privacy policies. TradeSharp is not responsible for the availability, accuracy, or content of third-party services.</p>
          <p>TradeSharp does not endorse any third-party services and makes no warranties or representations regarding them.</p>
        </Section>

        <Section title="9. Disclaimer of Warranties">
          <p>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, TRADESHARP DISCLAIMS ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
          <p>WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. WE DO NOT WARRANT THE ACCURACY, COMPLETENESS, OR RELIABILITY OF ANY CONTENT OR DATA AVAILABLE THROUGH THE SERVICE.</p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL TRADESHARP, ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, TRADING LOSSES, LOSS OF DATA, OR BUSINESS INTERRUPTION, ARISING FROM OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
          <p>OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM OR (B) $50 USD.</p>
        </Section>

        <Section title="11. Indemnification">
          <p>You agree to defend, indemnify, and hold harmless TradeSharp and its officers, directors, employees, and agents from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Service.</p>
        </Section>

        <Section title="12. Termination">
          <p>We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms.</p>
          <p>You may terminate your account at any time by contacting us at <a href="mailto:tradesharpxyz@gmail.com" style={{ color: '#22d3ee' }}>tradesharpxyz@gmail.com</a>. Upon termination, your right to use the Service will immediately cease.</p>
          <p>All provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.</p>
        </Section>

        <Section title="13. Governing Law">
          <p>These Terms shall be governed by and construed in accordance with applicable law, without regard to conflict of law principles. Any disputes arising from these Terms or your use of the Service shall be resolved through good-faith negotiation first, and if unsuccessful, through binding arbitration or the courts of competent jurisdiction.</p>
        </Section>

        <Section title="14. Changes to Terms">
          <p>We reserve the right to modify these Terms at any time. We will provide notice of significant changes by updating the "Last updated" date at the top of this page. For material changes, we may also notify you by email.</p>
          <p>Your continued use of the Service after any changes to these Terms constitutes your acceptance of the new Terms. If you do not agree to the new Terms, you must stop using the Service.</p>
        </Section>

        <Section title="15. Contact Us">
          <p>If you have any questions about these Terms and Conditions, please contact us:</p>
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
