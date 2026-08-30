import { courseLabel, RESTAURANTS, type Course, type OrderLine } from '../../data/menus'

const COURSES: Course[] = ['appetizer', 'entree', 'dessert']

export function WaiterQuickOrder({
  partnerName,
  onAdd,
}: {
  partnerName: string
  onAdd: (line: Omit<OrderLine, 'lineId'>) => void
}) {
  return (
    <div className="mt-6 pt-6 border-t border-[#3A2F36]">
      <div className="text-xs tracking-widest text-[#C9A962] mb-3">ORDER STARTER, ENTRÉE, OR DESSERT</div>
      <p className="text-[#A8988A] text-xs mb-4">
        Order for your plate from both kitchens. {partnerName} orders on their screen. The serving
        video matches your dish — not theirs.
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
                          seat: 'you',
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
