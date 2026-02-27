# kalendus

A sophisticated, responsive calendar web component built with Lit 3.x and TypeScript. Designed for Library Management Systems and other applications requiring advanced calendar functionality with support for overlapping events, multiple view modes, and extensive customization.

## ✨ Features

### 📅 Multiple View Modes

- **Month View**: Traditional monthly calendar with color-coded event indicators
- **Week View**: 7-day view with hourly time slots and pixel-perfect alignment
- **Day View**: Single-day view with detailed hourly scheduling

### 🎯 Advanced Event Handling

- **Smart Overlapping**: Transparent overlapping system preserves event visibility
- **Duration-Based Positioning**: Events positioned precisely by start time and duration
- **Multi-Day Events**: Seamless spanning across multiple days
- **All-Day Events**: Special handling for full-day activities
- **Responsive Density**: Automatic layout optimization based on event count and viewport size

### 🎨 Modern Design

- **Glassmorphism Effects**: Blur effects and transparency for modern aesthetics
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Color Dot Indicators**: Scalable month view with color-coded event dots
- **Accessibility**: Full keyboard navigation and screen reader support
- **Dark Mode Ready**: CSS custom properties for easy theming

### 🌐 Internationalization

- **Localized Dates**: Multi-language support using `@lit/localize`
- **Calendar Weeks**: ISO 8601 week numbering with localization
- **RTL Support**: Right-to-left language compatibility

## 🚀 Installation

```bash
npm install lms-calendar
```

## 📖 Usage

### Basic Usage

```html
<lms-calendar
  .heading="My Calendar"
  .activeDate=${{ day: 15, month: 3, year: 2024 }}
  .entries=${myEvents}
  .color="#1976d2"
></lms-calendar>
```

### Event Structure

```typescript
interface CalendarEntry {
    heading: string;
    content: string;
    color: string;
    isContinuation: boolean;
    date: {
        start: { day: number; month: number; year: number };
        end: { day: number; month: number; year: number };
    };
    time: {
        start: { hour: number; minute: number };
        end: { hour: number; minute: number };
    };
}
```

### Example Events

```typescript
const events = [
    {
        heading: 'Team Meeting',
        content: 'Weekly team sync',
        color: '#1976d2',
        isContinuation: false,
        date: {
            start: { day: 15, month: 3, year: 2024 },
            end: { day: 15, month: 3, year: 2024 },
        },
        time: {
            start: { hour: 9, minute: 0 },
            end: { hour: 10, minute: 30 },
        },
    },
    {
        heading: 'Project Sprint',
        content: 'Development sprint',
        color: '#2e7d32',
        isContinuation: false,
        date: {
            start: { day: 20, month: 3, year: 2024 },
            end: { day: 22, month: 3, year: 2024 },
        },
        time: {
            start: { hour: 8, minute: 0 },
            end: { hour: 17, minute: 0 },
        },
    },
];
```

## 🎛️ Properties

| Property     | Type              | Default      | Description                        |
| ------------ | ----------------- | ------------ | ---------------------------------- |
| `heading`    | `string`          | `''`         | Calendar title displayed in header |
| `activeDate` | `CalendarDate`    | Current date | Initially displayed date           |
| `entries`    | `CalendarEntry[]` | `[]`         | Array of calendar events           |
| `color`      | `string`          | `'#1976d2'`  | Primary theme color                |

## 🎨 Styling & Theming

The calendar uses CSS custom properties for comprehensive theming:

### Primary Colors

```css
lms-calendar {
    --primary-color: #1976d2;
    --background-color: #ffffff;
    --text-color: #333333;
    --separator-light: rgba(0, 0, 0, 0.1);
}
```

### Entry Styling

```css
lms-calendar {
    --entry-border-radius: 6px;
    --entry-font-size: 0.75rem;
    --entry-padding: 0.15em 0.25em;
    --entry-min-height: 1.2em;
}
```

### Layout & Spacing

```css
lms-calendar {
    --header-height: 4em;
    --day-padding: 0.5em;
    --day-gap: 1px;
    --calendar-grid-columns-day: 80px 1fr;
    --calendar-grid-columns-week: 80px repeat(7, 1fr);
}
```

### Responsive Breakpoints

```css
/* Mobile optimization */
@media (max-width: 768px) {
    lms-calendar {
        --entry-font-size: 0.7rem;
        --day-padding: 0.25em;
    }
}
```

## 🔧 Advanced Features

### Overlapping Events

The calendar intelligently handles overlapping events using a sophisticated algorithm:

- **Side-by-side positioning** for space efficiency
- **Progressive transparency** for visual depth
- **Automatic width calculation** based on overlap count
- **Z-index management** for proper stacking

