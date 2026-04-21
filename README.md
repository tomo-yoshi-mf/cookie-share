# 🍪 Cookie Share

A Chrome extension that copies cookies from any website to your localhost with one click.

## Use Case

When you're developing locally and need to replicate a logged-in session from a staging or production site, Cookie Share lets you instantly copy all cookies to your localhost server — no manual copy-pasting from DevTools.

## Installation

1. Clone this repository
   ```bash
   git clone https://github.com/yourname/cookie-share.git
   ```
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the cloned folder

## Usage

1. Navigate to the site whose cookies you want to copy
2. Click the 🍪 icon in the Chrome toolbar
3. Click **Copy Cookies to localhost**

Cookies are copied to `http://localhost`.

## How It Works

- Uses Chrome's `cookies` API to read all cookies for the current site's origin
- Writes them to `http://localhost:<port>` with `name` and `value` only (domain, secure, and sameSite attributes are intentionally stripped to ensure compatibility with localhost)
- Existing cookies with the same name are overwritten

## Permissions

| Permission | Reason |
|------------|--------|
| `cookies` | Read and write browser cookies |
| `tabs` | Get the active tab's URL when the popup is used |
| `host_permissions: <all_urls>` | Access cookies from any site |

## Requirements

- Google Chrome (Manifest V3)
- Developer mode enabled in `chrome://extensions`

## Security Notes

### The extension itself
- **Strong permissions** — This extension has access to cookies on all sites (`<all_urls>`). Only install it from source code you can review yourself (i.e. by cloning this repository).
- **Never install from unknown sources** — Do not install `.crx` files or extensions from people you don't trust.

### Handling copied cookies
- **Session tokens are included** — Cookies often contain login session tokens. Make sure the localhost app receiving them is trustworthy.
- **Clean up when done** — Delete localhost cookies after use via DevTools → Application → Cookies.
- **Prefer staging over production** — Avoid copying cookies from production sites when staging environments are available.

### Team distribution
- **This repository is public** — No secrets are stored in the code, but be aware that your team's workflow is visible.
