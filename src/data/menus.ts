export type Course = 'appetizer' | 'entree' | 'dessert'
export type RestaurantId = 'verdant-ember' | 'silver-sage'
export type Seat = 'you' | 'partner' | 'table'

export type MenuItem = {
  id: string
  name: string
  price: number
  course: Course
  forTwo?: boolean
}

export type Restaurant = {
  id: RestaurantId
  name: string
  city: string
  cuisine: string
  tagline: string
  sides: string[]
  items: MenuItem[]
}

export type OrderLine = {
  lineId: string
  restaurantId: RestaurantId
  restaurantName: string
  itemId: string
  name: string
  price: number
  course: Course
  forTwo?: boolean
  side?: string
  seat: Seat
}

export const RESTAURANTS: Restaurant[] = [
  {
    id: 'verdant-ember',
    name: 'The Verdant Ember',
    city: 'Silver Springs, Nevada',
    cuisine: 'Intimate high-end vegan',
    tagline: 'Plant-based tasting, candlelight, no compromise.',
    sides: [
      'Truffle Cashew Mac & Cheese',
      'Roasted Asparagus with Aquafaba Hollandaise',
      'Garlic Whipped Potatoes with Herb Oil',
    ],
    items: [
      { id: 've-carpaccio', name: 'Marinated King Oyster Carpaccio', price: 26, course: 'appetizer' },
      { id: 've-polenta', name: 'Seared Saffron Polenta Cake', price: 24, course: 'appetizer' },
      { id: 've-mushroom-app', name: 'Wild Mushroom Medley', price: 26, course: 'appetizer' },
      { id: 've-medallion', name: 'Seared King Oyster Medallion', price: 48, course: 'entree' },
      { id: 've-lentil', name: 'Grilled Eggplant & Beluga Lentil Steak', price: 52, course: 'entree' },
      { id: 've-cauliflower', name: 'Whole Roasted Cauliflower Centerpiece for two', price: 95, course: 'entree', forTwo: true },
      { id: 've-palm', name: 'Mushroom Medallion & Hearts of Palm', price: 68, course: 'entree' },
      { id: 've-souffle', name: 'Dark Chocolate Soufflé', price: 18, course: 'dessert' },
      { id: 've-brulee', name: 'Tahitian Crème Brûlée', price: 16, course: 'dessert' },
    ],
  },
  {
    id: 'silver-sage',
    name: 'The Silver Sage Steakhouse',
    city: 'Silver Springs, Nevada',
    cuisine: 'Intimate high-end steakhouse',
    tagline: 'Dry-aged cuts, quiet booths, classic service.',
    sides: [
      'Truffle Mac & Cheese',
      'Roasted Asparagus with Hollandaise',
      'Garlic Whipped Potatoes',
    ],
    items: [
      { id: 'ss-carpaccio', name: 'Japanese A5 Wagyu Beef Carpaccio', price: 28, course: 'appetizer' },
      { id: 'ss-foie', name: 'Pan-Seared Foie Gras', price: 32, course: 'appetizer' },
      { id: 'ss-mushroom-app', name: 'Wild Mushroom Medley', price: 26, course: 'appetizer' },
      { id: 'ss-filet', name: '8oz Center-Cut Filet Mignon', price: 68, course: 'entree' },
      { id: 'ss-ribeye', name: '16oz Dry-Aged Bone-In Ribeye', price: 85, course: 'entree' },
      { id: 'ss-tomahawk', name: '32oz Long-Bone Tomahawk Ribeye for two', price: 195, course: 'entree', forTwo: true },
      { id: 'ss-surf', name: 'Classic Steak & Lobster', price: 98, course: 'entree' },
      { id: 'ss-souffle', name: 'Dark Chocolate Soufflé', price: 18, course: 'dessert' },
      { id: 'ss-brulee', name: 'Crème Brûlée', price: 16, course: 'dessert' },
    ],
  },
]

export function getRestaurant(id: RestaurantId): Restaurant {
  return RESTAURANTS.find((r) => r.id === id) ?? RESTAURANTS[0]
}

export function formatPrice(n: number): string {
  return `$${n.toFixed(2).replace(/\.00$/, '')}`
}

export function courseLabel(course: Course): string {
  if (course === 'appetizer') return 'Appetizers'
  if (course === 'entree') return 'Entrées'
  return 'Desserts'
}

export function orderTotal(lines: OrderLine[]): number {
  return lines.reduce((sum, line) => sum + line.price, 0)
}
