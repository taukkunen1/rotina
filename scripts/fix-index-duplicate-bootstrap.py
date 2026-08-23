from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')

legacy_boot = '<script src="app.js?v=20260823-1"></script><script src="runtime-repair.js?v=20260823-2"></script><script src="runtime-guard-v2.js?v=20260823-3"></script><script src="date-rollover-v1.js?v=20260823-1"></script><script src="compact-timer.js?v=20260821-2"></script><script src="./autonomy.js?v=20260821-3"></script><script src="pacus-habitat.js?v=20260821-1"></script><script src="ux-2026.js?v=20260823-1"></script>'
legacy_inline = "<script>(function(){var p=new URLSearchParams(location.search);if(p.get('adultEdit')==='1'||p.get('adultPoints')==='1'){var id=p.get('adultEdit')==='1'?'editBtn':'addPointsBtn';var b=document.getElementById(id);if(b){setTimeout(function(){b.click();history.replaceState({},document.title,'index.html');},0);}}})();</script>"

start = text.find(legacy_boot)
if start != -1:
    end = text.find(legacy_inline, start)
    if end != -1:
        end += len(legacy_inline)
        if text[end:].startswith('</body></html>'):
            end += len('</body></html>')
        text = text[:start] + text[end:]

text = text.replace('</body></html>\n<script src="app.js?v=20260823-4">', '<script src="app.js?v=20260823-4">', 1)
while text.count('</body></html>') > 1:
    text = text.replace('</body></html>', '', 1)
if not text.rstrip().endswith('</body></html>'):
    text = text.rstrip() + '\n</body></html>\n'

path.write_text(text, encoding='utf-8')
print('repaired index bootstrap and document structure')
