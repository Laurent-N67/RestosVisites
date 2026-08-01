# RestosVisites — règles pour Claude

- Toujours respecter la Clean Architecture : `Domain` ne dépend de rien, `Application` ne dépend que de `Domain`, `Infrastructure` dépend d'`Application`, `Api` dépend d'`Application` et `Infrastructure`. Jamais de dépendance dans le sens inverse.
- Toujours utiliser la dernière version stable des technologies du projet (.NET, React, Vite, TypeScript, packages NuGet/npm) quand on ajoute ou met à jour une dépendance — pas de version dépréciée par confort. Actuellement : .NET 10, React 19, Vite 8, TypeScript ~6.
- L'utilisateur autorise à l'avance toutes les modifications de code (édition/création de fichiers) et l'exécution de commandes bash dans ce projet, sans demande de confirmation préalable. Cela ne couvre pas les actions destructives ou irréversibles (ex. `git push --force`, `git reset --hard`, suppression de branches, `rm -rf`) ni les actions affectant des systèmes partagés (push, PR, etc.), qui restent soumises à confirmation.
