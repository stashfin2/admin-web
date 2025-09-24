  import { createFileRoute } from '@tanstack/react-router'
  import PaymentGateway from '@/features/payment-gateway'
  import { ProtectedRoute } from '@/components/ProtectedRoute'
  
  export const Route = createFileRoute('/_authenticated/payment-gateway/')({
    component: () => (
      <ProtectedRoute requiredService="payment-gateway">
        <PaymentGateway />
      </ProtectedRoute>
    ),
  })