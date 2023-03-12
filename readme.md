## Routes

/v2/content         -- ContentUsage events
/v2/menu            -- MenuSection and MenuSectionItem selection events
/v2/zone            -- Zone entered events
/v2/platform        -- device platform (IOS/ANDROID, from appInfo events)
/v2/appVersion      -- mobile app version (from appInfo events)
/v2/osVersion       -- operating system version (from appInfo events)
/v2/device          -- user's device (from appInfo events)
/v2/systemLocale    -- user's locale (from appInfo events)

## URL query patameters

### sum

Calculates totals for events that occured within a certain "time bucket"

possible values:

      - byYear
      - byMonth (default)
      - byDay
      - byHour

* Example *

    `/v2/platform?sum=byYear`

Lists platform popularity by year

### from

ISO timestamp of earliest event that should be included in the results.

Possible formats:
    
    `yyyy`      -- short for January 1st of the specified year
    `yyyy-mm`   -- short for the 1st day of the specified month
    `yyy-mm-dd` -- fully specified date

* Example *

    `/v2/menu?sum=byMonth&from=2023-02`

Return menu selection events that occured on or after Feb 1st 2023. Calculate monthly totals.

### to

ISO timestamp of first event NOT to be included in the results. `[from, to[` form a half-open interval. Supports the same formats as `from`.

* Example *

    `/v2/zone?sum=byHour&from=2023-02&to=2023-03`

Hourly totals of zone enter events in February 2023.

