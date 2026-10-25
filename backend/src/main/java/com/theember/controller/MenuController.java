package com.theember.controller;

import com.theember.entity.Category;
import com.theember.entity.MenuItem;
import com.theember.service.MenuService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MenuController {

    @Autowired
    private MenuService menuService;

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(menuService.getAllCategories());
    }

    @GetMapping("/menu/featured")
    public ResponseEntity<List<MenuItem>> getFeaturedDishes() {
        return ResponseEntity.ok(menuService.getFeaturedDishes());
    }

    @GetMapping("/menu")
    public ResponseEntity<Page<MenuItem>> getMenu(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean isVeg,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "rating") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<MenuItem> dishes = menuService.filterDishes(categoryId, isVeg, search, sortBy, sortDir, page, size, true);
        return ResponseEntity.ok(dishes);
    }

    @GetMapping("/menu/{id}")
    public ResponseEntity<MenuItem> getDishById(@PathVariable Long id) {
        return ResponseEntity.ok(menuService.getDishById(id));
    }

    @GetMapping("/menu/slug/{slug}")
    public ResponseEntity<MenuItem> getDishBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(menuService.getDishBySlug(slug));
    }
}
