# Lane 2 UI pieces

Thin wrappers over the shared base components in `src/components/ui` and the
`ui-*` classes in `src/styles/ui.css` (design/DESIGN_SYSTEM.md §9), keeping the
props the review and project screens already use. Anything with a shared
equivalent delegates to it; the rest is styled only through the shared tokens.
