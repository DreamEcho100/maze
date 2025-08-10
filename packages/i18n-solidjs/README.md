# @de100/i18n-solidjs

A SolidJS wrapper for the `@de100/i18n` internationalization library, providing reactive state management and easy-to-use hooks for multilingual SolidJS applications. Built with SolidJS's `createStore` for optimal performance and fine-grained reactivity.

## Installation

```bash
npm install @de100/i18n-solidjs @de100/i18n
# or
yarn add @de100/i18n-solidjs @de100/i18n
# or
pnpm add @de100/i18n-solidjs @de100/i18n
```

## Basic Usage

### 1. Set up the I18nProvider

Wrap your app with the `I18nProvider` component:

```tsx
import { I18nProvider } from '@de100/i18n-solidjs';

const translations = {
  en: {
    welcome: 'Welcome',
    goodbye: 'Goodbye',
    hello: 'Hello, {name}!'
  },
  es: {
    welcome: 'Bienvenido',
    goodbye: 'Adiós',
    hello: '¡Hola, {name}!'
  },
  fr: {
    welcome: 'Bienvenue',
    goodbye: 'Au revoir',
    hello: 'Bonjour, {name}!'
  }
};

function App() {
  return (
    <I18nProvider
      locale="en"
      defaultLocale="en"
      allowedLocales={['en', 'es', 'fr']}
      fallbackLocale="en"
      translations={translations}
    >
      <MyComponent />
    </I18nProvider>
  );
}
```

### 2. Use translations in components

```tsx
import { useI18n, useTranslations } from '@de100/i18n-solidjs';

function MyComponent() {
  const { t, locale, setLocale } = useI18n();
  
  return (
    <div>
      <h1>{t()(welcome)}</h1>
      <p>{t()('hello', { name: 'John' })}</p>
      <p>Current locale: {locale()}</p>
      
      <button onClick={() => setLocale('es')}>
        Switch to Spanish
      </button>
      <button onClick={() => setLocale('fr')}>
        Switch to French
      </button>
    </div>
  );
}
```

### 3. Use the LocaleChooser component

```tsx
import { LocaleChooser } from '@de100/i18n-solidjs';

function LanguageSelector() {
  return (
    <LocaleChooser
      locales={['en', 'es', 'fr']}
      placeholder="Choose language..."
      class="language-selector"
    />
  );
}
```

## API Reference

### Components

#### `I18nProvider`

The main provider component that initializes the i18n context.

**Props:**
- `locale: string` - Current locale
- `defaultLocale: string` - Default locale for the application
- `allowedLocales: string[] | readonly string[]` - List of supported locales
- `fallbackLocale: string | string[]` - Fallback locale(s) when translation is missing
- `translations: Record<string, LanguageMessages>` - Translation messages object
- `isNew?: boolean` - Whether to create a new store instance (default: false)
- `loadTranslations?: (props: { locale: string }) => Record<string, LanguageMessages> | Promise<Record<string, LanguageMessages>>` - Optional function to load translations dynamically

#### `LocaleChooser`

A pre-built select component for language switching with automatic loading state handling.

**Props:**
- `locales: string[]` - Array of locale codes to display
- `loading?: boolean` - Whether the component is in loading state
- `class?: string` - CSS class name
- `placeholder?: string` - Placeholder text (default: "Select locale...")

### Hooks

#### `useI18n()`

Returns the complete i18n state and actions.

**Returns:**
```tsx
{
  t: () => (key: string, params?: object) => string,
  locale: () => string,
  defaultLocale: () => string,
  allowedLocales: () => string[],
  setLocale: (locale: string) => Promise<void>,
  translations: () => Record<string, LanguageMessages>,
  clearCache: () => void,
  isLoadingTranslations: () => boolean
}
```

#### `useTranslations()`

Returns only the translation function.

**Returns:** `() => (key: string, params?: object) => string`

#### `useLocale()` / `useGetLocale()`

Returns the current locale as a reactive signal.

**Returns:** `() => string`

#### `useIsLoadingTranslations()`

Returns the loading state for translations.

**Returns:** `() => boolean`

#### `setLocale()`

Returns the setLocale function (non-reactive).

**Returns:** `(locale: string) => Promise<void>`

## Advanced Usage

### Multiple I18n Instances

Create isolated i18n instances for different parts of your app:

```tsx
function AdminPanel() {
  return (
    <I18nProvider
      locale="en"
      defaultLocale="en"
      allowedLocales={['en', 'es']}
      fallbackLocale="en"
      translations={adminTranslations}
      isNew={true} // Creates a new store instance
    >
      <AdminContent />
    </I18nProvider>
  );
}
```

### Conditional Rendering Based on Locale

```tsx
import { useLocale } from '@de100/i18n-solidjs';

function ConditionalContent() {
  const locale = useLocale();
  
  return (
    <div>
      {locale() === 'ar' && (
        <div dir="rtl">Arabic content with RTL layout</div>
      )}
      {locale() !== 'ar' && (
        <div dir="ltr">Left-to-right content</div>
      )}
    </div>
  );
}
```

