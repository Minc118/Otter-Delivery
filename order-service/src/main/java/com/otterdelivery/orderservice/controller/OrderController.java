package com.otterdelivery.orderservice.controller;

import com.otterdelivery.orderservice.model.Order;
import com.otterdelivery.orderservice.model.OrderItem;
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

    @PostMapping
    public Order placeOrder(@RequestBody List<OrderItem> items) {
        return orderService.placeOrder(1L, 1L, items);
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
}