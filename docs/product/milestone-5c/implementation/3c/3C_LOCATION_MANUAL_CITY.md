# 3C Location and Manual City

Foreground device location is requested only after “Use my location”. Permission-derived address fields retain `permission_derived` origin. Denial, dismissal, missing address, or disabled services lead to the reusable 3B state treatment and manual selection; requests are not looped.

Manual selection requires no GPS and records `user_selected`. The initial governed catalogue includes Austria/Vienna plus St. Pölten and Graz, and structurally identical Budapest, Paris, and Berlin paths. Vienna is represented as Austria → Vienna Land → Vienna municipality. The catalogue is seed data, not history or a claimed exhaustive provider result.
