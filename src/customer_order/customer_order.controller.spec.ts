import { ForbiddenException } from '@nestjs/common';
import { CustomerOrderController } from './customer_order.controller';
import { CustomerOrderService } from './customer_order.service';

describe('CustomerOrderController order history authorization', () => {
  const findOrderHistory = jest.fn();
  const service = {
    findOrderHistory,
  } as unknown as CustomerOrderService;
  const controller = new CustomerOrderController(service);

  beforeEach(() => {
    findOrderHistory.mockReset();
  });

  // ============= Authenticated Customer Order History Authorization =============
  it('returns history only when the requested customer matches the JWT customer', async () => {
    const history = [{ order_id: 12 }];
    findOrderHistory.mockResolvedValue(history);

    await expect(
      controller.findOrderHistory({ user: { customer_id: 7 } }, '7'),
    ).resolves.toEqual(history);
    expect(findOrderHistory).toHaveBeenCalledWith('7');
  });

  it('denies access when the requested customer differs from the JWT customer', async () => {
    await expect(
      controller.findOrderHistory({ user: { customer_id: 7 } }, '8'),
    ).rejects.toThrow(
      new ForbiddenException('You can only access your own orders'),
    );
    expect(findOrderHistory).not.toHaveBeenCalled();
  });
});
