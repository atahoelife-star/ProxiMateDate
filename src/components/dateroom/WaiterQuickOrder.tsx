import { getRestaurant, type OrderLine, type RestaurantId } from '../../data/menus'

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
      <div className="text-xs tracking-widest text-[#C9A962] mb-3">ORDER FROM EITHER MENU</div>
      {(
        [
          { seat: 'you' as const, restaurant: yours, label: 'For you' },
          { seat: 'partner' as const, restaurant: theirs, label: `For ${partnerName}` },
        ] as const
      ).map(({ seat, restaurant, label }) => (
        <div key={seat} className="mb-4">
          <div className="text-[#F8F4ED] text-sm mb-2">
            {label} · {restaurant.name}
          </div>
          <div className="flex flex-wrap gap-2">
            {restaurant.items.slice(0, 4).map((item) => (
              <button
                key={`${seat}-${item.id}`}
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
                    seat: item.forTwo ? 'table' : seat,
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
  )
}
