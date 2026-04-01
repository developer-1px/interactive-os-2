// ── Axis PoC — style={} 0개. ax()만 사용. ──
// 시각도 구조도 전부 축 값으로 표현한다.

import React from 'react'
import { ax } from './ax'
import './ax.css'

// ════════════════════════════════════════════
// ax() — style={} 없음
// ════════════════════════════════════════════

function AxisButton() {
  return (
    <button className={ax({
      surface: 'action', controlSize: 'md', interaction: 'action',
      tone: 'primary', proximity: 'inline',
    })}>
      Axis Button
    </button>
  )
}

function AxisDestructiveButton() {
  return (
    <button className={ax({
      surface: 'action', controlSize: 'md', interaction: 'action',
      tone: 'destructive', proximity: 'inline',
    })}>
      Delete
    </button>
  )
}

function AxisGhostButton() {
  return (
    <button className={ax({
      surface: 'action', controlSize: 'sm', interaction: 'action',
      tone: 'neutral', proximity: 'inline',
    })}>
      Ghost
    </button>
  )
}

function AxisInput() {
  return (
    <input
      className={ax({ surface: 'input', controlSize: 'lg', interaction: 'input' })}
      placeholder="Type here..."
    />
  )
}

function AxisCard({ children }: { children: React.ReactNode }) {
  return (
    <div className={ax({ surface: 'display', proximity: 'group', padding: 'section' })}>
      {children}
    </div>
  )
}

function AxisMenuItem({ children }: { children: React.ReactNode }) {
  return (
    <div className={ax({
      surface: 'ghost', controlSize: 'md', interaction: 'nav', proximity: 'inline',
    })}>
      {children}
    </div>
  )
}

function AxisOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className={ax({ surface: 'overlay', proximity: 'element', padding: 'section' })}>
      {children}
    </div>
  )
}

function AxisTab({ selected, children }: { selected?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={ax({
        surface: 'ghost', controlSize: 'sm', interaction: 'nav', proximity: 'inline',
      })}
      role="tab"
      aria-selected={selected}
    >
      {children}
    </div>
  )
}

// ════════════════════════════════════════════
// 비교 데모 — style={} 0개
// ════════════════════════════════════════════

export function AxisPoC() {
  return (
    <div className={ax({ layout: 'column', proximity: 'page', padding: 'page' })}>

      <section className={ax({ layout: 'column', proximity: 'element' })}>
        <h2 className={ax({ textStyle: 'section', text: 'primary' })}>1. Tone 변형</h2>
        <div className={ax({ layout: 'row', proximity: 'element', align: 'center' })}>
          <AxisButton />
          <AxisDestructiveButton />
          <AxisGhostButton />
        </div>
      </section>

      <section className={ax({ layout: 'column', proximity: 'element' })}>
        <h2 className={ax({ textStyle: 'section', text: 'primary' })}>3. Input (surface:input)</h2>
        <AxisInput />
      </section>

      <section className={ax({ layout: 'column', proximity: 'element' })}>
        <h2 className={ax({ textStyle: 'section', text: 'primary' })}>4. Menu (surface:overlay + ghost items)</h2>
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

      <section className={ax({ layout: 'column', proximity: 'element' })}>
        <h2 className={ax({ textStyle: 'section', text: 'primary' })}>5. Tabs (surface:ghost + controlSize:sm)</h2>
        <div className={ax({ layout: 'row', proximity: 'inline' })}>
          <AxisTab selected>Overview</AxisTab>
          <AxisTab>Settings</AxisTab>
          <AxisTab>Activity</AxisTab>
        </div>
      </section>

      <section className={ax({ layout: 'column', proximity: 'element' })}>
        <h2 className={ax({ textStyle: 'section', text: 'primary' })}>6. Card (surface:display)</h2>
        <div className={ax({ width: 'md' })}>
          <AxisCard>
            <p className={ax({ textStyle: 'body', text: 'primary' })}>
              이 카드는 surface:display + proximity:group 조합입니다.
              recipe 파일 없이 축 조합만으로 만들었습니다.
            </p>
          </AxisCard>
        </div>
      </section>

      <section className={ax({ layout: 'column', proximity: 'element' })}>
        <h2 className={ax({ textStyle: 'section', text: 'primary' })}>7. Text Styles</h2>
        <div className={ax({ layout: 'column', proximity: 'element' })}>
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
