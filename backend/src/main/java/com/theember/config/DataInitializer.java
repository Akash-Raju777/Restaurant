package com.theember.config;

import com.theember.entity.*;
import com.theember.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${ember.app.adminEmail:admin@theember.com}")
    private String adminEmail;

    @org.springframework.beans.factory.annotation.Value("${ember.app.adminPassword:}")
    private String adminPassword;

    @org.springframework.beans.factory.annotation.Value("${ember.app.customerEmail:customer@theember.com}")
    private String customerEmail;

    @org.springframework.beans.factory.annotation.Value("${ember.app.customerPassword:}")
    private String customerPassword;

    @Override
    public void run(String... args) throws Exception {
        logger.info("Verifying The Ember initial restaurant seed data...");

        // Verify / Seed Administrator
        User adminUser = userRepository.findByEmail(adminEmail).orElse(null);
        if (adminUser == null) {
            if (adminPassword != null && !adminPassword.trim().isEmpty()) {
                adminUser = new User(
                        "Master Chef Arjun / Administrator",
                        adminEmail,
                        passwordEncoder.encode(adminPassword.trim()),
                        "+91 98765 43210",
                        "ROLE_ADMIN"
                );
                userRepository.save(adminUser);
                logger.info("Created initial administrator account for email: {}", adminEmail);
            } else {
                logger.warn("Initial administrator creation skipped: EMBER_ADMIN_PASSWORD environment variable is not configured.");
            }
        } else {
            logger.info("Administrator account verified for email: {}", adminEmail);
        }

        // Verify / Seed Demo Customer
        User demoCustomer = userRepository.findByEmail(customerEmail).orElse(null);
        if (demoCustomer == null) {
            if (customerPassword != null && !customerPassword.trim().isEmpty()) {
                demoCustomer = new User(
                        "Rohan Sharma",
                        customerEmail,
                        passwordEncoder.encode(customerPassword.trim()),
                        "+91 91234 56789",
                        "ROLE_CUSTOMER"
                );
                demoCustomer = userRepository.save(demoCustomer);
                logger.info("Demo customer account created for email: {}", customerEmail);

                Address address = new Address();
                address.setUser(demoCustomer);
                address.setHouseDetails("Flat 402, Royal Palms Residency");
                address.setStreet("MG Road, Indiranagar");
                address.setArea("Indiranagar");
                address.setCity("Bengaluru");
                address.setState("Karnataka");
                address.setPostalCode("560038");
                address.setDeliveryInstructions("Ring bell twice");
                address.setIsDefault(true);
                addressRepository.save(address);
            }
        }

        // Seed Categories
        if (categoryRepository.count() == 0) {
            Category starters = categoryRepository.save(new Category("Starters", "starters", 1));
            Category mainCourse = categoryRepository.save(new Category("Main Course", "main-course", 2));
            Category biryani = categoryRepository.save(new Category("Biryani & Rice", "biryani", 3));
            Category desserts = categoryRepository.save(new Category("Desserts", "desserts", 4));
            Category beverages = categoryRepository.save(new Category("Beverages", "beverages", 5));
            logger.info("Seeded 5 food categories.");

            // Seed Menu Items strictly matching the reference image layout
            saveDish(starters, "Paneer Tikka", "paneer-tikka",
                    "Char-grilled cottage cheese cubes marinated in Kashmiri red chili, mustard oil, yogurt, and hand-ground spices.",
                    BigDecimal.valueOf(249.00), null, true, true, true,
                    "/images/food/paneer-tikka.png",
                    "Cottage Cheese, Kashmiri Chili, Yogurt, Mustard Oil, Garam Masala, Bell Peppers, Onions",
                    "Contains Dairy (Milk / Yogurt)", "Mild,Medium,Spicy", BigDecimal.valueOf(4.8), 420);

            MenuItem butterChicken = saveDish(mainCourse, "Butter Chicken", "butter-chicken",
                    "Tender chicken pieces cooked in a rich and velvety tomato sauce with aromatic spices, churned white butter, and fenugreek leaves.",
                    BigDecimal.valueOf(349.00), null, false, true, true,
                    "/images/food/butter-chicken.png",
                    "Chicken, Vine-ripened Tomatoes, Cashews, Butter, Heavy Cream, Kasoori Methi, Cardamom",
                    "Contains Dairy, Nuts (Cashews)", "Mild,Medium", BigDecimal.valueOf(4.9), 1280);

            saveDish(biryani, "Veg Biryani", "veg-biryani",
                    "Fragrant aged Basmati rice layered with garden-fresh vegetables, saffron milk, caramelized shallots, and slow-dum-cooked.",
                    BigDecimal.valueOf(299.00), null, true, true, true,
                    "/images/food/veg-biryani.png",
                    "Aged Basmati Rice, French Beans, Carrots, Green Peas, Saffron, Ghee, Mint, Rose Water",
                    "Contains Dairy (Ghee)", "Mild,Medium,Spicy", BigDecimal.valueOf(4.7), 350);

            saveDish(biryani, "Chicken Biryani", "chicken-biryani",
                    "Royal Nizami style aromatic dum biryani with succulent bone-in chicken steeped in saffron broth and crushed whole spices.",
                    BigDecimal.valueOf(349.00), null, false, true, true,
                    "/images/food/chicken-biryani.png",
                    "Long Grain Basmati Rice, Marinated Chicken, Saffron, Caramelized Onions, Fresh Mint, Coriander, Shahi Zeera",
                    "Contains Dairy (Ghee, Yogurt)", "Medium,Spicy", BigDecimal.valueOf(4.9), 1890);

            saveDish(desserts, "Chocolate Lava Cake", "chocolate-lava-cake",
                    "Warm Belgian dark chocolate cake with a molten truffle center, dusted with gold cocoa and served with vanilla bean whip.",
                    BigDecimal.valueOf(199.00), null, true, true, true,
                    "/images/food/chocolate-lava-cake.png",
                    "Belgian Dark Chocolate (70%), Brown Butter, Pure Cane Sugar, Cocoa Dust, Madagascan Vanilla",
                    "Contains Dairy, Gluten", "Not Applicable", BigDecimal.valueOf(4.8), 510);

            saveDish(beverages, "Mojito", "mojito",
                    "Refreshing crushed fresh garden mint muddled with Persian lime juice, raw cane sugar syrup, and fizzy sparkling mineral soda.",
                    BigDecimal.valueOf(149.00), null, true, true, true,
                    "/images/food/mojito.png",
                    "Fresh Mint Leaves, Persian Lime, Raw Cane Sugar, Sparkling Mineral Soda, Crushed Mountain Ice",
                    "None", "Not Applicable", BigDecimal.valueOf(4.6), 290);

            saveDish(starters, "Chicken Tikka", "chicken-tikka",
                    "Boneless chicken cubes steeped in tandoori spices and mustard glaze, char-roasted over glowing coal embers.",
                    BigDecimal.valueOf(299.00), null, false, true, false,
                    "/images/food/chicken-tikka.png",
                    "Boneless Chicken, Ginger Garlic Paste, Hung Curd, Degi Mirch, Chaat Masala",
                    "Contains Dairy (Curd)", "Medium,Spicy", BigDecimal.valueOf(4.8), 640);

            saveDish(mainCourse, "Paneer Butter Masala", "paneer-butter-masala",
                    "Silken soft malai paneer cubes simmered in a mildly spiced, sweet and creamy tomato-cashew gravy.",
                    BigDecimal.valueOf(279.00), null, true, true, false,
                    "/images/food/paneer-butter-masala.png",
                    "Malai Paneer, Ripe Plum Tomatoes, Cashew Paste, Makkhan, Kasuri Methi, Honey",
                    "Contains Dairy, Nuts", "Mild,Medium", BigDecimal.valueOf(4.7), 810);

            saveDish(mainCourse, "Mutton Rogan Josh", "mutton-rogan-josh",
                    "Kashmiri delicacy of tender braised goat meat infused with cloves, bay leaf, cinnamon, and rattan jot infusion.",
                    BigDecimal.valueOf(399.00), null, false, true, false,
                    "/images/food/mutton-rogan-josh.png",
                    "Prime Goat Cutlets, Kashmiri Fennel, Dry Ginger, Asafoetida, Mustard Oil, Rattan Jot",
                    "None", "Medium,Spicy", BigDecimal.valueOf(4.9), 720);

            MenuItem garlicNaan = saveDish(mainCourse, "Garlic Naan", "garlic-naan",
                    "Traditional leavened clay oven bread brushed generously with crushed charred garlic butter and fresh coriander.",
                    BigDecimal.valueOf(79.00), null, true, true, false,
                    "/images/food/garlic-naan.png",
                    "Refined Flour, Charred Garlic, Salted Butter, Fresh Cilantro, Kalonji Seeds",
                    "Contains Gluten, Dairy", "Mild", BigDecimal.valueOf(4.7), 950);

            logger.info("Seeded 10 signature menu items matching reference design.");
        }

        // Seed Offers
        if (offerRepository.count() == 0) {
            Offer offer1 = new Offer();
            offer1.setTitle("Weekend Special");
            offer1.setDescription("Enjoy 20% OFF on all signature Main Courses every Friday to Sunday evening.");
            offer1.setCode("WEEKEND20");
            offer1.setDiscountType("PERCENTAGE");
            offer1.setDiscountValue(BigDecimal.valueOf(20.00));
            offer1.setMinOrderAmount(BigDecimal.valueOf(499.00));
            offer1.setMaxDiscountAmount(BigDecimal.valueOf(200.00));
            offer1.setComboItems("All Main Courses eligible");
            offer1.setBannerImageUrl("/images/offers/weekend-special.png");
            offer1.setStartDate(LocalDateTime.now().minusDays(2));
            offer1.setExpiryDate(LocalDateTime.now().plusDays(90));
            offer1.setIsActive(true);
            offerRepository.save(offer1);

            Offer offer2 = new Offer();
            offer2.setTitle("Family Combo");
            offer2.setDescription("Complete royal feast for 4 guests: 2 Dum Biryanis, 1 Butter Chicken or Paneer Butter Masala, 4 Butter Naans & 4 Desserts.");
            offer2.setCode("FAMILY999");
            offer2.setDiscountType("FIXED_AMOUNT");
            offer2.setDiscountValue(BigDecimal.valueOf(300.00));
            offer2.setMinOrderAmount(BigDecimal.valueOf(1299.00));
            offer2.setMaxDiscountAmount(BigDecimal.valueOf(300.00));
            offer2.setComboItems("2 Biryani + 1 Curries + 4 Naan + 4 Desserts");
            offer2.setBannerImageUrl("/images/offers/family-combo.png");
            offer2.setStartDate(LocalDateTime.now().minusDays(5));
            offer2.setExpiryDate(LocalDateTime.now().plusDays(120));
            offer2.setIsActive(true);
            offerRepository.save(offer2);

            Offer offer3 = new Offer();
            offer3.setTitle("Lunch Combo");
            offer3.setDescription("Crisp power lunch: 1 Tandoori Starter + 1 Gourmet Curry + 2 Tandoori Rotis + 1 Artisanal Beverage.");
            offer3.setCode("LUNCH499");
            offer3.setDiscountType("FIXED_AMOUNT");
            offer3.setDiscountValue(BigDecimal.valueOf(150.00));
            offer3.setMinOrderAmount(BigDecimal.valueOf(649.00));
            offer3.setMaxDiscountAmount(BigDecimal.valueOf(150.00));
            offer3.setComboItems("1 Starter + 1 Curry + 2 Breads + 1 Beverage");
            offer3.setBannerImageUrl("/images/offers/lunch-combo.png");
            offer3.setStartDate(LocalDateTime.now().minusDays(10));
            offer3.setExpiryDate(LocalDateTime.now().plusDays(180));
            offer3.setIsActive(true);
            offerRepository.save(offer3);

            logger.info("Seeded 3 offers matching reference image.");
        }

        // Seed Sample Orders for customer matching reference UI (#ORD12345, #ORD12344, #ORD12343)
        if (orderRepository.count() == 0 && demoCustomer != null) {
            Order order1 = new Order();
            order1.setOrderNumber("ORD12345");
            order1.setUser(demoCustomer);
            order1.setCustomerName(demoCustomer.getFullName());
            order1.setCustomerPhone(demoCustomer.getPhoneNumber());
            order1.setDeliveryAddress("Flat 402, Royal Palms, MG Road, Indiranagar, Bengaluru, 560038");
            order1.setSubtotal(BigDecimal.valueOf(428.00));
            order1.setDiscountAmount(BigDecimal.ZERO);
            order1.setDeliveryFee(BigDecimal.ZERO);
            order1.setTotalAmount(BigDecimal.valueOf(428.00));
            order1.setPaymentMethod("COD");
            order1.setPaymentStatus("PENDING");
            order1.setOrderStatus("PREPARING");
            order1.setDeliveryNotes("Please ring the doorbell twice");
            order1.setCreatedAt(LocalDateTime.now().minusMinutes(45));

            OrderItem item1 = new OrderItem();
            item1.setOrder(order1);
            item1.setItemName("Butter Chicken");
            item1.setUnitPrice(BigDecimal.valueOf(349.00));
            item1.setQuantity(1);
            item1.setSubtotal(BigDecimal.valueOf(349.00));
            item1.setCustomizationNotes("Medium spice");

            OrderItem item2 = new OrderItem();
            item2.setOrder(order1);
            item2.setItemName("Garlic Naan");
            item2.setUnitPrice(BigDecimal.valueOf(79.00));
            item2.setQuantity(1);
            item2.setSubtotal(BigDecimal.valueOf(79.00));
            item2.setCustomizationNotes("Extra butter");

            order1.setItems(List.of(item1, item2));
            orderRepository.save(order1);

            Order order2 = new Order();
            order2.setOrderNumber("ORD12344");
            order2.setUser(demoCustomer);
            order2.setCustomerName(demoCustomer.getFullName());
            order2.setCustomerPhone(demoCustomer.getPhoneNumber());
            order2.setDeliveryAddress("Flat 402, Royal Palms, MG Road, Indiranagar, Bengaluru, 560038");
            order2.setSubtotal(BigDecimal.valueOf(576.00));
            order2.setDiscountAmount(BigDecimal.ZERO);
            order2.setDeliveryFee(BigDecimal.ZERO);
            order2.setTotalAmount(BigDecimal.valueOf(576.00));
            order2.setPaymentMethod("ONLINE_UPI");
            order2.setPaymentStatus("PAID");
            order2.setOrderStatus("DELIVERED");
            order2.setCreatedAt(LocalDateTime.now().minusDays(1));

            OrderItem o2Item1 = new OrderItem();
            o2Item1.setOrder(order2);
            o2Item1.setItemName("Paneer Tikka");
            o2Item1.setUnitPrice(BigDecimal.valueOf(249.00));
            o2Item1.setQuantity(1);
            o2Item1.setSubtotal(BigDecimal.valueOf(249.00));

            OrderItem o2Item2 = new OrderItem();
            o2Item2.setOrder(order2);
            o2Item2.setItemName("Veg Biryani");
            o2Item2.setUnitPrice(BigDecimal.valueOf(299.00));
            o2Item2.setQuantity(1);
            o2Item2.setSubtotal(BigDecimal.valueOf(299.00));

            order2.setItems(List.of(o2Item1, o2Item2));
            orderRepository.save(order2);

            Order order3 = new Order();
            order3.setOrderNumber("ORD12343");
            order3.setUser(demoCustomer);
            order3.setCustomerName(demoCustomer.getFullName());
            order3.setCustomerPhone(demoCustomer.getPhoneNumber());
            order3.setDeliveryAddress("Flat 402, Royal Palms, MG Road, Indiranagar, Bengaluru, 560038");
            order3.setSubtotal(BigDecimal.valueOf(349.00));
            order3.setDiscountAmount(BigDecimal.ZERO);
            order3.setDeliveryFee(BigDecimal.ZERO);
            order3.setTotalAmount(BigDecimal.valueOf(349.00));
            order3.setPaymentMethod("COD");
            order3.setPaymentStatus("PAID");
            order3.setOrderStatus("DELIVERED");
            order3.setCreatedAt(LocalDateTime.now().minusDays(3));

            OrderItem o3Item1 = new OrderItem();
            o3Item1.setOrder(order3);
            o3Item1.setItemName("Paneer Tikka");
            o3Item1.setUnitPrice(BigDecimal.valueOf(249.00));
            o3Item1.setQuantity(1);
            o3Item1.setSubtotal(BigDecimal.valueOf(249.00));

            OrderItem o3Item2 = new OrderItem();
            o3Item2.setOrder(order3);
            o3Item2.setItemName("Chocolate Lava Cake");
            o3Item2.setUnitPrice(BigDecimal.valueOf(199.00));
            o3Item2.setQuantity(1);
            o3Item2.setSubtotal(BigDecimal.valueOf(199.00));

            order3.setItems(List.of(o3Item1, o3Item2));
            orderRepository.save(order3);

            logger.info("Seeded 3 sample orders matching reference UI.");
        }
    }

    private MenuItem saveDish(Category cat, String name, String slug, String desc, BigDecimal price,
                             BigDecimal discPrice, boolean isVeg, boolean isAvail, boolean isFeat,
                             String img, String ingredients, String allergens, String spice,
                             BigDecimal rating, int reviews) {
        MenuItem m = new MenuItem();
        m.setCategory(cat);
        m.setName(name);
        m.setSlug(slug);
        m.setDescription(desc);
        m.setPrice(price);
        m.setDiscountedPrice(discPrice);
        m.setIsVeg(isVeg);
        m.setIsAvailable(isAvail);
        m.setIsFeatured(isFeat);
        m.setImageUrl(img);
        m.setIngredients(ingredients);
        m.setAllergenInfo(allergens);
        m.setSpiceLevels(spice);
        m.setRating(rating);
        m.setReviewCount(reviews);
        return menuItemRepository.save(m);
    }
}
