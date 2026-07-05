package com.otterdelivery.orderservice;

import com.otterdelivery.orderservice.client.RestaurantClient;
import com.otterdelivery.orderservice.dto.FoodItemResponseDTO;
import com.otterdelivery.orderservice.model.Order;
import com.otterdelivery.orderservice.model.OrderItem;
import com.otterdelivery.orderservice.repository.OrderRepository;
import com.otterdelivery.orderservice.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:order-history-tests;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class OrderHistoryPersistenceTests {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
    }

    @Test
    void creatingOrderPersistsCustomerIdForHistoryLookup() {
        Order order = orderService.placeOrder(
                2L,
                14L,
                List.of(new OrderItem(101L, null, 2, null))
        );

        assertThat(order).isNotNull();
        assertThat(order.getCustomerId()).isEqualTo(2L);
        assertThat(order.getRestaurantId()).isEqualTo(14L);
        assertThat(order.getItems()).hasSize(1);
        assertThat(order.getItems().get(0).getItemName()).isEqualTo("Beef Pho");
        assertThat(order.getTotalPrice()).isEqualTo(27.80);

        List<Order> history = orderService.getOrdersByCustomerId(2L);

        assertThat(history).extracting(Order::getId).contains(order.getId());
    }

    @Test
    void customerHistoryDoesNotReturnOrdersForAnotherProfile() {
        Order profileOrder = orderService.placeOrder(
                2L,
                14L,
                List.of(new OrderItem(101L, null, 1, null))
        );
        Order otherOrder = orderService.placeOrder(
                3L,
                14L,
                List.of(new OrderItem(101L, null, 1, null))
        );

        List<Order> profileHistory = orderService.getOrdersByCustomerId(2L);

        assertThat(profileHistory).extracting(Order::getId).contains(profileOrder.getId());
        assertThat(profileHistory).extracting(Order::getId).doesNotContain(otherOrder.getId());
    }

    @Test
    void legacyOrderWithoutCustomerIdDoesNotBreakGeneralEndpoints() {
        OrderItem item = new OrderItem(101L, "Legacy Item", 1, 9.90);
        Order legacyOrder = new Order(null, 99L, List.of(item));
        item.setOrder(legacyOrder);
        Order saved = orderRepository.save(legacyOrder);

        assertThat(orderService.getOrderById(saved.getId())).isNotNull();
        assertThat(orderService.getAllOrders()).extracting(Order::getId).contains(saved.getId());
        assertThat(orderService.getOrdersByCustomerId(2L)).isEmpty();
    }

    @Test
    void anonymousOrdersAreRejectedForNewCheckoutRequests() {
        Order order = orderService.placeOrder(
                null,
                14L,
                List.of(new OrderItem(101L, null, 1, null))
        );

        assertThat(order).isNull();
        assertThat(orderRepository.findAll()).isEmpty();
    }

    @TestConfiguration
    static class TestRestaurantClientConfiguration {

        @Bean
        @Primary
        RestaurantClient testRestaurantClient() {
            return new RestaurantClient() {
                @Override
                public FoodItemResponseDTO getFoodItemById(Long id) {
                    FoodItemResponseDTO foodItem = new FoodItemResponseDTO();
                    foodItem.setId(id);
                    foodItem.setName("Beef Pho");
                    foodItem.setPrice(13.90);
                    foodItem.setAvailable(true);
                    return foodItem;
                }
            };
        }
    }
}
