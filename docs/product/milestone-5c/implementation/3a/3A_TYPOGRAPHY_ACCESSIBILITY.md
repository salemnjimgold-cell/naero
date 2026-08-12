# 3A Typography and Accessibility

System fonts remain primary; no dependency or licensed font was added. iOS uses the system family and Arabic-capable native fallback. Android uses `sans-serif`, allowing Roboto/Noto-compatible platform fallback and native Arabic shaping.

Roles: display 32/38, titleLarge 28/34, title 22/28, titleSmall 18/24, bodyLarge 17/26, body 16/24, bodyStrong 16/24, label 14/20, caption 13/18 and micro 12/16.

Every semantic role permits a 2× font-size multiplier. Foundation rules prohibit fixed-height text containers and one-line assumptions for actions, sources and explanatory text. Touch targets are 44 minimum and 48 preferred.

Legacy risks deferred to screen migration: fixed heights, English-width buttons, physical left/right margins, inconsistent `numberOfLines`, incomplete accessibility props and ambient animation without uniform reduced-motion checks. 3A does not mass-edit those screens.

Contrast tests cover primary/secondary text, raised/reading surfaces, guidance actions, warnings and danger in both modes. All critical text/action pairs meet 4.5:1; warning/danger informational graphics meet at least 3:1.
