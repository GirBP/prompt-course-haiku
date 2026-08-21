# Частина 4. Топ-3 сайти, шпаргалка та відповіді

---

## 🏆 Топ-3 сайти для навчання промт-інжинірингу

Відібрано 3 дослідницькими агентами; посилання перевірені WebFetch'ем і **перепровірені 2026-08-21**. Критерії: авторитетність, актуальність, практичність і покриття *обох* доменів (DS + SWE).

### 1. Anthropic Interactive Prompt Engineering Tutorial (GitHub) — найкращий для практики
🔗 https://github.com/anthropics/prompt-eng-interactive-tutorial

Інтерактивний курс із 9 розділів із **запускними прикладами**, які працюють **прямо на Claude Haiku** — тобто максимально близько до того, що ми робили в цьому курсі. Вчить від базової структури промпта до складних промислових кейсів. **№1, бо це єдиний з топу, де ти сам проганяєш промпти на Haiku й бачиш різницю на дотик.**
*Кому:* розробникам, які вчаться на практиці й хочуть одразу мацати модель.

### 2. Prompt Engineering Guide — DAIR.AI — найкращий vendor-neutral довідник
🔗 https://www.promptingguide.ai/

Найбільш цитований відкритий гайд, що активно оновлюється. Дистилює дослідницькі техніки (chain-of-thought, few-shot, RAG, ReAct, агенти) з нотатками під конкретні моделі, включно з Claude. Розділ **Applications** покриває і DS (генерація даних, синтетичні датасети, класифікація), і SWE (генерація коду, агенти). **№2, бо це найкращий єдиний крос-доменний референс, не прив'язаний до вендора.**
*Кому:* усім, хто хоче зрозуміти техніки «з-під капота», що переносяться між моделями.

### 3. Anthropic — Prompting Best Practices (офіційні докси Claude) — найкращий авторитетний референс
🔗 https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices

Офіційний, постійно оновлюваний довідник: чіткість, приклади, XML-структурування, tool use, extended thinking, агентний промптинг — з нотатками під **конкретні моделі, включно з Claude Haiku 4.5**. **№3, бо це першоджерело істини саме для тих моделей, на яких ми валідували курс.**
*Кому:* розробникам на Claude API, яким потрібна точна model-specific настройка.

> **Якщо обирати один:** для нашого контексту (навчання + Haiku) — почни з **#1** (практика), тримай **#3** як довідник під рукою, а **#2** читай для глибини технік.

---

## Додаткові сайти за доменами (бонус)

### Для Data Science
- **The Data Scientist's Prompt Playbook (Towards Data Science)** — серія 2026 з copy-paste промптами й pandas-снипетами для planning / cleaning / EDA.
  🔗 https://towardsdatascience.com/become-a-better-data-scientist-with-these-prompt-engineering-hacks/
- **Advanced Prompt Engineering for DS (TDS, частина 2)** — feature engineering, вибір моделі/AutoML, LLM-оцінка з явними JSON/CSV-схемами.
  🔗 https://towardsdatascience.com/advanced-prompt-engineering-for-data-science-projects/
- **promptingguide.ai/applications** — data generation, синтетичні датасети, класифікація.
  🔗 https://www.promptingguide.ai/applications

### Для Software Engineering
- **Best practices for Claude Code (Anthropic)** — офіційний плейбук агентного кодингу: explore-plan-code-commit, верифіковані перевірки, CLAUDE.md, subagents, рев'ю.
  🔗 https://code.claude.com/docs/en/best-practices
- **Effective context engineering for AI agents (Anthropic Engineering)** — найбільший важіль якості агента: керування контекстним вікном (just-in-time loading, compaction, sub-agents).
  🔗 https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- **Agentic Engineering Patterns (Simon Willison)** — практичні патерни щоденного агентного кодингу, TDD для агентів.
  🔗 https://simonwillison.net/2026/Feb/23/agentic-engineering-patterns/
- **OpenAI Prompt Engineering Guide** — якщо працюєш і з OpenAI-моделями: кодинг, frontend, агентні воркфлоу.
  🔗 https://developers.openai.com/api/docs/guides/prompt-engineering

> **Усі 10 посилань цього файлу реально перевірені WebFetch'ем** (а не лише прапорцем `verified_live` дослідницького агента), і **перепровірені 2026-08-21 — усі 10 живі**. Історія: 6 перевірені у [Частині 6](06-stabilnist-ta-antypaterny.md#c-пере-перевірка-топ-сайтів-webfetch-2026-06-27), 3 (2× Towards Data Science, Simon Willison) — окремим проходом, 10-те (`promptingguide.ai/applications`) дозвірене у серпні. Якщо щось переїхало — шукай за назвою ресурсу.

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
