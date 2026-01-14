## Packages
framer-motion | Smooth animations for hero section, cards, and page transitions
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind CSS classes without conflicts

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
}
RTL support: Ensure layout direction is handled correctly for Arabic text.
Images: Use Unsplash placeholders for wanted list if no URL provided.
Background Video: Use a stock police/city night video loop or fallback to an image.
