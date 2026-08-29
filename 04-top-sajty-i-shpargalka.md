# Частина 4. Топ-3 сайти, шпаргалка та відповіді

---

## 🏆 Топ-3 сайти для навчання промт-інжинірингу

Відібрано дослідницькими агентами; посилання **перевірені WebFetch'ем на доступність І на свіжість змісту (2026-08-21)**. Критерії: авторитетність, актуальність, практичність і покриття *обох* доменів (DS + SWE).

> ⚠️ **Доступність ≠ актуальність.** Серпнева перевірка показала: усі 10 посилань відкриваються, але **зміст деяких застарів**. Нижче кожен ресурс має чесну позначку свіжості.

### 1. Anthropic — Prompting Best Practices (офіційні докси Claude) — ✅ актуальний
🔗 https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices

Офіційний, **постійно оновлюваний** довідник: чіткість, приклади, XML-структурування, tool use, extended/adaptive thinking, агентний промптинг — з нотатками під **конкретні моделі**. **№1, бо це єдине джерело, яке не застаріває**: воно оновлюється разом із моделями (перевірено — містить актуальні Opus 5 / Sonnet 5 / Fable 5).
*Кому:* усім, хто пише промпти під Claude; обов'язково — розробникам на API.

### 2. Prompt Engineering Guide — DAIR.AI — ✅ актуальний
🔗 https://www.promptingguide.ai/

Найбільш цитований відкритий гайд, що активно оновлюється. Дистилює дослідницькі техніки (chain-of-thought, few-shot, RAG, ReAct, агенти) з нотатками під конкретні моделі. Розділ **Applications** покриває і DS (генерація даних, синтетичні датасети, класифікація), і SWE (генерація коду, агенти). **№2, бо це найкращий крос-доменний референс, не прив'язаний до вендора.**
*Кому:* усім, хто хоче зрозуміти техніки «з-під капота», що переносяться між моделями.

### 3. Anthropic Interactive Prompt Engineering Tutorial (GitHub) — ⚠️ потребує правки перед запуском
🔗 https://github.com/anthropics/prompt-eng-interactive-tutorial

Єдиний ресурс топу, де ти **сам проганяєш промпти** в Jupyter і бачиш різницю на дотик. 9 розділів + додатки; концепції (чіткість, XML-теги, роль, few-shot, CoT, анти-галюцинації, chaining/tool-use/RAG) — **досі валідні** й майже дослівно збігаються з тим, що ми виміряли в цьому курсі.

> 🔧 **Але з коробки він НЕ запуститься.** Ноутбуки жорстко зашиті на `claude-3-haiku-20240307`, яку Anthropic **зняла з експлуатації 20 квітня 2026** («Requests to retired models will fail»). Репозиторій не оновлювався з **квітня 2024**.
> **Фікс — один рядок:** заміни у ноутбуці
> ```python
> MODEL_NAME = "claude-3-haiku-20240307"   # ❌ retired
> MODEL_NAME = "claude-haiku-4-5-20251001" # ✅ офіційна заміна
> ```
> Також прибери `temperature=0.0` з `get_completion()`, якщо перейдеш на Opus 4.7+/Fable (там нестандартний `temperature` → `400`, див. [Частину 8](08-vybir-modeli-haiku-opus-fable.md)).

*Кому:* тим, хто вчиться руками і не боїться однорядкової правки.

> **Якщо обирати один:** почни з **#1** (не застаріває) → **#2** для глибини технік → **#3**, коли захочеш практики (після фіксу моделі).

---

## Додаткові сайти за доменами (бонус)

### Для Data Science
- **The Data Scientist's Prompt Playbook (Towards Data Science)** — ⚠️ *стаття від 30.06.2025* — copy-paste промпти й pandas-снипети для planning / cleaning / EDA. Техніки валідні, але **моделі, які вона називає (GPT-4, o3-pro), уже застаріли** — не бери її як орієнтир щодо вибору моделі.
  🔗 https://towardsdatascience.com/become-a-better-data-scientist-with-these-prompt-engineering-hacks/
