---
kind: system
acts: external
references:
  - kind: code
    role: implementation
    target: src/services/payments.ts#PaymentGateway
---

# Payment gateway

The processor the store charges, which posts settlement and refund results back
to the Product.
