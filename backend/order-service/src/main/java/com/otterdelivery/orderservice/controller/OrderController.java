package com.otterdelivery.orderservice.controller;

import com.otterdelivery.orderservice.dto.CreateOrderRequest;
import com.otterdelivery.orderservice.model.Order;
import com.otterdelivery.orderservice.model.OrderItem;
import com.otterdelivery.orderservice.model.OrderStatus;
import com.otterdelivery.orderservice.service.OrderService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping(consumes = "application/json")
    public Order placeOrder(@RequestBody CreateOrderRequest request) {
        System.out.println("Request arrived");
        System.out.println(request.getCustomerId());
        System.out.println(request.getRestaurantId());
        System.out.println(request.getItems());

        return orderService.placeOrder(
                request.getCustomerId(),
                request.getRestaurantId(),
                request.getItems()
        );
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/{id}")
    public Order viewOrder(@PathVariable Long id) {
        return orderService.getOrderById(id);
    }

    @PutMapping("/{id}")
    public Order updateOrder(@PathVariable Long id,
                             @RequestBody List<OrderItem> items) {
        return orderService.updateOrder(id, items);
    }

    @PatchMapping("/{id}/status")
    public Order updateStatus(@PathVariable Long id,
                              @RequestBody OrderStatus status) {
        return orderService.updateStatus(id, status);
    }

    @GetMapping("/customer/{customerId}")
    public List<Order> getOrdersByCustomer(@PathVariable Long customerId) {
        return orderService.getOrdersByCustomerId(customerId);
    }
}
