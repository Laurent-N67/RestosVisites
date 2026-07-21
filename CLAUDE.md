# RestosVisites — règles pour Claude

- Ne jamais utiliser `var` en C# : toujours déclarer le type explicite (`string name = ...` et non `var name = ...`).
- Toujours respecter la Clean Architecture : `Domain` ne dépend de rien, `Application` ne dépend que de `Domain`, `Infrastructure` dépend d'`Application`, `Api` dépend d'`Application` et `Infrastructure`. Jamais de dépendance dans le sens inverse.