### Responsive Density

Events automatically adapt their display based on:

- Available space
- Number of overlapping events
- Viewport size
- Event duration

### Performance Optimizations

- **Virtual scrolling** for large datasets
- **Efficient overlap detection** using interval partitioning
- **Throttled scroll handling** with requestAnimationFrame
- **Lazy rendering** of off-screen content

## 📱 Mobile Support

- Touch-friendly interface with proper hit targets
- Swipe gestures for navigation
- Responsive layout breakpoints
- Optimized event density for small screens

## ♿ Accessibility

- Full keyboard navigation support
- ARIA labels and descriptions
- Screen reader compatibility
- High contrast mode support
- Focus management

## 🔄 Events & Callbacks

### Navigation Events

```javascript
calendar.addEventListener('navigate', (event) => {
    console.log('Date changed:', event.detail.date);
});
```

### View Change Events

```javascript
calendar.addEventListener('view-change', (event) => {
    console.log('View changed to:', event.detail.view);
});
```

### Entry Interaction Events

```javascript
calendar.addEventListener('entry-click', (event) => {
    console.log('Entry clicked:', event.detail.entry);
});
```

## 🧪 Testing

The component includes comprehensive test coverage:

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run Storybook tests
npm run test-storybook
```

### Test Categories

- **Unit tests** for utility functions
- **Component tests** for individual components
- **Integration tests** for view switching
- **Performance tests** with heavy event loads
- **Accessibility tests** for WCAG compliance

## 📚 Storybook

Explore all features and variations in Storybook:

```bash
npm run storybook
```

### Available Stories

- **Default**: Basic calendar with sample events
- **Heavy Event Load**: Stress testing with 200+ events
- **Mobile View**: Responsive mobile experience
- **Custom Theming**: Theme variations and customization
- **Extreme Edge Cases**: Boundary condition testing

## 🏗️ Architecture

### Component Structure

```
src/
├── lms-calendar.ts          # Main calendar component
├── components/
│   ├── Header.ts           # Navigation and view controls
│   ├── Month.ts            # Monthly calendar grid
│   ├── Week.ts             # Weekly time-based view
│   ├── Day.ts              # Daily detailed view
│   ├── Entry.ts            # Individual event component
│   ├── Context.ts          # Current view context
│   └── Menu.ts             # Action menu component
├── lib/
│   ├── messages.ts         # Internationalization
│   ├── localization.ts     # Date/time formatting
│   ├── DirectionalCalendarDateCalculator.ts
│   ├── getOverlappingEntitiesIndices.ts
│   ├── getSortedGradingsByIndex.ts
│   └── partitionOverlappingIntervals.ts
└── styles/
    └── tokens.ts           # Design system tokens
```

### Key Technologies

- **Lit 3.x**: Modern web components with reactive properties
- **TypeScript**: Type-safe development with strict mode
- **Luxon**: Robust date/time manipulation
- **Remeda**: Functional programming utilities
- **@lit/localize**: Internationalization framework

### Design Patterns

- **State management** using `@lit-labs/signals`
- **Event bubbling** for component communication
- **CSS custom properties** for theming
- **Slot-based composition** for flexibility
- **Responsive design** with container queries

## 🚀 Performance

### Optimization Techniques

- Efficient overlap detection algorithms
- Virtual scrolling for large datasets
- Debounced scroll handling
- Lazy rendering of off-screen content
- CSS containment for paint optimization

### Benchmarks

- **Rendering**: Handles 500+ events smoothly
- **Memory**: Minimal memory footprint
- **Bundle size**: Optimized for production
- **Load time**: Fast initial render

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Development Setup

```bash
git clone <repository-url>
cd lms-calendar
npm install
npm run dev
```

### Code Quality

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type checking
- Lit analyzer for component validation

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [Documentation](https://docs.example.com)
- [Storybook](https://storybook.example.com)
- [NPM Package](https://npmjs.com/package/lms-calendar)
- [GitHub Repository](https://github.com/example/lms-calendar)

## 🆕 Changelog

### v2.0.0

- ✨ Added transparent overlapping system
- 🎨 Redesigned month view with color dots
- 📱 Improved mobile responsiveness
- ♿ Enhanced accessibility support
- 🌐 Added comprehensive internationalization

### v1.5.0

- 🔧 Added week view with pixel-perfect alignment
- 🎯 Improved event positioning algorithms
- 🎨 Added glassmorphism design effects
- 📊 Performance optimizations

### v1.0.0

- 🎉 Initial release
- 📅 Month and day views
- 🎨 Customizable theming
- 📱 Responsive design
