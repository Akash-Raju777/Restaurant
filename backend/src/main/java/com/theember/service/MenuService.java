package com.theember.service;

import com.theember.dto.MenuItemRequest;
import com.theember.entity.Category;
import com.theember.entity.MenuItem;
import com.theember.repository.CategoryRepository;
import com.theember.repository.MenuItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class MenuService {

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
    }

    public List<MenuItem> getFeaturedDishes() {
        return menuItemRepository.findByIsFeaturedTrueAndIsAvailableTrue();
    }

    public Page<MenuItem> getDishesForAdmin(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));

        Specification<MenuItem> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return menuItemRepository.findAll(spec, pageable);
    }

    public Page<MenuItem> filterDishes(Long categoryId, Boolean isVeg, String search, String sortField, String sortDir, int page, int size, boolean onlyAvailable) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir.equalsIgnoreCase("desc") ? "DESC" : "ASC"),
                sortField.equalsIgnoreCase("price") ? "price" : "rating");
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<MenuItem> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (onlyAvailable) {
                predicates.add(cb.isTrue(root.get("isAvailable")));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            if (isVeg != null) {
                predicates.add(cb.equal(root.get("isVeg"), isVeg));
            }

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(nameMatch, descMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return menuItemRepository.findAll(spec, pageable);
    }

    public MenuItem getDishById(Long id) {
        return menuItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found with ID: " + id));
    }

    public MenuItem getDishBySlug(String slug) {
        return menuItemRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found with slug: " + slug));
    }

    @Transactional
    public MenuItem createDish(MenuItemRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid category ID"));

        String slug = request.getSlug();
        if (slug == null || slug.isBlank()) {
            slug = request.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        }

        MenuItem dish = new MenuItem();
        dish.setCategory(category);
        dish.setName(request.getName());
        dish.setSlug(slug);
        dish.setDescription(request.getDescription());
        dish.setPrice(request.getPrice());
        dish.setDiscountedPrice(request.getDiscountedPrice());
        dish.setIsVeg(request.getIsVeg() != null ? request.getIsVeg() : true);
        dish.setIsAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true);
        dish.setIsFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false);
        dish.setImageUrl(request.getImageUrl() != null ? request.getImageUrl() : "/images/food/placeholder.png");
        dish.setIngredients(request.getIngredients());
        dish.setAllergenInfo(request.getAllergenInfo());
        dish.setSpiceLevels(request.getSpiceLevels());

        return menuItemRepository.save(dish);
    }

    @Transactional
    public MenuItem updateDish(Long id, MenuItemRequest request) {
        MenuItem dish = getDishById(id);
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid category ID"));
            dish.setCategory(category);
        }

        if (request.getName() != null) dish.setName(request.getName());
        if (request.getDescription() != null) dish.setDescription(request.getDescription());
        if (request.getPrice() != null) dish.setPrice(request.getPrice());
        if (request.getDiscountedPrice() != null) dish.setDiscountedPrice(request.getDiscountedPrice());
        if (request.getIsVeg() != null) dish.setIsVeg(request.getIsVeg());
        if (request.getIsAvailable() != null) dish.setIsAvailable(request.getIsAvailable());
        if (request.getIsFeatured() != null) dish.setIsFeatured(request.getIsFeatured());
        if (request.getImageUrl() != null) dish.setImageUrl(request.getImageUrl());
        if (request.getIngredients() != null) dish.setIngredients(request.getIngredients());
        if (request.getAllergenInfo() != null) dish.setAllergenInfo(request.getAllergenInfo());
        if (request.getSpiceLevels() != null) dish.setSpiceLevels(request.getSpiceLevels());
        dish.setUpdatedAt(LocalDateTime.now());

        return menuItemRepository.save(dish);
    }

    @Transactional
    public void deleteDish(Long id) {
        MenuItem dish = getDishById(id);
        menuItemRepository.delete(dish);
    }

    @Transactional
    public MenuItem toggleAvailability(Long id, boolean available) {
        MenuItem dish = getDishById(id);
        dish.setIsAvailable(available);
        dish.setUpdatedAt(LocalDateTime.now());
        return menuItemRepository.save(dish);
    }
}
