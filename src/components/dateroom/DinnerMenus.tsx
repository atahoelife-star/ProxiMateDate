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
    <section className="mt-10 table-linen scroll-mt-28" id="dinner-menus">
      <div className="flex items-center gap-3 mb-3">
        <UtensilsCrossed className="w-5 h-5 text-[#C9A962]" />
        <div className="text-[#F8F4ED] text-xl tracking-tight">Tonight’s table</div>
        <div className="flex-1 h-px bg-[#C9A962]/30" />
      </div>
      <p className="text-[#D4C4B4] text-sm mb-6 max-w-3xl">
        Both menus sit on this table — The Verdant Ember and The Silver Sage Steakhouse. Each of you orders on your own screen. Call Waiter brings what you picked, not their plate. Shared “for two” dishes are for the table.
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
    <div className="table-menu p-7 flex flex-col min-h-[28rem]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="menu-kicker">{heading}</div>
          <h3 className="menu-ink text-2xl mt-1">{restaurant.name}</h3>
          <p className="menu-muted text-sm mt-1">
            {restaurant.cuisine} · {restaurant.city}
          </p>
        </div>
      </div>

      <label className="menu-kicker mb-1.5 block">RESTAURANT</label>
      <select
        className="menu-select w-full mb-5"
        value={restaurantId}
        onChange={(e) => onRestaurant(e.target.value as RestaurantId)}
      >
        {RESTAURANTS.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <p className="menu-muted text-sm mb-5 italic">{restaurant.tagline}</p>

      {COURSES.map((course) => (
        <div key={course} className="mb-5">
          <div className="menu-course">{courseLabel(course)}</div>
          {course === 'entree' && (
            <p className="text-[11px] menu-muted mb-2">
              Entrées include a side: {restaurant.sides.join('; ')}.
            </p>
          )}
          <ul className="space-y-2">
            {restaurant.items
              .filter((item) => item.course === course)
              .map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3">
                  <div>
                    <div className="menu-ink text-sm">
                      {item.name}
                      {item.forTwo && (
                        <span className="ml-2 text-[10px] tracking-widest menu-gold">FOR THE TABLE</span>
                      )}
                    </div>
                    <div className="menu-muted text-xs">{formatPrice(item.price)}</div>
                  </div>
                  <button
                    type="button"
                    className="menu-add shrink-0"
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
        <div className="mt-auto border border-[#8a6d32]/40 rounded-sm p-4 bg-[#2c2118]/6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="menu-kicker">CHOOSE A SIDE</div>
              <div className="menu-ink">{pendingEntree.name}</div>
            </div>
            <button type="button" onClick={() => setPendingEntree(null)} aria-label="Cancel side">
              <X className="w-4 h-4 menu-muted" />
            </button>
          </div>
          <div className="space-y-2">
            {restaurant.sides.map((side) => (
              <button
                key={side}
                type="button"
                className="w-full text-left text-sm p-3 rounded-sm border border-[#c4a46a]/50 hover:border-[#8a6d32] menu-ink"
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
    <div className="mt-4 pt-4 border-t border-[#c4a46a]/40">
      <div className="menu-kicker mb-2">{heading}</div>
      {order.length === 0 ? (
        <p className="menu-muted text-sm">Nothing on this plate yet.</p>
      ) : (
        <ul className="space-y-2">
          {order.map((line) => (
            <li key={line.lineId} className="flex justify-between gap-2 text-sm">
              <span className="menu-ink">
                {line.name}
                {line.side ? <span className="menu-muted"> · {line.side}</span> : null}
              </span>
              <span className="flex items-center gap-2 shrink-0 menu-ink">
                {formatPrice(line.price)}
                <button type="button" onClick={() => onRemove(line.lineId)} aria-label={`Remove ${line.name}`}>
                  <X className="w-3.5 h-3.5 menu-muted" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="text-right text-sm menu-gold mt-2">Plate {formatPrice(orderTotal(order))}</div>
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
    <div className="table-menu p-7 mt-6">
      <div className="flex items-center gap-2 mb-2">
        <Check className="w-4 h-4 menu-gold" />
        <h3 className="menu-ink text-xl">Shared for the table</h3>
      </div>
      <p className="menu-muted text-sm mb-4">
        Cauliflower for two from The Verdant Ember, or the tomahawk from The Silver Sage — both can sit on this table in one session.
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        {shared.map(({ restaurant, item }) => (
          <button
            key={item.id}
            type="button"
            className="text-left p-4 rounded-sm border border-[#c4a46a]/45 hover:border-[#8a6d32]"
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
            <div className="menu-kicker">{restaurant.name}</div>
            <div className="menu-ink">{item.name}</div>
            <div className="menu-muted text-sm">{formatPrice(item.price)}</div>
          </button>
        ))}
      </div>
      {lines.length === 0 ? (
        <p className="menu-muted text-sm">No shared dishes yet.</p>
      ) : (
        <ul className="space-y-2">
          {lines.map((line) => (
            <li key={line.lineId} className="flex justify-between gap-2 text-sm">
              <span className="menu-ink">
                {line.name} <span className="menu-muted">· {line.restaurantName}</span>
              </span>
              <span className="flex items-center gap-2 menu-ink">
                {formatPrice(line.price)}
                <button type="button" onClick={() => onRemove(line.lineId)} aria-label={`Remove ${line.name}`}>
                  <X className="w-3.5 h-3.5 menu-muted" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="text-right text-sm menu-gold mt-2">Table {formatPrice(orderTotal(lines))}</div>
    </div>
  )
}
