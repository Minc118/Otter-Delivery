package com.otterdelivery.orderservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.otterdelivery.orderservice.client.RestaurantClient;
import com.otterdelivery.orderservice.dto.CreateOrderRequest;
import com.otterdelivery.orderservice.dto.FoodItemResponseDTO;
import com.otterdelivery.orderservice.model.Order;
import com.otterdelivery.orderservice.model.OrderItem;
import com.otterdelivery.orderservice.model.OrderStatus;
import com.otterdelivery.orderservice.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:order-controller-tests;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
class OrderControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
    }

    @Test
    void canPlaceOrderAndGetDetailsAndHistory() throws Exception {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setCustomerId(10L);
        request.setRestaurantId(14L);
        request.setItems(List.of(new OrderItem(201L, null, 2, null)));

        // Place order
        String responseContent = mockMvc.perform(post("/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.customerId").value(10))
                .andExpect(jsonPath("$.totalPrice").value(27.80))
                .andReturn().getResponse().getContentAsString();

        Order order = objectMapper.readValue(responseContent, Order.class);
        Long orderId = order.getId();

        // Get single order details
        mockMvc.perform(get("/orders/" + orderId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(orderId))
                .andExpect(jsonPath("$.customerId").value(10));

        // Get customer history
        mockMvc.perform(get("/orders/customer/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(orderId));

        // Get all orders
        mockMvc.perform(get("/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // Update order items
        mockMvc.perform(put("/orders/" + orderId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(new OrderItem(201L, "Updated Pho", 3, 13.90)))))
                .andExpect(status().isOk());

        // Patch order status
        mockMvc.perform(patch("/orders/" + orderId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(OrderStatus.PREPARING)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PREPARING"));
    }

    @TestConfiguration
    static class TestConfig {
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
