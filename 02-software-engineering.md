# Частина 2. Промт-інжиніринг для Software Engineering

6 технік на реальних задачах: написання функції, рецензування коду, commit-меседжі, пошук вади, конвертація файлу налаштувань, перевірка факту про API. **Усі відповіді нижче — справжній вивід Claude Haiku 4.5.**

---

## SE1. Чітка специфікація вимог

**Принцип:** для коду неоднозначність = модель додумує. Точна сигнатура, правила, edge-cases і формат виводу дають передбачуваний результат замість «загального рішення на всі випадки».

### ❌ Слабкий промпт
```
Write a function to validate emails.
```

**Реальний вивід Haiku (скорочено, повний — 2949 символів):**
> ## Simple Regex Approach
> ```python
> def validate_email(email):
>     pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
>     return re.match(pattern, email) is not None
> ```
> ## More Robust Approach ... (велика RFC-5322 регулярка)
> ## With DNS/SMTP Verification (Advanced) ... (socket.getaddrinfo)
> ## Usage Examples ... ## Key Considerations ... consider `email-validator` package...

Модель видала **три різні підходи + DNS-перевірку + поради про бібліотеки** — 2949 символів. Ти не знаєш, який брати; усі — з регуляркою.

### ✅ Сильний промпт
```
Write a Python function is_valid_email(s) that returns a bool.
Rules: return True only if s is a string with exactly one '@', a non-empty local
part, a domain that contains at least one dot, no whitespace, and a final segment
(TLD) of length at least 2.
Do not use a large regex; use simple string operations.
Return False for None or non-string input.
Include a one-line docstring and three example calls in comments.
Output only the code.
```

**Реальний вивід Haiku (дослівно):**
```python
def is_valid_email(s):
    """Check if s is a valid email address."""
    if not isinstance(s, str) or not s:
        return False
    if ' ' in s or s.count('@') != 1:
        return False
    local, domain = s.split('@')
    if not local or not domain:
        return False
    if '.' not in domain:
        return False
    parts = domain.split('.')
    if not parts[-1] or len(parts[-1]) < 2:
        return False
    return True

# is_valid_email("user@example.com")  # True
# is_valid_email("invalid.email@")    # False
# is_valid_email("no-at-sign.com")    # False
```

### Що ми бачимо
615 проти 2949 символів. Сильний промпт дав **рівно ту функцію**: правильна сигнатура, прості рядкові операції (як вимагали — без регулярки), перевірка `None`/типу, docstring, 3 приклади, нічого зайвого. Кожне правило в промпті → відповідний `if` у коді.

> **Правило SE1.** Специфікуй: сигнатуру, правила, заборони («do not use a large regex»), обробку помилок, формат виводу («output only the code»). Заборона тут спрацювала — на відміну від «no markdown» у DS4 — бо стосувалась *змісту коду*, а не обгортки виводу.

---

## SE2. XML-теги для розділення інструкції та коду

**Принцип:** коли в промпті є і код, і інструкція, модель може плутати, де що. XML-теги (`<task>`, `<code>`) дають чіткі межі — це рідна для Claude структура.

### ❌ Слабкий промпт (усе злите докупи)
```
Review this code and find issues def transfer(a,b,amt): a.bal-=amt b.bal+=amt return True also fix it
```

**Реальний вивід Haiku (скорочено):**
> **Issues found:** 1. Syntax Error - Missing colons... 2. Logic Error - No validation (недостатність балансу)... 3. No error handling... 4. Poor naming... 5. No return value on failure...
> **Fixed version:** `def transfer(from_account, to_account, amount): if ... return False ...`

Непогано, але модель зачепилась за «missing colons» (артефакт злитого однорядкового тексту) і **перейменувала параметри**, хоча її не просили.

