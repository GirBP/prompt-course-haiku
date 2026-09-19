# Частина 1. Промт-інжиніринг для Data Science

5 технік на реальних задачах: EDA-планування, класифікація, вибір метрики, екстракція метрик, обробка пропусків. **Усі відповіді нижче — справжній вивід Claude Haiku 4.5.**

Формат кожного розділу: задача → слабкий промпт + реальний вивід → сильний промпт + реальний вивід → що ми бачимо → правило.

---

## DS1. Чіткість і конкретність

**Принцип:** модель не читає думок. Чим конкретніше ціль, дані й формат відповіді — тим менше «води» й більше дії. На малій моделі (Haiku) це особливо помітно.

### ❌ Слабкий промпт
```
Analyze this dataset and tell me what to do.

Columns: age, income, churned
```

**Реальний вивід Haiku (скорочено, повний — 1116 символів):**
> I'd be happy to help you analyze a dataset, but I don't have access to the actual data you're referring to. To provide meaningful analysis and recommendations, I need to see the dataset itself.
> Could you please share: 1. The actual data... 2. Basic context... How many rows? What does "churned" represent?...

Модель **відмовилась і попросила дані** — жодної користі.

### ✅ Сильний промпт
```
I have a customer churn dataset with three columns: age (integer, years),
income (float, annual USD), churned (0 or 1, the target).
Goal: predict churn. Churn is imbalanced (about 15% positive).
In exactly 5 numbered bullets, give concrete recommendations:
1) two EDA plots to make first,
2) one feature to engineer from these columns,
3) one suitable baseline model,
4) the single most appropriate evaluation metric given the imbalance,
5) one data-leakage risk to check.
Be specific and concise.
```

**Реальний вивід Haiku (повний):**
> 1) **Histogram of age distribution by churn class** (overlaid or side-by-side) and **box plot of income vs. churn status** — these reveal whether age/income differ meaningfully between churners and non-churners...
> 2) **Age-to-income ratio** (or log(income) / age) — captures relative spending power and lifecycle stage in a single derived feature...
> 3) **Logistic Regression** — simple, interpretable, fast to train, and sets a solid baseline...
> 4) **ROC-AUC** — threshold-independent and robust to class imbalance...
> 5) **Check whether income or age was used in any customer acquisition, retention, or pricing decisions during the observation period** — if so, they're indirect proxies for company actions rather than pure customer attributes...

### Що ми бачимо
Той самий набір даних. Слабкий промпт → відмова. Сильний → **5 конкретних, грамотних порад**, включно з нетривіальним ризиком витоку даних (leakage). Різниця не в довжині (1116 проти 1125 символів!), а в **корисності**.

> **Правило DS1.** Завжди вказуй: (1) що це за дані й типи, (2) ціль, (3) важливий контекст (тут — дисбаланс 15%), (4) формат відповіді («exactly 5 numbered bullets»). Формат-обмеження — це кермо для моделі.

---

## DS2. Few-shot приклади для стабільності формату

**Принцип:** 2–5 прикладів «вхід → вихід» навчають модель *формату й межам відповіді* краще за будь-який опис. Це найнадійніший спосіб отримати **детермінований** вивід.

### ❌ Слабкий промпт (zero-shot)
```
Classify the sentiment of this review:
'The dashboard loads slowly but the insights are great.'
```

**Реальний вивід — прогнали 3 рази, отримали 3 РІЗНІ відповіді:**

- Прогін 1: *«mixed/neutral sentiment»* + 3 абзаци розбору, наприкінці «leans slightly **positive**».
- Прогін 2: *«mixed sentiment»* + «If forced to choose... **slightly positive** or **balanced positive**».
- Прогін 3: *«mixed sentiment»* + «**moderately positive review with a caveat**».

Формат щоразу інший, фінальна мітка плаває (mixed / slightly positive / moderately positive), розпарсити автоматично — неможливо.

### ✅ Сильний промпт (few-shot)
```
Classify each review's sentiment. Use exactly one label: POSITIVE, NEGATIVE,
or MIXED. Output only the single label word, nothing else.

Review: 'Fast and reliable, love it.' -> POSITIVE
Review: 'Crashes constantly, completely useless.' -> NEGATIVE
Review: 'Great features but terrible support.' -> MIXED

Review: 'The dashboard loads slowly but the insights are great.' ->
```

**Реальний вивід — прогнали 3 рази, отримали ОДНАКОВУ відповідь:**
```
MIXED
```
```
MIXED
```
```
MIXED
```

