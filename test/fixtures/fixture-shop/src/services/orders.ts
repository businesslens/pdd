export class OrderService {
  submit(cart: unknown) { return { ok: true, cart } }
  refund(orderId: string) { return { orderId } }
}
