// ==========================================
// 1. HOME PAGE IMAGES (milkp.png, curdp.png, etc.)
// ==========================================
import milkHomeImg from '../assets/milkp.png';
import curdHomeImg from '../assets/curdp.png';
import yogurtHomeImg from '../assets/yogurtp.png';
import paneerHomeImg from '../assets/paneerp.png';
import butterHomeImg from '../assets/butterp.png';
import eggHomeImg from '../assets/eggp.png';
import gheeHomeImg from '../assets/gheep.png';

// ==========================================
// 2. PRODUCT CARD / CATALOG IMAGES (milk.png, curd.png, etc.)
// ==========================================
import milkProductImg from '../assets/milk.png';
import curdProductImg from '../assets/curd.png';
import yogurtProductImg from '../assets/yogurts.png';
import paneerProductImg from '../assets/paneer.png';
import butterProductImg from '../assets/butter.png';
import eggProductImg from '../assets/egg.png';
import gheeProductImg from '../assets/ghee.png';

// Array for Home Page display
export const HOME_PRODUCTS = [
  {
    id: 'milk',
    name: 'Fresh Farm Milk',
    price: 65,
    unit: '1 LTR',
    image: milkHomeImg,
    tags: ['Pure', 'Fresh Daily'],
    description: 'Unadulterated, farm-fresh whole milk delivered straight to your doorstep every morning.',
  },
  {
    id: 'curd',
    name: 'Farm Fresh Curd',
    price: 40,
    unit: '400 ML',
    image: curdHomeImg,
    tags: ['Traditional', 'Probiotic'],
    description: 'Creamy and naturally set curd prepared with traditional methods for delicious taste.',
  },
  {
    id: 'yogurt',
    name: 'Natural Yogurt',
    price: 45,
    unit: '400 ML',
    image: yogurtHomeImg,
    tags: ['Low Fat', 'Healthy'],
    description: 'Smooth, thick, and healthy probiotic yogurt packed with essential daily nutrition.',
  },
  {
    id: 'paneer',
    name: 'Homemade Malai Paneer',
    price: 100,
    unit: '150 GM',
    image: paneerHomeImg,
    tags: ['Soft', 'Protein Rich'],
    description: 'Soft, melt-in-the-mouth cottage cheese churned fresh daily from pure whole milk.',
  },
  {
    id: 'butter',
    name: 'Traditional White Butter',
    price: 90,
    unit: '100 GM',
    image: butterHomeImg,
    tags: ['Hand Churned', 'Authentic'],
    description: 'Hand-churned fresh white butter made with authentic rural techniques.',
  },
  {
    id: 'egg',
    name: 'Farm Fresh Eggs',
    price: 100,
    unit: '12 EGGS',
    image: eggHomeImg,
    tags: ['Organic', 'High Protein'],
    description: 'Farm-raised fresh organic brown eggs packed with vital protein and nutrients.',
  },
  {
    id: 'ghee',
    name: 'Pure Desi Cow Ghee',
    price: 500,
    unit: '450 ML',
    image: gheeHomeImg,
    tags: ['Bilona Method', 'A2 Ghee'],
    description: 'Traditional bilona method churned pure cow ghee, rich in authentic aroma and nutrients.',
  }
];

// Array for Product Cards on /products page
export const PRODUCTS = [
  {
    id: 'milk',
    name: 'Fresh Farm Milk',
    price: 65,
    unit: '1 LTR',
    image: milkProductImg,
    tags: ['Pure', 'Fresh Daily', 'Organic'],
    description: 'Unadulterated, farm-fresh whole milk delivered straight to your doorstep every morning.',
  },
  {
    id: 'curd',
    name: 'Farm Fresh Curd',
    price: 40,
    unit: '400 ML',
    image: curdProductImg,
    tags: ['Traditional', 'Probiotic', 'Clay Pot'],
    description: 'Creamy and naturally set curd prepared with traditional methods for delicious taste.',
  },
  {
    id: 'yogurts',
    name: 'Natural Yogurt',
    price: 45,
    unit: '400 ML',
    image: yogurtProductImg,
    tags: ['Low Fat', 'Healthy', 'Protein'],
    description: 'Smooth, thick, and healthy probiotic yogurt packed with essential daily nutrition.',
  },
  {
    id: 'paneer',
    name: 'Homemade Malai Paneer',
    price: 100,
    unit: '150 GM',
    image: paneerProductImg,
    tags: ['Soft', 'Melt-in-mouth', 'Protein Rich'],
    description: 'Soft, melt-in-the-mouth cottage cheese churned fresh daily from pure whole milk.',
  },
  {
    id: 'butter',
    name: 'Traditional White Butter',
    price: 90,
    unit: '100 GM',
    image: butterProductImg,
    tags: ['Hand Churned', 'Authentic', 'Preservative Free'],
    description: 'Hand-churned fresh white butter made with authentic rural techniques.',
  },
  {
    id: 'egg',
    name: 'Farm Fresh Eggs',
    price: 100,
    unit: '12 EGGS',
    image: eggProductImg,
    tags: ['Organic', 'High Protein', 'Country Raised'],
    description: 'Farm-raised fresh organic brown eggs packed with vital protein and nutrients.',
  },
  {
    id: 'ghee',
    name: 'Pure Desi Cow Ghee',
    price: 500,
    unit: '450 ML',
    image: gheeProductImg,
    tags: ['Bilona Method', 'Rich Aroma', 'A2 Ghee'],
    description: 'Traditional bilona method churned pure cow ghee, rich in authentic aroma and nutrients.',
  }
];
