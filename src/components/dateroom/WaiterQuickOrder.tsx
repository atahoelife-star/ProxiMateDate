import { courseLabel, getRestaurant, RESTAURANTS, type Course, type OrderLine, type RestaurantId } from '../../data/menus'

const COURSES: Course[] = ['appetizer', 'entree', 'dessert']

export function WaiterQuickOrder({
  youRestaurant,
  partnerRestaurant,
  partnerName,
  onAdd,
}: {
  youRestaurant: RestaurantId
  partnerRestaurant: RestaurantId
  partnerName: string
  onAdd: (line: Omit<OrderLine, 'lineId'>) => void
}) {
  const yours = getRestaurant(youRestaurant)
  const theirs = getRestaurant(partnerRestaurant)
  return (
    <div className="mt-6 pt-6 border-t border-[#3A2F36]">
      <div className="text-xs tracking-widest text-[#C9A962] mb-3">ORDER STARTER, ENTRÉE, OR DESSERT</div>
      <p className="text-[#A8988A] text-xs mb-4">
        Order for your plate from both kitchens. {yours.name} is selected for you
        {theirs.name !== yours.name ? `; ${partnerName} picks ${theirs.name} on their screen` : ''}. The serving video matches your dish.
      </p>
      {COURSES.map((course) => (
        <div key={course} className="mb-5">
          <div className="text-[#F8F4ED] text-sm mb-2">{courseLabel(course)}</div>
          {RESTAURANTS.map((restaurant) => (
            <div key={`${course}-${restaurant.id}`} className="mb-3">
              <div className="text-[11px] tracking-widest text-[#A8988A] mb-1.5">{restaurant.name}</div>
              <div className="flex flex-wrap gap-2">
                {restaurant.items
                  .filter((item) => item.course === course)
                  .map((item) => (
                    <button
                      key={`${course}-${item.id}`}
                      type="button"
                      className="text-xs px-3 py-2 rounded-full border border-[#3A2F36] hover:border-[#C9A962]"
                      onClick={() =>
                        onAdd({
                          restaurantId: restaurant.id,
                          restaurantName: restaurant.name,
                          itemId: item.id,
                          name: item.name,
                          price: item.price,
                          course: item.course,
                          forTwo: item.forTwo,
                          seat: item.forTwo ? 'table' : 'you',
                        })
                      }
                    >
                      {item.name}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
