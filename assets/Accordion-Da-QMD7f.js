var e=`@layer component {
  /* Accordion — chevron rotation */
  .accordion-chevron {
    transition: transform var(--motion-normal-duration) var(--motion-normal-easing);
  }

  .accordion-chevron[data-expanded='true'] {
    transform: rotate(90deg);
  }
}
`;export{e as default};