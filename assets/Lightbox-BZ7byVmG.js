var e=`/* ② lightbox-prd.md — dialog UA stylesheet override (last-mile) */
@layer component {
  .lightbox-dialog {
    position: var(--_pos-fixed, fixed);
    inset: 0;
    max-width: none;
    max-height: none;
    border: none;
    cursor: var(--_cursor-zoom-out, zoom-out);
  }

  img.lightbox-content {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
  }

  .lightbox-svg {
    max-width: 90vw;
    max-height: 90vh;
  }

  .lightbox-svg svg {
    max-width: 90vw;
    max-height: 90vh;
  }

  .lightbox-canvas {
    width: 100vw;
    height: 100vh;
  }

  .lightbox-mermaid {
    transform-origin: center center;
  }

  .lightbox-mermaid svg {
    max-width: none;
    max-height: none;
  }
}
`;export{e as default};