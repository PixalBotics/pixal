#!/usr/bin/env python3
"""
PixalBotics Website/SEO/Logo Audit Tool
-----------------------------------------
Usage:
    python3 audit.py <url> [<url2> ...]
    python3 audit.py --file leads.csv   (expects a "website" column)

Produces a JSON report per site + a short human-readable summary that maps
each detected problem to a PixalBotics service/solution. Meant to be used as
the personalization engine behind cold email outreach.
"""

import sys
import json
import time
import csv
import io
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

try:
    from PIL import Image
except ImportError:
    Image = None

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 PixalBoticsAuditBot/1.0"
}
TIMEOUT = 12

SOLUTIONS = {
    "no_https": "We migrate your site to secure HTTPS hosting (SSL setup, fixes browser 'Not Secure' warnings).",
    "slow_load": "We rebuild for speed — image optimization, caching, modern hosting — typically cutting load time by half or more.",
    "missing_title": "We write SEO-optimized page titles for every page so Google understands and ranks your business.",
    "weak_title": "We rewrite your page title to include your service + location, which is one of the biggest local-SEO ranking factors.",
    "missing_meta_description": "We add compelling meta descriptions that improve click-through rate straight from Google search results.",
    "no_mobile_viewport": "We rebuild your site fully mobile-responsive — over 60% of your visitors are on a phone right now.",
    "no_h1": "We restructure your page headings (H1/H2) properly, which both Google and visitors use to understand your page.",
    "images_missing_alt": "We add descriptive alt-text to every image, improving accessibility and image-search SEO.",
    "no_sitemap": "We generate and submit an XML sitemap so Google can fully index every page of your site.",
    "no_robots_txt": "We configure robots.txt correctly so search engines crawl your site the right way.",
    "no_favicon": "We add a proper favicon and full branding polish across your site.",
    "low_res_logo": "We redesign your logo as a crisp, professional, high-resolution brand asset (with source files) that looks sharp everywhere.",
    "no_logo_found": "We couldn't find a clear logo on your homepage — we can design a professional logo + full brand identity from scratch.",
    "no_cta": "We add clear call-to-action buttons (Call Now / Book / WhatsApp) so visitors know exactly what to do next.",
    "outdated_design": "We give your site a modern redesign that matches 2026 design standards and builds instant trust.",
}


def grade_from_score(score):
    if score >= 90:
        return "A"
    if score >= 75:
        return "B"
    if score >= 55:
        return "C"
    if score >= 35:
        return "D"
    return "F"


def check_logo(soup, base_url):
    """Best-effort logo detection: look for <img> with 'logo' in id/class/alt/src."""
    candidates = []
    for img in soup.find_all("img"):
        attrs = " ".join([
            str(img.get("id", "")), " ".join(img.get("class", []) or []),
            str(img.get("alt", "")), str(img.get("src", ""))
        ]).lower()
        if "logo" in attrs:
            candidates.append(img)
    if not candidates:
        # fallback: first image in header/nav
        header = soup.find(["header", "nav"])
        if header:
            img = header.find("img")
            if img:
                candidates.append(img)
    if not candidates:
        return {"found": False, "issue": "no_logo_found"}

    img = candidates[0]
    src = img.get("src") or img.get("data-src")
    if not src:
        return {"found": True, "checked_dimensions": False}

    full_url = urljoin(base_url, src)
    dims = None
    if Image is not None:
        try:
            r = requests.get(full_url, headers=HEADERS, timeout=TIMEOUT)
            if r.status_code == 200:
                im = Image.open(io.BytesIO(r.content))
                dims = im.size
        except Exception:
            dims = None

    result = {"found": True, "src": full_url, "checked_dimensions": dims is not None}
    if dims:
        w, h = dims
        result["width"] = w
        result["height"] = h
        if w < 120 or h < 60:
            result["issue"] = "low_res_logo"
    return result