- **Advanced Prompt Engineering for DS (частина 2)** — ⚠️ *стаття від 19.08.2025* — feature engineering, вибір моделі/AutoML, LLM-оцінка з JSON/CSV-схемами. **Обережно з порадою «тримай `temperature` ≤ 0.3»**: на сучасних Claude (Opus 4.7+, Fable 5) нестандартний `temperature` повертає `400` — там детермінізм задають промптом і `effort` (див. [Частину 8](08-vybir-modeli-haiku-opus-fable.md)).
  🔗 https://towardsdatascience.com/advanced-prompt-engineering-for-data-science-projects/
- **promptingguide.ai/applications** — ✅ актуальний — data generation, синтетичні датасети, класифікація.
  🔗 https://www.promptingguide.ai/applications

### Для Software Engineering
- **Best practices for Claude Code (Anthropic)** — ✅ актуальний — офіційний плейбук агентного кодингу: explore-plan-code-commit, верифіковані перевірки, CLAUDE.md, subagents, рев'ю.
  🔗 https://code.claude.com/docs/en/best-practices
- **Effective context engineering for AI agents (Anthropic Engineering)** — ✅ актуальний — керування контекстним вікном (just-in-time loading, compaction, sub-agents).
  🔗 https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- **Agentic Engineering Patterns (Simon Willison)** — ⚠️ *не оновлювався з квітня 2026* — практичні патерни агентного кодингу, TDD для агентів. Методологія не застаріває, але приклади моделей — на покоління позаду. **Читай живий покажчик, а не анонс:** https://simonwillison.net/guides/agentic-engineering-patterns/
  🔗 https://simonwillison.net/2026/Feb/23/agentic-engineering-patterns/ *(анонс)*
- **OpenAI Prompt Engineering Guide** — ✅ актуальний (посилається на GPT-5-серію) — якщо працюєш і з OpenAI-моделями: кодинг, frontend, агентні воркфлоу.
  🔗 https://developers.openai.com/api/docs/guides/prompt-engineering

### Ресурси Модуля 2026 (Частини 9–13, перевірені при дослідженні 2026-08)
- **Промптинг reasoning-моделей:** OpenAI Reasoning Best Practices — https://developers.openai.com/api/docs/guides/reasoning-best-practices
- **Автоматизована розробка:** DORA 2025 — https://dora.dev/dora-report-2025/ · METR RCT — https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ · Effective harnesses (Anthropic) — https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- **Мультиагенти:** Anthropic multi-agent research system — https://www.anthropic.com/engineering/multi-agent-research-system · Cognition «Don't Build Multi-Agents» — https://cognition.com/blog/dont-build-multi-agents · Claude Code sub-agents — https://code.claude.com/docs/en/sub-agents
- **Контекст агентів:** Chroma «Context Rot» — https://www.trychroma.com/research/context-rot · Harness engineering (Fowler/Böckeler) — https://martinfowler.com/articles/harness-engineering.html
- **Локальні LLM:** llama.cpp quantize README — https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md · vLLM quantization — https://docs.vllm.ai/en/latest/features/quantization/ · Willison local-llms — https://simonwillison.net/tags/local-llms/

