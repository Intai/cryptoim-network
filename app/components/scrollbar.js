export const scrollbar = () => `
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--pm-scroll-color) var(--pm-scroll-track-color);

  &::-webkit-scrollbar {
    width: $pm--scroll-size;
    height: $pm--scroll-size;
  }
  &::-webkit-scrollbar-track {
    background-color: transparent;
    border-radius: calc($pm--scroll-size / 2);

    &:hover {
      background: var(--pm-scroll-track-color);
    }
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--pm-scroll-color);
    border-radius: calc($pm--scroll-size / 2);
  }
  &::-webkit-scrollbar-corner {
    background: transparent;
  }
`