### ✅ Сильний промпт (XML-структура)
```
<task>
Review the function inside <code>. List concrete issues in priority order
(correctness, validation, concurrency), then provide a corrected version.
Check specifically: missing balance check, no input validation, no error handling.
</task>

<code>
def transfer(a, b, amt):
    a.bal -= amt
    b.bal += amt
    return True
</code>
```

**Реальний вивід Haiku (скорочено, повний — 1949 символів):**
> # Issues in Priority Order
> ## 1. Critical: No Balance Validation (Correctness) — allows `a.bal` to go negative...
> ## 2. Critical: No Input Validation — no check `amt` positive, **no check that a and b are different accounts (self-transfer bug)**...
> ## 3. High: No Error Handling (Robustness)...
> ## 4. High: Race Condition (Concurrency) — Reading and writing `a.bal`/`b.bal` are not atomic...
> # Corrected Version ... (з docstring, ValueError, перевіркою `a is b`, нотаткою про lock)

### Що ми бачимо
Чіткі межі `<code>` прибрали шум «missing colons» і дали **пріоритезовану рецензію за категоріями, які ми задали** (correctness/validation/concurrency). Модель знайшла те, що слабкий варіант пропустив: **self-transfer bug** і **race condition** — саме тому, що ми попросили подумати про concurrency. Виправлений код — з винятками й нотаткою про блокування.

> **Правило SE2.** Розділяй частини промпта тегами: `<task>`, `<code>`, `<data>`, `<example>`. Це усуває плутанину «інструкція vs контент» і дозволяє точно скерувати фокус рецензії (тут — додати вісь concurrency).

---

## SE3. Few-shot для строгого формату (Conventional Commits)

**Принцип:** той самий механізм, що в DS2, але для коду. Хочеш конкретний формат commit-меседжа — покажи приклади, а не описуй.

### ❌ Слабкий промпт — 3 прогони, 3 РІЗНІ формати
```
Write a commit message for: added retry logic to the API client and fixed a
typo in the README.
```

- **Прогін 1:** `Add retry logic to API client and fix README typo` + bullet-list тіло + (!) рядок `Co-Authored-By: Claude Opus 4.8 ...` ⚠️
- **Прогін 2:** довгий варіант із тілом-абзацом + альтернатива `feat: ...; fix: ...` + порада «choose whichever fits».
- **Прогін 3:** `feat: add retry logic to API client` з bullet-тілом + друга, коротша альтернатива + порада обрати.

Формат стрибає: то заголовок-реченням, то `feat:`, то дві альтернативи на вибір. Автоматизувати неможливо.