### Dynamic Translation Loading

```tsx
import { createSignal } from 'solid-js';
import { useI18n, I18nProvider } from '@de100/i18n-solidjs';

// Set up dynamic loading at the provider level
const loadTranslations = async ({ locale }: { locale: string }) => {
  const module = await import(`./translations/${locale}.json`);
  return { [locale]: module.default };
};

function App() {
  return (
    <I18nProvider
      locale="en"
      defaultLocale="en"
      allowedLocales={['en', 'es', 'fr']}
      fallbackLocale="en"
      translations={{}} // Start with empty translations
      loadTranslations={loadTranslations}
    >
      <DynamicTranslations />
    </I18nProvider>
  );
}

function DynamicTranslations() {
  const { isLoadingTranslations } = useI18n();
  
  return (
    <div>
      {isLoadingTranslations() && <div>Loading translations...</div>}
      <LocaleChooser
        locales={['en', 'es', 'fr']}
        loading={isLoadingTranslations()}
      />
    </div>
  );
}
```

### Loading States

```tsx
import { useI18n, useIsLoadingTranslations } from '@de100/i18n-solidjs';

function MyComponent() {
  const { t, locale, setLocale } = useI18n();
  const isLoading = useIsLoadingTranslations();
  
  return (
    <div>
      <h1>{t()('welcome')}</h1>
      {isLoading() && <div class="spinner">Loading translations...</div>}
      <button 
        onClick={() => setLocale('es')} 
        disabled={isLoading()}
      >
        Switch to Spanish
      </button>
    </div>
  );
}
```

### Custom Translation Hook

```tsx
import { createMemo } from 'solid-js';
import { useTranslations } from '@de100/i18n-solidjs';

function useT() {
  const t = useTranslations();
  
  return createMemo(() => {
    const translate = t();
    return {
      // Helper for common translations
      common: (key: string, params?: object) => translate(`common.${key}`, params),
      error: (key: string, params?: object) => translate(`errors.${key}`, params),
      nav: (key: string, params?: object) => translate(`navigation.${key}`, params),
    };
  });
}

// Usage
function MyComponent() {
  const { common, error, nav } = useT()();
  
  return (
    <div>
      <nav>{nav('home')}</nav>
      <h1>{common('welcome')}</h1>
      <p>{error('notFound')}</p>
    </div>
  );
}
```

## Performance Optimizations

### Fine-grained Reactivity

The library uses SolidJS's `createStore` for optimal performance:

```tsx
// Only re-renders when locale changes, not when translations change
function LocaleDisplay() {
  const { locale } = useI18n();
  return <div>Current: {locale()}</div>;
}

// Only re-renders when translations change, not when locale changes
function TranslationCount() {
  const { translations } = useI18n();
  return <div>Loaded: {Object.keys(translations()).length} languages</div>;
}
```

### Selective Hooks

Use specific hooks for better performance:

```tsx
// Instead of useI18n() when you only need translations
const t = useTranslations();

// Instead of useI18n() when you only need locale
const locale = useLocale();

// Instead of useI18n() when you only need loading state
const isLoading = useIsLoadingTranslations();
```

## TypeScript Support

The library is written in TypeScript and provides full type safety:

```tsx
import type { LanguageMessages } from '@de100/i18n';

interface MyTranslations extends LanguageMessages {
  welcome: string;
  goodbye: string;
  hello: string;
}

const translations: Record<string, MyTranslations> = {
  en: {
    welcome: 'Welcome',
    goodbye: 'Goodbye',
    hello: 'Hello, {name}!'
  }
};
```

## Best Practices

1. **Initialize early**: Set up the `I18nProvider` at the root of your application
2. **Use fine-grained hooks**: Use specific hooks like `useLocale()` instead of `useI18n()` when possible
3. **Handle loading states**: Always account for `isLoadingTranslations()` when using dynamic loading
4. **Namespace your translations**: Use nested objects to organize translation keys
5. **Handle missing translations**: Always provide fallback locales
6. **Lazy load translations**: Use the `loadTranslations` prop for dynamic loading in large applications

## Migration from React

If you're migrating from `@de100/i18n-reactjs`:

1. Replace `className` with `class` in JSX
2. Access reactive values with function calls: `locale()` instead of `locale`
3. Use SolidJS's `For` component instead of `map()` for lists
4. Replace `useEffect` with `createEffect` if needed
5. Handle the async nature of `setLocale()` (now returns a Promise)
6. Use `useIsLoadingTranslations()` for loading states

## Store-based Architecture

This library uses SolidJS's `createStore` which provides:

- **Fine-grained reactivity**: Only components using changed properties re-render
- **Direct property access**: `state.locale` instead of `state().locale`
- **Nested reactivity**: Automatic tracking of nested object changes
- **Better performance**: Minimal re-renders and optimal change detection
