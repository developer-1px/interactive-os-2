// ── Axis PoC — style={} 0개. ax()만 사용. ──
// 시각 5축 + 구조 5축 = 10축으로 모든 것을 표현한다.

import React from 'react'
import { ax } from '@styles/ax'
import './ax.css'

// ════════════════════════════════════════════
// ax() — style={} 없음
// ════════════════════════════════════════════

function AxisButton() {
  return (
    <button className={ax({ surface: 'action', controlSize: 'md', padding: 'sm', content: 'text', tone: 'accent' })}>
      Axis Button
    </button>
  )
}

function AxisDangerButton() {
  return (
    <button className={ax({ surface: 'action', controlSize: 'md', padding: 'sm', content: 'text', tone: 'danger' })}>
      Delete
    </button>
  )
}

function AxisGhostButton() {
  return (
    <button className={ax({ surface: 'action', controlSize: 'sm', padding: 'sm', content: 'text', tone: 'neutral' })}>
      Ghost
    </button>
  )
}

function AxisInput() {
  return (
    <input
      className={ax({ surface: 'input', controlSize: 'lg', padding: 'sm', content: 'text' })}
      placeholder="Type here..."
    />
  )
}

function AxisCard({ children }: { children: React.ReactNode }) {
  return (
    <div className={ax({ surface: 'display', gap: 'md', padding: 'lg' })}>
      {children}
    </div>
  )
}

function AxisMenuItem({ children }: { children: React.ReactNode }) {
  return (
    <div className={ax({ surface: 'ghost', controlSize: 'md', padding: 'sm', content: 'text' })}>
      {children}
    </div>
  )
}

function AxisOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className={ax({ surface: 'overlay', gap: 'sm', padding: 'lg' })}>
      {children}
    </div>
  )
}

function AxisTab({ selected, children }: { selected?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={ax({ surface: 'ghost', controlSize: 'sm', padding: 'sm', content: 'text' })}
      role="tab"
      aria-selected={selected}
    >
      {children}
    </div>
  )
}

// ════════════════════════════════════════════
// 데모 — style={} 0개
// ════════════════════════════════════════════

export function AxisPoC() {
  return (
    <div className={ax({ layout: 'column', gap: 'xl', padding: 'xl' })}>

      <section className={ax({ layout: 'column', gap: 'sm' })}>
        <h2 className={ax({ textStyle: 'section', text: 'primary' })}>1. Tone 변형</h2>
        <div className={ax({ layout: 'bar', gap: 'sm' })}>
          <AxisButton />
          <AxisDangerButton />
          <AxisGhostButton />
        </div>
      </section>

      <section className={ax({ layout: 'column', gap: 'sm' })}>
        <h2 className={ax({ textStyle: 'section', text: 'primary' })}>2. Input (surface:input)</h2>
        <AxisInput />
      </section>

      <section className={ax({ layout: 'column', gap: 'sm' })}>
        <h2 className={ax({ textStyle: 'section', text: 'primary' })}>3. Menu (surface:overlay + ghost items)</h2>
        <div className={ax({ width: 'sm' })}>
          <AxisOverlay>
            <div className={ax({ layout: 'column' })}>
              <AxisMenuItem>New File</AxisMenuItem>
              <AxisMenuItem>Open Folder</AxisMenuItem>
              <AxisMenuItem>Save As...</AxisMenuItem>
            </div>
          </AxisOverlay>
        </div>
      </section>

      <section className={ax({ layout: 'column', gap: 'sm' })}>
        <h2 className={ax({ textStyle: 'section', text: 'primary' })}>4. Tabs (surface:ghost + controlSize:sm)</h2>
        <div className={ax({ layout: 'bar', gap: 'xs' })}>
          <AxisTab selected>Overview</AxisTab>
          <AxisTab>Settings</AxisTab>
          <AxisTab>Activity</AxisTab>
        </div>
      </section>

      <section className={ax({ layout: 'column', gap: 'sm' })}>
        <h2 className={ax({ textStyle: 'section', text: 'primary' })}>5. Card (surface:display)</h2>
        <div className={ax({ width: 'md' })}>
          <AxisCard>
            <p className={ax({ textStyle: 'body', text: 'primary' })}>
              이 카드는 surface:display + gap:md + padding:lg 조합입니다.
              recipe 파일 없이 10축 조합만으로 만들었습니다.
            </p>
          </AxisCard>
        </div>
      </section>

      <section className={ax({ layout: 'column', gap: 'sm' })}>
        <h2 className={ax({ textStyle: 'section', text: 'primary' })}>6. Text Styles</h2>
        <div className={ax({ layout: 'column', gap: 'sm' })}>
          <span className={ax({ textStyle: 'hero', text: 'primary' })}>Hero 40px</span>
          <span className={ax({ textStyle: 'display', text: 'primary' })}>Display 32px</span>
          <span className={ax({ textStyle: 'page', text: 'primary' })}>Page 24px</span>
          <span className={ax({ textStyle: 'section', text: 'primary' })}>Section 16px</span>
          <span className={ax({ textStyle: 'body', text: 'secondary' })}>Body 14px</span>
          <span className={ax({ textStyle: 'caption', text: 'muted' })}>Caption 12px</span>
          <span className={ax({ textStyle: 'code', text: 'primary' })}>Code 12px mono</span>
        </div>
      </section>

    </div>
  )
}