### Що ми бачимо
Виміряно об'єктивно: слабкий промпт — **3 унікальні відповіді з 3**; few-shot — **1 унікальна з 3**. Довжина впала з ~886 до **5 символів**. Це готовий до продакшену класифікатор, вивід якого можна напряму класти в `if label == "MIXED"`.

> **Правило DS2.** Якщо вивід має споживатися кодом або іншою системою — давай few-shot приклади з точним форматом мітки. Приклади > опис. Це також усуває «балакучість» малих моделей.

---

## DS3. Chain-of-Thought (ланцюжок міркувань)

**Принцип:** проси модель «думати крок за кроком» *перед* відповіддю на задачі, де потрібне зважування або міркування. Якість висновку зростає, бо модель не «стрибає» одразу до відповіді.

### ❌ Слабкий промпт
```
A fraud-detection model has precision 0.30 and recall 0.90 on data where 2% of
transactions are fraud. Is this a good model? Answer only yes or no.
```

**Реальний вивід Haiku:**
> No.
> A precision of 0.30 means that 70% of flagged transactions are false positives, creating excessive operational burden... A good fraud-detection model requires better balance—ideally precision above 0.70-0.80...

Відповідь правильна, але **категорична й безконтекстна**: «потрібна precision 0.70–0.80» — це сумнівне універсальне твердження для fraud, де recall часто цінніший.

### ✅ Сильний промпт (CoT)
```
A fraud-detection model has precision 0.30 and recall 0.90 on data where 2% of
transactions are fraud.
Think step by step about the business cost of false positives versus false
negatives for fraud detection.
Then give your final verdict (good or not good) in one sentence with justification.
```

**Реальний вивід Haiku (скорочено, повний — 1806 символів):**
> **Understanding the metrics:** Precision 0.30: ...only 30% actually are fraud (70% false positives). Recall 0.90: ...catches 90% of actual fraud...
> **False Positives:** declined cards, account blocks, customer service calls... customer churn...
> **False Negatives:** Direct financial loss... but only 10% of fraud escapes...
> **Verdict:** This model is **not good** for production use because the 70% false positive rate will severely damage customer experience... A better approach would be to lower the detection threshold, accept some false negatives (e.g., 80% recall), and aim for 70-80% precision...

### Що ми бачимо
CoT збільшив вивід з 398 до 1806 символів — і це **корисне** зростання: модель розклала вартість обох типів помилок і дала **інженерну рекомендацію щодо порогу**, а не голий вердикт. Для рев'ю рішень або пояснення стейкхолдерам це незрівнянно цінніше.

> **Правило DS3.** Для задач на судження, вибір метрики, оцінку trade-off — додавай «think step by step, then give your final answer». Якщо потрібна лише коротка відповідь у проді — попроси міркування у `<scratchpad>`, а фінал окремо (prompt chaining).

---

## DS4. Структурований JSON-вивід зі схемою

**Принцип:** для машинно-читаного виводу задавай **точну схему** (ключі, типи, поведінку для відсутніх значень). Тут також важливий **чесний урок про межі техніки**.

### ❌ Слабкий промпт
```
Extract the key metrics from this text: 'In Q3 revenue was 4.2M USD, up 12%
year over year, churn fell to 3.1%, and we added 540 new customers.'
```

**Реальний вивід Haiku:**
> Here are the key metrics extracted from that text:
> - **Revenue (Q3)**: $4.2M USD
> - **Year-over-year growth**: +12%
> - **Churn rate**: 3.1%
> - **New customers added**: 540
> These metrics indicate solid business performance...

Це проза з bullet-ами + коментар. Ключі непослідовні («Revenue (Q3)»), не парситься.

### ✅ Сильний промпт (схема)
```
Extract metrics from the text into a JSON object with exactly these keys:
revenue_musd (number), revenue_growth_yoy_pct (number), churn_rate_pct (number),
new_customers (integer). If a value is missing, use null. Output ONLY valid JSON,
no markdown, no commentary.

Text: 'In Q3 revenue was 4.2M USD, up 12% year over year, churn fell to 3.1%,
and we added 540 new customers.'
```

**Реальний вивід Haiku (дослівно):**
````
```json
{
  "revenue_musd": 4.2,
  "revenue_growth_yoy_pct": 12,
  "churn_rate_pct": 3.1,
  "new_customers": 540
}
```
````

