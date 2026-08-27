import { useState } from 'react'
import {
  courseLabel,
  formatPrice,
  getRestaurant,
  orderTotal,
  type Course,
  type MenuItem,
  type OrderLine,
  type RestaurantId,
  type Seat,
  RESTAURANTS,
} from '../../data/menus'
import { Check, UtensilsCrossed, X } from 'lucide-react'

type DinnerMenusProps = {
  partnerName: string
  youRestaurant: RestaurantId
  partnerRestaurant: RestaurantId
  onYouRestaurant: (id: RestaurantId) => void
  onPartnerRestaurant: (id: RestaurantId) => void
  youOrder: OrderLine[]
  partnerOrder: OrderLine[]
  tableOrder: OrderLine[]
  onAdd: (line: Omit<OrderLine, 'lineId'>) => void
  onRemove: (lineId: string) => void
}

const COURSES: Course[] = ['appetizer', 'entree', 'dessert']

export function DinnerMenus(props: DinnerMenusProps) {
  return (
    <section className="mt-10" id="dinner-menus">
      <div className="flex items-center gap-3 mb-3">
        <UtensilsCrossed className="w-5 h-5 text-[#C9A962]" />
        <div className="text-[#F8F4ED] text-xl tracking-tight">Tonight’s restaurants</div>
        <div className="flex-1 h-px bg-[#3A2F36]" />
      </div>
      <p className="text-[#A8988A] text-sm mb-6 max-w-3xl">
        One date. Two kitchens. Each of you picks a restaurant independently — vegan and steakhouse can share this table. Shared “for two” dishes are ordered for the table, not for one plate. Opening one menu does not reset the other order, the chat, or the video tiles.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        <SeatMenu
          seat="you"
          heading="YOU"
          restaurantId={props.youRestaurant}
          onRestaurant={props.onYouRestaurant}
          order={props.youOrder}
          onAdd={props.onAdd}
          onRemove={props.onRemove}
        />
        <SeatMenu
          seat="partner"
          heading={props.partnerName.toUpperCase()}
          restaurantId={props.partnerRestaurant}
          onRestaurant={props.onPartnerRestaurant}
          order={props.partnerOrder}
          onAdd={props.onAdd}
          onRemove={props.onRemove}
        />
      </div>

      <TableOrder lines={props.tableOrder} onRemove={props.onRemove} onAdd={props.onAdd} />
    </section>
  )
}

