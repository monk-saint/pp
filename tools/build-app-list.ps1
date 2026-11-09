$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path (Join-Path $root "index.html"))) { $root = $PSScriptRoot }
$site = "https://monk-saint.github.io/pp"
$studio = "https://sushilacreatives.in/"
$catalog = [ordered]@{
  "block-fit-puzzle.html" = @("Block Fit Puzzle", "com.blockfit.puzzlegame", "android")
  "breath-cue.html" = @("Breathing Guide: Calm & Focus", "com.breathguide.calmfocusapp", "android")
  "call-guard.html" = @("Blacklist Calls - Custom Block", "com.blacklistcalls.customblock", "android")
  "claimready.html" = @("ClaimReady: Returns & Warranty", "app.redbanana.claimready", "android")
  "date-alarm.html" = @("Future Alarm", "app.futurealarm.datetime", "android")
  "flashlight.html" = @("Flashlight", "com.flashlight.screenlight.sos", "android")
  "image-to-pdf.html" = @("Image to PDF – Scanner & More", "com.pdfscanner.imagetopdf", "android")
  "image-toolkit.html" = @("Image Resizer & Compressor", "com.imageresizer.compressor", "android")
  "location-alarm.html" = @("GPS Location Alarm", "com.gps.location.alarm", "android")
  "mockdrop.html" = @("Mock GPS : Change Location", "app.autoapp.mockgps", "android")
  "mofi.html" = @("MoFi: Mobile & WiFi Speed Test", "app.redbanana.mofispeedtest", "android")
  "privacy-screenshot.html" = @("SafeShare: Blur & Hide Info", "app.privacyscreenshot.editor", "android")
  "qr-scanner.html" = @("Simple QR: Scan & Create", "com.simpleqr.scanandcreate", "android")
  "tile-merge.html" = @("Merge Tiles", "app.autoapp.tilemerge", "android")
  "warranty-reminder.html" = @("Waro: Warranty & Service Track", "app.redbanana.warrantyservicetracker", "android")
  "pinglater.html" = @("PingLater: Share Reminder", "app.redbanana.pinglater", "android")
  "file-info.html" = @("File Info", "mjddfbocnhlabkjnggpcpaecchngebgk", "extension")
  "formatkit.html" = @("FormatKit", "", "extension")
  "utc-clock-pro.html" = @("UTC Clock Pro", "", "extension")
}
function Esc([string]$value) {
  return ($value -replace "&", "&amp;" -replace "<", "&lt;" -replace '"', "&quot;")
}
function StoreUrl([string]$kind, [string]$id) {
  if (-not $id) { return "" }
  if ($kind -eq "android") { return "https://play.google.com/store/apps/details?id=$id" }
  return "https://chromewebstore.google.com/detail/$id"
}
$utf8 = New-Object System.Text.UTF8Encoding $false
foreach ($file in $catalog.Keys) {
  $name, $id, $kind = $catalog[$file]
  $path = Join-Path $root $file
  $html = [IO.File]::ReadAllText($path)
  $safe = Esc $name
  $html = [regex]::Replace($html, "<title>[\s\S]*?</title>", "<title>$safe — Privacy Policy</title>")
  $html = [regex]::Replace($html, "<h1>[\s\S]*?</h1>", "<h1>$safe — Privacy Policy</h1>")
  if ($kind -eq "android") {
    $html = [regex]::Replace($html, '<p class="meta">Package:[\s\S]*?</p>', "<p class=`"meta`">Package: $(Esc $id)</p>")
  }
  $store = StoreUrl $kind $id
  $meta = @"
    <meta name="app-name" content="$safe" />
    <meta name="app-kind" content="$kind" />
    <meta name="app-package" content="$(Esc $id)" />
    <meta name="app-store" content="$(Esc $store)" />
"@.TrimEnd()
  if ($html -notmatch 'name="app-name"') {
    $html = $html.Replace('<meta name="viewport" content="width=device-width, initial-scale=1" />', "<meta name=`"viewport`" content=`"width=device-width, initial-scale=1`" />`r`n$meta")
  }
  if ($file -eq "location-alarm.html") {
    $html = [regex]::Replace($html, "(?<!GPS )Location Alarm rings", "GPS Location Alarm rings")
    $html = [regex]::Replace($html, "(?<!GPS )Location Alarm does not", "GPS Location Alarm does not")
  }
  if ($html -notmatch "<h2>App links</h2>") {
    $storeLabel = if ($kind -eq "android") { "Google Play" } else { "Chrome Web Store" }
    $storeLink = if ($store) { "<a href=`"$(Esc $store)`">$storeLabel</a>`r`n        ·" } else { "" }
    $block = @"
      <h2>App links</h2>
      <p>
        $storeLink
        <a href="$studio">Sushila Creatives</a>
      </p>
"@
    $html = $html.Replace("      <h2>Contact</h2>", "$block      <h2>Contact</h2>")
  }
  [IO.File]::WriteAllText($path, $html, $utf8)
}
function ReadMeta([string]$html, [string]$name) {
  $m = [regex]::Match($html, "<meta name=`"$name`" content=`"([^`"]*)`" />")
  if (-not $m.Success) { return "" }
  return ($m.Groups[1].Value -replace "&amp;", "&" -replace "&quot;", '"' -replace "&lt;", "<")
}
$apps = @()
Get-ChildItem $root -Filter *.html | Where-Object { $_.Name -ne "index.html" } | ForEach-Object {
  $html = [IO.File]::ReadAllText($_.FullName)
  $name = ReadMeta $html "app-name"
  if (-not $name) { return }
  $kind = ReadMeta $html "app-kind"
  if (-not $kind) { $kind = "android" }
  $id = ReadMeta $html "app-package"
  $store = ReadMeta $html "app-store"
  $apps += [pscustomobject]@{ name = $name; kind = $kind; package = $id; store = $store; policy = "$site/$($_.Name)"; file = $_.Name }
}
$apps = $apps | Sort-Object name
$json = $apps | ConvertTo-Json -Depth 4
if ($apps.Count -eq 1) { $json = "[$json]" }
[IO.File]::WriteAllText((Join-Path $root "apps.js"), "window.SUSHILA_APPS = $json;`n", $utf8)
$indexPath = Join-Path $root "index.html"
$index = [IO.File]::ReadAllText($indexPath)
$replacement = @'
      <h2>Android apps</h2>
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

      <h2>Contact</h2>
'@
$index2 = [regex]::Replace($index, '<h2>Android apps</h2>[\s\S]*?<h2>Contact</h2>', $replacement.TrimEnd())
[IO.File]::WriteAllText($indexPath, $index2, $utf8)
Write-Output "listed $($apps.Count) apps from $root"
