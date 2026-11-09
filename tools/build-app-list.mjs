import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = "https://monk-saint.github.io/pp";
const studio = "https://sushilacreatives.in/";

const catalog = {
  "block-fit-puzzle.html": ["Block Fit Puzzle", "com.blockfit.puzzlegame", "android"],
  "breath-cue.html": ["Breathing Guide: Calm & Focus", "com.breathguide.calmfocusapp", "android"],
  "call-guard.html": ["Blacklist Calls - Custom Block", "com.blacklistcalls.customblock", "android"],
  "claimready.html": ["ClaimReady: Returns & Warranty", "app.redbanana.claimready", "android"],
  "date-alarm.html": ["Future Alarm", "app.futurealarm.datetime", "android"],
  "flashlight.html": ["Flashlight", "com.flashlight.screenlight.sos", "android"],
  "image-to-pdf.html": ["Image to PDF – Scanner & More", "com.pdfscanner.imagetopdf", "android"],
  "image-toolkit.html": ["Image Resizer & Compressor", "com.imageresizer.compressor", "android"],
  "location-alarm.html": ["GPS Location Alarm", "com.gps.location.alarm", "android"],
  "mockdrop.html": ["Mock GPS : Change Location", "app.autoapp.mockgps", "android"],
  "mofi.html": ["MoFi: Mobile & WiFi Speed Test", "app.redbanana.mofispeedtest", "android"],
  "privacy-screenshot.html": ["SafeShare: Blur & Hide Info", "app.privacyscreenshot.editor", "android"],
  "qr-scanner.html": ["Simple QR: Scan & Create", "com.simpleqr.scanandcreate", "android"],
  "tile-merge.html": ["Merge Tiles", "app.autoapp.tilemerge", "android"],
  "warranty-reminder.html": ["Waro: Warranty & Service Track", "app.redbanana.warrantyservicetracker", "android"],
  "pinglater.html": ["PingLater: Share Reminder", "app.redbanana.pinglater", "android"],
  "file-info.html": ["File Info", "mjddfbocnhlabkjnggpcpaecchngebgk", "extension"],
  "formatkit.html": ["FormatKit", "", "extension"],
  "utc-clock-pro.html": ["UTC Clock Pro", "", "extension"],
};

function esc(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
}

function storeUrl(kind, id) {
  if (!id) return "";
  if (kind === "android") return `https://play.google.com/store/apps/details?id=${id}`;
  return `https://chromewebstore.google.com/detail/${id}`;
}

function metaBlock(name, kind, id) {
  const store = storeUrl(kind, id);
  return [
    `    <meta name="app-name" content="${esc(name)}" />`,
    `    <meta name="app-kind" content="${kind}" />`,
    `    <meta name="app-package" content="${esc(id)}" />`,
    `    <meta name="app-store" content="${esc(store)}" />`,
  ].join("\n");
}

function linksBlock(name, kind, id) {
  const store = storeUrl(kind, id);
  const storeLabel = kind === "android" ? "Google Play" : "Chrome Web Store";
  const storeLink = store
    ? `<a href="${esc(store)}">${storeLabel}</a>`
    : "";
  return [
    "      <h2>App links</h2>",
    "      <p>",
    storeLink,
    storeLink ? "        ·" : "",
    `        <a href="${studio}">Sushila Creatives</a>`,
    "      </p>",
  ].filter(Boolean).join("\n");
}

for (const [file, [name, id, kind]] of Object.entries(catalog)) {
  const path = join(root, file);
  let html = readFileSync(path, "utf8");
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(name)} — Privacy Policy</title>`);
  html = html.replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${esc(name)} — Privacy Policy</h1>`);
  if (kind === "android") {
    html = html.replace(/<p class="meta">Package:[\s\S]*?<\/p>/, `<p class="meta">Package: ${esc(id)}</p>`);
  }
  if (!html.includes('name="app-name"')) {
    html = html.replace(
      '<meta name="viewport" content="width=device-width, initial-scale=1" />',
      `<meta name="viewport" content="width=device-width, initial-scale=1" />\n${metaBlock(name, kind, id)}`,
    );
  } else {
    html = html.replace(/<meta name="app-name" content="[^"]*" \/>/, `<meta name="app-name" content="${esc(name)}" />`);
    html = html.replace(/<meta name="app-kind" content="[^"]*" \/>/, `<meta name="app-kind" content="${kind}" />`);
    html = html.replace(/<meta name="app-package" content="[^"]*" \/>/, `<meta name="app-package" content="${esc(id)}" />`);
    html = html.replace(/<meta name="app-store" content="[^"]*" \/>/, `<meta name="app-store" content="${esc(storeUrl(kind, id))}" />`);
  }
  if (file === "location-alarm.html") {
    html = html.replace(/(?<!GPS )Location Alarm rings/, "GPS Location Alarm rings");
    html = html.replace(/(?<!GPS )Location Alarm does not/, "GPS Location Alarm does not");
  }
  if (!html.includes("<h2>App links</h2>")) {
    html = html.replace("      <h2>Contact</h2>", `${linksBlock(name, kind, id)}\n      <h2>Contact</h2>`);
  }
  writeFileSync(path, html);
}

function readMeta(html, name) {
  const match = html.match(new RegExp(`<meta name="${name}" content="([^"]*)" \\/>`));
  return match ? match[1].replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&lt;", "<") : "";
}

const apps = readdirSync(root)
  .filter((file) => file.endsWith(".html") && file !== "index.html")
  .map((file) => {
    const html = readFileSync(join(root, file), "utf8");
    const name = readMeta(html, "app-name");
    if (!name) return null;
    const kind = readMeta(html, "app-kind") || "android";
    const id = readMeta(html, "app-package");
    const store = readMeta(html, "app-store");
    return { name, kind, package: id, store, policy: `${site}/${file}`, file };
  })
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(
  join(root, "apps.js"),
  `window.SUSHILA_APPS = ${JSON.stringify(apps, null, 2)};\n`,
);

const indexPath = join(root, "index.html");
let index = readFileSync(indexPath, "utf8");
index = index.replace(
  /<h2>Android apps<\/h2>[\s\S]*?<h2>Contact<\/h2>/,
  `<h2>Android apps</h2>
      <ul id="android-apps" class="list"></ul>
      <h2>Chrome extensions</h2>
      <ul id="extension-apps" class="list"></ul>
      <script src="apps.js"></script>
      <script>
        const apps = window.SUSHILA_APPS || [];
        function fill(id, kind) {
          const list = document.getElementById(id);
          for (const app of apps.filter((item) => item.kind === kind)) {
            const item = document.createElement("li");
            const link = document.createElement("a");
            link.href = app.file;
            link.textContent = app.name;
            const meta = document.createElement("p");
            meta.className = "meta";
            meta.textContent = app.kind === "extension" ? "Chrome extension" : app.package;
            item.append(link, meta);
            list.append(item);
          }
        }
        fill("android-apps", "android");
        fill("extension-apps", "extension");
      </script>

      <h2>Contact</h2>`,
);
writeFileSync(indexPath, index);
console.log(`listed ${apps.length} apps`);
