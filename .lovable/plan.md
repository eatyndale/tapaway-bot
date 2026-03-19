

## Fix: Invalid Capacitor App ID

The current `appId` (`app.lovable.06fba0130ca242c8b6694adcf9e55711`) is invalid because segments can't start with numbers.

### Change
In `capacitor.config.ts`, update `appId` from:
```
app.lovable.06fba0130ca242c8b6694adcf9e55711
```
to:
```
app.lovable.tapaway
```

This is a one-line change in `capacitor.config.ts`.

