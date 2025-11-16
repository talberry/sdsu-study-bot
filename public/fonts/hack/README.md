# Hack Font Files

This directory should contain the self-hosted Hack font files (woff2 format).

## Files needed:

1. `hack-regular.woff2` - Regular weight (400)
2. `hack-bold.woff2` - Bold weight (700)

## How to add them:

### Option 1: Download from GitHub (Recommended)

1. Go to: https://github.com/source-foundry/Hack/releases
2. Download the latest release (e.g., `Hack-v3.003-ttf.zip` or `Hack-v3.003-webfonts.zip`)
3. Extract the woff2 files:
   - Look for `Hack-Regular.woff2` → rename/copy to `hack-regular.woff2`
   - Look for `Hack-Bold.woff2` → rename/copy to `hack-bold.woff2`
4. Place them in this directory (`public/fonts/hack/`)

### Option 2: Use Google Fonts (if you want to go back)

If you prefer, we can switch back to loading Hack via Google Fonts in `app/globals.css`.

## Verification

Once the files are in place, the @font-face rules in `app/globals.css` will load them and apply Hack to all text.
