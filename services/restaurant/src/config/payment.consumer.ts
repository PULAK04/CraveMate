import axios from "axios";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import { getChannel } from "./rabbitmq.js";

export const startPaymentConsumer = async () => {
  const channel = getChannel();

  channel.consume(process.env.PAYMENT_QUEUE!, async (msg) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString());

      if (event.type !== "PAYMENT_SUCCESS") {
        channel.ack(msg);
        return;
      }

      const { orderId } = event.data;
      const existingOrder = await Order.findById(orderId);

      if (!existingOrder) {
        channel.ack(msg);
        return;
      }

      if (existingOrder.paymentStatus === "paid") {
        await Cart.deleteMany({ userId: existingOrder.userId, restaurantId: existingOrder.restaurantId });
        channel.ack(msg);
        return;
      }

      existingOrder.paymentStatus = "paid";
      existingOrder.status = "placed";
      await existingOrder.save();
      await Order.updateOne({ _id: existingOrder._id }, { $unset: { expiresAt: 1 } });

      // Clear the cart only after payment is confirmed.
      await Cart.deleteMany({ userId: existingOrder.userId, restaurantId: existingOrder.restaurantId });

      await axios.post(
        `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
        {
          event: "order:new",
          room: `restaurant:${existingOrder.restaurantId}`,
          payload: { orderId: existingOrder._id },
        },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
          },
        }
      );

      channel.ack(msg);
    } catch (error) {
      console.error("Payment consumer error:", error);
      // Do not acknowledge failed processing so RabbitMQ can retry it.
    }
  });
};
