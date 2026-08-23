from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')

first_styles = '<link rel="stylesheet" href="styles.css?v=20260823-1">'
second_styles = '<link rel="stylesheet" href="styles.css?v=20260823-2">'
first_storage = '<script src="storage.js?v=20260823-1"></script>'
second_storage = '<script src="storage.js?v=20260823-3"></script><script src="data-model.js?v=20260823-1"></script>'

if first_styles in text and second_styles in text:
    start = text.index(first_styles)
    end = text.index(second_styles)
    text = text[:start] + text[end:]

if first_storage in text and second_storage in text:
    start = text.index(first_storage)
    end = text.index(second_storage)
    text = text[:start] + text[end:]

legacy_boot = '<script src="app.js?v=20260823-1"></script><script src="runtime-repair.js?v=20260823-2"></script><script src="runtime-guard-v2.js?v=20260823-3"></script><script src="date-rollover-v1.js?v=20260823-1"></script><script src="compact-timer.js?v=20260821-2"></script><script src="./autonomy.js?v=20260821-3"></script><script src="pacus-habitat.js?v=20260821-1"></script><script src="ux-2026.js?v=20260823-1"></script>'
legacy_inline = '<script>(function(){var p=new URLSearchParams(location.search);if(p.get(\'adultEdit\')===\'1\'||p.get(\'adultPoints\')===\'1\'){var id=p.get(\'adultEdit\')===\'1\'?\'editBtn\':\'addPointsBtn\';var b=document.getElementById(id);if(b){setTimeout(function(){b.click();history.replaceState({},document.title,\'index.html\');},0);}}})();</script></body></html>'

first = text.find(legacy_boot)
second = text.rfind(legacy_boot)
if first != -1 and second != -1 and first != second:
    first_end = first + len(legacy_boot)
    inline_end = text.find(legacy_inline, first_end)
    if inline_end != -1:
        text = text[:first] + text[inline_end + len(legacy_inline):]

# Remove a stray closing html before the actual bootstrap scripts, if present.
text = text.replace('</body></html>\n<script src="app.js?v=20260823-4">', '<script src="app.js?v=20260823-4">', 1)

path.write_text(text, encoding='utf-8')
print('fixed index duplicate bootstrap')
