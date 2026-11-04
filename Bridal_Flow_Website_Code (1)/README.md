# Bridal Flow — complete website, version 2

This replaces the first download. The live site checked on 4 November 2026 was missing `assets/styles.css` and `assets/site.js` (both returned HTTP 404). The text pages were present, but their styling and interactions could not load. The original reference photos have now also been replaced with the Bridal Flow images created in this conversation.

## Upload: one folder, no nested asset folders

The `public` folder contains **every file needed for deployment**, including styling, scripts, images, fonts and the enquiry handler. Nothing inside it needs to be put into another folder.

1. Unzip this download on your computer. Do not upload the ZIP itself to GitHub.
2. Sign in to Cara's GitHub account and open the repository connected to **bridalflow.pages.dev**. Check Cloudflare's Pages project settings if you are unsure which repository it uses.
3. Open the repository's existing `public` folder. Choose **Add file → Upload files**.
4. On your computer, open the new download's `public` folder, select **all the files inside it**, and drag those files into the GitHub upload area. Include the files beginning with `_`, the font files and every image, not only the HTML pages. Commit the replacements. This overwrites matching names and adds the missing files; old unused `assets` files do not affect this version.
5. If `public` does not exist in GitHub, upload the entire new `public` folder into the repository root. Avoid an extra surrounding folder named `bridal-flow`.
6. In the existing Cloudflare **Pages** project use:

| Setting | Value |
| --- | --- |
| Framework | None |
| Build command | `exit 0` |
| Output directory | `public` |
| Root directory | Blank (repository root) |
| Branch | The production branch containing the uploaded files, usually `main` |

7. Let GitHub trigger a deployment, or retry the deployment in Cloudflare after saving settings. Refresh the site after the deployment succeeds.

There is no need to recreate the Cloudflare project or change its URL. The optional `scripts`, `tests` and `package.json` files are for development; they are not needed with these settings. The old root `functions` folder is ignored because this version includes the enquiry handler in `public/_worker.js` (Cloudflare Pages advanced mode).

### Confirm the upload worked

- `https://bridalflow.pages.dev/styles.css` should show CSS text, not a page-not-found message.
- `https://bridalflow.pages.dev/site.js` should show JavaScript text.
- `https://bridalflow.pages.dev/cara-terrace.webp` should show Cara's titled terrace image.
- Open Home, The experience, Packages, About, Gallery, FAQs and Enquire; test the menu on your phone.
- `/api/status` returns `{"configured":true}` only when the three email settings below are present. It does not expose their values or prove inbox delivery.

## Connect enquiry delivery

The complete email handler is included. Email credentials are not included and must stay out of GitHub. In Cara's Cloudflare Pages production variables/secrets, set:

| Name | Value |
| --- | --- |
| RESEND_API_KEY | Cara's Resend sending API key, stored as a secret |
| CONTACT_EMAIL | Cara's chosen enquiry inbox |
| EMAIL_FROM | A sender using her verified Resend domain, e.g. `Bridal Flow <enquiries@your-domain>` |

Redeploy after adding the values. The form checks availability before enabling Send. Until connected, it clearly says enquiries are unavailable and allows the visitor to save a copy; it never claims a message was sent. After configuration, submit one real enquiry and verify receipt and Reply-To in Cara's inbox. Development tests use mocked email responses and send no live messages.

## Pages and business details

Seven main pages, plus privacy, booking information and a custom 404 page. All sessions are for up to 12 people: 30 minutes £60, 45 minutes £75, 60 minutes £100. Style, pace and difficulty are chosen with the party. Travel and equipment costs are agreed in the quote.

The privacy page still needs Cara's legal business identity, public contact email and chosen retention period. Booking/cancellation terms remain a clearly labelled draft pending her decisions. These details cannot be supplied accurately from code alone. Complete them before taking live enquiries or payments; no online payment is implemented.

## Images, colours and typography

Five original AI-generated scenes/portraits are supplied as optimised WebP files, with smaller mobile versions. Cara's terrace portrait includes “Bridal Flow” at the top. Portraits are composites made from her supplied photos. Group scenes are illustrations, not actual client-session photographs; this is explained in the gallery. Fonts and images are all local, with no Unsplash or Google Fonts network dependency. Font licences are included in `public`.

The eight brand colours are ivory #F5F0E6, oat #E4DAC8, forest #364133, espresso #281F1A, walnut #5F4031, sage #7F8E73, eucalyptus #AFBCA9 and terracotta #A85A46.

## Optional development

Node.js 22 or later. No dependencies to install.

- `npm test`: checks all local image/font/link/script references, package details and nine enquiry/routing tests.
- `npm run build`: validates the site and copies `public` into `dist`. This is optional; the recommended deployment serves `public` directly.
- Open `public/index.html` for an offline visual preview. Sending enquiries requires Cloudflare and the email settings above.
- Edit `public/styles.css` for the design, `public/site.js` for browser interactions and `public/_worker.js` for email handling.

Do not publish `.dev.vars`, keys or credentials. This download has not changed your live GitHub repository or Cloudflare deployment.

Official Cloudflare references:
- https://developers.cloudflare.com/pages/get-started/git-integration/
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/functions/advanced-mode/

## Verification of this version

All local page, image, responsive image, CSS, JavaScript and font references passed. Package prices/durations agree. Nine server/routing tests passed with mocked email delivery. Desktop and mobile layouts, mobile navigation, package prefilling and the disconnected-form message were checked in a browser. Live deployment and real inbox delivery must be verified after your upload.
