# 3A Truth and Context Model

`createContextValue(value, origin)` creates an immutable contextual value with canonical origin:

- `known`
- `user_selected`
- `permission_derived`
- `fetched`
- `unknown`

Unknown origin or absent values always produce `{value: null, origin: 'unknown', isKnown: false}`. `contextValueOrNull` never substitutes a name, city, country, location, arrival date, progress, deadline, recommendation, saved state or recent activity.

Future surfaces must construct context from explicit state and test `isKnown`; display fallbacks are setup opportunities or generic actions, never fictional values. `known` means authoritative application state, not model inference. `fetched` requires source metadata at the consuming boundary.

The model is deliberately lightweight and backend-independent. It prevents UI fabrication without prematurely defining Plan or profile database schemas.