def audit_site(url):
    if not url.startswith("http"):
        url = "https://" + url
    parsed = urlparse(url)
    base = f"{parsed.scheme}://{parsed.netloc}"

    report = {"url": url, "issues": [], "score": 100, "checked_at": time.strftime("%Y-%m-%d %H:%M:%S")}

    # 1. Fetch + timing
    start = time.time()
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
        load_time = time.time() - start
        final_url = resp.url
    except requests.exceptions.SSLError:
        # retry over http to still gather data
        try:
            resp = requests.get(url.replace("https://", "http://"), headers=HEADERS, timeout=TIMEOUT)
            load_time = time.time() - start
            final_url = resp.url
            report["issues"].append("no_https")
            report["score"] -= 15
        except Exception as e:
            report["error"] = f"Could not reach site: {e}"
            report["score"] = 0
            return report
    except Exception as e:
        report["error"] = f"Could not reach site: {e}"
        report["score"] = 0
        return report

    report["load_time_seconds"] = round(load_time, 2)
    report["page_size_kb"] = round(len(resp.content) / 1024, 1)
    report["status_code"] = resp.status_code

    if not final_url.startswith("https://"):
        if "no_https" not in report["issues"]:
            report["issues"].append("no_https")
            report["score"] -= 15

    if load_time > 3:
        report["issues"].append("slow_load")
        report["score"] -= 10

    soup = BeautifulSoup(resp.text, "html.parser")

    # 2. Title
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else ""
    if not title:
        report["issues"].append("missing_title")
        report["score"] -= 10
    elif len(title) < 15 or len(title) > 65:
        report["issues"].append("weak_title")
        report["score"] -= 5
    report["title"] = title

    # 3. Meta description
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if not meta_desc or not meta_desc.get("content", "").strip():
        report["issues"].append("missing_meta_description")
        report["score"] -= 8

    # 4. Mobile viewport
    viewport = soup.find("meta", attrs={"name": "viewport"})
    if not viewport:
        report["issues"].append("no_mobile_viewport")
        report["score"] -= 12

    # 5. H1
    h1s = soup.find_all("h1")
    if len(h1s) == 0:
        report["issues"].append("no_h1")
        report["score"] -= 6

    # 6. Images missing alt
    imgs = soup.find_all("img")
    missing_alt = [i for i in imgs if not (i.get("alt") or "").strip()]
    if imgs and len(missing_alt) / max(len(imgs), 1) > 0.4:
        report["issues"].append("images_missing_alt")
        report["score"] -= 5

    # 7. Favicon
    icon = soup.find("link", rel=lambda v: v and "icon" in v.lower())
    if not icon:
        report["issues"].append("no_favicon")
        report["score"] -= 3

    # 8. robots.txt / sitemap.xml
    try:
        r = requests.get(urljoin(base, "/robots.txt"), headers=HEADERS, timeout=8)
        if r.status_code != 200:
            report["issues"].append("no_robots_txt")
            report["score"] -= 3
    except Exception:
        report["issues"].append("no_robots_txt")
        report["score"] -= 3

    try:
        r = requests.get(urljoin(base, "/sitemap.xml"), headers=HEADERS, timeout=8)
        if r.status_code != 200:
            report["issues"].append("no_sitemap")
            report["score"] -= 4
    except Exception:
        report["issues"].append("no_sitemap")
        report["score"] -= 4

    # 9. Logo check
    logo_info = check_logo(soup, base)
    report["logo"] = logo_info
    if logo_info.get("issue"):
        report["issues"].append(logo_info["issue"])
        report["score"] -= 8

    # 10. CTA check (very rough heuristic)
    page_text = soup.get_text(" ", strip=True).lower()
    cta_words = ["call now", "book now", "contact us", "get a quote", "whatsapp", "book an appointment", "order now", "buy now"]
    if not any(w in page_text for w in cta_words):
        report["issues"].append("no_cta")
        report["score"] -= 5

    report["score"] = max(0, min(100, report["score"]))
    report["grade"] = grade_from_score(report["score"])
    report["solutions"] = [{"issue": i, "fix": SOLUTIONS.get(i, "")} for i in report["issues"]]

    return report


def summarize(report):
    if report.get("error"):
        return f"Could not audit {report['url']}: {report['error']}"

    lines = []
    lines.append(f"Audit: {report['url']}")
    lines.append(f"Overall Score: {report['score']}/100 (Grade {report['grade']})")
    lines.append(f"Load time: {report['load_time_seconds']}s | Page size: {report['page_size_kb']}KB")
    if report["issues"]:
        lines.append("Top issues found:")
        for s in report["solutions"][:5]:
            lines.append(f"  - {s['issue'].replace('_', ' ').title()}: {s['fix']}")
    else:
        lines.append("No major issues detected — solid baseline site.")
    return "\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 audit.py <url> [<url2> ...]  OR  python3 audit.py --file leads.csv")
        sys.exit(1)

    urls = []
    if sys.argv[1] == "--file":
        with open(sys.argv[2], newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                site = row.get("website") or row.get("url")
                if site:
                    urls.append(site.strip())
    else:
        urls = sys.argv[1:]

    all_reports = []
    for u in urls:
        print(f"Auditing {u} ...", file=sys.stderr)
        rep = audit_site(u)
        all_reports.append(rep)
        print(summarize(rep))
        print("-" * 60)

    with open("/tmp/pixal/leads/audit-reports.json", "w", encoding="utf-8") as f:
        json.dump(all_reports, f, indent=2)
    print(f"\nSaved {len(all_reports)} report(s) to /tmp/pixal/leads/audit-reports.json", file=sys.stderr)


if __name__ == "__main__":
    main()
