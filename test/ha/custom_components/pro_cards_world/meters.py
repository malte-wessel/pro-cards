"""The energy meters' readings and statistics (pure: no Home Assistant imports).

world.json carries each meter's reading at the start of every hour from `first`; the reading counts
from the docs world's fixed origin, so it is the same on every start, whenever `first` is.
"""

from __future__ import annotations

from datetime import UTC, datetime

HOUR = 3600
SHORT_TERM = 300  # the recorder's short-term statistics: five minutes


def reading_at(world: dict, meter: dict, ts: float, decimals: int | None = None) -> float:
    """The meter's state at a time (seconds): straight between its hourly readings, rounded as
    its sensor shows it."""
    readings = meter["readings"]
    at = (ts - world["first"] / 1000) / HOUR
    i = max(0, min(int(at), len(readings) - 2))
    frac = max(0.0, min(1.0, at - i))
    value = readings[i] + (readings[i + 1] - readings[i]) * frac
    return round(value, 2 if decimals is None else decimals)


def meter_statistics(
    world: dict, meter: dict, now: float, decimals: int | None = None
) -> tuple[list[dict], dict]:
    """The meter's statistics as the recorder would have them at `now` (seconds).

    Every hour that ended since `first` (long-term), and the last five minutes that ended
    (short-term). `state` and `sum` are the reading at the period's end: a sum that does not depend
    on `first` stays the same on every start, so an import never lowers the hours imported before.
    The recorder counts a meter's sum on from its latest short-term statistic (from zero without
    one), so the short-term row lets its own hours continue the imported sum; its state is the
    sensor's, rounded alike, so the sensor's next state never counts as less.
    """
    first = world["first"] / 1000
    readings = meter["readings"]
    ended = int(now // HOUR) - int(first // HOUR)
    hours = [
        {
            "start": datetime.fromtimestamp(first + i * HOUR, UTC),
            "state": readings[i + 1],
            "sum": readings[i + 1],
        }
        for i in range(max(0, min(ended, len(readings) - 1)))
    ]
    end = now - now % SHORT_TERM
    value = reading_at(world, meter, end, decimals)
    short = {"start": datetime.fromtimestamp(end - SHORT_TERM, UTC), "state": value, "sum": value}
    return hours, short
