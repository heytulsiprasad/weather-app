# Light mode & color theme toggle plan for SkySnap Weather

## Current implementation

### Dark mode support in code

- **CSS variables in `globals.css`** – The app defines `--background` and `--foreground` in the root scope and changes them when the user’s operating system prefers dark mode via a media query ([GitHub source](https://github.com)). This means the site automatically adopts a dark or light background and text based on system settings.
- **Tailwind dark-variant classes** – The home page component uses Tailwind’s `dark:` variant to switch colours when the `dark` class is on the `<html>` element. For example, the `<main>` element uses a blue gradient for light mode and switches to a slate gradient in dark mode ([GitHub source](https://github.com)). Headings, text and cards use `dark:text-slate-*` and `dark:bg-slate-*` classes throughout the UI.
- **No manual toggle** – There is no explicit user control for light/dark mode. Accent colours such as `sky-500` are hard-coded, so users cannot change the app’s colour palette.

### Dark-mode toggling patterns

- Tailwind’s docs recommend toggling the `dark` class on `<html>` and storing the user’s preference in `localStorage`. A three-way toggle should support **light**, **dark** and **system** preferences and use `window.matchMedia` to detect the system theme ([Tailwind docs](https://tailwindcss.com)).
- A practical example shows how to read the saved theme on mount, add or remove the `dark` class, and save the choice in `localStorage`. The `toggleTheme()` function checks whether the `dark` class is present and updates it, saving `'light'` or `'dark'` accordingly ([Prismic tutorial](https://prismic.io)). Another example extends this to a three-option selector (light/dark/system) and listens for system theme changes with `matchMedia()`.

---

## Proposed plan: adding light-mode & colour-theme toggles

### 1. Choose a dark-mode strategy

- **Configure Tailwind for class-based dark mode**: Ensure `tailwind.config.js` sets `darkMode: "class"`. This approach makes the `dark:` variants respond to a `dark` class on `<html>`, enabling manual control. The existing CSS variables can still react to `prefers-color-scheme` when no `dark` class is set.

### 2. Create a theme context/provider

- **State management**: Build a `ThemeContext` that stores two pieces of state: `mode` (light | dark | system) and `accentColor` (e.g., blue, green, rose, amber, violet). Provide functions `setMode()` and `setAccentColor()`.
- **Persistence**: On mount, read `mode` and `accentColor` from `localStorage`. If `mode` is `system`, detect the system preference with `window.matchMedia('(prefers-color-scheme: dark)')` and add or remove the `dark` class accordingly. Save any changes back to `localStorage`.
- **Provider**: Wrap the application with the ThemeContext provider. Whenever `mode` changes, update the `<html>` element’s class list (add `dark` for dark mode; remove it for light; no explicit class for system). Whenever `accentColor` changes, update a `data-theme` attribute or CSS variables (described below).

### 3. Implement the dark-mode toggle UI

- **Toggle control**: Add a small toggle (e.g., a sun/moon icon button or a three-option dropdown) in the header or navigation bar. When clicked, call `setMode('light')`, `setMode('dark')` or `setMode('system')`.
- **Behaviour**: The toggle should update the `dark` class and store the user’s preference. The sample code from the Tailwind tutorial illustrates this pattern ([Prismic tutorial](https://prismic.io)). The system option should remove any stored theme and rely on `prefers-color-scheme`, as recommended by Tailwind docs ([Tailwind docs](https://tailwindcss.com)).
- **Accessibility**: Use `aria-label` attributes and descriptive icons (sun, moon, laptop) to convey the current mode to screen-reader users.

### 4. Implement colour-theme selection

- **Define CSS variables**: Extend `globals.css` to define accent variables such as `--color-primary`, `--color-primary-light`, and `--color-primary-dark` alongside the existing background variables. Provide default values matching the current blue/sky palette. Create additional CSS classes (e.g., `.theme-green`, `.theme-rose`, `.theme-amber`) that override these variables.
- **Extend Tailwind**: In `tailwind.config.js`, extend the colour palette to map custom names to the variables:

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-light': 'var(--color-primary-light)',
        'primary-dark': 'var(--color-primary-dark)',
      },
    },
  },
};
````

* Replace hard-coded classes like `bg-sky-500` with `bg-primary`, `bg-sky-50` with `bg-primary-light`, and `text-sky-700` with `text-primary-dark`. This makes the accent colour configurable.
* **Theme selection UI**: Provide a row of colour swatches or a dropdown for users to choose their accent colour. When a colour is selected, apply a theme class to `<html>` (e.g., `class="theme-green"`) or update the CSS variables via JavaScript. Store the selection in `localStorage`.

### 5. Prevent flash of wrong theme (FOUC)

* **Inline script**: Add a small script in the `<head>` of `layout.tsx` that runs before the app renders. It should read `mode` and `accentColor` from `localStorage` and update the `<html>` element’s classes and CSS variables accordingly. Tailwind’s docs emphasise toggling the `dark` class early to avoid flashes of incorrect colour ([Tailwind docs](https://tailwindcss.com)).

### 6. Update existing components to use dynamic colours

* Replace all occurrences of fixed accent colours (`bg-sky-*`, `text-sky-*`, etc.) with the new `primary`, `primary-light` and `primary-dark` classes. Leave neutral colours (e.g., `slate`) unchanged.
* For gradients and backgrounds, use CSS variables or Tailwind’s arbitrary values:
  `from-[var(--color-primary-light)] via-blue-50 to-indigo-100` for light mode and
  `dark:from-[var(--color-primary-dark)]` for dark mode.

### 7. Testing

* **Cross-mode testing**: Verify light, dark and system modes across browsers and devices. Confirm that the system option updates when the OS theme changes.
* **Colour-theme testing**: Ensure each accent colour propagates through headings, buttons, inputs and gradient backgrounds without affecting readability. Provide sensible contrasts in both light and dark modes.
* **Fallback**: Default to light mode with the blue theme if no preference is stored or if `localStorage` is unavailable.

---

## Summary

The SkySnap Weather app currently adopts the user’s system dark mode and hard-codes blue accent colours ([GitHub source](https://github.com), [GitHub source](https://github.com)). To offer a better user experience, we propose building a theme context and UI controls that let users choose between light, dark and system themes and select their preferred accent colour. The plan follows Tailwind’s recommended approach of toggling the `dark` class and storing preferences in `localStorage` ([Tailwind docs](https://tailwindcss.com)), and extends it to colour themes by defining CSS variables and mapping them in the Tailwind configuration. This will give users persistent control over both the app’s brightness and colour palette.

