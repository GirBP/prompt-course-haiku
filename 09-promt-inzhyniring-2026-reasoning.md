# Частина 9. Промт-інжиніринг 2026: reasoning-моделі та зсув до контексту

Частини 1–6 **виміряли** класичні техніки на Haiku 4.5 — малій моделі без примусового reasoning. Але фронтир 2026 — це **reasoning-моделі** (Claude Sonnet 5 / Opus 5 / Fable 5.1, OpenAI GPT-5 і GPT-6 Astra, DeepSeek R1/V4), які думають самі. Ця частина — про те, **що з класики живе, що померло, і що прийшло на заміну**, за офіційними доксами обох лабораторій та дослідженнями.

> 📚 **Джерела й маркування.** Ця частина — дослідницька (офіційні докси Anthropic/OpenAI/DeepSeek, arXiv, Willison/Fowler), зібрана 2026-08-21 із правилом «кожне твердження реально прочитане за URL», а ключові — перевірені повторним фетчем незалежним критиком. Це **не** прогони моделей — на відміну від ядра курсу.

---

## 9.1. Головний зсув: «think step by step» більше не радять

Обидві лабораторії **незалежно** зійшлися на одному:

- **OpenAI** (офіційні reasoning best practices): *«Since these models perform reasoning internally, prompting them to "think step by step" or "explain your reasoning" is unnecessary»*. І далі: спершу пробуй **zero-shot**, few-shot — лише якщо треба.
  → [developers.openai.com/api/docs/guides/reasoning-best-practices](https://developers.openai.com/api/docs/guides/reasoning-best-practices)
- **Anthropic** (актуальний довідник під Sonnet 5/Opus 5/Fable 5): *«Prefer general instructions over prescriptive steps. A prompt like "think thoroughly" often produces better reasoning than a hand-written step-by-step plan»*. Ручний CoT з тегами `<thinking>/<answer>` — тепер лише **fallback**, коли adaptive thinking вимкнено.
  → [platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

**Заміна:** дай моделі **задачу + обмеження + формат виводу** — і хай планує сама. Глибину міркувань крутить не текст промпта, а **явний перемикач**: `effort` (Anthropic: low…max) / `reasoning_effort` (OpenAI).

> ⚖️ **Як це співіснує з нашим виміром.** У Частині 1 CoT на **Haiku 4.5** дав реальний приріст (DS3) — і це досі правильно: Haiku-клас не reasoning-first. Правило 2026: **CoT-підказки — для моделей без вбудованого мислення; для reasoning-моделей — goal+constraints і effort-dial.** Техніка не «померла» — вона стала **model-conditional**.

## 9.2. Few-shot став умовним, а не універсальним

Наш вимір (DS2/SE3): few-shot — найнадійніший важіль формату на Haiku. Але у 2026:

| Лабораторія | Позиція |
|---|---|
| **Anthropic** | Досі рекомендує 3–5 прикладів як топ-техніку |
| **OpenAI** | «Спершу zero-shot, few-shot — якщо потрібно» |
| **DeepSeek** (стаття R1, [arXiv:2501.12948](https://arxiv.org/abs/2501.12948); картка моделі) | Стаття: few-shot **«consistently degrades its performance»**, тож автори радять zero-shot — описати задачу й формат виводу. Картка: без system prompt, усі інструкції в user-повідомленні |

**Правило 9.2.** Few-shot лишається королем **формату** (це ми виміряли), але для **reasoning-якості** він model-conditional: перевіряй картку конкретної моделі, а не переноси звичку.

## 9.3. Structured outputs замість prefill

Класичний хак «підстав `{` у відповідь асистента» (його радили правило DS4 і Частина 6) на нових моделях **неможливий** — prefill повертає 400 на Claude 4.6+/Fable. Офіційна заміна в обох лабораторій — **нативні structured outputs** (JSON-схема на рівні API: `output_config.format` в Anthropic, Structured Outputs в OpenAI). Докси Anthropic прямо описують міграцію з prefill.

**Драбина надійності формату 2026** (оновлення нашої з Частини 6):
1. **Нативна схема на рівні API** (100% валідність гарантує сервер) — коли доступна. На Claude це `output_config.format`, і він працює навіть на Haiku 4.5.
2. Якір першого символу + закритий набір міток (наші виміряні ~100% на Haiku) — коли схемного режиму нема. Локальні стеки його мають: Ollama (`format`), llama.cpp (`json_schema`/`grammar`).
3. Негативні заборони — досі протікають (наш вимір: 80%).

## 9.4. Семплінг-параметри: епоха temperature закінчується (але не скрізь)

- Claude 4.7 і новіші (Sonnet 5, Opus 5, Fable 5/5.1): нестандартні `temperature`/`top_p`/`top_k` → **400**; OpenAI GPT-5 і GPT-6 Astra ці параметри не підтримують. Стиль і варіативність задаються промптом, глибина — effort.
- Але **DeepSeek R1** офіційно радить temperature 0.5–0.7.

**Правило 9.4.** «Effort замість temperature» — правило **конкретних фронтир-родин, не індустрії**. Для кожної моделі — її картка. (Це підтвердив і наш адверсаріальний критик, спіймавши спробу узагальнення.)

## 9.5. Від промпт- до контекст-інжинірингу

Anthropic Engineering (2025-09-29) формалізує наступницю дисципліну: промпт-інжиніринг — «написання інструкцій», **контекст-інжиніринг** — *«стратегії курації та підтримки оптимального набору токенів під час інференсу»*: системний промпт + інструменти + retrieved-дані + історія разом. Willison (2025-06-27) фіксує, чому термін переміг: «prompt engineering» у публічній свідомості сплющився до «друкування в чатбот» (цитує Karpathy: *«делікатне мистецтво наповнення контекстного вікна саме тим, що треба»*). Böckeler на martinfowler.com (2026-04-02) веде далі — **harness engineering**: `Agent = Model + Harness`, де harness = feedforward-«guides» (доки, навички, лінтери) + feedback-«sensors» (тести, fitness functions).

**Ієрархія 2026:** промпт ⊂ контекст ⊂ харнес. Детально контекст — у [Частині 12](12-keruvannya-kontekstom-agentiv.md).

## 9.6. Чесні суперечки (без вирішення)

- **Роль/персона**: consumer-блог Anthropic (11.2025) називає ролі «менш потрібними… надто специфічна роль може обмежити», а технічний довідник тієї ж Anthropic досі тримає «Give Claude a role» у ядрі технік. Наш вимір (DS5): роль **у парі з контекстом+обмеженнями** працювала на Haiku. Висновок: роль — не магія, а спосіб передати контекст; сама по собі слабшає зі зростанням моделей.
- **XML-теги**: та сама пара джерел розходиться (маркетинг: «часто досить заголовків»; техдовідник: XML — основний спосіб розділяти складні промпти). Наш вимір (SE2) — теги давали реальний приріст на Haiku.
- **Чутливість reasoning-моделей до промпта**: KAIST ([arXiv:2505.17225](https://arxiv.org/abs/2505.17225)) показує «reasoning rigidity» — моделі **переїжджають явні умови** звичними траєкторіями (три модуси: interpretation overload, input distrust, partial instruction attention). Тобто частина збоїв не лікується формулюванням. Єдиної картини «більш чи менш чутливі» в літературі поки немає — чесно кажемо: відкрите питання.

## 9.7. Оновлена шпаргалка-2026 (додаток до 13 принципів Частини 4)

14. Для reasoning-моделей: **goal + constraints + формат**, без покрокових рецептів; глибина — effort-dial. *(OpenAI+Anthropic)*
15. Few-shot і CoT — **model-conditional**: звіряй картку моделі (на R1 few-shot шкодить). *(DeepSeek/OpenAI)*
16. Формат — **нативною схемою API**, prefill мертвий на фронтирі; якорі лишаються для моделей без схем. *(обидві лабораторії + наш вимір)*
17. Думай рівнями: **промпт ⊂ контекст ⊂ харнес** — і оптимізуй той рівень, де реальна проблема. *(Anthropic Eng/Fowler)*

---

## Вправи (Частина 9)

1. **9-A.** Твій старий промпт для GPT-4-класу починався з «Let's think step by step» і мав 5 few-shot прикладів. Переносиш на Claude Opus 5. Що зміниш і чому?
2. **9-B.** Потрібен гарантовано валідний JSON на (а) Fable 5.1, (б) локальній Qwen через llama.cpp. Який механізм формату обереш для кожної і хто в кожному разі гарантує схему?

### Відповіді
1. **9-A.** Прибрати CoT-заклинання (Opus 5 думає сам; глибину задати `effort`), few-shot скоротити або лишити тільки якщо вони задають **формат** (не «навчають міркувати»); переписати як goal+constraints+формат виводу. І прибрати `temperature`, якщо був — на Opus 5 це 400.
2. **9-B.** (а) Fable 5.1 — нативні structured outputs (`output_config.format`): схему гарантує сервер Anthropic, prefill недоступний. (б) llama.cpp теж обмежує декодування: `json_schema` або GBNF-`grammar` у сервері. Тут схему гарантує граматика, яку ти сам налаштовуєш і тестуєш. В обох випадках якір першого символу й перевірка значень лишаються страховкою: схема гарантує синтаксис, а не зміст.

---

> **Підсумок Частини 9.** Класика не померла — вона **стала умовною**. Виміряне в Частинах 1–6 досі точне для Haiku-класу й локальних моделей; для reasoning-фронтиру діє нова трійця: *goal+constraints замість кроків, effort замість «think harder» і temperature, схеми API замість prefill*. А сама дисципліна виросла з промпта в контекст і харнес.

---

### Джерела (перевірено 2026-09-19)

- [OpenAI — Reasoning best practices](https://developers.openai.com/api/docs/guides/reasoning-best-practices)
- [OpenAI — Model guidance (GPT-6 Astra)](https://developers.openai.com/api/docs/guides/latest-model)
- [Anthropic — Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Anthropic — Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Anthropic — Effort](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Anthropic — Model deprecations (temperature на 4.7+)](https://platform.claude.com/docs/en/about-claude/model-deprecations)
- [DeepSeek-R1 — картка моделі](https://huggingface.co/deepseek-ai/DeepSeek-R1)
- [DeepSeek-R1 — стаття (few-shot)](https://arxiv.org/abs/2501.12948)
- [Anthropic Engineering — Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Simon Willison — Context engineering](https://simonwillison.net/2025/Jun/27/context-engineering/)
- [Birgitta Böckeler — Harness engineering](https://martinfowler.com/articles/harness-engineering.html)
- [Claude blog — Prompt engineering best practices (10.11.2025)](https://claude.com/blog/best-practices-for-prompt-engineering)
- [Reasoning Model is Stubborn (reasoning rigidity)](https://arxiv.org/abs/2505.17225)
- [Ollama — Structured outputs](https://ollama.com/blog/structured-outputs)
- [llama.cpp server — json_schema / grammar](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)