function SeatMenu({
  seat,
  heading,
  restaurantId,
  onRestaurant,
  order,
  onAdd,
  onRemove,
}: {
  seat: 'you' | 'partner'
  heading: string
  restaurantId: RestaurantId
  onRestaurant: (id: RestaurantId) => void
  order: OrderLine[]
  onAdd: (line: Omit<OrderLine, 'lineId'>) => void
  onRemove: (lineId: string) => void
}) {
  const restaurant = getRestaurant(restaurantId)
  const [pendingEntree, setPendingEntree] = useState<MenuItem | null>(null)

  const addItem = (item: MenuItem, side?: string) => {
    const targetSeat: Seat = item.forTwo ? 'table' : seat
    onAdd({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      itemId: item.id,
      name: item.name,
      price: item.price,
      course: item.course,
      forTwo: item.forTwo,
      side,
      seat: targetSeat,
    })
    setPendingEntree(null)
  }

  return (
    <div className="card p-6 flex flex-col min-h-[28rem]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-xs tracking-[2px] text-[#C9A962]">{heading}</div>
          <h3 className="text-[#F8F4ED] text-2xl mt-1">{restaurant.name}</h3>
          <p className="text-[#A8988A] text-sm mt-1">
            {restaurant.cuisine} · {restaurant.city}
          </p>
        </div>
      </div>

      <label className="text-xs tracking-widest text-[#A8988A] mb-1.5 block">RESTAURANT</label>
      <select
        className="input w-full mb-5"
        value={restaurantId}
        onChange={(e) => onRestaurant(e.target.value as RestaurantId)}
      >
        {RESTAURANTS.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <p className="text-[#A8988A] text-sm mb-5 italic">{restaurant.tagline}</p>

      {COURSES.map((course) => (
        <div key={course} className="mb-5">
          <div className="text-[#E8A0B8] text-xs tracking-[2px] mb-2">{courseLabel(course)}</div>
          {course === 'entree' && (
            <p className="text-[11px] text-[#7A6B5F] mb-2">
              Entrées include a side: {restaurant.sides.join('; ')}.
            </p>
          )}
          <ul className="space-y-2">
            {restaurant.items
              .filter((item) => item.course === course)
              .map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[#F8F4ED] text-sm">
                      {item.name}
                      {item.forTwo && (
                        <span className="ml-2 text-[10px] tracking-widest text-[#C9A962]">FOR THE TABLE</span>
                      )}
                    </div>
                    <div className="text-[#A8988A] text-xs">{formatPrice(item.price)}</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost text-xs px-3 py-1.5 shrink-0"
                    onClick={() => {
                      if (item.course === 'entree' && !item.forTwo) {
                        setPendingEntree(item)
                      } else {
                        addItem(item)
                      }
                    }}
                  >
                    {item.forTwo ? 'Share' : 'Add'}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}

      {pendingEntree && (
        <div className="mt-auto border border-[#C9A962]/40 rounded-2xl p-4 bg-[#0F0A0D]/50">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-xs text-[#C9A962] tracking-widest">CHOOSE A SIDE</div>
              <div className="text-[#F8F4ED]">{pendingEntree.name}</div>
            </div>
            <button type="button" onClick={() => setPendingEntree(null)} aria-label="Cancel side">
              <X className="w-4 h-4 text-[#A8988A]" />
            </button>
          </div>
          <div className="space-y-2">
            {restaurant.sides.map((side) => (
              <button
                key={side}
                type="button"
                className="w-full text-left text-sm p-3 rounded-xl border border-[#3A2F36] hover:border-[#C9A962]"
                onClick={() => addItem(pendingEntree, side)}
              >
                {side}
              </button>
            ))}
          </div>
        </div>
      )}

      <SeatCheck order={order} heading={`${heading} — this plate`} onRemove={onRemove} />
    </div>
  )
}

function SeatCheck({
  order,
  heading,
  onRemove,
}: {
  order: OrderLine[]
  heading: string
  onRemove: (lineId: string) => void
}) {
  return (
    <div className="mt-4 pt-4 border-t border-[#3A2F36]">
      <div className="text-xs tracking-widest text-[#A8988A] mb-2">{heading}</div>
      {order.length === 0 ? (
        <p className="text-[#7A6B5F] text-sm">Nothing on this plate yet.</p>
      ) : (
        <ul className="space-y-2">
          {order.map((line) => (
            <li key={line.lineId} className="flex justify-between gap-2 text-sm">
              <span className="text-[#EDE4D9]">
                {line.name}
                {line.side ? <span className="text-[#A8988A]"> · {line.side}</span> : null}
              </span>
              <span className="flex items-center gap-2 shrink-0">
                {formatPrice(line.price)}
                <button type="button" onClick={() => onRemove(line.lineId)} aria-label={`Remove ${line.name}`}>
                  <X className="w-3.5 h-3.5 text-[#A8988A]" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="text-right text-sm text-[#C9A962] mt-2">Plate {formatPrice(orderTotal(order))}</div>
    </div>
  )
}

function TableOrder({
  lines,
  onRemove,
  onAdd,
}: {
  lines: OrderLine[]
  onRemove: (lineId: string) => void
  onAdd: (line: Omit<OrderLine, 'lineId'>) => void
}) {
  const shared = RESTAURANTS.flatMap((r) =>
    r.items
      .filter((item) => item.forTwo)
      .map((item) => ({ restaurant: r, item })),
  )

  return (
    <div className="card p-6 mt-6">
      <div className="flex items-center gap-2 mb-2">
        <Check className="w-4 h-4 text-[#C9A962]" />
        <h3 className="text-[#F8F4ED] text-xl">Shared for the table</h3>
      </div>
      <p className="text-[#A8988A] text-sm mb-4">
        Cauliflower for two from The Verdant Ember, or the tomahawk from The Silver Sage — both can sit on this table in one session.
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        {shared.map(({ restaurant, item }) => (
          <button
            key={item.id}
            type="button"
            className="text-left p-4 rounded-2xl border border-[#3A2F36] hover:border-[#C9A962]"
            onClick={() =>
              onAdd({
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                itemId: item.id,
                name: item.name,
                price: item.price,
                course: item.course,
                forTwo: true,
                seat: 'table',
              })
            }
          >
            <div className="text-[10px] tracking-widest text-[#C9A962]">{restaurant.name}</div>
            <div className="text-[#F8F4ED]">{item.name}</div>
            <div className="text-[#A8988A] text-sm">{formatPrice(item.price)}</div>
          </button>
        ))}
      </div>
      {lines.length === 0 ? (
        <p className="text-[#7A6B5F] text-sm">No shared dishes yet.</p>
      ) : (
        <ul className="space-y-2">
          {lines.map((line) => (
            <li key={line.lineId} className="flex justify-between gap-2 text-sm">
              <span className="text-[#EDE4D9]">
                {line.name} <span className="text-[#A8988A]">· {line.restaurantName}</span>
              </span>
              <span className="flex items-center gap-2">
                {formatPrice(line.price)}
                <button type="button" onClick={() => onRemove(line.lineId)} aria-label={`Remove ${line.name}`}>
                  <X className="w-3.5 h-3.5 text-[#A8988A]" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="text-right text-sm text-[#C9A962] mt-2">Table {formatPrice(orderTotal(lines))}</div>
    </div>
  )
}
