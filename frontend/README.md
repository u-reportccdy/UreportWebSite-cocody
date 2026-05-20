# U-Report Cocody - Frontend

Ce dossier contient l'application web côté client de la plateforme U-Report Cocody. Il offre une interface moderne, performante et responsive, séparée entre un espace public pour les jeunes engagés et un tableau de bord d'administration.

## 🛠 Stack Technique

- **Framework** : [React 18](https://react.dev/)
- **Outil de Build** : [Vite](https://vitejs.dev/)
- **Langage** : [TypeScript](https://www.typescriptlang.org/)
- **Styling** : [Tailwind CSS v4](https://tailwindcss.com/)
- **Routage** : [React Router v6](https://reactrouter.com/)
- **Animations** : [Framer Motion](https://www.framer.com/motion/)
- **Icônes** : [Lucide React](https://lucide.dev/)
- **Graphiques** : [Recharts](https://recharts.org/) (pour le dashboard admin)

## 📂 Structure des dossiers

```text
frontend/
├── public/                 # Assets statiques globaux
└── src/
    ├── assets/             # Images et ressources locales
    ├── components/         # Composants React
    │   ├── admin/          # Spécifiques à l'espace administrateur
    │   ├── public/         # Spécifiques à l'espace public
    │   └── ui/             # Composants génériques et réutilisables (Button, Card, Input)
    ├── data/               # Données mockées (actuellement mockData.ts)
    ├── layouts/            # Layouts maîtres (PublicLayout, AdminLayout)
    ├── pages/              # Vues complètes (Home, Dashboard, etc.)
    ├── routes/             # Configuration des routes (AppRouter.tsx)
    └── types/              # Définitions des interfaces TypeScript
```

## 📜 Scripts Disponibles

Dans ce répertoire, vous pouvez lancer :

- `npm run dev`: Lance le serveur de développement local avec Fast Refresh.
- `npm run build`: Compile l'application TypeScript et génère le bundle de production Vite.
- `npm run preview`: Permet de prévisualiser localement le build de production généré.

## 💡 Remarques
Actuellement, les données affichées (articles, événements, statistiques) proviennent exclusivement du fichier mocké central `src/data/mockData.ts`. La prochaine étape du développement sera de connecter ces flux d'informations directement aux API du backend.