### Що ми бачимо (і чесний нюанс!)
Значення, ключі й типи — **ідеальні** (`4.2` число, `540` ціле). АЛЕ: попри явне «no markdown», Haiku **все одно обгорнув JSON у ` ```json ` блок**. Тобто навіть сильний промпт на малій моделі **не гарантує 100% слухняності щодо заборон**.

Порівняй із [SE5](02-software-engineering.md#se5-примус-формату-виводу), де інструкція «start with the character `{`» дала **голий** `{...}` без блоку. Звідси крос-висновок усього курсу:

> **Позитивний якір першого символу («починай з `{`») працює надійніше за негативну заборону («без markdown»).**

> **Правило DS4.** Задавай схему з типами і поведінкою для `null`. Для *гарантованого* голого JSON: (а) якорі перший символ, (б) у реальному API — нативні structured outputs (`output_config.format`, є і на Haiku 4.5); prefill (підстав `{` у відповідь асистента) працює лише на Haiku 4.5 і старших моделях, (в) на крайній випадок — стрипай ` ``` ` у пост-обробці.

---

## DS5. Роль / персона

**Принцип:** призначення ролі («ти — senior data scientist») піднімає глибину й фокус відповіді. У реальному API роль кладуть у `system`-промпт; тут її передано в тексті як апроксимацію.

### ❌ Слабкий промпт
```
How should I handle missing values in the income column?
```

**Реальний вивід Haiku (скорочено, повний — 2429 символів):**
> ## 1. Deletion — Remove rows / Remove the column...
> ## 2. Imputation with Central Tendency — Mean / Median / Mode...
> ## 3. Group-Based Imputation...
> ## 4. Predictive Imputation — KNN, regression, random forest...
> ## 5. Multiple Imputation...
> ## 6. Keep Missing as a Category...
> What's your specific context—size of dataset, proportion of missing values...?

Це **підручник-енциклопедія** — 6 категорій усіх можливих методів. Правильно, але без рішення: новачок потоне.

### ✅ Сильний промпт (роль + контекст + обмеження)
```
You are a senior data scientist mentoring a junior analyst.
Context: the income column in a churn dataset has 22% missing values, and the
missingness is likely not random (high earners tend to skip the question).
In 4 short bullets, advise how to handle these missing values. Explicitly warn
against the naive mean-imputation approach and name one specific better technique.
Be practical.
```

**Реальний вивід Haiku (повний):**
> • **Don't use mean imputation.** It will artificially compress variance, bias your churn predictions toward the mean income level, and mask the real pattern that high earners are missing—exactly when you need to see it most.
> • **Create a "missing" indicator variable.** ...High earners skipping the question is itself predictive of churn behavior, so preserve that signal...
> • **Use multiple imputation by chained equations (MICE).** This leverages other features (age, tenure, subscription tier)...
> • **Validate your choice on holdout data.** ...If a segment's predictions flip dramatically, your approach is leaking bias...
> The key: treat missingness as information, not just a problem to erase.

### Що ми бачимо
Роль + контекст «MNAR, високозаробітні пропускають» дали **прицільну експертну пораду**: попередження проти mean-imputation, конкретний MICE, missing-indicator як предиктивний сигнал, валідація на holdout. Вивід коротший (1189 проти 2429), але **набагато глибший**. Енциклопедія перетворилась на консультацію.

> **Правило DS5.** Роль + конкретний контекст + обмеження («4 bullets», «name one specific technique», «warn against X»). Роль сама по собі слабка — вона працює в парі з контекстом і обмеженнями.

---

## Вправи (Data Science)

1. **DS1-вправа.** Перепиши слабкий промпт «Build me a model for this data» для датасету `transactions(user_id, amount, timestamp, is_fraud)` за правилом DS1. Які 4 елементи ти додаси?
2. **DS2-вправа.** Тобі треба класифікувати тікети підтримки на `BUG / FEATURE / QUESTION`. Склади few-shot промпт. Скільки прикладів мінімально і чому саме стільки?
3. **DS4-вправа.** Чому в DS4 Haiku порушив «no markdown», а в SE5 — ні? Сформулюй правило одним реченням.
4. **DS5-вправа.** Додай роль до промпта «Explain p-value to me» так, щоб відповідь підійшла для product-менеджера, а не статистика.

➡️ Відповіді — у [04-top-sajty-i-shpargalka.md](04-top-sajty-i-shpargalka.md#відповіді-до-вправ).