> **Перевірка 2026-08-21:** усі 10 посилань **живі**; додатково перевірено **зміст** кожного. Результат: 6 — актуальні, 3 — старіють (позначено ⚠️), 1 — потребує однорядкової правки перед запуском (туторіал Anthropic). Історія перевірок доступності — у [Частині 6](06-stabilnist-ta-antypaterny.md#c-пере-перевірка-топ-сайтів-webfetch-2026-06-27).

---

## Шпаргалка: 13 принципів

Згруповано за тим, що **виміряно** в цьому курсі.

**Чіткість і структура**
1. Завжди давай: дані+типи, ціль, контекст, формат відповіді. *(DS1)*
2. Розділяй частини промпта XML-тегами: `<task>`, `<code>`, `<data>`. *(SE2)*
3. Обмежуй обсяг явно: «exactly 5 bullets», «output only the code». *(DS1, SE1, SE3)*

**Приклади (найнадійніший важіль формату)**
4. Хочеш стабільний формат — дай 2–5 few-shot прикладів «вхід → вихід». *(DS2, SE3)*
5. Приклади > опис. На малих моделях це усуває «балакучість». *(DS2)*

**Міркування**
6. Для задач на судження — «think step by step, then give your final answer». *(DS3)*
7. Для дебагу — проси трасування виконання перед вердиктом. *(SE4)*
8. Задавай і *процес*, і *структуру фіналу* (баг → причина → фікс). *(SE4)*

**Формат виводу**
9. **Якоруй перший символ** («start with `{`») — надійніше за «no markdown». *(SE5 vs DS4)*
10. У реальному API для гарантованого формату — **prefill** відповіді асистента. *(DS4)*
11. Задавай JSON-схему: ключі, типи, поведінку для `null`. *(DS4)*

**Роль і чесність**
12. Роль + контекст + обмеження разом (роль сама по собі слабка). *(DS5)*
13. Завжди давай «вихід»: «if X is not in the context / does not exist — say so, don't invent» — і перевіряй на *своїх* рідкісних кейсах. *(SE6)*

> ➕ **Принципи 14–17 (reasoning-моделі 2026)** — у [Частині 9.7](09-promt-inzhyniring-2026-reasoning.md); ресурси пʼяти нових напрямів — нижче.

---

## Відповіді до вправ

### Data Science
1. **DS1.** Чотири елементи: (1) дані+типи — `transactions(user_id int, amount float, timestamp datetime, is_fraud 0/1)`; (2) ціль — «predict is_fraud»; (3) контекст — клас рідкісний (~0.5%), дані часові (ризик витоку через майбутнє); (4) формат — «in 4 bullets: одна фіча, baseline, метрика, ризик leakage».
2. **DS2.** Мінімум **3 приклади — по одному на клас** (`BUG`, `FEATURE`, `QUESTION`), бо модель має побачити межу кожної категорії хоча б раз. Плюс інструкція «output only the label». Для неоднозначних класів — 2 приклади на клас.
3. **DS4.** «Позитивний якір першого символу виводу (`start with {`) надійніший за негативну заборону (`no markdown`)»: модель легше *виконує* конкретну дію, ніж *утримується* від звички обгортати код у блоки.
4. **DS5.** `You are explaining to a non-technical product manager. Avoid statistical jargon; in 3 sentences explain what a p-value tells us about whether an A/B test result is likely real or just noise, and one common misinterpretation to avoid.`

### Software Engineering
1. **SE1.** Сигнатура `def allow_request(self, key: str) -> bool`; 3 правила: (1) ліміт N запитів за вікно T секунд на ключ, (2) sliding window, (3) повертати `False` при перевищенні без винятку; заборона: «do not use external libraries, use only stdlib `time` and a dict». Формат: «output only the class».
2. **SE2.** 
   ```
   <task>
   Find and fix the bug in the query inside <sql>. Focus on performance:
   check for missing index usage, full scans, and N+1 patterns.
   </task>
   <sql>
   SELECT ...
   </sql>
   ```
   Вісь фокусу (performance) скеровує рев'ю — інакше модель може зачепитись за стиль.
3. **SE5.** `Output ONLY the bash command, starting with the command name. No explanation, no markdown, no backticks.` Краще за «don't explain», бо задає **позитивну дію** (почни з імені команди), а не лише заборону — модель легше виконує конкретний старт виводу, ніж стримує звичку пояснювати.
4. **SE6.** `Answer ONLY using the provided documentation. If the function is not described in the documentation above, reply exactly: "Not found in the provided docs." Do not use outside knowledge or invent behavior.`

---

## Підсумок одним абзацом

Промт-інжиніринг — це не «магічні слова», а **інженерна дисципліна з вимірюваним ефектом**. У цьому курсі кожне правило підкріплене реальним прогоном на Claude Haiku 4.5: few-shot робить формат детермінованим (1 унікальна відповідь замість 3), якір першого символу б'є заборону обгортки, CoT перетворює вердикт на обґрунтування, а деякі «класичні» техніки на сучасній моделі дають менший ефект, ніж обіцяють старі гайди — і це теж треба перевіряти на власних задачах, а не приймати на віру.
