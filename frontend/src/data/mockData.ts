export const stats = [
{ id: 1, label: 'U-Reporters Actifs', value: '9 840+' },
{ id: 2, label: 'Événements Organisés', value: '120+' },
{ id: 3, label: 'Partenaires Locaux', value: '15' },
{ id: 4, label: 'Quartiers Touchés', value: '24' }];


export const events = [
{
  id: '1',
  title: "Campagne de Sensibilisation sur l'Hygiène",
  date: '2023-11-15',
  time: '08:00 - 14:00',
  location: "Lycée Classique d'Abidjan, Cocody",
  image:
  'https://images.unsplash.com/photo-1544027993-37dbfe43562a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  description:
  "<p>Rejoignez-nous pour sensibiliser les élèves aux bonnes pratiques d'hygiène en milieu scolaire.</p><h3>Programme :</h3><ul><li>Ateliers de lavage des mains</li><li>Distribution de kits d'hygiène</li><li>Conférence sur la santé environnementale</li></ul>",
  status: 'upcoming',
  category: 'Santé',
  capacity: 50,
  registered: 32
},
{
  id: '2',
  title: 'Formation en Leadership Jeunesse',
  date: '2023-11-22',
  time: '09:00 - 16:00',
  location: 'INSAAC, Cocody',
  image:
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  description:
  "<p>Atelier intensif sur le leadership et la gestion de projets. Nous aborderons les thèmes suivants :</p><ul><li>Prise de parole en public</li><li>Confiance en soi</li><li>Méthodologie de projet communautaire</li></ul>",
  status: 'upcoming',
  category: 'Formation',
  capacity: 30,
  registered: 28
},
{
  id: '3',
  title: 'Nettoyage de la Baie de Cocody',
  date: '2023-10-05',
  time: '07:00 - 12:00',
  location: 'Baie de Cocody',
  image:
  'https://images.unsplash.com/photo-1618477461853-cf6ed80fbea5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  description:
  'Action citoyenne de ramassage de déchets plastiques le long de la baie. Ensemble, protégeons notre environnement urbain.',
  status: 'past',
  category: 'Environnement',
  spots: 100,
  registered: 100
}];


export const articles = [
{
  id: '1',
  title: "L'impact de l'engagement citoyen chez les jeunes de Cocody",
  excerpt:
  'Découvrez comment les jeunes transforment leur communauté à travers des actions concrètes et un engagement quotidien.',
  content:
  "L'engagement citoyen n'est pas qu'un vain mot pour la jeunesse de Cocody. Chaque jour, des dizaines de jeunes se mobilisent pour répondre aux défis locaux. Que ce soit à travers des campagnes de salubrité, des séances de soutien scolaire ou des ateliers de sensibilisation, l'impact est réel et mesurable. Dans cet article, nous explorons les différentes facettes de cet engagement et donnons la parole à ceux qui font bouger les lignes.",
  date: '12 Octobre 2023',
  author: 'Marie K.',
  category: 'Engagement',
  image:
  'https://images.unsplash.com/photo-1529390079861-591de354faf5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
},
{
  id: '2',
  title: 'Retour sur notre campagne de don de sang',
  excerpt:
  'Une mobilisation exceptionnelle qui a permis de récolter plus de 200 poches de sang pour les hôpitaux de la commune.',
  content:
  "Le week-end dernier, la communauté U-Report Cocody s'est réunie pour une cause vitale : le don de sang. En partenariat avec le Centre National de Transfusion Sanguine, nous avons organisé une grande collecte au sein de l'Université Félix Houphouët-Boigny. Le résultat a dépassé toutes nos attentes avec plus de 200 poches récoltées. Un grand merci à tous les donneurs !",
  date: '28 Septembre 2023',
  author: 'Jean-Paul Y.',
  category: 'Santé',
  image:
  'https://images.unsplash.com/photo-1615461066841-6116e61058f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
},
{
  id: '3',
  title: 'Comment devenir un U-Reporter actif ?',
  excerpt:
  'Guide pratique pour rejoindre le mouvement et commencer à faire entendre votre voix dans votre communauté.',
  content:
  "Vous souhaitez vous engager mais vous ne savez pas par où commencer ? Devenir U-Reporter est simple, gratuit et ouvert à tous. Il suffit de s'inscrire via SMS ou sur nos plateformes numériques. Une fois inscrit, vous pourrez participer à nos sondages, donner votre avis sur les questions de société et rejoindre nos actions sur le terrain. Voici les 5 étapes clés pour démarrer votre parcours d'engagement.",
  date: '15 Septembre 2023',
  author: 'Équipe U-Report',
  category: 'Guide',
  image:
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
}];


export const partners = [
  {
    id: 1,
    name: "UNICEF Côte d'Ivoire",
    type: 'Institutionnel',
    website: 'unicef.org/cotedivoire',
    logo: '/images/logo-unicef.jpg'
  },
  {
    id: 2,
    name: 'Mairie de Cocody',
    type: 'Gouvernemental',
    website: 'mairiecocody.ci',
    logo: '/images/mairie-cocody.jpg'
  },
  {
    id: 3,
    name: 'Ministère de la Jeunesse',
    type: 'Gouvernemental',
    website: 'jeunesse.gouv.ci',
    logo: '/images/ministere-jeunesse.jpg'
  },
  {
    id: 5,
    name: 'Orange CI',
    type: 'Sponsor Privé',
    website: 'orange.ci',
    logo: '/images/orange-ci.jpg'
  },
  {
    id: 6,
    name: 'Université FHB',
    type: 'Académique',
    website: 'univ-fhb.edu.ci',
    logo: '/images/ufhb.jpg'
  }
];


export const testimonials = [
{
  id: 1,
  name: 'Awa Diarrassouba',
  role: 'Étudiante, U-Reporter depuis 2 ans',
  content:
  "U-Report m'a donné la plateforme pour exprimer mes idées et participer activement au développement de mon quartier à la Riviera. C'est une expérience transformatrice.",
  avatar:
  'https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
},
{
  id: 2,
  name: 'Kouassi Franck',
  role: 'Jeune Entrepreneur',
  content:
  "Les formations en leadership organisées par la communauté m'ont aidé à structurer mon projet d'entreprise sociale. Le réseau d'entraide est incroyable.",
  avatar:
  'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
},
{
  id: 3,
  name: 'Sarah Koné',
  role: 'Bénévole Santé',
  content:
  "Participer aux campagnes de sensibilisation m'a fait réaliser à quel point notre voix compte. Ensemble, nous pouvons vraiment changer les comportements.",
  avatar:
  'https://images.unsplash.com/photo-1531384441138-2736e62e0919?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
}];


export const galleryAlbums = [
{
  id: '1',
  title: "Journée de l'Environnement 2023",
  date: 'Juin 2023',
  cover:
  'https://images.unsplash.com/photo-1618477461853-cf6ed80fbea5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  photosCount: 24
},
{
  id: '2',
  title: 'Formation des Pairs Éducateurs',
  date: 'Août 2023',
  cover:
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  photosCount: 45
},
{
  id: '3',
  title: 'Campagne Don de Sang',
  date: 'Septembre 2023',
  cover:
  'https://images.unsplash.com/photo-1615461066841-6116e61058f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  photosCount: 18
},
{
  id: '4',
  title: 'Rencontre Communautaire Blockhauss',
  date: 'Octobre 2023',
  cover:
  'https://images.unsplash.com/photo-1529390079861-591de354faf5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  photosCount: 32
}];