import OrderConfirmationPage from "@/components/store/OrderConfirmationPage";

export const metadata = { title: "Order confirmation" };

export default async function OrderConfirmationRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderConfirmationPage orderId={id} />;
}