> ⚠️ Рядок `Co-Authored-By` у прогоні 1 — це **артефакт гарнесу** (інструкція про git-коміти з системного промпту агента просочилась у модель), а не «вигадка Haiku». Чесно лишаю його тут як ілюстрацію застереження з [методології](03-metodologiya-ta-syri-rezultaty.md#застереження). Суть (балакучість і нестабільність формату) це не змінює.

### ✅ Сильний промпт (few-shot) — 3 прогони, формат ЗАМКНЕНО
```
Write ONE commit subject line in Conventional Commits format:
type(scope): description. Output only the subject line.

Examples:
- added pagination to users endpoint -> feat(api): add pagination to users endpoint
- fixed crash on empty input -> fix(parser): handle empty input safely
- updated install docs -> docs(readme): update installation steps

Now: added retry logic to the API client and fixed a typo in the README ->
```

**Реальний вивід Haiku (3 прогони):**
```
feat(api): add retry logic to API client
```
```
feat(api): add retry logic to client and fix typo in README
```
```
feat(api): add retry logic to client
```

### Що ми бачимо
Виміряно: слабкий — **3 унікальні** багаторядкові відповіді; сильний — **усі 3 однорядкові** у форматі `type(scope): ...`. Формулювання трохи варіюється (нормально), але **структура замкнена намертво** — це й можна класти в git-хук.

> **Правило SE3.** Для будь-якого строгого текстового формату (commit, журнал, changelog, docstring-стиль) — 3 приклади «вхід → вихід» надійніші за опис. «Output only the subject line» прибирає балакучі альтернативи.

---

## SE4. Пошук вади через Chain-of-Thought

**Принцип:** для дебагу проси модель *простежити виконання крок за кроком*, перш ніж називати ваду. Це особливо допомагає з вадами стану й часу, які не видно з одного рядка.

### ❌ Слабкий промпт
```
Does this function have a bug?
def add_item(item, items=[]): items.append(item); return items
```

**Реальний вивід Haiku (скорочено):**
> Yes, this function has a classic Python bug called the **mutable default argument problem**. The default value `items=[]` is created once when the function is defined... `add_item(1)` → `[1]`, `add_item(2)` → `[1, 2]` — unexpected!... **The fix** is to use `None` as the default...

Haiku і так знайшов ваду (це класика). Відповідь хороша.

### ✅ Сильний промпт (CoT + структура відповіді)
```
Analyze this Python function for bugs.
def add_item(item, items=[]):
    items.append(item)
    return items
Reason step by step about what happens when it is called multiple times without
the items argument. Then state the single most important bug, why it happens,
and the one-line fix.
```

**Реальний вивід Haiku (скорочено, повний — 1570 символів):**
> **What happens when called multiple times:**
> 1. First call: `add_item("apple")` → default `items=[]` ... Returns `["apple"]`
> 2. Second call: `add_item("banana")` → You'd expect a fresh list, but **Python evaluates default arguments once at function definition time**... Returns `["apple", "banana"]`
> 3. Third call: ... Returns `["apple", "banana", "cherry"]`
> **The single most important bug:** mutable default argument...
> **Why it happens:** Python evaluates default parameter values once when the function is defined...
> **The one-line fix:** `items=None` then `if items is None: items = []`

### Що ми бачимо
Обидва знайшли ваду — але CoT-версія **показала трасування трьох викликів** і структурувала відповідь рівно як просили (вада → причина → однорядкове виправлення). Для навчального коду, рецензії чи тікета це самодостатнє пояснення, а не просто вердикт. Тут CoT збільшив якість *подачі*, а не сам факт знахідки.

> **Правило SE4.** Для дебагу: «reason step by step about what happens, then state the bug, why, and the fix». Задавай і *процес* (трасування), і *структуру фіналу*. На складніших вадах (race, off-by-one у циклі) саме трасування часто й рятує.

---

## SE5. Примус формату виводу

**Принцип:** найнадійніший спосіб прибрати «преамбулу» й markdown-обгортки — задати **перший символ виводу** (позитивний якір). Прямий контраст до DS4.

### ❌ Слабкий промпт
```
Convert this config to JSON: host=localhost port=5432 ssl=true
```

**Реальний вивід Haiku:**
````
```json
{
  "host": "localhost",
  "port": 5432,
  "ssl": true
}
```

This JSON object converts your configuration key-value pairs into a structured
format where: - `host` is a string... - `port` is converted to a number...
````

Правильний JSON, але **в markdown-блоці + з поясненням** після нього. Якщо це йде в `JSON.parse()` — впаде.

### ✅ Сильний промпт (якір першого символу)
```
Convert this config into a single JSON object. Output ONLY raw JSON starting with
the character '{' - no explanation and no markdown code fences. Use an integer
for port and a boolean for ssl.
Config: host=localhost port=5432 ssl=true
```

**Реальний вивід Haiku (дослівно, повністю):**
```
{"host": "localhost", "port": 5432, "ssl": true}
```

### Що ми бачимо
48 символів проти 315. **Голий JSON**, без блоку, без коментаря — напряму в парсер. Ключова деталь: тут спрацювало те, що в [DS4](01-data-science.md#ds4-структурований-json-вивід-зі-схемою) **не** спрацювало. Різниця формулювань:

- DS4: *«Output ONLY valid JSON, no markdown»* → Haiku **додав** ` ```json `.
- SE5: *«starting with the character `{`, no markdown code fences»* → Haiku дав голий `{...}`.

> **Правило SE5.** Якоруй **перший символ** виводу («start with `{`»), а не лише забороняй обгортки. У реальному API ще надійніше — **prefill**: підстав `{` як початок відповіді асистента, і модель фізично не зможе додати преамбулу.

---

## SE6. Контроль галюцинацій («дозвіл сказати не знаю»)

**Принцип:** модель схильна вигадувати правдоподібне замість «не знаю». Явний дозвіл сказати «цього не існує» + вимога не вигадувати знижує галюцинації. **Тут — несподіваний і чесний результат.**

Пастка: `pandas.DataFrame.flatten()` **не існує** (flatten є в numpy, не в DataFrame).

### ❌ Слабкий промпт
```
What does the pandas.DataFrame.flatten() method do? Explain its parameters and
return value.
```

**Реальний вивід Haiku (скорочено):**
> I need to clarify an important point: **pandas.DataFrame does not have a `.flatten()` method**.
> You might be thinking of: NumPy's `.flatten()`... `df.values.flatten()`... `.values.ravel()`... `.stack()`... `.melt()`...

Haiku **сам спіймав пастку** навіть без захисної інструкції — і запропонував правильні альтернативи.

### ✅ Сильний промпт (дозвіл сказати «не знаю»)
```
What does the pandas.DataFrame.flatten() method do?
If this method does not actually exist in pandas, say so explicitly and do not
invent its behavior. Only describe it if you are confident it exists in the
pandas API.
```

**Реальний вивід Haiku (скорочено):**
> The `pandas.DataFrame.flatten()` method does not exist in pandas.
> DataFrames in pandas do not have a `flatten()` method. You may be thinking of: `numpy.ndarray.flatten()`... `DataFrame.values.flatten()`... `.to_numpy().flatten()`... `.stack()`...

### Що ми бачимо (чесний висновок!)
**Обидва** варіанти не галюцинували — Haiku 4.5 і так знає, що методу немає. Захисна інструкція зробила відповідь трохи прямішою й коротшою (826 проти 1153 символів), але **не врятувала від галюцинації, якої й не було**.

Чесний урок: **сучасні моделі, навіть мала Haiku 4.5, стійкіші до простих фактологічних пасток, ніж припускають старі гайди.** Техніка не марна. Її реальна цінність проявляється на:
- *по-справжньому* рідкісних/нішевих API та версіях,
- неоднозначних або суперечливих фактах,
- задачах із наданим контекстом, де треба відповідати **тільки** з нього («if the answer is not in the document, say I don't know»).

> **Правило SE6.** Завжди давай моделі «вихід»: «if X does not exist / is not in the provided context, say so explicitly; do not invent». Не покладайся на те, що пастка «очевидна» — перевіряй на *своїх* рідкісних випадках, бо саме там техніка вмикається.

---

## Вправи (Software Engineering)

1. **SE1-вправа.** Перепиши «write a rate limiter» за правилом SE1 для Python: яку сигнатуру, які 3 правила поведінки і яку заборону ти задаси?
2. **SE2-вправа.** У тебе промпт «here is my SQL fix the bug SELECT ...». Перепиши його з XML-тегами і додай вісь, на якій модель має зосередитись (напр. продуктивність).
3. **SE5-вправа.** Тобі треба, щоб модель повернула **лише** bash-команду без пояснень. Сформулюй якір першого символу. Чим це краще за «don't explain»?
4. **SE6-вправа.** Ти даєш моделі документацію й питаєш про функцію, якої в ній немає. Який рядок додаси в промпт, щоб уникнути вигаданої відповіді?

➡️ Відповіді — у [04-top-sajty-i-shpargalka.md](04-top-sajty-i-shpargalka.md#відповіді-до-вправ).
