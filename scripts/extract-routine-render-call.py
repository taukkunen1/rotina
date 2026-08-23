from pathlib import Path

path = Path('app.js')
source = path.read_text(encoding='utf-8')

if 'PacusRoutineRenderer.renderPeriods({' in source:
    print('Routine renderer call already installed.')
    raise SystemExit(0)

needle = 'Object.entries(periodsObj).forEach'
start = source.find(needle)
if start < 0:
    raise SystemExit('Legacy period rendering block not found.')

arrow = source.find('=>', start)
brace = source.find('{', arrow)
if arrow < 0 or brace < 0:
    raise SystemExit('Could not parse legacy period rendering callback.')

depth = 0
end_brace = None
for i in range(brace, len(source)):
    ch = source[i]
    if ch == '{':
        depth += 1
    elif ch == '}':
        depth -= 1
        if depth == 0:
            end_brace = i
            break

if end_brace is None:
    raise SystemExit('Unbalanced legacy rendering callback.')

end = end_brace + 1
while end < len(source) and source[end] in ' \t\r\n':
    end += 1
if source.startswith(');', end):
    end += 2
elif source.startswith(')', end):
    end += 1
else:
    raise SystemExit('Legacy rendering callback terminator not found.')

replacement = '''PacusRoutineRenderer.renderPeriods({
    periodsEl,
    periodsObj,
    checkedToday: state.checkedToday,
    getEffectiveTaskOrder,
    isCountedDone,
    isLightDay: isLightDay(todayISO()),
    taskIcon,
    taskHelpPoints,
    taskNotDonePenalty
  });'''

path.write_text(source[:start] + replacement + source[end:], encoding='utf-8')
print('Replaced legacy period rendering with PacusRoutineRenderer.renderPeriods().')
