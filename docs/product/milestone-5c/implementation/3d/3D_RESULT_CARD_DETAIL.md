# 3D Result Card and Detail

Cards show only available name, category/address, device-relative distance, and source summary. Manual-city queries use governed city anchors for provider search but suppress distance because the anchor is not the user.

Detail conditionally exposes address, description, Directions, Call, Website, Ask Naero, SourceSummary, and SourceSheet. URLs allow only HTTP(S), phone values use a restricted public format, and Directions requires coordinates. Save is omitted: current `savedPlaces` state is not persistently backed or stable enough for a truthful 3D promise.
