// ==========================================
// PRODUCT CARD / CATALOG IMAGES
// ==========================================
import milkImg from '../assets/milk.png';
import curdImg from '../assets/curd.png';
import yogurtImg from '../assets/yogurts.png';
import paneerImg from '../assets/paneer.png';
import butterImg from '../assets/butter.png';
import eggImg from '../assets/egg.png';
import gheeImg from '../assets/ghee.png';

// Array for Product Cards and Catalog
export const PRODUCTS = [
  {
    id: 'milk',
    name: 'Fresh Farm Milk',
    price: 65,
    unit: '1 LTR',
    image: milkImg,
    tags: ['Pure', 'Fresh Daily', 'Organic'],
    description: 'Unadulterated, farm-fresh whole milk delivered straight to your doorstep every morning.',
  },
  {
    id: 'curd',
    name: 'Farm Fresh Curd',
    price: 40,
    unit: '400 ML',
    image: curdImg,
    tags: ['Traditional', 'Probiotic', 'Clay Pot'],
    description: 'Creamy and naturally set curd prepared with traditional methods for delicious taste.',
  },
  {
    id: 'yogurts',
    name: 'Natural Yogurt',
    price: 45,
    unit: '400 ML',
    image: yogurtImg,
    tags: ['Low Fat', 'Healthy', 'Protein'],
    description: 'Smooth, thick, and healthy probiotic yogurt packed with essential daily nutrition.',
  },
  {
    id: 'paneer',
    name: 'Homemade Malai Paneer',
    price: 100,
    unit: '150 GM',
    image: paneerImg,
    tags: ['Soft', 'Melt-in-mouth', 'Protein Rich'],
    description: 'Soft, melt-in-the-mouth cottage cheese churned fresh daily from pure whole milk.',
  },
  {
    id: 'butter',
    name: 'Traditional White Butter',
    price: 90,
    unit: '100 GM',
    image: butterImg,
    tags: ['Hand Churned', 'Authentic', 'Preservative Free'],
    description: 'Hand-churned fresh white butter made with authentic rural techniques.',
  },
  {
    id: 'egg',
    name: 'Farm Fresh Eggs',
    price: 100,
    unit: '12 EGGS',
    image: eggImg,
    tags: ['Organic', 'High Protein', 'Country Raised'],
    description: 'Farm-raised fresh organic brown eggs packed with vital protein and nutrients.',
  },
  {
    id: 'ghee',
    name: 'Pure Cow Ghee',
    price: 500,
    unit: '450 ML',
    image: gheeImg,
    tags: ['Bilona Method', 'Rich Aroma', 'A2 Ghee'],
    description: 'Traditional bilona method churned pure cow ghee, rich in authentic aroma and nutrients.',
  }
];