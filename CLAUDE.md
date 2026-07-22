# RestosVisites — règles pour Claude

- Toujours respecter la Clean Architecture : `Domain` ne dépend de rien, `Application` ne dépend que de `Domain`, `Infrastructure` dépend d'`Application`, `Api` dépend d'`Application` et `Infrastructure`. Jamais de dépendance dans le sens inverse.
- Toujours utiliser la dernière version stable des technologies du projet (.NET, React, Vite, TypeScript, packages NuGet/npm) quand on ajoute ou met à jour une dépendance — pas de version dépréciée par confort. Actuellement : .NET 10, React 19, Vite 8, TypeScript ~6.
