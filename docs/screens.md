# Screen decision registry

v0.2 — 2026-09-03
<!-- Version history (append-only, never rewrite old entries):
v0.1 2026-09-03 — working screen and two panels; decisions carried over
from the planning chat (interactive prototype of 2026-09-02, verified in
a browser).
v0.2 2026-09-03 — translated to English per user decision; content
unchanged.
-->

The app is one working screen (10.6" tablet, landscape, two columns) plus
two slide-in panels. All UI copy is Russian.

## Working screen — left
1. Route picker R20890-024…029.
2. POI list 1…197: number, progress bar, "осталось N". Row turns green at
   70/70, red on error, active POI highlighted.
3. Bottom summary: "Сделано N · осталось M", count of finished POIs and
   errors.

## Working screen — right
4. Large active POI number, "N из 70" counter, small N/S/W/E and ←/↑/→
   counters.
5. Three big round maneuver buttons ← ↑ →; "straight" sits higher than
   its neighbors.
6. Tap a maneuver → four approach sides bloom around that button as a
   compass: N above, S below, W left, E right. Other maneuvers dim
   meanwhile.
7. Tap a side → the pass is recorded as a whole, vibration, toast
   "Записано: ← с юга · N из 70". Sides hide.
8. "Передумал" is visible only while the compass is open. Tapping the same
   maneuver again also closes it. Auto-close after 12 s — nothing
   recorded, with a notice.
9. "Отменить последний" — rolls back a whole pass, repeatable within the
   POI; available-undo count in parentheses.
10. A POI at 70/70 or with a spreadsheet error — maneuver buttons locked,
    with a caption saying why.
11. The screen stays awake while the app is open.

## "История" panel
12. Pass list: "этот POI / весь маршрут" toggle; each entry shows time and
    "maneuver + side".
13. Every pass has "Удалить". A deleted pass stays in the list,
    struck-through, marked "удалён".
14. Passes entered earlier by hand in the spreadsheet are not shown — they
    are corrected in the spreadsheet.

## "Таблица" panel (mailbox connection)
15. Mailbox URL and password (stored on the tablet only), "Проверить
    связь", "Загрузить из таблицы", "Отправить сейчас".
16. Sync status always visible on the working screen: "Всё отправлено /
    N проездов ждут сеть / Нет связи". No data is lost meanwhile.
17. Theme: system / light / dark.
18. "Стереть всё на планшете" — with confirmation and a warning about
    undelivered passes; the spreadsheet is not touched.

Open: who taps in the car (driver or a second person) — affects button
sizes and placement. Step-2 candidates: 3×4 grid (one tap per pass),
"repeat last", GPS/auto-POI from GPX.
