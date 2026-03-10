

## Fix: SetupPhase & TappingGuide Mobile Overflow

The SetupPhase and TappingGuide components render as full `Card` elements with large images and generous padding inside the chat scroll area. On mobile, they overflow because:

1. **SetupPhase**: Large image container with `p-6`, statement text `text-lg`, timer `w-14 h-14`, and button row that wraps awkwardly
2. **TappingGuide**: GIF container has `min-h-[250px]` on mobile forcing height, point info section has `text-xl` heading, statement box with `text-lg`, and `p-4 sm:p-8` padding

### Changes

**1. `src/components/anxiety-bot/SetupPhase.tsx`**

- Remove outer `Card` wrapper — render as a plain `div` so it flows naturally in the scroll container
- Image container: `p-6` → `p-2 sm:p-6`, constrain image with `max-w-[200px] sm:max-w-sm mx-auto`
- Statement text: `text-lg` → `text-sm sm:text-lg`, padding `p-4` → `p-3 sm:p-4`
- Timer circle: `w-14 h-14` → `w-10 h-10 sm:w-14 sm:h-14`, text `text-2xl` → `text-lg sm:text-2xl`
- Header: `text-xl` → `text-base sm:text-xl`
- Controls: `space-x-3` → `gap-2 flex-wrap`, smaller buttons on mobile (`size="sm"` on mobile via responsive classes)
- Statement indicator overlay: `top-4 right-4` → `top-2 right-2 sm:top-4 sm:right-4`

**2. `src/components/anxiety-bot/TappingGuide.tsx`**

- Remove outer `Card` wrapper — render as a plain `div`
- GIF container: remove `min-h-[250px]`, use `min-h-[180px] sm:min-h-[300px]`, reduce padding `p-4 sm:p-8` → `p-2 sm:p-6`
- Image: `max-w-sm sm:max-w-md` → `max-w-[200px] sm:max-w-sm`
- Point name: `text-xl` → `text-base sm:text-xl`
- Statement box: `p-4` → `p-2 sm:p-4`, text `text-lg` → `text-sm sm:text-lg`
- Timer: `w-12 h-12` → `w-10 h-10 sm:w-12 sm:h-12`
- Controls already have `flex-wrap gap-2` (good)
- Progress indicator overlay: same `top-2 right-2` fix

Both components will render more compactly on mobile, fitting within the chat scroll area without overflow.

